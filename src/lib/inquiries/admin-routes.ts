/** Keep the ID in the incoming request, independent of rewrite path captures. */
export const inquiryDetailApiUrl = (id: string): string => '/api/admin/inquiries?id=' + encodeURIComponent(id);
