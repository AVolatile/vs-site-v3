import { BROWSE_KEYS, browseDefaults, type AdminBrowse } from './admin-browse';
/** Keep the ID in the incoming request, independent of rewrite path captures. */
export const inquiryDetailApiUrl = (id: string): string => '/api/admin/inquiries?id=' + encodeURIComponent(id);
export type AdminView = 'list' | 'pipeline';
export const adminViewFromUrl = (url: URL): AdminView => url.searchParams.get('view') === 'pipeline' ? 'pipeline' : 'list';
function query(view: AdminView, state?: AdminBrowse): URLSearchParams {
  const result = new URLSearchParams({ view });
  if (state) { const defaults = browseDefaults(); BROWSE_KEYS.forEach(key => { if (state[key] !== defaults[key]) result.set(key, String(state[key])); }); }
  return result;
}
export const adminBrowseUrl = (view: AdminView, state?: AdminBrowse): string => '/admin/?' + query(view, state);
export const adminInquiryUrl = (id: string, view: AdminView, state?: AdminBrowse): string => {
  const params = query(view, state); if (view === 'list') params.delete('view'); params.set('inquiry', id);
  return '/admin/?' + params;
};
