-- Apply once after 001–009, before deploying Leads. No prospects are seeded.
BEGIN;
CREATE TABLE leads (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 created_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 company varchar(160) NOT NULL CHECK(length(trim(company))>0),
 name varchar(120) NOT NULL DEFAULT '', email varchar(254) NOT NULL DEFAULT '',
 phone varchar(40) NOT NULL DEFAULT '', website varchar(2048) NOT NULL DEFAULT '',
 location varchar(240) NOT NULL DEFAULT '', category varchar(120) NOT NULL DEFAULT '', source varchar(240) NOT NULL DEFAULT '',
 status text NOT NULL DEFAULT 'saved' CHECK(status IN('saved','researching','ready-to-contact','contacted','follow-up','interested','not-interested','converted')),
 priority text NOT NULL DEFAULT 'medium' CHECK(priority IN('low','medium','high')),
 admin_notes varchar(10000) NOT NULL DEFAULT '', last_contact_at timestamptz(3),
 next_follow_up_at timestamptz(3), follow_up_note varchar(2000) NOT NULL DEFAULT '',
 converted_inquiry_id uuid UNIQUE REFERENCES inquiries(id) ON DELETE SET NULL,
 converted_at timestamptz(3),
 CHECK((status='converted')=(converted_at IS NOT NULL)),
 CHECK(converted_inquiry_id IS NULL OR converted_at IS NOT NULL)
);
CREATE INDEX leads_created_idx ON leads(created_at DESC,id DESC);
CREATE INDEX leads_status_priority_idx ON leads(status,priority,created_at DESC);
CREATE INDEX leads_follow_up_idx ON leads(next_follow_up_at) WHERE next_follow_up_at IS NOT NULL;
-- Admin conversion records no wizard consent. Public submissions retain their existing default.
ALTER TABLE inquiries ALTER COLUMN consent_at DROP NOT NULL;
ALTER TABLE proposals ALTER COLUMN inquiry_id DROP NOT NULL;
ALTER TABLE proposals ADD COLUMN lead_id uuid REFERENCES leads(id) ON DELETE RESTRICT;
ALTER TABLE proposals ADD CONSTRAINT proposals_owner_check CHECK((inquiry_id IS NULL)<>(lead_id IS NULL));
CREATE INDEX proposals_lead_idx ON proposals(lead_id) WHERE lead_id IS NOT NULL;
ALTER TABLE inquiry_messages ALTER COLUMN inquiry_id DROP NOT NULL;
ALTER TABLE inquiry_messages ADD COLUMN lead_id uuid REFERENCES leads(id) ON DELETE RESTRICT;
ALTER TABLE inquiry_messages ADD CONSTRAINT inquiry_messages_owner_check CHECK((inquiry_id IS NULL)<>(lead_id IS NULL));
CREATE INDEX inquiry_messages_lead_idx ON inquiry_messages(lead_id) WHERE lead_id IS NOT NULL;
ALTER TABLE booking_links ALTER COLUMN inquiry_id DROP NOT NULL;
ALTER TABLE booking_links ADD COLUMN lead_id uuid REFERENCES leads(id) ON DELETE RESTRICT;
ALTER TABLE booking_links ADD CONSTRAINT booking_links_owner_check CHECK((inquiry_id IS NULL)<>(lead_id IS NULL));
CREATE INDEX booking_links_lead_idx ON booking_links(lead_id) WHERE lead_id IS NOT NULL;
ALTER TABLE bookings ALTER COLUMN inquiry_id DROP NOT NULL;
ALTER TABLE bookings ADD COLUMN lead_id uuid REFERENCES leads(id) ON DELETE RESTRICT;
ALTER TABLE bookings ADD CONSTRAINT bookings_owner_check CHECK((inquiry_id IS NULL)<>(lead_id IS NULL));
CREATE INDEX bookings_lead_idx ON bookings(lead_id) WHERE lead_id IS NOT NULL;
ALTER TABLE invoices ALTER COLUMN inquiry_id DROP NOT NULL;
ALTER TABLE invoices ADD COLUMN lead_id uuid REFERENCES leads(id) ON DELETE RESTRICT;
ALTER TABLE invoices ADD CONSTRAINT invoices_owner_check CHECK((inquiry_id IS NULL)<>(lead_id IS NULL));
CREATE INDEX invoices_lead_idx ON invoices(lead_id) WHERE lead_id IS NOT NULL;
ALTER TABLE inquiry_activity ALTER COLUMN inquiry_id DROP NOT NULL;
ALTER TABLE inquiry_activity ADD COLUMN lead_id uuid REFERENCES leads(id) ON DELETE RESTRICT;
ALTER TABLE inquiry_activity ADD CONSTRAINT inquiry_activity_owner_check CHECK((inquiry_id IS NULL)<>(lead_id IS NULL));
CREATE INDEX inquiry_activity_lead_idx ON inquiry_activity(lead_id) WHERE lead_id IS NOT NULL;
ALTER TABLE proposals ADD CONSTRAINT proposals_lead_unique UNIQUE(lead_id);
ALTER TABLE booking_links ADD CONSTRAINT booking_links_lead_unique UNIQUE(lead_id);
CREATE UNIQUE INDEX bookings_one_scheduled_lead_idx ON bookings(lead_id) WHERE status='scheduled';
ALTER TABLE proposals ADD CONSTRAINT proposals_lead_id_relationship_unique UNIQUE(id,lead_id);
ALTER TABLE invoices ADD CONSTRAINT invoices_inquiry_id_relationship_unique UNIQUE(id,inquiry_id);
ALTER TABLE invoices ADD CONSTRAINT invoices_lead_id_relationship_unique UNIQUE(id,lead_id);
ALTER TABLE booking_links ADD CONSTRAINT booking_links_inquiry_id_relationship_unique UNIQUE(id,inquiry_id);
ALTER TABLE booking_links ADD CONSTRAINT booking_links_lead_id_relationship_unique UNIQUE(id,lead_id);
ALTER TABLE bookings ADD CONSTRAINT bookings_inquiry_id_relationship_unique UNIQUE(id,inquiry_id);
ALTER TABLE bookings ADD CONSTRAINT bookings_lead_id_relationship_unique UNIQUE(id,lead_id);
ALTER TABLE inquiry_messages ADD CONSTRAINT inquiry_messages_inquiry_id_relationship_unique UNIQUE(id,inquiry_id);
ALTER TABLE inquiry_messages ADD CONSTRAINT inquiry_messages_lead_id_relationship_unique UNIQUE(id,lead_id);
ALTER TABLE invoices ADD CONSTRAINT invoices_proposal_id_lead_id_fk FOREIGN KEY(proposal_id,lead_id) REFERENCES proposals(id,lead_id) ON DELETE RESTRICT;
ALTER TABLE bookings ADD CONSTRAINT bookings_link_id_lead_id_fk FOREIGN KEY(link_id,lead_id) REFERENCES booking_links(id,lead_id) ON DELETE RESTRICT;
ALTER TABLE inquiry_messages ADD CONSTRAINT inquiry_messages_proposal_id_lead_id_fk FOREIGN KEY(proposal_id,lead_id) REFERENCES proposals(id,lead_id) ON DELETE RESTRICT;
ALTER TABLE inquiry_messages ADD CONSTRAINT inquiry_messages_invoice_id_lead_id_fk FOREIGN KEY(invoice_id,lead_id) REFERENCES invoices(id,lead_id) ON DELETE RESTRICT;
ALTER TABLE inquiry_activity ADD CONSTRAINT inquiry_activity_message_id_lead_id_fk FOREIGN KEY(message_id,lead_id) REFERENCES inquiry_messages(id,lead_id) ON DELETE RESTRICT;
ALTER TABLE inquiry_activity ADD CONSTRAINT inquiry_activity_booking_id_lead_id_fk FOREIGN KEY(booking_id,lead_id) REFERENCES bookings(id,lead_id) ON DELETE RESTRICT;
ALTER TABLE inquiry_activity ADD CONSTRAINT inquiry_activity_invoice_id_lead_id_fk FOREIGN KEY(invoice_id,lead_id) REFERENCES invoices(id,lead_id) ON DELETE RESTRICT;
-- Preserve historical inquiry-to-inquiry reference rules, while disallowing
-- any cross-boundary reference to a lead-owned record from an inquiry.
CREATE FUNCTION check_lead_reference() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE parent_lead uuid; parent_id uuid;
BEGIN
 parent_id := (to_jsonb(NEW)->>TG_ARGV[0])::uuid;
 IF parent_id IS NOT NULL THEN
  EXECUTE format('SELECT lead_id FROM %I WHERE id=$1',TG_ARGV[1]) INTO parent_lead USING parent_id;
  IF NEW.lead_id IS DISTINCT FROM parent_lead THEN
   RAISE EXCEPTION USING ERRCODE='23503',MESSAGE='CRM record ownership mismatch';
  END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER invoices_proposal_id_lead_guard BEFORE INSERT OR UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION check_lead_reference('proposal_id','proposals');
