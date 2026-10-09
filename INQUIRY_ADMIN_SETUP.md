# Client inquiry and admin foundation

Implemented October 8, 2026. This is Phase 1, not a full CRM. The source implementation is ready for configuration; no live Neon migration or Identity account was created during this pass.

## Public workflow

`/start-a-project/` uses the existing Nova shell, typography, buttons, input styles, tokens and English content. Five steps collect project type; contact/business information; project summary/help/stage; budget/timeline; and a review with Edit controls and affirmative consent. Name, valid email, project type, a summary of at least ten characters, stage, budget choice, timeline choice and consent are required. Company, website and help details are optional. Budget ranges are intake choices, not prices; selected timelines are not delivery commitments.

Values remain in the form while moving Back/Edit or retrying a failed request. They are not saved to browser storage. Review renders submitted text as text, never HTML. Submit is explicit, all controls lock while sending, and success appears only after a saved receipt. After success, the form clears. Failure preserves input and offers `volatile-solutions@outlook.com` as fallback. Without JavaScript, the email fallback remains.

The header/drawer Start a Project, hero Work With Me, Services Discuss a Project, About Let's Work Together and portfolio closing Start a Project now use `/start-a-project/`. Footer Get in Touch remains email. Portfolio destinations, social profiles, phone and legal links are unchanged.

Editable options/copy: `src/data/inquiry.json`. Shared validation/types: `src/lib/inquiries/contract.ts`. Changing enum IDs also requires a future database migration; changing labels/ranges without changing IDs does not.

## Server and database

Public browser → `POST /api/inquiries` → modern Netlify Function → Neon HTTP driver.

Admin browser → Netlify Identity session → authenticated Netlify Function → Neon.

Functions live outside the static publish directory in `netlify/functions/`. Explicit Netlify rewrites map public/private APIs to the corresponding Functions before the existing general page rewrite. Both default Function URLs enforce the same validation/authentication as their API aliases.

- `netlify/lib/inquiry-store.ts` centralizes Neon access: create, list, detail and atomic status/note update. Every SQL statement is parameterized; user input is never interpolated into SQL.
- `database/migrations/001_create_inquiries.sql` creates inquiries with UUID IDs, timestamps, submitted contact/project/budget/timeline fields, status/source, private notes, consent timestamp, a unique submission key and fingerprint. It creates date/status indexes, seeds nothing, and drops/deletes nothing.
- Initial status is new. Allowed statuses: new, reviewing, contacted, qualified, proposal, won, lost, archived. Active summary counts reviewing/contacted/qualified/proposal. Summary metrics count real database rows and show zero for an empty database.
- Identical retries reuse a UUID submission key and return the same receipt. Different content with a reused key conflicts. A timestamp comparison prevents stale admin edits from overwriting another session; timestamps preserve millisecond precision from Neon. Notes and status save together, recording updated_at.
- Public responses expose only receipt/reference, never inquiry fields or admin notes. Private list/detail/patch require the server-verified admin role. Function responses set no-store and safe generic errors in code; Netlify static header rules do not protect Function responses.

## Configure Neon before enabling intake

1. Choose the intended Neon project and a known development branch first. Do not use a production branch for initial validation.
2. Inspect that branch for an existing inquiries table. The migration deliberately fails rather than replacing an existing table.
3. Apply `database/migrations/001_create_inquiries.sql` once through Neon's SQL editor on that known branch. This pass did not apply it: no DATABASE_URL was available.
4. Configure **DATABASE_URL** with the Neon PostgreSQL connection string through Netlify's environment-variable UI/integration, marking it secret and including **Functions scope** for the intended context. Variables in netlify.toml are not runtime secrets. Use a separate development/deploy-preview branch or value; do not point synthetic tests at production.
5. Redeploy after setting runtime variables. Use the actual integration-provided connection string as DATABASE_URL; this code does not assume Netlify Database or another variable name.

