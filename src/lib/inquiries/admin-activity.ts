import type { InquiryActivity } from './contract';

export function renderInquiryActivity(list: HTMLOListElement, empty: HTMLElement, activity: InquiryActivity[]): void {
  const fragment = document.createDocumentFragment();
  for (const event of activity) {
    const item = document.createElement('li');
    const label = document.createElement('span'); label.className = 'activity-label ui-type-text-feature-sm';
    label.textContent = { inquiry_created: 'Created', status_changed: 'Status changed', admin_note_updated: 'Admin notes updated' }[event.type];
    item.append(label);
    if (event.type === 'status_changed' && event.fromStatus && event.toStatus) {
      const detail = document.createElement('span'); detail.className = 'ui-type-text-feature-sm';
      const title = (status: string) => status[0].toUpperCase() + status.slice(1);
      detail.textContent = `${title(event.fromStatus)} → ${title(event.toStatus)}`; item.append(detail);
    }
    const time = document.createElement('time'); time.className = 'ui-type-text-feature-sm'; time.dateTime = event.createdAt;
    time.textContent = new Date(event.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) + (event.actor === 'system' ? ' · System' : ' · Admin');
    item.append(time); fragment.append(item);
  }
  list.replaceChildren(fragment); empty.hidden = activity.length > 0;
  empty.textContent = 'No activity recorded yet.';
}
