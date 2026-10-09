-- Apply once to the intended Neon development/staging branch BEFORE deploying Phase 2.
-- No historical events are backfilled. Migration 001 must already be applied.
BEGIN;
CREATE TABLE inquiry_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id uuid NOT NULL REFERENCES inquiries(id) ON DELETE CASCADE,
  created_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  activity_type text NOT NULL CHECK (activity_type IN ('inquiry_created','status_changed','admin_note_updated')),
  from_status text CHECK (from_status IN ('new','reviewing','contacted','qualified','proposal','won','lost','archived')),
  to_status text CHECK (to_status IN ('new','reviewing','contacted','qualified','proposal','won','lost','archived')),
  note varchar(240) NOT NULL DEFAULT '',
  actor text NOT NULL CHECK (actor IN ('system','admin')),
  CHECK (
    (activity_type = 'status_changed' AND from_status IS NOT NULL AND to_status IS NOT NULL AND from_status <> to_status)
    OR (activity_type <> 'status_changed' AND from_status IS NULL AND to_status IS NULL)
  ),
  CHECK ((activity_type = 'inquiry_created' AND actor = 'system') OR (activity_type <> 'inquiry_created' AND actor = 'admin'))
);
CREATE INDEX inquiry_activity_inquiry_created_idx ON inquiry_activity (inquiry_id, created_at DESC, id DESC);
CREATE UNIQUE INDEX inquiry_activity_one_creation_idx ON inquiry_activity (inquiry_id) WHERE activity_type = 'inquiry_created';
-- Deliberate privacy cleanup: a future explicit inquiry deletion also removes its activity.
-- Archiving does not delete either record. This migration performs no deletions.
COMMIT;
