import { followUpSchema, fieldErrors, type Inquiry } from './contract';
import { inquiryDetailApiUrl } from './admin-routes';
import { localDateTime, utcDateTime, presentFollowUp } from './follow-up';
interface FollowUpOptions {
  form: HTMLFormElement;
  current: () => Inquiry | null;
  active: () => boolean;
  version: () => number;
  saving: () => boolean;
  busy: (value: boolean) => void;
  request: <T>(url: string, options?: RequestInit) => Promise<T>;
  saved: (inquiry: Inquiry) => void;
  refreshActivity: (id: string, version: number) => Promise<boolean>;
  validate: (form: HTMLFormElement, errors: Record<string, string>) => void;
  error: (error: unknown, fallback: string) => string;
}
export function setupAdminFollowUp(options: FollowUpOptions) {
  const { form } = options;
  const date = form.querySelector<HTMLInputElement>('[name="nextFollowUpAt"]')!;
  const note = form.querySelector<HTMLTextAreaElement>('[name="followUpNote"]')!;
  const message = form.querySelector<HTMLElement>('[data-admin-follow-up-message]')!;
  const state = form.querySelector<HTMLElement>('[data-admin-follow-up-state]')!;
  function render(inquiry: Inquiry): void {
    date.value = localDateTime(inquiry.nextFollowUpAt); note.value = inquiry.followUpNote;
    presentFollowUp(state, inquiry.nextFollowUpAt); message.textContent = ''; options.validate(form, {});
  }
  async function save(clear: boolean): Promise<void> {
    const inquiry = options.current(); if (!inquiry || !options.active() || options.saving()) return;
    if (!clear && date.validity.badInput) { options.validate(form, { nextFollowUpAt: 'Choose a valid local date and time.' }); return; }
    let timestamp: string | null;
    // Retain timestamp seconds/precision when the minute-granularity input is unchanged.
    try { timestamp = clear ? null : date.value === localDateTime(inquiry.nextFollowUpAt) ? inquiry.nextFollowUpAt : utcDateTime(date.value); }
    catch { options.validate(form, { nextFollowUpAt: 'Choose a valid local date and time.' }); return; }
    const result = followUpSchema.safeParse({ action: 'follow-up', nextFollowUpAt: timestamp, followUpNote: clear ? '' : note.value, updatedAt: inquiry.updatedAt });
    if (!result.success) { options.validate(form, fieldErrors(result.error)); return; }
    options.validate(form, {}); const version = options.version(); options.busy(true); form.setAttribute('aria-busy', 'true');
    message.setAttribute('role', 'status'); message.textContent = clear ? 'Clearing follow-up…' : 'Saving follow-up…';
    try {
      const { inquiry: saved } = await options.request<{ inquiry: Inquiry }>(inquiryDetailApiUrl(inquiry.id), {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(result.data),
      });
      if (!options.active() || version !== options.version()) return;
      options.saved(saved); render(saved); message.textContent = clear ? 'Follow-up cleared.' : 'Follow-up saved.';
      const refreshed = await options.refreshActivity(saved.id, version);
      if (options.active() && version === options.version() && !refreshed) message.textContent += ' Activity could not be refreshed; use Reload inquiry to try again.';
    } catch (error) {
      if (options.active() && version === options.version()) { message.setAttribute('role', 'alert'); message.textContent = options.error(error, 'Follow-up could not be saved. Your edits are still here. Please try again.'); }
    } finally {
      options.busy(false); form.removeAttribute('aria-busy');
      if (options.active() && version === options.version() && !form.closest('[hidden]')) form.querySelector<HTMLButtonElement>('button[type="submit"]')!.focus();
    }
  }
  form.addEventListener('submit', event => { event.preventDefault(); void save(false); });
  form.querySelector<HTMLButtonElement>('[data-admin-clear-follow-up]')!.addEventListener('click', () => { void save(true); });
  function clear(): void { form.reset(); state.textContent = ''; message.textContent = ''; options.validate(form, {}); }
  return { render, clear };
}
