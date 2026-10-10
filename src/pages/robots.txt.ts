import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  const sitemapUrl = new URL('sitemap-index.xml', site).href;
  
  const robotsTxt = [
    'User-agent: *',
    'Allow: /',
    // This wildcard policy also permits OAI-SearchBot on public pages.
    // Crawling rules supplement private-page noindex headers and authentication.
    'Disallow: /admin',
    'Disallow: /proposal',
    'Disallow: /invoice',
    'Disallow: /book',
    'Disallow: /api/',
    'Disallow: /.netlify/',
    'Disallow: /dev/',
    'Disallow: /qa/',
    '',
    `Sitemap: ${sitemapUrl}`
  ].join('\n');

  return new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
};
