-- Apply manually once before Phase 7 deployment, after unchanged migrations 001–008.
-- No invoices, messages or history are seeded. No provider calls or payments.
BEGIN;
CREATE SEQUENCE invoice_number_sequence;
CREATE FUNCTION next_invoice_number() RETURNS text LANGUAGE sql VOLATILE AS $$
 WITH counter AS (SELECT nextval('invoice_number_sequence') AS n)
 SELECT 'VS-INV-' || to_char(clock_timestamp() AT TIME ZONE 'UTC','YYYY') || '-' ||
  lpad(n::text,GREATEST(4,length(n::text)),'0') FROM counter;
$$;
ALTER TABLE proposals ADD CONSTRAINT proposals_invoice_relationship_unique UNIQUE(id,inquiry_id);
CREATE TABLE invoices (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 inquiry_id uuid NOT NULL REFERENCES inquiries(id) ON DELETE RESTRICT,
 proposal_id uuid NOT NULL UNIQUE,
 FOREIGN KEY(proposal_id,inquiry_id) REFERENCES proposals(id,inquiry_id) ON DELETE RESTRICT,
 created_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 invoice_number varchar(40) NOT NULL UNIQUE DEFAULT next_invoice_number(),
 status text NOT NULL DEFAULT 'draft' CHECK(status IN('draft','sent','paid','void')),
 title varchar(160) NOT NULL,
 business_timezone varchar(80) NOT NULL,
 issue_date date NOT NULL,due_date date,
 client_name varchar(120) NOT NULL,client_company varchar(160) NOT NULL DEFAULT '',client_email varchar(254) NOT NULL,
 billing_address_line1 varchar(200),billing_address_line2 varchar(200),billing_city varchar(120),
 billing_region varchar(120),billing_postal_code varchar(40),billing_country varchar(100),
 sender_name varchar(160) NOT NULL,sender_email varchar(254) NOT NULL,sender_phone varchar(30) NOT NULL,sender_website varchar(2048) NOT NULL,
 subtotal_cents integer NOT NULL CHECK(subtotal_cents BETWEEN 0 AND 1000000000),
 discount_cents integer NOT NULL CHECK(discount_cents BETWEEN 0 AND subtotal_cents),
 tax_rate_basis_points integer NOT NULL CHECK(tax_rate_basis_points BETWEEN 0 AND 10000),
 tax_cents integer NOT NULL CHECK(tax_cents>=0),
 total_cents integer NOT NULL CHECK(total_cents=subtotal_cents-discount_cents+tax_cents AND total_cents<=2000000000),
 CHECK(tax_cents=floor((subtotal_cents-discount_cents)::numeric*tax_rate_basis_points/10000+0.5)),
 currency text NOT NULL DEFAULT 'USD' CHECK(currency='USD'),
 notes varchar(4000) NOT NULL DEFAULT '',terms varchar(4000) NOT NULL DEFAULT '',
 public_token_hash varchar(64) UNIQUE CHECK(public_token_hash ~ '^[a-f0-9]{64}$'),
 public_token_created_at timestamptz(3),
 sent_at timestamptz(3),first_viewed_at timestamptz(3),last_viewed_at timestamptz(3),paid_at timestamptz(3),voided_at timestamptz(3),
 payment_provider varchar(80),payment_reference varchar(300),
 CHECK(due_date IS NULL OR due_date>=issue_date),
 CHECK((status='draft' AND public_token_hash IS NULL AND public_token_created_at IS NULL AND sent_at IS NULL)
  OR (status<>'draft' AND public_token_hash IS NOT NULL AND public_token_created_at IS NOT NULL AND sent_at IS NOT NULL AND due_date IS NOT NULL)),
 CHECK((status='paid')=(paid_at IS NOT NULL)),CHECK((status='void')=(voided_at IS NOT NULL)),
 CHECK((first_viewed_at IS NULL AND last_viewed_at IS NULL) OR (sent_at IS NOT NULL AND first_viewed_at IS NOT NULL AND last_viewed_at>=first_viewed_at))
);
CREATE TABLE invoice_items (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
 position integer NOT NULL CHECK(position BETWEEN 0 AND 24),description varchar(500) NOT NULL DEFAULT '',
 quantity integer NOT NULL CHECK(quantity BETWEEN 1 AND 10000),
 unit_price_cents integer NOT NULL CHECK(unit_price_cents BETWEEN 0 AND 100000000),
 line_total_cents integer GENERATED ALWAYS AS(quantity*unit_price_cents) STORED CHECK(line_total_cents<=1000000000),
 UNIQUE(invoice_id,position)
);
CREATE INDEX invoices_inquiry_created_idx ON invoices(inquiry_id,created_at DESC,id);
ALTER TABLE inquiry_activity ADD COLUMN invoice_id uuid REFERENCES invoices(id) ON DELETE RESTRICT;
ALTER TABLE inquiry_activity ADD COLUMN invoice_number varchar(40);
ALTER TABLE inquiry_activity DROP CONSTRAINT inquiry_activity_activity_type_check;
ALTER TABLE inquiry_activity ADD CONSTRAINT inquiry_activity_activity_type_check CHECK(activity_type IN(
 'inquiry_created','status_changed','admin_note_updated','follow_up_scheduled','follow_up_updated','follow_up_cleared',
 'proposal_created','proposal_updated','proposal_sent','proposal_accepted','proposal_declined','email_sent','email_failed',
 'booking_link_created','booking_link_regenerated','booking_scheduled','booking_cancelled','booking_completed','booking_rescheduled',
 'invoice_created','invoice_updated','invoice_sent','invoice_viewed','invoice_paid','invoice_voided'));
