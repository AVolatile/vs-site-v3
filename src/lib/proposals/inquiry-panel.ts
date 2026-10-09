import { proposalAdminUrl, type AdminProposal } from './contract';
import { money } from './contract';
interface Options {
  panel: HTMLElement;
  current: () => { id: string; name: string; company: string } | null;
  active: () => boolean;
  version: () => number;
  announce: (text: string, error?: boolean) => void;
  request: <T>(url: string, options?: RequestInit) => Promise<T>;
}
export function setupInquiryProposal(options: Options) {
  const { panel } = options;
  const message = panel.querySelector<HTMLElement>('[data-inquiry-proposal-message]')!;
  const create = panel.querySelector<HTMLButtonElement>('[data-inquiry-proposal-create]')!;
  const summary = panel.querySelector<HTMLElement>('[data-inquiry-proposal-summary]')!;
  let loadVersion = 0,
    busy = false;
  let abort: AbortController | undefined;
  async function request(url: string, init: RequestInit = {}): Promise<AdminProposal | null> {
    const payload = await options.request<{ proposal: AdminProposal | null }>(url, {
      ...init,
      signal: abort!.signal,
    });
    return payload.proposal;
  }
  function render(proposal: AdminProposal | null) {
    summary.hidden = !proposal;
    create.hidden = !!proposal;
    message.textContent = proposal ? '' : 'No proposal yet.';
    if (!proposal) return;
    panel.querySelector<HTMLElement>('[data-inquiry-proposal-number]')!.textContent = proposal.number;
    panel.querySelector<HTMLElement>('[data-inquiry-proposal-status]')!.textContent =
      proposal.status[0].toUpperCase() + proposal.status.slice(1);
    summary.dataset.proposalStatus = proposal.status;
    panel.querySelector<HTMLElement>('[data-inquiry-proposal-total]')!.textContent = money(
      proposal.totalCents,
    );
    panel.querySelector<HTMLElement>('[data-inquiry-proposal-valid]')!.textContent = proposal.validUntil
      ? 'Valid through ' + proposal.validUntil + ' (UTC)'
      : 'Validity not set';
    panel.querySelectorAll<HTMLAnchorElement>('[data-inquiry-proposal-open]').forEach((link) => {
      link.href = proposalAdminUrl(proposal.id, location.pathname + location.search);
      link.hidden = link.dataset.inquiryProposalOpen === 'edit' && proposal.status !== 'draft';
    });
  }
  async function load() {
    clear();
    const inquiry = options.current();
    if (!inquiry || !options.active()) return;
    const version = ++loadVersion;
    abort = new AbortController();
    panel.hidden = false;
    panel.setAttribute('aria-busy', 'true');
    message.textContent = 'Loading proposal…';
    create.hidden = true;
    try {
      const proposal = await request('/api/admin/proposals?inquiry=' + encodeURIComponent(inquiry.id));
      if (version === loadVersion && options.active()) render(proposal);
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'status' in error &&
        [401, 403].includes(Number(error.status))
      )
        options.announce('Sign in again to verify your admin access.', true);
      if (version === loadVersion && !abort.signal.aborted) {
        message.textContent = 'Proposal could not be loaded. Use Reload inquiry to try again.';
        message.setAttribute('role', 'alert');
      }
    } finally {
      if (version === loadVersion) panel.removeAttribute('aria-busy');
    }
  }
  create.addEventListener('click', async () => {
    const inquiry = options.current();
    if (!inquiry || busy || !options.active()) return;
    const version = loadVersion;
    busy = true;
    create.disabled = true;
    message.textContent = 'Creating proposal…';
    try {
      const proposal = await request('/api/admin/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inquiryId: inquiry.id,
          title: 'Proposal for ' + (inquiry.company || inquiry.name).slice(0, 145),
        }),
      });
      if (version === loadVersion && options.active() && proposal)
        location.assign(proposalAdminUrl(proposal.id, location.pathname + location.search));
    } catch {
      if (version === loadVersion && !abort!.signal.aborted) {
        message.textContent = 'Proposal creation could not be confirmed. Reload the inquiry before retrying.';
        message.setAttribute('role', 'alert');
      }
    } finally {
      busy = false;
      create.disabled = false;
    }
  });
  function clear() {
    loadVersion++;
    abort?.abort();
    panel.hidden = true;
    panel.removeAttribute('aria-busy');
    summary.hidden = true;
    create.hidden = true;
    message.textContent = '';
    message.setAttribute('role', 'status');
    panel
      .querySelectorAll<HTMLElement>(
        '[data-inquiry-proposal-number],[data-inquiry-proposal-status],[data-inquiry-proposal-total],[data-inquiry-proposal-valid]',
      )
      .forEach((node) => {
        node.textContent = '';
      });
    panel.querySelectorAll<HTMLAnchorElement>('[data-inquiry-proposal-open]').forEach((link) => {
      link.href = '/admin/';
    });
  }
  return { load, clear };
}
