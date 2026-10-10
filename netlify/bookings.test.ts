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
import {
  createInquiry,
  getInquiry,
  listInquiryActivity,
  listInquiries,
  getInquiryPipeline,
  updateFollowUp,
} from "./lib/inquiry-store";
import {
  getBookingSettings,
  saveBookingSettings,
} from "./lib/booking-settings";
import {
  createInquiryBookingLink,
  getBookingLink,
  bookingForEmail,
} from "./lib/booking-links";
import {
  createBookingToken,
  tokenFromNonce,
  bookingTokenHash,
} from "./lib/booking-token";
import {
  publicBookingPage,
  publicSlots,
  book,
  changePublicBooking,
  changeAdminBooking,
  getInquiryBooking,
  listBookings,
} from "./lib/booking-store";
import {
  businessToday,
  slotsForDate,
  wallInstants,
  availableDates,
} from "./lib/booking-slots";
import { sendMessage, retryMessage, previewEmail } from "./lib/message-store";
import { publicUrl } from "./lib/public-url";
import admin from "./functions/admin-bookings.mts";
import publicEndpoint, { config } from "./functions/booking.mts";
import {
  settingsSchema,
  bookingInputSchema,
  calendarDate,
  type AvailabilitySettings,
} from "../src/lib/bookings/contract";
import { calendarReturnUrl } from "../src/lib/bookings/admin-session";
const mocks = vi.hoisted(() => ({
  query: vi.fn(),
  user: vi.fn(),
  send: vi.fn(),
}));
vi.mock("@neondatabase/serverless", () => ({
  neon: () => ({ query: mocks.query }),
}));
vi.mock("@netlify/identity", () => ({
  getUser: mocks.user,
  logout: vi.fn(),
  onAuthChange: vi.fn(),
}));
vi.mock("resend", () => ({
  Resend: class {
    emails = { send: mocks.send };
  },
}));
let db: PGlite;
const context = { params: {} } as never;
const inquiryInput = {
  name: "Test Client",
  email: "client@example.test",
  company: "Test Company",
  website: "",
  projectType: "website",
  projectStage: "new",
  projectSummary: "A complete inquiry summary for booking tests.",
  helpNeeded: "",
  budgetRange: "unsure",
  timeline: "flexible",
};
const request = (
  path: string,
  body?: unknown,
  origin = "https://example.test",
) =>
  new Request("https://example.test" + path, {
    method: body ? "POST" : "GET",
    headers: { Origin: origin, "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
const token = (url: string) => new URL(url).pathname.split("/")[2];
const input = (startAt: string) =>
  bookingInputSchema.parse({
    action: "book",
    meetingType: "phone",
    startAt,
    clientName: "Test Client",
    clientEmail: inquiryInput.email,
    clientPhone: "+12025550123",
    clientNotes: "Test booking notes",
    requestKey: crypto.randomUUID(),
    confirmed: true,
  });
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
    "TRUNCATE invoice_items,invoices,bookings,booking_links,inquiry_messages,proposal_items,proposals,inquiry_activity,inquiries; DELETE FROM booking_exceptions; UPDATE booking_availability SET enabled=false,start_time='09:00',end_time='17:00'; UPDATE booking_settings SET timezone='America/New_York',slot_duration_minutes=30,buffer_minutes=0,minimum_notice_hours=12,horizon_days=60,updated_at=clock_timestamp();",
  );
  vi.resetAllMocks();
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Unexpected network request in isolated booking tests")));
  for (const [key, value] of Object.entries({
    DATABASE_URL: "postgresql://isolated-test-only",
    SITE_URL: "https://staging.example.test",
    EMAIL_PUBLIC_URL: "",
    BOOKING_TOKEN_SECRET: "0123456789abcdef".repeat(4),
    RESEND_API_KEY: "synthetic-only",
    EMAIL_FROM: "Anthony <hello@example.test>",
    EMAIL_REPLY_TO: "reply@example.test",
  }))
    vi.stubEnv(key, value);
  mocks.query.mockImplementation(
    async (sql: string, values: unknown[] = []) =>
      (await db.query(sql, values)).rows,
  );
  mocks.user.mockResolvedValue({ roles: ["admin"] });
  mocks.send.mockResolvedValue({
    data: { id: "accepted-test-id" },
    error: null,
  });
});
async function enable() {
  const s = await getBookingSettings();
  return saveBookingSettings({
    ...s,
    weekdays: s.weekdays.map((day) => ({ ...day, enabled: true })),
  });
}
async function link() {
  const inquiryId = await createInquiry(
      inquiryInput as never,
      crypto.randomUUID(),
    ),
    result = await createInquiryBookingLink(inquiryId);
  return { inquiryId, url: result.url, token: token(result.url) };
}
async function reservation() {
  await enable();
  const l = await link(),
    page = await publicBookingPage(l.token),
    slots = await publicSlots(l.token, page.dates[0].date),
    payload = input(slots.slots[0].startAt),
    booking = await book(l.token, payload);
  return { ...l, payload, booking };
}
function settings(
  overrides: Partial<AvailabilitySettings> = {},
): AvailabilitySettings {
  return {
    timezone: "America/New_York",
    slotDurationMinutes: 30,
    bufferMinutes: 0,
    minimumNoticeHours: 1,
    horizonDays: 60,
    updatedAt: "2026-01-01T00:00:00.000Z",
    weekdays: Array.from({ length: 7 }, (_, weekday) => ({
      weekday,
      enabled: true,
      startTime: "09:00",
      endTime: "17:00",
    })),
    exceptions: [],
    ...overrides,
  };
}
describe("booking token, URL, privacy and database workflows", () => {
  it("starts with configurable structural defaults and no published weekdays/bookings", async () => {
    const s = await getBookingSettings();
    expect(s).toMatchObject({
      timezone: "America/New_York",
      slotDurationMinutes: 30,
      bufferMinutes: 0,
      minimumNoticeHours: 12,
      horizonDays: 60,
    });
    expect(s.weekdays.every((d) => !d.enabled)).toBe(true);
    expect(
      (await listBookings(new Date().toISOString().slice(0, 7))).items,
    ).toEqual([]);
  });
  it("uses high-entropy HMAC tokens, independent nonces and SHA-256 hashes", () => {
    const a = createBookingToken(),
      b = createBookingToken();
    expect(a.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(a.nonce).not.toBe(b.nonce);
    expect(a.hash).toBe(bookingTokenHash(a.token));
    expect(tokenFromNonce(a.nonce)).toBe(a.token);
    expect(a.nonce).not.toContain(a.token);
  });
  it("stores only hash/nonce and reuses an existing link across reads/repeated creation", async () => {
    const l = await link(),
      row = await getBookingLink(l.inquiryId);
    expect(JSON.stringify(row)).not.toContain(l.token);
    expect(row?.token_hash).toBe(bookingTokenHash(l.token));
    expect((await createInquiryBookingLink(l.inquiryId)).url).toBe(l.url);
    await getInquiryBooking(l.inquiryId);
    expect(
      (await listInquiryActivity(l.inquiryId)).filter(
        (e) => e.type === "booking_link_created",
      ),
    ).toHaveLength(1);
  });
  it("regenerates deliberately, invalidates the old token and keeps existing bookings", async () => {
    const r = await reservation(),
      next = await createInquiryBookingLink(r.inquiryId, true);
    expect(next.url).not.toBe(r.url);
    await expect(publicBookingPage(r.token)).rejects.toMatchObject({
      status: 404,
    });
    expect((await publicBookingPage(token(next.url))).booking).toEqual(
      r.booking,
    );
    expect((await listInquiryActivity(r.inquiryId))[0].type).toBe(
      "booking_link_regenerated",
    );
  });
  it("handles concurrent link creation without duplicate events or different active links", async () => {
    const id = await createInquiry(inquiryInput as never, crypto.randomUUID());
    const links = await Promise.all([
      createInquiryBookingLink(id),
      createInquiryBookingLink(id),
    ]);
    expect(links[0].url).toBe(links[1].url);
    expect(
      (await listInquiryActivity(id)).filter(
        (e) => e.type === "booking_link_created",
      ),
    ).toHaveLength(1);
  });
  it("does not expose inquiry IDs, summary, budget, messages or activity publicly", async () => {
    const l = await link(),
      page = await publicBookingPage(l.token),
      json = JSON.stringify(page);
    for (const privateValue of [
      l.inquiryId,
      inquiryInput.projectSummary,
      "budgetRange",
      "adminNotes",
      "token_hash",
      "token_nonce",
      "activity",
    ])
      expect(json).not.toContain(privateValue);
    expect(page.name).toBe(inquiryInput.name);
    expect(page.email).toBe(inquiryInput.email);
  });
  it("publishes only actual configured slots and saves one booking with client activity", async () => {
    const r = await reservation();
    expect(r.booking.status).toBe("scheduled");
    expect(Date.parse(r.booking.endAt) - Date.parse(r.booking.startAt)).toBe(
      30 * 60000,
    );
    expect(r.booking.clientPhone).toBe("+12025550123");
    expect((await listInquiryActivity(r.inquiryId))[0]).toMatchObject({
      type: "booking_scheduled",
      actor: "client",
    });
    expect(JSON.stringify(r.booking)).not.toContain(r.inquiryId);
    expect(mocks.send).not.toHaveBeenCalled();
  });
  it("persists UTC and source timezone with nullable future integration hooks", async () => {
    const r = await reservation(),
      rows = await db.query(
        "SELECT timezone,calendar_event_id,zoom_meeting_id,zoom_join_url FROM bookings",
      );
    expect(rows.rows[0]).toMatchObject({
      timezone: "America/New_York",
      calendar_event_id: null,
      zoom_meeting_id: null,
      zoom_join_url: null,
    });
    expect(r.booking.startAt).toMatch(/Z$/);
  });
  it("does not fabricate a Zoom link or require a phone for Zoom", async () => {
    for (const key of ["ZOOM_ACCOUNT_ID", "ZOOM_CLIENT_ID", "ZOOM_CLIENT_SECRET", "ZOOM_USER_ID"])
      vi.stubEnv(key, "synthetic-test-only");
    await enable();
    const l = await link(),
      page = await publicBookingPage(l.token),
      slot = (await publicSlots(l.token, page.dates[0].date)).slots[0];
    const saved = await book(l.token, {
      ...input(slot.startAt),
      meetingType: "zoom",
      clientPhone: "",
    }, () => {});
    expect(saved.meetingType).toBe("zoom");
    expect(saved.clientPhone).toBeNull();
    expect(JSON.stringify(saved)).not.toContain("zoom.us");
  });
  it("offers phone only and books without dormant provider configuration", async () => {
    for (const key of ["ZOOM_ACCOUNT_ID", "ZOOM_CLIENT_ID", "ZOOM_CLIENT_SECRET", "ZOOM_USER_ID", "MICROSOFT_CLIENT_ID", "MICROSOFT_CLIENT_SECRET"])
      vi.stubEnv(key, "");
    const r = await reservation();
    expect((await publicBookingPage(r.token)).meetingTypes).toEqual(["phone"]);
    expect(r.booking.meetingType).toBe("phone");
    expect(r.booking.status).toBe("scheduled");
  });
  it("rejects new unavailable Zoom requests without creating a booking or activity", async () => {
    vi.stubEnv("ZOOM_CLIENT_SECRET", "");
    await enable();
    const l = await link(), page = await publicBookingPage(l.token);
    const slot = (await publicSlots(l.token, page.dates[0].date)).slots[0];
    await expect(book(l.token, {...input(slot.startAt), meetingType: "zoom", clientPhone: ""}))
      .rejects.toMatchObject({status:422, message:"Choose a phone call. Zoom calls are currently unavailable."});
    expect((await db.query("SELECT * FROM bookings")).rows).toEqual([]);
    expect((await db.query("SELECT * FROM inquiry_activity WHERE activity_type='booking_scheduled'")).rows).toEqual([]);
  });
  it("offers configured Zoom and preserves idempotent retries if configuration is later removed", async () => {
    for (const key of ["ZOOM_ACCOUNT_ID", "ZOOM_CLIENT_ID", "ZOOM_CLIENT_SECRET", "ZOOM_USER_ID"])
      vi.stubEnv(key, "synthetic-test-only");
    await enable();
    const l = await link(), page = await publicBookingPage(l.token);
    expect(page.meetingTypes).toEqual(["phone", "zoom"]);
    const slot = (await publicSlots(l.token, page.dates[0].date)).slots[0];
    const payload = {...input(slot.startAt), meetingType: "zoom" as const, clientPhone: ""};
    const saved = await book(l.token, payload, () => {});
    vi.stubEnv("ZOOM_CLIENT_SECRET", "");
    expect(await book(l.token, payload)).toEqual(saved);
  });
  it("prevents two simultaneous inquiries from reserving the same slot", async () => {
    await enable();
    const a = await link(),
      b = await link(),
      page = await publicBookingPage(a.token),
      slot = (await publicSlots(a.token, page.dates[0].date)).slots[0];
    const results = await Promise.allSettled([
      book(a.token, input(slot.startAt)),
      book(b.token, input(slot.startAt)),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((r) => r.status === "rejected")).toHaveLength(1);
    expect((await db.query("SELECT id FROM bookings")).rows).toHaveLength(1);
  });
  it("the native exclusion rejects overlap even outside the application", async () => {
    const r = await reservation(),
      other = await link(),
      row = await getBookingLink(other.inquiryId);
    await expect(
      db.query(
        `INSERT INTO bookings(inquiry_id,link_id,booking_token_hash,start_at,end_at,busy_until,buffer_minutes,timezone,client_name,client_email,client_phone,meeting_type,request_key,payload_fingerprint)VALUES($1,$2,$3,$4,$5,$5,0,'America/New_York','Other','client@example.test','5555555555','phone',gen_random_uuid(),'test')`,
        [
          other.inquiryId,
          row!.id,
          row!.token_hash,
          r.booking.startAt,
          r.booking.endAt,
        ],
      ),
    ).rejects.toMatchObject({ code: "23P01" });
  });
  it("rejects arbitrary, past and unavailable timestamps", async () => {
    await enable();
    const l = await link();
    for (const start of [
      "2001-01-01T14:00:00.000Z",
      "2099-01-01T14:00:00.000Z",
      new Date(Date.now() + 3600000).toISOString(),
    ])
      await expect(book(l.token, input(start))).rejects.toMatchObject({
        status: 409,
      });
  });
  it("idempotent same-key retries return the booking without duplicate activity", async () => {
    const r = await reservation();
    expect(await book(r.token, r.payload)).toEqual(r.booking);
    expect(
      (await listInquiryActivity(r.inquiryId)).filter(
        (e) => e.type === "booking_scheduled",
      ),
    ).toHaveLength(1);
    await expect(
      book(r.token, { ...r.payload, clientNotes: "Changed" }),
    ).rejects.toMatchObject({ status: 409 });
  });
  it("identical simultaneous submissions create one booking and return one receipt", async () => {
    await enable();
    const l = await link(),
      page = await publicBookingPage(l.token),
      slot = (await publicSlots(l.token, page.dates[0].date)).slots[0],
      payload = input(slot.startAt);
    const values = await Promise.all([
      book(l.token, payload),
      book(l.token, payload),
    ]);
    expect(values[0]).toEqual(values[1]);
    expect(
      (await listInquiryActivity(l.inquiryId)).filter(
        (e) => e.type === "booking_scheduled",
      ),
    ).toHaveLength(1);
  });
  it("denies public cancellation/rescheduling after a call starts", async () => {
    const r = await reservation();
    await db.query(
      "UPDATE bookings SET start_at=clock_timestamp()-interval '1 hour',end_at=clock_timestamp()-interval '30 minutes',busy_until=clock_timestamp()-interval '30 minutes' WHERE inquiry_id=$1",
      [r.inquiryId],
    );
    for (const action of ["cancel", "reschedule"] as const)
      await expect(
        changePublicBooking(r.token, {
          action,
          expectedStartAt: r.booking.startAt,
          startAt: r.booking.startAt,
          confirmed: true,
        }),
      ).rejects.toMatchObject({ status: 409 });
    expect(
      (await listInquiryActivity(r.inquiryId)).filter(
        (e) =>
          e.type === "booking_cancelled" || e.type === "booking_rescheduled",
      ),
    ).toHaveLength(0);
  });
  it("restricts one scheduled booking per inquiry while allowing a new call after cancellation", async () => {
    const r = await reservation(),
      page = await publicBookingPage(r.token),
      slots = (await publicSlots(r.token, page.dates[0].date)).slots;
    await expect(
      book(
        r.token,
        input(slots.find((s) => s.startAt !== r.booking.startAt)!.startAt),
      ),
    ).rejects.toMatchObject({ status: 409 });
    await changePublicBooking(r.token, {
      action: "cancel",
      expectedStartAt: r.booking.startAt,
      confirmed: true,
    });
    expect((await book(r.token, input(r.booking.startAt))).status).toBe(
      "scheduled",
    );
  });
  it("public cancellation releases the range and records client activity", async () => {
    const r = await reservation();
    const cancelled = await changePublicBooking(r.token, {
      action: "cancel",
      expectedStartAt: r.booking.startAt,
      confirmed: true,
    });
    expect(cancelled.status).toBe("cancelled");
    expect((await listInquiryActivity(r.inquiryId))[0]).toMatchObject({
      type: "booking_cancelled",
      actor: "client",
    });
    const other = await link(),
      date = calendarDate(r.booking.startAt, r.booking.timezone);
    expect(
      (await publicSlots(other.token, date)).slots.some(
        (s) => s.startAt === r.booking.startAt,
      ),
    ).toBe(true);
  });
  it("public rescheduling atomically changes the time and releases the old slot", async () => {
    const r = await reservation(),
      page = await publicBookingPage(r.token),
      slots = (await publicSlots(r.token, page.dates[0].date)).slots,
      newSlot = slots.find((s) => s.startAt !== r.booking.startAt)!;
    const updated = await changePublicBooking(r.token, {
      action: "reschedule",
      expectedStartAt: r.booking.startAt,
      startAt: newSlot.startAt,
      confirmed: true,
    });
    expect(updated.startAt).toBe(newSlot.startAt);
    expect((await listInquiryActivity(r.inquiryId))[0].type).toBe(
      "booking_rescheduled",
    );
    const other = await link();
    expect(
      (
        await publicSlots(
          other.token,
          calendarDate(r.booking.startAt, r.booking.timezone),
        )
      ).slots.some((s) => s.startAt === r.booking.startAt),
    ).toBe(true);
  });
  it("does not fabricate reschedule activity for an unchanged slot", async () => {
    const r = await reservation(),
      before = await listInquiryActivity(r.inquiryId);
    expect(
      await changePublicBooking(r.token, {
        action: "reschedule",
        expectedStartAt: r.booking.startAt,
        startAt: r.booking.startAt,
        confirmed: true,
      }),
    ).toEqual(r.booking);
    expect(await listInquiryActivity(r.inquiryId)).toEqual(before);
  });
  it("reschedule conflicts preserve the original booking and create no partial event", async () => {
    const r = await reservation(),
      other = await link(),
      page = await publicBookingPage(other.token),
      slot = (await publicSlots(other.token, page.dates[0].date)).slots[0];
    await book(other.token, input(slot.startAt));
    const before = (await getInquiryBooking(r.inquiryId)).booking!;
    await expect(
      changeAdminBooking({
        action: "reschedule",
        id: before.id,
        updatedAt: before.updatedAt,
        startAt: slot.startAt,
        confirmed: true,
      }),
    ).rejects.toMatchObject({ status: 409 });
    expect((await getInquiryBooking(r.inquiryId)).booking).toEqual(before);
  });
  it("keeps settings changes versioned and existing confirmed calls unchanged", async () => {
    const r = await reservation(),
      old = await getBookingSettings();
    await saveBookingSettings({
      ...old,
      slotDurationMinutes: 45,
      bufferMinutes: 15,
    });
    expect((await publicBookingPage(r.token)).booking).toEqual(r.booking);
    await expect(saveBookingSettings(old)).rejects.toMatchObject({
      status: 409,
    });
  });
  it("admin cancellation and completion retain timestamps/activity and stale protection", async () => {
    const r = await reservation(),
      b = (await getInquiryBooking(r.inquiryId)).booking!;
    await expect(
      changeAdminBooking({
        action: "complete",
        id: b.id,
        updatedAt: b.updatedAt,
        confirmed: true,
      }),
    ).rejects.toMatchObject({ status: 409 });
    await db.query(
      "UPDATE bookings SET start_at=clock_timestamp()-interval '2 hours',end_at=clock_timestamp()-interval '90 minutes',busy_until=clock_timestamp()-interval '90 minutes' WHERE id=$1",
      [b.id],
    );
    const old = (await getInquiryBooking(r.inquiryId)).booking!;
    const done = await changeAdminBooking({
      action: "complete",
      id: b.id,
      updatedAt: old.updatedAt,
      confirmed: true,
    });
    expect(done.status).toBe("completed");
    expect(done.completedAt).toBeTruthy();
    expect((await listInquiryActivity(r.inquiryId))[0]).toMatchObject({
      type: "booking_completed",
      actor: "admin",
    });
    await expect(
      changeAdminBooking({
        action: "cancel",
        id: b.id,
        updatedAt: old.updatedAt,
        confirmed: true,
      }),
    ).rejects.toMatchObject({ status: 409 });
  });
  it.each(["book", "cancel", "reschedule"])(
    "rolls back %s when activity insertion fails",
    async (action) => {
      await enable();
      const l = await link(),
        page = await publicBookingPage(l.token),
        slots = (await publicSlots(l.token, page.dates[0].date)).slots;
      const original =
        action === "book" ? null : await book(l.token, input(slots[0].startAt));
      await db.exec(
        "CREATE FUNCTION reject_booking_activity() RETURNS trigger LANGUAGE plpgsql AS $$BEGIN IF NEW.activity_type LIKE 'booking_%' THEN RAISE EXCEPTION 'isolated rollback';END IF;RETURN NEW;END$$;CREATE TRIGGER reject_booking_activity BEFORE INSERT ON inquiry_activity FOR EACH ROW EXECUTE FUNCTION reject_booking_activity();",
      );
      try {
        if (action === "book")
          await expect(
            book(l.token, input(slots[0].startAt)),
          ).rejects.toBeDefined();
        else
          await expect(
            changePublicBooking(l.token, {
              action: action as "cancel" | "reschedule",
              expectedStartAt: original!.startAt,
              ...(action === "reschedule" ? { startAt: slots[1].startAt } : {}),
              confirmed: true,
            }),
          ).rejects.toBeDefined();
        expect((await publicBookingPage(l.token)).booking).toEqual(original);
      } finally {
        await db.exec(
          "DROP TRIGGER reject_booking_activity ON inquiry_activity;DROP FUNCTION reject_booking_activity();",
        );
      }
    },
  );
  it("link regeneration and activity roll back together", async () => {
    const l = await link();
    await db.exec(
      "CREATE FUNCTION reject_link_activity() RETURNS trigger LANGUAGE plpgsql AS $$BEGIN IF NEW.activity_type='booking_link_regenerated' THEN RAISE EXCEPTION 'isolated rollback';END IF;RETURN NEW;END$$;CREATE TRIGGER reject_link_activity BEFORE INSERT ON inquiry_activity FOR EACH ROW EXECUTE FUNCTION reject_link_activity();",
    );
    try {
      await expect(
        createInquiryBookingLink(l.inquiryId, true),
      ).rejects.toBeDefined();
      expect((await createInquiryBookingLink(l.inquiryId)).url).toBe(l.url);
    } finally {
      await db.exec(
        "DROP TRIGGER reject_link_activity ON inquiry_activity;DROP FUNCTION reject_link_activity();",
      );
    }
  });
  it("email CTA uses the real link and never persists the raw token, including retries", async () => {
    const l = await link(),
      payload = {
        to: inquiryInput.email,
        subject: "Discovery call",
        message: "Let’s discuss your project.",
        templateKey: "discovery" as const,
        includeProposal: false,
        includeBooking: true,
        requestKey: crypto.randomUUID(),
      };
    const preview = await previewEmail(l.inquiryId, payload);
    expect(preview.bodyHtml).toContain("Schedule a Call");
    expect(preview.bodyText).toContain(l.url);
    expect(mocks.send).not.toHaveBeenCalled();
    mocks.send.mockResolvedValueOnce({
      data: null,
      error: { statusCode: 403 },
    });
    const failed = await sendMessage(l.inquiryId, payload);
    const persisted = await db.query("SELECT * FROM inquiry_messages");
    expect(JSON.stringify(persisted.rows)).not.toContain(l.token);
    expect((persisted.rows[0] as Record<string, unknown>).body_html).toContain(
      "{{BOOKING_TOKEN}}",
    );
    expect(mocks.send.mock.calls[0][0].html).toContain(l.token);
    expect((await retryMessage(l.inquiryId, failed.id)).status).toBe("sent");
    expect(mocks.send.mock.calls[1][0]).toEqual(mocks.send.mock.calls[0][0]);
  });
  it("does not show or create a dead booking CTA when no link exists", async () => {
    const id = await createInquiry(inquiryInput as never, crypto.randomUUID());
    await expect(
      previewEmail(id, {
        to: inquiryInput.email,
        subject: "Call",
        message: "Discuss scope",
        templateKey: "discovery",
        includeProposal: false,
        includeBooking: true,
      }),
    ).rejects.toMatchObject({ status: 422 });
    expect(await getBookingLink(id)).toBeNull();
  });
  it("blocks retrying a message with a regenerated booking link", async () => {
    const l = await link();
    mocks.send.mockResolvedValue({ data: null, error: { statusCode: 403 } });
    const m = await sendMessage(l.inquiryId, {
      to: inquiryInput.email,
      subject: "Call",
      message: "Discuss scope",
      templateKey: "discovery",
      includeProposal: false,
      includeBooking: true,
      requestKey: crypto.randomUUID(),
    });
    await createInquiryBookingLink(l.inquiryId, true);
    await expect(retryMessage(l.inquiryId, m.id)).rejects.toMatchObject({
      status: 409,
    });
    expect(mocks.send).toHaveBeenCalledTimes(1);
  });
  it("uses SITE_URL for links and preserves EMAIL_PUBLIC_URL as an asset override", () => {
    vi.stubEnv("EMAIL_PUBLIC_URL", "https://assets.example.test");
    expect(publicUrl("/book/example/")).toBe(
      "https://staging.example.test/book/example/",
    );
    expect(publicUrl("/logo.png", true)).toBe(
      "https://assets.example.test/logo.png",
    );
    expect(() => publicUrl("//evil.test/")).toThrow();
  });
  it("preserves Phase 5 URL fallback when SITE_URL has not yet been configured", () => {
    vi.stubEnv("SITE_URL", "");
    vi.stubEnv("EMAIL_PUBLIC_URL", "https://old.example.test");
    expect(publicUrl("/proposal/example/")).toBe(
      "https://old.example.test/proposal/example/",
    );
  });
  it.each([
    "http://example.test",
    "https://user:pass@example.test",
    "https://example.test/path",
    "not-a-url",
  ])("rejects unsafe SITE_URL %s", (value) => {
    vi.stubEnv("SITE_URL", value);
    expect(() => publicUrl("/book/example/")).toThrow();
  });
  it("fails safely without a booking key rather than storing plaintext tokens", async () => {
    const id = await createInquiry(inquiryInput as never, crypto.randomUUID());
    vi.stubEnv("BOOKING_TOKEN_SECRET", "");
    await expect(createInquiryBookingLink(id)).rejects.toMatchObject({
      status: 503,
    });
    expect(await getBookingLink(id)).toBeNull();
  });
  it("requires admin authorization before calendar/settings/link database access", async () => {
    for (const user of [null, { roles: ["member"] }]) {
      mocks.user.mockResolvedValue(user);
      for (const path of [
        "/api/admin/bookings?settings=true",
        "/api/admin/bookings?month=2026-10",
        "/api/admin/bookings?inquiry=" + crypto.randomUUID(),
      ]) {
        mocks.query.mockClear();
        expect((await admin(request(path), context)).status).toBe(
          user ? 403 : 401,
        );
        expect(mocks.query).not.toHaveBeenCalled();
      }
    }
  });
  it("requires same-origin, explicit confirmation and valid public tokens", async () => {
    const l = await link();
    expect(
      (await publicEndpoint(request("/api/booking?token=bad"), context)).status,
    ).toBe(404);
    expect(
      (
        await publicEndpoint(
          request(
            "/api/booking?token=" + l.token,
            { ...input("2026-10-20T14:00:00.000Z") },
            "https://evil.test",
          ),
          context,
        )
      ).status,
    ).toBe(403);
    expect(
      (
        await admin(
          request("/api/admin/bookings", {
            action: "regenerate-link",
            inquiryId: l.inquiryId,
          }),
          context,
        )
      ).status,
    ).toBe(422);
    expect(config.rateLimit).toMatchObject({
      action: "rate_limit",
      windowLimit: 60,
      aggregateBy: ["ip", "domain"],
    });
  });
  it("keeps inquiry status, private notes, follow-ups, list and Pipeline independent", async () => {
    await enable();
    const l = await link(),
      old = await getInquiry(l.inquiryId),
      followed = await updateFollowUp(
        l.inquiryId,
        new Date(Date.now() + 86400000).toISOString(),
        "Independent follow-up",
        old.updatedAt,
      ),
      page = await publicBookingPage(l.token),
      slot = (await publicSlots(l.token, page.dates[0].date)).slots[0];
    await book(l.token, input(slot.startAt));
    expect(await getInquiry(l.inquiryId)).toEqual(followed);
    expect((await listInquiries("all", "newest", 1)).total).toBe(1);
    expect((await getInquiryPipeline()).items[0].status).toBe("new");
  });
  it("restricts auth returns to the existing calendar routes", () => {
    expect(
      calendarReturnUrl("/admin/calendar/?month=2026-10&view=agenda"),
    ).toBe("/admin/calendar/?month=2026-10&view=agenda");
    expect(calendarReturnUrl("https://evil.test/")).toBeNull();
    expect(calendarReturnUrl("/admin/proposals/")).toBeNull();
  });
});
describe("server-authoritative availability and IANA/DST behavior", () => {
  it("skips disabled weekdays", () => {
    const s = settings();
    s.weekdays[1].enabled = false;
    expect(
      slotsForDate("2026-10-12", s, [], new Date("2026-10-11T12:00:00Z")),
    ).toEqual([]);
  });
  it("one-off unavailable dates override recurring hours", () => {
    const s = settings({
      exceptions: [
        {
          date: "2026-10-12",
          type: "unavailable",
          startTime: null,
          endTime: null,
        },
      ],
    });
    expect(
      slotsForDate("2026-10-12", s, [], new Date("2026-10-11T12:00:00Z")),
    ).toEqual([]);
  });
  it("custom hours can open a disabled Saturday", () => {
    const s = settings({
      exceptions: [
        {
          date: "2026-10-17",
          type: "custom_hours",
          startTime: "10:00",
          endTime: "11:00",
        },
      ],
    });
    s.weekdays[6].enabled = false;
    expect(
      slotsForDate("2026-10-17", s, [], new Date("2026-10-16T12:00:00Z")),
    ).toHaveLength(2);
  });
  it("respects horizon and minimum notice boundaries without offering the past", () => {
    const now = new Date("2026-10-12T13:00:00Z"),
      s = settings({ horizonDays: 2, minimumNoticeHours: 12 });
    expect(slotsForDate("2026-10-12", s, [], now)).toEqual([]);
    expect(slotsForDate("2026-10-15", s, [], now)).toEqual([]);
    expect(availableDates(s, [], now).map((d) => d.date)).toEqual([
      "2026-10-13",
      "2026-10-14",
    ]);
  });
  it.each([15, 30, 45, 60])(
    "uses configurable %s-minute durations",
    (duration) => {
      const slots = slotsForDate(
        "2026-10-12",
        settings({ slotDurationMinutes: duration }),
        [],
        new Date("2026-10-11T12:00:00Z"),
      );
      expect(slots.length).toBeGreaterThan(0);
      expect(
        slots.every(
          (s) =>
            Date.parse(s.endAt) - Date.parse(s.startAt) === duration * 60000,
        ),
      ).toBe(true);
    },
  );
  it("enforces buffer before/after existing bookings, including old shorter buffers", () => {
    const s = settings({ bufferMinutes: 30 }),
      slots = slotsForDate(
        "2026-10-12",
        s,
        [
          {
            startAt: "2026-10-12T14:00:00Z",
            endAt: "2026-10-12T14:30:00Z",
            busyUntil: "2026-10-12T14:30:00Z",
          },
        ],
        new Date("2026-10-11T12:00:00Z"),
      );
    expect(slots.some((v) => v.startAt === "2026-10-12T13:30:00.000Z")).toBe(
      false,
    );
    expect(slots.some((v) => v.startAt === "2026-10-12T14:30:00.000Z")).toBe(
      false,
    );
    expect(slots.some((v) => v.startAt === "2026-10-12T15:00:00.000Z")).toBe(
      true,
    );
  });
  it("rejects nonexistent spring-forward wall times", () => {
    expect(wallInstants("2027-03-14", "02:30", "America/New_York")).toEqual([]);
  });
  it("includes both fall-back instants with distinct offset labels", () => {
    const s = settings();
    s.weekdays[0] = {
      weekday: 0,
      enabled: true,
      startTime: "00:00",
      endTime: "03:00",
    };
    const slots = slotsForDate(
        "2026-11-01",
        s,
        [],
        new Date("2026-10-31T12:00:00Z"),
      ),
      ones = slots.filter((v) => v.label.startsWith("1:00"));
    expect(ones).toHaveLength(2);
    expect(new Set(ones.map((s) => s.label)).size).toBe(2);
    expect(ones.map((v) => v.startAt)).toEqual([
      "2026-11-01T05:00:00.000Z",
      "2026-11-01T06:00:00.000Z",
    ]);
  });
  it.each(["America/Los_Angeles", "Europe/London", "Asia/Kathmandu"])(
    "supports %s without browser timezone dependence",
    (zone) => {
      const result = wallInstants("2026-10-12", "09:00", zone);
      expect(result).toHaveLength(1);
      expect(calendarDate(new Date(result[0]).toISOString(), zone)).toBe(
        "2026-10-12",
      );
      expect(businessToday(zone, new Date(result[0]))).toBe("2026-10-12");
    },
  );
  it("strictly bounds settings, weekly windows, duplicate dates and phone input", () => {
    const s = settings();
    expect(
      settingsSchema.safeParse({
        ...s,
        action: "settings",
        slotDurationMinutes: "30",
      }).success,
    ).toBe(true);
    for (const bad of [
      { timezone: "Invalid/Zone" },
      { bufferMinutes: -1 },
      { horizonDays: 999 },
      { minimumNoticeHours: 0 },
      { weekdays: [s.weekdays[0]] },
    ])
      expect(
        settingsSchema.safeParse({
          ...s,
          action: "settings",
          slotDurationMinutes: "30",
          ...bad,
        }).success,
      ).toBe(false);
    expect(
      bookingInputSchema.safeParse({
        ...input("2026-10-20T14:00:00Z"),
        clientPhone: "",
      }).success,
    ).toBe(false);
  });
});
