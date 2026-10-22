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
import { readFileSync, readdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import {
  createLead,
  getLead,
  listLeads,
  updateLead,
  listLeadActivity,
  deleteLead,
} from "./lib/lead-store";
import { createInquiry } from "./lib/inquiry-store";
import {
  leadSchema,
  leadBrowseSchema,
  leadCommunicationLabel,
} from "../src/lib/leads/contract";
import {
  compositionSchema,
  messageFailureText,
  messageHasFailure,
} from "../src/lib/communications/contract";
import {
  sendMessage,
  retryMessage,
  listMessages,
  getMessage,
  previewEmail,
  refreshEmailReceipts,
} from "./lib/message-store";
import {
  importMail,
  associateMail,
  syncMailbox,
  mailboxStatus,
} from "./lib/integrations/outlook-mail";
import { setEmailSuppression } from "./lib/email-safety";
import endpoint from "./functions/admin-messages.mts";
const mocks = vi.hoisted(() => ({
  query: vi.fn(),
  user: vi.fn(),
  send: vi.fn(),
  receipt: vi.fn(),
  connection: vi.fn(),
  graph: vi.fn(),
}));
vi.mock("@neondatabase/serverless", () => ({
  neon: () => ({ query: mocks.query }),
}));
vi.mock("@netlify/identity", () => ({ getUser: mocks.user }));
vi.mock("resend", () => ({
  Resend: class {
    emails = { send: mocks.send, get: mocks.receipt };
  },
}));
vi.mock("./lib/integrations/microsoft-auth", async (importActual) => ({
  ...(await importActual<typeof import("./lib/integrations/microsoft-auth")>()),
  microsoftConnection: mocks.connection,
  microsoftApi: mocks.graph,
}));
let db: PGlite;
const email = "prospect@example.test";
const prospect = (extra = {}) =>
  createLead(leadSchema.parse({ company: "Test prospect", email, ...extra }));
const compose = (extra = {}) => ({
  ...compositionSchema.parse({
    to: email,
    subject: "A thoughtful introduction",
    message: "Hello,\n\nSee https://example.test/work?a=1&b=2\n\nAnthony",
    templateKey: "personal",
    includeProposal: false,
    format: "quick",
    ...extra,
  }),
  requestKey: crypto.randomUUID(),
});
const owner = (id: string) => ({ leadId: id });
const request = (id: string, body?: unknown, origin = "https://example.test") =>
  new Request("https://example.test/api/admin/messages?lead=" + id, {
    method: body ? "POST" : "GET",
    headers: { Origin: origin, "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
const api = (id: string, body?: unknown, origin?: string) =>
  endpoint(request(id, body, origin), {} as never);
const inbound = (extra = {}) => ({
  id: "immutable-outlook-1",
  internetMessageId: "<reply-1@example.test>",
  conversationId: "graph-conversation-1",
  from: { emailAddress: { address: email } },
  toRecipients: [{ emailAddress: { address: "reply@example.test" } }],
  subject: "Re: A thoughtful introduction",
  body: { contentType: "text", content: "Thanks! Can we talk next week?" },
  receivedDateTime: new Date(Date.now() + 1000).toISOString(),
  internetMessageHeaders: [
    { name: "In-Reply-To", value: "<sent-1@resend.test>" },
  ],
  ...extra,
});
const connect = () => {
  vi.stubEnv("MICROSOFT_MAIL_ENABLED", "true");
  mocks.connection.mockResolvedValue({
    id: crypto.randomUUID(),
    generation: "same-generation",
    status: "connected",
    account_id: "ms-account",
    account_email: "reply@example.test",
    scope: "Mail.Read Calendars.ReadWrite User.Read",
  });
};
beforeAll(async () => {
  db = new PGlite();
  for (const file of readdirSync("database/migrations")
    .filter((f) => f.endsWith(".sql"))
    .sort())
    await db.exec(readFileSync("database/migrations/" + file, "utf8"));
}, 30000);
afterAll(() => db.close());
afterEach(() => vi.unstubAllEnvs());
beforeEach(async () => {
  await db.exec(
    "TRUNCATE leads,invoice_items,invoices,bookings,booking_links,inquiry_messages,proposal_items,proposals,inquiry_activity,inquiries,mailbox_sync_state",
  );
  vi.resetAllMocks();
  for (const [key, value] of Object.entries({
    DATABASE_URL: "postgresql://isolated-test-placeholder",
    RESEND_API_KEY: "test-only",
    EMAIL_FROM: "Anthony | Volatile Solutions <hello@example.test>",
    EMAIL_REPLY_TO: "reply@example.test",
  }))
    vi.stubEnv(key, value);
  mocks.query.mockImplementation(
    async (sql: string, values: unknown[] = []) =>
      (await db.query(sql, values)).rows,
  );
  mocks.user.mockResolvedValue({ roles: ["admin"] });
  mocks.send.mockResolvedValue({ data: { id: "resend-api-id" }, error: null });
  mocks.receipt.mockResolvedValue({
    data: { message_id: "<sent-1@resend.test>", last_event: "sent" },
    error: null,
  });
  mocks.connection.mockResolvedValue(null);
});
describe("direct Lead communication with shared outbound infrastructure", () => {
  it("sends Quick Email with no inquiry, fake project, greeting or automatic signature", async () => {
    const lead = await prospect(),
      input = compose();
    const response = await api(lead.id, { action: "send", ...input });
    expect(response.status).toBe(200);
    const { message } = await response.json();
    expect(message).toMatchObject({
      direction: "outbound",
      format: "quick",
      status: "sent",
      bodyText: input.message,
      internetMessageId: "<sent-1@resend.test>",
    });
    expect(message.bodyHtml).toContain(
      'href="https://example.test/work?a=1&amp;b=2"',
    );
    expect((await listMessages(owner(lead.id))).items[0].id).toBe(message.id);
    expect(await getLead(lead.id)).toMatchObject({
      status: "saved",
      convertedAt: null,
      lastContactAt: message.sentAt,
    });
    expect((await db.query("SELECT * FROM inquiries")).rows).toHaveLength(0);
    expect(mocks.send.mock.calls[0][0]).toMatchObject({
      from: "Anthony | Volatile Solutions <hello@example.test>",
      replyTo: "reply@example.test",
      text: input.message,
    });
  });
  it("reuses unchanged branded templates and snapshots for sparse leads", async () => {
    const lead = await prospect();
    const mail = await sendMessage(
      owner(lead.id),
      compose({
        format: "branded",
        templateKey: "follow-up",
        message: "A personal note for {{company}}.",
      }),
    );
    expect(mail.bodyHtml).toContain("Hi there,");
    expect(mail.bodyText).toContain("A personal note for Test prospect.");
    expect(mail.bodyHtml).toContain("Volatile Solutions");
    expect(mail.format).toBe("branded");
  });
  it("preserves literal template-looking text and escapes HTML in Quick Email", async () => {
    const lead = await prospect();
    const preview = await previewEmail(
      owner(lead.id),
      compose({
        message: '{{literal}} <img onerror="bad()">\n\nSecond paragraph',
      }),
    );
    expect(preview.bodyText).toContain("{{literal}}");
    expect(preview.bodyHtml).not.toContain("<img");
    expect(mocks.send).not.toHaveBeenCalled();
  });
  it("replies with actual provider headers and keeps the owned thread", async () => {
    const lead = await prospect(),
      first = await sendMessage(owner(lead.id), compose());
    const reply = await sendMessage(
      owner(lead.id),
      compose({
        subject: "Re: A thoughtful introduction",
        replyToMessageId: first.id,
      }),
    );
    expect(reply.threadId).toBe(first.threadId);
    expect(mocks.send.mock.calls[1][0].headers).toEqual({
      "In-Reply-To": "<sent-1@resend.test>",
      References: "<sent-1@resend.test>",
    });
    expect(
      (await listLeadActivity(lead.id)).filter((a) => a.type === "email_sent"),
    ).toHaveLength(2);
  });
  it("does not fabricate reply identifiers when receipt access is unavailable", async () => {
    mocks.receipt.mockResolvedValue({ error: { statusCode: 403 }, data: null });
    const lead = await prospect(),
      first = await sendMessage(owner(lead.id), compose());
    expect(first.status).toBe("sent");
    await expect(
      sendMessage(owner(lead.id), compose({ replyToMessageId: first.id })),
    ).rejects.toMatchObject({ status: 409 });
    expect(mocks.send).toHaveBeenCalledTimes(1);
  });
  it("rejects a reply parent owned by another lead on the server", async () => {
    const a = await prospect(),
      b = await prospect({ email: "other@example.test" });
    const first = await sendMessage(owner(a.id), compose());
    await expect(
      sendMessage(
        owner(b.id),
        compose({ to: b.email, replyToMessageId: first.id }),
      ),
    ).rejects.toMatchObject({ status: 404 });
  });
  it("enforces reply ownership inside PostgreSQL too", async () => {
    const a = await prospect(),
      b = await prospect();
    const first = await sendMessage(owner(a.id), compose()),
      second = await sendMessage(owner(b.id), compose());
    await expect(
      db.query(
        "UPDATE inquiry_messages SET reply_message_id=$2,thread_id=$3 WHERE id=$1",
        [second.id, first.id, first.threadId],
      ),
    ).rejects.toMatchObject({ code: "23503" });
  });
  it("reuses a request key for a double submission without another provider call", async () => {
    const lead = await prospect(),
      input = compose();
    const [first, second] = await Promise.all([
      sendMessage(owner(lead.id), input),
      sendMessage(owner(lead.id), input),
    ]);
    expect(first.id).toBe(second.id);
    expect(mocks.send).toHaveBeenCalledTimes(1);
  });
  it("exposes failed state and retries the original frozen content/key", async () => {
    mocks.send.mockResolvedValueOnce({
      data: null,
      error: { statusCode: 403 },
    });
    const lead = await prospect(),
      first = await sendMessage(owner(lead.id), compose());
    expect(first).toMatchObject({
      status: "failed",
      canRetry: true,
      errorCode: "provider_rejected",
    });
    expect((await listMessages(owner(lead.id))).items[0].status).toBe("failed");
    const retried = await retryMessage(owner(lead.id), first.id);
    expect(retried.status).toBe("sent");
    expect(mocks.send.mock.calls[0][1].idempotencyKey).toBe(
      mocks.send.mock.calls[1][1].idempotencyKey,
    );
    expect(mocks.send.mock.calls[0][0].text).toBe(
      mocks.send.mock.calls[1][0].text,
    );
  });
  it("keeps follow-up scheduling/manual status and last-contact dates correct", async () => {
    const lead = await prospect(),
      sent = await sendMessage(owner(lead.id), compose());
    const nextFollowUpAt = new Date(Date.now() + 86400000).toISOString();
    const {
      id,
      createdAt,
      updatedAt,
      convertedInquiryId,
      convertedAt,
      emailSuppressed,
      lastEmailAt,
      lastReplyAt,
      ...input
    } = await getLead(lead.id);
    await updateLead(
      id,
      { ...input, nextFollowUpAt, followUpNote: "Check in personally" },
      updatedAt,
    );
    expect(await getLead(id)).toMatchObject({
      status: "saved",
      lastContactAt: sent.sentAt,
      nextFollowUpAt,
    });
    expect(
      (await listLeadActivity(id)).some(
        (a) => a.type === "follow_up_scheduled",
      ),
    ).toBe(true);
  });
  it("restricts recipients to the saved contact and validates field-specific errors", async () => {
    const lead = await prospect();
    const wrong = await api(lead.id, {
      action: "send",
      ...compose({ to: "different@example.test" }),
    });
    expect(wrong.status).toBe(422);
    expect((await wrong.json()).fields.to).toBeTruthy();
    const invalid = await api(lead.id, {
      action: "send",
      ...compose(),
      subject: "",
    });
    expect(invalid.status).toBe(422);
    expect((await invalid.json()).fields.subject).toBeTruthy();
    expect(mocks.send).not.toHaveBeenCalled();
  });
  it("blocks missing-email leads without requiring project details", async () => {
    const lead = await prospect({ email: "" });
    await expect(sendMessage(owner(lead.id), compose())).rejects.toMatchObject({
      status: 422,
    });
    expect((await listMessages(owner(lead.id))).items).toEqual([]);
  });
  it("blocks suppression for sends, previews and retries and preserves activity", async () => {
    mocks.send.mockResolvedValueOnce({
      data: null,
      error: { statusCode: 403 },
    });
    const lead = await prospect(),
      failed = await sendMessage(owner(lead.id), compose());
    await setEmailSuppression(owner(lead.id), true);
    await expect(sendMessage(owner(lead.id), compose())).rejects.toMatchObject({
      status: 422,
    });
    await expect(previewEmail(owner(lead.id), compose())).rejects.toMatchObject(
      { status: 422 },
    );
    await expect(retryMessage(owner(lead.id), failed.id)).rejects.toMatchObject(
      { status: 422 },
    );
    expect((await listMessages(owner(lead.id))).emailSuppressed).toBe(true);
    await setEmailSuppression(owner(lead.id), false);
    expect((await retryMessage(owner(lead.id), failed.id)).status).toBe("sent");
  });
  it("refuses changing email permission while a send is in flight", async () => {
    const lead = await prospect();
    mocks.send.mockImplementationOnce(async () => {
      await expect(
        setEmailSuppression(owner(lead.id), true),
      ).rejects.toMatchObject({ status: 409 });
      return { data: { id: "accepted" }, error: null };
    });
    expect((await sendMessage(owner(lead.id), compose())).status).toBe("sent");
  });
  it("stores provider bounce state and blocks repeated sending even through another lead", async () => {
    const lead = await prospect();
    await sendMessage(owner(lead.id), compose());
    mocks.receipt.mockResolvedValue({
      data: { message_id: "<sent-1@resend.test>", last_event: "bounced" },
    });
    await refreshEmailReceipts(owner(lead.id));
    expect((await listMessages(owner(lead.id))).items[0].deliveryState).toBe(
      "bounced",
    );
    const receipt = (await listMessages(owner(lead.id))).items[0];
    expect(messageHasFailure(receipt)).toBe(true);
    expect(messageFailureText(receipt)).toContain("bounced");
    expect(leadCommunicationLabel(await getLead(lead.id))).toBe("Do not email");
    expect(
      (
        await listLeads(leadBrowseSchema.parse({ communication: "suppressed" }))
      ).items.map((item) => item.id),
    ).toEqual([lead.id]);
    await expect(
      sendMessage(owner((await prospect()).id), compose()),
    ).rejects.toMatchObject({ status: 422 });
  });
  it("returns private responses and keeps admin and same-origin protections", async () => {
    const lead = await prospect();
    mocks.user.mockResolvedValueOnce(null);
    expect((await api(lead.id)).status).toBe(401);
    mocks.user.mockResolvedValueOnce({ roles: [] });
    expect((await api(lead.id)).status).toBe(403);
    expect(
      (
        await api(
          lead.id,
          { action: "suppression", suppressed: true },
          "https://attacker.test",
        )
      ).status,
    ).toBe(403);
    const response = await api(lead.id);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
  });
  it("preserves Inquiry branded sending through the same endpoint contract", async () => {
    const inquiry = await createInquiry(
      {
        name: "Real contact",
        email,
        company: "",
        website: "",
        projectType: "website",
        projectStage: "new",
        projectSummary: "Actual project details provided by a contact.",
        helpNeeded: "",
        budgetRange: "unsure",
        timeline: "flexible",
      },
      crypto.randomUUID(),
    );
    const result = await sendMessage(inquiry, {
      ...compose(),
      format: undefined,
    });
    expect(result).toMatchObject({ status: "sent", format: "branded" });
    expect(result.bodyText).toContain("Hi Real,");
  });
});
describe("optional Outlook inbound adapter", () => {
  it("works outbound-only when mailbox scope/configuration is unavailable", async () => {
    const lead = await prospect();
    expect((await listMessages(owner(lead.id))).mailbox?.status).toBe(
      "outbound-only",
    );
    await expect(syncMailbox()).rejects.toMatchObject({ status: 409 });
    expect((await sendMessage(owner(lead.id), compose())).status).toBe("sent");
    expect(mocks.graph).not.toHaveBeenCalled();
  });
  it("requires Mail.Read and the connected business reply-to mailbox", async () => {
    connect();
    expect((await mailboxStatus()).status).toBe("connected");
    mocks.connection.mockResolvedValue({
      status: "connected",
      account_email: "other@example.test",
      scope: "Mail.Read",
    });
    expect((await mailboxStatus()).status).toBe("outbound-only");
    mocks.connection.mockResolvedValue({
      status: "connected",
      account_email: "reply@example.test",
      scope: "Calendars.ReadWrite",
    });
    expect((await mailboxStatus()).status).toBe("outbound-only");
  });
  it("matches reply headers over subject text and stores one reply/activity atomically", async () => {
    const lead = await prospect(),
      first = await sendMessage(owner(lead.id), compose());
    expect(
      await importMail(
        inbound({ subject: "Entirely different subject" }),
        "ms-account",
      ),
    ).toBe(true);
    expect(await importMail(inbound(), "ms-account")).toBe(false);
    const messages = await listMessages(owner(lead.id));
    expect(messages.items).toHaveLength(2);
    expect(messages.items.find((m) => m.direction === "inbound")).toMatchObject(
      { threadId: first.threadId, status: "sent", canRetry: false },
    );
    expect(
      (await listLeadActivity(lead.id)).filter(
        (a) => a.type === "email_received",
      ),
    ).toHaveLength(1);
    const latest = await getLead(lead.id);
    expect(latest.status).toBe("saved");
    expect(latest.lastContactAt).toBe(first.sentAt);
    expect(leadCommunicationLabel(latest)).toBe("Replied");
  });
  it("replies to imported messages using their actual Internet Message-ID", async () => {
    const lead = await prospect();
    await importMail(inbound(), "ms-account");
    const received = (await listMessages(owner(lead.id))).items[0];
    const sent = await sendMessage(
      owner(lead.id),
      compose({ replyToMessageId: received.id }),
    );
    expect(sent.threadId).toBe(received.threadId);
    expect(mocks.send.mock.calls[0][0].headers["In-Reply-To"]).toBe(
      "<reply-1@example.test>",
    );
  });
  it("uses provider conversation IDs after an initial header match", async () => {
    const lead = await prospect(),
      first = await sendMessage(owner(lead.id), compose());
    await importMail(inbound(), "ms-account");
    await importMail(
      inbound({
        id: "immutable-2",
        internetMessageId: "<reply-2@example.test>",
        internetMessageHeaders: [],
      }),
      "ms-account",
    );
    expect(
      (await listMessages(owner(lead.id))).items.every(
        (m) => m.threadId === first.threadId,
      ),
    ).toBe(true);
  });
  it("does not misassociate ambiguous addresses, conflicting headers or different senders", async () => {
    const a = await prospect(),
      first = await sendMessage(owner(a.id), compose());
    const b = await prospect(),
      second = await sendMessage(owner(b.id), compose());
    expect(
      await associateMail(
        inbound({ internetMessageHeaders: [] }),
        "ms-account",
      ),
    ).toBeNull();
    expect(
      await associateMail(
        inbound({
          from: { emailAddress: { address: "attacker@example.test" } },
        }),
        "ms-account",
      ),
    ).toBeNull();
    await db.query(
      "UPDATE inquiry_messages SET internet_message_id='<other@resend.test>' WHERE id=$1",
      [second.id],
    );
    expect(
      await associateMail(
        inbound({
          internetMessageHeaders: [
            {
              name: "References",
              value: "<sent-1@resend.test> <other@resend.test>",
            },
          ],
        }),
        "ms-account",
      ),
    ).toBeNull();
    expect(first.threadId).not.toBe(second.threadId);
  });
  it("starts a new thread for a unique sender when no stronger match exists", async () => {
    const lead = await prospect(),
      first = await sendMessage(owner(lead.id), compose());
    await importMail(inbound({ internetMessageHeaders: [] }), "ms-account");
    const item = (await listMessages(owner(lead.id))).items.find(
      (m) => m.direction === "inbound",
    )!;
    expect(item.threadId).not.toBe(first.threadId);
  });
  it("ignores unknown senders, wrong recipients, drafts, and unsafe HTML content", async () => {
    await prospect();
    for (const extra of [
      { from: { emailAddress: { address: "unknown@example.test" } } },
      {
        toRecipients: [{ emailAddress: { address: "elsewhere@example.test" } }],
      },
      { isDraft: true },
      { body: { contentType: "html", content: "<script>bad()</script>" } },
    ])
      expect(await importMail(inbound(extra), "ms-account")).toBe(false);
  });
  it("prefers Graph's unique text body and removes unsupported control characters", async () => {
    const lead = await prospect();
    await importMail(
      inbound({
        uniqueBody: { contentType: "text", content: "New reply\u0000 only" },
        body: {
          contentType: "text",
          content: "New reply plus full quoted history",
        },
      }),
      "ms-account",
    );
    const mail = (await listMessages(owner(lead.id))).items[0];
    expect((await getMessage(owner(lead.id), mail.id)).bodyText).toBe(
      "New reply only",
    );
  });
  it("does not stall the cursor on a message deleted between delta and GET", async () => {
    connect();
    const { ProviderError } = await import("./lib/integrations/provider");
    mocks.graph
      .mockResolvedValueOnce({
        value: [{ id: "moved-message" }],
        "@odata.deltaLink":
          "https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages/delta?$deltatoken=next",
      })
      .mockRejectedValueOnce(new ProviderError("not_found", 404));
    expect(await syncMailbox()).toEqual({ imported: 0, more: false });
  });
  it("rolls back inbound content when activity recording fails", async () => {
    await prospect();
    await db.exec(
      "CREATE FUNCTION reject_email_activity() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.activity_type='email_received' THEN RAISE EXCEPTION 'test failure'; END IF; RETURN NEW; END $$; CREATE TRIGGER reject_email_activity BEFORE INSERT ON inquiry_activity FOR EACH ROW EXECUTE FUNCTION reject_email_activity()",
    );
    try {
      await expect(importMail(inbound(), "ms-account")).rejects.toThrow();
      expect(
        (await db.query("SELECT * FROM inquiry_messages")).rows,
      ).toHaveLength(0);
    } finally {
      await db.exec(
        "DROP TRIGGER reject_email_activity ON inquiry_activity; DROP FUNCTION reject_email_activity()",
      );
    }
  });
  it("advances validated delta cursors and handles repeated sync idempotently", async () => {
    connect();
    await prospect();
    mocks.graph.mockImplementation(async (_c: unknown, path: string) =>
      path.includes("/delta") || path.includes("deltatoken")
        ? {
            value: [{ id: "immutable-outlook-1" }],
            "@odata.deltaLink":
              "https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages/delta?$deltatoken=test",
          }
        : inbound(),
    );
    expect(await syncMailbox()).toEqual({ imported: 1, more: false });
    expect(await syncMailbox()).toEqual({ imported: 0, more: false });
    expect(mocks.graph.mock.calls[1][2].headers.Prefer).toContain(
      'body-content-type="text"',
    );
    expect(
      (
        await db.query<{ cursor: string }>(
          "SELECT cursor FROM mailbox_sync_state",
        )
      ).rows[0].cursor,
    ).toContain("deltatoken");
  });
  it("keeps cursor replayable on provider failure and sanitizes provider errors", async () => {
    connect();
    await prospect();
    mocks.graph.mockRejectedValue(new Error("PRIVATE TOKEN"));
    await expect(syncMailbox()).rejects.toMatchObject({ status: 503 });
    const rows = (await db.query("SELECT * FROM mailbox_sync_state")).rows;
    expect(rows[0]).toMatchObject({ cursor: null, lease: null });
  });
  it("filters directory communication state reliably and preserves existing follow-up filters", async () => {
    const fresh = await prospect({ email: "fresh@example.test" }),
      contacted = await prospect();
    expect(leadCommunicationLabel(fresh)).toBe("Never emailed");
    await sendMessage(owner(contacted.id), compose());
    expect(
      (
        await listLeads(leadBrowseSchema.parse({ communication: "awaiting" }))
      ).items.map((l) => l.id),
    ).toEqual([contacted.id]);
    await importMail(inbound(), "ms-account");
    expect(
      (
        await listLeads(leadBrowseSchema.parse({ communication: "replied" }))
      ).items.map((l) => l.id),
    ).toEqual([contacted.id]);
    expect(
      (
        await listLeads(leadBrowseSchema.parse({ communication: "never" }))
      ).items.map((l) => l.id),
    ).toEqual([fresh.id]);
  });
  it("deletes an owned conversation through existing Lead deletion without orphaning replies", async () => {
    const lead = await prospect();
    await sendMessage(owner(lead.id), compose());
    await importMail(inbound(), "ms-account");
    await deleteLead(lead.id, lead.updatedAt);
    expect(
      (await db.query("SELECT * FROM inquiry_messages")).rows,
    ).toHaveLength(0);
  });
});