Never prefix this key with PUBLIC_ or VITE_, embed it in JSON/client code, put it in .env.example, or paste it into logs. For local Neon development only, set it in an ignored `.env`. `.env.example` documents the key without a real value.

## Identity setup (manual dashboard steps)

Packages: `@netlify/identity` 2.0.0, `@netlify/functions` 6.0.2 and `@neondatabase/serverless` 1.2.0. Node >=22.12 is compatible. The Vite development integration is `@netlify/vite-plugin` 3.0.1; Astro remains static and needs no SSR adapter for these separate Functions.

1. On the existing Netlify project, enable Identity in its dashboard and use HTTPS. Configuration is dashboard-only; there is no public Identity configuration API.
2. Set registration to **Invite only**, keep email/password login enabled, and invite Anthony using the intended admin email. No signup UI exists and no invitation was sent by this implementation.
3. Set that user's app-metadata role to **admin** in the Identity user settings. No user receives admin automatically, and user-editable profile metadata cannot grant access. Role changes apply on the **next login or token refresh**, not immediately; Sign in again in the UI establishes a fresh session.
4. Confirm invitation and password recovery links reach `/admin/login/`. Recognized default Identity callback hashes landing on public pages are forwarded there without loading the Identity SDK into the public wizard. `handleAuthCallback()` processes them; invited/recovering users get a password setup form. The password flow uses acceptInvite/updateUser, not a custom credential store.
5. Verify the CDN admin role gate and its unauthenticated fallback on a deploy. `/admin/login/` is a public login/callback shell containing no inquiry data; `/admin/` is the protected destination. API role verification remains mandatory independently of the CDN rule.

Admin is absent from public navigation. Its minimal layout uses Nova styles but omits public analytics, cookie UI, public navigation/footer and SEO schema; admin routes are noindex/nofollow, no-store and excluded from the sitemap. After login the user gets real metrics, a 25-row list with status filtering/newest/oldest/status sorting, detail view via `?inquiry=<uuid>`, contact mailto, status selection and private notes. Data and contact links are cleared on logout/unauthorized responses; cross-tab logout is handled by Identity events.

Identity authentication must be tested on a configured Netlify deployment. The Netlify Identity skill states that live Identity login is not supported under local development. Local validation here uses explicit test mocks for authenticated UI/SDK replies; those mocks are not in production source and do not weaken server authorization.

