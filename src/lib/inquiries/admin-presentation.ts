import type { InquiryStatus } from './contract';

export const INQUIRY_COLUMNS = ['Name', 'Company', 'Project type', 'Budget', 'Timeline', 'Status', 'Submitted'] as const;

export function presentInquiryStatus(element: HTMLElement, status: InquiryStatus): void {
  element.classList.add('admin-status');
  element.dataset.status = status;
  element.textContent = status[0].toUpperCase() + status.slice(1);
}

/** Adds presentation metadata to the existing, safely rendered table row. */
export function presentInquiryRow(row: HTMLTableRowElement, status: InquiryStatus, lastViewed: boolean): void {
  row.setAttribute('role', 'row');
  Array.from(row.cells).forEach((cell, index) => {
    cell.dataset.label = INQUIRY_COLUMNS[index];
    cell.setAttribute('role', 'cell');
  });

  const badge = document.createElement('span');
  presentInquiryStatus(badge, status);
  row.cells[5].replaceChildren(badge);

  if (lastViewed) {
    row.dataset.lastViewed = 'true';
    const context = document.createElement('span');
    context.className = 'admin-last-viewed';
    context.textContent = 'Last viewed';
    row.cells[0].append(context);
  }
}
