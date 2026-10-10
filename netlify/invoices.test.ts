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
  updateFollowUp,
} from "./lib/inquiry-store";
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
  getAdminInvoice,
  getProposalInvoice,
  getInquiryInvoices,
  saveInvoice,
  sendInvoice,
  changeInvoice,
  getPublicInvoice,
  recordInvoiceView,
  invoiceForEmail,
} from "./lib/invoice-store";
import {
  draftSchema,
  displayStatus,
  businessDate,
} from "../src/lib/invoices/contract";
import { invoiceTokenHash, checkedInvoiceToken } from "./lib/invoice-token";
import {
  previewEmail,
  sendMessage,
  retryMessage,
  listMessages,
} from "./lib/message-store";
import admin from "./functions/admin-invoices.mts";
import publicEndpoint, { config } from "./functions/invoice.mts";
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
const migrations = [
  "001_create_inquiries",
  "002_create_inquiry_activity",
  "003_add_follow_up_fields",
  "004_create_proposals",
  "005_create_inquiry_messages",
  "006_create_bookings",
  "007_create_integrations",
  "008_outlook_calendar_integration",
  "009_create_invoices",
];
const client = {
  name: "Client Name",
  email: "client@example.test",
  company: "Client Co",
  website: "",
  projectType: "website",
  projectStage: "new",
  projectSummary: "PRIVATE INQUIRY SUMMARY",
  helpNeeded: "",
  budgetRange: "unsure",
  timeline: "flexible",
};
const future = () =>
  new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
