import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Context } from '@netlify/functions';
import submit from './functions/inquiries.mts';
import adminEndpoint from './functions/admin-inquiries.mts';
import { submissionSchema } from '../src/lib/inquiries/contract';

const mocks = vi.hoisted(() => ({ user: vi.fn(), create: vi.fn(), list: vi.fn(), get: vi.fn(), update: vi.fn(), activity: vi.fn(), pipeline: vi.fn() }));
vi.mock('@netlify/identity', () => ({ getUser: mocks.user }));
vi.mock('./lib/inquiry-store', () => ({ createInquiry: mocks.create, listInquiries: mocks.list, getInquiry: mocks.get, updateInquiry: mocks.update, updateFollowUp: mocks.update, listInquiryActivity: mocks.activity, getInquiryPipeline: mocks.pipeline }));
const id = '34d33c7b-a40a-43b5-ae42-ec4160995bc3';
const payload = () => ({ projectType: 'website', name: '  Test Visitor  ', email: 'TEST@example.com', company: '', website: 'example.com',
  projectStage: 'new', projectSummary: 'A website for a local business.', helpNeeded: '', budgetRange: 'unsure', timeline: 'flexible',
  consent: true, submissionKey: id, startedAt: Date.now() - 5000, honeypot: '' });
const request = (body: unknown, path = '/api/inquiries', method = 'POST', origin = 'https://example.test') => new Request('https://example.test' + path, {
  method, headers: { Origin: origin, 'Content-Type': 'application/json' }, ...(method !== 'GET' ? { body: JSON.stringify(body) } : {}),
});
const context = (inquiryId?: string) => ({ params: inquiryId ? { id: inquiryId } : {} }) as Context;
beforeEach(() => { vi.resetAllMocks(); mocks.user.mockResolvedValue(null); mocks.create.mockResolvedValue(id); mocks.activity.mockResolvedValue([]); });

