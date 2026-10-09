import { login, logout, getUser, getSettings, handleAuthCallback, acceptInvite, updateUser, requestPasswordRecovery, onAuthChange } from '@netlify/identity';
import { inquiryContent, optionLabel, STATUS_OPTIONS, updateSchema, fieldErrors, type Inquiry, type InquiryList } from './contract';
import { presentInquiryRow, presentInquiryStatus } from './admin-presentation';

export async function setupInquiryAdmin(): Promise<void> {
  const root = document.querySelector<HTMLElement>('[data-inquiry-admin]'); if (!root) return;
  const element = <T extends HTMLElement = HTMLElement>(selector: string) => root.querySelector<T>(selector)!;
  const message = element('[data-admin-message]');
  const loginPanel = element('[data-admin-login]'); const passwordPanel = element('[data-admin-password]');
  const dashboard = element('[data-admin-dashboard]'); const listPanel = element('[data-admin-list-panel]'); const detailPanel = element('[data-admin-detail-panel]');
  const loginForm = element<HTMLFormElement>('[data-admin-login-form]'); const passwordForm = element<HTMLFormElement>('[data-admin-password-form]');
  const updateForm = element<HTMLFormElement>('[data-admin-update-form]'); const rows = element<HTMLTableSectionElement>('[data-admin-rows]');
  const filter = element<HTMLSelectElement>('[name="filterStatus"]'); const sort = element<HTMLSelectElement>('[name="sortOrder"]');
  const logoutButton = element<HTMLButtonElement>('[data-admin-logout]');
  let lead: Inquiry | null = null; let page = 1; let listVersion = 0; let detailVersion = 0;
  let authenticated = false; let authBusy = false; let saving = false; let inviteToken: string | undefined;
  let listAbort: AbortController | undefined; let detailAbort: AbortController | undefined;
  filter.value = 'all'; sort.value = 'newest';
  const friendly = (error: unknown, fallback: string) => error instanceof ServiceError ? error.message : fallback;
  function announce(text: string, error = false): void {
    message.textContent = text; message.setAttribute('role', error ? 'alert' : 'status');
  }
  function clearPrivate(): void {
    authenticated = false; listAbort?.abort(); detailAbort?.abort(); lead = null; rows.replaceChildren(); updateForm.reset();
    root!.querySelectorAll<HTMLElement>('[data-admin-detail],[data-admin-metric]').forEach(node => { node.textContent = ''; });
    const emailAction = element<HTMLAnchorElement>('[data-admin-email]'); emailAction.href = 'mailto:'; emailAction.hidden = true;
    passwordPanel.hidden = true; passwordForm.reset(); element('[data-admin-refresh]').hidden = true;
    dashboard.hidden = true; logoutButton.hidden = true; loginPanel.hidden = false;
    if (document.activeElement?.closest('[hidden]')) element<HTMLInputElement>('[name="loginEmail"]').focus();
  }
  class ServiceError extends Error { constructor(public status: number, message: string) { super(message); } }
  async function api<T>(url: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(url, { ...options, credentials: 'same-origin', cache: 'no-store',
      signal: options.signal ? AbortSignal.any([options.signal, AbortSignal.timeout(20_000)]) : AbortSignal.timeout(20_000) });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) clearPrivate();
      throw new ServiceError(response.status, typeof payload.error === 'string' ? payload.error : 'This request could not be completed.');
    }
    return payload as T;
  }
  const date = (value: string) => new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  onAuthChange(event => { if (event === 'logout') { clearPrivate(); announce('Signed out.'); } });
  const label = (key: string, value: string) => {
    const choices = { projectType: inquiryContent.projectTypes, projectStage: inquiryContent.projectStages, budgetRange: inquiryContent.budgets, timeline: inquiryContent.timelines };
    if (key in choices) return optionLabel(choices[key as keyof typeof choices], value);
    return value || 'Not provided';
  };
  async function loadList(): Promise<void> {
    if (!authenticated) return;
    const returningFromDetail = !detailPanel.hidden;
    const previousId = lead?.id;
    const version = ++listVersion; listAbort?.abort(); listAbort = new AbortController();
    detailAbort?.abort(); detailVersion++;
    listPanel.hidden = false; detailPanel.hidden = true; listPanel.setAttribute('aria-busy', 'true');
    announce('Loading inquiries…');
    element<HTMLButtonElement>('[data-admin-previous]').disabled = true; element<HTMLButtonElement>('[data-admin-next]').disabled = true;
    try {
      const query = new URLSearchParams({ status: filter.value, sort: sort.value, page: String(page) });
      const result = await api<InquiryList>('/api/admin/inquiries?' + query, { signal: listAbort.signal });
      if (version !== listVersion || !authenticated) return;
      if (page > 1 && !result.items.length) { page = Math.max(1, Math.ceil(result.total / result.pageSize)); await loadList(); return; }
      rows.replaceChildren();
      for (const item of result.items) {
        const row = document.createElement('tr');
        const values = [item.name, item.company || '—', label('projectType', item.projectType), label('budgetRange', item.budgetRange), label('timeline', item.timeline), item.status, date(item.createdAt)];
        values.forEach((value, index) => {
          const cell = document.createElement('td');
          if (index === 0) { const link = document.createElement('a'); link.textContent = value; link.href = '/admin/?inquiry=' + encodeURIComponent(item.id); link.dataset.inquiryId = item.id; cell.append(link); }
          else cell.textContent = value;
          row.append(cell);
        });
        presentInquiryRow(row, item.status, item.id === previousId);
        rows.append(row);
      }
      for (const [key, value] of Object.entries(result.metrics)) element(`[data-admin-metric="${key}"]`).textContent = value.toLocaleString();
      const empty = element('[data-admin-empty]'); empty.hidden = result.items.length > 0;
      empty.textContent = filter.value === 'all' ? 'No inquiries yet. New submissions will appear here.' : 'No inquiries match this status. Choose another status to continue.';
      element('[data-admin-page]').textContent = `Page ${page} of ${Math.max(1, Math.ceil(result.total / result.pageSize))} — ${result.total} inquiries`;
      element<HTMLButtonElement>('[data-admin-previous]').disabled = page === 1;
      element<HTMLButtonElement>('[data-admin-next]').disabled = page * result.pageSize >= result.total;
      announce(`${result.total} inquiries loaded.`);
      if (returningFromDetail || document.activeElement?.closest('[hidden]')) {
        const previousLink = previousId ? rows.querySelector<HTMLAnchorElement>(`a[data-inquiry-id="${previousId}"]`) : null;
        (previousLink ?? filter).focus();
      }
    } catch (error) { if (version === listVersion && !listAbort.signal.aborted) announce(friendly(error, 'Inquiries could not be loaded. Please try Refresh inquiries.'), true); }
    finally { if (version === listVersion) listPanel.removeAttribute('aria-busy'); }
  }
  function renderDetail(inquiry: Inquiry): void {
    lead = inquiry;
    root!.querySelectorAll<HTMLElement>('[data-admin-detail]').forEach(node => {
      const key = node.dataset.adminDetail as keyof Inquiry; const value = String(inquiry[key]);
      node.textContent = key.endsWith('At') ? date(value) : label(key, value);
    });
    presentInquiryStatus(element('[data-admin-detail="status"]'), inquiry.status);
    element<HTMLAnchorElement>('[data-admin-email]').href = 'mailto:' + encodeURIComponent(inquiry.email);
    element('[data-admin-email]').hidden = false;
    element<HTMLSelectElement>('[name="status"]').value = inquiry.status;
    element<HTMLTextAreaElement>('[name="adminNotes"]').value = inquiry.adminNotes;
    element('[data-admin-save-message]').textContent = '';
  }
  async function loadDetail(id: string): Promise<void> {
    if (!authenticated) return;
    const version = ++detailVersion; detailAbort?.abort(); detailAbort = new AbortController();
    listAbort?.abort(); listVersion++;
    lead = null; updateForm.reset();
    element('[data-admin-email]').hidden = true;
    listPanel.hidden = true; detailPanel.hidden = false; detailPanel.setAttribute('aria-busy', 'true');
    root!.querySelectorAll<HTMLElement>('[data-admin-detail]').forEach(node => { node.textContent = ''; });
    announce('Loading inquiry…'); updateForm.hidden = true;
    try {
      const result = await api<{ inquiry: Inquiry }>('/api/admin/inquiries/' + encodeURIComponent(id), { signal: detailAbort.signal });
      if (version !== detailVersion || !authenticated) return;
      renderDetail(result.inquiry); updateForm.hidden = false; announce('Inquiry loaded.');
      element('[data-admin-detail-heading]').focus();
    } catch (error) { if (version === detailVersion && !detailAbort.signal.aborted) { announce(friendly(error, 'This inquiry could not be loaded. Return to the list and try again.'), true); if (authenticated) element('[data-admin-back]').focus(); } }
    finally { if (version === detailVersion) detailPanel.removeAttribute('aria-busy'); }
  }
  async function checkSession(): Promise<void> {
    const user = await getUser();
    if (!user) { clearPrivate(); announce('Sign in with your invited account.'); return; }
    logoutButton.hidden = false;
    if (!user.roles?.includes('admin')) {
      clearPrivate(); logoutButton.hidden = false; element('[data-admin-refresh]').hidden = false;
      announce('This account needs the admin role. Sign in again after the role has been assigned.', true); return;
    }
    authenticated = true; loginPanel.hidden = true; passwordPanel.hidden = true; dashboard.hidden = false;
    // Cookies established by Identity enable the CDN role gate on subsequent requests.
    if (location.pathname.startsWith('/admin/login')) history.replaceState(null, '', '/admin/');
    const id = new URL(location.href).searchParams.get('inquiry');
    if (id) await loadDetail(id); else await loadList();
  }
  function validation(form: HTMLFormElement, fields: Record<string, string>): void {
    form.querySelectorAll<HTMLElement>('[data-field-error]').forEach(node => { const value = fields[node.dataset.fieldError!]; node.textContent = value ?? ''; node.hidden = !value; });
    form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>('input,select,textarea').forEach(input => {
      if (fields[input.name]) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
    });
    form.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }
  function authControls(disabled: boolean): void {
    root!.querySelectorAll<HTMLButtonElement>('[data-admin-login] button,[data-admin-password] button').forEach(button => { button.disabled = disabled; });
  }
  loginForm.addEventListener('submit', async event => {
    event.preventDefault(); if (authBusy) return;
    const fields = new FormData(loginForm); const email = String(fields.get('loginEmail') ?? '').trim(); const password = String(fields.get('loginPassword') ?? '');
    const invalid: Record<string,string> = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) invalid.loginEmail = 'Enter a valid email address.';
    if (!password) invalid.loginPassword = 'Enter your password.';
    validation(loginForm, invalid); if (Object.keys(invalid).length) return;
    authBusy = true; authControls(true); announce('Signing in…');
    try { await login(email, password); loginForm.reset(); await checkSession(); }
    catch { announce('Sign-in failed. Check your email and password, and confirm that your account has been invited.', true); }
    finally { authBusy = false; authControls(false); }
  });
  passwordForm.addEventListener('submit', async event => {
    event.preventDefault(); if (authBusy) return;
    const fields = new FormData(passwordForm); const password = String(fields.get('newPassword') ?? ''); const invalid: Record<string,string> = {};
    if (password.length < 12) invalid.newPassword = 'Use at least 12 characters.';
    if (password !== fields.get('confirmPassword')) invalid.confirmPassword = 'The passwords do not match.';
    validation(passwordForm, invalid); if (Object.keys(invalid).length) return;
    authBusy = true; authControls(true); announce('Saving password…');
    try { if (inviteToken) await acceptInvite(inviteToken, password); else await updateUser({ password }); inviteToken = undefined; passwordForm.reset(); await checkSession(); }
    catch { announce('The password could not be saved. Try again, or request a fresh invitation or recovery email.', true); }
    finally { authBusy = false; authControls(false); }
  });
  element('[data-admin-recovery]').addEventListener('click', async () => {
    if (authBusy) return;
    const email = String(new FormData(loginForm).get('loginEmail') ?? '').trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { validation(loginForm, { loginEmail: 'Enter your email to request a reset.' }); return; }
    authBusy = true; authControls(true);
    try { await requestPasswordRecovery(email); announce('If this email belongs to an invited account, a password reset email will be sent.'); }
    catch { announce('Password reset is unavailable. Please try again on the configured Netlify deployment.', true); }
    finally { authBusy = false; authControls(false); }
  });
  logoutButton.addEventListener('click', async () => { clearPrivate(); try { await logout(); announce('Signed out.'); } catch { announce('Local inquiry data was cleared. Sign-out could not be confirmed; close this session and try again.', true); } });
  element('[data-admin-refresh]').addEventListener('click', async () => { clearPrivate(); try { await logout(); announce('Sign in again to apply the updated role.'); } catch { announce('Sign out could not be confirmed. Close this session and sign in again.', true); } });
  rows.addEventListener('click', event => { const link = (event.target as HTMLElement).closest<HTMLAnchorElement>('a[data-inquiry-id]'); if (!link || event instanceof MouseEvent && (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)) return; event.preventDefault(); history.pushState(null, '', link.href); void loadDetail(link.dataset.inquiryId!); });
  const backToList = () => { history.pushState(null, '', '/admin/'); void loadList(); };
  element('[data-admin-back]').addEventListener('click', backToList);
  element('[data-admin-retry]').addEventListener('click', () => { void loadList(); });
  element('[data-admin-reload]').addEventListener('click', () => { const id = new URL(location.href).searchParams.get('inquiry'); if (id) void loadDetail(id); });
  filter.addEventListener('change', () => { page = 1; void loadList(); }); sort.addEventListener('change', () => { page = 1; void loadList(); });
  element('[data-admin-previous]').addEventListener('click', () => { if (page > 1) { page--; void loadList(); } });
  element('[data-admin-next]').addEventListener('click', () => { page++; void loadList(); });
  window.addEventListener('popstate', () => { const id = new URL(location.href).searchParams.get('inquiry'); if (id) void loadDetail(id); else void loadList(); });
  updateForm.addEventListener('submit', async event => {
    event.preventDefault(); if (!lead || saving) return;
    const fields = new FormData(updateForm); const result = updateSchema.safeParse({ status: fields.get('status'), adminNotes: fields.get('adminNotes'), updatedAt: lead.updatedAt });
    if (!result.success) { validation(updateForm, fieldErrors(result.error)); return; }
    validation(updateForm, {}); saving = true; updateForm.setAttribute('aria-busy', 'true');
    const controls = [...detailPanel.querySelectorAll<HTMLButtonElement | HTMLSelectElement | HTMLTextAreaElement>('button,select,textarea')]; controls.forEach(control => { control.disabled = true; });
    const saveMessage = element('[data-admin-save-message]'); saveMessage.textContent = 'Saving…';
    try {
      const response = await api<{ inquiry: Inquiry }>('/api/admin/inquiries/' + lead.id, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(result.data) });
      if (!authenticated) return;
      renderDetail(response.inquiry); saveMessage.textContent = 'Changes saved.';
    } catch (error) { saveMessage.textContent = friendly(error, 'Changes could not be saved. Your edits are still here. Please try again.'); }
    finally { saving = false; updateForm.removeAttribute('aria-busy'); controls.forEach(control => { control.disabled = false; }); if (authenticated && !detailPanel.hidden) updateForm.querySelector<HTMLButtonElement>('button[type="submit"]')?.focus(); }
  });
  try {
    const callback = await handleAuthCallback();
    if (callback?.type === 'invite' || callback?.type === 'recovery') {
      inviteToken = callback.token; loginPanel.hidden = true; passwordPanel.hidden = false; announce('Set your password to continue.'); return;
    }
    await checkSession();
    // Email login is intentional; do not render public signup or invent OAuth providers.
    if (!authenticated) { const settings = await getSettings(); if (!settings.providers.email) announce('Email sign-in must be enabled for this workspace.', true); }
  } catch { clearPrivate(); announce('Sign-in is unavailable here. Netlify Identity must be enabled on the deployed project; local Identity login is not supported.', true); }
}
