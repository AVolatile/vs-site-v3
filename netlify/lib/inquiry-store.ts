import { query } from './database';
import { createHash } from 'node:crypto';
import type { Inquiry, InquiryActivity, InquiryInput, InquiryList, InquiryPipeline, InquiryStatus, InquirySummary } from '../../src/lib/inquiries/contract';
import { HttpError } from './http';
import { browseDefaults, type AdminBrowse } from '../../src/lib/inquiries/admin-browse';

const iso = (value: unknown) => (value instanceof Date ? value : new Date(String(value))).toISOString();
function detail(row: Record<string, unknown>): Inquiry {
  return {
    id: String(row.id), createdAt: iso(row.created_at), updatedAt: iso(row.updated_at), consentAt: iso(row.consent_at),
    name: String(row.name), email: String(row.email), company: String(row.company), website: String(row.website),
    projectType: String(row.project_type), projectStage: String(row.project_stage), projectSummary: String(row.project_summary),
    helpNeeded: String(row.help_needed), budgetRange: String(row.budget_range), timeline: String(row.timeline),
    status: row.status as InquiryStatus, source: String(row.source), adminNotes: String(row.admin_notes),
    nextFollowUpAt: row.next_follow_up_at == null ? null : iso(row.next_follow_up_at), followUpNote: String(row.follow_up_note ?? ''),
  };
}
export async function createInquiry(input: InquiryInput, submissionKey: string): Promise<string> {
  const fingerprint = createHash('sha256').update(JSON.stringify(input)).digest('hex');
  // One statement makes a new inquiry and its creation event atomic.
  const rows = await query(`WITH created AS (INSERT INTO inquiries
    (name,email,company,website,project_type,project_stage,project_summary,help_needed,budget_range,timeline,submission_key,payload_fingerprint)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
    ON CONFLICT (submission_key) DO NOTHING RETURNING id),
    activity_insert AS (
      INSERT INTO inquiry_activity (inquiry_id,activity_type,actor)
      SELECT id,'inquiry_created','system' FROM created RETURNING id
    ) SELECT id FROM created`, [input.name, input.email, input.company, input.website, input.projectType,
      input.projectStage, input.projectSummary, input.helpNeeded, input.budgetRange, input.timeline, submissionKey, fingerprint]);
  if (rows[0]) return String(rows[0].id);
  // A fresh statement also sees an identical concurrent submission that just committed.
  // Existing records receive no fabricated creation event on a retry.
  const existing = await query('SELECT id,payload_fingerprint FROM inquiries WHERE submission_key=$1', [submissionKey]);
  if (existing[0]?.payload_fingerprint !== fingerprint) throw new HttpError(409, 'This submission has changed. Refresh the review and submit again.');
  return String(existing[0].id);
}
// One fixed predicate serves List rows/totals and Pipeline; every user value is bound.
const browseWhere = `($1 = 'all' OR status = $1)
  AND ($2 = '' OR name ILIKE $2 ESCAPE '\\' OR email ILIKE $2 ESCAPE '\\' OR company ILIKE $2 ESCAPE '\\' OR project_summary ILIKE $2 ESCAPE '\\')
  AND ($3 = 'all' OR project_type = $3) AND ($4 = 'all' OR budget_range = $4) AND ($5 = 'all' OR timeline = $5)
  AND ($6 = 'all' OR ($6 = 'none' AND next_follow_up_at IS NULL)
    OR ($6 = 'overdue' AND next_follow_up_at < $7::timestamptz)
    OR ($6 = 'today' AND next_follow_up_at >= $7::timestamptz AND next_follow_up_at < $8::timestamptz)
    OR ($6 = 'upcoming' AND next_follow_up_at >= $8::timestamptz))`;