Official references: [Identity setup](https://docs.netlify.com/manage/security/secure-access-to-sites/identity/get-started/), [server-side Identity and roles](https://docs.netlify.com/manage/security/secure-access-to-sites/identity/use-identity-in-functions/), [Neon driver](https://github.com/neondatabase/serverless).

## Local development and validation

Use Node >=22.12 and `npm run dev`. The existing Astro server emulates Functions through the Netlify Vite plugin. A small development-only alias middleware mirrors production API rewrites; CDN role redirects are intentionally tested on a deployment instead of being applied to Astro source routes. Netlify Image CDN/header emulation is disabled so existing local images and header behavior stay unchanged. Without DATABASE_URL, a valid public submission returns 503 with no false success; admin reads/updates return 401 without a verified user.

Focused tests:

```sh
npm run check:types
npm run test -- --run netlify/inquiries.test.ts netlify/inquiry-store.test.ts src/utils/url.test.ts
```

Use a direct Astro temporary build for validation to avoid regenerating assets:

```sh
npm run astro -- build --outDir /tmp/vs-inquiry-preview
```

The existing production build remains unchanged and includes asset preparation/scoping. No broad QA subprocess or asset generator was run in this pass. Before a real release, run the deployment's normal build and validate its generated output on Netlify.

Public browser checks cover all steps, missing fields, safe review, Back/Edit, consent, disabled controls, double-submit prevention, mocked failure/success with a stable retry key, keyboard and client-router entrance, six viewport widths and anonymous admin. Authenticated admin browser checks use isolated synthetic Identity/inquiry responses. No database is seeded and no real emails are sent. Deployment-only validation still must cover real Identity cookies/invite/recovery/session refresh, CDN role gates, rate limiting and real Neon creation/read/status/notes/idempotency/concurrency behavior.

## Deferred

Kanban, email notifications/automated follow-up, file uploads, proposals, client portal, advanced analytics and CRM automation are not implemented. Existing portfolio and website content outside the five CTA destinations is preserved. No fake lead/customer records are included.

## Recorded validation result

- JSON: 76 data files parse; portfolio remains 134 records, 42 thumbnails and 48 contained identity boards. Five CTA destinations change; footer email/other portfolio links remain.
- Astro/TypeScript: 417 files, zero errors. Safe temporary static build: eight pages. Both Functions package successfully through Netlify's esbuild bundler.
- Focused tests: 42 pass (31 inquiry/auth/persistence-contract tests, 11 URL tests), including parameter binding, idempotency conflict, Date timestamp precision, stale note updates, authorization, forged headers, input/enum/consent/body/spam/origin rejection and generic failure responses. Data/import/registration/motion checks pass. Atomic audit retains the preexisting ChecklistItem margin issue and HeroSplit advisory; neither is changed.
- Browser: 320/375/430/768/1024/1440px, public five-step flow/back/edit/review/consent/keyboard, mocked submission failure/success/stable-key retry/double-submit prevention, Astro client-router entrance and anonymous admin pass. Authenticated admin uses intercepted synthetic Identity/inquiry responses: list, filtering/sort, detail, note/status failure/conflict/save, keyboard focus, mobile table containment and logout/data cleanup pass. No browser runtime errors/duplicate IDs/horizontal overflow. No mocked data is seeded or put into production source.
- Real local Function requests: invalid payload 422, valid payload without DATABASE_URL 503, private GET/PATCH without authentication 401, forged admin-role cookie 401. No real Neon connection or deployed Identity session is tested.
- Secret boundary: client output has no DATABASE_URL/Neon driver/connection string; admin HTML embeds no inquiry records; admin pages are noindex and absent from sitemap. Hash comparison preserves all existing production/legacy images. No asset regeneration or unrelated deletion.
- Remaining deployment checks: manually configured invite-only Identity/admin role, HTTPS/session cookies, invitation/recovery/token refresh, CDN gates, native rate limiting, applied migration and real Neon create/list/detail/status/notes/retry/concurrency operations.

## Exact implementation files

Modified existing files:

- `.env.example`
- `.gitignore`
- `CONTENT_MIGRATION_MAP.md`
- `README.md`
- `VOLATILE_CONTENT_SOURCE.md`
- `astro.config.mjs`
- `netlify.toml`
- `package-lock.json`
- `package.json`
- `site.config.mjs`
- `src/data/i18n/nova.json`
- `src/data/portfolio.json`
- `src/layouts/Layout.astro`

Added files:

- `INQUIRY_ADMIN_SETUP.md`
- `database/migrations/001_create_inquiries.sql`
- `netlify/dev-api-aliases.mjs`
- `netlify/functions/admin-inquiries.mts`
- `netlify/functions/inquiries.mts`
- `netlify/inquiries.test.ts`
- `netlify/inquiry-store.test.ts`
- `netlify/lib/authorize.ts`
- `netlify/lib/http.ts`
- `netlify/lib/inquiry-store.ts`
- `src/components/admin/InquiryAdmin.astro`
- `src/components/inquiry/InquiryField.astro`
- `src/components/inquiry/InquiryWizard.astro`
- `src/data/inquiry.json`
- `src/layouts/AdminLayout.astro`
- `src/lib/inquiries/admin.ts`
- `src/lib/inquiries/contract.ts`
- `src/lib/inquiries/wizard.ts`
- `src/pages/admin/index.astro`
- `src/pages/admin/login.astro`
- `src/pages/start-a-project.astro`
