-- Apply manually once before Phase 6B.1 deployment, after unchanged migrations 001–007.
-- No provider calls. Retired Google data is preserved, never reused as Outlook identifiers.
BEGIN;
CREATE TABLE retired_calendar_connections (
 id uuid PRIMARY KEY,
 retired_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 snapshot jsonb NOT NULL
);
INSERT INTO retired_calendar_connections(id,snapshot)
 SELECT id,to_jsonb(c) FROM integration_connections c WHERE provider='google_calendar';
DELETE FROM integration_connections WHERE provider='google_calendar';
ALTER TABLE integration_connections DROP CONSTRAINT integration_connections_provider_check;
ALTER TABLE integration_connections ADD CONSTRAINT integration_connections_provider_check
 CHECK(provider IN('outlook_calendar','zoom'));
ALTER TABLE integration_connections ADD COLUMN account_id varchar(254);

ALTER TABLE bookings RENAME COLUMN google_sync_status TO calendar_sync_status;
ALTER TABLE bookings RENAME COLUMN google_sync_error TO calendar_sync_error;
ALTER TABLE bookings RENAME COLUMN google_last_synced_at TO calendar_last_synced_at;
ALTER TABLE bookings RENAME COLUMN google_calendar_id TO calendar_id;
ALTER TABLE bookings RENAME COLUMN google_account_email TO calendar_account_email;
ALTER TABLE bookings RENAME COLUMN google_event_generation TO calendar_event_generation;
ALTER TABLE bookings RENAME CONSTRAINT bookings_google_sync_status_check TO bookings_calendar_sync_status_check;
ALTER TABLE bookings RENAME CONSTRAINT bookings_google_event_generation_check TO bookings_calendar_event_generation_check;
ALTER INDEX bookings_sync_pending_idx RENAME TO bookings_calendar_sync_pending_idx;
ALTER TABLE bookings
 ADD COLUMN calendar_account_id varchar(254),
 ADD COLUMN calendar_create_attempted_at timestamptz(3),
 ADD COLUMN legacy_calendar_reference jsonb;
UPDATE bookings SET legacy_calendar_reference=jsonb_build_object(
 'provider','google_calendar','event_id',calendar_event_id,'calendar_id',calendar_id,
 'account_email',calendar_account_email,'event_generation',calendar_event_generation,
 'sync_status',calendar_sync_status,'sync_error',calendar_sync_error,'last_synced_at',calendar_last_synced_at),
 calendar_event_id=NULL,calendar_id=NULL,calendar_account_email=NULL,
 calendar_event_generation=0,calendar_sync_error=NULL,calendar_last_synced_at=NULL,
 calendar_sync_status=CASE WHEN status='scheduled' THEN 'pending' ELSE 'not_required' END;
-- OAuth requests begun against the retired provider expire; don't reinterpret encrypted PKCE.
DELETE FROM integration_oauth_states;
CREATE OR REPLACE FUNCTION mark_booking_sync_pending() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='INSERT' OR NEW.start_at IS DISTINCT FROM OLD.start_at
  OR NEW.end_at IS DISTINCT FROM OLD.end_at OR NEW.status IS DISTINCT FROM OLD.status THEN
  IF TG_OP='INSERT' OR NEW.status<>'completed' THEN
   NEW.sync_revision := COALESCE(NEW.sync_revision,0)+1;
   NEW.calendar_sync_status := 'pending'; NEW.calendar_sync_error := NULL;
   NEW.zoom_sync_status := CASE WHEN NEW.meeting_type='zoom' THEN 'pending' ELSE 'not_required' END;
   NEW.zoom_sync_error := NULL;
  END IF;
 END IF;
 RETURN NEW;
END $$;
-- Column renames preserve existing indexes/constraints, Zoom state, CRM versions and activity.
COMMIT;
