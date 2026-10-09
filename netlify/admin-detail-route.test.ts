import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { parse } from 'smol-toml';
import type { Context } from '@netlify/functions';
import adminEndpoint from './functions/admin-inquiries.mts';
import { inquiryDetailApiUrl } from '../src/lib/inquiries/admin-routes';
import inquiryApiAliases from './dev-api-aliases.mjs';

const mocks = vi.hoisted(() => ({ user: vi.fn(), query: vi.fn() }));
vi.mock('@netlify/identity', () => ({ getUser: mocks.user }));
vi.mock('@neondatabase/serverless', () => ({ neon: () => ({ query: mocks.query }) }));

const id = '34d33c7b-a40a-43b5-ae42-ec4160995bc3';
const origin = 'https://staging.example.test';
const context = { params: {} } as Context;
const stored = {
  id, name: 'Test Visitor', email: 'visitor@example.test', company: 'Example Studio', website: 'https://example.test',
  project_type: 'website', project_stage: 'existing', project_summary: 'Refine an existing business website.',
  help_needed: 'Improve content and navigation.', budget_range: '2500-5000', timeline: '1-3-months',
  status: 'new', source: 'project-wizard', admin_notes: 'Discuss scope before quoting.',
  created_at: '2026-10-08T12:00:00.123Z', updated_at: '2026-10-08T12:00:00.123Z', consent_at: '2026-10-08T12:00:00.123Z',
};
let row: typeof stored;
const expected = {
  id, name: stored.name, email: stored.email, company: stored.company, website: stored.website,
  projectType: stored.project_type, projectStage: stored.project_stage, projectSummary: stored.project_summary,
  helpNeeded: stored.help_needed, budgetRange: stored.budget_range, timeline: stored.timeline,
  status: stored.status, source: stored.source, adminNotes: stored.admin_notes, nextFollowUpAt: null, followUpNote: '',
  createdAt: stored.created_at, updatedAt: stored.updated_at, consentAt: stored.consent_at,
};
const request = (path: string, method = 'GET', body?: unknown) => new Request(origin + path, {
  method, headers: { Origin: origin, 'Content-Type': 'application/json' },
  ...(body ? { body: JSON.stringify(body) } : {}),
});

beforeEach(() => {
  vi.resetAllMocks(); vi.stubEnv('DATABASE_URL', 'postgresql://test-placeholder');
  mocks.user.mockResolvedValue({ roles: ['admin'] }); row = { ...stored };
  mocks.query.mockImplementation(async (sql: string, parameters: unknown[] = []) => {
    if (sql.includes('UPDATE inquiries AS inquiry')) {
      if (parameters[0] !== id || parameters[3] !== row.updated_at) return [];
      row = { ...row, status: String(parameters[1]), admin_notes: String(parameters[2]), updated_at: '2026-10-08T13:00:00.456Z' };
      return [row];
    }
    if (sql.includes('FROM inquiry_activity')) return [];
    if (sql.includes('WHERE id=$1')) return parameters[0] === id ? [row] : [];
    if (sql.includes('FILTER')) return [{ total: 1, new: 1, active: 0, won: 0 }];
    if (sql.includes('count(*)')) return [{ total: 1 }];
    return [row];
  });
});

