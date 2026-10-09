-- Apply once to the intended Neon branch. No rows are seeded or removed.
BEGIN;
CREATE TABLE inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  name varchar(120) NOT NULL,
  email varchar(254) NOT NULL,
  company varchar(160) NOT NULL DEFAULT '',
  website varchar(2048) NOT NULL DEFAULT '',
  project_type text NOT NULL CHECK (project_type IN ('website','web-app','branding','advertising','support','other')),
  project_stage text NOT NULL CHECK (project_stage IN ('new','existing','unsure')),
  project_summary varchar(4000) NOT NULL,
  help_needed varchar(2000) NOT NULL DEFAULT '',
  budget_range text NOT NULL CHECK (budget_range IN ('under-1000','1000-2500','2500-5000','5000-10000','10000-plus','unsure')),
  timeline text NOT NULL CHECK (timeline IN ('asap','within-month','1-3-months','3-plus-months','flexible')),
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','reviewing','contacted','qualified','proposal','won','lost','archived')),
  source text NOT NULL DEFAULT 'project-wizard',
  admin_notes varchar(10000) NOT NULL DEFAULT '',
  consent_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  submission_key uuid NOT NULL UNIQUE,
  payload_fingerprint varchar(64) NOT NULL
);
CREATE INDEX inquiries_created_at_idx ON inquiries (created_at DESC, id);
CREATE INDEX inquiries_status_created_at_idx ON inquiries (status, created_at DESC);
COMMIT;
