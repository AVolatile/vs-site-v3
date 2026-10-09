import { neon } from '@neondatabase/serverless';
import { createHash } from 'node:crypto';
import type { Inquiry, InquiryInput, InquiryList, InquiryStatus, InquirySummary } from '../../src/lib/inquiries/contract';
import { HttpError } from './http';

async function query(statement: string, parameters: unknown[] = []): Promise<Record<string, unknown>[]> {
  const runtime = globalThis as typeof globalThis & { Netlify?: { env: { get: (name: string) => string | undefined } } };
  const url = runtime.Netlify?.env.get('DATABASE_URL') ?? process.env.DATABASE_URL;
  if (!url) throw new HttpError(503, 'The inquiry service is temporarily unavailable. Please try again.');
  return neon(url).query(statement, parameters, { fetchOptions: { signal: AbortSignal.timeout(10_000) } });
}
const iso = (value: unknown) => (value instanceof Date ? value : new Date(String(value))).toISOString();
function detail(row: Record<string, unknown>): Inquiry {
  return {
    id: String(row.id), createdAt: iso(row.created_at), updatedAt: iso(row.updated_at), consentAt: iso(row.consent_at),
    name: String(row.name), email: String(row.email), company: String(row.company), website: String(row.website),
    projectType: String(row.project_type), projectStage: String(row.project_stage), projectSummary: String(row.project_summary),
    helpNeeded: String(row.help_needed), budgetRange: String(row.budget_range), timeline: String(row.timeline),
    status: row.status as InquiryStatus, source: String(row.source), adminNotes: String(row.admin_notes),
  };
}
export async function createInquiry(input: InquiryInput, submissionKey: string): Promise<string> {
  const fingerprint = createHash('sha256').update(JSON.stringify(input)).digest('hex');
  const rows = await query(`INSERT INTO inquiries
    (name,email,company,website,project_type,project_stage,project_summary,help_needed,budget_range,timeline,submission_key,payload_fingerprint)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
    ON CONFLICT (submission_key) DO UPDATE SET submission_key = EXCLUDED.submission_key
    WHERE inquiries.payload_fingerprint = EXCLUDED.payload_fingerprint
    RETURNING id`, [input.name, input.email, input.company, input.website, input.projectType,
      input.projectStage, input.projectSummary, input.helpNeeded, input.budgetRange, input.timeline, submissionKey, fingerprint]);
  if (!rows[0]) throw new HttpError(409, 'This submission has changed. Refresh the review and submit again.');
  return String(rows[0].id);
}
export async function listInquiries(status: string, sort: string, page: number): Promise<InquiryList> {
  const pageSize = 25;
  const [rows, totals, metrics] = await Promise.all([
    query(`SELECT id,name,company,project_type,budget_range,timeline,status,created_at FROM inquiries
      WHERE ($1 = 'all' OR status = $1)
      ORDER BY CASE WHEN $2='status' THEN status END ASC,
        CASE WHEN $2='oldest' THEN created_at END ASC,
        CASE WHEN $2 IN ('newest','status') THEN created_at END DESC, id DESC LIMIT $3 OFFSET $4`, [status, sort, pageSize, (page - 1) * pageSize]),
    query(`SELECT count(*) AS total FROM inquiries WHERE ($1='all' OR status=$1)`, [status]),
    query(`SELECT count(*) AS total, count(*) FILTER (WHERE status='new') AS new,
      count(*) FILTER (WHERE status IN ('reviewing','contacted','qualified','proposal')) AS active,
      count(*) FILTER (WHERE status='won') AS won FROM inquiries`),
  ]);
  const items: InquirySummary[] = rows.map(row => ({ id: String(row.id), name: String(row.name), company: String(row.company),
    projectType: String(row.project_type), budgetRange: String(row.budget_range), timeline: String(row.timeline),
    status: row.status as InquiryStatus, createdAt: iso(row.created_at) }));
  return { items, page, pageSize, total: Number(totals[0].total), metrics: {
    total: Number(metrics[0].total), new: Number(metrics[0].new), active: Number(metrics[0].active), won: Number(metrics[0].won),
  } };
}
export async function getInquiry(id: string): Promise<Inquiry> {
  const rows = await query(`SELECT id, created_at, updated_at, consent_at, name, email, company, website,
    project_type, project_stage, project_summary, help_needed, budget_range, timeline, status, source, admin_notes
    FROM inquiries WHERE id=$1`, [id]);
  if (!rows[0]) throw new HttpError(404, 'This inquiry could not be found.');
  return detail(rows[0]);
}
export async function updateInquiry(id: string, status: InquiryStatus, adminNotes: string, updatedAt: string): Promise<Inquiry> {
  const rows = await query(`UPDATE inquiries SET status=$2, admin_notes=$3, updated_at=date_trunc('milliseconds',clock_timestamp())
    WHERE id=$1 AND updated_at=$4::timestamptz RETURNING id, created_at, updated_at, consent_at, name, email, company, website,
      project_type, project_stage, project_summary, help_needed, budget_range, timeline, status, source, admin_notes`, [id, status, adminNotes, updatedAt]);
  if (!rows[0]) {
    await getInquiry(id);
    throw new HttpError(409, 'This inquiry changed in another session. Reload it before saving. Your edits are still here.');
  }
  return detail(rows[0]);
}
