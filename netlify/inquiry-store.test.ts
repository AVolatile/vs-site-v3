import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createInquiry, getInquiry, updateInquiry } from './lib/inquiry-store';
const mocks = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock('@neondatabase/serverless', () => ({ neon: () => ({ query: mocks.query }) }));
beforeEach(() => { vi.resetAllMocks(); vi.stubEnv('DATABASE_URL','postgresql://test-placeholder'); });
describe('parameterized inquiry persistence', () => {
  it('preserves timestamp milliseconds for optimistic updates when Neon returns Date objects', async () => {
    mocks.query.mockResolvedValue([{id:'receipt',created_at:new Date('2026-10-08T10:00:00.123Z'),updated_at:new Date('2026-10-08T11:00:00.456Z'),consent_at:new Date('2026-10-08T10:00:00.123Z')}]);
    const inquiry = await getInquiry('34d33c7b-a40a-43b5-ae42-ec4160995bc3');
    expect(inquiry.updatedAt).toBe('2026-10-08T11:00:00.456Z'); expect(inquiry.createdAt).toBe('2026-10-08T10:00:00.123Z');
  });
  it('binds SQL-like input as data and includes the idempotency guard', async () => {
    mocks.query.mockResolvedValue([{ id:'receipt' }]);
    const input = { projectType:'website',name:"Visitor'; DROP TABLE inquiries;--",email:'test@example.com',company:'',website:'',projectStage:'new',projectSummary:'A project summary.',helpNeeded:'',budgetRange:'unsure',timeline:'flexible' };
    expect(await createInquiry(input,'34d33c7b-a40a-43b5-ae42-ec4160995bc3')).toBe('receipt');
    const [statement, values] = mocks.query.mock.calls[0];
    expect(statement).not.toContain(input.name); expect(values[0]).toBe(input.name);
    expect(statement).toContain('ON CONFLICT (submission_key) DO NOTHING'); expect(statement).toContain('INSERT INTO inquiry_activity');
  });
  it('detects a reused key for different input', async () => {
    mocks.query.mockResolvedValue([]);
    await expect(createInquiry({projectType:'website',name:'Test',email:'test@example.com',company:'',website:'',projectStage:'new',projectSummary:'A project.',helpNeeded:'',budgetRange:'unsure',timeline:'flexible'},'34d33c7b-a40a-43b5-ae42-ec4160995bc3')).rejects.toMatchObject({status:409});
  });
  it('prevents stale note/status updates from overwriting another edit', async () => {
    mocks.query.mockResolvedValueOnce([]).mockResolvedValueOnce([{id:'34d33c7b-a40a-43b5-ae42-ec4160995bc3',created_at:'2026-10-08',updated_at:'2026-10-08',consent_at:'2026-10-08'}]);
    await expect(updateInquiry('34d33c7b-a40a-43b5-ae42-ec4160995bc3','new','draft','2026-10-08T10:00:00.000Z')).rejects.toMatchObject({status:409});
    expect(mocks.query.mock.calls[0][0]).toContain('updated_at=$4::timestamptz');
  });
});
