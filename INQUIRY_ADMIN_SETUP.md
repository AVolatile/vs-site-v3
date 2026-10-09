# Client inquiry and admin foundation

## Phase 2: Pipeline and inquiry activity — October 9, 2026

The user reports Phase 1 is verified on live staging. Phase 2 adds only Pipeline and persistent inquiry activity; the Phase 1 record below remains historical.

**Deployment prerequisite:** manually apply `database/migrations/002_create_inquiry_activity.sql` once to the intended Neon staging/development branch, then redeploy Phase 2. Do not rerun the already-applied `001` migration. This pass does not connect to Neon or apply either migration there. Tests execute both migrations only in an isolated in-memory PostgreSQL instance using the already-installed PGlite package.

- List remains the default with existing filters, sorting, 25-row pages and detail view. Switching uses `/admin/?view=list` and `/admin/?view=pipeline`; `/admin/?inquiry=<uuid>` remains valid. Pipeline detail retains `view=pipeline`, including Back/Forward and sign-in return context.
- Protected `GET /api/admin/inquiries?view=pipeline` returns all non-archived summaries and the existing real metrics. It makes two queries independent of card count. Cards show name/company/project type/budget/timeline/submitted date and carry an `updatedAt` version; no notes, full detail or activity are fetched for each card. Seven columns cover New through Lost. Mobile stacks sections; tablet/desktop use a contained horizontally scrollable board.
- Drag/drop and each card's labeled Move to select/Move button use the existing protected `PATCH /api/admin/inquiries?id=<uuid>`. A strict `{action:"move",status,updatedAt}` body preserves notes on the server. Normal saves still require the unchanged `{status,adminNotes,updatedAt}` validation. Both use the same locked, timestamp-guarded SQL update and activity logic. Cards change only after confirmed persistence; failures preserve saved state and conflicts ask for a board refresh.
- `002` creates `inquiry_activity` with UUID/FK IDs, millisecond timestamps, three event types, optional from/to status, a short note field and system/admin actor. Full note bodies are never copied into activity. An index supports newest-first history; a partial unique index permits only one creation event. `ON DELETE CASCADE` deliberately removes activity if a future explicit inquiry deletion is approved. Archiving retains both records. No delete UI or historical backfill is included.
- A new inquiry and `inquiry_created`/system event commit in one statement. Identical retries reuse the receipt without adding events; changed content with a reused key still conflicts. Pre-activity records receive no fabricated event on retry.
- The shared update locks previous values, checks `updatedAt`, saves, and inserts `status_changed` and/or `admin_note_updated` only for actual changes. Event insertion failure rolls the inquiry change back. Updated timestamps advance at least one millisecond to retain stale-edit protection for fast saves.
- Detail GET returns `{inquiry,activity}`. Activity loads only with an opened detail and refreshes after its confirmed save. A history read failure never turns a confirmed write into an apparent failed save. Old records show "No activity recorded yet." Reads, filtering, login and refresh add no events. Logout/authorization failure clears board and activity data from the browser.
- Identity/admin checks, same-origin mutations, parameterized SQL, private response headers, public receipt-only responses and runtime secrets remain. No email automation, proposals, uploads, reminders, tasks, portal or charts are added.

### Phase 2 validation and deployment boundary

- All 76 data JSON files parse. `npm run check:types` checks 426 files with zero errors. A direct Astro static build into a temporary directory emits eight routes without running favicon/font/image generators. Both modern Functions bundle successfully with Netlify's esbuild bundler.
- The focused inquiry/auth/store/detail/CRM/URL run passes 77 tests, including 15 real in-memory PostgreSQL workflow tests and seven view/deep-link cases. The full repository run reports 925 passed / 10 failed: seven failures concern untouched LinkedIn expectations, retired Polish routes and a disabled development-thumbnail route; three QA-runner cases encounter sandbox `tsx` IPC restrictions. These unrelated failures are not changed in this pass.
- Chrome checks at 320/375/430/768/1024/1440px pass List filtering/sorting, Pipeline counts, detail navigation, Back/Forward, Move and native drag event handlers, archived retention, actual PostgreSQL rollback/stale conflicts, note preservation, history persistence after refresh/logout/login, and authorization-loss cleanup. Labels, duplicate IDs, hidden focus, reduced-motion rendering and page overflow were checked. Identity responses are synthetic; private requests execute the actual Function/store against isolated in-memory PostgreSQL, never Neon.
- The unchanged public wizard passes all five steps, validation, Back/Edit, consent, failure/retry, stable submission keys, double-submit protection, keyboard and public CTA navigation at the same six widths with synthetic receipt responses. No browser runtime errors were recorded. Hash comparisons preserve migration 001, auth helpers, Identity callbacks, public UI/data, assets, dependencies and deployment configuration. Temporary browser fixtures are removed.
- This is local validation only. Migration 002 still requires manual execution on the intended Neon branch before Phase 2 deployment; no live database or deployment was modified.

## Historical Phase 1 implementation

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
