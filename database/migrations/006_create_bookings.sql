-- Apply once to the intended Neon branch BEFORE Phase 6A deployment; 001–005 must exist.
-- Structural defaults only: every weekday is disabled. No bookings/history are seeded.
BEGIN;
CREATE TABLE booking_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK(id),
  timezone varchar(80) NOT NULL DEFAULT 'America/New_York',
  slot_duration_minutes integer NOT NULL DEFAULT 30 CHECK(slot_duration_minutes IN(15,30,45,60)),
  buffer_minutes integer NOT NULL DEFAULT 0 CHECK(buffer_minutes BETWEEN 0 AND 120),
  minimum_notice_hours integer NOT NULL DEFAULT 12 CHECK(minimum_notice_hours BETWEEN 1 AND 168),
  horizon_days integer NOT NULL DEFAULT 60 CHECK(horizon_days BETWEEN 1 AND 90),
  updated_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO booking_settings(id) VALUES(true);
CREATE TABLE booking_availability (
  weekday integer PRIMARY KEY CHECK(weekday BETWEEN 0 AND 6),
  enabled boolean NOT NULL DEFAULT false,
  start_time time NOT NULL DEFAULT '09:00',
  end_time time NOT NULL DEFAULT '17:00',
  CHECK(end_time>start_time)
);
INSERT INTO booking_availability(weekday) SELECT generate_series(0,6);
CREATE TABLE booking_exceptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL UNIQUE,
  type text NOT NULL CHECK(type IN('unavailable','custom_hours')),
  start_time time,end_time time,
  created_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK((type='unavailable' AND start_time IS NULL AND end_time IS NULL) OR (type='custom_hours' AND start_time IS NOT NULL AND end_time IS NOT NULL AND end_time>start_time))
);
CREATE TABLE booking_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id uuid NOT NULL UNIQUE REFERENCES inquiries(id) ON DELETE RESTRICT,
  token_hash varchar(64) NOT NULL UNIQUE CHECK(token_hash ~ '^[a-f0-9]{64}$'),
  token_nonce varchar(64) NOT NULL CHECK(token_nonce ~ '^[a-f0-9]{64}$'),
  token_last_four varchar(4) NOT NULL,
  created_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id uuid NOT NULL REFERENCES inquiries(id) ON DELETE RESTRICT,
  link_id uuid NOT NULL REFERENCES booking_links(id) ON DELETE RESTRICT,
  booking_token_hash varchar(64) NOT NULL,
  created_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status text NOT NULL DEFAULT 'scheduled' CHECK(status IN('scheduled','cancelled','completed')),
  meeting_type text NOT NULL CHECK(meeting_type IN('phone','zoom')),
  start_at timestamptz(3) NOT NULL,end_at timestamptz(3) NOT NULL,
  busy_until timestamptz(3) NOT NULL,
  buffer_minutes integer NOT NULL CHECK(buffer_minutes BETWEEN 0 AND 120),
  occupied_during tstzrange GENERATED ALWAYS AS(tstzrange(start_at,busy_until,'[)')) STORED,
  timezone varchar(80) NOT NULL,
  client_name varchar(120) NOT NULL,client_email varchar(254) NOT NULL,client_phone varchar(30),client_notes varchar(1000) NOT NULL DEFAULT '',
  calendar_event_id text,zoom_meeting_id text,zoom_join_url text,
  cancelled_at timestamptz(3),completed_at timestamptz(3),
  request_key uuid NOT NULL UNIQUE,payload_fingerprint varchar(64) NOT NULL,
  CHECK(end_at>start_at AND busy_until>=end_at),
  CHECK(meeting_type<>'phone' OR client_phone IS NOT NULL),
  CHECK((status='cancelled')=(cancelled_at IS NOT NULL)),
  CHECK((status='completed')=(completed_at IS NOT NULL)),
  EXCLUDE USING gist(occupied_during WITH &&) WHERE(status IN('scheduled','completed'))
);
CREATE UNIQUE INDEX bookings_one_scheduled_inquiry_idx ON bookings(inquiry_id) WHERE(status='scheduled');
CREATE INDEX bookings_start_idx ON bookings(start_at,id);
ALTER TABLE inquiry_activity ADD COLUMN booking_id uuid REFERENCES bookings(id) ON DELETE RESTRICT;
ALTER TABLE inquiry_activity DROP CONSTRAINT inquiry_activity_activity_type_check;
ALTER TABLE inquiry_activity ADD CONSTRAINT inquiry_activity_activity_type_check CHECK(activity_type IN(
 'inquiry_created','status_changed','admin_note_updated','follow_up_scheduled','follow_up_updated','follow_up_cleared',
 'proposal_created','proposal_updated','proposal_sent','proposal_accepted','proposal_declined','email_sent','email_failed',
 'booking_link_created','booking_link_regenerated','booking_scheduled','booking_cancelled','booking_completed','booking_rescheduled'));
