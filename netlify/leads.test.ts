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
import { randomUUID } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";
import { leadSchema, leadBrowseSchema } from "../src/lib/leads/contract";
import { inquirySchema } from "../src/lib/inquiries/contract";
import {
  createLead,
  getLead,
  updateLead,
  listLeads,
  listLeadActivity,
  convertLead,
  deleteLead,
} from "./lib/lead-store";
import { createInquiry, getInquiry, deleteInquiry } from "./lib/inquiry-store";
import {
  createProposal,
  saveProposal,
  sendProposal,
  respondToProposal,
  getAdminProposal,
  getPublicProposal,
} from "./lib/proposal-store";
import {
  createInvoice,
  saveInvoice,
  sendInvoice,
  recordInvoiceView,
  getPublicInvoice,
} from "./lib/invoice-store";
import { draftSchema as invoiceDraft } from "../src/lib/invoices/contract";
import {
  getBookingSettings,
  saveBookingSettings,
} from "./lib/booking-settings";
import { createInquiryBookingLink } from "./lib/booking-links";
import {
  book,
  publicBookingPage,
  publicSlots,
  getInquiryBooking,
  changeAdminBooking,
} from "./lib/booking-store";
import {
  sendMessage,
  previewEmail,
  retryMessage,
  listMessages,
} from "./lib/message-store";
import leadsEndpoint from "./functions/admin-leads.mts";
import messagesEndpoint from "./functions/admin-messages.mts";
import bookingEndpoint from "./functions/admin-bookings.mts";
import proposalsEndpoint from "./functions/admin-proposals.mts";
import invoicesEndpoint from "./functions/admin-invoices.mts";
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
const context = { params: {} } as never;
const req = (
  path: string,
  method = "GET",
  body?: unknown,
  origin = "https://example.test",
) =>
  new Request("https://example.test" + path, {
    method,
    headers: { Origin: origin, "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
const call = (id = "", method = "GET", body?: unknown) =>
  leadsEndpoint(
    req("/api/admin/leads" + (id ? "?id=" + id : ""), method, body),
    context,
  );
const input = (extra = {}) =>
  leadSchema.parse({ company: "Synthetic Studio", ...extra });
const prospect = (extra = {}) => createLead(input(extra));
const inquiry = inquirySchema.parse({
  name: "Real Contact",
  email: "contact@example.test",
  company: "Synthetic Studio",
  website: "",
  projectType: "website",
  projectStage: "existing",
  projectSummary: "Actual project information supplied by an administrator.",
  helpNeeded: "",
  budgetRange: "unsure",
  timeline: "flexible",
});
const compose = (to = inquiry.email) => ({
  to,
  subject: "A personal message",
  message: "Would you like to discuss your website?",
  templateKey: "personal" as const,
  includeProposal: false,
  requestKey: randomUUID(),
});
const token = (url: string) => new URL(url).pathname.split("/")[2];
const future = () =>
  new Date(Date.now() + 86400000 * 30).toISOString().slice(0, 10);
async function acceptedProposal(owner: string | { leadId: string }) {
  const p = await createProposal(owner, "Website proposal");
  const saved = await saveProposal(p.id, {
    action: "save",
    title: p.title,
    summary: "Actual scope for a website project.",
    validUntil: future(),
    items: [
      { description: "Development", quantity: 1, unitPriceCents: 100000 },
    ],
    discountCents: 0,
    taxRateBasisPoints: 0,
    internalNotes: "Private note",
    clientNotes: "",
    updatedAt: p.updatedAt,
  });
  const sent = await sendProposal(saved.id, saved.updatedAt);
  await respondToProposal(token(sent.publicUrl!), "accept");
  return getAdminProposal(sent.id);
}
async function meeting(leadId: string) {
  const settings = await getBookingSettings();
  await saveBookingSettings({
    ...settings,
    weekdays: settings.weekdays.map((day) => ({ ...day, enabled: true })),
  });
  const link = await createInquiryBookingLink({ leadId }),
    secret = token(link.url);
  const page = await publicBookingPage(secret),
    slots = await publicSlots(secret, page.dates[0].date);
  await book(secret, {
    action: "book",
    confirmed: true,
    startAt: slots.slots[0].startAt,
    clientName: inquiry.name,
    clientEmail: inquiry.email,
    clientPhone: "5551234567",
    clientNotes: "",
    meetingType: "phone",
    requestKey: randomUUID(),
  });
  return (await getInquiryBooking({ leadId })).booking!;
}
async function count(table: string) {
  return Number(
    (
      await db.query<{ count: string }>(
        "SELECT count(*) AS count FROM " + table,
      )
    ).rows[0].count,
  );
}
beforeAll(async () => {
  db = new PGlite();
  for (const file of readdirSync("database/migrations")
    .filter((file) => file.endsWith(".sql"))
    .sort())
    await db.exec(readFileSync("database/migrations/" + file, "utf8"));
  await db.exec(
    "CREATE TABLE lead_deletion_guard(message_id uuid REFERENCES inquiry_messages(id) ON DELETE RESTRICT)",
  );
}, 30000);
afterAll(() => db?.close());
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
beforeEach(async () => {
  await db.exec(`TRUNCATE lead_deletion_guard,leads,invoice_items,invoices,bookings,booking_links,inquiry_messages,proposal_items,proposals,inquiry_activity,inquiries;
    UPDATE booking_availability SET enabled=false; DELETE FROM booking_exceptions;`);
  vi.resetAllMocks();
  for (const [key, value] of Object.entries({
    DATABASE_URL: "postgresql://isolated-only",
    SITE_URL: "https://example.test",
    EMAIL_PUBLIC_URL: "",
    RESEND_API_KEY: "synthetic",
    EMAIL_FROM: "Anthony <hello@example.test>",
    EMAIL_REPLY_TO: "hello@example.test",
    BOOKING_TOKEN_SECRET: "ab".repeat(32),
    INVOICE_TOKEN_SECRET: "cd".repeat(32),
  }))
    vi.stubEnv(key, value);
  mocks.query.mockImplementation(
    async (sql: string, params: unknown[] = []) =>
      (await db.query(sql, params)).rows,
  );
  mocks.user.mockResolvedValue({ roles: ["admin"] });
  mocks.send.mockResolvedValue({
    data: { id: "synthetic-accepted" },
    error: null,
  });
  vi.stubGlobal(
    "fetch",
    vi.fn().mockRejectedValue(Error("Unexpected external request")),
  );
});

describe("private Leads workspace and existing CRM integration", () => {
  it("accepts only a business name, including a phone-only partial contact; validates optional fields", async () => {
    const first = await call("", "POST", {
      company: "Partial Prospect",
      phone: "555-123-4567",
    });
    expect(first.status).toBe(201);
    expect((await first.json()).lead).toMatchObject({
      company: "Partial Prospect",
      phone: "555-123-4567",
      email: "",
      name: "",
      status: "saved",
      priority: "medium",
    });
    expect((await call("", "POST", { company: "Only name" })).status).toBe(201);
    for (const invalid of [
      { company: "" },
      { company: "Test", email: "invalid" },
      { company: "Test", website: "javascript:alert(1)" },
      { company: "Test", status: "converted" },
      { company: "Test", leadId: randomUUID() },
    ])
      expect((await call("", "POST", invalid)).status).toBe(422);
    expect(await count("inquiries")).toBe(0);
  });
  it("edits details, status, priority and follow-up with version checks and atomic history", async () => {
    const lead = await prospect();
    const changed = await updateLead(
      lead.id,
      input({
        status: "follow-up",
        priority: "high",
        adminNotes: "Private research",
        nextFollowUpAt: new Date(Date.now() + 86400000).toISOString(),
        followUpNote: "Call the owner",
      }),
      lead.updatedAt,
    );
    expect(changed).toMatchObject({
      status: "follow-up",
      priority: "high",
      followUpNote: "Call the owner",
    });
    const activity = await listLeadActivity(lead.id);
    expect(activity.map((a) => a.type)).toEqual(
      expect.arrayContaining([
        "lead_updated",
        "lead_created",
        "follow_up_scheduled",
      ]),
    );
    expect(
      activity.find((event) => event.type === "follow_up_scheduled")
        ?.followUpAt,
    ).toBe(changed.nextFollowUpAt);
    expect(JSON.stringify(activity)).not.toContain("Private research");
    await expect(
      updateLead(lead.id, input(), lead.updatedAt),
    ).rejects.toMatchObject({ status: 409 });
    await updateLead(
      lead.id,
      input({
        status: changed.status,
        priority: changed.priority,
        adminNotes: changed.adminNotes,
        nextFollowUpAt: null,
        followUpNote: "",
      }),
      changed.updatedAt,
    ).catch((error) => {
      throw error;
    });
  });
  it("suppresses unchanged edit events and rolls back saves when activity fails", async () => {
    const lead = await prospect();
    const unchanged = await updateLead(lead.id, input(), lead.updatedAt);
    expect(await listLeadActivity(lead.id)).toHaveLength(1);
    await db.exec(`CREATE FUNCTION reject_lead_event() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'test'; END $$;
      CREATE TRIGGER reject_lead_event BEFORE INSERT ON inquiry_activity FOR EACH ROW EXECUTE FUNCTION reject_lead_event();`);
    try {
      await expect(
        updateLead(lead.id, input({ priority: "high" }), unchanged.updatedAt),
      ).rejects.toBeDefined();
      expect((await getLead(lead.id)).priority).toBe("medium");
    } finally {
      await db.exec(
        "DROP TRIGGER reject_lead_event ON inquiry_activity; DROP FUNCTION reject_lead_event()",
      );
    }
  });
  it("searches literally, combines filters and paginates without logging reads", async () => {
    const lead = await prospect({
      company: "50%_Studio",
      status: "researching",
      priority: "high",
      phone: "555-123",
      nextFollowUpAt: "2020-01-01T00:00:00.000Z",
    });
    await prospect({ company: "Other" });
    for (const search of ["50%_", "555-123", "STUDIO"])
      expect(
        (
          await listLeads(
            leadBrowseSchema.parse({
              search,
              status: "researching",
              priority: "high",
              followUp: "overdue",
            }),
          )
        ).items.map((a) => a.id),
      ).toEqual([lead.id]);
    expect(
      (
        await listLeads(
          leadBrowseSchema.parse({ search: "'; DROP TABLE leads;--" }),
        )
      ).total,
    ).toBe(0);
    for (let i = 0; i < 25; i++) await prospect({ company: "Paged " + i });
    const list = await listLeads(leadBrowseSchema.parse({ page: 2 }));
    expect(list.items).toHaveLength(2);
    expect(list.total).toBe(27);
    expect(await listLeadActivity(lead.id)).toHaveLength(1);
  });
  it("reuses preview/send/retry, scopes messages to the lead and records actual outcomes", async () => {
    const lead = await prospect({ name: inquiry.name, email: inquiry.email }),
      owner = { leadId: lead.id },
      composition = compose();
    expect((await previewEmail(owner, composition)).bodyHtml).toContain(
      "Volatile Solutions",
    );
    const sent = await sendMessage(owner, composition);
    expect(sent.status).toBe("sent");
    expect((await sendMessage(owner, composition)).id).toBe(sent.id);
    expect(mocks.send).toHaveBeenCalledTimes(1);
    expect((await listMessages(owner)).items).toHaveLength(1);
    expect((await listLeadActivity(lead.id))[0].type).toBe("email_sent");
    expect((await getLead(lead.id)).lastContactAt).toBe(sent.sentAt);
    mocks.send.mockResolvedValueOnce({
      data: null,
      error: { name: "validation_error" },
    });
    const failed = await sendMessage(owner, compose());
    expect(failed.status).toBe("failed");
    expect((await retryMessage(owner, failed.id)).status).toBe("sent");
    const other = await prospect({ email: inquiry.email });
    expect(
      (
        await messagesEndpoint(
          req("/api/admin/messages?lead=" + other.id + "&message=" + sent.id),
          context,
        )
      ).status,
    ).toBe(404);
    await expect(
      sendMessage(owner, compose("other@example.test")),
    ).rejects.toMatchObject({ status: 422 });
    const partial = await prospect();
    await expect(
      sendMessage({ leadId: partial.id }, compose()),
    ).rejects.toMatchObject({ status: 422 });
  });
  it("creates a lead booking link and reserves/changes meetings through the existing scheduler", async () => {
    const lead = await prospect({ email: inquiry.email });
    const booking = await meeting(lead.id);
    expect(booking).toMatchObject({
      inquiryId: null,
      leadId: lead.id,
      status: "scheduled",
    });
    expect((await listLeadActivity(lead.id)).map((a) => a.type)).toContain(
      "booking_scheduled",
    );
    const cancelled = await changeAdminBooking({
      id: booking.id,
      action: "cancel",
      updatedAt: booking.updatedAt,
      confirmed: true,
    });
    expect(cancelled.status).toBe("cancelled");
    expect(
      (
        await bookingEndpoint(
          req("/api/admin/bookings?lead=" + lead.id),
          context,
        )
      ).status,
    ).toBe(200);
    await expect(
      createInquiryBookingLink({ leadId: (await prospect()).id }),
    ).rejects.toMatchObject({ status: 422 });
  });
  it("reuses proposal publishing/acceptance and accepted-proposal invoice creation/output", async () => {
    const lead = await prospect({
        name: inquiry.name,
        email: inquiry.email,
        adminNotes: "PRIVATE LEAD RESEARCH",
      }),
      owner = { leadId: lead.id };
    const response = await proposalsEndpoint(
      req("/api/admin/proposals", "POST", {
        leadId: lead.id,
        title: "Website proposal",
      }),
      context,
    );
    expect(response.status).toBe(201);
    const p = await acceptedProposal(owner);
    expect(p).toMatchObject({
      inquiryId: null,
      leadId: lead.id,
      status: "accepted",
    });
    const publicProposal = await getPublicProposal(token(p.publicUrl!));
    expect(JSON.stringify(publicProposal)).not.toContain("PRIVATE");
    expect(publicProposal).not.toHaveProperty("leadId");
    const n = await createInvoice(p.id);
    expect(n).toMatchObject({ inquiryId: null, leadId: lead.id });
    const saved = await saveInvoice(
      n.id,
      invoiceDraft.parse({
        action: "save",
        title: n.title,
        issueDate: n.issueDate,
        dueDate: future(),
        clientName: n.clientName,
        clientCompany: n.clientCompany,
        clientEmail: n.clientEmail,
        billing: n.billing,
        items: n.items.map(({ description, quantity, unitPriceCents }) => ({
          description,
          quantity,
          unitPriceCents,
        })),
        discountCents: n.discountCents,
        taxRateBasisPoints: n.taxRateBasisPoints,
        notes: n.notes,
        terms: n.terms,
        updatedAt: n.updatedAt,
      }),
    );
    const sent = await sendInvoice(saved.id, saved.updatedAt);
    await recordInvoiceView(token(sent.publicUrl!));
    expect((await getPublicInvoice(token(sent.publicUrl!))).clientEmail).toBe(
      inquiry.email,
    );
    const events = (await listLeadActivity(lead.id)).map((a) => a.type);
    expect(events).toEqual(
      expect.arrayContaining([
        "proposal_created",
        "proposal_sent",
        "proposal_accepted",
        "invoice_created",
        "invoice_updated",
        "invoice_sent",
        "invoice_viewed",
      ]),
    );
    expect(
      (
        await invoicesEndpoint(
          req("/api/admin/invoices?lead=" + lead.id),
          context,
        )
      ).status,
    ).toBe(200);
  });
  it("creates a proposal for a name-only lead without fabricating contact details", async () => {
    const lead = await prospect(),
      p = await createProposal({ leadId: lead.id }, "Research draft");
    expect(p.preparedFor).toEqual({
      name: "",
      company: lead.company,
      email: "",
    });
    await expect(createInvoice(p.id)).rejects.toMatchObject({ status: 409 });
  });
  it("requires real inquiry details and converts once without moving original business records or recording consent", async () => {
    const lead = await prospect({
      phone: "555-123",
      adminNotes: "Verified notes",
      nextFollowUpAt: future() + "T15:00:00.000Z",
    });
    await createProposal({ leadId: lead.id }, "Original draft");
    const invalid = await call(lead.id, "POST", {
      action: "convert",
      updatedAt: lead.updatedAt,
      inquiry: { name: "Contact" },
    });
    expect(invalid.status).toBe(422);
    expect(await count("inquiries")).toBe(0);
    const converted = await convertLead(lead.id, lead.updatedAt, inquiry);
    expect(converted.status).toBe("converted");
    expect(converted.phone).toBe("555-123");
    const record = await getInquiry(converted.convertedInquiryId!);
    expect(record).toMatchObject({
      ...inquiry,
      source: "lead-conversion",
      consentAt: null,
      adminNotes: "Verified notes",
    });
    expect(
      (await convertLead(lead.id, lead.updatedAt, inquiry)).convertedInquiryId,
    ).toBe(record.id);
    expect(await count("inquiries")).toBe(1);
    await expect(
      updateLead(lead.id, input({ status: "interested" }), converted.updatedAt),
    ).rejects.toMatchObject({ status: 422 });
    await deleteLead(lead.id, converted.updatedAt);
    expect((await getInquiry(record.id)).name).toBe(inquiry.name);
    expect(await count("proposals")).toBe(0);
  });
  it("preserves a converted original lead when its inquiry is deleted, and never converts it twice", async () => {
    const lead = await prospect(),
      converted = await convertLead(lead.id, lead.updatedAt, inquiry),
      record = await getInquiry(converted.convertedInquiryId!);
    await deleteInquiry(record.id, record.updatedAt);
    expect(await getLead(lead.id)).toMatchObject({
      status: "converted",
      convertedInquiryId: null,
    });
    await convertLead(lead.id, converted.updatedAt, inquiry);
    expect(await count("inquiries")).toBe(0);
  });
  it("deletes an empty lead; rejects stale deletes and missing references", async () => {
    const lead = await prospect();
    const changed = await updateLead(
      lead.id,
      input({ priority: "high" }),
      lead.updatedAt,
    );
    expect(
      (await call(lead.id, "DELETE", { updatedAt: lead.updatedAt })).status,
    ).toBe(409);
    expect(
      (await call(lead.id, "DELETE", { updatedAt: changed.updatedAt })).status,
    ).toBe(200);
    expect((await call(lead.id)).status).toBe(404);
    expect(await count("inquiry_activity")).toBe(0);
  });
  it("atomically removes lead-owned messages/bookings/links/proposals/invoices/items while preserving unrelated records", async () => {
    const lead = await prospect({ email: inquiry.email }),
      other = await prospect({ email: inquiry.email });
    const proposal = await acceptedProposal({ leadId: lead.id });
    await createInvoice(proposal.id);
    await meeting(lead.id);
    await sendMessage({ leadId: lead.id }, compose());
    await createProposal({ leadId: other.id }, "Unrelated lead proposal");
    const existingInquiry = await createInquiry(inquiry, randomUUID());
    await createProposal(existingInquiry, "Unrelated inquiry proposal");
    await deleteLead(lead.id, lead.updatedAt);
    for (const table of [
      "inquiry_messages",
      "bookings",
      "booking_links",
      "invoices",
      "invoice_items",
    ])
      expect(await count(table)).toBe(0);
    expect(await count("proposals")).toBe(2);
    expect(await getLead(other.id)).toBeDefined();
    expect(await getInquiry(existingInquiry)).toBeDefined();
  });
  it("rolls back every local deletion if an unexpected dependent row prevents cleanup", async () => {
    const lead = await prospect({ email: inquiry.email }),
      p = await acceptedProposal({ leadId: lead.id });
    await createInvoice(p.id);
    const message = await sendMessage({ leadId: lead.id }, compose());
    await db.query("INSERT INTO lead_deletion_guard VALUES($1)", [message.id]);
    await expect(deleteLead(lead.id, lead.updatedAt)).rejects.toMatchObject({
      status: 409,
    });
    expect(await getLead(lead.id)).toBeDefined();
    expect(await count("inquiry_activity")).toBeGreaterThan(2);
    expect(await count("invoices")).toBe(1);
    expect(await count("invoice_items")).toBe(1);
  });
  it("blocks deletion during email sending or unresolved external meeting cancellation", async () => {
    const lead = await prospect({ email: inquiry.email }),
      mail = await sendMessage({ leadId: lead.id }, compose());
    await db.query(
      "UPDATE inquiry_messages SET status='sending',provider_message_id=NULL,sent_at=NULL WHERE id=$1",
      [mail.id],
    );
    await expect(deleteLead(lead.id, lead.updatedAt)).rejects.toMatchObject({
      status: 409,
    });
    await db.query(
      "UPDATE inquiry_messages SET status='failed',error_code='delivery_unconfirmed' WHERE id=$1",
      [mail.id],
    );
    const b = await meeting(lead.id);
    await db.query(
      "UPDATE bookings SET status='cancelled',cancelled_at=clock_timestamp(),calendar_sync_status='failed',calendar_event_id='external-event',calendar_account_email='old@example.test',calendar_account_id='old',calendar_id='old' WHERE id=$1",
      [b.id],
    );
    await expect(deleteLead(lead.id, lead.updatedAt)).rejects.toMatchObject({
      status: 409,
    });
    expect(await getLead(lead.id)).toBeDefined();
  });
  it("enforces exclusive owners and matching owners across document, booking, message and history references", async () => {
    const first = await prospect({ email: inquiry.email }),
      second = await prospect({ email: inquiry.email }),
      p = await acceptedProposal({ leadId: first.id }),
      invoice = await createInvoice(p.id);
    await expect(
      db.query("UPDATE invoices SET lead_id=$1 WHERE id=$2", [
        second.id,
        invoice.id,
      ]),
    ).rejects.toBeDefined();
    const mail = await sendMessage({ leadId: second.id }, compose());
    await expect(
      db.query("UPDATE inquiry_messages SET proposal_id=$1 WHERE id=$2", [
        p.id,
        mail.id,
      ]),
    ).rejects.toBeDefined();
    await expect(
      db.query(
        "INSERT INTO inquiry_activity(lead_id,activity_type,actor,message_id) VALUES($1,'email_sent','admin',$2)",
        [first.id, mail.id],
      ),
    ).rejects.toBeDefined();
    await expect(
      db.query("INSERT INTO proposals(title) VALUES($1)", ["Unowned"]),
    ).rejects.toBeDefined();
  });
  it("requires server-side admin authorization before every lead action and shared lead CRM endpoint", async () => {
    const lead = await prospect();
    for (const user of [null, { roles: ["member"] }]) {
      mocks.user.mockResolvedValue(user);
      mocks.query.mockClear();
      for (const [endpoint, path, method, body] of [
        [leadsEndpoint, "/api/admin/leads", "GET"],
        [leadsEndpoint, "/api/admin/leads?id=" + lead.id, "GET"],
        [leadsEndpoint, "/api/admin/leads", "POST", { company: "Denied" }],
        [leadsEndpoint, "/api/admin/leads?id=" + lead.id, "PATCH", input()],
        [
          leadsEndpoint,
          "/api/admin/leads?id=" + lead.id,
          "DELETE",
          { updatedAt: lead.updatedAt },
        ],
        [
          leadsEndpoint,
          "/api/admin/leads?id=" + lead.id,
          "POST",
          { action: "convert" },
        ],
        [
          messagesEndpoint,
          "/api/admin/messages?lead=" + lead.id,
          "POST",
          compose(),
        ],
        [
          bookingEndpoint,
          "/api/admin/bookings",
          "POST",
          { action: "create-link", leadId: lead.id },
        ],
        [
          proposalsEndpoint,
          "/api/admin/proposals",
          "POST",
          { leadId: lead.id, title: "Denied" },
        ],
        [invoicesEndpoint, "/api/admin/invoices?lead=" + lead.id, "GET"],
      ] as const)
        expect((await endpoint(req(path, method, body), context)).status).toBe(
          user ? 403 : 401,
        );
      expect(mocks.query).not.toHaveBeenCalled();
    }
  });
  it("rejects cross-origin mutations, invalid IDs and ambiguous lead/inquiry ownership", async () => {
    const lead = await prospect();
    for (const method of ["PATCH", "POST", "DELETE"])
      expect(
        (
          await leadsEndpoint(
            req(
              "/api/admin/leads?id=" + lead.id,
              method,
              {},
              "https://attacker.test",
            ),
            context,
          )
        ).status,
      ).toBe(403);
    expect((await call("bad")).status).toBe(400);
    for (const endpoint of [
      messagesEndpoint,
      bookingEndpoint,
      proposalsEndpoint,
      invoicesEndpoint,
    ])
      expect(
        (
          await endpoint(
            req(
              "/api/admin/anything?lead=" +
                lead.id +
                "&inquiry=" +
                randomUUID(),
            ),
            context,
          )
        ).status,
      ).toBe(400);
    const response = await call(lead.id);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
  });
});

describe("lead conversion and migration transaction guarantees", () => {
  it("rejects a stale conversion and makes concurrent retries create one inquiry", async () => {
    const lead = await prospect();
    const changed = await updateLead(
      lead.id,
      input({ priority: "high" }),
      lead.updatedAt,
    );
    await expect(
      convertLead(lead.id, lead.updatedAt, inquiry),
    ).rejects.toMatchObject({ status: 409 });
    expect(await count("inquiries")).toBe(0);
    const results = await Promise.all([
      convertLead(lead.id, changed.updatedAt, inquiry),
      convertLead(lead.id, changed.updatedAt, inquiry),
    ]);
    expect(
      new Set(results.map((result) => result.convertedInquiryId)).size,
    ).toBe(1);
    expect(await count("inquiries")).toBe(1);
    expect(
      (await listLeadActivity(lead.id)).filter(
        (event) => event.type === "lead_converted",
      ),
    ).toHaveLength(1);
  });
  it("rolls conversion back if its history cannot be written", async () => {
    const lead = await prospect();
    await db.exec(`CREATE FUNCTION reject_conversion() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
      IF NEW.activity_type='lead_converted' THEN RAISE EXCEPTION 'synthetic failure'; END IF; RETURN NEW; END $$;
      CREATE TRIGGER reject_conversion BEFORE INSERT ON inquiry_activity FOR EACH ROW EXECUTE FUNCTION reject_conversion();`);
    try {
      await expect(
        convertLead(lead.id, lead.updatedAt, inquiry),
      ).rejects.toBeDefined();
      expect(await count("inquiries")).toBe(0);
      expect(await getLead(lead.id)).toMatchObject({
        status: "saved",
        convertedInquiryId: null,
        convertedAt: null,
      });
      expect(await listLeadActivity(lead.id)).toHaveLength(1);
    } finally {
      await db.exec(
        "DROP TRIGGER reject_conversion ON inquiry_activity; DROP FUNCTION reject_conversion()",
      );
    }
  });
  it("upgrades populated inquiry data without seeding leads or changing existing timestamps/history", async () => {
    const legacy = new PGlite();
    try {
      const migrations = readdirSync("database/migrations")
        .filter((file) => file.endsWith(".sql"))
        .sort();
      for (const file of migrations.filter((file) => !file.startsWith("010_")))
        await legacy.exec(readFileSync("database/migrations/" + file, "utf8"));
      await legacy.exec(`INSERT INTO inquiries(name,email,project_type,project_stage,project_summary,budget_range,timeline,submission_key,payload_fingerprint)
        VALUES('Synthetic existing contact','old@example.test','website','existing','Actual existing project scope','unsure','flexible',gen_random_uuid(),'old-fingerprint');
        INSERT INTO inquiry_activity(inquiry_id,activity_type,actor) SELECT id,'inquiry_created','system' FROM inquiries;`);
      const before = (await legacy.query("SELECT * FROM inquiries")).rows;
      const events = (await legacy.query<Record<string, unknown>>("SELECT * FROM inquiry_activity"))
        .rows;
      await legacy.exec(
        readFileSync("database/migrations/010_create_leads.sql", "utf8"),
      );
      expect((await legacy.query("SELECT * FROM inquiries")).rows).toEqual(
        before,
      );
      expect(
        (await legacy.query<Record<string, unknown>>("SELECT * FROM inquiry_activity")).rows,
      ).toEqual(events.map((event) => ({ ...event, lead_id: null })));
      expect((await legacy.query("SELECT * FROM leads")).rows).toHaveLength(0);
    } finally {
      await legacy.close();
    }
  }, 30000);
});