ALTER TABLE inquiry_activity DROP CONSTRAINT inquiry_activity_actor_type_check;
ALTER TABLE inquiry_activity ADD CONSTRAINT inquiry_activity_actor_type_check CHECK(
 (activity_type='inquiry_created' AND actor='system') OR
 (activity_type IN('proposal_accepted','proposal_declined','invoice_viewed') AND actor='client') OR
 (activity_type IN('booking_scheduled','booking_cancelled','booking_rescheduled') AND actor IN('admin','client')) OR
 (activity_type NOT IN('inquiry_created','proposal_accepted','proposal_declined','invoice_viewed','booking_scheduled','booking_cancelled','booking_rescheduled') AND actor='admin'));
ALTER TABLE inquiry_activity ADD CONSTRAINT inquiry_activity_invoice_check CHECK(
 (activity_type LIKE 'invoice_%' AND invoice_id IS NOT NULL AND invoice_number IS NOT NULL) OR
 (activity_type NOT LIKE 'invoice_%' AND invoice_id IS NULL AND invoice_number IS NULL));
CREATE UNIQUE INDEX inquiry_activity_invoice_viewed_idx ON inquiry_activity(invoice_id) WHERE(activity_type='invoice_viewed');
-- Frozen email snapshots reconstruct the hash-validated invoice token only at runtime.
ALTER TABLE inquiry_messages ADD COLUMN invoice_id uuid REFERENCES invoices(id) ON DELETE RESTRICT;
ALTER TABLE inquiry_messages ADD COLUMN invoice_token_hash varchar(64);
ALTER TABLE inquiry_messages ADD COLUMN invoice_token_created_at timestamptz(3);
ALTER TABLE inquiry_messages ADD CONSTRAINT inquiry_messages_invoice_snapshot_check CHECK(
 (invoice_id IS NULL AND invoice_token_hash IS NULL AND invoice_token_created_at IS NULL) OR
 (invoice_id IS NOT NULL AND invoice_token_hash ~ '^[a-f0-9]{64}$' AND invoice_token_hash IS NOT NULL AND invoice_token_created_at IS NOT NULL));
COMMIT;
