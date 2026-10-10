import { query } from "../database";
import { publicUrl } from "../public-url";
import {
  microsoftApi,
  microsoftConnection,
  listMicrosoftCalendars,
  graphPath,
} from "./microsoft-auth";
import { digest } from "./crypto";
import { ProviderError, object, text, timestamp, iso } from "./provider";
type Row = Record<string, unknown>;
export interface BusyPeriod {
  startAt: string;
  endAt: string;
  busyUntil: string;
}
export const BOOKING_PROPERTY =
  "String {9f6e0ec1-c54f-4c35-b11d-96d3da224bec} Name VolatileBooking";
const marker = (row: Row) => `${row.id}:${row.inquiry_id}`;
const expand = `singleValueExtendedProperties($filter=id eq '${BOOKING_PROPERTY}')`;
const cache = new Map<string, { until: number; periods: BusyPeriod[] }>();
export const clearBusyCache = () => cache.clear();
export function ownsEvent(event: Row, row: Row) {
  return (
    Array.isArray(event.singleValueExtendedProperties) &&
    event.singleValueExtendedProperties.some((v) => {
      const p = object(v);
      return p.id === BOOKING_PROPERTY && p.value === marker(row);
    })
  );
}
function eventTime(value: unknown) {
  const time = object(value),
    dateTime = text(time.dateTime);
  // Prefer UTC is sent on every Graph call. Unknown/custom zones fail closed.
  if (time.timeZone !== "UTC" && time.timeZone !== "Etc/UTC")
    throw new ProviderError("invalid_response");
  return timestamp(
    /[zZ]$|[+-]\d\d:\d\d$/.test(dateTime) ? dateTime : dateTime + "Z",
  );
}
async function availability(
  start: string,
  end: string,
  fresh = false,
  excludeId?: string,
  deadline?: AbortSignal,
): Promise<BusyPeriod[]> {
  deadline ??= AbortSignal.timeout(10000);
  const c = await microsoftConnection();
  if (!c || c.status === "disconnected") return [];
  if (c.status !== "connected" || !c.selected_calendar_id)
    throw new ProviderError("reconnect_required");
  const key = [c.generation, c.selected_calendar_id, start, end].join("|"),
    hit = cache.get(key);
  if (!fresh && !excludeId && hit && hit.until > Date.now()) return hit.periods;
  const ignore = excludeId
    ? (await query("SELECT * FROM bookings WHERE id=$1", [excludeId]))[0]
    : null;
  let mayExclude = false;
  if (
    ignore?.calendar_event_id &&
    ignore.calendar_account_id === c.account_id &&
    ignore.calendar_id === c.selected_calendar_id
  ) {
    const owned = await getEvent(
      c,
      String(ignore.calendar_id),
      String(ignore.calendar_event_id),
      deadline,
    );
    mayExclude =
      !!owned && ownsEvent(owned, ignore) && owned.isCancelled !== true;
  }
  let path =
    `me/calendars/${encodeURIComponent(String(c.selected_calendar_id))}/calendarView?` +
    new URLSearchParams({
      startDateTime: timestamp(start),
      endDateTime: timestamp(end),
      $top: "1000",
      $select: "id,start,end,showAs,isCancelled",
    });
  const periods: BusyPeriod[] = [];
  for (let n = 0; n < 20; n++) {
    const data = object(await microsoftApi(c, path, {}, deadline));
    if (!Array.isArray(data.value)) throw new ProviderError("invalid_response");
    for (const v of data.value) {
      const e = object(v);
      if (
        e.isCancelled === true ||
        e.showAs === "free" ||
        e.showAs === "workingElsewhere"
      )
        continue;
      if (mayExclude && e.id === ignore!.calendar_event_id) continue;
      // busy, tentative, oof and unknown/missing states all block; never infer free.
      const startAt = eventTime(e.start),
        endAt = eventTime(e.end);
      if (Date.parse(endAt) <= Date.parse(startAt))
        throw new ProviderError("invalid_response");
      periods.push({ startAt, endAt, busyUntil: endAt });
    }
    if (!data["@odata.nextLink"]) {
      if (!excludeId) {
        if (cache.size >= 32) cache.clear();
        cache.set(key, { until: Date.now() + 60000, periods });
      }
      return periods;
    }
    path = graphPath(text(data["@odata.nextLink"], 8192));
  }
  throw new ProviderError("invalid_response");
}
export function outlookEventBody(row: Row, zoomUrl: string | null = null) {
  const content = [
    `Inquiry reference: ${String(row.inquiry_id).slice(0, 8)}`,
    `Client: ${row.client_name}`,
    row.company ? `Company: ${row.company}` : "",
    `Meeting: ${row.meeting_type === "zoom" ? "Zoom" : "Phone"}`,
    `Email: ${row.client_email}`,
    row.meeting_type === "phone" && row.client_phone
      ? `Phone: ${row.client_phone}`
      : "",
    `Booking timezone: ${row.timezone}`,
    zoomUrl ? `Join Zoom: ${zoomUrl}` : "",
    `Admin inquiry: ${publicUrl("/admin/?inquiry=" + row.inquiry_id)}`,
  ]
    .filter(Boolean)
    .join("\n");
  // Graph UTC DateTimeTimeZone avoids Windows/IANA and repeated-hour ambiguity.
  // The configured business timezone is retained in Neon and included in the body.
  return {
    subject: `Volatile Solutions — Discovery Call — ${row.client_name}`,
    body: { contentType: "text", content },
    start: { dateTime: iso(row.start_at).replace(/Z$/, ""), timeZone: "UTC" },
    end: { dateTime: iso(row.end_at).replace(/Z$/, ""), timeZone: "UTC" },
    showAs: "busy",
    isReminderOn: false,
    singleValueExtendedProperties: [
      { id: BOOKING_PROPERTY, value: marker(row) },
    ],
  };
}
async function getEvent(
  c: Row,
  _calendar: string,
  id: string,
  deadline?: AbortSignal,
): Promise<Row | null> {
  try {
    return object(
      await microsoftApi(
        c,
        `me/events/${encodeURIComponent(id)}?` +
          new URLSearchParams({ $expand: expand }),
        {},
        deadline,
      ),
    );
  } catch (e) {
    if (e instanceof ProviderError && ["not_found", "gone"].includes(e.code))
      return null;
    throw e;
  }
}
async function findEvent(
  c: Row,
  calendar: string,
  row: Row,
  deadline?: AbortSignal,
): Promise<Row | null> {
  let path =
    `me/calendars/${encodeURIComponent(calendar)}/events?` +
    new URLSearchParams({
      $filter: `singleValueExtendedProperties/Any(ep: ep/id eq '${BOOKING_PROPERTY}' and ep/value eq '${marker(row)}')`,
      $expand: expand,
      $top: "100",
    });
  const matches: Row[] = [];
  for (let n = 0; n < 20; n++) {
    const data = object(await microsoftApi(c, path, {}, deadline));
    if (!Array.isArray(data.value)) throw new ProviderError("invalid_response");
    for (const value of data.value) {
      const e = object(value);
      if (!ownsEvent(e, row)) throw new ProviderError("conflict");
      if (e.isCancelled !== true) matches.push(e);
    }
    if (matches.length > 1) throw new ProviderError("conflict");
    if (!data["@odata.nextLink"]) return matches[0] || null;
    path = graphPath(text(data["@odata.nextLink"], 8192));
  }
  throw new ProviderError("invalid_response");
}
function assertPrivate(event: Row, row: Row) {
  if (
    !ownsEvent(event, row) ||
    !Array.isArray(event.attendees) ||
    event.attendees.length ||
    event.isOrganizer === false
  )
    throw new ProviderError("conflict");
}
async function createEvent(
  c: Row,
  calendar: string,
  row: Row,
  url: string | null,
  deadline?: AbortSignal,
) {
  const event = object(
    await microsoftApi(
      c,
      `me/calendars/${encodeURIComponent(calendar)}/events`,
      {
        method: "POST",
        body: JSON.stringify({
          ...outlookEventBody(row, url),
          transactionId: digest(`${row.id}:${row.calendar_event_generation}`),
        }),
      },
      deadline,
    ),
  );
  const id = text(event.id);
  // Graph create responses omit newly written extended properties. Verify via expanded GET.
  const verified = await getEvent(c, calendar, id, deadline);
  if (!verified) throw new ProviderError("sync_unconfirmed");
  assertPrivate(verified, row);
  return verified;
}
async function updateEvent(
  c: Row,
  _calendar: string,
  event: Row,
  row: Row,
  url: string | null,
  deadline?: AbortSignal,
) {
  assertPrivate(event, row);
  await microsoftApi(
    c,
    `me/events/${encodeURIComponent(text(event.id))}`,
    { method: "PATCH", body: JSON.stringify(outlookEventBody(row, url)) },
    deadline,
  );
}
async function deleteEvent(
  c: Row,
  _calendar: string,
  event: Row,
  row: Row,
  deadline?: AbortSignal,
) {
  assertPrivate(event, row);
  try {
    await microsoftApi(
      c,
      `me/events/${encodeURIComponent(text(event.id))}`,
      { method: "DELETE" },
      deadline,
    );
  } catch (e) {
    if (!(e instanceof ProviderError && ["not_found", "gone"].includes(e.code)))
      throw e;
  }
}
async function testConnection() {
  const c = await microsoftConnection();
  if (!c || c.status !== "connected")
    throw new ProviderError("reconnect_required");
  if (
    !(await listMicrosoftCalendars(c)).some(
      (v) => v.id === c.selected_calendar_id,
    )
  )
    throw new ProviderError("calendar_missing");
  await availability(
    new Date().toISOString(),
    new Date(Date.now() + 60000).toISOString(),
    true,
  );
}
export const outlookCalendarProvider = {
  name: "outlook_calendar",
  getConnection: microsoftConnection,
  getAvailability: availability,
  getEvent,
  findEvent,
  ownsEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  testConnection,
  clearCache: clearBusyCache,
};
