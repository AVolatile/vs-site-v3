-- Apply once to the intended Neon branch BEFORE Phase 5 deployment; 001–004 must exist.
-- No messages/history are seeded. No outbound mail is triggered by this migration.
BEGIN;
CREATE TABLE inquiry_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id uuid NOT NULL REFERENCES inquiries(id) ON DELETE RESTRICT,
  created_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  direction text NOT NULL DEFAULT 'outbound' CHECK (direction IN ('outbound','inbound')),
  status text NOT NULL DEFAULT 'sending' CHECK (status IN ('draft','sending','sent','failed')),
  from_email varchar(320) NOT NULL,
  reply_to_email varchar(254) NOT NULL,
  to_email varchar(254) NOT NULL,
  subject varchar(200) NOT NULL,
  message_text varchar(20000) NOT NULL,
  body_text text NOT NULL CHECK (length(body_text) <= 25000),
  body_html text NOT NULL CHECK (length(body_html) <= 200000),
  provider text NOT NULL DEFAULT 'resend' CHECK (provider='resend'),
  provider_message_id varchar(200),
  template_key text NOT NULL CHECK (template_key IN ('personal','thanks','discovery','proposal','follow-up')),
  proposal_id uuid REFERENCES proposals(id) ON DELETE RESTRICT,
  request_key uuid NOT NULL UNIQUE,
  payload_fingerprint varchar(64) NOT NULL,
  attempt_count integer NOT NULL DEFAULT 1 CHECK (attempt_count > 0),
  first_attempt_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_attempt_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  sent_at timestamptz(3),
  error_code text CHECK (error_code IN ('provider_rejected','delivery_unconfirmed')),
  CHECK ((status='sent') = (provider_message_id IS NOT NULL AND sent_at IS NOT NULL)),
  CHECK (status<>'failed' OR error_code IS NOT NULL)
);
CREATE INDEX inquiry_messages_inquiry_date_idx ON inquiry_messages (inquiry_id,created_at DESC,id DESC);
ALTER TABLE inquiry_activity ADD COLUMN message_id uuid REFERENCES inquiry_messages(id) ON DELETE RESTRICT;
ALTER TABLE inquiry_activity DROP CONSTRAINT inquiry_activity_activity_type_check;
ALTER TABLE inquiry_activity ADD CONSTRAINT inquiry_activity_activity_type_check CHECK (activity_type IN (
  'inquiry_created','status_changed','admin_note_updated','follow_up_scheduled','follow_up_updated','follow_up_cleared',
  'proposal_created','proposal_updated','proposal_sent','proposal_accepted','proposal_declined','email_sent','email_failed'));
ALTER TABLE inquiry_activity ADD CONSTRAINT inquiry_activity_message_check CHECK (
  (activity_type IN ('email_sent','email_failed') AND message_id IS NOT NULL)
  OR (activity_type NOT IN ('email_sent','email_failed') AND message_id IS NULL));
-- One recorded failure and one eventual acceptance per message; retries do not spam history.
CREATE UNIQUE INDEX inquiry_activity_message_outcome_idx ON inquiry_activity (message_id,activity_type) WHERE message_id IS NOT NULL;
COMMIT;
