import company from "../../src/data/global/company.json";
import { query } from "./database";
import { publicUrl } from "./public-url";
import { HttpError } from "./http";
import {
  invoiceToken,
  invoiceTokenHash,
  checkedInvoiceToken,
} from "./invoice-token";
import {
  calculateTotals,
  displayStatus,
  type AdminInvoice,
  type PublicInvoice,
  type DraftInput,
  type InvoiceStatus,
} from "../../src/lib/invoices/contract";
type Row = Record<string, unknown>;
const iso = (v: unknown) =>
  (v instanceof Date ? v : new Date(String(v))).toISOString();
const date = (v: unknown) =>
  v == null
    ? null
    : v instanceof Date
      ? v.toISOString().slice(0, 10)
      : String(v).slice(0, 10);
const itemsSql = (source: string) =>
  `COALESCE((SELECT jsonb_agg(jsonb_build_object('description',description,'quantity',quantity,'unit_price_cents',unit_price_cents,'line_total_cents',line_total_cents) ORDER BY position) FROM invoice_items WHERE invoice_id=${source}.id),'[]'::jsonb) AS items`;
const selection = `SELECT n.*,${itemsSql("n")} FROM invoices n`;
function publicData(row: Row): PublicInvoice {
  const status = displayStatus(
    row.status as InvoiceStatus,
    date(row.due_date),
    row.first_viewed_at ? iso(row.first_viewed_at) : null,
    String(row.business_timezone),
  );
  return {
    number: String(row.invoice_number),
    status,
    title: String(row.title),
    currency: "USD",
    issueDate: date(row.issue_date)!,
    dueDate: date(row.due_date),
    clientName: String(row.client_name),
    clientCompany: String(row.client_company),
    clientEmail: String(row.client_email),
    billing: {
      line1: row.billing_address_line1
        ? String(row.billing_address_line1)
        : null,
      line2: row.billing_address_line2
        ? String(row.billing_address_line2)
        : null,
      city: row.billing_city ? String(row.billing_city) : null,
      region: row.billing_region ? String(row.billing_region) : null,
      postalCode: row.billing_postal_code
        ? String(row.billing_postal_code)
        : null,
      country: row.billing_country ? String(row.billing_country) : null,
    },
    sender: {
      name: String(row.sender_name),
      email: String(row.sender_email),
      phone: String(row.sender_phone),
      website: String(row.sender_website),
    },
    items: ((row.items as Row[]) || []).map((v) => ({
      description: String(v.description),
      quantity: Number(v.quantity),
      unitPriceCents: Number(v.unit_price_cents),
      lineTotalCents: Number(v.line_total_cents),
    })),
    subtotalCents: Number(row.subtotal_cents),
    discountCents: Number(row.discount_cents),
    taxRateBasisPoints: Number(row.tax_rate_basis_points),
    taxCents: Number(row.tax_cents),
    totalCents: Number(row.total_cents),
    notes: String(row.notes),
    terms: String(row.terms),
    paidAt: row.paid_at ? iso(row.paid_at) : null,
    paymentStatus:
      row.status === "paid"
        ? "Paid — recorded manually by Volatile Solutions."
        : row.status === "void"
          ? "Void — no payment is due."
          : row.status === "draft"
            ? "Draft — not issued."
            : "Unpaid — contact Volatile Solutions for payment instructions.",
  };
}
export function invoiceUrl(row: Row) {
  return publicUrl(
    "/invoice/" +
      checkedInvoiceToken(
        String(row.id),
        iso(row.public_token_created_at),
        String(row.public_token_hash),
      ) +
      "/",
  );
}
function adminData(row: Row): AdminInvoice {
  let url: string | null = null;
  if (row.public_token_hash) {
    try {
      url = invoiceUrl(row);
    } catch {
      /* Reading a saved invoice must work if its sharing key needs restoration. */
    }
  }
  return {
    ...publicData(row),
    id: String(row.id),
    inquiryId: String(row.inquiry_id),
    proposalId: String(row.proposal_id),
    persistedStatus: row.status as InvoiceStatus,
    businessTimezone: String(row.business_timezone),
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
    sentAt: row.sent_at ? iso(row.sent_at) : null,
    firstViewedAt: row.first_viewed_at ? iso(row.first_viewed_at) : null,
    lastViewedAt: row.last_viewed_at ? iso(row.last_viewed_at) : null,
    voidedAt: row.voided_at ? iso(row.voided_at) : null,
    publicUrl: url,
  };
}
export async function getAdminInvoice(id: string) {
  const row = (await query(selection + " WHERE n.id=$1", [id]))[0];
  if (!row) throw new HttpError(404, "This invoice could not be found.");
  return adminData(row);
}
export async function getProposalInvoice(proposalId: string) {
  const row = (
    await query(selection + " WHERE n.proposal_id=$1", [proposalId])
  )[0];
  return row ? adminData(row) : null;
}
export async function getInquiryInvoices(inquiryId: string) {
  const exists = (
    await query("SELECT id FROM inquiries WHERE id=$1", [inquiryId])
  )[0];
  if (!exists) throw new HttpError(404, "This inquiry could not be found.");
  return (
    await query(
      selection + " WHERE n.inquiry_id=$1 ORDER BY n.created_at DESC,n.id DESC",
      [inquiryId],
    )
  ).map(adminData);
}
export async function createInvoice(proposalId: string) {
  const rows = await query(
    `WITH source AS MATERIALIZED(
 SELECT p.*,i.name,i.company,i.email,COALESCE((SELECT timezone FROM booking_settings WHERE id=true),'America/New_York') AS zone
 FROM proposals p JOIN inquiries i ON i.id=p.inquiry_id WHERE p.id=$1 AND p.status='accepted' FOR UPDATE OF p
 ),created AS(
 INSERT INTO invoices(proposal_id,inquiry_id,title,business_timezone,issue_date,client_name,client_company,client_email,
  sender_name,sender_email,sender_phone,sender_website,subtotal_cents,discount_cents,tax_rate_basis_points,tax_cents,total_cents,currency,notes)
 SELECT id,inquiry_id,title,zone,(clock_timestamp() AT TIME ZONE zone)::date,name,company,email,$2,$3,$4,$5,subtotal_cents,discount_cents,tax_rate_basis_points,tax_cents,total_cents,currency,client_notes FROM source
 ON CONFLICT(proposal_id) DO NOTHING RETURNING *
 ),copied AS(
 INSERT INTO invoice_items(invoice_id,position,description,quantity,unit_price_cents)
 SELECT created.id,p.position,p.description,p.quantity,p.unit_price_cents FROM created JOIN proposal_items p ON p.proposal_id=created.proposal_id RETURNING *
 ),activity AS(
 INSERT INTO inquiry_activity(inquiry_id,activity_type,actor,invoice_id,invoice_number,created_at)
 SELECT inquiry_id,'invoice_created','admin',id,invoice_number,updated_at FROM created RETURNING id
 )SELECT created.*,COALESCE((SELECT jsonb_agg(jsonb_build_object('description',description,'quantity',quantity,'unit_price_cents',unit_price_cents,'line_total_cents',line_total_cents) ORDER BY position) FROM copied),'[]'::jsonb) AS items FROM created`,
    [proposalId, company.name, company.email, company.phone, company.siteUrl],
  );
  if (rows[0]) return adminData(rows[0]);
  const existing = await getProposalInvoice(proposalId);
  if (existing) return existing;
  throw new HttpError(
    409,
    "An accepted proposal is required to create an invoice.",
  );
}
async function conflict(id: string): Promise<never> {
  const row = await getAdminInvoice(id);
  throw new HttpError(
    409,
    row.persistedStatus === "draft"
      ? "This invoice changed in another session. Reload before saving. Your edits are still here."
      : "This invoice is published and its content can no longer be edited.",
  );
}
export async function saveInvoice(id: string, input: DraftInput) {
  let totals;
  try {
    totals = calculateTotals(
      input.items,
      input.discountCents,
      input.taxRateBasisPoints,
    );
  } catch (e) {
    throw new HttpError(
      422,
      e instanceof Error ? e.message : "Check invoice pricing.",
    );
  }
  const billing = [
      "line1",
      "line2",
      "city",
      "region",
      "postalCode",
      "country",
    ].map((k) => input.billing[k as keyof DraftInput["billing"]] || null),
    items = input.items.map((v, position) => ({
      position,
      description: v.description,
      quantity: v.quantity,
      unit_price_cents: v.unitPriceCents,
    }));
  const rows = await query(
    `WITH previous AS MATERIALIZED(
 SELECT n.*,COALESCE((SELECT jsonb_agg(jsonb_build_object('position',position,'description',description,'quantity',quantity,'unit_price_cents',unit_price_cents) ORDER BY position) FROM invoice_items WHERE invoice_id=n.id),'[]'::jsonb) old_items FROM invoices n WHERE id=$1 FOR UPDATE
 ),saved AS(
 UPDATE invoices n SET title=$2,issue_date=$3::date,due_date=$4::date,client_name=$5,client_company=$6,client_email=$7,
 billing_address_line1=$8,billing_address_line2=$9,billing_city=$10,billing_region=$11,billing_postal_code=$12,billing_country=$13,
 discount_cents=$14,tax_rate_basis_points=$15,subtotal_cents=$16,tax_cents=$17,total_cents=$18,notes=$19,terms=$20,
 updated_at=GREATEST(date_trunc('milliseconds',clock_timestamp()),previous.updated_at+interval '1 millisecond')
 FROM previous WHERE n.id=previous.id AND previous.status='draft' AND previous.updated_at=$21::timestamptz
 RETURNING n.*,(ROW(previous.title,previous.issue_date,previous.due_date,previous.client_name,previous.client_company,previous.client_email,previous.billing_address_line1,previous.billing_address_line2,previous.billing_city,previous.billing_region,previous.billing_postal_code,previous.billing_country,previous.discount_cents,previous.tax_rate_basis_points,previous.notes,previous.terms) IS DISTINCT FROM ROW(n.title,n.issue_date,n.due_date,n.client_name,n.client_company,n.client_email,n.billing_address_line1,n.billing_address_line2,n.billing_city,n.billing_region,n.billing_postal_code,n.billing_country,n.discount_cents,n.tax_rate_basis_points,n.notes,n.terms) OR previous.old_items IS DISTINCT FROM $22::jsonb) changed
 ),removed AS(DELETE FROM invoice_items WHERE invoice_id IN(SELECT id FROM saved) RETURNING id),inserted AS(
 INSERT INTO invoice_items(invoice_id,position,description,quantity,unit_price_cents)
 SELECT saved.id,v.position,v.description,v.quantity,v.unit_price_cents FROM saved CROSS JOIN jsonb_to_recordset($22::jsonb) AS v(position integer,description text,quantity integer,unit_price_cents integer)
 CROSS JOIN(SELECT count(*) FROM removed) barrier RETURNING *
 ),activity AS(INSERT INTO inquiry_activity(inquiry_id,activity_type,actor,invoice_id,invoice_number,created_at)
 SELECT inquiry_id,'invoice_updated','admin',id,invoice_number,updated_at FROM saved WHERE changed RETURNING id)
 SELECT saved.*,COALESCE((SELECT jsonb_agg(jsonb_build_object('description',description,'quantity',quantity,'unit_price_cents',unit_price_cents,'line_total_cents',line_total_cents) ORDER BY position) FROM inserted),'[]'::jsonb) items FROM saved`,
    [
      id,
      input.title,
      input.issueDate,
      input.dueDate,
      input.clientName,
      input.clientCompany,
      input.clientEmail,
      ...billing,
      input.discountCents,
      input.taxRateBasisPoints,
      totals.subtotalCents,
      totals.taxCents,
      totals.totalCents,
      input.notes,
      input.terms,
      input.updatedAt,
      JSON.stringify(items),
    ],
  );
  if (!rows[0]) return conflict(id);
  return adminData(rows[0]);
}
export async function sendInvoice(id: string, version: string) {
  const invoice = await getAdminInvoice(id);
  if (invoice.persistedStatus !== "draft" || invoice.updatedAt !== version)
    return conflict(id);
  const fields: Record<string, string> = {};
  if (!invoice.dueDate) fields.dueDate = "Choose a due date before sending.";
  if (!invoice.items.length || invoice.items.some((v) => !v.description.trim()))
    fields.items =
      "Add at least one item and describe every line before sending.";
  if (Object.keys(fields).length)
    throw new HttpError(
      422,
      "Complete and save the invoice before sending.",
      fields,
    );
  const createdAt = new Date().toISOString(),
    hash = invoiceTokenHash(invoiceToken(id, createdAt));
  const rows = await query(
    `WITH previous AS MATERIALIZED(SELECT * FROM invoices WHERE id=$1 FOR UPDATE),saved AS(
 UPDATE invoices n SET status='sent',sent_at=clock_timestamp(),public_token_hash=$3,public_token_created_at=$4::timestamptz,
 updated_at=GREATEST(date_trunc('milliseconds',clock_timestamp()),previous.updated_at+interval '1 millisecond')
 FROM previous WHERE n.id=previous.id AND previous.status='draft' AND previous.updated_at=$2::timestamptz RETURNING n.*
 ),activity AS(INSERT INTO inquiry_activity(inquiry_id,activity_type,actor,invoice_id,invoice_number,created_at)
 SELECT inquiry_id,'invoice_sent','admin',id,invoice_number,updated_at FROM saved RETURNING id)
 SELECT saved.*,${itemsSql("saved")} FROM saved`,
    [id, version, hash, createdAt],
  );
  if (!rows[0]) return conflict(id);
  return adminData(rows[0]);
}
export async function changeInvoice(
  id: string,
  version: string,
  action: "mark-paid" | "void",
) {
  const status = action === "mark-paid" ? "paid" : "void";
  const rows = await query(
    `WITH previous AS MATERIALIZED(SELECT * FROM invoices WHERE id=$1 FOR UPDATE),saved AS(
 UPDATE invoices n SET status=$3,paid_at=CASE WHEN $3='paid' THEN clock_timestamp() ELSE NULL END,voided_at=CASE WHEN $3='void' THEN clock_timestamp() ELSE NULL END,
 updated_at=GREATEST(date_trunc('milliseconds',clock_timestamp()),previous.updated_at+interval '1 millisecond')
 FROM previous WHERE n.id=previous.id AND previous.status='sent' AND previous.updated_at=$2::timestamptz RETURNING n.*
 ),activity AS(INSERT INTO inquiry_activity(inquiry_id,activity_type,actor,invoice_id,invoice_number,created_at)
 SELECT inquiry_id,CASE WHEN status='paid' THEN 'invoice_paid' ELSE 'invoice_voided' END,'admin',id,invoice_number,updated_at FROM saved RETURNING id)
 SELECT saved.*,${itemsSql("saved")} FROM saved`,
    [id, version, status],
  );
  if (!rows[0]) {
    await getAdminInvoice(id);
    throw new HttpError(
      409,
      "This invoice changed or the action is no longer available. Reload before continuing.",
    );
  }
  return adminData(rows[0]);
}
export async function getPublicInvoice(token: string) {
  const row = (
    await query(
      selection + " WHERE n.public_token_hash=$1 AND n.status<>'draft'",
      [invoiceTokenHash(token)],
    )
  )[0];
  if (!row) throw new HttpError(404, "This invoice is unavailable.");
  return publicData(row);
}
// Public GET/preview is read-only. The visible document acknowledges a view with same-origin POST.
export async function recordInvoiceView(token: string) {
  const rows = await query(
    `WITH previous AS MATERIALIZED(SELECT * FROM invoices WHERE public_token_hash=$1 AND status='sent' FOR UPDATE),saved AS(
 UPDATE invoices n SET first_viewed_at=COALESCE(previous.first_viewed_at,clock_timestamp()),last_viewed_at=clock_timestamp()
 FROM previous WHERE n.id=previous.id RETURNING n.*,previous.first_viewed_at IS NULL first_view
 ),activity AS(INSERT INTO inquiry_activity(inquiry_id,activity_type,actor,invoice_id,invoice_number,created_at)
 SELECT inquiry_id,'invoice_viewed','client',id,invoice_number,first_viewed_at FROM saved WHERE first_view
 ON CONFLICT(invoice_id) WHERE activity_type='invoice_viewed' DO NOTHING RETURNING id)
 SELECT saved.*,${itemsSql("saved")} FROM saved`,
    [invoiceTokenHash(token)],
  );
  return rows[0] ? publicData(rows[0]) : getPublicInvoice(token);
}
export async function invoiceForEmail(inquiryId: string, strict = false) {
  const row = (
    await query(
      "SELECT * FROM invoices WHERE inquiry_id=$1 AND status IN('sent','paid') ORDER BY created_at DESC,id DESC LIMIT 1",
      [inquiryId],
    )
  )[0];
  if (!row) return null;
  try {
    return {
      id: String(row.id),
      number: String(row.invoice_number),
      url: invoiceUrl(row),
      hash: String(row.public_token_hash),
      createdAt: iso(row.public_token_created_at),
    };
  } catch (error) {
    if (strict) throw error;
    return null;
  }
}