function browseValues(filters: AdminBrowse, status: string = filters.status): unknown[] {
  const now = new Date(); const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const end = new Date(start); end.setUTCDate(end.getUTCDate() + 1);
  const pattern = filters.search ? '%' + filters.search.replace(/[\\%_]/g, character => '\\' + character) + '%' : '';
  return [status, pattern, filters.projectType, filters.budget, filters.timeline, filters.followUp,
    filters.dayStart ?? start.toISOString(), filters.dayEnd ?? end.toISOString()];
}
async function globalMetrics(values: unknown[]): Promise<InquiryList['metrics']> {
  const rows = await query(`SELECT count(*) AS total, count(*) FILTER (WHERE status='new') AS new,
    count(*) FILTER (WHERE status IN ('reviewing','contacted','qualified','proposal')) AS active,
    count(*) FILTER (WHERE status='won') AS won,
    count(*) FILTER (WHERE status <> 'archived' AND next_follow_up_at >= $1::timestamptz AND next_follow_up_at < $2::timestamptz) AS follow_up_today,
    count(*) FILTER (WHERE status <> 'archived' AND next_follow_up_at < $1::timestamptz) AS follow_up_overdue FROM inquiries`, values.slice(6, 8));
  const row = rows[0];
  return { total: Number(row.total), new: Number(row.new), active: Number(row.active), won: Number(row.won),
    followUpToday: Number(row.follow_up_today), followUpOverdue: Number(row.follow_up_overdue) };
}
function summary(row: Record<string, unknown>): InquirySummary {
  return { id: String(row.id), name: String(row.name), company: String(row.company), projectType: String(row.project_type),
    budgetRange: String(row.budget_range), timeline: String(row.timeline), status: row.status as InquiryStatus,
    createdAt: iso(row.created_at), nextFollowUpAt: row.next_follow_up_at == null ? null : iso(row.next_follow_up_at) };
}
export async function listInquiries(status: string, sort: string, page: number, filters = browseDefaults()): Promise<InquiryList> {
  const pageSize = 25; const values = browseValues(filters, status);
  const [rows, totals, metrics] = await Promise.all([
    query(`SELECT id,name,company,project_type,budget_range,timeline,status,created_at,next_follow_up_at FROM inquiries
      WHERE ${browseWhere}
      ORDER BY CASE WHEN $9='status' THEN status END ASC,
        CASE WHEN $9='oldest' THEN created_at END ASC,
        CASE WHEN $9 IN ('newest','status') THEN created_at END DESC, id DESC LIMIT $10 OFFSET $11`, [...values, sort, pageSize, (page - 1) * pageSize]),
    query(`SELECT count(*) AS total FROM inquiries WHERE ${browseWhere}`, values), globalMetrics(values),
  ]);
  return { items: rows.map(summary), page, pageSize, total: Number(totals[0].total), metrics };
}
export async function getInquiry(id: string): Promise<Inquiry> {
  const rows = await query(`SELECT id, created_at, updated_at, consent_at, name, email, company, website,
    project_type, project_stage, project_summary, help_needed, budget_range, timeline, status, source, admin_notes, next_follow_up_at, follow_up_note
    FROM inquiries WHERE id=$1`, [id]);
  if (!rows[0]) throw new HttpError(404, 'This inquiry could not be found.');
  return detail(rows[0]);
}
export async function updateInquiry(id: string, status: InquiryStatus, adminNotes: string | undefined, updatedAt: string): Promise<Inquiry> {
  // Lock the previous values, guard the timestamp, update and record real changes atomically.
  const rows = await query(`WITH previous AS MATERIALIZED (
      SELECT id,status,admin_notes,updated_at FROM inquiries WHERE id=$1 FOR UPDATE
    ), saved AS (
      UPDATE inquiries AS inquiry SET status=$2, admin_notes=COALESCE($3::varchar,previous.admin_notes),
        updated_at=GREATEST(date_trunc('milliseconds',clock_timestamp()),previous.updated_at + interval '1 millisecond')
      FROM previous WHERE inquiry.id=previous.id AND previous.updated_at=$4::timestamptz
      RETURNING inquiry.*,previous.status AS previous_status,previous.admin_notes AS previous_admin_notes
    ), activity_insert AS (
      INSERT INTO inquiry_activity (inquiry_id,activity_type,from_status,to_status,actor,created_at)
      SELECT id,'status_changed',previous_status,status,'admin',updated_at FROM saved WHERE previous_status <> status
      UNION ALL
      SELECT id,'admin_note_updated',NULL,NULL,'admin',updated_at FROM saved WHERE previous_admin_notes <> admin_notes
      RETURNING id
    ) SELECT id, created_at, updated_at, consent_at, name, email, company, website,
      project_type, project_stage, project_summary, help_needed, budget_range, timeline, status, source, admin_notes, next_follow_up_at, follow_up_note
      FROM saved`, [id, status, adminNotes ?? null, updatedAt]);
  if (!rows[0]) {
    await getInquiry(id);
    throw new HttpError(409, 'This inquiry changed in another session. Reload it before saving. Your edits are still here.');
  }
  return detail(rows[0]);
}

