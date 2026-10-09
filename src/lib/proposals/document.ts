import { money, decimalValue, type PublicProposal } from './contract';
export function renderProposalDocument(root: HTMLElement, proposal: PublicProposal): void {
  const fields: Record<string, string> = {
    title: proposal.title,
    number: proposal.number,
    status: proposal.status[0].toUpperCase() + proposal.status.slice(1),
    date: new Date(proposal.date).toLocaleDateString('en-US', { dateStyle: 'long', timeZone: 'UTC' }),
    validUntil: proposal.validUntil
      ? new Date(proposal.validUntil + 'T00:00:00Z').toLocaleDateString('en-US', {
          dateStyle: 'long',
          timeZone: 'UTC',
        })
      : 'Not set',
    summary: proposal.summary || 'Project summary not yet added.',
    clientNotes: proposal.clientNotes,
    subtotalCents: money(proposal.subtotalCents),
    discountCents: proposal.discountCents ? '−' + money(proposal.discountCents) : money(0),
    taxCents: money(proposal.taxCents),
    totalCents: money(proposal.totalCents),
  };
  for (const [key, value] of Object.entries(fields))
    root.querySelector<HTMLElement>(`[data-proposal-value="${key}"]`)!.textContent = value;
  root.querySelector<HTMLElement>('[data-proposal-value="status"]')!.dataset.status = proposal.status;
  for (const [key, value] of Object.entries(proposal.preparedFor)) {
    const node = root.querySelector<HTMLElement>(`[data-proposal-client="${key}"]`)!;
    node.textContent = value;
    node.hidden = !value;
  }
  root.querySelector<HTMLElement>('[data-proposal-notes]')!.hidden = !proposal.clientNotes;
  root.querySelectorAll<HTMLElement>('[data-proposal-tax-rate]').forEach((node, index) => {
    node.hidden = index !== 2;
    node.textContent = ' (' + decimalValue(proposal.taxRateBasisPoints) + '%)';
  });
  const rows = document.createDocumentFragment();
  for (const item of proposal.items) {
    const row = document.createElement('tr');
    [
      item.description || 'Untitled draft item',
      String(item.quantity),
      money(item.unitPriceCents),
      money(item.lineTotalCents),
    ].forEach((value, index) => {
      const cell = document.createElement('td');
      cell.textContent = value;
      cell.dataset.label = ['Description', 'Quantity', 'Rate', 'Amount'][index];
      row.append(cell);
    });
    rows.append(row);
  }
  root.querySelector('[data-proposal-items]')!.replaceChildren(rows);
  root.hidden = false;
}
