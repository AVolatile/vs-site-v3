import { Temporal } from "@js-temporal/polyfill";
import { calendarProvider } from "./integrations/calendar";
import { attemptBookingSync } from "./integrations/sync";
import { safeMessage } from "./integrations/provider";
import { createHash } from "node:crypto";
import { z } from "zod";
import { query } from "./database";
import { getInquiry } from "./inquiry-store";
import { getBookingSettings } from "./booking-settings";
import { getBookingLink, linkUrl, publicBookingLink } from "./booking-links";
import { availableDates, slotsForDate } from "./booking-slots";
import { bookingTokenHash } from "./booking-token";
import { HttpError } from "./http";
import {
  calendarDate,
  type PublicBooking,
  type AdminBooking,
  type PublicBookingPage,
  type InquiryBooking,
  type bookingInputSchema,
  type adminBookingActionSchema,
  type publicBookingActionSchema,
} from "../../src/lib/bookings/contract";
const iso = (v: unknown) =>
  (v instanceof Date ? v : new Date(String(v))).toISOString();
function publicData(row: Record<string, unknown>): PublicBooking {
  return {
    status: row.status as PublicBooking["status"],
    meetingType: row.meeting_type as PublicBooking["meetingType"],
    startAt: iso(row.start_at),
    endAt: iso(row.end_at),
    timezone: String(row.timezone),
    clientName: String(row.client_name),
    clientEmail: String(row.client_email),
    clientPhone: row.client_phone == null ? null : String(row.client_phone),
    clientNotes: String(row.client_notes),
    ...(row.meeting_type === "zoom" &&
    row.status === "scheduled" &&
    row.zoom_sync_status === "synced" &&
    row.zoom_join_url
      ? { zoomJoinUrl: String(row.zoom_join_url) }
      : {}),
  };
}
function adminData(row: Record<string, unknown>): AdminBooking {
  return {
    ...publicData(row),
    id: String(row.id),
    inquiryId: String(row.inquiry_id),
    company: String(row.company ?? ""),
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
    cancelledAt: row.cancelled_at ? iso(row.cancelled_at) : null,
    completedAt: row.completed_at ? iso(row.completed_at) : null,
    calendarSync: {
      status: String(
        row.calendar_sync_status ?? "not_required",
      ) as AdminBooking["calendarSync"]["status"],
      error: safeMessage(
        row.calendar_sync_error ? String(row.calendar_sync_error) : null,
      ),
      lastSyncedAt: row.calendar_last_synced_at
        ? iso(row.calendar_last_synced_at)
        : null,
    },
    zoomSync: {
      status: String(
        row.zoom_sync_status ?? "not_required",
      ) as AdminBooking["zoomSync"]["status"],
      error: safeMessage(
        row.zoom_sync_error ? String(row.zoom_sync_error) : null,
      ),
      lastSyncedAt: row.zoom_last_synced_at
        ? iso(row.zoom_last_synced_at)
        : null,
    },
  };
}
const select =
  "SELECT b.*,i.company FROM bookings b JOIN inquiries i ON i.id=b.inquiry_id";
