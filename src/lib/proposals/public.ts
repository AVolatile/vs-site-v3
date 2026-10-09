import { tokenSchema, type PublicProposal } from './contract';
import { renderProposalDocument } from './document';
export async function setupPublicProposal(): Promise<void> {
  const root = document.querySelector<HTMLElement>('[data-public-proposal]');
  if (!root) return;
  const element = <T extends HTMLElement = HTMLElement>(selector: string) => root.querySelector<T>(selector)!;
  const message = element('[data-public-message]'),
    documentView = element('[data-proposal-document]'),
    actions = element('[data-public-actions]');
  const dialog = element<HTMLDialogElement>('[data-proposal-confirm]');
  let proposal: PublicProposal | undefined,
    action: 'accept' | 'decline' = 'accept',
    busy = false;
  const token = tokenSchema.safeParse(location.pathname.split('/').filter(Boolean)[1]);
  if (!token.success) {
    message.textContent = 'This proposal is unavailable.';
    message.setAttribute('role', 'alert');
    return;
  }
  const url = '/api/proposal?token=' + encodeURIComponent(token.data);
  function render(saved: PublicProposal) {
    proposal = saved;
    renderProposalDocument(documentView, saved);
    actions.hidden = saved.status !== 'sent';
    element('[data-public-print]').hidden = false;
  }
  async function request(options: RequestInit = {}): Promise<PublicProposal> {
    const response = await fetch(url, {
      ...options,
      credentials: 'omit',
      cache: 'no-store',
      signal: AbortSignal.timeout(20000),
    });
    const body = await response.json();
    if (!response.ok)
      throw new Error(typeof body.error === 'string' ? body.error : 'This proposal could not be loaded.');
    return body.proposal;
  }
  try {
    render(await request());
    message.textContent =
      proposal!.status === 'sent'
        ? 'Review the proposal below.'
        : 'Proposal status: ' + proposal!.status + '.';
  } catch (error) {
    message.textContent =
      error instanceof Error
        ? error.message
        : 'This proposal could not be loaded. Please refresh and try again.';
    message.setAttribute('role', 'alert');
    return;
  }
  root.querySelectorAll<HTMLButtonElement>('[data-proposal-response]').forEach((button) =>
    button.addEventListener('click', () => {
      if (busy || proposal?.status !== 'sent') return;
      action = button.dataset.proposalResponse as typeof action;
      element('[data-confirm-heading]').textContent =
        action === 'accept' ? 'Accept this proposal?' : 'Decline this proposal?';
      element('[data-confirm-copy]').textContent =
        'Confirm your response to ' + proposal.number + '. This response will be recorded.';
      dialog.showModal();
    }),
  );
  element('[data-confirm-response]').addEventListener('click', async () => {
    if (busy || proposal?.status !== 'sent') return;
    busy = true;
    dialog.close();
    root.querySelectorAll<HTMLButtonElement>('button').forEach((button) => {
      button.disabled = true;
    });
    message.setAttribute('role', 'status');
    message.textContent = 'Recording your response…';
    try {
      render(
        await request({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, confirmed: true }),
        }),
      );
      message.textContent =
        action === 'accept'
          ? 'Proposal accepted. Thank you.'
          : 'Proposal declined. Your response has been recorded.';
    } catch (error) {
      message.textContent =
        error instanceof Error
          ? error.message
          : 'Your response could not be confirmed. Please refresh the proposal before trying again.';
      message.setAttribute('role', 'alert');
      try {
        render(await request());
      } catch {}
    } finally {
      busy = false;
      root.querySelectorAll<HTMLButtonElement>('button').forEach((button) => {
        button.disabled = false;
      });
      message.tabIndex = -1;
      message.focus();
    }
  });
  element('[data-proposal-print]').addEventListener('click', () => window.print());
}
