import type { InquiryActivity } from './contract';

export function renderInquiryActivity(list: HTMLOListElement, empty: HTMLElement, activity: InquiryActivity[]): void {
  const fragment = document.createDocumentFragment();
  for (const event of activity) {
    const item = document.createElement('li');
    const label = document.createElement('span'); label.className = 'activity-label ui-type-text-feature-sm';
    label.textContent = { inquiry_created: 'Created', status_changed: 'Status changed', admin_note_updated: 'Admin notes updated', follow_up_scheduled: 'Follow-up scheduled', follow_up_updated: 'Follow-up updated', follow_up_cleared: 'Follow-up cleared' }[event.type];
    item.append(label);
    if (event.type === 'status_changed' && event.fromStatus && event.toStatus) {
      const detail = document.createElement('span'); detail.className = 'ui-type-text-feature-sm';
      const title = (status: string) => status[0].toUpperCase() + status.slice(1);
      detail.textContent = `${title(event.fromStatus)} → ${title(event.toStatus)}`; item.append(detail);
    }
    if (event.type.startsWith('follow_up_') && event.followUpAt) {
      const schedule = document.createElement('time'); schedule.className = 'ui-type-text-feature-sm'; schedule.dateTime = event.followUpAt;
      schedule.textContent = 'Scheduled for ' + new Date(event.followUpAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }); item.append(schedule);
    }
    const time = document.createElement('time'); time.className = 'ui-type-text-feature-sm'; time.dateTime = event.createdAt;
    time.textContent = new Date(event.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) + (event.actor === 'system' ? ' · System' : ' · Admin');
    item.append(time); fragment.append(item);
  }
  list.replaceChildren(fragment); empty.hidden = activity.length > 0;
  empty.textContent = 'No activity recorded yet.';
}