async function latest(inquiryId: string) {
  return (
    (
      await query(
        select +
          " WHERE b.inquiry_id=$1 ORDER BY (b.status='scheduled') DESC,b.created_at DESC,b.id DESC LIMIT 1",
        [inquiryId],
      )
    )[0] ?? null
  );
}
export async function getAdminBooking(id: string) {
  const row = (await query(select + " WHERE b.id=$1", [id]))[0];
  if (!row) throw new HttpError(404, "This booking could not be found.");
  return adminData(row);
}
export async function getInquiryBooking(
  inquiryId: string,
): Promise<InquiryBooking> {
  await getInquiry(inquiryId);
  const [link, row] = await Promise.all([
    getBookingLink(inquiryId),
    latest(inquiryId),
  ]);
  return {
    url: link ? linkUrl(link) : null,
    lastFour: link ? String(link.token_last_four) : null,
    booking: row ? adminData(row) : null,
  };
}
export async function occupiedBookings(excludeId?: string) {
  const rows = await query(
    "SELECT id,start_at,end_at,busy_until FROM bookings WHERE status IN('scheduled','completed') AND busy_until>clock_timestamp()-interval '1 day' AND ($1::uuid IS NULL OR id<>$1::uuid)",
    [excludeId ?? null],
  );
  return rows.map((r) => ({
    id: String(r.id),
    startAt: iso(r.start_at),
    endAt: iso(r.end_at),
    busyUntil: iso(r.busy_until),
  }));
}
async function occupiedWithCalendar(
  settings: Awaited<ReturnType<typeof getBookingSettings>>,
  excludeId?: string,
  fresh = false,
  date?: string,
) {
  const first = Temporal.Instant.from(new Date().toISOString())
    .toZonedDateTimeISO(settings.timezone)
    .toPlainDate();
  const day = date ? Temporal.PlainDate.from(date) : first;
  const start = day
    .toZonedDateTime({ timeZone: settings.timezone, plainTime: "00:00" })
    .toInstant()
    .toString();
  const end = day
    .add({ days: date ? 1 : settings.horizonDays + 1 })
    .toZonedDateTime({ timeZone: settings.timezone, plainTime: "00:00" })
    .toInstant()
    .toString();
  const internal = await occupiedBookings(excludeId);
  try {
    return [
      ...internal,
      ...(await calendarProvider.getAvailability(start, end, fresh, excludeId)),
    ];
  } catch {
    throw new HttpError(
      503,
      "Availability is temporarily unavailable. Please try again shortly or contact Volatile Solutions.",
    );
  }
}
async function syncedRow(
  row: Record<string, unknown>,
  defer?: (id: string) => void,
) {
  if (defer) {
    defer(String(row.id));
    return row;
  }
  await attemptBookingSync(String(row.id));
  try {
    return (
      (await query("SELECT * FROM bookings WHERE id=$1", [row.id]))[0] ?? row
    );
  } catch {
    return row;
  }
}
export async function publicBookingPage(
  token: string,
): Promise<PublicBookingPage> {
  const link = await publicBookingLink(token),
    settings = await getBookingSettings(),
    row = await latest(String(link.inquiry_id));
  let dates: PublicBookingPage["dates"] = [],
    availabilityMessage: string | undefined;
  try {
    dates = availableDates(
      settings,
      await occupiedWithCalendar(
        settings,
        row?.status === "scheduled" ? String(row.id) : undefined,
      ),
    );
  } catch (e) {
    availabilityMessage =
      e instanceof HttpError
        ? e.message
        : "Availability is temporarily unavailable. Please try again shortly.";
  }
  return {
    name: String(link.name),
    email: String(link.email),
    timezone: settings.timezone,
    durationMinutes: settings.slotDurationMinutes,
    dates,
    booking: row ? publicData(row) : null,
    ...(availabilityMessage ? { availabilityMessage } : {}),
  };
}
export async function publicSlots(token: string, date: string) {
  const link = await publicBookingLink(token),
    settings = await getBookingSettings(),
    row = await latest(String(link.inquiry_id));
  return {
    timezone: settings.timezone,
    slots: slotsForDate(
      date,
      settings,
      await occupiedWithCalendar(
        settings,
        row?.status === "scheduled" ? String(row.id) : undefined,
        false,
        date,
      ),
    ),
  };
}
export async function adminSlots(date: string, excludeId?: string) {
  const settings = await getBookingSettings();
  return {
    timezone: settings.timezone,
    slots: slotsForDate(
      date,
      settings,
      await occupiedWithCalendar(settings, excludeId, false, date),
    ),
  };
}
function dbFailure(error: unknown): never {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String(error.code)
      : "";
  if (["23P01", "23505"].includes(code))
    throw new HttpError(
      409,
      "That slot was just taken or this inquiry already has a scheduled call. Refresh available times.",
    );
  if (code === "P0002")
    throw new HttpError(404, "This booking link is unavailable.");
  if (code === "P0001")
    throw new HttpError(
      409,
      "The booking or availability changed. Refresh before confirming; completion is available after the call ends.",
    );
  throw error;
}
export async function book(
  token: string,
  input: z.infer<typeof bookingInputSchema>,
  defer?: (id: string) => void,
) {
  const link = await publicBookingLink(token);
  if (input.clientEmail.toLowerCase() !== String(link.email).toLowerCase())
    throw new HttpError(
      422,
      "Use the contact email attached to this booking link.",
    );
  const fingerprint = createHash("sha256")
    .update(
      JSON.stringify({
        ...input,
        clientEmail: input.clientEmail.toLowerCase(),
      }),
    )
    .digest("hex");
  async function existingRequest() {
    const old = (
      await query("SELECT * FROM bookings WHERE request_key=$1", [
        input.requestKey,
      ])
    )[0];
    if (old) {
      if (
        old.inquiry_id !== link.inquiry_id ||
        old.payload_fingerprint !== fingerprint
      )
        throw new HttpError(
          409,
          "This request key belongs to a different booking.",
        );
      return publicData(old);
    }
    return null;
  }
  const existing = await existingRequest();
  if (existing) return existing;
  const settings = await getBookingSettings(),
    date = calendarDate(input.startAt, settings.timezone),
    slot = slotsForDate(
      date,
      settings,
      await occupiedWithCalendar(settings, undefined, true, date),
    ).find((s) => s.startAt === new Date(input.startAt).toISOString());
  if (!slot) {
    // An identical concurrent submission may have reserved this slot during generation.
    const retry = await existingRequest();
    if (retry) return retry;
    throw new HttpError(
      409,
      "This time is no longer available. Choose another listed slot.",
    );
  }
  try {
    const rows = await query(
      "SELECT * FROM reserve_booking($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)",
      [
        bookingTokenHash(token),
        slot.startAt,
        slot.endAt,
        settings.timezone,
        input.clientName,
        String(link.email),
        input.clientPhone,
        input.clientNotes,
        input.meetingType,
        input.requestKey,
        fingerprint,
        settings.updatedAt,
      ],
    );
    return publicData(await syncedRow(rows[0], defer));
  } catch (error) {
    const retry = await existingRequest();
    if (retry) return retry;
    return dbFailure(error);
  }
}
export async function changeAdminBooking(
  input: z.infer<typeof adminBookingActionSchema>,
  defer?: (id: string) => void,
) {
  const old = await getAdminBooking(input.id),
    settings = await getBookingSettings();
  let start: string | null = null,
    end: string | null = null;
  if (input.action === "reschedule") {
    const slot = slotsForDate(
      calendarDate(input.startAt!, settings.timezone),
      settings,
      await occupiedWithCalendar(
        settings,
        input.id,
        true,
        calendarDate(input.startAt!, settings.timezone),
      ),
    ).find((s) => s.startAt === new Date(input.startAt!).toISOString());
    if (!slot) throw new HttpError(409, "Choose an available listed slot.");
    start = slot.startAt;
    end = slot.endAt;
  }
  try {
    const rows = await query(
      "SELECT * FROM change_booking($1,$2,$3,NULL,$4,$5,$6,'admin',NULL)",
      [old.id, input.action, input.updatedAt, start, end, settings.updatedAt],
    );
    return adminData({
      ...(await syncedRow(rows[0], defer)),
      company: old.company,
    });
  } catch (error) {
    return dbFailure(error);
  }
}
export async function changePublicBooking(
  token: string,
  input: z.infer<typeof publicBookingActionSchema>,
  defer?: (id: string) => void,
) {
  const link = await publicBookingLink(token),
    row = await latest(String(link.inquiry_id));
  if (
    !row ||
    row.status !== "scheduled" ||
    Date.parse(iso(row.start_at)) <= Date.now()
  )
    throw new HttpError(409, "This booking can no longer be changed publicly.");
  const settings = await getBookingSettings();
  let start: string | null = null,
    end: string | null = null;
  if (input.action === "reschedule") {
    const slot = slotsForDate(
      calendarDate(input.startAt!, settings.timezone),
      settings,
      await occupiedWithCalendar(
        settings,
        String(row.id),
        true,
        calendarDate(input.startAt!, settings.timezone),
      ),
    ).find((s) => s.startAt === new Date(input.startAt!).toISOString());
    if (!slot) throw new HttpError(409, "Choose an available listed slot.");
    start = slot.startAt;
    end = slot.endAt;
  }
  try {
    const rows = await query(
      "SELECT * FROM change_booking($1,$2,NULL,$3,$4,$5,$6,'client',$7)",
      [
        row.id,
        input.action,
        input.expectedStartAt,
        start,
        end,
        settings.updatedAt,
        bookingTokenHash(token),
      ],
    );
    return publicData(await syncedRow(rows[0], defer));
  } catch (error) {
    return dbFailure(error);
  }
}
export async function listBookings(month: string) {
  const rows = await query(
    select +
      " WHERE (b.start_at AT TIME ZONE (SELECT timezone FROM booking_settings WHERE id=true))::date >= $1::date AND (b.start_at AT TIME ZONE (SELECT timezone FROM booking_settings WHERE id=true))::date < ($1::date+interval '1 month') ORDER BY b.start_at,b.id",
    [month + "-01"],
  );
  const settings = await getBookingSettings();
  return { timezone: settings.timezone, items: rows.map(adminData) };
}
