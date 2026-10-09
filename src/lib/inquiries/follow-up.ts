export type FollowUpState = 'none' | 'today' | 'overdue' | 'upcoming';

/** Calendar days in the browser's timezone, including 23/25-hour DST days. */
export function localDayBounds(now = new Date()): { dayStart: string; dayEnd: string } {
  const start = new Date(now); start.setHours(0, 0, 0, 0);
  const end = new Date(start); end.setDate(end.getDate() + 1);
  return { dayStart: start.toISOString(), dayEnd: end.toISOString() };
}
export function followUpState(value: string | null, now = new Date()): FollowUpState {
  if (!value) return 'none';
  const { dayStart, dayEnd } = localDayBounds(now); const time = new Date(value).getTime();
  return time < Date.parse(dayStart) ? 'overdue' : time < Date.parse(dayEnd) ? 'today' : 'upcoming';
}
export function localDateTime(value: string | null): string {
  if (!value) return '';
  const date = new Date(value); const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
/** Reject impossible local dates and DST gaps instead of silently normalizing them. */
export function utcDateTime(value: string): string | null {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) throw new Error('Choose a valid local date and time.');
  const date = new Date(value);
  if (!Number.isFinite(date.getTime()) || localDateTime(date.toISOString()) !== value) throw new Error('Choose a valid local date and time.');
  return date.toISOString();
}
export function presentFollowUp(element: HTMLElement, value: string | null, now = new Date()): void {
  const state = followUpState(value, now);
  element.classList.add('admin-follow-up'); element.dataset.followUpState = state;
  const labels = { none: 'No follow-up scheduled', today: 'Due today', overdue: 'Overdue', upcoming: 'Upcoming' };
  element.textContent = labels[state];
  if (value) {
    const time = document.createElement('time'); time.dateTime = value;
    time.textContent = new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
    element.append(document.createElement('br'), time);
  }
}
