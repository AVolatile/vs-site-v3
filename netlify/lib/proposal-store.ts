import {invoiceUrl} from './invoice-store';
import { randomBytes } from 'node:crypto';
import { publicUrl } from './public-url';
import { query } from './database';
import { HttpError } from './http';
import {
  calculateTotals,
  type AdminProposal,
  type DraftInput,
  type ProposalItem,
  type PublicProposal,
} from '../../src/lib/proposals/contract';
const iso = (value: unknown) => (value instanceof Date ? value : new Date(String(value))).toISOString();
const dateOnly = (value: unknown) =>
  value == null
    ? null
    : value instanceof Date
      ? value.toISOString().slice(0, 10)
      : String(value).slice(0, 10);
const today = () => new Date().toISOString().slice(0, 10);
function publicData(row: Record<string, unknown>): PublicProposal {
  const validUntil = dateOnly(row.valid_until);
  const status =
    row.status === 'sent' && validUntil && validUntil < today()
      ? 'expired'
      : (row.status as PublicProposal['status']);
  return {
    number: String(row.proposal_number),
    status,
    title: String(row.title),
    summary: String(row.summary),
    currency: 'USD',
    validUntil,
    date: iso(row.sent_at ?? row.created_at),
    acceptedAt: row.accepted_at ? iso(row.accepted_at) : null,
    declinedAt: row.declined_at ? iso(row.declined_at) : null,
    clientNotes: String(row.client_notes),
    preparedFor: { name: String(row.name), company: String(row.company), email: String(row.email) },
    items: ((row.items as Record<string, unknown>[]) ?? []).map((item) => ({
      description: String(item.description),
      quantity: Number(item.quantity),
      unitPriceCents: Number(item.unit_price_cents),
      lineTotalCents: Number(item.line_total_cents),
    })),
    subtotalCents: Number(row.subtotal_cents),
    discountCents: Number(row.discount_cents),
    taxRateBasisPoints: Number(row.tax_rate_basis_points),
    taxCents: Number(row.tax_cents),
    totalCents: Number(row.total_cents),
  };
}
function adminData(row: Record<string, unknown>): AdminProposal {
  return {
    ...publicData(row),
    id: String(row.id),
    inquiryId: String(row.inquiry_id),
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
    internalNotes: String(row.internal_notes),
    publicUrl: row.client_token && row.status !== 'draft' ? publicUrl('/proposal/' + String(row.client_token) + '/') : null,
    clientUrl:
      row.client_token && row.status !== 'draft' ? '/proposal/' + String(row.client_token) + '/' : null,
  };
}
const selection = `SELECT p.*,i.name,i.company,i.email,COALESCE((SELECT jsonb_agg(jsonb_build_object(
  'description',description,'quantity',quantity,'unit_price_cents',unit_price_cents,'line_total_cents',line_total_cents) ORDER BY position)
  FROM proposal_items WHERE proposal_id=p.id),'[]'::jsonb) AS items FROM proposals p JOIN inquiries i ON i.id=p.inquiry_id`;
