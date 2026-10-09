// Match the explicit production API rewrites without emulating CDN-only role gates locally.
/** @returns {import('vite').Plugin} */
export default function inquiryApiAliases() {
  return {
    name: 'inquiry-api-aliases',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((request, _response, next) => {
        const url = new URL(request.url || '/', 'http://localhost');
        if (url.pathname === '/api/inquiries') url.pathname = '/.netlify/functions/inquiries';
        else if (url.pathname === '/api/admin/inquiries') url.pathname = '/.netlify/functions/admin-inquiries';
        else if (url.pathname.startsWith('/api/admin/inquiries/')) {
          url.searchParams.set('id', url.pathname.slice('/api/admin/inquiries/'.length));
          url.pathname = '/.netlify/functions/admin-inquiries';
        }
        else { next(); return; }
        request.url = url.pathname + url.search;
        next();
      });
    },
  };
}
