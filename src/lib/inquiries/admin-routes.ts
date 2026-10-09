/** Keep the ID in the incoming request, independent of rewrite path captures. */
export const inquiryDetailApiUrl = (id: string): string => '/api/admin/inquiries?id=' + encodeURIComponent(id);

export type AdminView = 'list' | 'pipeline';
export const adminViewFromUrl = (url: URL): AdminView => url.searchParams.get('view') === 'pipeline' ? 'pipeline' : 'list';
export const adminBrowseUrl = (view: AdminView): string => '/admin/?view=' + view;
export const adminInquiryUrl = (id: string, view: AdminView): string =>
  '/admin/?' + (view === 'pipeline' ? 'view=pipeline&' : '') + 'inquiry=' + encodeURIComponent(id);
