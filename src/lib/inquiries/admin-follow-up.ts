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
  const date = form.querySelector<HTMLInputElement>('[name="nextFollowUpDate"]')!;
  const time = form.querySelector<HTMLInputElement>('[name="nextFollowUpTime"]')!;
  const note = form.querySelector<HTMLTextAreaElement>('[name="followUpNote"]')!;
  const message = form.querySelector<HTMLElement>('[data-admin-follow-up-message]')!;
  const state = form.querySelector<HTMLElement>('[data-admin-follow-up-state]')!;
  function render(inquiry: Inquiry): void {
    const [localDate = '', localTime = ''] = localDateTime(inquiry.nextFollowUpAt).split('T');
    date.value = localDate; time.value = localTime; note.value = inquiry.followUpNote;
    presentFollowUp(state, inquiry.nextFollowUpAt); message.textContent = ''; options.validate(form, {});
  }
  async function save(clear: boolean): Promise<void> {
    const inquiry = options.current(); if (!inquiry || !options.active() || options.saving()) return;
    const errors: Record<string, string> = {};
    if (!clear) {
      if (date.validity.badInput) errors.nextFollowUpDate = 'Choose a valid date.';
      if (time.validity.badInput || time.validity.stepMismatch) errors.nextFollowUpTime = 'Choose a valid time in hours and minutes.';
      if (date.value && !time.value) errors.nextFollowUpTime = 'Choose a time for this follow-up.';
      if (time.value && !date.value) errors.nextFollowUpDate = 'Choose a date for this follow-up.';
      if (!date.value && !time.value && inquiry.nextFollowUpAt && !Object.keys(errors).length)
        errors.nextFollowUpDate = 'Use Clear follow-up to remove the saved schedule.';
      if (Object.keys(errors).length) { options.validate(form, errors); return; }
    }
    const localValue = date.value && time.value ? `${date.value}T${time.value}` : '';
    let timestamp: string | null;
    // Retain timestamp seconds/precision when the minute-granularity input is unchanged.
    try { timestamp = clear ? null : localValue === localDateTime(inquiry.nextFollowUpAt) ? inquiry.nextFollowUpAt : utcDateTime(localValue); }
    catch { options.validate(form, { nextFollowUpDate: 'Choose a valid local date and time; this combination may not exist in your timezone.' }); return; }
    const result = followUpSchema.safeParse({ action: 'follow-up', nextFollowUpAt: timestamp, followUpNote: clear ? '' : note.value, updatedAt: inquiry.updatedAt });
    if (!result.success) {
      const fields = fieldErrors(result.error);
      if (fields.nextFollowUpAt) { fields.nextFollowUpDate = fields.nextFollowUpAt; delete fields.nextFollowUpAt; }
      options.validate(form, fields); return;
    }
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
