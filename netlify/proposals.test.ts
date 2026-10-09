import { beforeAll, beforeEach, afterAll, describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import type { Context } from '@netlify/functions';
import {
  createInquiry,
  getInquiry,
  listInquiryActivity,
  getInquiryPipeline,
  listInquiries,
  updateFollowUp,
} from './lib/inquiry-store';
import {
  createProposal,
  getAdminProposal,
  getInquiryProposal,
  saveProposal,
  sendProposal,
  getPublicProposal,
  respondToProposal,
} from './lib/proposal-store';
import admin from './functions/admin-proposals.mts';
import publicEndpoint from './functions/proposal.mts';
import {
  draftSchema,
  decimalUnits,
  calculateTotals,
  safeInquiryBack,
  proposalAdminUrl,
} from '../src/lib/proposals/contract';
const mocks = vi.hoisted(() => ({ query: vi.fn(), user: vi.fn() }));
vi.mock('@neondatabase/serverless', () => ({ neon: () => ({ query: mocks.query }) }));
vi.mock('@netlify/identity', () => ({ getUser: mocks.user }));
let db: PGlite;
const context = { params: {} } as Context;
const input = {
  projectType: 'website',
  name: 'Test Client',
  email: 'client@example.test',
  company: 'Example Company',
  website: '',
  projectStage: 'new',
  projectSummary: 'A real project summary for testing.',
  helpNeeded: '',
  budgetRange: 'unsure',
  timeline: 'flexible',
};
const request = (path: string, method = 'GET', body?: unknown, origin = 'https://example.test') =>
  new Request('https://example.test' + path, {
    method,
    headers: { Origin: origin, 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
beforeAll(async () => {
  db = new PGlite();
  for (const name of [
    '001_create_inquiries',
    '002_create_inquiry_activity',
    '003_add_follow_up_fields',
    '004_create_proposals',
  ])
    await db.exec(readFileSync('database/migrations/' + name + '.sql', 'utf8'));
}, 30000);
afterAll(async () => {
  await db?.close();
});
beforeEach(async () => {
  await db.exec('TRUNCATE proposal_items,proposals,inquiry_activity,inquiries');
  vi.resetAllMocks();
  vi.stubEnv('DATABASE_URL', 'postgresql://isolated-test-placeholder');
  mocks.user.mockResolvedValue({ roles: ['admin'] });
  mocks.query.mockImplementation(
    async (sql: string, values: unknown[] = []) => (await db.query(sql, values)).rows,
  );
});
const future = () => {
  const day = new Date();
  day.setUTCDate(day.getUTCDate() + 30);
  return day.toISOString().slice(0, 10);
};
async function draft() {
  const inquiryId = await createInquiry(input, crypto.randomUUID());
  return createProposal(inquiryId, 'Custom website proposal');
}
function body(updatedAt: string) {
  return draftSchema.parse({
    action: 'save',
    title: 'Website proposal',
    summary: 'Build a focused website for the client.',
    validUntil: future(),
    items: [
      { description: 'Design and development', quantity: 2, unitPriceCents: 125000 },
      { description: 'Support', quantity: 1, unitPriceCents: 10000 },
    ],
    discountCents: 10000,
    taxRateBasisPoints: 700,
    internalNotes: 'INTERNAL PRIVATE NOTE',
    clientNotes: 'Client-safe scope notes',
    updatedAt,
  });
}
async function sent() {
  const proposal = await draft();
  const saved = await saveProposal(proposal.id, body(proposal.updatedAt));
  return sendProposal(saved.id, saved.updatedAt);
}
const token = (url: string | null) => url!.split('/')[2];
describe('proposal model, arithmetic and atomic PostgreSQL workflows', () => {
  it('creates one proposal for an inquiry, with safe defaults and one activity event', async () => {
    const proposal = await draft();
    expect(proposal.number).toMatch(/^VS-\d{4}-\d{4,}$/);
    expect(proposal).toMatchObject({
      status: 'draft',
      currency: 'USD',
      clientUrl: null,
      items: [],
      totalCents: 0,
      taxRateBasisPoints: 0,
    });
    expect(await getInquiryProposal(proposal.inquiryId)).toEqual(proposal);
    expect(
      (await listInquiryActivity(proposal.inquiryId)).filter((event) => event.type === 'proposal_created'),
    ).toHaveLength(1);
  });
  it('uses a unique sequence under concurrent creation and retries', async () => {
    const ids = await Promise.all(Array.from({ length: 5 }, () => createInquiry(input, crypto.randomUUID())));
    const proposals = await Promise.all(ids.map((id) => createProposal(id, 'Title')));
    expect(new Set(proposals.map((p) => p.number)).size).toBe(5);
    const retries = await Promise.all(
      Array.from({ length: 3 }, () => createProposal(ids[0], 'Changed title')),
    );
    expect(retries.every((p) => p.id === proposals[0].id)).toBe(true);
    expect((await listInquiryActivity(ids[0])).filter((e) => e.type === 'proposal_created')).toHaveLength(1);
  });
  it('preserves number digits beyond 9999 instead of truncating or colliding', async () => {
    await db.exec("SELECT setval('proposal_number_sequence',9999)");
    const proposal = await draft();
    expect(proposal.number).toMatch(/-10000$/);
  });
  it('allows incomplete draft saving without Send conditions', async () => {
    const p = await draft();
    const saved = await saveProposal(
      p.id,
      draftSchema.parse({ ...body(p.updatedAt), summary: '', validUntil: null, items: [], discountCents: 0 }),
    );
    expect(saved).toMatchObject({
      status: 'draft',
      items: [],
      summary: '',
      validUntil: null,
      totalCents: 0,
      clientUrl: null,
    });
    await expect(sendProposal(saved.id, saved.updatedAt)).rejects.toMatchObject({ status: 422 });
  });
  it('calculates each line, subtotal, fixed discount, reproducible tax and total', async () => {
    const p = await draft();
    const saved = await saveProposal(p.id, body(p.updatedAt));
    expect(saved).toMatchObject({
      subtotalCents: 260000,
      discountCents: 10000,
      taxRateBasisPoints: 700,
      taxCents: 17500,
      totalCents: 267500,
    });
    expect(saved.items.map((item) => item.lineTotalCents)).toEqual([250000, 10000]);
    expect((await getAdminProposal(p.id)).items).toEqual(saved.items);
  });
  it('replaces/removes/reorders saved items and suppresses unchanged-save activity', async () => {
    const p = await draft();
    const first = await saveProposal(p.id, body(p.updatedAt));
    const unchanged = await saveProposal(p.id, body(first.updatedAt));
    expect(
      (await listInquiryActivity(p.inquiryId)).filter((e) => e.type === 'proposal_updated'),
    ).toHaveLength(1);
    const changed = await saveProposal(p.id, {
      ...body(unchanged.updatedAt),
      items: [body(unchanged.updatedAt).items[1]],
      discountCents: 0,
    });
    expect(changed.items).toHaveLength(1);
    expect(changed.items[0].description).toBe('Support');
    expect(changed.subtotalCents).toBe(10000);
  });
  it('rejects stale draft saves without touching items or activity', async () => {
    const p = await draft();
    const saved = await saveProposal(p.id, body(p.updatedAt));
    const events = await listInquiryActivity(p.inquiryId);
    await expect(saveProposal(p.id, body(p.updatedAt))).rejects.toMatchObject({ status: 409 });
    expect(await getAdminProposal(p.id)).toEqual(saved);
    expect(await listInquiryActivity(p.inquiryId)).toEqual(events);
  });
  it.each([
    { discountCents: 260001 },
    { taxRateBasisPoints: 10001 },
    { discountCents: -1 },
    { items: [{ description: 'Bad', quantity: 0, unitPriceCents: 0 }] },
    { items: [{ description: 'Bad', quantity: 1.5, unitPriceCents: 0 }] },
    { items: [{ description: 'Bad', quantity: 1, unitPriceCents: -1 }] },
    { subtotalCents: 1 },
    { client_token: 'forged' },
    { validUntil: '2026-02-30' },
  ])('rejects invalid/tampered inputs %j', async (invalid) => {
    const p = await draft();
    const response = await admin(
      request('/api/admin/proposals?id=' + p.id, 'PATCH', { ...body(p.updatedAt), ...invalid }),
      context,
    );
    expect(response.status).toBe(422);
    expect((await getAdminProposal(p.id)).items).toHaveLength(0);
  });
  it('rejects excessive items, line totals and subtotal safely', async () => {
    const p = await draft();
    for (const items of [
      Array.from({ length: 26 }, () => ({ description: 'Item', quantity: 1, unitPriceCents: 1 })),
      [{ description: 'Too large', quantity: 10000, unitPriceCents: 100000000 }],
      [
        { description: 'Large', quantity: 10, unitPriceCents: 100000000 },
        { description: 'Extra', quantity: 1, unitPriceCents: 1 },
      ],
    ]) {
      expect(
        (
          await admin(
            request('/api/admin/proposals?id=' + p.id, 'PATCH', { ...body(p.updatedAt), items }),
            context,
          )
        ).status,
      ).toBe(422);
    }
  });
  it('publishes a token only after complete saved-draft validation', async () => {
    const p = await draft();
    await expect(sendProposal(p.id, p.updatedAt)).rejects.toMatchObject({ status: 422 });
    const saved = await saveProposal(p.id, body(p.updatedAt));
    const published = await sendProposal(p.id, saved.updatedAt);
    expect(published.status).toBe('sent');
    expect(token(published.clientUrl)).toMatch(/^[A-Za-z0-9_-]{43}$/);
    await expect(saveProposal(p.id, body(published.updatedAt))).rejects.toMatchObject({ status: 409 });
    await expect(sendProposal(p.id, published.updatedAt)).rejects.toMatchObject({ status: 409 });
    expect((await getInquiry(p.inquiryId)).status).toBe('new');
  });
  it('returns an explicit public allowlist without IDs/tokens/internal metadata or private notes', async () => {
    const p = await sent();
    const client = await getPublicProposal(token(p.clientUrl));
    expect(client).toMatchObject({
      number: p.number,
      title: p.title,
      clientNotes: p.clientNotes,
      totalCents: p.totalCents,
    });
    const output = JSON.stringify(client);
    for (const secret of [
      p.id,
      p.inquiryId,
      token(p.clientUrl),
      'INTERNAL PRIVATE NOTE',
      'internalNotes',
      'client_token',
      'updatedAt',
      'source',
      'adminNotes',
    ])
      expect(output).not.toContain(secret);
    expect(Object.keys(client.preparedFor).sort()).toEqual(['company', 'email', 'name']);
    expect((await publicEndpoint(request('/api/proposal?token=' + p.id), context)).status).toBe(404);
  });
  it('keeps draft proposals invisible through public lookup', async () => {
    const p = await draft();
    expect(p.clientUrl).toBeNull();
    await expect(getPublicProposal('a'.repeat(43))).rejects.toMatchObject({ status: 404 });
  });
  it.each(['accept', 'decline'] as const)(
    'records %s once, with a client actor and independent inquiry status',
    async (action) => {
      const p = await sent();
      const client = await respondToProposal(token(p.clientUrl), action);
      expect(client.status).toBe(action === 'accept' ? 'accepted' : 'declined');
      expect(action === 'accept' ? client.acceptedAt : client.declinedAt).toBeTruthy();
      await expect(respondToProposal(token(p.clientUrl), action)).rejects.toMatchObject({ status: 409 });
      await expect(
        respondToProposal(token(p.clientUrl), action === 'accept' ? 'decline' : 'accept'),
      ).rejects.toMatchObject({ status: 409 });
      expect(
        (await listInquiryActivity(p.inquiryId)).filter((e) => e.type === 'proposal_' + client.status),
      ).toEqual([expect.objectContaining({ actor: 'client', proposalNumber: p.number })]);
      expect((await getInquiry(p.inquiryId)).status).toBe('new');
    },
  );
  it('serializes competing accept/decline requests so only one response wins', async () => {
    const p = await sent();
    const results = await Promise.allSettled([
      respondToProposal(token(p.clientUrl), 'accept'),
      respondToProposal(token(p.clientUrl), 'decline'),
    ]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect((await listInquiryActivity(p.inquiryId)).filter((e) => e.actor === 'client')).toHaveLength(1);
  });
  it('derives expiration and refuses accept/decline after the deadline', async () => {
    const p = await sent();
    await db.query("UPDATE proposals SET valid_until='2020-01-01' WHERE id=$1", [p.id]);
    expect((await getPublicProposal(token(p.clientUrl))).status).toBe('expired');
    expect((await getAdminProposal(p.id)).status).toBe('expired');
    await expect(respondToProposal(token(p.clientUrl), 'accept')).rejects.toMatchObject({ status: 409 });
  });
  it.each(['create', 'save', 'send', 'accept'] as const)(
    'rolls back %s together with item/status/activity changes on activity failure',
    async (operation) => {
      let p = operation === 'create' ? await draft() : operation === 'accept' ? await sent() : await draft();
      if (operation === 'send') p = await saveProposal(p.id, body(p.updatedAt));
      const before = await getAdminProposal(p.id),
        events = await listInquiryActivity(p.inquiryId);
      const freshInquiry = operation === 'create' ? await createInquiry(input, crypto.randomUUID()) : null;
      await db.exec(
        `CREATE FUNCTION reject_activity() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'failure'; END $$; CREATE TRIGGER reject_activity BEFORE INSERT ON inquiry_activity FOR EACH ROW EXECUTE FUNCTION reject_activity();`,
      );
      try {
        const action =
          operation === 'create'
            ? createProposal(freshInquiry!, 'Title')
            : operation === 'save'
              ? saveProposal(p.id, body(p.updatedAt))
              : operation === 'send'
                ? sendProposal(p.id, p.updatedAt)
                : respondToProposal(token(p.clientUrl), 'accept');
        await expect(action).rejects.toBeDefined();
        expect(await getAdminProposal(p.id)).toEqual(before);
        expect(await listInquiryActivity(p.inquiryId)).toEqual(events);
        if (freshInquiry) expect(await getInquiryProposal(freshInquiry)).toBeNull();
      } finally {
        await db.exec('DROP TRIGGER reject_activity ON inquiry_activity; DROP FUNCTION reject_activity()');
      }
    },
  );
  it('does not change existing inquiry/list/pipeline/follow-up fields or fabricate proposals', async () => {
    const id = await createInquiry(input, crypto.randomUUID());
    expect(await getInquiryProposal(id)).toBeNull();
    const before = await getInquiry(id);
    const followed = await updateFollowUp(
      id,
      new Date(Date.now() + 86400000).toISOString(),
      'Call next',
      before.updatedAt,
    );
    await createProposal(id, 'A proposal');
    expect(await getInquiry(id)).toEqual(followed);
    expect((await getInquiryPipeline()).items).toHaveLength(1);
    expect((await listInquiries('all', 'newest', 1)).total).toBe(1);
  });
  it('requires server-side admin auth before all private reads and mutations', async () => {
    for (const method of ['GET', 'POST', 'PATCH']) {
      mocks.user.mockResolvedValue(null);
      mocks.query.mockClear();
      expect(
        (
          await admin(
            request(
              '/api/admin/proposals',
              method,
              method === 'GET' ? undefined : { inquiryId: crypto.randomUUID(), title: 'Title' },
            ),
            context,
          )
        ).status,
      ).toBe(401);
      expect(mocks.query).not.toHaveBeenCalled();
      mocks.user.mockResolvedValue({ roles: ['member'] });
      expect((await admin(request('/api/admin/proposals', method), context)).status).toBe(403);
    }
  });
  it('requires same origin and explicit confirmation for intentionally anonymous responses', async () => {
    const p = await sent();
    const url = '/api/proposal?token=' + token(p.clientUrl);
    expect(
      (
        await publicEndpoint(
          request(url, 'POST', { action: 'accept', confirmed: true }, 'https://elsewhere.test'),
          context,
        )
      ).status,
    ).toBe(403);
    expect((await publicEndpoint(request(url, 'POST', { action: 'accept' }), context)).status).toBe(422);
    expect(
      (await publicEndpoint(request(url, 'POST', { action: 'accept', confirmed: true }), context)).status,
    ).toBe(200);
  });
  it('preserves inquiry records and restricts deleting an inquiry with a proposal', async () => {
    const p = await draft();
    await expect(db.query('DELETE FROM inquiries WHERE id=$1', [p.inquiryId])).rejects.toBeDefined();
    expect(await getInquiry(p.inquiryId)).toBeDefined();
  });
  it('uses exact cents and half-up tax, rejecting nondecimal/negative money syntax', () => {
    expect(decimalUnits('1250.00')).toBe(125000);
    expect(decimalUnits('0.01')).toBe(1);
    for (const value of ['-1', '1.001', '1e3', 'NaN']) expect(() => decimalUnits(value)).toThrow();
    expect(calculateTotals([{ description: 'Item', quantity: 1, unitPriceCents: 5 }], 0, 1000).taxCents).toBe(
      1,
    );
  });
  it('preserves only safe inquiry return URLs', () => {
    const id = crypto.randomUUID();
    expect(safeInquiryBack('/admin/?view=pipeline&inquiry=' + id, id)).toContain('view=pipeline');
    expect(safeInquiryBack('https://evil.test/', id)).toBe('/admin/?inquiry=' + id);
    expect(proposalAdminUrl(id)).toContain('?proposal=');
  });
});
