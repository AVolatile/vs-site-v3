-- Apply once to the intended Neon branch BEFORE Phase 4 deployment; 001–003 must already exist.
-- No proposals or historical events are seeded. Sequence gaps are intentional business-safe behavior.
BEGIN;
CREATE SEQUENCE proposal_number_sequence;
CREATE FUNCTION next_proposal_number() RETURNS text LANGUAGE sql VOLATILE AS $$
  WITH counter AS (SELECT nextval('proposal_number_sequence') AS n)
  SELECT 'VS-' || to_char(clock_timestamp() AT TIME ZONE 'UTC','YYYY') || '-' ||
    lpad(n::text,GREATEST(4,length(n::text)),'0') FROM counter;
$$;
CREATE TABLE proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id uuid NOT NULL UNIQUE REFERENCES inquiries(id) ON DELETE RESTRICT,
  created_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  proposal_number varchar(40) NOT NULL UNIQUE DEFAULT next_proposal_number(),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','accepted','declined','expired')),
  title varchar(160) NOT NULL,
  summary varchar(4000) NOT NULL DEFAULT '',
  subtotal_cents integer NOT NULL DEFAULT 0 CHECK (subtotal_cents BETWEEN 0 AND 1000000000),
  discount_cents integer NOT NULL DEFAULT 0 CHECK (discount_cents BETWEEN 0 AND subtotal_cents),
  tax_rate_basis_points integer NOT NULL DEFAULT 0 CHECK (tax_rate_basis_points BETWEEN 0 AND 10000),
  tax_cents integer NOT NULL DEFAULT 0 CHECK (tax_cents >= 0),
  total_cents integer NOT NULL DEFAULT 0 CHECK (total_cents = subtotal_cents - discount_cents + tax_cents AND total_cents <= 2000000000),
  CHECK (tax_cents = floor((subtotal_cents-discount_cents)::numeric * tax_rate_basis_points / 10000 + 0.5)),
  currency text NOT NULL DEFAULT 'USD' CHECK (currency = 'USD'),
  valid_until date,
  client_token varchar(43) UNIQUE CHECK (client_token ~ '^[A-Za-z0-9_-]{43}$'),
  sent_at timestamptz(3),
  accepted_at timestamptz(3),
  declined_at timestamptz(3),
  internal_notes varchar(4000) NOT NULL DEFAULT '',
  client_notes varchar(4000) NOT NULL DEFAULT '',
  CHECK ((status='draft' AND client_token IS NULL AND sent_at IS NULL) OR (status<>'draft' AND client_token IS NOT NULL AND sent_at IS NOT NULL)),
  CHECK ((status='accepted') = (accepted_at IS NOT NULL)),
  CHECK ((status='declined') = (declined_at IS NOT NULL))
);
CREATE TABLE proposal_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  position integer NOT NULL CHECK (position BETWEEN 0 AND 24),
  description varchar(500) NOT NULL DEFAULT '',
  quantity integer NOT NULL CHECK (quantity BETWEEN 1 AND 10000),
  unit_price_cents integer NOT NULL CHECK (unit_price_cents BETWEEN 0 AND 100000000),
  line_total_cents integer GENERATED ALWAYS AS (quantity * unit_price_cents) STORED CHECK (line_total_cents <= 1000000000),
  UNIQUE (proposal_id,position)
);
-- Proposals restrict inquiry deletion; an explicitly approved proposal deletion removes its items.
-- Archiving an inquiry does not delete or change any proposal.
ALTER TABLE inquiry_activity ADD COLUMN proposal_number varchar(40);
ALTER TABLE inquiry_activity DROP CONSTRAINT inquiry_activity_activity_type_check;
ALTER TABLE inquiry_activity ADD CONSTRAINT inquiry_activity_activity_type_check CHECK (activity_type IN (
  'inquiry_created','status_changed','admin_note_updated','follow_up_scheduled','follow_up_updated','follow_up_cleared',
  'proposal_created','proposal_updated','proposal_sent','proposal_accepted','proposal_declined'));
ALTER TABLE inquiry_activity DROP CONSTRAINT inquiry_activity_actor_check;
ALTER TABLE inquiry_activity DROP CONSTRAINT inquiry_activity_check1;
ALTER TABLE inquiry_activity ADD CONSTRAINT inquiry_activity_actor_check CHECK (actor IN ('system','admin','client'));
ALTER TABLE inquiry_activity ADD CONSTRAINT inquiry_activity_actor_type_check CHECK (
  (activity_type='inquiry_created' AND actor='system')
  OR (activity_type IN ('proposal_accepted','proposal_declined') AND actor='client')
  OR (activity_type NOT IN ('inquiry_created','proposal_accepted','proposal_declined') AND actor='admin'));
ALTER TABLE inquiry_activity ADD CONSTRAINT inquiry_activity_proposal_check CHECK (
  (activity_type LIKE 'proposal_%' AND proposal_number IS NOT NULL)
  OR (activity_type NOT LIKE 'proposal_%' AND proposal_number IS NULL));
COMMIT;
