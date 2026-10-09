import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';
import type { Context } from '@netlify/functions';
import { createInquiry, getInquiry, updateInquiry, listInquiryActivity, getInquiryPipeline, listInquiries } from './lib/inquiry-store';
import adminEndpoint from './functions/admin-inquiries.mts';
import submit from './functions/inquiries.mts';

const mocks = vi.hoisted(() => ({ query: vi.fn(), user: vi.fn() }));
vi.mock('@neondatabase/serverless', () => ({ neon: () => ({ query: mocks.query }) }));
vi.mock('@netlify/identity', () => ({ getUser: mocks.user }));

// An isolated in-memory PostgreSQL instance: no user DATABASE_URL is contacted.
let db: PGlite;
const key = '34d33c7b-a40a-43b5-ae42-ec4160995bc3';
const input = { projectType: 'website', name: 'Test Visitor', email: 'visitor@example.test', company: 'Example Studio', website: 'https://example.test', projectStage: 'existing', projectSummary: 'Refine the business website.', helpNeeded: 'Content and visual design.', budgetRange: '2500-5000', timeline: '1-3-months' };
const context = { params: {} } as Context;
const req = (path: string, method = 'GET', body?: unknown) => new Request('https://example.test' + path, {
  method, headers: { Origin: 'https://example.test', 'Content-Type': 'application/json' },
  ...(body ? { body: JSON.stringify(body) } : {}),
});
beforeAll(async () => {
  db = new PGlite();
  await db.exec(readFileSync(new URL('../database/migrations/001_create_inquiries.sql', import.meta.url), 'utf8'));
  await db.exec(readFileSync(new URL('../database/migrations/002_create_inquiry_activity.sql', import.meta.url), 'utf8'));
}, 30_000);
afterAll(async () => { await db?.close(); });
beforeEach(async () => {
  await db.exec('TRUNCATE inquiry_activity, inquiries');
  vi.resetAllMocks(); vi.stubEnv('DATABASE_URL', 'postgresql://isolated-test-placeholder');
  mocks.user.mockResolvedValue({ roles: ['admin'] });
  mocks.query.mockImplementation(async (statement: string, parameters: unknown[] = []) => (await db.query(statement, parameters)).rows);
});

