import { describe, expect, it } from 'vitest';
import { adminBrowseUrl, adminInquiryUrl, adminViewFromUrl, inquiryDetailApiUrl } from './admin-routes';

describe('admin view and detail URL contracts', () => {
  it.each(['/admin/', '/admin/?view=list', '/admin/?inquiry=record', '/admin/?view=unknown'])('keeps %s in List', path => {
    expect(adminViewFromUrl(new URL(path, 'https://example.test'))).toBe('list');
  });
  it('preserves Pipeline context for browsing and detail', () => {
    expect(adminBrowseUrl('pipeline')).toBe('/admin/?view=pipeline');
    expect(adminInquiryUrl('record', 'pipeline')).toBe('/admin/?view=pipeline&inquiry=record');
    expect(adminViewFromUrl(new URL(adminInquiryUrl('record', 'pipeline'), 'https://example.test'))).toBe('pipeline');
  });
  it('retains existing List deep links and query-based detail API requests', () => {
    expect(adminInquiryUrl('record', 'list')).toBe('/admin/?inquiry=record');
    expect(adminBrowseUrl('list')).toBe('/admin/?view=list');
    expect(inquiryDetailApiUrl('record')).toBe('/api/admin/inquiries?id=record');
  });
  it('encodes inquiry identifiers instead of changing query or path structure', () => {
    expect(adminInquiryUrl('a&view=list', 'pipeline')).toBe('/admin/?view=pipeline&inquiry=a%26view%3Dlist');
  });
});
