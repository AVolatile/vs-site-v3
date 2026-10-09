import { query } from "./database";
import { HttpError } from "./http";
import type { AvailabilitySettings } from "../../src/lib/bookings/contract";
const iso = (v: unknown) =>
  (v instanceof Date ? v : new Date(String(v))).toISOString();
export async function getBookingSettings(): Promise<AvailabilitySettings> {
  // Read the version, weekly hours and exceptions from one database snapshot.
  const rows = await query(`SELECT s.*,
    COALESCE((SELECT jsonb_agg(a ORDER BY weekday) FROM booking_availability a),'[]'::jsonb) AS days,
    COALESCE((SELECT jsonb_agg(e ORDER BY date) FROM booking_exceptions e),'[]'::jsonb) AS exceptions
    FROM booking_settings s WHERE id=true`);
  const row = rows[0];
  const days = (row?.days ?? []) as Record<string, unknown>[];
  const exceptions = (row?.exceptions ?? []) as Record<string, unknown>[];
  if (!row)
    throw new HttpError(
      503,
      "Booking settings are unavailable. Apply migration 006 before deployment.",
    );
  return {
    timezone: String(row.timezone),
    slotDurationMinutes: Number(row.slot_duration_minutes),
    bufferMinutes: Number(row.buffer_minutes),
    minimumNoticeHours: Number(row.minimum_notice_hours),
    horizonDays: Number(row.horizon_days),
    updatedAt: iso(row.updated_at),
    weekdays: days.map((d) => ({
      weekday: Number(d.weekday),
      enabled: Boolean(d.enabled),
      startTime: String(d.start_time).slice(0, 5),
      endTime: String(d.end_time).slice(0, 5),
    })),
    exceptions: exceptions.map((e) => ({
      date:
        e.date instanceof Date
          ? e.date.toISOString().slice(0, 10)
          : String(e.date).slice(0, 10),
      type: e.type as "unavailable" | "custom_hours",
      startTime: e.start_time == null ? null : String(e.start_time).slice(0, 5),
      endTime: e.end_time == null ? null : String(e.end_time).slice(0, 5),
    })),
  };
}
export async function saveBookingSettings(input: AvailabilitySettings) {
  const rows = await query(
    `WITH saved AS(UPDATE booking_settings SET timezone=$1,slot_duration_minutes=$2,buffer_minutes=$3,minimum_notice_hours=$4,horizon_days=$5,updated_at=GREATEST(date_trunc('milliseconds',clock_timestamp()),updated_at+interval '1 millisecond') WHERE id=true AND updated_at=$6::timestamptz RETURNING *),
 days AS(UPDATE booking_availability a SET enabled=d.enabled,start_time=d."startTime"::time,end_time=d."endTime"::time FROM jsonb_to_recordset($7::jsonb) AS d(weekday integer,enabled boolean,"startTime" text,"endTime" text),saved WHERE a.weekday=d.weekday RETURNING a.*),
 removed AS(DELETE FROM booking_exceptions WHERE EXISTS(SELECT 1 FROM saved) RETURNING id),
 inserted AS(INSERT INTO booking_exceptions(date,type,start_time,end_time) SELECT e.date::date,e.type,e."startTime"::time,e."endTime"::time FROM jsonb_to_recordset($8::jsonb) AS e(date text,type text,"startTime" text,"endTime" text),saved,(SELECT count(*) FROM removed) barrier RETURNING *)
 SELECT saved.*,COALESCE((SELECT jsonb_agg(row_to_json(days)) FROM days),'[]') AS days,COALESCE((SELECT jsonb_agg(row_to_json(inserted)) FROM inserted),'[]') AS exceptions FROM saved`,
    [
      input.timezone,
      input.slotDurationMinutes,
      input.bufferMinutes,
      input.minimumNoticeHours,
      input.horizonDays,
      input.updatedAt,
      JSON.stringify(input.weekdays),
      JSON.stringify(input.exceptions),
    ],
  );
  if (!rows[0])
    throw new HttpError(
      409,
      "Availability changed in another session. Reload settings before saving; your edits are still here.",
    );
  return { ...input, updatedAt: iso(rows[0].updated_at) };
}
