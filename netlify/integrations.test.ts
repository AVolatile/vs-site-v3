import bookingEndpoint from "./functions/booking.mts";
import { previewEmail } from "./lib/message-store";
import {
  beforeAll,
  beforeEach,
  afterAll,
  afterEach,
  describe,
  it,
  expect,
  vi,
} from "vitest";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { encrypt, decrypt } from "./lib/integrations/crypto";
import {
  MICROSOFT_SCOPES,
  beginMicrosoftOAuth,
  consumeMicrosoftState,
  exchangeMicrosoftCode,
  microsoftAccess,
  microsoftConnection,
} from "./lib/integrations/microsoft-auth";
import { calendarProvider } from "./lib/integrations/calendar";
import {
  BOOKING_PROPERTY,
  clearBusyCache,
} from "./lib/integrations/outlook-calendar";
const calendarBusy = calendarProvider.getAvailability;
import { syncBooking } from "./lib/integrations/sync";
import {
  integrationSettings,
  selectCalendar,
  disconnectOutlook,
  testIntegration,
} from "./lib/integrations/settings";
import { joinUrl } from "./lib/integrations/zoom";
import { createInquiry, listInquiryActivity } from "./lib/inquiry-store";
import { createInquiryBookingLink } from "./lib/booking-links";
import {
  book,
  publicBookingPage,
  publicSlots,
  getInquiryBooking,
  changeAdminBooking,
  changePublicBooking,
} from "./lib/booking-store";
import { calendarDate, bookingInputSchema } from "../src/lib/bookings/contract";
import admin from "./functions/admin-integrations.mts";
import callback from "./functions/microsoft-calendar-oauth-callback.mts";
const mocks = vi.hoisted(() => ({
  query: vi.fn(),
  user: vi.fn(),
  fetch: vi.fn(),
}));
vi.mock("@neondatabase/serverless", () => ({
  neon: () => ({ query: mocks.query }),
}));
vi.mock("@netlify/identity", () => ({ getUser: mocks.user }));
let db: PGlite;
const events = new Map<string, Record<string, unknown>>(),
  meetings = new Map<string, Record<string, unknown>>();
let outlookBlocks: { start: string; end: string }[] = [],
  outlookFailure = "",
  zoomFailure = "",
  refreshFailure = false,
  meetingCounter = 10000000000;
