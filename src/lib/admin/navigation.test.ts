import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getUser, onAuthChange, type User } from '@netlify/identity';
import { setupAdminNavigation } from '@/lib/admin/navigation';

vi.mock('@netlify/identity', () => ({ getUser: vi.fn(), onAuthChange: vi.fn() }));

describe('admin navigation follows the existing Identity session', () => {
  const admin = { id: 'admin', roles: ['admin'] } as User;
  let notify: Parameters<typeof onAuthChange>[0];
  let unsubscribe = vi.fn<() => void>();
  let menu: { open: boolean };
  let header: HTMLElement;
  beforeEach(() => {
    vi.clearAllMocks();
    unsubscribe = vi.fn<() => void>();
    menu = { open: false };
    header = { hidden: true, querySelector: () => menu } as unknown as HTMLElement;
    vi.mocked(onAuthChange).mockImplementation(callback => { notify = callback; return unsubscribe; });
    vi.mocked(getUser).mockResolvedValue(null);
  });

  it('handles sign-in, sign-out and another sign-in without a page reload', async () => {
    setupAdminNavigation(header);
    await Promise.resolve();
    expect(header.hidden).toBe(true);
    notify('login', admin);
    expect(header.hidden).toBe(false);
    menu.open = true;
    notify('logout', null);
    expect(header.hidden).toBe(true);
    expect(menu.open).toBe(false);
    notify('login', admin);
    expect(header.hidden).toBe(false);
  });

  it('restores an existing admin session and uses Identity role updates', async () => {
    vi.mocked(getUser).mockResolvedValue(admin);
    setupAdminNavigation(header);
    await Promise.resolve();
    expect(header.hidden).toBe(false);
    notify('token_refresh', { ...admin, roles: [] });
    expect(header.hidden).toBe(true);
    notify('user_updated', admin);
    expect(header.hidden).toBe(false);
    notify('user_updated', { ...admin, roles: undefined });
    expect(header.hidden).toBe(true);
  });

  it.each(['login', 'logout'] as const)('does not overwrite a newer %s with a stale initial lookup', async event => {
    let resolve!: (user: User | null) => void;
    vi.mocked(getUser).mockReturnValue(new Promise(done => { resolve = done; }));
    setupAdminNavigation(header);
    notify(event, event === 'login' ? admin : null);
    resolve(event === 'login' ? null : admin);
    await Promise.resolve();
    expect(header.hidden).toBe(event === 'logout');
  });

  it('stays hidden if session restoration fails', async () => {
    vi.mocked(getUser).mockRejectedValue(new Error('Session unavailable'));
    setupAdminNavigation(header);
    await Promise.resolve();
    expect(header.hidden).toBe(true);
  });

  it('unsubscribes and ignores a pending initial lookup when disposed', async () => {
    let resolve!: (user: User | null) => void;
    vi.mocked(getUser).mockReturnValue(new Promise(done => { resolve = done; }));
    const cleanup = setupAdminNavigation(header);
    cleanup();
    resolve(admin);
    await Promise.resolve();
    expect(unsubscribe).toHaveBeenCalledOnce();
    expect(header.hidden).toBe(true);
  });
});