export async function listInquiryActivity(id: string): Promise<InquiryActivity[]> {
  const rows = await query(`SELECT id,inquiry_id,created_at,activity_type,from_status,to_status,note,actor,follow_up_at,proposal_number,to_jsonb(inquiry_activity)->>'invoice_number' AS invoice_number
    FROM inquiry_activity WHERE inquiry_id=$1 ORDER BY created_at DESC,id DESC`, [id]);
  return rows.map(row => ({
    id: String(row.id), inquiryId: String(row.inquiry_id), createdAt: iso(row.created_at),
    type: row.activity_type as InquiryActivity['type'],
    ...(row.invoice_number ? {invoiceNumber:String(row.invoice_number)} : {}),
    fromStatus: row.from_status as InquiryStatus | null, toStatus: row.to_status as InquiryStatus | null,
    note: String(row.note), actor: row.actor as InquiryActivity['actor'], followUpAt: row.follow_up_at == null ? null : iso(row.follow_up_at), proposalNumber: row.proposal_number == null ? null : String(row.proposal_number),
  }));
}

export async function getInquiryPipeline(filters = browseDefaults()): Promise<InquiryPipeline> {
  const values = browseValues(filters, 'all');
  const [rows, metrics] = await Promise.all([
    query(`SELECT id,name,company,project_type,budget_range,timeline,status,created_at,updated_at,next_follow_up_at
      FROM inquiries WHERE status <> 'archived' AND ${browseWhere}
      ORDER BY CASE WHEN $9='oldest' THEN created_at END ASC,
        CASE WHEN $9 IN ('newest','status') THEN created_at END DESC,id DESC`, [...values, filters.sort]), globalMetrics(values),
  ]);
  return { items: rows.map(row => ({ ...summary(row), updatedAt: iso(row.updated_at) })), metrics };
}

export async function updateFollowUp(id: string, nextFollowUpAt: string | null, followUpNote: string, updatedAt: string): Promise<Inquiry> {
  const rows = await query(`WITH previous AS MATERIALIZED (
      SELECT id,next_follow_up_at,follow_up_note,updated_at FROM inquiries WHERE id=$1 FOR UPDATE
    ), saved AS (
      UPDATE inquiries AS inquiry SET next_follow_up_at=$2::timestamptz,follow_up_note=$3,
        updated_at=GREATEST(date_trunc('milliseconds',clock_timestamp()),previous.updated_at + interval '1 millisecond')
      FROM previous WHERE inquiry.id=previous.id AND previous.updated_at=$4::timestamptz
      RETURNING inquiry.*,previous.next_follow_up_at AS previous_follow_up_at,previous.follow_up_note AS previous_follow_up_note
    ), activity_insert AS (
      INSERT INTO inquiry_activity (inquiry_id,activity_type,follow_up_at,actor,created_at)
      SELECT id,CASE WHEN previous_follow_up_at IS NULL AND next_follow_up_at IS NOT NULL THEN 'follow_up_scheduled'
        WHEN previous_follow_up_at IS NOT NULL AND next_follow_up_at IS NULL THEN 'follow_up_cleared'
        ELSE 'follow_up_updated' END,next_follow_up_at,'admin',updated_at FROM saved
      WHERE previous_follow_up_at IS DISTINCT FROM next_follow_up_at OR previous_follow_up_note <> follow_up_note
      RETURNING id
    ) SELECT id,created_at,updated_at,consent_at,name,email,company,website,project_type,project_stage,project_summary,
      help_needed,budget_range,timeline,status,source,admin_notes,next_follow_up_at,follow_up_note FROM saved`,
  [id, nextFollowUpAt, followUpNote, updatedAt]);
  if (!rows[0]) { await getInquiry(id); throw new HttpError(409, 'This inquiry changed in another session. Reload it before saving. Your edits are still here.'); }
  return detail(rows[0]);
}