ALTER TABLE inquiry_activity DROP CONSTRAINT inquiry_activity_actor_type_check;
ALTER TABLE inquiry_activity ADD CONSTRAINT inquiry_activity_actor_type_check CHECK(
 (activity_type='inquiry_created' AND actor='system') OR
 (activity_type IN('proposal_accepted','proposal_declined') AND actor='client') OR
 (activity_type IN('booking_scheduled','booking_cancelled','booking_rescheduled') AND actor IN('admin','client')) OR
 (activity_type NOT IN('inquiry_created','proposal_accepted','proposal_declined','booking_scheduled','booking_cancelled','booking_rescheduled') AND actor='admin'));
ALTER TABLE inquiry_activity ADD CONSTRAINT inquiry_activity_booking_check CHECK(
 (activity_type IN('booking_scheduled','booking_cancelled','booking_completed','booking_rescheduled') AND booking_id IS NOT NULL) OR
 (activity_type NOT IN('booking_scheduled','booking_cancelled','booking_completed','booking_rescheduled') AND booking_id IS NULL));
-- Keep booking tokens out of persisted email envelopes/content; snapshots store nonce/hash only.
ALTER TABLE inquiry_messages ADD COLUMN booking_nonce varchar(64);
ALTER TABLE inquiry_messages ADD COLUMN booking_token_hash varchar(64);
ALTER TABLE inquiry_messages ADD CONSTRAINT inquiry_messages_booking_snapshot_check CHECK(
 (booking_nonce IS NULL AND booking_token_hash IS NULL) OR
 (booking_nonce IS NOT NULL AND booking_token_hash IS NOT NULL AND booking_nonce ~ '^[a-f0-9]{64}$' AND booking_token_hash ~ '^[a-f0-9]{64}$'));

-- Serialize writes on the settings row. After the lock, PL/pgSQL statements see current rows.
-- The native GiST exclusion remains the final concurrent-overlap guarantee.
CREATE FUNCTION reserve_booking(p_hash text,p_start timestamptz,p_end timestamptz,p_timezone text,p_name text,p_email text,p_phone text,p_notes text,p_type text,p_key uuid,p_fingerprint text,p_version timestamptz)
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
  IF existing.inquiry_id<>link.inquiry_id OR existing.payload_fingerprint<>p_fingerprint THEN RAISE EXCEPTION USING ERRCODE='P0001',MESSAGE='Booking request changed'; END IF;
  RETURN NEXT existing;RETURN;
 END IF;
 IF EXISTS(SELECT 1 FROM bookings WHERE status IN('scheduled','completed') AND start_at<p_end+make_interval(mins=>config.buffer_minutes)
    AND GREATEST(busy_until,end_at+make_interval(mins=>config.buffer_minutes))>p_start) THEN RAISE EXCEPTION USING ERRCODE='23P01',MESSAGE='Slot just taken'; END IF;
 INSERT INTO bookings(inquiry_id,link_id,booking_token_hash,start_at,end_at,busy_until,buffer_minutes,timezone,client_name,client_email,client_phone,client_notes,meeting_type,request_key,payload_fingerprint)
 VALUES(link.inquiry_id,link.id,p_hash,p_start,p_end,p_end+make_interval(mins=>config.buffer_minutes),config.buffer_minutes,p_timezone,p_name,p_email,NULLIF(p_phone,''),p_notes,p_type,p_key,p_fingerprint) RETURNING * INTO saved;
 INSERT INTO inquiry_activity(inquiry_id,activity_type,actor,booking_id,note) VALUES(saved.inquiry_id,'booking_scheduled','client',saved.id,'Call scheduled');
 RETURN NEXT saved;
END $$;
CREATE FUNCTION change_booking(p_id uuid,p_action text,p_version timestamptz,p_expected_start timestamptz,p_start timestamptz,p_end timestamptz,p_settings_version timestamptz,p_actor text,p_hash text)
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
 INSERT INTO inquiry_activity(inquiry_id,activity_type,actor,booking_id,note) VALUES(saved.inquiry_id,CASE p_action WHEN 'cancel' THEN 'booking_cancelled' WHEN 'complete' THEN 'booking_completed' ELSE 'booking_rescheduled' END,p_actor,saved.id,'Call '||CASE p_action WHEN 'cancel' THEN 'cancelled' WHEN 'complete' THEN 'completed' ELSE 'rescheduled' END);
 RETURN NEXT saved;
END $$;
COMMIT;
