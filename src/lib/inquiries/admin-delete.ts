import { confirmBookingAction } from '@/lib/bookings/confirmation';
import { inquiryDetailApiUrl } from './admin-routes';
import type { Inquiry } from './contract';

interface DeleteOptions {
  button: HTMLButtonElement;
  message: HTMLElement;
  current: () => Inquiry | null;
  active: () => boolean;
  version: () => number;
  saving: () => boolean;
  busy: (value: boolean) => void;
  request: <T>(url: string, options?: RequestInit) => Promise<T>;
  deleted: () => Promise<void>;
  announce: (message: string, error?: boolean) => void;
  error: (error: unknown, fallback: string) => string;
}

export function setupAdminDelete(options: DeleteOptions) {
  let pending = false;
  let confirming = false;
  options.button.addEventListener('click', async () => {
    const inquiry = options.current();
    if (pending || options.saving() || !options.active() || !inquiry) return;
    pending = true;
    confirming = true;
    const version = options.version();
    const accepted = await confirmBookingAction({
      title: 'Delete this request?',
      message: 'This request and its related records will be permanently removed and cannot be restored.',
      action: 'Delete',
      cancelLabel: 'Cancel',
    });
    confirming = false;
    if (!accepted || !options.active() || version !== options.version() || options.current()?.id !== inquiry.id) {
      pending = false;
      return;
    }
    options.busy(true);
    options.button.setAttribute('aria-busy', 'true');
    options.message.setAttribute('role', 'status');
    options.message.textContent = 'Deleting request…';
    try {
      const response = await options.request<{ deleted: boolean }>(inquiryDetailApiUrl(inquiry.id), {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updatedAt: inquiry.updatedAt }),
      });
      if (!response.deleted) throw new Error('Deletion was not confirmed.');
      if (options.active() && version === options.version()) await options.deleted();
    } catch (error) {
      if (!options.active() && typeof error === 'object' && error !== null && 'status' in error && [401,403].includes(Number(error.status))) {
        options.announce(options.error(error, 'Sign in again to continue.'), true);
      }
      if (options.active() && version === options.version()) {
        options.message.setAttribute('role', 'alert');
        options.message.textContent = options.error(error, 'Deletion could not be confirmed. Reload this request before trying again.');
      }
    } finally {
      pending = false;
      options.busy(false);
      options.button.removeAttribute('aria-busy');
      if (options.active() && version === options.version() && !options.button.closest('[hidden]')) options.button.focus();
    }
  });
  return {
    clear() {
      options.button.hidden = true;
      if (confirming) document.querySelector<HTMLDialogElement>('[data-booking-action-dialog]')?.close();
    },
  };
}
