// Single source of truth for site / client project configuration.
// Edit THIS file when changing domain.
// Environment domain used during build.
export const SITE_URL = 'https://volatile-solutions.net/';
export const ACTIVE_TEMPLATE = 'nova';

// Volatile Solutions is English-only; shared pages use the same locale.
export const SITE_LOCALE = 'en';

// BUILD_SCOPE — what goes into build (dist/) and what stays dev-only.
// Dev has everything (for prototyping), build is clean per project scope.
// Example: pages: ['/', '/cookies'] keeps the homepage, cookies page and 404.
export const BUILD_SCOPE = {
  // Allowlist of paths to keep in build. Empty [] = all.
  // Prefix entries also include their child pages.
  // 404 is always kept regardless of this list.
  pages: ['/', '/portfolio', '/start-a-project', '/proposal', '/admin', '/cookies', '/polityka-prywatnosci'],
  // Denylist — always removed from dist/ (dev-only, prototypes, demo).
  // Entry matches by first path segment. Dev and QA stay out of production build.
  forceRemove: ['starwind-demo', 'layout-test', 'roofing', 'dev', 'qa'],
  // Whether to clean unused media (images, videos, fonts) from dist/.
  images: true,
};