CREATE TRIGGER bookings_link_id_lead_guard BEFORE INSERT OR UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION check_lead_reference('link_id','booking_links');
CREATE TRIGGER inquiry_messages_proposal_id_lead_guard BEFORE INSERT OR UPDATE ON inquiry_messages FOR EACH ROW EXECUTE FUNCTION check_lead_reference('proposal_id','proposals');
CREATE TRIGGER inquiry_messages_invoice_id_lead_guard BEFORE INSERT OR UPDATE ON inquiry_messages FOR EACH ROW EXECUTE FUNCTION check_lead_reference('invoice_id','invoices');
CREATE TRIGGER inquiry_activity_message_id_lead_guard BEFORE INSERT OR UPDATE ON inquiry_activity FOR EACH ROW EXECUTE FUNCTION check_lead_reference('message_id','inquiry_messages');
CREATE TRIGGER inquiry_activity_booking_id_lead_guard BEFORE INSERT OR UPDATE ON inquiry_activity FOR EACH ROW EXECUTE FUNCTION check_lead_reference('booking_id','bookings');
CREATE TRIGGER inquiry_activity_invoice_id_lead_guard BEFORE INSERT OR UPDATE ON inquiry_activity FOR EACH ROW EXECUTE FUNCTION check_lead_reference('invoice_id','invoices');
ALTER TABLE inquiry_activity DROP CONSTRAINT inquiry_activity_activity_type_check;
ALTER TABLE inquiry_activity ADD CONSTRAINT inquiry_activity_activity_type_check CHECK(activity_type IN(
 'inquiry_created','status_changed','admin_note_updated','follow_up_scheduled','follow_up_updated','follow_up_cleared',
 'proposal_created','proposal_updated','proposal_sent','proposal_accepted','proposal_declined','email_sent','email_failed',
 'booking_link_created','booking_link_regenerated','booking_scheduled','booking_cancelled','booking_completed','booking_rescheduled',
 'invoice_created','invoice_updated','invoice_sent','invoice_viewed','invoice_paid','invoice_voided',
 'lead_created','lead_updated','lead_converted'));
