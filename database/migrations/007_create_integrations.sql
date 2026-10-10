-- Apply manually once to the intended Neon branch before Phase 6B deployment.
-- Migrations 001–006 must exist. No live execution, backfill or provider calls.
BEGIN;
CREATE TABLE integration_connections (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 provider text NOT NULL UNIQUE CHECK(provider IN('google_calendar','zoom')),
 status text NOT NULL DEFAULT 'disconnected' CHECK(status IN('disconnected','connected','reconnect_required')),
 created_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 generation uuid NOT NULL DEFAULT gen_random_uuid(),
 account_email varchar(254), account_name varchar(200),
 encrypted_access_token text, encrypted_refresh_token text, token_expires_at timestamptz,
 scope text, selected_calendar_id varchar(1024), selected_calendar_name varchar(300),
 last_success_at timestamptz(3), last_error_at timestamptz(3), last_error_code varchar(80)
);
CREATE TABLE integration_oauth_states (
 state_hash varchar(64) PRIMARY KEY,
 browser_hash varchar(64) NOT NULL,
 encrypted_verifier text NOT NULL,
 redirect_uri varchar(2048) NOT NULL,
 expires_at timestamptz NOT NULL,
 created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE bookings
 ADD COLUMN google_sync_status text NOT NULL DEFAULT 'not_required' CHECK(google_sync_status IN('not_required','pending','synced','failed')),
 ADD COLUMN google_sync_error varchar(80), ADD COLUMN google_last_synced_at timestamptz(3),
 ADD COLUMN zoom_sync_status text NOT NULL DEFAULT 'not_required' CHECK(zoom_sync_status IN('not_required','pending','synced','failed')),
 ADD COLUMN zoom_sync_error varchar(80), ADD COLUMN zoom_last_synced_at timestamptz(3),
 ADD COLUMN google_calendar_id varchar(1024), ADD COLUMN google_account_email varchar(254),
 ADD COLUMN google_event_generation integer NOT NULL DEFAULT 0 CHECK(google_event_generation>=0),
 ADD COLUMN zoom_host_user varchar(254), ADD COLUMN zoom_account_fingerprint varchar(64), ADD COLUMN zoom_create_attempted_at timestamptz(3),
 ADD COLUMN sync_revision integer NOT NULL DEFAULT 0,
 ADD COLUMN sync_lease uuid, ADD COLUMN sync_lease_until timestamptz;
-- The durable pending state is committed in the same transaction as the booking.
-- Integration-only writes do not change CRM updated_at or create activity.
CREATE FUNCTION mark_booking_sync_pending() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='INSERT' OR NEW.start_at IS DISTINCT FROM OLD.start_at
  OR NEW.end_at IS DISTINCT FROM OLD.end_at OR NEW.status IS DISTINCT FROM OLD.status THEN
  IF TG_OP='INSERT' OR NEW.status<>'completed' THEN
   NEW.sync_revision := COALESCE(NEW.sync_revision,0)+1;
   NEW.google_sync_status := 'pending'; NEW.google_sync_error := NULL;
   NEW.zoom_sync_status := CASE WHEN NEW.meeting_type='zoom' THEN 'pending' ELSE 'not_required' END;
   NEW.zoom_sync_error := NULL;
  END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER bookings_sync_pending BEFORE INSERT OR UPDATE OF start_at,end_at,status ON bookings
 FOR EACH ROW EXECUTE FUNCTION mark_booking_sync_pending();
CREATE INDEX bookings_sync_pending_idx ON bookings(id) WHERE google_sync_status IN('pending','failed') OR zoom_sync_status IN('pending','failed');
COMMIT;
