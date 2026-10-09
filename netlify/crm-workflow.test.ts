import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';
import type { Context } from '@netlify/functions';
import { createInquiry, getInquiry, updateInquiry, listInquiryActivity, getInquiryPipeline, listInquiries, updateFollowUp } from './lib/inquiry-store';
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
  await db.exec(readFileSync(new URL('../database/migrations/003_add_follow_up_fields.sql', import.meta.url), 'utf8'));
  await db.exec(readFileSync(new URL('../database/migrations/004_create_proposals.sql', import.meta.url), 'utf8'));
}, 30_000);
afterAll(async () => { await db?.close(); });
beforeEach(async () => {
  await db.exec('TRUNCATE proposal_items,proposals,inquiry_activity,inquiries');
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
    expect(pipeline.metrics).toEqual({ total: 28, new: 27, active: 0, won: 0, followUpToday: 0, followUpOverdue: 0 });
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

describe('Phase 3 search, filters and follow-up operations', () => {
  const day = { dayStart: '2026-10-09T04:00:00.000Z', dayEnd: '2026-10-10T04:00:00.000Z' };
  async function filters(values: Record<string, unknown> = {}) {
    const { browseSchema } = await import('../src/lib/inquiries/admin-browse');
    return browseSchema.parse({ ...day, ...values });
  }
  it.each([
    ['name', 'test visitor'], ['email', 'VISITOR@EXAMPLE'], ['company', 'example studio'], ['project summary', 'BUSINESS WEBSITE'],
  ])('searches %s case-insensitively on the server', async (_field, search) => {
    const id = await createInquiry(input, key); const state = await filters({ search: '  ' + search + '  ' });
    const list = await listInquiries('all', 'newest', 1, state);
    expect(list.items.map(item => item.id)).toEqual([id]); expect(list.total).toBe(1);
    expect((await getInquiryPipeline(state)).items.map(item => item.id)).toEqual([id]);
    expect((await listInquiries('all', 'newest', 1, await filters({ search: 'absent match' }))).total).toBe(0);
  });
  it('binds SQL-like search literally and escapes wildcard characters', async () => {
    const id = await createInquiry({ ...input, name: "50%_Save\\Docs'; DROP TABLE inquiries;--" }, key);
    const state = await filters({ search: "50%_Save\\Docs'; DROP" }); mocks.query.mockClear();
    expect((await listInquiries('all', 'newest', 1, state)).items.map(item => item.id)).toEqual([id]);
    const [statement, values] = mocks.query.mock.calls[0]; expect(statement).not.toContain(state.search); expect(values[1]).toContain('50\\%\\_');
    expect((await listInquiries('all', 'newest', 1, await filters({ search: '%' }))).total).toBe(1);
  });
  it('combines all optional filters, with matching row and pagination totals', async () => {
    await db.exec(`INSERT INTO inquiries (name,email,project_type,project_stage,project_summary,budget_range,timeline,submission_key,payload_fingerprint,status,next_follow_up_at)
      SELECT 'Match ' || n,'test@example.test','website','new','Match project summary','2500-5000','1-3-months',gen_random_uuid(),'test',
        'qualified','2026-10-09T14:00:00Z' FROM generate_series(1,28) n;`);
    await createInquiry({ ...input, name: 'Excluded', projectType: 'branding' }, key);
    const state = await filters({ search: 'match', status: 'qualified', projectType: 'website', budget: '2500-5000', timeline: '1-3-months', followUp: 'today' });
    const list = await listInquiries(state.status, state.sort, 2, state);
    expect(list.total).toBe(28); expect(list.items).toHaveLength(3); expect(list.metrics.total).toBe(29);
    expect((await listInquiries('lost', 'newest', 1, state)).total).toBe(0);
    expect((await getInquiryPipeline(state)).items).toHaveLength(28);
    expect((await getInquiryPipeline(await filters({ ...state, budget: 'under-1000' }))).items).toHaveLength(0);
  });
  it('ignores the retained List status filter in Pipeline while still excluding archived', async () => {
    const id = await createInquiry(input, key); const state = await filters({ status: 'lost' });
    expect((await getInquiryPipeline(state)).items.map(item => item.id)).toEqual([id]);
    const before = await getInquiry(id); await updateInquiry(id, 'archived', '', before.updatedAt);
    expect((await getInquiryPipeline(state)).items).toHaveLength(0);
    expect((await listInquiries('archived', 'newest', 1, state)).items).toHaveLength(1);
  });
  it('schedules, updates the time/note, suppresses unchanged events, then clears', async () => {
    const id = await createInquiry(input, key); const before = await getInquiry(id);
    expect(before).toMatchObject({ nextFollowUpAt: null, followUpNote: '' });
    const date = '2026-10-12T14:00:00.123Z';
    const scheduled = await updateFollowUp(id, date, 'Private next step', before.updatedAt);
    expect(scheduled).toMatchObject({ nextFollowUpAt: date, followUpNote: 'Private next step', status: 'new', adminNotes: '' });
    let events = await listInquiryActivity(id); expect(events).toHaveLength(2);
    expect(events[0]).toMatchObject({ type: 'follow_up_scheduled', followUpAt: date, actor: 'admin', note: '' });
    expect(JSON.stringify(events)).not.toContain('Private next step');
    const unchanged = await updateFollowUp(id, date, 'Private next step', scheduled.updatedAt); expect(await listInquiryActivity(id)).toHaveLength(2);
    const noted = await updateFollowUp(id, date, 'Another private step', unchanged.updatedAt);
    expect((await listInquiryActivity(id))[0]).toMatchObject({ type: 'follow_up_updated', followUpAt: date });
    const changed = await updateFollowUp(id, '2026-10-14T18:00:00.000Z', noted.followUpNote, noted.updatedAt);
    expect((await listInquiryActivity(id))[0]).toMatchObject({ type: 'follow_up_updated', followUpAt: changed.nextFollowUpAt });
    const cleared = await updateFollowUp(id, null, '', changed.updatedAt);
    expect(cleared).toMatchObject({ nextFollowUpAt: null, followUpNote: '' });
    events = await listInquiryActivity(id); expect(events).toHaveLength(5);
    expect(events[0]).toMatchObject({ type: 'follow_up_cleared', followUpAt: null });
    await updateFollowUp(id, null, '', cleared.updatedAt); expect(await listInquiryActivity(id)).toHaveLength(5);
  });
  it('preserves follow-up data during note saves and status moves, including archive', async () => {
    const id = await createInquiry(input, key); const before = await getInquiry(id);
    const scheduled = await updateFollowUp(id, '2026-10-09T14:00:00Z', 'Call about scope', before.updatedAt);
    const noted = await updateInquiry(id, 'reviewing', 'Separate general note', scheduled.updatedAt);
    const moved = await updateInquiry(id, 'archived', undefined, noted.updatedAt);
    expect(moved).toMatchObject({ nextFollowUpAt: scheduled.nextFollowUpAt, followUpNote: scheduled.followUpNote, adminNotes: noted.adminNotes });
    expect((await listInquiryActivity(id)).filter(event => event.type.startsWith('follow_up_'))).toHaveLength(1);
  });
  it('uses browser-local day bounds for due/overdue/upcoming filters and global actionable metrics', async () => {
    const values = [null, '2026-10-09T03:59:59.999Z', day.dayStart, '2026-10-10T03:59:59.999Z', day.dayEnd];
    const ids = [];
    for (const [index, date] of values.entries()) {
      const id = await createInquiry({ ...input, name: 'Schedule ' + index }, crypto.randomUUID()); ids.push(id);
      const before = await getInquiry(id); if (date) await updateFollowUp(id, date, '', before.updatedAt);
    }
    for (const date of [values[1], values[2]]) {
      const id = await createInquiry(input, crypto.randomUUID()); const before = await getInquiry(id);
      const scheduled = await updateFollowUp(id, date, 'Retain when archived', before.updatedAt);
      await updateInquiry(id, 'archived', '', scheduled.updatedAt);
    }
    for (const [followUp, expected] of [['none',[ids[0]]],['overdue',[ids[1]]],['today',[ids[2],ids[3]]],['upcoming',[ids[4]]]] as const) {
      const board = await getInquiryPipeline(await filters({ followUp }));
      expect(board.items.map(item => item.id).sort()).toEqual([...expected].sort());
      expect(board.metrics).toMatchObject({ total: 7, followUpToday: 2, followUpOverdue: 1 });
    }
    const empty = await listInquiries('all', 'newest', 1, await filters({ search: 'absent', followUp: 'today' }));
    expect(empty.total).toBe(0); expect(empty.metrics).toMatchObject({ total: 7, followUpToday: 2, followUpOverdue: 1 });
    expect((await listInquiries('archived', 'newest', 1, await filters({ followUp: 'today' }))).total).toBe(1);
  });
  it('saves follow-up through protected PATCH and rejects stale mutation', async () => {
    const id = await createInquiry(input, key); const before = await getInquiry(id);
    const body = { action: 'follow-up', nextFollowUpAt: '2026-10-12T14:00:00.000Z', followUpNote: '', updatedAt: before.updatedAt };
    const response = await adminEndpoint(req('/api/admin/inquiries?id=' + id, 'PATCH', body), context);
    expect(response.status).toBe(200); expect((await response.json()).inquiry.nextFollowUpAt).toBe(body.nextFollowUpAt);
    expect((await adminEndpoint(req('/api/admin/inquiries?id=' + id, 'PATCH', body), context)).status).toBe(409);
    expect(await listInquiryActivity(id)).toHaveLength(2);
  });
  it.each([
    { nextFollowUpAt: 'invalid' }, { nextFollowUpAt: '2026-02-30T14:00:00Z' }, { nextFollowUpAt: '2026-10-12T14:00' },
    { followUpNote: 'a'.repeat(2001) }, { actor: 'system' }, { adminNotes: 'injected note' },
  ])('rejects malformed/mass-assigned follow-up fields %j', async invalid => {
    const id = await createInquiry(input, key); const before = await getInquiry(id);
    const response = await adminEndpoint(req('/api/admin/inquiries?id=' + id, 'PATCH', { action: 'follow-up', nextFollowUpAt: null, followUpNote: '', updatedAt: before.updatedAt, ...invalid }), context);
    expect(response.status).toBe(422); expect(await getInquiry(id)).toEqual(before); expect(await listInquiryActivity(id)).toHaveLength(1);
  });
  it('requires admin and same-origin protection before follow-up writes', async () => {
    const body = { action: 'follow-up', nextFollowUpAt: null, followUpNote: '', updatedAt: '2026-10-09T14:00:00Z' };
    mocks.query.mockClear(); mocks.user.mockResolvedValue(null);
    expect((await adminEndpoint(req('/api/admin/inquiries?id=' + key, 'PATCH', body), context)).status).toBe(401);
    mocks.user.mockResolvedValue({ roles: ['member'] }); expect((await adminEndpoint(req('/api/admin/inquiries?id=' + key, 'PATCH', body), context)).status).toBe(403);
    mocks.user.mockResolvedValue({ roles: ['admin'] });
    const cross = new Request('https://example.test/api/admin/inquiries?id=' + key, { method: 'PATCH', headers: { Origin: 'https://other.test' }, body: JSON.stringify(body) });
    expect((await adminEndpoint(cross, context)).status).toBe(403); expect(mocks.query).not.toHaveBeenCalled();
  });
  it.each(['search=' + 'x'.repeat(161), 'projectType=invalid', 'budget=invalid', 'timeline=invalid', 'followUp=invalid', 'page=0', 'dayStart=2026-10-09T04:00:00Z'])('validates browse query %s before SQL', async query => {
    mocks.query.mockClear(); expect((await adminEndpoint(req('/api/admin/inquiries?' + query), context)).status).toBe(400); expect(mocks.query).not.toHaveBeenCalled();
  });
  it('rolls back the follow-up schedule and event together on activity failure', async () => {
    const id = await createInquiry(input, key); const before = await getInquiry(id);
    await db.exec(`CREATE FUNCTION reject_activity() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'test failure'; END $$;
      CREATE TRIGGER reject_activity BEFORE INSERT ON inquiry_activity FOR EACH ROW EXECUTE FUNCTION reject_activity();`);
    try { await expect(updateFollowUp(id, '2026-10-12T14:00:00Z', 'Must not persist', before.updatedAt)).rejects.toBeDefined(); expect(await getInquiry(id)).toEqual(before); }
    finally { await db.exec('DROP TRIGGER reject_activity ON inquiry_activity; DROP FUNCTION reject_activity()'); }
    expect(await listInquiryActivity(id)).toHaveLength(1);
  });
});

describe('Phase 3 migration on existing records', () => {
  it('adds safe defaults without changing existing inquiry data or activity', async () => {
    const legacy = new PGlite();
    try {
      for (const migration of ['001_create_inquiries', '002_create_inquiry_activity']) await legacy.exec(readFileSync('database/migrations/' + migration + '.sql', 'utf8'));
      await legacy.query(`INSERT INTO inquiries (id,name,email,project_type,project_stage,project_summary,budget_range,timeline,submission_key,payload_fingerprint,admin_notes)
        VALUES ($1,'Existing record','old@example.test','website','existing','Old project summary','unsure','flexible',gen_random_uuid(),'test','Keep old private notes')`, [key]);
      await legacy.query(`INSERT INTO inquiry_activity (inquiry_id,activity_type,actor) VALUES ($1,'inquiry_created','system')`, [key]);
      const old = (await legacy.query('SELECT id,created_at,updated_at,admin_notes FROM inquiries')).rows;
      const activity = (await legacy.query<Record<string, unknown>>('SELECT * FROM inquiry_activity')).rows;
      await legacy.exec(readFileSync('database/migrations/003_add_follow_up_fields.sql', 'utf8'));
      expect((await legacy.query('SELECT id,created_at,updated_at,admin_notes FROM inquiries')).rows).toEqual(old);
      expect((await legacy.query('SELECT next_follow_up_at,follow_up_note FROM inquiries')).rows).toEqual([{ next_follow_up_at: null, follow_up_note: '' }]);
      const after = (await legacy.query<Record<string, unknown>>('SELECT * FROM inquiry_activity')).rows;
      expect(after).toEqual(activity.map(event => ({ ...event, follow_up_at: null })));
    } finally { await legacy.close(); }
  }, 30_000);
});
