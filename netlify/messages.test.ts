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
import type { Context } from "@netlify/functions";
import {
  createInquiry,
  getInquiry,
  listInquiries,
  getInquiryPipeline,
  updateFollowUp,
  listInquiryActivity,
} from "./lib/inquiry-store";
import {
  createProposal,
  saveProposal,
  sendProposal,
  getPublicProposal,
  respondToProposal,
} from "./lib/proposal-store";
import {
  sendMessage,
  retryMessage,
  getMessage,
  listMessages,
  previewEmail,
} from "./lib/message-store";
import {
  emailConfiguration,
  sendInquiryEmail,
  EmailProviderError,
} from "./lib/email";
import { renderEmail, publicEmailUrl } from "./lib/email-render";
import {
  compositionSchema,
  sendEmailSchema,
} from "../src/lib/communications/contract";
import {
  EMAIL_TEMPLATES,
  personalize,
} from "../src/lib/communications/templates";
import admin from "./functions/admin-messages.mts";
const mocks = vi.hoisted(() => ({
  query: vi.fn(),
  user: vi.fn(),
  send: vi.fn(),
}));
vi.mock("@neondatabase/serverless", () => ({
  neon: () => ({ query: mocks.query }),
}));
vi.mock("@netlify/identity", () => ({ getUser: mocks.user }));
vi.mock("resend", () => ({
  Resend: class {
    emails = { send: mocks.send };
  },
}));
let db: PGlite;
const context = { params: {} } as Context;
const input = {
  name: "Test & Client",
  email: "client@example.test",
  company: "",
  website: "",
  projectType: "website",
  projectStage: "new",
  projectSummary: "A complete test project description.",
  helpNeeded: "",
  budgetRange: "unsure",
  timeline: "flexible",
};
const composition = () =>
  compositionSchema.parse({
    to: input.email,
    subject: "Thanks, {{firstName}}",
    message:
      'A personal response for {{company}} about {{projectType}}.\n\n<svg onload="alert(1)"> & special characters.',
    templateKey: "personal",
    includeProposal: false,
  });
