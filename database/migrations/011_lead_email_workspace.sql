-- Apply once after 010, before deploying the email workspace. No provider calls or sends.
BEGIN;
ALTER TABLE leads ADD COLUMN email_suppressed boolean NOT NULL DEFAULT false;
CREATE INDEX leads_email_lookup_idx ON leads(lower(email)) WHERE email<>'';
ALTER TABLE inquiry_messages ALTER COLUMN provider_message_id TYPE varchar(2048);
ALTER TABLE inquiry_messages
 ADD COLUMN format text NOT NULL DEFAULT 'branded' CHECK(format IN('branded','quick')),
 ADD COLUMN thread_id uuid NOT NULL DEFAULT gen_random_uuid(),
 ADD COLUMN reply_message_id uuid REFERENCES inquiry_messages(id) ON DELETE SET NULL,
 ADD COLUMN internet_message_id varchar(998),
 ADD COLUMN in_reply_to varchar(998),
 ADD COLUMN reference_ids text NOT NULL DEFAULT '' CHECK(length(reference_ids)<=10000),
 ADD COLUMN provider_thread_id varchar(2048),
 ADD COLUMN provider_account_id varchar(254),
 ADD COLUMN received_at timestamptz(3),
 ADD COLUMN delivery_state text CHECK(delivery_state IN('sent','delivered','delivery_delayed','bounced','complained','failed','suppressed','queued','scheduled','canceled','opened','clicked'));
ALTER TABLE inquiry_messages DROP CONSTRAINT inquiry_messages_provider_check;
ALTER TABLE inquiry_messages ADD CONSTRAINT inquiry_messages_provider_check CHECK(provider IN('resend','outlook'));
CREATE UNIQUE INDEX inquiry_messages_provider_identity_idx ON inquiry_messages(provider,provider_account_id,provider_message_id) WHERE provider='outlook';
CREATE INDEX inquiry_messages_internet_id_idx ON inquiry_messages(internet_message_id) WHERE internet_message_id IS NOT NULL;
CREATE INDEX inquiry_messages_thread_idx ON inquiry_messages(thread_id,created_at,id);
CREATE FUNCTION check_message_reply() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE parent inquiry_messages;
BEGIN
 IF NEW.reply_message_id IS NOT NULL THEN
  SELECT * INTO parent FROM inquiry_messages WHERE id=NEW.reply_message_id;
  IF NOT FOUND OR parent.lead_id IS DISTINCT FROM NEW.lead_id OR parent.inquiry_id IS DISTINCT FROM NEW.inquiry_id OR parent.thread_id<>NEW.thread_id THEN
   RAISE EXCEPTION USING ERRCODE='23503',MESSAGE='Email reply ownership mismatch';
  END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER inquiry_messages_reply_guard BEFORE INSERT OR UPDATE ON inquiry_messages FOR EACH ROW EXECUTE FUNCTION check_message_reply();
ALTER TABLE inquiry_activity DROP CONSTRAINT inquiry_activity_activity_type_check;
ALTER TABLE inquiry_activity ADD CONSTRAINT inquiry_activity_activity_type_check CHECK(activity_type IN(
 'inquiry_created','status_changed','admin_note_updated','follow_up_scheduled','follow_up_updated','follow_up_cleared',
 'proposal_created','proposal_updated','proposal_sent','proposal_accepted','proposal_declined','email_sent','email_failed','email_received',
 'booking_link_created','booking_link_regenerated','booking_scheduled','booking_cancelled','booking_completed','booking_rescheduled',
 'invoice_created','invoice_updated','invoice_sent','invoice_viewed','invoice_paid','invoice_voided',
 'lead_created','lead_updated','lead_converted'));
ALTER TABLE inquiry_activity DROP CONSTRAINT inquiry_activity_message_check;
ALTER TABLE inquiry_activity ADD CONSTRAINT inquiry_activity_message_check CHECK(
 (activity_type IN('email_sent','email_failed','email_received') AND message_id IS NOT NULL) OR
 (activity_type NOT IN('email_sent','email_failed','email_received') AND message_id IS NULL));
ALTER TABLE inquiry_activity DROP CONSTRAINT inquiry_activity_actor_type_check;
ALTER TABLE inquiry_activity ADD CONSTRAINT inquiry_activity_actor_type_check CHECK(
 (activity_type='inquiry_created' AND actor='system') OR
 (activity_type IN('proposal_accepted','proposal_declined','invoice_viewed','email_received') AND actor='client') OR
 (activity_type IN('booking_scheduled','booking_cancelled','booking_rescheduled') AND actor IN('admin','client')) OR
 (activity_type NOT IN('inquiry_created','proposal_accepted','proposal_declined','invoice_viewed','email_received','booking_scheduled','booking_cancelled','booking_rescheduled') AND actor='admin'));
-- Serialize suppression with message reservation without changing Lead CRUD versions.
CREATE FUNCTION check_email_suppression() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE blocked boolean;
BEGIN
 IF TG_TABLE_NAME='leads' THEN
  IF NEW.email_suppressed IS DISTINCT FROM OLD.email_suppressed AND EXISTS(
   SELECT 1 FROM inquiry_messages WHERE lead_id=NEW.id AND direction='outbound' AND status='sending') THEN
    RAISE EXCEPTION USING ERRCODE='P0001',MESSAGE='Email still sending';
  END IF;
 ELSIF NEW.direction='outbound' AND NEW.status='sending' THEN
  IF NEW.lead_id IS NOT NULL THEN
   SELECT email_suppressed INTO blocked FROM leads WHERE id=NEW.lead_id FOR UPDATE;
   IF blocked THEN RAISE EXCEPTION USING ERRCODE='P0001',MESSAGE='Contact suppressed'; END IF;
  END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER leads_email_permission_guard BEFORE UPDATE OF email_suppressed ON leads FOR EACH ROW EXECUTE FUNCTION check_email_suppression();
CREATE TRIGGER inquiry_messages_email_permission_guard BEFORE INSERT OR UPDATE OF status ON inquiry_messages FOR EACH ROW EXECUTE FUNCTION check_email_suppression();
CREATE TABLE mailbox_sync_state (
 account_id varchar(254) PRIMARY KEY,
 cursor text,
 lease uuid,
 lease_until timestamptz,
 last_synced_at timestamptz(3)
);
COMMIT;