ALTER TABLE inquiry_activity ADD CONSTRAINT inquiry_activity_lead_event_check CHECK(
 (activity_type NOT LIKE 'lead_%' OR lead_id IS NOT NULL) AND (activity_type<>'inquiry_created' OR inquiry_id IS NOT NULL));
CREATE UNIQUE INDEX inquiry_activity_lead_created_idx ON inquiry_activity(lead_id) WHERE activity_type='lead_created';
CREATE UNIQUE INDEX inquiry_activity_lead_converted_idx ON inquiry_activity(lead_id) WHERE activity_type='lead_converted';
CREATE OR REPLACE FUNCTION reserve_booking(p_hash text,p_start timestamptz,p_end timestamptz,p_timezone text,p_name text,p_email text,p_phone text,p_notes text,p_type text,p_key uuid,p_fingerprint text,p_version timestamptz)
RETURNS SETOF bookings LANGUAGE plpgsql VOLATILE AS $$
DECLARE config booking_settings;link booking_links;existing bookings;saved bookings;
BEGIN
 SELECT * INTO config FROM booking_settings WHERE id=true FOR UPDATE;
 IF config.updated_at<>p_version OR config.timezone<>p_timezone OR p_start<clock_timestamp()+make_interval(hours=>config.minimum_notice_hours)
    OR (p_start AT TIME ZONE config.timezone)::date>(clock_timestamp() AT TIME ZONE config.timezone)::date+config.horizon_days
    OR p_end<>p_start+make_interval(mins=>config.slot_duration_minutes) THEN RAISE EXCEPTION USING ERRCODE='P0001',MESSAGE='Booking configuration changed'; END IF;
 SELECT * INTO link FROM booking_links WHERE token_hash=p_hash FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION USING ERRCODE='P0002',MESSAGE='Booking link unavailable'; END IF;
 SELECT * INTO existing FROM bookings WHERE request_key=p_key;
 IF FOUND THEN
  IF (existing.inquiry_id IS DISTINCT FROM link.inquiry_id OR existing.lead_id IS DISTINCT FROM link.lead_id) OR existing.payload_fingerprint<>p_fingerprint THEN RAISE EXCEPTION USING ERRCODE='P0001',MESSAGE='Booking request changed'; END IF;
  RETURN NEXT existing;RETURN;
 END IF;
 IF EXISTS(SELECT 1 FROM bookings WHERE status IN('scheduled','completed') AND start_at<p_end+make_interval(mins=>config.buffer_minutes)
    AND GREATEST(busy_until,end_at+make_interval(mins=>config.buffer_minutes))>p_start) THEN RAISE EXCEPTION USING ERRCODE='23P01',MESSAGE='Slot just taken'; END IF;
 INSERT INTO bookings(inquiry_id,lead_id,link_id,booking_token_hash,start_at,end_at,busy_until,buffer_minutes,timezone,client_name,client_email,client_phone,client_notes,meeting_type,request_key,payload_fingerprint)
 VALUES(link.inquiry_id,link.lead_id,link.id,p_hash,p_start,p_end,p_end+make_interval(mins=>config.buffer_minutes),config.buffer_minutes,p_timezone,p_name,p_email,NULLIF(p_phone,''),p_notes,p_type,p_key,p_fingerprint) RETURNING * INTO saved;
 INSERT INTO inquiry_activity(inquiry_id,lead_id,activity_type,actor,booking_id,note) VALUES(saved.inquiry_id,saved.lead_id,'booking_scheduled','client',saved.id,'Call scheduled');
 RETURN NEXT saved;