const request = (id: string, body?: unknown, origin = "https://example.test") =>
  new Request("https://example.test/api/admin/messages?inquiry=" + id, {
    method: body ? "POST" : "GET",
    headers: { Origin: origin, "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
const create = () => createInquiry(input as never, crypto.randomUUID());
const send = (id: string, key = crypto.randomUUID()) =>
  sendMessage(id, { ...composition(), requestKey: key });
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
afterEach(() => vi.unstubAllEnvs());
beforeEach(async () => {
  await db.exec(
    "TRUNCATE invoice_items,invoices,bookings,booking_links,inquiry_messages,proposal_items,proposals,inquiry_activity,inquiries",
  );
  vi.resetAllMocks();
  for (const [key, value] of Object.entries({
    DATABASE_URL: "postgresql://isolated-test-placeholder",
    RESEND_API_KEY: "test-not-a-real-key",
    EMAIL_FROM: "Anthony | Volatile Solutions <hello@example.test>",
    EMAIL_REPLY_TO: "reply@example.test",
  }))
    vi.stubEnv(key, value);
  mocks.query.mockImplementation(
    async (sql: string, values: unknown[] = []) =>
      (await db.query(sql, values)).rows,
  );
  mocks.user.mockResolvedValue({ roles: ["admin"] });
  mocks.send.mockResolvedValue({
    data: { id: "provider-message-test" },
    error: null,
  });
});
async function sentProposal(id: string) {
  const p = await createProposal(id, "Website proposal");
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + 10);
  const saved = await saveProposal(p.id, {
    action: "save",
    title: p.title,
    summary: "A complete proposal summary.",
    items: [{ description: "Website", quantity: 1, unitPriceCents: 125000 }],
    discountCents: 0,
    taxRateBasisPoints: 0,
    validUntil: date.toISOString().slice(0, 10),
    internalNotes: "NEVER PUBLIC NOTE",
    clientNotes: "Client-safe notes",
    updatedAt: p.updatedAt,
  });
  return sendProposal(saved.id, saved.updatedAt);
}
describe("private outbound CRM messages and provider boundary", () => {
  it("persists sending before provider access, then acceptance and atomic activity", async () => {
    const id = await create();
    mocks.send.mockImplementationOnce(async () => {
      const rows = await db.query(
        "SELECT status,provider_message_id FROM inquiry_messages",
      );
      expect(rows.rows[0]).toMatchObject({
        status: "sending",
        provider_message_id: null,
      });
      return { data: { id: "resend-accepted-id" }, error: null };
    });
    const message = await send(id);
    expect(message.status).toBe("sent");
    expect(message.sentAt).toBeTruthy();
    const rows = await db.query<{ status: string }>(
      "SELECT * FROM inquiry_messages",
    );
    expect(rows.rows[0]).toMatchObject({
      direction: "outbound",
      provider: "resend",
      provider_message_id: "resend-accepted-id",
      status: "sent",
    });
    const event = (await listInquiryActivity(id))[0];
    expect(event.type).toBe("email_sent");
    expect(event.actor).toBe("admin");
    expect(event.note).toBe("Thanks, Test");
    expect(JSON.stringify(event)).not.toContain("personal response");
  });
  it("passes text/html/from/reply-to and a stable provider idempotency key", async () => {
    const message = await send(await create());
    const [payload, options] = mocks.send.mock.calls[0];
    expect(payload.to).toEqual([input.email]);
    expect(payload.replyTo).toBe("reply@example.test");
    expect(payload.text).toContain("Anthony Volatile");
    expect(payload.html).toContain("Volatile Solutions");
    expect(options.idempotencyKey).toBe("crm-message/" + message.id);
    expect(options.signal).toBeInstanceOf(AbortSignal);
  });
  it("records provider rejection as Failed with no Sent claim or private provider error", async () => {
    mocks.send.mockResolvedValue({
      data: null,
      error: {
        statusCode: 403,
        name: "validation_error",
        message: "SECRET provider internals",
      },
    });
    const id = await create();
    const message = await send(id);
    expect(message).toMatchObject({
      status: "failed",
      errorCode: "provider_rejected",
      sentAt: null,
      canRetry: true,
    });
    expect(JSON.stringify(message)).not.toContain("SECRET");
    expect((await listInquiryActivity(id))[0].type).toBe("email_failed");
  });
  it("records network uncertainty distinctly without claiming it was unsent", async () => {
    mocks.send.mockRejectedValue(new Error("secret timeout"));
    const m = await send(await create());
    expect(m).toMatchObject({
      status: "failed",
      errorCode: "delivery_unconfirmed",
      sentAt: null,
    });
  });
  it("does not resend ordinary retries or double-clicks", async () => {
    const id = await create(),
      key = crypto.randomUUID();
    const results = await Promise.all([
      send(id, key),
      send(id, key),
      send(id, key),
    ]);
    expect(new Set(results.map((r) => r.id)).size).toBe(1);
    expect(mocks.send).toHaveBeenCalledTimes(1);
    await send(id, key);
    expect(mocks.send).toHaveBeenCalledTimes(1);
    expect((await listMessages(id)).total).toBe(1);
  });
  it("rejects changed payloads under an existing key, including another inquiry", async () => {
    const id = await create(),
      key = crypto.randomUUID();
    await send(id, key);
    await expect(
      sendMessage(id, {
        ...composition(),
        subject: "Changed",
        requestKey: key,
      }),
    ).rejects.toMatchObject({ status: 409 });
    await expect(send(await create(), key)).rejects.toMatchObject({
      status: 409,
    });
    expect(mocks.send).toHaveBeenCalledTimes(1);
  });
  it("retries a failed saved record with exactly the same provider payload/key", async () => {
    mocks.send.mockResolvedValueOnce({
      data: null,
      error: { statusCode: 429, name: "rate_limit_exceeded" },
    });
    const id = await create(),
      message = await send(id);
    const first = mocks.send.mock.calls[0];
    vi.stubEnv("EMAIL_FROM", "Different <changed@example.test>");
    vi.stubEnv("EMAIL_REPLY_TO", "changed@example.test");
    const saved = await retryMessage(id, message.id);
    expect(saved.id).toBe(message.id);
    expect(saved.status).toBe("sent");
    expect(mocks.send.mock.calls[1][0]).toEqual(first[0]);
    expect(mocks.send.mock.calls[1][1].idempotencyKey).toBe(
      first[1].idempotencyKey,
    );
    expect((await listMessages(id)).total).toBe(1);
    expect(
      (await listInquiryActivity(id)).filter((e) => e.type === "email_sent"),
    ).toHaveLength(1);
  });
  it("never resends a Sent record through Retry", async () => {
    const id = await create(),
      m = await send(id);
    await retryMessage(id, m.id);
    expect(mocks.send).toHaveBeenCalledTimes(1);
  });
  it("limits concurrent retry claims and avoids duplicate Failed events", async () => {
    mocks.send.mockResolvedValue({
      data: null,
      error: { statusCode: 403, name: "validation_error" },
    });
    const id = await create(),
      m = await send(id);
    await Promise.all([retryMessage(id, m.id), retryMessage(id, m.id)]);
    expect(mocks.send.mock.calls.length).toBeLessThanOrEqual(2);
    expect(
      (await listInquiryActivity(id)).filter((e) => e.type === "email_failed"),
    ).toHaveLength(1);
  });
  it("does not retry an active Sending lease", async () => {
    const id = await create(),
      m = await send(id);
    await db.query(
      "UPDATE inquiry_messages SET status='sending',provider_message_id=NULL,sent_at=NULL WHERE id=$1",
      [m.id],
    );
    await retryMessage(id, m.id);
    expect(mocks.send).toHaveBeenCalledTimes(1);
  });
  it("blocks expired keys, preserving an unresolved message for manual review", async () => {
    mocks.send.mockRejectedValue(new Error("network"));
    const id = await create(),
      m = await send(id);
    await db.query(
      "UPDATE inquiry_messages SET first_attempt_at=clock_timestamp()-interval '24 hours' WHERE id=$1",
      [m.id],
    );
    expect((await getMessage(id, m.id)).canRetry).toBe(false);
    await expect(retryMessage(id, m.id)).rejects.toMatchObject({ status: 409 });
    expect(mocks.send).toHaveBeenCalledTimes(1);
  });
  it("leaves Sending when DB finalization fails after provider acceptance; a safe retry reconciles", async () => {
    const id = await create();
    await db.exec(
      "CREATE FUNCTION fail_email_activity() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.activity_type='email_sent' THEN RAISE EXCEPTION 'isolated test failure'; END IF; RETURN NEW; END $$; CREATE TRIGGER reject_email_activity BEFORE INSERT ON inquiry_activity FOR EACH ROW EXECUTE FUNCTION fail_email_activity();",
    );
    try {
      await expect(send(id)).rejects.toBeDefined();
      const rows = await db.query<{ status: string }>(
        "SELECT * FROM inquiry_messages",
      );
      expect(rows.rows[0].status).toBe("sending");
      expect(
        (await listInquiryActivity(id)).filter((e) =>
          e.type.startsWith("email_"),
        ),
      ).toHaveLength(0);
    } finally {
      await db.exec(
        "DROP TRIGGER reject_email_activity ON inquiry_activity;DROP FUNCTION fail_email_activity();",
      );
    }
    const row = (
      await db.query<{ id: string }>("SELECT id FROM inquiry_messages")
    ).rows[0];
    await db.query(
      "UPDATE inquiry_messages SET last_attempt_at=clock_timestamp()-interval '2 minutes' WHERE id=$1",
      [row.id],
    );
    expect((await retryMessage(id, row.id)).status).toBe("sent");
    expect(mocks.send.mock.calls[0][1].idempotencyKey).toBe(
      mocks.send.mock.calls[1][1].idempotencyKey,
    );
  });
  it.each(["EMAIL_FROM", "EMAIL_REPLY_TO", "RESEND_API_KEY"])(
    "fails safely before record/provider access without %s",
    async (key) => {
      const id = await create();
      vi.stubEnv(key, "");
      await expect(send(id)).rejects.toMatchObject({ status: 503 });
      expect(mocks.send).not.toHaveBeenCalled();
      expect((await listMessages(id)).total).toBe(0);
    },
  );
  it.each(["invalid", "Sender <hello@example.test>\nBcc: victim@example.test"])(
    "rejects malformed sender %s",
    (value) => {
      vi.stubEnv("EMAIL_FROM", value);
      expect(() => emailConfiguration()).toThrow();
    },
  );
  it("only permits the inquiry contact, never arbitrary recipients", async () => {
    await expect(
      sendMessage(await create(), {
        ...composition(),
        to: "elsewhere@example.test",
        requestKey: crypto.randomUUID(),
      }),
    ).rejects.toMatchObject({ status: 422 });
    expect(mocks.send).not.toHaveBeenCalled();
  });
  it("previews exactly branded escaped content and performs no write/send", async () => {
    const id = await create(),
      mail = await previewEmail(id, composition());
    expect(mail.bodyHtml).toContain("&lt;svg onload=&quot;alert(1)&quot;&gt;");
    expect(mail.bodyHtml).not.toContain("<svg");
    expect(mail.bodyText).toContain('<svg onload="alert(1)">');
    expect(mail.bodyHtml).toContain("Hi Test,");
    expect(mail.bodyText).toContain("your business");
    expect(mail.bodyHtml).not.toContain("undefined");
    expect(mail.bodyHtml).not.toContain("Schedule a Call");
    expect(mocks.send).not.toHaveBeenCalled();
    expect((await listMessages(id)).total).toBe(0);
  });
  it("retains readable image-blocked branding and complete plain text with intentional CTA", async () => {
    vi.stubEnv("SITE_URL", "https://staging.example.test");
    vi.stubEnv("EMAIL_PUBLIC_URL", "https://assets.example.test");
    const inquiry = await getInquiry(await create());
    const mail = renderEmail({...composition(), message: "Your project update.", includeBooking: true}, inquiry, "Anthony <hello@example.test>", "reply@example.test", null, {url:"https://staging.example.test/book/intentional-test-link/"});
    expect(mail.bodyHtml).toContain('src="https://assets.example.test/assets/images/t001-nova/t001-nova-navbar-logo.png" width="240" height="48" alt="Volatile Solutions"');
    expect(mail.bodyHtml).not.toContain("data:image");
    expect(mail.bodyText).toBe("Hi Test,\n\nYour project update.\n\nSchedule a Call: https://staging.example.test/book/intentional-test-link/\n\nAnthony Volatile\nVolatile Solutions\nhttps://staging.example.test/\nreply@example.test");
    expect(mail.bodyText).not.toMatch(/<[^>]+>/);
    expect(mail.bodyHtml.replace(/<img[^>]*>/g, "")).toContain("Anthony Volatile<br><strong>Volatile Solutions</strong>");
  });
  it("permits preview without a provider key, while Send stays disabled by configuration", async () => {
    const id = await create();
    vi.stubEnv("RESEND_API_KEY", "");
    expect((await previewEmail(id, composition())).subject).toBe(
      "Thanks, Test",
    );
    await expect(send(id)).rejects.toMatchObject({ status: 503 });
  });
  it.each(["personal", "thanks", "discovery", "proposal", "follow-up"])(
    "supports the controlled %s template",
    (key) => {
      expect(EMAIL_TEMPLATES.find((t) => t.key === key)).toBeDefined();
    },
  );
  it("rejects unknown or missing proposal variables instead of leaking undefined/dead links", () => {
    expect(
      personalize("{{firstName}} / {{company}}", {
        firstName: "A",
        company: "your business",
      }),
    ).toBe("A / your business");
    expect(() => personalize("{{constructor}}", {})).toThrow();
    expect(() => personalize("{{proposalUrl}}", { proposalUrl: "" })).toThrow();
  });
  it("requires a current Sent proposal and derives its existing token URL", async () => {
    const id = await create();
    await expect(
      previewEmail(id, { ...composition(), includeProposal: true }),
    ).rejects.toMatchObject({ status: 422 });
    const p = await sentProposal(id);
    const mail = await previewEmail(id, {
      ...composition(),
      includeProposal: true,
    });
    expect(mail.bodyHtml).toContain("View Proposal");
    expect(mail.bodyHtml).toContain(
      "https://volatile-solutions.net" + p.clientUrl,
    );
    expect(mail.bodyHtml).not.toContain(p.id);
    expect(mail.bodyText).toContain(
      "View Proposal: https://volatile-solutions.net" + p.clientUrl,
    );
    await sendMessage(id, {
      ...composition(),
      includeProposal: true,
      requestKey: crypto.randomUUID(),
    });
    expect(
      (
        await db.query<{ proposal_id: string }>(
          "SELECT proposal_id FROM inquiry_messages",
        )
      ).rows[0].proposal_id,
    ).toBe(p.id);
  });
  it("cannot attach another inquiry’s proposal or inject a URL", async () => {
    await sentProposal(await create());
    const id = await create();
    await expect(
      previewEmail(id, { ...composition(), includeProposal: true }),
    ).rejects.toMatchObject({ status: 422 });
    expect(
      sendEmailSchema.safeParse({
        ...composition(),
        action: "send",
        requestKey: crypto.randomUUID(),
        proposalUrl: "https://evil.test/",
      }).success,
    ).toBe(false);
    expect(() => publicEmailUrl("//evil.test/")).toThrow();
    expect(() => publicEmailUrl("javascript:alert(1)")).toThrow();
  });
  it("hides CTA for Draft, Accepted and Expired proposals without altering their states", async () => {
    const id = await create(),
      draft = await createProposal(id, "Draft");
    expect((await listMessages(id)).proposal).toBeNull();
    await expect(
      previewEmail(id, { ...composition(), includeProposal: true }),
    ).rejects.toMatchObject({ status: 422 });
    expect(
      (
        await db.query<{ status: string }>(
          "SELECT status FROM proposals WHERE id=$1",
          [draft.id],
        )
      ).rows[0].status,
    ).toBe("draft");
  });
  it("keeps email history out of public proposal JSON and leaves inquiry/proposal state independent", async () => {
    const id = await create(),
      p = await sentProposal(id),
      before = await getInquiry(id);
    const publicBefore = await getPublicProposal(p.clientUrl!.split("/")[2]);
    await send(id);
    expect(await getInquiry(id)).toEqual(before);
    expect(await getPublicProposal(p.clientUrl!.split("/")[2])).toEqual(
      publicBefore,
    );
    expect(JSON.stringify(publicBefore)).not.toContain("bodyHtml");
    expect((await listInquiries("all", "newest", 1)).total).toBe(1);
    expect((await getInquiryPipeline()).items).toHaveLength(1);
  });
  it("keeps search, filters, follow-up and general notes intact under migration 005", async () => {
    const id = await create(),
      original = await getInquiry(id);
    const followed = await updateFollowUp(
      id,
      "2026-10-20T18:00:12.345Z",
      "Call about scope",
      original.updatedAt,
    );
    await send(id);
    expect(await getInquiry(id)).toEqual(followed);
    expect(
      (await listInquiries("all", "newest", 1)).items[0].nextFollowUpAt,
    ).toBe(followed.nextFollowUpAt);
    expect((await getInquiryPipeline()).items[0].status).toBe("new");
    expect(
      (await listInquiryActivity(id)).some(
        (e) => e.type === "follow_up_scheduled",
      ),
    ).toBe(true);
  });
  it("requires authorization before all private email operations", async () => {
    const id = crypto.randomUUID();
    for (const role of [null, { roles: ["member"] }]) {
      mocks.user.mockResolvedValue(role);
      for (const body of [
        undefined,
        { action: "preview", ...composition() },
        { action: "send", ...composition(), requestKey: crypto.randomUUID() },
        { action: "retry", messageId: crypto.randomUUID() },
      ]) {
        mocks.query.mockClear();
        expect((await admin(request(id, body), context)).status).toBe(
          role ? 403 : 401,
        );
        expect(mocks.query).not.toHaveBeenCalled();
      }
    }
    expect(mocks.send).not.toHaveBeenCalled();
  });
  it("rejects cross-origin sends/previews/retries and forged HTML fields", async () => {
    const id = await create();
    expect(
      (
        await admin(
          request(
            id,
            {
              action: "send",
              ...composition(),
              requestKey: crypto.randomUUID(),
            },
            "https://elsewhere.test",
          ),
          context,
        )
      ).status,
    ).toBe(403);
    expect(
      (
        await admin(
          request(id, {
            action: "send",
            ...composition(),
            requestKey: crypto.randomUUID(),
            bodyHtml: "<script>bad</script>",
          }),
          context,
        )
      ).status,
    ).toBe(422);
    expect(mocks.send).not.toHaveBeenCalled();
  });
  it("bounds subject/body/headers/template, rejects empty messages and malformed keys", () => {
    for (const changed of [
      { subject: "a".repeat(201) },
      { message: "a".repeat(20001) },
      { subject: "a\r\nb" },
      { message: "" },
      { templateKey: "arbitrary" },
      { to: "invalid" },
    ])
      expect(
        compositionSchema.safeParse({ ...composition(), ...changed }).success,
      ).toBe(false);
  });
  it("escapes long/special personalization and keeps plain text complete", async () => {
    const id = await create();
    await db.query("UPDATE inquiries SET company=$2 WHERE id=$1", [
      id,
      '<Company & "Brand">'.repeat(8),
    ]);
    const mail = await previewEmail(id, {
      ...composition(),
      message: "{{company}}\n\n" + "Long & <text> ".repeat(1200),
    });
    expect(mail.bodyHtml).toContain("&lt;Company &amp; &quot;Brand&quot;&gt;");
    expect(mail.bodyText).toContain("Long & <text>");
    expect(mail.bodyHtml).not.toContain("<script");
  });
  it("provides paginated summaries and ownership-checked full content only on demand", async () => {
    const id = await create();
    for (let n = 0; n < 11; n++) await send(id);
    const first = await listMessages(id),
      second = await listMessages(id, 2);
    expect(first.items).toHaveLength(10);
    expect(first.total).toBe(11);
    expect(second.items).toHaveLength(1);
    expect(JSON.stringify(first)).not.toContain("bodyHtml");
    expect((await getMessage(id, first.items[0].id)).bodyText).toContain(
      "Anthony Volatile",
    );
    await expect(
      getMessage(await create(), first.items[0].id),
    ).rejects.toMatchObject({ status: 404 });
  });
  it("rejects nonexistent inquiries before provider access", async () => {
    await expect(send(crypto.randomUUID())).rejects.toMatchObject({
      status: 404,
    });
    expect(mocks.send).not.toHaveBeenCalled();
  });
  it("exposes only bounded provider categories through the adapter", async () => {
    mocks.send.mockResolvedValue({
      data: null,
      error: { statusCode: 409, message: "secret" },
    });
    await expect(
      sendInquiryEmail({
        id: crypto.randomUUID(),
        from: "hello@example.test",
        to: input.email,
        replyTo: "reply@example.test",
        subject: "Test",
        html: "test",
        text: "test",
      }),
    ).rejects.toBeInstanceOf(EmailProviderError);
  });
  it("returns private no-store responses from the stable endpoint", async () => {
    const id = await create();
    const response = await admin(request(id), context);
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
    expect(await response.json()).toMatchObject({
      items: [],
      total: 0,
      proposal: null,
    });
  });
  it("supports a trusted deployed HTTPS origin for branding and proposal links", () => {
    vi.stubEnv("EMAIL_PUBLIC_URL", "https://staging.example.test");
    expect(publicEmailUrl("/proposal/abc/")).toBe(
      "https://staging.example.test/proposal/abc/",
    );
    expect(() => publicEmailUrl("//evil.test/")).toThrow();
  });
  it.each([
    "http://example.test",
    "https://user:password@example.test",
    "https://example.test/path",
    "not-a-url",
  ])("rejects unsafe configured public origin %s", (value) => {
    vi.stubEnv("EMAIL_PUBLIC_URL", value);
    expect(() => publicEmailUrl("/")).toThrow();
  });
  it.each(["accepted", "declined", "expired"])(
    "suppresses proposal CTA for %s without changing mail/proposal state",
    async (status) => {
      const id = await create(),
        proposal = await sentProposal(id);
      if (status === "expired")
        await db.query(
          "UPDATE proposals SET valid_until=(clock_timestamp() AT TIME ZONE 'UTC')::date-1 WHERE id=$1",
          [proposal.id],
        );
      else
        await respondToProposal(
          proposal.clientUrl!.split("/")[2],
          status === "accepted" ? "accept" : "decline",
        );
      expect((await listMessages(id)).proposal).toBeNull();
      await expect(
        previewEmail(id, { ...composition(), includeProposal: true }),
      ).rejects.toMatchObject({ status: 422 });
      expect(
        (await getPublicProposal(proposal.clientUrl!.split("/")[2])).status,
      ).toBe(status);
      expect(mocks.send).not.toHaveBeenCalled();
    },
  );
});