describe('admin detail requests with real handler/store and empty rewrite params', () => {
  it('reproduces why the old path request could return a list payload instead of detail', async () => {
    const response = await adminEndpoint(request('/api/admin/inquiries/' + id), context);
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ items: [{ id }] });
    expect(mocks.query.mock.calls.some(([sql]) => sql.includes('WHERE id=$1'))).toBe(false);
  });

  it.each(['/api/admin/inquiries', '/.netlify/functions/admin-inquiries'])('lists and retrieves every persisted field through %s', async path => {
    const list = await adminEndpoint(request(path + '?status=all&sort=newest&page=1'), context);
    expect(list.status).toBe(200);
    expect(await list.json()).toMatchObject({ items: [{ id }], metrics: { total: 1 } });
    const detail = await adminEndpoint(request(path + '?id=' + encodeURIComponent(id)), context);
    expect(detail.status).toBe(200); expect(await detail.json()).toEqual({ inquiry: expected, activity: [] });
    expect(mocks.query.mock.calls.find(([sql]) => sql.includes('WHERE id=$1'))?.[1]).toEqual([id]);
    expect(detail.headers.get('cache-control')).toBe('no-store');
  });

  it('updates status and notes using the same query URL and retains timestamp protection', async () => {
    const body = { status: 'qualified', adminNotes: 'Confirm the revised scope.', updatedAt: stored.updated_at };
    const response = await adminEndpoint(request(inquiryDetailApiUrl(id), 'PATCH', body), context);
    expect(response.status).toBe(200);
    const saved = { ...expected, status: body.status, adminNotes: body.adminNotes, updatedAt: row.updated_at };
    expect(await response.json()).toEqual({ inquiry: saved });
    expect(mocks.query.mock.calls[0][1]).toEqual([id, body.status, body.adminNotes, body.updatedAt]);
    expect(await (await adminEndpoint(request(inquiryDetailApiUrl(id)), context)).json()).toEqual({ inquiry: saved, activity: [] });
    expect((await adminEndpoint(request(inquiryDetailApiUrl(id), 'PATCH', body), context)).status).toBe(409);
  });

  it.each(['GET', 'PATCH'])('returns 404 for a nonexistent UUID on %s', async method => {
    const response = await adminEndpoint(request(inquiryDetailApiUrl('44d33c7b-a40a-43b5-ae42-ec4160995bc3'), method,
      method === 'PATCH' ? { status: 'new', adminNotes: '', updatedAt: stored.updated_at } : undefined), context);
    expect(response.status).toBe(404); expect(await response.json()).toEqual({ error: 'This inquiry could not be found.' });
  });

  it.each(['GET', 'PATCH'])('returns 400 before querying Neon for an invalid UUID on %s', async method => {
    const response = await adminEndpoint(request(inquiryDetailApiUrl('not/a/uuid'), method, method === 'PATCH' ? {} : undefined), context);
    expect(response.status).toBe(400); expect(mocks.query).not.toHaveBeenCalled();
  });

  it.each(['GET', 'PATCH'])('requires authenticated admin access for %s', async method => {
    mocks.user.mockResolvedValue(null);
    expect((await adminEndpoint(request(inquiryDetailApiUrl(id), method, method === 'PATCH' ? {} : undefined), context)).status).toBe(401);
    mocks.user.mockResolvedValue({ roles: ['member'] });
    expect((await adminEndpoint(request(inquiryDetailApiUrl(id), method, method === 'PATCH' ? {} : undefined), context)).status).toBe(403);
    expect(mocks.query).not.toHaveBeenCalled();
  });

  it('keeps database errors out of detail responses', async () => {
    mocks.query.mockRejectedValue(new Error('private database detail'));
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    const response = await adminEndpoint(request(inquiryDetailApiUrl(id)), context);
    expect(response.status).toBe(503); expect(await response.text()).not.toContain('private database detail');
    log.mockRestore();
  });

  it('uses the existing static production alias and preserves the incoming ID query', () => {
    const config = parse(readFileSync(new URL('../netlify.toml', import.meta.url), 'utf8'));
    const redirects = config.redirects as { from: string; to: string; status: number; force?: boolean }[];
    const path = inquiryDetailApiUrl(id); const url = new URL(path, origin);
    const alias = redirects.find(rule => rule.from === url.pathname);
    expect(alias).toMatchObject({ to: '/.netlify/functions/admin-inquiries', status: 200, force: true });
    expect(url.searchParams.get('id')).toBe(id);
    expect(redirects.some(rule => rule.from === '/api/admin/inquiries/:id')).toBe(false);
  });

  it('keeps local query forwarding consistent with the production static alias', () => {
    let middleware: (req: { url: string }, response: unknown, next: () => void) => void;
    const plugin = inquiryApiAliases();
    (plugin.configureServer as Function)({ middlewares: { use: (callback: typeof middleware) => { middleware = callback; } } });
    const req = { url: inquiryDetailApiUrl(id) }; const next = vi.fn();
    middleware!(req, {}, next);
    expect(req.url).toBe('/.netlify/functions/admin-inquiries?id=' + id); expect(next).toHaveBeenCalledOnce();
  });
});
