import { afterEach, describe, expect, it, vi } from 'vitest';
import { followUpState, localDayBounds, localDateTime, utcDateTime } from './follow-up';
import { browseFromUrl, browseSchema, browseDefaults, browseApiQuery } from './admin-browse';
import { adminBrowseUrl, adminInquiryUrl } from './admin-routes';
afterEach(() => vi.unstubAllEnvs());
describe('local follow-up dates and browse state', () => {
  it('classifies calendar-day boundaries independently of UTC and past hours today', () => {
    vi.stubEnv('TZ', 'America/New_York'); const now = new Date('2026-10-09T20:00:00Z');
    expect(localDayBounds(now)).toEqual({ dayStart: '2026-10-09T04:00:00.000Z', dayEnd: '2026-10-10T04:00:00.000Z' });
    expect(followUpState(null, now)).toBe('none');
    expect(followUpState('2026-10-09T03:59:59.999Z', now)).toBe('overdue');
    expect(followUpState('2026-10-09T04:00:00Z', now)).toBe('today');
    expect(followUpState('2026-10-10T03:59:59.999Z', now)).toBe('today');
    expect(followUpState('2026-10-10T04:00:00Z', now)).toBe('upcoming');
  });
  it.each([['2026-03-08T12:00:00Z',23],['2026-11-01T12:00:00Z',25]])('respects DST day length at %s', (date,hours) => {
    vi.stubEnv('TZ','America/New_York'); const bounds=localDayBounds(new Date(date));
    expect(Date.parse(bounds.dayEnd)-Date.parse(bounds.dayStart)).toBe(hours*3600000);
    expect(browseSchema.safeParse(bounds).success).toBe(true);
  });
  it('round-trips local date/time and rejects invalid dates and DST gaps', () => {
    vi.stubEnv('TZ','America/New_York');
    expect(localDateTime('2026-10-12T14:00:00.000Z')).toBe('2026-10-12T10:00');
    expect(utcDateTime('2026-10-12T10:00')).toBe('2026-10-12T14:00:00.000Z');
    expect(utcDateTime('')).toBeNull(); expect(() => utcDateTime('2026-02-30T10:00')).toThrow(); expect(() => utcDateTime('2026-03-08T02:30')).toThrow();
  });
  it('preserves every browse field through List/Pipeline/detail/back URL context', () => {
    const state=browseSchema.parse({search:'  Some & Company  ',status:'qualified',projectType:'website',budget:'2500-5000',timeline:'1-3-months',followUp:'today',sort:'oldest',page:2});
    for(const view of ['list','pipeline'] as const) {
      expect(browseFromUrl(new URL(adminBrowseUrl(view,state),'https://example.test'))).toEqual(state);
      const detail=new URL(adminInquiryUrl('record',view,state),'https://example.test');
      expect(detail.searchParams.get('inquiry')).toBe('record'); expect(browseFromUrl(detail)).toEqual(state);
    }
    expect(adminBrowseUrl('pipeline',browseDefaults())).toBe('/admin/?view=pipeline');
  });
  it('keeps local clock bounds out of user-facing URLs but sends them to the API', () => {
    const state=browseDefaults();const query=browseApiQuery(state);
    expect(query.get('dayStart')).toBeTruthy();expect(query.get('dayEnd')).toBeTruthy();
    expect(adminBrowseUrl('list',state)).not.toContain('dayStart');
  });
});