export async function getAdminProposal(id: string): Promise<AdminProposal> {
  const rows = await query(selection + ' WHERE p.id=$1', [id]);
  if (!rows[0]) throw new HttpError(404, 'This proposal could not be found.');
  return adminData(rows[0]);
}
export async function getInquiryProposal(inquiryId: string): Promise<AdminProposal | null> {
  const rows = await query(selection + ' WHERE p.inquiry_id=$1', [inquiryId]);
  return rows[0] ? adminData(rows[0]) : null;
}
export async function createProposal(inquiryId: string, title: string): Promise<AdminProposal> {
  const inquiries = await query('SELECT id FROM inquiries WHERE id=$1', [inquiryId]);
  if (!inquiries[0]) throw new HttpError(404, 'This inquiry could not be found.');
  const rows = await query(
    `WITH created AS (
    INSERT INTO proposals (inquiry_id,title) VALUES ($1,$2) ON CONFLICT (inquiry_id) DO NOTHING RETURNING *
  ), activity AS (
    INSERT INTO inquiry_activity (inquiry_id,activity_type,actor,proposal_number,created_at)
    SELECT inquiry_id,'proposal_created','admin',proposal_number,updated_at FROM created RETURNING id
  ) SELECT created.*,i.name,i.company,i.email,'[]'::jsonb AS items FROM created JOIN inquiries i ON i.id=created.inquiry_id`,
    [inquiryId, title],
  );
  // Fresh lookup handles concurrent creation/retries without duplicate proposals or events.
  if (rows[0]) return adminData(rows[0]);
  const existing = await getInquiryProposal(inquiryId);
  if (!existing)
    throw new HttpError(
      409,
      'Proposal creation could not be confirmed. Refresh the inquiry before retrying.',
    );
  return existing;
}
async function draftConflict(id: string): Promise<never> {
  const proposal = await getAdminProposal(id);
  throw new HttpError(
    409,
    proposal.status === 'draft'
      ? 'This proposal changed in another session. Reload before saving. Your edits are still here.'
      : 'This proposal is published and can no longer be edited.',
  );
}
export async function saveProposal(id: string, input: DraftInput): Promise<AdminProposal> {
  let totals;
  try {
    totals = calculateTotals(input.items, input.discountCents, input.taxRateBasisPoints);
  } catch (error) {
    throw new HttpError(422, error instanceof Error ? error.message : 'Check pricing values.');
  }
  const items = input.items.map((item, position) => ({
    position,
    description: item.description,
    quantity: item.quantity,
    unit_price_cents: item.unitPriceCents,
  }));
  const rows = await query(
    `WITH previous AS MATERIALIZED (
    SELECT p.*,COALESCE((SELECT jsonb_agg(jsonb_build_object('position',position,'description',description,'quantity',quantity,'unit_price_cents',unit_price_cents) ORDER BY position)
      FROM proposal_items WHERE proposal_id=p.id),'[]'::jsonb) AS old_items FROM proposals p WHERE p.id=$1 FOR UPDATE
  ), saved AS (
    UPDATE proposals p SET title=$2,summary=$3,valid_until=$4::date,discount_cents=$5,tax_rate_basis_points=$6,
      subtotal_cents=$7,tax_cents=$8,total_cents=$9,internal_notes=$10,client_notes=$11,
      updated_at=GREATEST(date_trunc('milliseconds',clock_timestamp()),previous.updated_at + interval '1 millisecond')
    FROM previous WHERE p.id=previous.id AND previous.status='draft' AND previous.updated_at=$12::timestamptz
    RETURNING p.*, (previous.title IS DISTINCT FROM p.title OR previous.summary IS DISTINCT FROM p.summary
      OR previous.valid_until IS DISTINCT FROM p.valid_until OR previous.discount_cents IS DISTINCT FROM p.discount_cents
      OR previous.tax_rate_basis_points IS DISTINCT FROM p.tax_rate_basis_points OR previous.internal_notes IS DISTINCT FROM p.internal_notes
      OR previous.client_notes IS DISTINCT FROM p.client_notes OR previous.old_items IS DISTINCT FROM $13::jsonb) AS changed
  ), removed AS (
    DELETE FROM proposal_items WHERE proposal_id IN (SELECT id FROM saved) RETURNING id
  ), inserted AS (
    INSERT INTO proposal_items (proposal_id,position,description,quantity,unit_price_cents)
    SELECT saved.id,item.position,item.description,item.quantity,item.unit_price_cents FROM saved
    CROSS JOIN jsonb_to_recordset($13::jsonb) AS item(position integer,description text,quantity integer,unit_price_cents integer)
    CROSS JOIN (SELECT count(*) FROM removed) AS deletion_barrier RETURNING *
  ), activity AS (
    INSERT INTO inquiry_activity (inquiry_id,activity_type,actor,proposal_number,created_at)
    SELECT inquiry_id,'proposal_updated','admin',proposal_number,updated_at FROM saved WHERE changed RETURNING id
  ) SELECT saved.*,i.name,i.company,i.email,COALESCE((SELECT jsonb_agg(jsonb_build_object('description',description,'quantity',quantity,'unit_price_cents',unit_price_cents,'line_total_cents',line_total_cents) ORDER BY position) FROM inserted),'[]'::jsonb) AS items FROM saved JOIN inquiries i ON i.id=saved.inquiry_id`,
    [
      id,
      input.title,
      input.summary,
      input.validUntil,
      input.discountCents,
      input.taxRateBasisPoints,
      totals.subtotalCents,
      totals.taxCents,
      totals.totalCents,
      input.internalNotes,
      input.clientNotes,
      input.updatedAt,
      JSON.stringify(items),
    ],
  );
  if (!rows[0]) return draftConflict(id);
  return adminData(rows[0]);
}
export function sendErrors(proposal: AdminProposal): Record<string, string> {
  const errors: Record<string, string> = {};
  if (proposal.summary.length < 10)
    errors.summary = 'Add a project summary of at least 10 characters before sending.';
  if (!proposal.validUntil || proposal.validUntil < today())
    errors.validUntil = 'Choose a valid-until date of today or later.';
  if (!proposal.items.length) errors.items = 'Add at least one item before sending.';
  if (proposal.items.some((item) => !item.description.trim()))
    errors.items = 'Describe every item before sending.';
  return errors;
}
export async function sendProposal(id: string, updatedAt: string): Promise<AdminProposal> {
  const proposal = await getAdminProposal(id);
  if (proposal.status !== 'draft' || proposal.updatedAt !== updatedAt) return draftConflict(id);
  const errors = sendErrors(proposal);
  if (Object.keys(errors).length)
    throw new HttpError(422, 'Complete and save the proposal before sending.', errors);
  const token = randomBytes(32).toString('base64url');
  const rows = await query(
    `WITH previous AS MATERIALIZED (SELECT * FROM proposals WHERE id=$1 FOR UPDATE), sent AS (
    UPDATE proposals p SET status='sent',client_token=$3,sent_at=clock_timestamp(),
      updated_at=GREATEST(date_trunc('milliseconds',clock_timestamp()),previous.updated_at + interval '1 millisecond')
    FROM previous WHERE p.id=previous.id AND previous.status='draft' AND previous.updated_at=$2::timestamptz
      AND previous.valid_until >= (clock_timestamp() AT TIME ZONE 'UTC')::date RETURNING p.*
  ), activity AS (
    INSERT INTO inquiry_activity (inquiry_id,activity_type,actor,proposal_number,created_at)
    SELECT inquiry_id,'proposal_sent','admin',proposal_number,updated_at FROM sent RETURNING id
  ) SELECT sent.*,i.name,i.company,i.email,COALESCE((SELECT jsonb_agg(jsonb_build_object('description',description,'quantity',quantity,'unit_price_cents',unit_price_cents,'line_total_cents',line_total_cents) ORDER BY position) FROM proposal_items WHERE proposal_id=sent.id),'[]'::jsonb) AS items FROM sent JOIN inquiries i ON i.id=sent.inquiry_id`,
    [id, updatedAt, token],
  );
  if (!rows[0]) return draftConflict(id);
  return adminData(rows[0]);
}
export async function getPublicProposal(token: string): Promise<PublicProposal> {
  const rows = await query(selection + " WHERE p.client_token=$1 AND p.status <> 'draft'", [token]);
  if (!rows[0]) throw new HttpError(404, 'This proposal is unavailable.');
  // Explicit allowlist: never spread the database/admin representation into public output.
  const data=publicData(rows[0]);
  if(data.status==='accepted') {
    const invoice=(await query("SELECT * FROM invoices WHERE proposal_id=$1 AND status<>'draft'",[rows[0].id]))[0];
    if(invoice){try{data.invoice={number:String(invoice.invoice_number),url:invoiceUrl(invoice)};}catch{/* Invoice viewing still works with its previously issued token if the sharing key is unavailable. */}}
  }
  return data;
}
export async function respondToProposal(
  token: string,
  action: 'accept' | 'decline',
): Promise<PublicProposal> {
  const status = action === 'accept' ? 'accepted' : 'declined';
  const rows = await query(
    `WITH previous AS MATERIALIZED (SELECT * FROM proposals WHERE client_token=$1 FOR UPDATE), responded AS (
    UPDATE proposals p SET status=$2,accepted_at=CASE WHEN $2='accepted' THEN clock_timestamp() ELSE NULL END,
      declined_at=CASE WHEN $2='declined' THEN clock_timestamp() ELSE NULL END,
      updated_at=GREATEST(date_trunc('milliseconds',clock_timestamp()),previous.updated_at + interval '1 millisecond')
    FROM previous WHERE p.id=previous.id AND previous.status='sent' AND previous.valid_until >= (clock_timestamp() AT TIME ZONE 'UTC')::date RETURNING p.*
  ), activity AS (
    INSERT INTO inquiry_activity (inquiry_id,activity_type,actor,proposal_number,created_at)
    SELECT inquiry_id,CASE WHEN status='accepted' THEN 'proposal_accepted' ELSE 'proposal_declined' END,'client',proposal_number,updated_at FROM responded RETURNING id
  ) SELECT responded.*,i.name,i.company,i.email,COALESCE((SELECT jsonb_agg(jsonb_build_object('description',description,'quantity',quantity,'unit_price_cents',unit_price_cents,'line_total_cents',line_total_cents) ORDER BY position) FROM proposal_items WHERE proposal_id=responded.id),'[]'::jsonb) AS items FROM responded JOIN inquiries i ON i.id=responded.inquiry_id`,
    [token, status],
  );
  if (!rows[0]) {
    await getPublicProposal(token);
    throw new HttpError(
      409,
      'This proposal can no longer be accepted or declined. Refresh its current status.',
    );
  }
  return publicData(rows[0]);
}