const response = (data: unknown, status = 200) =>
  new Response(status === 204 ? null : JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
async function provider(url: string, init: RequestInit = {}) {
  const u = new URL(url),
    method = init.method || "GET",
    body = init.body
      ? JSON.parse(
          typeof init.body === "string" &&
            String(init.headers).includes("never")
            ? "{}"
            : typeof init.body === "string"
              ? init.body
              : "{}",
        )
      : {};
  if (u.pathname === "/oauth/token" && u.hostname === "zoom.us")
    return response({ access_token: "zoom-synthetic-token", expires_in: 3600 });
  if (u.hostname === "graph.microsoft.com") {
    if (u.pathname === "/v1.0/me")
      return response({
        id: "account-one",
        displayName: "Owner",
        mail: "owner@example.test",
        userPrincipalName: "owner@example.test",
      });
    if (u.pathname === "/v1.0/me/calendars")
      return response({
        value: [
          {
            id: "primary",
            name: "Primary",
            isDefaultCalendar: true,
            canEdit: true,
          },
          { id: "business", name: "Business", canEdit: true },
          { id: "read-only", name: "Read only", canEdit: false },
        ],
      });
    if (u.pathname.endsWith("/calendarView")) {
      if (outlookFailure === "busy") return response({}, 503);
      return response({
        value: [
          ...[...events.values()].map(
            ({ id, start, end, showAs, isCancelled }) => ({
              id,
              start,
              end,
              showAs,
              isCancelled,
            }),
          ),
          ...outlookBlocks.map((b) => ({
            id: crypto.randomUUID(),
            showAs: "busy",
            start: { dateTime: b.start, timeZone: "UTC" },
            end: { dateTime: b.end, timeZone: "UTC" },
          })),
        ],
      });
    }
    if (u.pathname.includes("/events")) {
      const id = decodeURIComponent(u.pathname.split("/events/")[1] || "");
      if (method === "GET" && !id) {
        const filter = u.searchParams.get("$filter") || "";
        return response({
          value: [...events.values()].filter(
            (e) =>
              Array.isArray(e.singleValueExtendedProperties) &&
              e.singleValueExtendedProperties.some((p: any) =>
                filter.includes(p.value),
              ) &&
              e.isCancelled !== true,
          ),
        });
      }
      if (method === "GET")
        return events.has(id) ? response(events.get(id)) : response({}, 404);
      if (outlookFailure === "sync") return response({}, 503);
      if (method === "DELETE") {
        events.delete(id);
        return response(null, 204);
      }
      if (method === "PATCH") {
        if (!events.has(id)) return response({}, 404);
        events.set(id, { ...events.get(id), ...body });
        return response(events.get(id));
      }
      const prior = [...events.values()].find(
        (e) => e.transactionId === body.transactionId,
      );
      if (prior) return response(prior);
      const event = {
        ...body,
        attendees: [],
        isOrganizer: true,
        id: "outlook-" + crypto.randomUUID(),
      };
      events.set(event.id, event);
      if (outlookFailure === "ambiguous")
        throw Error("Transport ended after Graph accepted creation");
      const { singleValueExtendedProperties: _properties, ...created } = event;
      return response(created, 201);
    }
  }
  if (u.hostname === "api.zoom.us") {
    const id = u.pathname.split("/meetings/")[1];
    if (method === "GET" && !id)
      return response({ meetings: [...meetings.values()] });
    if (method === "GET")
      return meetings.has(id!)
        ? response(meetings.get(id!))
        : response({}, 404);
    if (zoomFailure === "sync") return response({}, 503);
    if (method === "PATCH") {
      if (!meetings.has(id!)) return response({}, 404);
      meetings.set(id!, { ...meetings.get(id!), ...body });
      return response(null, 204);
    }
    if (method === "DELETE") {
      meetings.delete(id!);
      return response(null, 204);
    }
    const meeting = {
      ...body,
      id: String(++meetingCounter),
      join_url:
        "https://example.zoom.us/j/" + meetingCounter + "?pwd=synthetic",
      start_url: "SECRET-HOST-URL",
    };
    meetings.set(meeting.id, meeting);
    if (zoomFailure === "ambiguous")
      throw new Error("transport ended after acceptance");
    return response(meeting);
  }
  throw new Error("Unexpected mocked provider URL");
}
beforeAll(async () => {
  db = new PGlite();
  for (const name of [
    "001_create_inquiries",
    "002_create_inquiry_activity",
    "003_add_follow_up_fields",
    "004_create_proposals",
    "005_create_inquiry_messages",
    "006_create_bookings",
    "007_create_integrations",
    "008_outlook_calendar_integration",
    "009_create_invoices",
  ])
    await db.exec(readFileSync("database/migrations/" + name + ".sql", "utf8"));
}, 30000);
afterAll(() => db.close());
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
beforeEach(async () => {
  await db.exec(
    "TRUNCATE invoice_items,invoices,integration_connections,integration_oauth_states,bookings,booking_links,inquiry_messages,proposal_items,proposals,inquiry_activity,inquiries; DELETE FROM booking_exceptions; UPDATE booking_availability SET enabled=true,start_time='09:00',end_time='17:00';UPDATE booking_settings SET timezone='America/New_York',slot_duration_minutes=30,minimum_notice_hours=1,horizon_days=60,buffer_minutes=0,updated_at=clock_timestamp();",
  );
  vi.resetAllMocks();
  mocks.query.mockImplementation(
    async (s: string, v: unknown[] = []) => (await db.query(s, v)).rows,
  );
  mocks.user.mockResolvedValue({ roles: ["admin"] });
  for (const [k, v] of Object.entries({
    DATABASE_URL: "postgresql://isolated",
    SITE_URL: "https://site.example.test",
    BOOKING_TOKEN_SECRET: "ab".repeat(32),
    INTEGRATION_ENCRYPTION_KEY: "cd".repeat(32),
    MICROSOFT_CLIENT_ID: "test-client",
    MICROSOFT_CLIENT_SECRET: "test-secret",
    MICROSOFT_REDIRECT_URI: "",
    MICROSOFT_TENANT_ID: "",
    ZOOM_ACCOUNT_ID: "test-account",
    ZOOM_CLIENT_ID: "zoom-client",
    ZOOM_CLIENT_SECRET: "zoom-secret",
    ZOOM_USER_ID: "host@example.test",
  }))
    vi.stubEnv(k, v);
  clearBusyCache();
  events.clear();
  meetings.clear();
  outlookBlocks = [];
  outlookFailure = "";
  zoomFailure = "";
  refreshFailure = false;
  mocks.fetch.mockImplementation(
    async (url: string, init: RequestInit = {}) => {
      // Form token bodies are not JSON.
      if (url.includes("login.microsoftonline.com/common/oauth2/v2.0/token"))
        return refreshFailure
          ? response({ error: "invalid_grant" }, 400)
          : response({
              access_token: "microsoft-synthetic-access",
              refresh_token: "microsoft-synthetic-refresh",
              expires_in: 3600,
              scope: MICROSOFT_SCOPES.join(" "),
            });
      if (url.includes("zoom.us/oauth/token"))
        return response({
          access_token: "zoom-synthetic-token",
          expires_in: 3600,
        });
      if (url.includes("/revoke")) return response({});
      return provider(url, init);
    },
  );
  vi.stubGlobal("fetch", mocks.fetch);
});
async function connect() {
  await exchangeMicrosoftCode("code", {
    verifier: "synthetic-verifier",
    redirectUri:
      "https://site.example.test/.netlify/functions/microsoft-calendar-oauth-callback",
  });
  mocks.fetch.mockClear();
}
async function ready() {
  const inquiryId = await createInquiry(
    {
      name: "Client",
      email: "client@example.test",
      company: "Client Co",
      website: "",
      projectType: "website",
      projectStage: "new",
      projectSummary: "A complete and private inquiry summary.",
      helpNeeded: "",
      budgetRange: "unsure",
      timeline: "flexible",
    } as never,
    crypto.randomUUID(),
  );
  const link = await createInquiryBookingLink(inquiryId),
    token = new URL(link.url).pathname.split("/")[2],
    page = await publicBookingPage(token),
    slots = await publicSlots(token, page.dates[0].date);
  const payload = bookingInputSchema.parse({
    action: "book",
    meetingType: "phone",
    startAt: slots.slots[0].startAt,
    clientName: "Client",
    clientEmail: "client@example.test",
    clientPhone: "+14015456860",
    clientNotes: "PRIVATE NOTES",
    requestKey: crypto.randomUUID(),
    confirmed: true,
  });
  return { inquiryId, token, payload };
}
async function reservation(zoom = false) {
  const r = await ready();
  const booking = await book(r.token, {
    ...r.payload,
    meetingType: zoom ? "zoom" : "phone",
  });
  const admin = (await getInquiryBooking(r.inquiryId)).booking!;
  return { ...r, booking, admin };
}
const request = (body?: unknown, origin = "https://site.example.test") =>
  new Request("https://site.example.test/api/admin/integrations", {
    method: body ? "POST" : "GET",
    headers: { Origin: origin, "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
const providerCalls = (part: string, method = "POST") =>
  mocks.fetch.mock.calls.filter(
    ([u, i]) => String(u).includes(part) && (i?.method || "GET") === method,
  );
describe("Outlook OAuth, encryption and protected integration settings", () => {
  it("encrypts with random nonces, authenticated purpose and tamper protection", () => {
    const a = encrypt("sensitive-refresh", "microsoft-refresh"),
      b = encrypt("sensitive-refresh", "microsoft-refresh");
    expect(a).not.toBe(b);
    expect(a).not.toContain("sensitive-refresh");
    expect(decrypt(a, "microsoft-refresh")).toBe("sensitive-refresh");
    expect(() => decrypt(a, "microsoft-access")).toThrow();
    expect(() =>
      decrypt(a.slice(0, -3) + "abc", "microsoft-refresh"),
    ).toThrow();
  });
  it("validates the encryption key without leaking values", () => {
    vi.stubEnv("INTEGRATION_ENCRYPTION_KEY", "sensitive-bad-key");
    expect(() => encrypt("token", "microsoft-refresh")).toThrow("Configure");
  });
  it("builds offline minimal-scope OAuth with PKCE and a secure browser cookie", async () => {
    const a = await beginMicrosoftOAuth(),
      url = new URL(a.url);
    expect(url.origin).toBe("https://login.microsoftonline.com");
    expect(url.pathname).toBe("/common/oauth2/v2.0/authorize");
    expect(url.searchParams.get("scope")).toBe(MICROSOFT_SCOPES.join(" "));
    expect(url.searchParams.get("code_challenge_method")).toBe("S256");
    expect(a.cookie).toContain("HttpOnly; Secure; SameSite=Lax");
    expect(url.href).not.toContain("test-secret");
  });
  it("requires state plus matching browser, expires, and consumes once", async () => {
    const a = await beginMicrosoftOAuth(),
      state = new URL(a.url).searchParams.get("state")!,
      browser = a.cookie.split(";")[0].split("=")[1];
    await expect(
      consumeMicrosoftState(state, "x".repeat(43)),
    ).rejects.toMatchObject({ status: 400 });
    expect((await consumeMicrosoftState(state, browser)).verifier).toBeTruthy();
    await expect(consumeMicrosoftState(state, browser)).rejects.toMatchObject({
      status: 400,
    });
    const b = await beginMicrosoftOAuth();
    await db.exec(
      "UPDATE integration_oauth_states SET expires_at=clock_timestamp()-interval '1 second'",
    );
    await expect(
      consumeMicrosoftState(
        new URL(b.url).searchParams.get("state")!,
        b.cookie.split(";")[0].split("=")[1],
      ),
    ).rejects.toMatchObject({ status: 400 });
  });
  it("callback exchanges only valid browser-bound one-time state and redirects safely", async () => {
    const a = await beginMicrosoftOAuth(),
      state = new URL(a.url).searchParams.get("state")!;
    const r = await callback(
      new Request(
        "https://site.example.test/.netlify/functions/microsoft-calendar-oauth-callback?code=test&state=" +
          state,
        { headers: { Cookie: a.cookie.split(";")[0] } },
      ),
      {} as never,
    );
    expect(r.status).toBe(303);
    expect(r.headers.get("location")).toContain("?outlook=connected");
    expect((await microsoftConnection())?.status).toBe("connected");
    const replay = await callback(
      new Request(
        "https://site.example.test/.netlify/functions/microsoft-calendar-oauth-callback?code=test&state=" +
          state,
        { headers: { Cookie: a.cookie.split(";")[0] } },
      ),
      {} as never,
    );
    expect(replay.headers.get("location")).toContain("?outlook=failed");
  });
  it("rejects a mismatched callback origin configuration", async () => {
    vi.stubEnv(
      "MICROSOFT_REDIRECT_URI",
      "https://attacker.test/.netlify/functions/microsoft-calendar-oauth-callback",
    );
    await expect(beginMicrosoftOAuth()).rejects.toMatchObject({ status: 503 });
  });
  it("stores encrypted tokens, and the admin DTO contains no tokens or secrets", async () => {
    await connect();
    const row = await microsoftConnection();
    expect(row?.encrypted_refresh_token).not.toContain(
      "microsoft-synthetic-refresh",
    );
    expect(
      decrypt(String(row?.encrypted_refresh_token), "microsoft-refresh"),
    ).toBe("microsoft-synthetic-refresh");
    const data = JSON.stringify(await integrationSettings());
    for (const v of [
      "encrypted",
      "test-secret",
      "microsoft-synthetic-access",
      "microsoft-synthetic-refresh",
    ])
      expect(data).not.toContain(v);
  });
  it("refreshes an expired token and persists the encrypted replacement", async () => {
    await connect();
    await db.exec(
      "UPDATE integration_connections SET token_expires_at=clock_timestamp()-interval '1 minute'",
    );
    expect(await microsoftAccess((await microsoftConnection())!)).toBe(
      "microsoft-synthetic-access",
    );
    expect(
      providerCalls("login.microsoftonline.com/common/oauth2/v2.0/token"),
    ).toHaveLength(1);
  });
  it("marks invalid_grant reconnect required while transient failures keep connection", async () => {
    await connect();
    await db.exec(
      "UPDATE integration_connections SET token_expires_at=clock_timestamp()-interval '1 minute'",
    );
    refreshFailure = true;
    await expect(
      microsoftAccess((await microsoftConnection())!),
    ).rejects.toMatchObject({ code: "reconnect_required" });
    expect((await microsoftConnection())?.status).toBe("reconnect_required");
  });
  it("selects only writable calendars and retains original per-booking targets", async () => {
    await connect();
    await expect(selectCalendar("read-only")).rejects.toMatchObject({
      code: "calendar_missing",
    });
    await selectCalendar("business");
    expect((await microsoftConnection())?.selected_calendar_id).toBe(
      "business",
    );
  });
  it("disconnect clears credentials, keeps bookings and external events", async () => {
    await connect();
    const r = await reservation();
    await disconnectOutlook();
    expect((await microsoftConnection())?.encrypted_refresh_token).toBeNull();
    expect((await getInquiryBooking(r.inquiryId)).booking?.status).toBe(
      "scheduled",
    );
    expect(events.size).toBe(1);
  });
  it("authenticates admin before database/provider access and rejects cross-origin mutations", async () => {
    mocks.user.mockResolvedValue(null);
    expect(
      (await admin(request({ action: "connect" }), {} as never)).status,
    ).toBe(401);
    expect(mocks.query).not.toHaveBeenCalled();
    mocks.user.mockResolvedValue({ roles: ["client"] });
    expect((await admin(request(), {} as never)).status).toBe(403);
    mocks.user.mockResolvedValue({ roles: ["admin"] });
    expect(
      (
        await admin(
          request(
            { action: "disconnect", confirmed: true },
            "https://evil.test",
          ),
          {} as never,
        )
      ).status,
    ).toBe(403);
  });
  it("tests both connections without creating events or meetings", async () => {
    await connect();
    await testIntegration("outlook_calendar");
    await testIntegration("zoom");
    expect(events.size).toBe(0);
    expect(meetings.size).toBe(0);
  });
});
describe("busy blocking, source-of-truth sync and reconciliation", () => {
  it("batches calendarView and caches for one minute while final revalidation bypasses it", async () => {
    await connect();
    const r = await ready();
    const calls = providerCalls("/calendarView", "GET").length;
    await publicSlots(
      r.token,
      calendarDate(r.payload.startAt, "America/New_York"),
    );
    expect(providerCalls("/calendarView", "GET")).toHaveLength(calls);
    outlookBlocks = [
      {
        start: r.payload.startAt,
        end: new Date(Date.parse(r.payload.startAt) + 1800000).toISOString(),
      },
    ];
    await expect(book(r.token, r.payload)).rejects.toMatchObject({
      status: 409,
    });
    expect((await db.query("SELECT * FROM bookings")).rows).toHaveLength(0);
  });
  it("fails conservatively on unknown calendarView but retains current summary/cancellation", async () => {
    await connect();
    const r = await reservation();
    outlookFailure = "busy";
    clearBusyCache();
    const page = await publicBookingPage(r.token);
    expect(page.booking?.status).toBe("scheduled");
    expect(page.dates).toEqual([]);
    expect(page.availabilityMessage).toContain("temporarily unavailable");
    expect(
      (
        await changePublicBooking(r.token, {
          action: "cancel",
          expectedStartAt: r.booking.startAt,
          confirmed: true,
        })
      ).status,
    ).toBe("cancelled");
  });
  it("a Outlook API failure never undoes a committed Neon booking", async () => {
    await connect();
    const r = await ready();
    outlookFailure = "sync";
    await book(r.token, r.payload);
    const b = (await getInquiryBooking(r.inquiryId)).booking!;
    expect(b.status).toBe("scheduled");
    expect(b.calendarSync.status).toBe("failed");
    expect(
      (await listInquiryActivity(r.inquiryId)).filter(
        (a) => a.type === "booking_scheduled",
      ),
    ).toHaveLength(1);
  });
  it("creates the event with private metadata and safe client context, without attendees", async () => {
    await connect();
    const r = await reservation();
    const event = [...events.values()][0];
    expect({
      state: r.admin.calendarSync,
      urls: mocks.fetch.mock.calls.map((c) => c[0]),
    }).toMatchObject({ state: { status: "synced" } });
    expect(event.subject).toBe("Volatile Solutions — Discovery Call — Client");
    expect(event.attendees).toEqual([]);
    expect(
      JSON.parse(providerCalls("/events")[0][1].body).attendees,
    ).toBeUndefined();
    expect((event.body as { content: string }).content).toContain("Client Co");
    expect(JSON.stringify(event)).not.toContain("PRIVATE NOTES");
    expect(event.singleValueExtendedProperties).toEqual([
      { id: BOOKING_PROPERTY, value: r.admin.id + ":" + r.inquiryId },
    ]);
  });
  it("same booking retry reconciles without duplicate events or activity", async () => {
    await connect();
    const r = await reservation();
    await syncBooking(r.admin.id);
    await syncBooking(r.admin.id);
    expect(events.size).toBe(1);
    expect(providerCalls("/events")).toHaveLength(1);
  });
  it("simultaneous sync retries are serialized by the persisted lease", async () => {
    await connect();
    const r = await reservation(true);
    mocks.fetch.mockClear();
    await Promise.all([syncBooking(r.admin.id), syncBooking(r.admin.id)]);
    expect(events.size).toBe(1);
    expect(meetings.size).toBe(1);
    expect(providerCalls("/meetings")).toHaveLength(0);
  });
  it("recreates a missing owned Outlook event without a second visible event", async () => {
    await connect();
    const r = await reservation();
    events.clear();
    await syncBooking(r.admin.id);
    expect(events.size).toBe(1);
    expect(
      (await getInquiryBooking(r.inquiryId)).booking?.calendarSync.status,
    ).toBe("synced");
  });
  it("reschedule excludes its own Outlook event but preserves an overlapping personal event", async () => {
    await connect();
    const r = await reservation(),
      date = calendarDate(r.booking.startAt, "America/New_York");
    outlookBlocks = [{ start: r.booking.startAt, end: r.booking.endAt }];
    const slots = await publicSlots(r.token, date);
    expect(slots.slots.some((s) => s.startAt === r.booking.startAt)).toBe(
      false,
    );
    outlookBlocks = [];
    const free = await publicSlots(r.token, date);
    expect(free.slots.some((s) => s.startAt === r.booking.startAt)).toBe(true);
  });
  it("reschedules existing event and meeting, preserving the Neon result on sync failure", async () => {
    await connect();
    const r = await reservation(true),
      slots = await publicSlots(
        r.token,
        calendarDate(r.booking.startAt, "America/New_York"),
      ),
      next = slots.slots.find((s) => s.startAt !== r.booking.startAt)!;
    outlookFailure = "sync";
    zoomFailure = "sync";
    const b = await changeAdminBooking({
      action: "reschedule",
      id: r.admin.id,
      updatedAt: r.admin.updatedAt,
      startAt: next.startAt,
      confirmed: true,
    });
    expect(b.startAt).toBe(next.startAt);
    expect(b.calendarSync.status).toBe("failed");
    expect(b.zoomSync.status).toBe("failed");
    outlookFailure = "";
    zoomFailure = "";
    await syncBooking(b.id);
    expect(events.size).toBe(1);
    expect(meetings.size).toBe(1);
    expect([...meetings.values()][0].start_time).toBe(next.startAt);
  });
  it("cancellation survives provider failures and retry deletes owned event/meeting", async () => {
    await connect();
    const r = await reservation(true);
    outlookFailure = "sync";
    zoomFailure = "sync";
    const b = await changeAdminBooking({
      action: "cancel",
      id: r.admin.id,
      updatedAt: r.admin.updatedAt,
      confirmed: true,
    });
    expect(b.status).toBe("cancelled");
    expect(b.calendarSync.status).toBe("failed");
    outlookFailure = "";
    zoomFailure = "";
    await syncBooking(b.id);
    expect(events.size).toBe(0);
    expect(meetings.size).toBe(0);
  });
  it("phone booking never contacts Zoom", async () => {
    await connect();
    const r = await reservation();
    expect(r.admin.zoomSync.status).toBe("not_required");
    expect(
      mocks.fetch.mock.calls.some(([u]) => String(u).includes("zoom.us")),
    ).toBe(false);
  });
  it("Zoom stores only the meeting ID and client-safe join URL, never host URL", async () => {
    await connect();
    const r = await reservation(true);
    expect(r.booking.zoomJoinUrl).toMatch(/^https:\/\/example.zoom.us\/j\//);
    expect(JSON.stringify(r)).not.toContain("SECRET-HOST-URL");
    const row = (await db.query("SELECT * FROM bookings")).rows[0];
    expect(JSON.stringify(row)).not.toContain("SECRET-HOST-URL");
    expect([...meetings.values()][0]).toMatchObject({
      settings: { waiting_room: true, auto_recording: "none" },
    });
  });
  it("ambiguous Zoom POST reconciles the accepted meeting instead of creating twice", async () => {
    await connect();
    zoomFailure = "ambiguous";
    const r = await reservation(true);
    expect(r.admin.zoomSync.status).toBe("failed");
    expect(meetings.size).toBe(1);
    zoomFailure = "";
    await syncBooking(r.admin.id);
    expect(meetings.size).toBe(1);
    expect(providerCalls("/meetings")).toHaveLength(1);
    expect(
      (await getInquiryBooking(r.inquiryId)).booking?.zoomSync.status,
    ).toBe("synced");
  });
  it("uncertain Zoom creation without a discoverable meeting never blindly repeats POST", async () => {
    await connect();
    zoomFailure = "sync";
    const r = await reservation(true);
    zoomFailure = "";
    await syncBooking(r.admin.id);
    expect(meetings.size).toBe(0);
    expect(providerCalls("/meetings")).toHaveLength(1);
    expect(
      (await getInquiryBooking(r.inquiryId)).booking?.zoomSync.error,
    ).toContain("unconfirmed");
  });
  it("rejects host/start and non-Zoom URLs and unsupported provider data", () => {
    for (const url of [
      "https://evil.test/j/123456789",
      "http://zoom.us/j/123456789",
      "https://zoom.us/s/123456789",
    ])
      expect(() => joinUrl(url)).toThrow();
  });
  it("the existing DB conflict guarantee remains authoritative under simultaneous booking", async () => {
    await connect();
    const a = await ready(),
      b = await ready();
    const results = await Promise.allSettled([
      book(a.token, a.payload),
      book(b.token, { ...b.payload, startAt: a.payload.startAt }),
    ]);
    expect(results.filter((v) => v.status === "fulfilled")).toHaveLength(1);
    expect((await db.query("SELECT * FROM bookings")).rows).toHaveLength(1);
  });
});

describe("integration edge cases and privacy regressions", () => {
  it("refuses OAuth without a refresh token or all required scopes", async () => {
    mocks.fetch.mockImplementationOnce(async () =>
      response({
        access_token: "test",
        expires_in: 3600,
        scope: MICROSOFT_SCOPES.join(" "),
      }),
    );
    await expect(
      exchangeMicrosoftCode("code", {
        verifier: "test",
        redirectUri:
          "https://site.example.test/.netlify/functions/microsoft-calendar-oauth-callback",
      }),
    ).rejects.toMatchObject({ code: "reconnect_required" });
    expect(await microsoftConnection()).toBeNull();
  });
  it("refresh grant can omit scope and refresh token without losing the original token", async () => {
    await connect();
    await db.exec(
      "UPDATE integration_connections SET token_expires_at=clock_timestamp()-interval '1 minute'",
    );
    mocks.fetch.mockImplementationOnce(async () =>
      response({ access_token: "replacement", expires_in: 3600 }),
    );
    expect(await microsoftAccess((await microsoftConnection())!)).toBe(
      "replacement",
    );
    expect(
      decrypt(
        String((await microsoftConnection())?.encrypted_refresh_token),
        "microsoft-refresh",
      ),
    ).toBe("microsoft-synthetic-refresh");
  });
  it("refreshes once if Calendar rejects an access token before its recorded expiration", async () => {
    await connect();
    let first = true;
    const old = mocks.fetch.getMockImplementation()!;
    mocks.fetch.mockImplementation(async (u: string, i: RequestInit) => {
      if (u.includes("/me/calendars?") && first) {
        first = false;
        return response({}, 401);
      }
      return old(u, i);
    });
    expect((await integrationSettings()).outlook.status).toBe("connected");
    expect(
      providerCalls("login.microsoftonline.com/common/oauth2/v2.0/token"),
    ).toHaveLength(1);
  });
  it("a transient refresh outage does not mark reconnect required", async () => {
    await connect();
    await db.exec(
      "UPDATE integration_connections SET token_expires_at=clock_timestamp()-interval '1 minute'",
    );
    mocks.fetch.mockImplementationOnce(async () =>
      response({ error: "sensitive provider detail" }, 503),
    );
    await expect(
      microsoftAccess((await microsoftConnection())!),
    ).rejects.toMatchObject({ code: "provider_unavailable" });
    expect((await microsoftConnection())?.status).toBe("connected");
  });
  it("partial calendarView calendar errors block scheduling rather than masquerading as free", async () => {
    await connect();
    const old = mocks.fetch.getMockImplementation()!;
    mocks.fetch.mockImplementation(async (u: string, i: RequestInit) =>
      u.includes("calendarView")
        ? response({ error: { code: "ErrorAccessDenied" } }, 403)
        : old(u, i),
    );
    await expect(
      calendarBusy("2026-10-10T00:00:00Z", "2026-10-11T00:00:00Z", true),
    ).rejects.toMatchObject({ code: "provider_rejected" });
  });
  it("all-day and transparent personal events behave correctly while excluding the owned event", async () => {
    await connect();
    const r = await reservation();
    const date = calendarDate(r.booking.startAt, "America/New_York"),
      dayEnd = new Date(date + "T00:00:00Z");
    dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);
    const old = mocks.fetch.getMockImplementation()!;
    mocks.fetch.mockImplementation(async (u: string, i: RequestInit) =>
      u.includes("/calendarView?")
        ? response({
            value: [
              ...events.values(),
              {
                id: "personal",
                showAs: "busy",
                start: { dateTime: date + "T04:00:00", timeZone: "UTC" },
                end: {
                  dateTime: dayEnd.toISOString().slice(0, 10) + "T04:00:00",
                  timeZone: "UTC",
                },
              },
              {
                id: "transparent",
                showAs: "free",
                start: { dateTime: date + "T04:00:00", timeZone: "UTC" },
                end: {
                  dateTime: dayEnd.toISOString().slice(0, 10) + "T04:00:00",
                  timeZone: "UTC",
                },
              },
            ],
          })
        : old(u, i),
    );
    expect((await publicSlots(r.token, date)).slots).toEqual([]);
  });
  it("malformed busy data fails conservatively", async () => {
    await connect();
    const old = mocks.fetch.getMockImplementation()!;
    mocks.fetch.mockImplementation(async (u: string, i: RequestInit) =>
      u.includes("calendarView")
        ? response({
            value: [
              {
                id: "bad",
                showAs: "busy",
                start: { dateTime: "bad", timeZone: "UTC" },
                end: { dateTime: "bad", timeZone: "UTC" },
              },
            ],
          })
        : old(u, i),
    );
    await expect(
      calendarBusy("2026-10-10T00:00:00Z", "2026-10-11T00:00:00Z", true),
    ).rejects.toMatchObject({ code: "invalid_response" });
  });
  it("ambiguous Outlook POST reconciles the accepted event before attempting any new creation", async () => {
    await connect();
    outlookFailure = "ambiguous";
    const r = await reservation();
    expect(r.admin.calendarSync.status).toBe("failed");
    expect(events.size).toBe(1);
    outlookFailure = "";
    await syncBooking(r.admin.id);
    expect(events.size).toBe(1);
    expect(providerCalls("/events")).toHaveLength(1);
    expect(
      (await getInquiryBooking(r.inquiryId)).booking?.calendarSync.status,
    ).toBe("synced");
  });
  it("definite Zoom 429 rejection permits a later safe creation retry", async () => {
    await connect();
    const r = await ready();
    let fail = true;
    const old = mocks.fetch.getMockImplementation()!;
    mocks.fetch.mockImplementation(async (u: string, i: RequestInit) =>
      u.includes("/meetings") && i.method === "POST" && fail
        ? response({}, 429)
        : old(u, i),
    );
    await book(r.token, { ...r.payload, meetingType: "zoom" });
    const b = (await getInquiryBooking(r.inquiryId)).booking!;
    expect(b.zoomSync.status).toBe("failed");
    fail = false;
    await syncBooking(b.id);
    expect(meetings.size).toBe(1);
    expect(
      (await getInquiryBooking(r.inquiryId)).booking?.zoomSync.status,
    ).toBe("synced");
  });
  it("manual Outlook deletion permits a new transaction generation", async () => {
    await connect();
    const r = await reservation();
    const event = [...events.values()][0];
    events.set(String(event.id), { ...event, isCancelled: true });
    await syncBooking(r.admin.id);
    expect(
      [...events.values()].filter((v) => v.isCancelled !== true),
    ).toHaveLength(1);
    expect(
      (
        await db.query<{ calendar_event_generation: number }>(
          "SELECT calendar_event_generation FROM bookings",
        )
      ).rows[0].calendar_event_generation,
    ).toBe(1);
  });
  it("a definitive missing Zoom meeting permits replacement and update uses stored IDs", async () => {
    await connect();
    const r = await reservation(true);
    meetings.clear();
    await syncBooking(r.admin.id);
    expect(meetings.size).toBe(1);
    expect(providerCalls("/meetings")).toHaveLength(2);
    await syncBooking(r.admin.id);
    expect(providerCalls("/meetings")).toHaveLength(2);
  });
  it("completed calls preserve external history and do not issue create/update/delete", async () => {
    await connect();
    const r = await reservation(true);
    await db.exec(
      "UPDATE bookings SET start_at=clock_timestamp()-interval '1 hour',end_at=clock_timestamp()-interval '30 minutes',busy_until=clock_timestamp()-interval '30 minutes'",
    );
    const b = (await getInquiryBooking(r.inquiryId)).booking!;
    mocks.fetch.mockClear();
    await changeAdminBooking({
      action: "complete",
      id: b.id,
      updatedAt: b.updatedAt,
      confirmed: true,
    });
    expect(events.size).toBe(1);
    expect(meetings.size).toBe(1);
    expect(
      mocks.fetch.mock.calls.some(([, i]) =>
        ["POST", "PATCH", "DELETE"].includes(i?.method || ""),
      ),
    ).toBe(true); // Only token acquisition may POST.
    expect(
      mocks.fetch.mock.calls.filter(
        ([u, i]) =>
          !String(u).includes("/oauth/token") &&
          ["POST", "PATCH", "DELETE"].includes(i?.method || ""),
      ),
    ).toHaveLength(0);
  });
  it("calendar selection affects new bookings while retries preserve the previous target", async () => {
    await connect();
    const r = await reservation();
    await selectCalendar("business");
    await syncBooking(r.admin.id);
    const row = (
      await db.query<{ calendar_id: string }>(
        "SELECT calendar_id FROM bookings WHERE id=$1",
        [r.admin.id],
      )
    ).rows[0];
    expect(row.calendar_id).toBe("primary");
  });
  it("reconnecting to another account does not mutate an old account event", async () => {
    await connect();
    const r = await reservation();
    await db.exec(
      "UPDATE integration_connections SET account_id='account-two'",
    );
    mocks.fetch.mockClear();
    await syncBooking(r.admin.id);
    expect(
      (await getInquiryBooking(r.inquiryId)).booking?.calendarSync.error,
    ).toContain("previous provider account");
    expect(
      mocks.fetch.mock.calls.filter(([u]) =>
        String(u).includes("graph.microsoft.com"),
      ),
    ).toHaveLength(0);
  });
  it("provider credential errors are sanitized in public/admin boundaries", async () => {
    await connect();
    const r = await reservation(true);
    const publicJson = JSON.stringify(await publicBookingPage(r.token));
    for (const key of [
      "calendarSync",
      "zoomSync",
      "calendar_event_id",
      "zoom_meeting_id",
      "encrypted",
      "SECRET-HOST",
      "private",
      "inquiryId",
    ])
      expect(publicJson).not.toContain(key);
  });
  it("sync-only writes preserve CRM stale-edit version and activity", async () => {
    await connect();
    const r = await reservation(true),
      before = await listInquiryActivity(r.inquiryId);
    await syncBooking(r.admin.id);
    expect((await getInquiryBooking(r.inquiryId)).booking?.updatedAt).toBe(
      r.admin.updatedAt,
    );
    expect(await listInquiryActivity(r.inquiryId)).toEqual(before);
  });
  it("a booking edited during sync stays pending until the new revision reconciles", async () => {
    await connect();
    const r = await reservation();
    let changed = false;
    const old = mocks.fetch.getMockImplementation()!;
    mocks.fetch.mockImplementation(async (u: string, i: RequestInit) => {
      if (!changed && u.includes("/events/") && i.method === "PATCH") {
        changed = true;
        await db.query(
          "UPDATE bookings SET start_at=start_at+interval '1 hour',end_at=end_at+interval '1 hour',busy_until=busy_until+interval '1 hour' WHERE id=$1",
          [r.admin.id],
        );
      }
      return old(u, i);
    });
    await syncBooking(r.admin.id);
    expect(
      (await getInquiryBooking(r.inquiryId)).booking?.calendarSync.status,
    ).toBe("pending");
    await syncBooking(r.admin.id);
    expect(
      (await getInquiryBooking(r.inquiryId)).booking?.calendarSync.status,
    ).toBe("synced");
  });
  it("failure saving external outcomes leaves the valid booking pending for reconciliation", async () => {
    await connect();
    const r = await ready(),
      old = mocks.query.getMockImplementation()!;
    mocks.query.mockImplementation(async (sql: string, v: unknown[]) => {
      if (sql.includes("calendar_sync_status=CASE"))
        throw Error("synthetic persistence outage");
      return old(sql, v);
    });
    expect((await book(r.token, r.payload)).status).toBe("scheduled");
    expect(
      (await getInquiryBooking(r.inquiryId)).booking?.calendarSync.status,
    ).toBe("pending");
  });
});

describe("background sync and communication readiness", () => {
  it("Netlify returns the committed booking and registers a background sync continuation", async () => {
    await connect();
    const r = await ready();
    let work: Promise<unknown> | undefined;
    const result = await bookingEndpoint(
      new Request("https://site.example.test/api/booking?token=" + r.token, {
        method: "POST",
        headers: {
          Origin: "https://site.example.test",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(r.payload),
      }),
      {
        waitUntil: (p: Promise<unknown>) => {
          work = p;
        },
      } as never,
    );
    expect(result.status).toBe(200);
    expect((await result.json()).booking.status).toBe("scheduled");
    expect(work).toBeDefined();
    await work;
    expect(
      (await getInquiryBooking(r.inquiryId)).booking?.calendarSync.status,
    ).toBe("synced");
  });
  it("explicit booking mail shows Join Zoom only when its current Zoom meeting is ready", async () => {
    await connect();
    const r = await reservation(true);
    vi.stubEnv("EMAIL_FROM", "hello@example.test");
    vi.stubEnv("EMAIL_REPLY_TO", "reply@example.test");
    const input = {
      to: "client@example.test",
      subject: "Your call",
      message: "Your discovery call details are ready.",
      templateKey: "personal",
      includeProposal: false,
      includeBooking: true,
    } as const;
    const readyMail = await previewEmail(r.inquiryId, input);
    expect(readyMail.bodyHtml).toContain("Join Zoom");
    expect(readyMail.bodyHtml).not.toContain("SECRET-HOST-URL");
    await db.exec("UPDATE bookings SET zoom_sync_status='failed'");
    const waiting = await previewEmail(r.inquiryId, input);
    expect(waiting.bodyHtml).toContain("Schedule a Call");
    expect(waiting.bodyHtml).not.toContain("Join Zoom");
  });
  it("repeating a cancelled Zoom reconciliation keeps the historic meeting ID without another POST", async () => {
    await connect();
    const r = await reservation(true);
    await changeAdminBooking({
      action: "cancel",
      id: r.admin.id,
      updatedAt: r.admin.updatedAt,
      confirmed: true,
    });
    const before = (
      await db.query<{ zoom_meeting_id: string }>(
        "SELECT zoom_meeting_id FROM bookings",
      )
    ).rows[0].zoom_meeting_id;
    await syncBooking(r.admin.id);
    expect(
      (
        await db.query<{ zoom_meeting_id: string }>(
          "SELECT zoom_meeting_id FROM bookings",
        )
      ).rows[0].zoom_meeting_id,
    ).toBe(before);
    expect(providerCalls("/meetings")).toHaveLength(1);
  });
  it("missing Zoom environment leaves a scheduled booking valid and flags configuration", async () => {
    vi.stubEnv("ZOOM_CLIENT_SECRET", "");
    const r = await reservation(true);
    expect(r.admin.status).toBe("scheduled");
    expect(r.admin.zoomSync.status).toBe("failed");
    expect(
      mocks.fetch.mock.calls.some(([u]) => String(u).includes("zoom.us")),
    ).toBe(false);
  });
});

it("changing the Zoom account cannot create a duplicate for the same configured host", async () => {
  await connect();
  const r = await reservation(true);
  mocks.fetch.mockClear();
  vi.stubEnv("ZOOM_ACCOUNT_ID", "different-account");
  await syncBooking(r.admin.id);
  expect(
    (await getInquiryBooking(r.inquiryId)).booking?.zoomSync.error,
  ).toContain("previous provider account");
  expect(
    mocks.fetch.mock.calls.some(([u]) => String(u).includes("zoom.us")),
  ).toBe(false);
});

describe("Microsoft Graph account, availability and idempotency contracts", () => {
  it("uses only offline access, profile identification and calendar write scopes", async () => {
    const url = new URL((await beginMicrosoftOAuth()).url);
    expect(new Set(url.searchParams.get("scope")!.split(" "))).toEqual(
      new Set(["offline_access", "User.Read", "Calendars.ReadWrite"]),
    );
    expect(url.searchParams.get("redirect_uri")).toBe(
      "https://site.example.test/.netlify/functions/microsoft-calendar-oauth-callback",
    );
  });
  it("supports an optional tenant and binds it to the one-use OAuth request", async () => {
    vi.stubEnv("MICROSOFT_TENANT_ID", "consumers");
    const auth = await beginMicrosoftOAuth(),
      url = new URL(auth.url);
    expect(url.pathname).toBe("/consumers/oauth2/v2.0/authorize");
    vi.stubEnv("MICROSOFT_TENANT_ID", "organizations");
    await expect(
      consumeMicrosoftState(
        url.searchParams.get("state")!,
        auth.cookie.split(";")[0].split("=")[1],
      ),
    ).rejects.toMatchObject({ status: 400 });
  });
  it("verifies the PKCE challenge and exchange form and never persists plaintext state", async () => {
    const auth = await beginMicrosoftOAuth(),
      url = new URL(auth.url),
      state = url.searchParams.get("state")!;
    const stored = (await db.query("SELECT * FROM integration_oauth_states"))
      .rows[0];
    expect(JSON.stringify(stored)).not.toContain(state);
    const consumed = await consumeMicrosoftState(
      state,
      auth.cookie.split(";")[0].split("=")[1],
    );
    const { createHash } = await import("node:crypto");
    expect(url.searchParams.get("code_challenge")).toBe(
      createHash("sha256").update(consumed.verifier).digest("base64url"),
    );
    await exchangeMicrosoftCode("synthetic-code", consumed);
    const params = providerCalls("/oauth2/v2.0/token")[0][1]
      .body as URLSearchParams;
    expect(params.get("code_verifier")).toBe(consumed.verifier);
    expect(params.get("redirect_uri")).toBe(consumed.redirectUri);
  });
  it("accepts qualified Graph scopes and identifies accounts using UPN when mail is absent", async () => {
    const old = mocks.fetch.getMockImplementation()!;
    mocks.fetch.mockImplementation((u: string, i: RequestInit) =>
      u.includes("/token")
        ? Promise.resolve(
            response({
              access_token: "access",
              refresh_token: "refresh",
              expires_in: 3600,
              scope:
                "https://graph.microsoft.com/User.Read https://graph.microsoft.com/Calendars.ReadWrite",
            }),
          )
        : u.includes("/v1.0/me?")
          ? Promise.resolve(
              response({
                id: "personal-account",
                displayName: "Owner",
                mail: null,
                userPrincipalName: "owner@outlook.com",
              }),
            )
          : old(u, i),
    );
    await connect();
    expect((await microsoftConnection())?.account_email).toBe(
      "owner@outlook.com",
    );
  });
  it("rotates encrypted refresh tokens and sends the new refresh token on the next refresh", async () => {
    await connect();
    await db.exec(
      "UPDATE integration_connections SET token_expires_at=clock_timestamp()-interval '1 minute'",
    );
    const old = mocks.fetch.getMockImplementation()!;
    mocks.fetch.mockImplementation((u: string, i: RequestInit) =>
      u.includes("/token")
        ? Promise.resolve(
            response({
              access_token: "rotated-access",
              refresh_token: "rotated-refresh",
              expires_in: 3600,
            }),
          )
        : old(u, i),
    );
    const c = (await microsoftConnection())!;
    await microsoftAccess(c);
    expect(
      decrypt(
        String((await microsoftConnection())?.encrypted_refresh_token),
        "microsoft-refresh",
      ),
    ).toBe("rotated-refresh");
    c.encrypted_access_token = null;
    await microsoftAccess(c);
    expect(
      (providerCalls("/token")[1][1].body as URLSearchParams).get(
        "refresh_token",
      ),
    ).toBe("rotated-refresh");
  });
  it("missing refresh credentials and reduced refreshed scopes require reconnection", async () => {
    await connect();
    await db.exec(
      "UPDATE integration_connections SET encrypted_refresh_token=NULL",
    );
    await expect(
      microsoftAccess((await microsoftConnection())!),
    ).rejects.toMatchObject({ code: "reconnect_required" });
    expect((await microsoftConnection())?.status).toBe("reconnect_required");
    await connect();
    await db.exec(
      "UPDATE integration_connections SET token_expires_at=clock_timestamp()-interval '1 minute'",
    );
    mocks.fetch.mockImplementationOnce(() =>
      Promise.resolve(
        response({
          access_token: "restricted",
          expires_in: 3600,
          scope: "User.Read",
        }),
      ),
    );
    await expect(
      microsoftAccess((await microsoftConnection())!),
    ).rejects.toMatchObject({ code: "reconnect_required" });
  });
  it("preserves the selected writable calendar on same-account reconnection", async () => {
    await connect();
    await selectCalendar("business");
    await connect();
    expect((await microsoftConnection())?.selected_calendar_id).toBe(
      "business",
    );
  });
  it.each([
    "busy",
    "tentative",
    "oof",
    "unknown",
    "future-provider-status",
    undefined,
  ])("blocks %s availability conservatively", async (showAs) => {
    await connect();
    const old = mocks.fetch.getMockImplementation()!;
    mocks.fetch.mockImplementation((u: string, i: RequestInit) =>
      u.includes("calendarView")
        ? Promise.resolve(
            response({
              value: [
                {
                  id: "external",
                  showAs,
                  start: {
                    dateTime: "2026-10-10T13:00:00.0000000",
                    timeZone: "UTC",
                  },
                  end: {
                    dateTime: "2026-10-10T14:00:00.0000000",
                    timeZone: "UTC",
                  },
                },
              ],
            }),
          )
        : old(u, i),
    );
    expect(
      await calendarBusy("2026-10-10T00:00:00Z", "2026-10-11T00:00:00Z", true),
    ).toEqual([
      {
        startAt: "2026-10-10T13:00:00.000Z",
        endAt: "2026-10-10T14:00:00.000Z",
        busyUntil: "2026-10-10T14:00:00.000Z",
      },
    ]);
  });
  it.each(["free", "workingElsewhere"])(
    "does not block explicit %s events",
    async (showAs) => {
      await connect();
      const old = mocks.fetch.getMockImplementation()!;
      mocks.fetch.mockImplementation((u: string, i: RequestInit) =>
        u.includes("calendarView")
          ? Promise.resolve(response({ value: [{ id: "external", showAs }] }))
          : old(u, i),
      );
      expect(
        await calendarBusy(
          "2026-10-10T00:00:00Z",
          "2026-10-11T00:00:00Z",
          true,
        ),
      ).toEqual([]);
    },
  );
  it("follows calendarView pagination and rejects external nextLink destinations without leaking a bearer token", async () => {
    await connect();
    let first = true;
    const old = mocks.fetch.getMockImplementation()!;
    mocks.fetch.mockImplementation((u: string, i: RequestInit) =>
      u.includes("calendarView")
        ? Promise.resolve(
            first
              ? ((first = false),
                response({
                  value: [],
                  "@odata.nextLink":
                    "https://graph.microsoft.com/v1.0/me/calendars/primary/calendarView?$skiptoken=next",
                }))
              : response({
                  value: [
                    {
                      id: "recurring-instance",
                      showAs: "tentative",
                      start: {
                        dateTime: "2026-10-10T12:00:00",
                        timeZone: "UTC",
                      },
                      end: { dateTime: "2026-10-10T12:30:00", timeZone: "UTC" },
                    },
                  ],
                }),
          )
        : old(u, i),
    );
    expect(
      await calendarBusy("2026-10-10T00:00:00Z", "2026-10-11T00:00:00Z", true),
    ).toHaveLength(1);
    mocks.fetch.mockImplementation((u: string, i: RequestInit) =>
      u.includes("calendarView")
        ? Promise.resolve(
            response({
              value: [],
              "@odata.nextLink": "https://attacker.test/steal",
            }),
          )
        : old(u, i),
    );
    await expect(
      calendarBusy("2026-10-10T00:00:00Z", "2026-10-11T00:00:00Z", true),
    ).rejects.toMatchObject({ code: "invalid_response" });
    expect(
      mocks.fetch.mock.calls.some(([u]) => String(u).includes("attacker.test")),
    ).toBe(false);
  });
  it("writes the ready Zoom URL on the first Outlook create after Zoom completes", async () => {
    await connect();
    const r = await reservation(true);
    const zoomIndex = mocks.fetch.mock.calls.findIndex(
      ([u, i]) => String(u).includes("/meetings") && i?.method === "POST",
    );
    const outlookIndex = mocks.fetch.mock.calls.findIndex(
      ([u, i]) => String(u).includes("/events") && i?.method === "POST",
    );
    expect(zoomIndex).toBeLessThan(outlookIndex);
    const payload = JSON.parse(mocks.fetch.mock.calls[outlookIndex][1].body);
    expect(payload.body.content).toContain(r.booking.zoomJoinUrl);
    expect(payload.transactionId).toMatch(/^[a-f0-9]{64}$/);
    expect(payload.start).toEqual({
      dateTime: r.booking.startAt.replace(/Z$/, ""),
      timeZone: "UTC",
    });
    expect(payload.body.content).toContain("America/New_York");
    expect(
      String(mocks.fetch.mock.calls[outlookIndex][1].headers.Prefer),
    ).toContain('IdType="ImmutableId"');
  });
  it("unknown Outlook creation with no discoverable event never issues a second POST", async () => {
    await connect();
    outlookFailure = "sync";
    const r = await reservation();
    outlookFailure = "";
    await syncBooking(r.admin.id);
    expect(events.size).toBe(0);
    expect(providerCalls("/events")).toHaveLength(1);
    expect(
      (await getInquiryBooking(r.inquiryId)).booking?.calendarSync.error,
    ).toContain("unconfirmed");
  });
  it("a definite Graph rejection permits a later safe creation attempt", async () => {
    await connect();
    let fail = true;
    const old = mocks.fetch.getMockImplementation()!;
    mocks.fetch.mockImplementation((u: string, i: RequestInit) =>
      fail && u.includes("/events") && i?.method === "POST"
        ? Promise.resolve(response({}, 403))
        : old(u, i),
    );
    const r = await reservation();
    expect(r.admin.calendarSync.status).toBe("failed");
    fail = false;
    await syncBooking(r.admin.id);
    expect(events.size).toBe(1);
  });
  it("refuses event mutations when someone manually added attendees", async () => {
    await connect();
    const r = await reservation();
    const event = [...events.values()][0];
    events.set(String(event.id), {
      ...event,
      attendees: [{ emailAddress: { address: "client@example.test" } }],
    });
    mocks.fetch.mockClear();
    await syncBooking(r.admin.id);
    expect(
      (await getInquiryBooking(r.inquiryId)).booking?.calendarSync.status,
    ).toBe("failed");
    expect(providerCalls("/events", "PATCH")).toHaveLength(0);
  });
  it("disconnect clears local credentials without revoking unrelated Microsoft user sessions", async () => {
    await connect();
    mocks.fetch.mockClear();
    await disconnectOutlook();
    expect(mocks.fetch).not.toHaveBeenCalled();
    expect((await microsoftConnection())?.status).toBe("disconnected");
  });
});

it("migration 008 preserves populated Google history and Zoom state without changing CRM versions/activity", async () => {
  const legacy = new PGlite();
  try {
    for (const name of [
      "001_create_inquiries",
      "002_create_inquiry_activity",
      "003_add_follow_up_fields",
      "004_create_proposals",
      "005_create_inquiry_messages",
      "006_create_bookings",
      "007_create_integrations",
    ])
      await legacy.exec(
        readFileSync("database/migrations/" + name + ".sql", "utf8"),
      );
    const r = await reservation(true),
      inquiry = (
        await db.query<Record<string, unknown>>(
          "SELECT * FROM inquiries WHERE id=$1",
          [r.inquiryId],
        )
      ).rows[0],
      link = (
        await db.query<Record<string, unknown>>(
          "SELECT * FROM booking_links WHERE inquiry_id=$1",
          [r.inquiryId],
        )
      ).rows[0];
    const copy = async (table: string, row: Record<string, unknown>) => {
      const keys = Object.keys(row);
      await legacy.query(
        `INSERT INTO ${table}(${keys.join(",")}) VALUES(${keys.map((_, i) => "$" + (i + 1)).join(",")})`,
        keys.map((k) => row[k]),
      );
    };
    await copy("inquiries", inquiry);
    await copy("booking_links", link);
    await legacy.query(
      `INSERT INTO bookings(id,inquiry_id,link_id,booking_token_hash,start_at,end_at,busy_until,buffer_minutes,timezone,client_name,client_email,client_phone,meeting_type,request_key,payload_fingerprint,calendar_event_id,google_calendar_id,google_account_email,google_event_generation,zoom_meeting_id,zoom_join_url)
      VALUES($1,$2,$3,$4,$5,$6,$6,0,'America/New_York','Client','client@example.test','+14015456860','zoom',$7,$8,'old-google-event','old-google-calendar','old@example.test',3,'123456789','https://example.zoom.us/j/123456789')`,
      [
        r.admin.id,
        r.inquiryId,
        link.id,
        link.token_hash,
        r.booking.startAt,
        r.booking.endAt,
        crypto.randomUUID(),
        "ab".repeat(32),
      ],
    );
    await legacy.exec(
      "UPDATE bookings SET google_sync_status='synced',zoom_sync_status='synced',sync_revision=7;INSERT INTO integration_connections(provider,status,encrypted_access_token,encrypted_refresh_token) VALUES('google_calendar','connected','encrypted-old-access','encrypted-old-refresh'),('zoom','disconnected',NULL,NULL);",
    );
    const before = (
      await legacy.query<Record<string, unknown>>("SELECT * FROM bookings")
    ).rows[0];
    await legacy.exec(
      readFileSync(
        "database/migrations/008_outlook_calendar_integration.sql",
        "utf8",
      ),
    );
    const after = (
      await legacy.query<Record<string, unknown>>("SELECT * FROM bookings")
    ).rows[0];
    expect(after.legacy_calendar_reference).toMatchObject({
      provider: "google_calendar",
      event_id: "old-google-event",
      calendar_id: "old-google-calendar",
      account_email: "old@example.test",
      event_generation: 3,
      sync_status: "synced",
    });
    expect(after.calendar_event_id).toBeNull();
    expect(after.calendar_sync_status).toBe("pending");
    for (const field of [
      "updated_at",
      "zoom_meeting_id",
      "zoom_join_url",
      "zoom_sync_status",
      "sync_revision",
      "start_at",
      "end_at",
    ])
      expect(after[field]).toEqual(before[field]);
    expect(
      (
        await legacy.query<Record<string, unknown>>(
          "SELECT * FROM integration_connections",
        )
      ).rows.map((r) => r.provider),
    ).toEqual(["zoom"]);
    const archived = (
      await legacy.query<{ snapshot: Record<string, unknown> }>(
        "SELECT snapshot FROM retired_calendar_connections",
      )
    ).rows[0].snapshot as Record<string, unknown>;
    expect(archived.encrypted_refresh_token).toBe("encrypted-old-refresh");
    expect((await legacy.query("SELECT * FROM inquiry_activity")).rows).toEqual(
      [],
    );
    await legacy.exec(
      "UPDATE bookings SET start_at=start_at+interval '1 hour',end_at=end_at+interval '1 hour',busy_until=busy_until+interval '1 hour'",
    );
    expect(
      (
        await legacy.query(
          "SELECT calendar_sync_status,zoom_sync_status,sync_revision FROM bookings",
        )
      ).rows[0],
    ).toMatchObject({
      calendar_sync_status: "pending",
      zoom_sync_status: "pending",
      sync_revision: 8,
    });
  } finally {
    await legacy.close();
  }
}, 30000);

it("concurrent refreshes cannot overwrite a newer encrypted refresh token", async () => {
  await connect();
  await db.exec(
    "UPDATE integration_connections SET token_expires_at=clock_timestamp()-interval '1 minute'",
  );
  const first = (await microsoftConnection())!,
    second = (await microsoftConnection())!;
  let release!: () => void, entered!: () => void;
  const pause = new Promise<void>((r) => (release = r)),
    started = new Promise<void>((r) => (entered = r));
  const old = mocks.fetch.getMockImplementation()!;
  let count = 0;
  mocks.fetch.mockImplementation(async (u: string, i: RequestInit) => {
    if (!u.includes("/token")) return old(u, i);
    if (++count === 1) {
      entered();
      await pause;
      return response({
        access_token: "older-access",
        refresh_token: "older-refresh",
        expires_in: 3600,
      });
    }
    return response({
      access_token: "newer-access",
      refresh_token: "newer-refresh",
      expires_in: 3600,
    });
  });
  const pending = microsoftAccess(first);
  await started;
  expect(await microsoftAccess(second)).toBe("newer-access");
  release();
  expect(await pending).toBe("newer-access");
  expect(
    decrypt(
      String((await microsoftConnection())?.encrypted_refresh_token),
      "microsoft-refresh",
    ),
  ).toBe("newer-refresh");
});