describe('public inquiry submission', () => {
  it('normalizes validated fields and only returns a receipt', async () => {
    const response = await submit(request(payload()));
    expect(response.status).toBe(201); expect(await response.json()).toEqual({ received: true, reference: id });
    expect(mocks.create.mock.calls[0][0]).toMatchObject({ name: 'Test Visitor', email: 'test@example.com', website: 'https://example.com' });
    expect(mocks.create.mock.calls[0][0]).not.toHaveProperty('consent');
    expect(response.headers.get('cache-control')).toBe('no-store');
  });
  it.each([
    ['email', 'not-an-email'], ['name', ''], ['projectSummary', ''], ['projectType', 'unknown'],
    ['projectStage','unknown'], ['budgetRange','unknown'], ['timeline','unknown'], ['projectSummary','a'.repeat(4001)],
    ['website','javascript:alert(1)'], ['website','https://user:pass@example.com'], ['consent',false],
  ])('rejects invalid %s before database access', async (field, value) => {
    const response = await submit(request({ ...payload(), [field]: value }));
    expect(response.status).toBe(422); expect(mocks.create).not.toHaveBeenCalled();
  });
  it('rejects mass-assignment of status and notes', async () => {
    expect((await submit(request({ ...payload(), status: 'won', adminNotes: 'secret' }))).status).toBe(422);
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it('rejects filled honeypots and implausibly quick submissions', async () => {
    expect((await submit(request({ ...payload(), honeypot: 'bot' }))).status).toBe(422);
    expect((await submit(request({ ...payload(), startedAt: Date.now() }))).status).toBe(422);
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it('rejects cross-origin requests', async () => {
    expect((await submit(request(payload(), '/api/inquiries', 'POST', 'https://attacker.test'))).status).toBe(403);
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it('enforces body limits without relying on Content-Length', async () => {
    const response = await submit(request({ ...payload(), projectSummary: 'x'.repeat(20_000) }));
    expect(response.status).toBe(413); expect(mocks.create).not.toHaveBeenCalled();
  });
  it('returns a recoverable failure without database details or fake success', async () => {
    mocks.create.mockRejectedValue(new Error('postgresql://secret@example.test/database'));
    const response = await submit(request(payload())); const text = await response.text();
    expect(response.status).toBe(503); expect(text).not.toContain('secret'); expect(text).not.toContain('received');
  });
  it('does not offer public reads', async () => { expect((await submit(request(null, '/api/inquiries', 'GET'))).status).toBe(405); });
});

describe('private inquiry authorization and mutations', () => {
  it.each(['GET','PATCH'])('rejects unauthenticated %s before any database call', async method => {
    const response = await adminEndpoint(request({}, '/api/admin/inquiries/' + id, method), context(id));
    expect(response.status).toBe(401); expect(mocks.list).not.toHaveBeenCalled(); expect(mocks.get).not.toHaveBeenCalled(); expect(mocks.update).not.toHaveBeenCalled();
  });
  it('does not trust user-supplied role headers', async () => {
    const req = request(null, '/api/admin/inquiries', 'GET'); req.headers.set('X-Admin','true'); req.headers.set('Authorization','Bearer forged');
    expect((await adminEndpoint(req, context())).status).toBe(401); expect(mocks.list).not.toHaveBeenCalled();
  });
  it('requires admin role even for an authenticated user', async () => {
    mocks.user.mockResolvedValue({ roles: ['member'] });
    expect((await adminEndpoint(request(null, '/api/admin/inquiries', 'GET'), context())).status).toBe(403);
    expect(mocks.list).not.toHaveBeenCalled();
  });
  it('permits authenticated admin list/detail reads', async () => {
    mocks.user.mockResolvedValue({ roles: ['admin'] }); mocks.list.mockResolvedValue({ items: [], metrics: { total:0,new:0,active:0,won:0 } }); mocks.get.mockResolvedValue({ id,adminNotes:'Private note' });
    const list = await adminEndpoint(request(null, '/api/admin/inquiries?status=new&sort=oldest', 'GET'), context());
    expect(list.status).toBe(200); expect(mocks.list).toHaveBeenCalledWith('new','oldest',1,expect.objectContaining({ status: 'new', sort: 'oldest', search: '' }));
    const detail = await adminEndpoint(request(null, '/api/admin/inquiries/' + id, 'GET'), context(id)); expect(detail.status).toBe(200);
  });
  it('validates status/notes and performs authorized updates', async () => {
    mocks.user.mockResolvedValue({ roles: ['admin'] }); mocks.update.mockResolvedValue({ id, status:'reviewing', adminNotes:'Discuss scope.' });
    const body = { status: 'reviewing', adminNotes:'Discuss scope.', updatedAt:'2026-10-08T12:00:00.000Z' };
    expect((await adminEndpoint(request(body, '/api/admin/inquiries/' + id, 'PATCH'), context(id))).status).toBe(200);
    expect(mocks.update).toHaveBeenCalledWith(id,body.status,body.adminNotes,body.updatedAt);
    expect((await adminEndpoint(request({ ...body,status:'fake' }, '/api/admin/inquiries/' + id, 'PATCH'), context(id))).status).toBe(422);
    expect((await adminEndpoint(request(body, '/api/admin/inquiries/' + id, 'PATCH','https://attacker.test'), context(id))).status).toBe(403);
  });
  it('fails closed when Identity verification fails', async () => {
    mocks.user.mockRejectedValue(new Error('Invalid session'));
    expect((await adminEndpoint(request(null, '/api/admin/inquiries', 'GET'), context())).status).toBe(401); expect(mocks.list).not.toHaveBeenCalled();
  });
  it('rejects invalid references and arbitrary sort strings', async () => {
    mocks.user.mockResolvedValue({ roles: ['admin'] });
    expect((await adminEndpoint(request(null, '/api/admin/inquiries/bad', 'GET'), context('bad'))).status).toBe(400);
    expect((await adminEndpoint(request(null, '/api/admin/inquiries?sort=DROP%20TABLE', 'GET'), context())).status).toBe(400);
    expect(mocks.get).not.toHaveBeenCalled(); expect(mocks.list).not.toHaveBeenCalled();
  });
});

describe('shared form contract', () => {
  it('requires complete data and records affirmative consent', () => {
    expect(submissionSchema.safeParse(payload()).success).toBe(true);
    expect(submissionSchema.safeParse({ ...payload(),consent:false }).success).toBe(false);
  });
});