describe('Phase 2 SQL and protected workflow', () => {
  it('creates the inquiry and exactly one system event, including repeated concurrent retries', async () => {
    const receipts = await Promise.all([createInquiry(input, key), createInquiry(input, key), createInquiry(input, key)]);
    expect(new Set(receipts).size).toBe(1);
    const activity = await listInquiryActivity(receipts[0]);
    expect(activity).toHaveLength(1); expect(activity[0]).toMatchObject({ type: 'inquiry_created', actor: 'system', fromStatus: null, toStatus: null, note: '' });
    expect((await db.query('SELECT id FROM inquiries')).rows).toHaveLength(1);
  });

  it('conflicts on a reused submission key with changed content without adding activity', async () => {
    const id = await createInquiry(input, key);
    await expect(createInquiry({ ...input, name: 'Changed name' }, key)).rejects.toMatchObject({ status: 409 });
    expect((await getInquiry(id)).name).toBe(input.name); expect(await listInquiryActivity(id)).toHaveLength(1);
  });

  it('records status changes only when the saved status changes', async () => {
    const id = await createInquiry(input, key); const before = await getInquiry(id);
    const updated = await updateInquiry(id, 'reviewing', before.adminNotes, before.updatedAt);
    expect(updated.updatedAt > before.updatedAt).toBe(true);
    const events = await listInquiryActivity(id);
    expect(events.filter(event => event.type === 'status_changed')).toEqual([expect.objectContaining({ fromStatus: 'new', toStatus: 'reviewing', actor: 'admin' })]);
    await updateInquiry(id, updated.status, updated.adminNotes, updated.updatedAt);
    expect(await listInquiryActivity(id)).toHaveLength(2);
  });

  it('records a note change without storing any copy of the private note', async () => {
    const id = await createInquiry(input, key); const before = await getInquiry(id);
    const updated = await updateInquiry(id, before.status, 'A private note that must stay out of history.', before.updatedAt);
    const events = await listInquiryActivity(id);
    expect(events.filter(event => event.type === 'admin_note_updated')).toHaveLength(1);
    expect(JSON.stringify(events)).not.toContain(updated.adminNotes);
    await updateInquiry(id, updated.status, updated.adminNotes, updated.updatedAt);
    expect(await listInquiryActivity(id)).toHaveLength(2);
  });

  it('records both actual changes in one save and rejects a stale overwrite without extra events', async () => {
    const id = await createInquiry(input, key); const before = await getInquiry(id);
    await updateInquiry(id, 'qualified', 'Confirm budget.', before.updatedAt);
    expect((await listInquiryActivity(id)).map(event => event.type).sort()).toEqual(['admin_note_updated', 'inquiry_created', 'status_changed']);
    await expect(updateInquiry(id, 'lost', 'Stale overwrite.', before.updatedAt)).rejects.toMatchObject({ status: 409 });
    expect((await getInquiry(id)).adminNotes).toBe('Confirm budget.'); expect(await listInquiryActivity(id)).toHaveLength(3);
  });

  it('moves through the existing protected PATCH while preserving server notes and the board timestamp guard', async () => {
    const id = await createInquiry(input, key); const before = await getInquiry(id);
    const noted = await updateInquiry(id, 'new', 'Private notes stay on the server.', before.updatedAt);
    const pipeline = await getInquiryPipeline();
    const body = { action: 'move', status: 'proposal', updatedAt: pipeline.items[0].updatedAt };
    const response = await adminEndpoint(req('/api/admin/inquiries?id=' + id, 'PATCH', body), context);
    expect(response.status).toBe(200);
    expect((await response.json()).inquiry).toMatchObject({ status: 'proposal', adminNotes: noted.adminNotes });
    expect((await listInquiryActivity(id)).filter(event => event.type === 'admin_note_updated')).toHaveLength(1);
    expect((await adminEndpoint(req('/api/admin/inquiries?id=' + id, 'PATCH', { ...body, status: 'lost' }), context)).status).toBe(409);
    const current = await getInquiry(id);
    const invalid = { ...body, updatedAt: current.updatedAt, adminNotes: 'Attempted overwrite', actor: 'system' };
    expect((await adminEndpoint(req('/api/admin/inquiries?id=' + id, 'PATCH', invalid), context)).status).toBe(422);
  });

  it('rolls back creation if activity insertion fails', async () => {
    await db.exec(`CREATE FUNCTION reject_activity() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'test failure'; END $$;
      CREATE TRIGGER reject_activity BEFORE INSERT ON inquiry_activity FOR EACH ROW EXECUTE FUNCTION reject_activity();`);
    try {
      await expect(createInquiry(input, key)).rejects.toBeDefined();
      expect((await db.query('SELECT id FROM inquiries')).rows).toHaveLength(0);
    } finally { await db.exec('DROP TRIGGER reject_activity ON inquiry_activity; DROP FUNCTION reject_activity()'); }
  });

  it('rolls back status and notes together if activity insertion fails', async () => {
    const id = await createInquiry(input, key); const before = await getInquiry(id);
    await db.exec(`CREATE FUNCTION reject_activity() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'test failure'; END $$;
      CREATE TRIGGER reject_activity BEFORE INSERT ON inquiry_activity FOR EACH ROW EXECUTE FUNCTION reject_activity();`);
    try {
      await expect(updateInquiry(id, 'won', 'Must not persist.', before.updatedAt)).rejects.toBeDefined();
      expect(await getInquiry(id)).toEqual(before); expect(await listInquiryActivity(id)).toHaveLength(1);
    } finally { await db.exec('DROP TRIGGER reject_activity ON inquiry_activity; DROP FUNCTION reject_activity()'); }
  });

  it('does not fabricate historical creation activity, including an old submission retry', async () => {
    const fingerprint = createHash('sha256').update(JSON.stringify(input)).digest('hex');
    const { rows } = await db.query<{ id: string }>(`INSERT INTO inquiries
      (name,email,company,website,project_type,project_stage,project_summary,help_needed,budget_range,timeline,submission_key,payload_fingerprint,created_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'2020-01-01') RETURNING id`,
    [input.name,input.email,input.company,input.website,input.projectType,input.projectStage,input.projectSummary,input.helpNeeded,input.budgetRange,input.timeline,key,fingerprint]);
    expect(await createInquiry(input, key)).toBe(rows[0].id);
    expect(await listInquiryActivity(rows[0].id)).toEqual([]);
  });

  it('loads every active summary beyond a list page, excludes archived, and never sends notes/activity with cards', async () => {
    await db.exec(`INSERT INTO inquiries (name,email,project_type,project_stage,project_summary,budget_range,timeline,submission_key,payload_fingerprint,status)
      SELECT 'Synthetic ' || n,'test@example.test','website','new','A synthetic project.','unsure','flexible',gen_random_uuid(),'test',
        CASE WHEN n=28 THEN 'archived' ELSE 'new' END FROM generate_series(1,28) n;`);
    mocks.query.mockClear(); const pipeline = await getInquiryPipeline();
    expect(pipeline.items).toHaveLength(27); expect(mocks.query).toHaveBeenCalledTimes(2);
    expect(pipeline.items.every(item => item.status !== 'archived' && Boolean(item.updatedAt))).toBe(true);
    expect(pipeline.metrics).toEqual({ total: 28, new: 27, active: 0, won: 0 });
    expect(pipeline.items[0]).not.toHaveProperty('adminNotes'); expect(pipeline.items[0]).not.toHaveProperty('activity'); expect(pipeline.items[0]).not.toHaveProperty('email');
    const list = await listInquiries('all', 'newest', 1);
    expect(list.items).toHaveLength(25); expect(list.total).toBe(28);
    expect((await listInquiries('archived', 'newest', 1)).items).toHaveLength(1);
  });

  it('returns private activity with detail, saves through the existing endpoint, and keeps list responses unchanged', async () => {
    const id = await createInquiry(input, key);
    const list = await (await adminEndpoint(req('/api/admin/inquiries?status=all&sort=newest'), context)).json();
    expect(list.items).toHaveLength(1); expect(list).not.toHaveProperty('activity');
    const detail = await (await adminEndpoint(req('/api/admin/inquiries?id=' + id), context)).json();
    expect(detail.inquiry.name).toBe(input.name); expect(detail.activity).toHaveLength(1);
    const response = await adminEndpoint(req('/api/admin/inquiries?id=' + id, 'PATCH', { status: 'contacted', adminNotes: 'Private note', updatedAt: detail.inquiry.updatedAt }), context);
    expect(response.status).toBe(200);
    expect((await response.json()).inquiry).toMatchObject({ status: 'contacted', adminNotes: 'Private note' });
    const refreshed = await (await adminEndpoint(req('/api/admin/inquiries?id=' + id), context)).json();
    expect(refreshed.activity).toHaveLength(3);
    expect((await adminEndpoint(req('/api/admin/inquiries?id=' + id, 'PATCH', { status: 'won', updatedAt: refreshed.inquiry.updatedAt }), context)).status).toBe(422);
  });

  it('requires admin access for pipeline and activity before querying the database', async () => {
    for (const path of ['/api/admin/inquiries?view=pipeline', '/api/admin/inquiries?id=' + key]) {
      mocks.query.mockClear(); mocks.user.mockResolvedValue(null);
      expect((await adminEndpoint(req(path), context)).status).toBe(401);
      mocks.user.mockResolvedValue({ roles: ['member'] }); expect((await adminEndpoint(req(path), context)).status).toBe(403);
      expect(mocks.query).not.toHaveBeenCalled();
    }
  });

  it('does not log reads, filters or refreshes and retains activity while archived', async () => {
    const id = await createInquiry(input, key); const before = await getInquiry(id);
    await updateInquiry(id, 'archived', '', before.updatedAt);
    const saved = await listInquiryActivity(id);
    await adminEndpoint(req('/api/admin/inquiries?view=pipeline'), context);
    await adminEndpoint(req('/api/admin/inquiries?status=archived&sort=oldest'), context);
    await adminEndpoint(req('/api/admin/inquiries?id=' + id), context);
    expect(await listInquiryActivity(id)).toEqual(saved); expect((await getInquiryPipeline()).items).toHaveLength(0);
  });

  it('keeps activity private while public submissions only return a receipt', async () => {
    const response = await submit(req('/api/inquiries', 'POST', { ...input, consent: true, submissionKey: key, startedAt: Date.now() - 5000, honeypot: '' }));
    expect(response.status).toBe(201); const payload = await response.json();
    expect(Object.keys(payload).sort()).toEqual(['received', 'reference']);
    expect(await listInquiryActivity(payload.reference)).toHaveLength(1);
  });

  it('enforces one creation event, valid status transitions and deliberate cascading cleanup', async () => {
    const id = await createInquiry(input, key);
    await expect(db.query(`INSERT INTO inquiry_activity (inquiry_id,activity_type,actor) VALUES ($1,'inquiry_created','system')`, [id])).rejects.toBeDefined();
    await expect(db.query(`INSERT INTO inquiry_activity (inquiry_id,activity_type,actor,from_status,to_status) VALUES ($1,'status_changed','admin','new','new')`, [id])).rejects.toBeDefined();
    await db.query('DELETE FROM inquiries WHERE id=$1', [id]);
    expect(await listInquiryActivity(id)).toHaveLength(0);
  });
});
