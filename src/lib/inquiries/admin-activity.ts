import type { InquiryActivity } from './contract';

export function renderInquiryActivity(list: HTMLOListElement, empty: HTMLElement, activity: InquiryActivity[]): void {
  const fragment = document.createDocumentFragment();
  for (const event of activity) {
    const item = document.createElement('li');
    const label = document.createElement('span'); label.className = 'activity-label ui-type-text-feature-sm';
    label.textContent = { inquiry_created: 'Created', status_changed: 'Status changed', admin_note_updated: 'Admin notes updated', follow_up_scheduled: 'Follow-up scheduled', follow_up_updated: 'Follow-up updated', follow_up_cleared: 'Follow-up cleared', proposal_created: 'Proposal created', proposal_updated: 'Proposal updated', proposal_sent: 'Proposal sent', proposal_accepted: 'Proposal accepted', proposal_declined: 'Proposal declined', email_sent: 'Email sent', email_failed: 'Email failed', booking_link_created: 'Booking link created', booking_link_regenerated: 'Booking link regenerated', booking_scheduled: 'Call scheduled', booking_cancelled: 'Call cancelled', booking_completed: 'Call completed', booking_rescheduled: 'Call rescheduled',invoice_created:'Invoice created',invoice_updated:'Invoice updated',invoice_sent:'Invoice sent',invoice_viewed:'Invoice viewed',invoice_paid:'Invoice marked paid manually',invoice_voided:'Invoice voided' }[event.type];
    if(event.invoiceNumber) label.textContent+=' · '+event.invoiceNumber;
    if (event.proposalNumber) label.textContent += ' · ' + event.proposalNumber;
    item.append(label);
    if (event.type === 'email_sent' || event.type === 'email_failed') {
      const subject = document.createElement('span'); subject.className = 'ui-type-text-feature-sm'; subject.textContent = event.note; item.append(subject);
    }
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
    time.textContent = new Date(event.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) + (event.actor === 'system' ? ' · System' : event.actor === 'client' ? ' · Client' : ' · Admin');
    item.append(time); fragment.append(item);
  }
  list.replaceChildren(fragment); empty.hidden = activity.length > 0;
  empty.textContent = 'No activity recorded yet.';
}