END $$;
CREATE OR REPLACE FUNCTION change_booking(p_id uuid,p_action text,p_version timestamptz,p_expected_start timestamptz,p_start timestamptz,p_end timestamptz,p_settings_version timestamptz,p_actor text,p_hash text)
RETURNS SETOF bookings LANGUAGE plpgsql VOLATILE AS $$
DECLARE config booking_settings;old bookings;saved bookings;
BEGIN
 SELECT * INTO config FROM booking_settings WHERE id=true FOR UPDATE;
 IF p_hash IS NOT NULL THEN PERFORM 1 FROM booking_links WHERE token_hash=p_hash FOR UPDATE;IF NOT FOUND THEN RAISE EXCEPTION USING ERRCODE='P0002',MESSAGE='Booking link unavailable';END IF;END IF;
 SELECT * INTO old FROM bookings WHERE id=p_id FOR UPDATE;
 IF NOT FOUND OR old.status<>'scheduled' OR (p_version IS NOT NULL AND old.updated_at<>p_version) OR (p_expected_start IS NOT NULL AND old.start_at<>p_expected_start)
  OR (p_hash IS NOT NULL AND old.link_id NOT IN(SELECT id FROM booking_links WHERE token_hash=p_hash)) THEN RAISE EXCEPTION USING ERRCODE='P0001',MESSAGE='Booking changed'; END IF;
 IF p_actor='client' AND old.start_at<=clock_timestamp() THEN RAISE EXCEPTION USING ERRCODE='P0001',MESSAGE='Call already started';END IF;
 IF p_action='complete' AND (p_actor<>'admin' OR old.end_at>clock_timestamp()) THEN RAISE EXCEPTION USING ERRCODE='P0001',MESSAGE='Complete after the call ends'; END IF;
 IF p_action='reschedule' THEN
  IF config.updated_at<>p_settings_version OR p_start<clock_timestamp()+make_interval(hours=>config.minimum_notice_hours) OR p_end<>p_start+make_interval(mins=>config.slot_duration_minutes)
   OR (p_start AT TIME ZONE config.timezone)::date>(clock_timestamp() AT TIME ZONE config.timezone)::date+config.horizon_days THEN RAISE EXCEPTION USING ERRCODE='P0001',MESSAGE='Availability changed';END IF;
  IF p_start=old.start_at AND p_end=old.end_at AND config.timezone=old.timezone AND config.buffer_minutes=old.buffer_minutes THEN RETURN NEXT old;RETURN;END IF;
  IF EXISTS(SELECT 1 FROM bookings WHERE id<>old.id AND status IN('scheduled','completed') AND start_at<p_end+make_interval(mins=>config.buffer_minutes)
   AND GREATEST(busy_until,end_at+make_interval(mins=>config.buffer_minutes))>p_start) THEN RAISE EXCEPTION USING ERRCODE='23P01',MESSAGE='Slot just taken';END IF;
 END IF;
 IF p_action NOT IN('cancel','complete','reschedule') OR p_actor NOT IN('admin','client') THEN RAISE EXCEPTION USING ERRCODE='P0001',MESSAGE='Invalid action';END IF;
 UPDATE bookings SET status=CASE WHEN p_action='cancel' THEN 'cancelled' WHEN p_action='complete' THEN 'completed' ELSE 'scheduled' END,
  cancelled_at=CASE WHEN p_action='cancel' THEN clock_timestamp() ELSE NULL END,completed_at=CASE WHEN p_action='complete' THEN clock_timestamp() ELSE NULL END,
  start_at=CASE WHEN p_action='reschedule' THEN p_start ELSE old.start_at END,end_at=CASE WHEN p_action='reschedule' THEN p_end ELSE old.end_at END,
  busy_until=CASE WHEN p_action='reschedule' THEN p_end+make_interval(mins=>config.buffer_minutes) ELSE old.busy_until END,
  buffer_minutes=CASE WHEN p_action='reschedule' THEN config.buffer_minutes ELSE old.buffer_minutes END,timezone=CASE WHEN p_action='reschedule' THEN config.timezone ELSE old.timezone END,
  updated_at=GREATEST(date_trunc('milliseconds',clock_timestamp()),old.updated_at+interval '1 millisecond') WHERE id=p_id RETURNING * INTO saved;
 INSERT INTO inquiry_activity(inquiry_id,lead_id,activity_type,actor,booking_id,note) VALUES(saved.inquiry_id,saved.lead_id,CASE p_action WHEN 'cancel' THEN 'booking_cancelled' WHEN 'complete' THEN 'booking_completed' ELSE 'booking_rescheduled' END,p_actor,saved.id,'Call '||CASE p_action WHEN 'cancel' THEN 'cancelled' WHEN 'complete' THEN 'completed' ELSE 'rescheduled' END);
 RETURN NEXT saved;