const request = (
  path: string,
  method = "GET",
  body?: unknown,
  origin = "https://site.example.test",
) =>
  new Request("https://site.example.test" + path, {
    method,
    headers: { Origin: origin, "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
const context = { params: {} } as never;
const token = (invoice: { publicUrl: string | null }) =>
  new URL(invoice.publicUrl!).pathname.split("/")[2];
async function proposal(accepted = true) {
  const inquiryId = await createInquiry(client as never, crypto.randomUUID());
  const p = await createProposal(inquiryId, "Custom website");
  const saved = await saveProposal(p.id, {
    action: "save",
    title: p.title,
    summary: "Client-safe description for the proposal.",
    validUntil: future(),
    items: [
      {
        description: "Design and development",
        quantity: 2,
        unitPriceCents: 125000,
      },
      { description: "Support", quantity: 1, unitPriceCents: 10000 },
    ],
    discountCents: 10000,
    taxRateBasisPoints: 700,
    internalNotes: "PRIVATE PROPOSAL NOTES",
    clientNotes: "Approved client-facing notes",
    updatedAt: p.updatedAt,
  });
  const sent = await sendProposal(saved.id, saved.updatedAt);
  if (accepted)
    await respondToProposal(
      new URL(sent.publicUrl!).pathname.split("/")[2],
      "accept",
    );
  return getAdminProposal(sent.id);
}
async function draft() {
  return createInvoice((await proposal()).id);
}
function edit(n: Awaited<ReturnType<typeof draft>>) {
  return draftSchema.parse({
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
  });
}
async function sent() {
  const n = await draft(),
    saved = await saveInvoice(n.id, edit(n));
  return sendInvoice(saved.id, saved.updatedAt);
}
beforeAll(async () => {
  db = new PGlite();
  for (const name of migrations)
    await db.exec(readFileSync("database/migrations/" + name + ".sql", "utf8"));
}, 30000);
afterAll(() => db.close());
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
beforeEach(async () => {
  await db.exec(
    "TRUNCATE invoice_items,invoices,integration_connections,integration_oauth_states,bookings,booking_links,inquiry_messages,proposal_items,proposals,inquiry_activity,inquiries;UPDATE booking_settings SET timezone='America/New_York';",
  );
  vi.resetAllMocks();
  mocks.query.mockImplementation(
    async (sql: string, params: unknown[] = []) =>
      (await db.query(sql, params)).rows,
  );
  mocks.user.mockResolvedValue({ roles: ["admin"] });
  for (const [key, value] of Object.entries({
    DATABASE_URL: "postgresql://isolated",
    SITE_URL: "https://site.example.test",
    INVOICE_TOKEN_SECRET: "ab".repeat(32),
    BOOKING_TOKEN_SECRET: "cd".repeat(32),
    EMAIL_FROM: "hello@example.test",
    EMAIL_REPLY_TO: "reply@example.test",
    RESEND_API_KEY: "synthetic",
  }))
    vi.stubEnv(key, value);
  vi.stubGlobal(
    "fetch",
    vi.fn(() => {
      throw Error("Unexpected live network attempt");
    }),
  );
  mocks.send.mockResolvedValue({
    data: { id: "synthetic-email" },
    error: null,
  });
});
describe("invoice conversion and independent pricing", () => {
  it("creates only from accepted proposals with an independent complete price/client snapshot", async () => {
    const p = await proposal(),
      before = await getAdminProposal(p.id),
      n = await createInvoice(p.id);
    expect(n).toMatchObject({
      proposalId: p.id,
      inquiryId: p.inquiryId,
      persistedStatus: "draft",
      dueDate: null,
      clientName: client.name,
      clientCompany: client.company,
      clientEmail: client.email,
      currency: "USD",
      subtotalCents: 260000,
      discountCents: 10000,
      taxCents: 17500,
      totalCents: 267500,
    });
    expect(n.items).toEqual(p.items);
    expect(n.notes).toBe(p.clientNotes);
    expect(n.issueDate).toBe(businessDate("America/New_York"));
    expect(await getAdminProposal(p.id)).toEqual(before);
    expect(
      (await listInquiryActivity(n.inquiryId)).filter(
        (e) => e.type === "invoice_created",
      ),
    ).toEqual([
      expect.objectContaining({ invoiceNumber: n.number, actor: "admin" }),
    ]);
  });
  it("rejects conversion from sent or draft proposals", async () => {
    const p = await proposal(false);
    await expect(createInvoice(p.id)).rejects.toMatchObject({ status: 409 });
    const id = await createInquiry(client as never, crypto.randomUUID()),
      d = await createProposal(id, "Draft");
    await expect(createInvoice(d.id)).rejects.toMatchObject({ status: 409 });
    expect((await db.query("SELECT * FROM invoices")).rows).toEqual([]);
  });
  it("prevents duplicate invoices and duplicate creation activity under concurrent retries", async () => {
    const p = await proposal(),
      values = await Promise.all([
        createInvoice(p.id),
        createInvoice(p.id),
        createInvoice(p.id),
      ]);
    expect(new Set(values.map((v) => v.id)).size).toBe(1);
    expect(await getInquiryInvoices(p.inquiryId)).toHaveLength(1);
    expect(
      (await listInquiryActivity(p.inquiryId)).filter(
        (e) => e.type === "invoice_created",
      ),
    ).toHaveLength(1);
  });
  it("allocates server sequence invoice numbers, preserves digits beyond 9999, and never uses row count", async () => {
    const p = await proposal(),
      q = await proposal();
    await db.exec("SELECT setval('invoice_number_sequence',10000,false)");
    const values = await Promise.all([
      createInvoice(p.id),
      createInvoice(q.id),
    ]);
    expect(values.map((v) => v.number)).toEqual(
      expect.arrayContaining([
        "VS-INV-" + new Date().getUTCFullYear() + "-10000",
        "VS-INV-" + new Date().getUTCFullYear() + "-10001",
      ]),
    );
  });
  it("keeps snapshots independent of later proposal/item/client changes", async () => {
    const p = await proposal(),
      n = await createInvoice(p.id);
    await db.query(
      "UPDATE proposal_items SET unit_price_cents=1,description='Altered source' WHERE proposal_id=$1",
      [p.id],
    );
    await db.query(
      "UPDATE inquiries SET name='Another name',company='Another company' WHERE id=$1",
      [p.inquiryId],
    );
    expect(await getAdminInvoice(n.id)).toEqual(n);
  });
  it("edits invoice items, totals and billing independently without modifying the proposal", async () => {
    const p = await proposal(),
      n = await createInvoice(p.id),
      saved = await saveInvoice(n.id, {
        ...edit(n),
        items: [
          {
            description: "Adjusted invoice scope",
            quantity: 3,
            unitPriceCents: 5000,
          },
        ],
        discountCents: 1000,
        taxRateBasisPoints: 1000,
        billing: {
          ...n.billing,
          line1: "Client-approved address",
          city: "Providence",
        },
        terms: "Due on the agreed date.",
      });
    expect(saved).toMatchObject({
      subtotalCents: 15000,
      discountCents: 1000,
      taxCents: 1400,
      totalCents: 15400,
      billing: { line1: "Client-approved address", city: "Providence" },
    });
    expect(await getAdminProposal(p.id)).toEqual(p);
  });
  it("uses exact half-up tax, permits optional addresses and assumes no due date", async () => {
    const n = await draft();
    expect(n.dueDate).toBeNull();
    expect(Object.values(n.billing).every((v) => v === null)).toBe(true);
    const saved = await saveInvoice(n.id, {
      ...edit(n),
      items: [
        { description: "Small adjustment", quantity: 1, unitPriceCents: 5 },
      ],
      discountCents: 0,
      taxRateBasisPoints: 1000,
    });
    expect(saved.taxCents).toBe(1);
    expect(saved.totalCents).toBe(6);
  });
  it.each([
    { discountCents: 260001 },
    { discountCents: -1 },
    { taxRateBasisPoints: 10001 },
    { items: [{ description: "Invalid", quantity: 0, unitPriceCents: 1 }] },
    { items: [{ description: "Invalid", quantity: 1.5, unitPriceCents: 1 }] },
    { items: [{ description: "Invalid", quantity: 1, unitPriceCents: -1 }] },
    { totalCents: 1 },
    { status: "paid" },
    { dueDate: "2026-02-30" },
    { dueDate: "1900-01-01" },
  ])("rejects invalid or forged pricing/dates %j", async (invalid) => {
    const n = await draft(),
      result = await admin(
        request("/api/admin/invoices?id=" + n.id, "PATCH", {
          ...edit(n),
          ...invalid,
        }),
        context,
      );
    expect(result.status).toBe(422);
    expect(await getAdminInvoice(n.id)).toEqual(n);
  });
  it("rejects line overflow, excessive item counts and unsupported currency", async () => {
    const n = await draft();
    for (const changes of [
      {
        items: Array.from({ length: 26 }, () => ({
          description: "Item",
          quantity: 1,
          unitPriceCents: 1,
        })),
      },
      {
        items: [
          {
            description: "Overflow",
            quantity: 10000,
            unitPriceCents: 100000000,
          },
        ],
        discountCents: 0,
      },
      { currency: "EUR" },
    ])
      expect(
        (
          await admin(
            request("/api/admin/invoices?id=" + n.id, "PATCH", {
              ...edit(n),
              ...changes,
            }),
            context,
          )
        ).status,
      ).toBe(422);
  });
  it("rejects stale draft saves without changing items/activity and suppresses unchanged events", async () => {
    const n = await draft(),
      saved = await saveInvoice(n.id, edit(n)),
      events = await listInquiryActivity(n.inquiryId);
    await expect(saveInvoice(n.id, edit(n))).rejects.toMatchObject({
      status: 409,
    });
    expect(await getAdminInvoice(n.id)).toEqual(saved);
    expect(await listInquiryActivity(n.inquiryId)).toEqual(events);
    await saveInvoice(n.id, edit(saved));
    expect(
      (await listInquiryActivity(n.inquiryId)).filter(
        (e) => e.type === "invoice_updated",
      ),
    ).toHaveLength(1);
  });
});
describe("publication, views and controlled payment statuses", () => {
  it("requires explicit due-date selection and complete saved lines before publishing", async () => {
    const n = await draft();
    await expect(sendInvoice(n.id, n.updatedAt)).rejects.toMatchObject({
      status: 422,
      fields: { dueDate: expect.any(String) },
    });
    const empty = await saveInvoice(n.id, {
      ...edit(n),
      items: [],
      discountCents: 0,
    });
    await expect(sendInvoice(empty.id, empty.updatedAt)).rejects.toMatchObject({
      status: 422,
      fields: { items: expect.any(String) },
    });
  });
  it("publishes a stable SITE_URL link with only its hash/time persisted, freezing invoice content", async () => {
    const n = await sent(),
      t = token(n),
      row = (
        await db.query<Record<string, unknown>>(
          "SELECT * FROM invoices WHERE id=$1",
          [n.id],
        )
      ).rows[0];
    expect(n.publicUrl).toMatch(
      /^https:\/\/site.example.test\/invoice\/[A-Za-z0-9_-]{43}\/$/,
    );
    expect(row.public_token_hash).toBe(invoiceTokenHash(t));
    expect(JSON.stringify(row)).not.toContain(t);
    expect((await getAdminInvoice(n.id)).publicUrl).toBe(n.publicUrl);
    await expect(saveInvoice(n.id, edit(n))).rejects.toMatchObject({
      status: 409,
    });
    await expect(sendInvoice(n.id, n.updatedAt)).rejects.toMatchObject({
      status: 409,
    });
  });
  it("keeps draft invoices unavailable and returns a generic error for unknown/malformed tokens", async () => {
    const n = await draft();
    expect(n.publicUrl).toBeNull();
    await expect(getPublicInvoice("a".repeat(43))).rejects.toMatchObject({
      status: 404,
    });
    expect(
      (await publicEndpoint(request("/api/invoice?token=" + n.id), context))
        .status,
    ).toBe(404);
  });
  it("returns only client-safe snapshot fields and uses no Warsaw address/registration placeholders", async () => {
    const n = await sent(),
      document = await getPublicInvoice(token(n)),
      output = JSON.stringify(document);
    for (const forbidden of [
      n.id,
      n.inquiryId,
      n.proposalId,
      "PRIVATE INQUIRY",
      "PRIVATE PROPOSAL",
      "Warsaw",
      "123 Example",
      "nip",
      "krs",
      "public_token",
      "payment_reference",
      "updatedAt",
      token(n),
    ])
      expect(output).not.toContain(forbidden);
    expect(document.sender).toEqual({
      name: "Volatile Solutions",
      email: "volatile-solutions@outlook.com",
      phone: "+14015456860",
      website: "https://volatile-solutions.net",
    });
  });
  it("does not record a view on GET/editor/preview and tracks first/repeat public acknowledgments once", async () => {
    const n = await sent();
    await getAdminInvoice(n.id);
    await getPublicInvoice(token(n));
    expect((await getAdminInvoice(n.id)).firstViewedAt).toBeNull();
    const first = await recordInvoiceView(token(n));
    expect(first.status).toBe("viewed");
    const old = await getAdminInvoice(n.id);
    await recordInvoiceView(token(n));
    const next = await getAdminInvoice(n.id);
    expect(next.firstViewedAt).toBe(old.firstViewedAt);
    expect(next.lastViewedAt! >= old.lastViewedAt!).toBe(true);
    expect(next.updatedAt).toBe(n.updatedAt);
    expect(
      (await listInquiryActivity(n.inquiryId)).filter(
        (e) => e.type === "invoice_viewed",
      ),
    ).toHaveLength(1);
  });
  it("serializes simultaneous first views with one event", async () => {
    const n = await sent();
    await Promise.all([
      recordInvoiceView(token(n)),
      recordInvoiceView(token(n)),
    ]);
    expect(
      (await listInquiryActivity(n.inquiryId)).filter(
        (e) => e.type === "invoice_viewed",
      ),
    ).toHaveLength(1);
  });
  it("derives overdue from the saved business date, with paid/void precedence and no cron/write", () => {
    const now = new Date("2026-10-10T01:00:00Z");
    expect(businessDate("America/New_York", now)).toBe("2026-10-09");
    expect(
      displayStatus("sent", "2026-10-09", null, "America/New_York", now),
    ).toBe("sent");
    expect(
      displayStatus(
        "sent",
        "2026-10-08",
        "2026-10-08T00:00:00Z",
        "America/New_York",
        now,
      ),
    ).toBe("overdue");
    expect(
      displayStatus("paid", "2026-10-08", null, "America/New_York", now),
    ).toBe("paid");
    expect(
      displayStatus("void", "2026-10-08", null, "America/New_York", now),
    ).toBe("void");
  });
  it("manually marks paid with timestamp/event and leaves processor placeholders empty", async () => {
    const n = await sent(),
      paid = await changeInvoice(n.id, n.updatedAt, "mark-paid");
    expect(paid).toMatchObject({
      status: "paid",
      persistedStatus: "paid",
      paidAt: expect.any(String),
    });
    expect((await getPublicInvoice(token(n))).paymentStatus).toContain(
      "manually",
    );
    const row = (
      await db.query<Record<string, unknown>>(
        "SELECT payment_provider,payment_reference FROM invoices WHERE id=$1",
        [n.id],
      )
    ).rows[0];
    expect(row).toEqual({ payment_provider: null, payment_reference: null });
    expect(
      (await listInquiryActivity(n.inquiryId)).filter(
        (e) => e.type === "invoice_paid",
      ),
    ).toHaveLength(1);
    await expect(
      changeInvoice(paid.id, paid.updatedAt, "void"),
    ).rejects.toMatchObject({ status: 409 });
  });
  it("voids only sent invoices, retaining their client document and history", async () => {
    const n = await sent(),
      voided = await changeInvoice(n.id, n.updatedAt, "void");
    expect(voided.voidedAt).toBeTruthy();
    expect((await getPublicInvoice(token(n))).status).toBe("void");
    await expect(
      changeInvoice(voided.id, voided.updatedAt, "mark-paid"),
    ).rejects.toMatchObject({ status: 409 });
    expect(
      (await listInquiryActivity(n.inquiryId)).filter(
        (e) => e.type === "invoice_voided",
      ),
    ).toHaveLength(1);
  });
  it("requires explicit confirmation for send/paid/void and prevents public payment mutations", async () => {
    const n = await sent();
    for (const action of ["send", "mark-paid", "void"])
      expect(
        (
          await admin(
            request("/api/admin/invoices?id=" + n.id, "PATCH", {
              action,
              updatedAt: n.updatedAt,
            }),
            context,
          )
        ).status,
      ).toBe(422);
    expect(
      (
        await publicEndpoint(
          request("/api/invoice?token=" + token(n), "POST", {
            action: "mark-paid",
          }),
          context,
        )
      ).status,
    ).toBe(422);
  });
  it("published proposal links show only their own published invoice, without altering acceptance", async () => {
    const p = await proposal(),
      proposalToken = new URL(p.publicUrl!).pathname.split("/")[2];
    expect((await getPublicProposal(proposalToken)).invoice).toBeUndefined();
    const n = await createInvoice(p.id);
    expect((await getPublicProposal(proposalToken)).invoice).toBeUndefined();
    const saved = await saveInvoice(n.id, edit(n)),
      published = await sendInvoice(saved.id, saved.updatedAt);
    expect((await getPublicProposal(proposalToken)).invoice).toEqual({
      number: published.number,
      url: published.publicUrl,
    });
    expect((await getAdminProposal(p.id)).status).toBe("accepted");
  });
  it.each(["create", "save", "send", "view", "mark-paid", "void"] as const)(
    "rolls back %s together with invoice/items/activity on event persistence failure",
    async (action) => {
      const n = ["view", "mark-paid", "void"].includes(action)
        ? await sent()
        : await draft();
      const before = await getAdminInvoice(n.id),
        events = await listInquiryActivity(n.inquiryId);
      const source = action === "create" ? await proposal() : null;
      const saved = action === "send" ? await saveInvoice(n.id, edit(n)) : n;
      const snapshot = await getAdminInvoice(n.id);
      await db.exec(
        "CREATE FUNCTION reject_invoice_event() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.activity_type LIKE 'invoice_%' THEN RAISE EXCEPTION 'isolated failure'; END IF; RETURN NEW; END $$;CREATE TRIGGER reject_invoice_event BEFORE INSERT ON inquiry_activity FOR EACH ROW EXECUTE FUNCTION reject_invoice_event();",
      );
      try {
        await expect(
          action === "create"
            ? createInvoice(source!.id)
            : action === "save"
              ? saveInvoice(n.id, edit(n))
              : action === "send"
                ? sendInvoice(n.id, saved.updatedAt)
                : action === "view"
                  ? recordInvoiceView(token(n))
                  : changeInvoice(n.id, n.updatedAt, action),
        ).rejects.toBeDefined();
        expect(await getAdminInvoice(n.id)).toEqual(snapshot);
        if (source) expect(await getProposalInvoice(source.id)).toBeNull();
        if (action !== "send")
          expect(await listInquiryActivity(n.inquiryId)).toEqual(events);
      } finally {
        await db.exec(
          "DROP TRIGGER reject_invoice_event ON inquiry_activity;DROP FUNCTION reject_invoice_event()",
        );
      }
    },
  );
});
describe("invoice communication and security", () => {
  const mail = {
    to: client.email,
    subject: "Your invoice",
    message: "Please review your invoice below.",
    templateKey: "personal" as const,
    includeProposal: false,
    includeInvoice: true,
  };
  it("offers invoice CTA only for published invoices and never auto-sends", async () => {
    const n = await draft();
    expect(await invoiceForEmail(n.inquiryId)).toBeNull();
    await expect(previewEmail(n.inquiryId, mail)).rejects.toMatchObject({
      status: 422,
    });
    const saved = await saveInvoice(n.id, edit(n)),
      s = await sendInvoice(n.id, saved.updatedAt);
    expect(mocks.send).not.toHaveBeenCalled();
    const preview = await previewEmail(n.inquiryId, mail);
    expect(preview.bodyHtml).toContain("View Invoice");
    expect(preview.bodyHtml).toContain(s.publicUrl);
    expect((await listMessages(n.inquiryId)).invoice).toEqual({
      number: s.number,
      url: s.publicUrl,
    });
    expect((await getAdminInvoice(n.id)).firstViewedAt).toBeNull();
  });
  it("persists no raw invoice token in email snapshots and hydrates the same URL for provider retries", async () => {
    const n = await sent(),
      key = crypto.randomUUID();
    mocks.send.mockResolvedValueOnce({
      data: null,
      error: { statusCode: 503, message: "private provider" },
    });
    const failed = await sendMessage(n.inquiryId, { ...mail, requestKey: key });
    expect(failed.status).toBe("failed");
    const row = (
      await db.query<Record<string, unknown>>(
        "SELECT * FROM inquiry_messages WHERE id=$1",
        [failed.id],
      )
    ).rows[0];
    expect(JSON.stringify(row)).not.toContain(token(n));
    expect(row.body_html).toContain("{{INVOICE_TOKEN}}");
    expect(mocks.send.mock.calls[0][0].html).toContain(n.publicUrl);
    await retryMessage(n.inquiryId, failed.id);
    expect(mocks.send.mock.calls[1][0].html).toContain(n.publicUrl);
    expect(mocks.send.mock.calls[0][1].idempotencyKey).toBe(
      mocks.send.mock.calls[1][1].idempotencyKey,
    );
    expect(mocks.send.mock.calls[0][0]).toEqual(mocks.send.mock.calls[1][0]);
  });
  it("rejects invoice CTA combinations and unrelated invoice links", async () => {
    const n = await sent();
    await expect(
      previewEmail(n.inquiryId, { ...mail, includeProposal: true }),
    ).rejects.toMatchObject({ status: 422 });
    await expect(
      sendMessage(n.inquiryId, {
        ...mail,
        message: "https://site.example.test/invoice/" + "a".repeat(43) + "/",
        requestKey: crypto.randomUUID(),
      }),
    ).rejects.toMatchObject({ status: 422 });
  });
  it("does not retry a frozen invoice email after its invoice is voided", async () => {
    const n = await sent();
    mocks.send.mockResolvedValueOnce({
      data: null,
      error: { statusCode: 503 },
    });
    const failed = await sendMessage(n.inquiryId, {
      ...mail,
      requestKey: crypto.randomUUID(),
    });
    await changeInvoice(n.id, n.updatedAt, "void");
    await expect(retryMessage(n.inquiryId, failed.id)).rejects.toMatchObject({
      status: 409,
    });
    expect(mocks.send).toHaveBeenCalledTimes(1);
  });
  it("key loss does not hide invoices or disable existing public token lookup, but prevents sharing/retry", async () => {
    const n = await sent(),
      t = token(n);
    vi.stubEnv("INVOICE_TOKEN_SECRET", "cd".repeat(32));
    expect((await getAdminInvoice(n.id)).publicUrl).toBeNull();
    expect((await getPublicInvoice(t)).number).toBe(n.number);
    expect(await invoiceForEmail(n.inquiryId)).toBeNull();
    await expect(invoiceForEmail(n.inquiryId, true)).rejects.toMatchObject({
      status: 503,
    });
  });
  it("requires admin auth before all private database access and same-origin mutations", async () => {
    for (const method of ["GET", "POST", "PATCH"]) {
      mocks.user.mockResolvedValue(null);
      mocks.query.mockClear();
      expect(
        (
          await admin(
            request(
              "/api/admin/invoices",
              method,
              method === "GET"
                ? undefined
                : { proposalId: crypto.randomUUID() },
            ),
            context,
          )
        ).status,
      ).toBe(401);
      expect(mocks.query).not.toHaveBeenCalled();
      mocks.user.mockResolvedValue({ roles: ["client"] });
      expect(
        (await admin(request("/api/admin/invoices", method), context)).status,
      ).toBe(403);
    }
    mocks.user.mockResolvedValue({ roles: ["admin"] });
    expect(
      (
        await admin(
          request(
            "/api/admin/invoices",
            "POST",
            { proposalId: crypto.randomUUID() },
            "https://attacker.test",
          ),
          context,
        )
      ).status,
    ).toBe(403);
  });
  it("requires same-origin view acknowledgments and declares public rate protection", async () => {
    const n = await sent();
    expect(
      (
        await publicEndpoint(
          request(
            "/api/invoice?token=" + token(n),
            "POST",
            { action: "view" },
            "https://attacker.test",
          ),
          context,
        )
      ).status,
    ).toBe(403);
    expect(config.rateLimit).toMatchObject({
      action: "rate_limit",
      aggregateBy: ["ip", "domain"],
      windowSize: 60,
      windowLimit: 120,
    });
  });
  it("keeps inquiry status, notes and follow-up versions unchanged during invoice lifecycle", async () => {
    const n = await draft(),
      inquiry = await getInquiry(n.inquiryId),
      followed = await updateFollowUp(
        n.inquiryId,
        new Date(Date.now() + 86400000).toISOString(),
        "Private follow-up",
        inquiry.updatedAt,
      );
    const s = await saveInvoice(n.id, edit(n)),
      published = await sendInvoice(n.id, s.updatedAt);
    await recordInvoiceView(token(published));
    await changeInvoice(n.id, published.updatedAt, "mark-paid");
    expect(await getInquiry(n.inquiryId)).toEqual(followed);
  });
  it("restricts deleting invoices/proposals/inquiries with business history", async () => {
    const n = await sent();
    for (const [table, id] of [
      ["invoices", n.id],
      ["proposals", n.proposalId],
      ["inquiries", n.inquiryId],
    ])
      await expect(
        db.query("DELETE FROM " + table + " WHERE id=$1", [id]),
      ).rejects.toBeDefined();
  });
});

it("canonicalizes UUID token context so uppercase admin references publish the same usable link", async () => {
  const n = await draft(),
    saved = await saveInvoice(n.id, edit(n)),
    published = await sendInvoice(n.id.toUpperCase(), saved.updatedAt);
  expect(published.publicUrl).toBeTruthy();
  expect((await getPublicInvoice(token(published))).number).toBe(n.number);
});
