-- Apply once to the intended Neon branch BEFORE deploying Phase 3.
-- Migrations 001 and 002 must already be applied. No schedules or history are fabricated.
BEGIN;
ALTER TABLE inquiries
  ADD COLUMN next_follow_up_at timestamptz(3),
  ADD COLUMN follow_up_note varchar(2000) NOT NULL DEFAULT '';
CREATE INDEX inquiries_follow_up_idx ON inquiries (next_follow_up_at)
  WHERE next_follow_up_at IS NOT NULL AND status <> 'archived';
ALTER TABLE inquiry_activity ADD COLUMN follow_up_at timestamptz(3);
ALTER TABLE inquiry_activity DROP CONSTRAINT inquiry_activity_activity_type_check;
ALTER TABLE inquiry_activity ADD CONSTRAINT inquiry_activity_activity_type_check
  CHECK (activity_type IN ('inquiry_created','status_changed','admin_note_updated',
    'follow_up_scheduled','follow_up_updated','follow_up_cleared'));
-- Store only the resulting schedule, never a duplicate of a private follow-up note.
ALTER TABLE inquiry_activity ADD CONSTRAINT inquiry_activity_follow_up_check CHECK (
  (activity_type = 'follow_up_scheduled' AND follow_up_at IS NOT NULL)
  OR activity_type = 'follow_up_updated'
  OR (activity_type NOT IN ('follow_up_scheduled','follow_up_updated') AND follow_up_at IS NULL)
);
COMMIT;
