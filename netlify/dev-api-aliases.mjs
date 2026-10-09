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
        else if (url.pathname === '/api/admin/bookings') url.pathname = '/.netlify/functions/admin-bookings';
        else if (url.pathname === '/api/booking') url.pathname = '/.netlify/functions/booking';
        else if (/^\/book\/[A-Za-z0-9_-]{43}\/?$/.test(url.pathname)) url.pathname = '/book/';
        else if (url.pathname === '/api/admin/messages') url.pathname = '/.netlify/functions/admin-messages';
        else if (url.pathname === '/api/admin/proposals') url.pathname = '/.netlify/functions/admin-proposals';
        else if (url.pathname === '/api/proposal') url.pathname = '/.netlify/functions/proposal';
        else if (/^\/proposal\/[A-Za-z0-9_-]{43}\/?$/.test(url.pathname)) url.pathname = '/proposal/';
        else { next(); return; }
        request.url = url.pathname + url.search;
        next();
      });
    },
  };
}