END $$;
-- One call is a transaction under Neon HTTP. RESTRICT FKs roll back unexpected dependencies.
CREATE FUNCTION delete_lead(p_id uuid,p_version timestamptz) RETURNS boolean LANGUAGE plpgsql AS $$
DECLARE target leads;
BEGIN
 SELECT * INTO target FROM leads WHERE id=p_id FOR UPDATE;
 IF NOT FOUND THEN RETURN false; END IF;
 IF target.updated_at<>p_version THEN RAISE EXCEPTION USING ERRCODE='P0001',MESSAGE='Lead changed'; END IF;
 PERFORM 1 FROM inquiry_messages WHERE lead_id=p_id FOR UPDATE;
 IF EXISTS(SELECT 1 FROM inquiry_messages WHERE lead_id=p_id AND status='sending') THEN
  RAISE EXCEPTION USING ERRCODE='P0001',MESSAGE='Email still sending'; END IF;
 PERFORM 1 FROM bookings WHERE lead_id=p_id FOR UPDATE;
 IF EXISTS(SELECT 1 FROM bookings WHERE lead_id=p_id AND (status='scheduled'
    OR sync_lease_until>clock_timestamp()
    OR (status='cancelled' AND (calendar_sync_status NOT IN('synced','not_required') OR zoom_sync_status NOT IN('synced','not_required'))))) THEN
  RAISE EXCEPTION USING ERRCODE='P0001',MESSAGE='Meeting cancellation must finish'; END IF;
 DELETE FROM inquiry_activity WHERE lead_id=p_id;
 DELETE FROM inquiry_messages WHERE lead_id=p_id;
 DELETE FROM bookings WHERE lead_id=p_id;
 DELETE FROM booking_links WHERE lead_id=p_id;
 DELETE FROM invoices WHERE lead_id=p_id;
 DELETE FROM proposals WHERE lead_id=p_id;
 DELETE FROM leads WHERE id=p_id;
 RETURN true;
END $$;
COMMIT;
