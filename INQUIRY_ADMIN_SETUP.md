# Client inquiry and admin foundation

## Phase 4: Proposals and estimates — October 9, 2026

The existing live CRM is retained. Phase 4 adds one current proposal per inquiry, a private editor and an anonymous client review link. This supersedes earlier proposal deferrals only for the scope below; earlier phase records remain historical.

**Migration 004 requires manual Neon execution before deployment.** Apply `database/migrations/004_create_proposals.sql` once on the intended Neon branch after 001–003, then deploy. Migrations 001–003 are byte-identical. This pass does not connect to Neon, apply live migrations or deploy.

### Model and pricing

- `proposals` stores UUID/inquiry IDs, millisecond timestamps, a unique proposal number, status, title/summary, authoritative integer-cent subtotal/fixed discount/tax/total, tax basis points, USD currency, optional draft validity date, public token, sent/accepted/declined timestamps and separate internal/client notes. `proposal_items` stores ordered descriptions, positive whole-number quantities and integer-cent rates, with a database-generated line total. One proposal per inquiry is enforced by `UNIQUE(inquiry_id)`; versioning remains future work.
- The server obtains `VS-YYYY-NNNN` numbers from a PostgreSQL sequence with the current UTC year. The sequence does not reset annually, may have gaps after conflicts/rollbacks, and expands beyond four digits without truncating. UUIDs and row counts are never used as displayed numbers.
- Limits: title 160 characters; summary and each notes field 4,000; at most 25 items; description 500; whole quantities 1–10,000; rate at most 100,000,000 cents; subtotal at most 1,000,000,000 cents. Negative prices, fractional quantities, forged totals, invalid dates, unknown fields and unsafe arithmetic are rejected. Draft item descriptions may be empty; Send requires complete descriptions and at least one item, plus a title, summary and valid-through date today or later.
- Fixed discount cannot exceed subtotal. Optional tax defaults to 0%; its single input supports two decimal places (0–100%, stored as 0–10,000 basis points). Tax is computed on subtotal minus discount and rounded half up to a cent using integer arithmetic. Server totals are authoritative; browser totals are a preview. No location-based tax assumptions are applied. Currency is USD only.
- Validity is inclusive through the selected UTC calendar date, explicitly labeled **Valid through (UTC)**. Sent offers with a date before today display as Expired and reject responses. Expiration is derived on reads/mutations without a scheduled job; accepted/declined decisions remain final.
- Proposals reference inquiries with `ON DELETE RESTRICT`, preserving business records if a future inquiry deletion is attempted. Items cascade only if a proposal is explicitly deleted in a future approved feature. Existing inquiries receive no proposals or fabricated history.

### Admin workflow and routing

- Inquiry detail loads a compact proposal summary only when opened: number, status, total, validity date and Create/View/Edit actions. Edit appears for Draft only; sent/final offers are read-only so the client offer cannot change after publication. Inquiry status, private notes and follow-up fields remain independent; sending/accepting never automatically moves an inquiry.
- `/admin/proposals/?proposal=<uuid>&back=<encoded-inquiry-url>` reuses AdminLayout, Nova controls and the existing Identity admin role. Back preserves List/Pipeline, filters, search and selected inquiry. Login return preserves a valid proposal ID. CDN role gates are additional to mandatory Function role verification.
- The editor supports title, summary, valid-through date, add/remove/reorder item rows, fixed discount, tax, private internal notes and client-visible notes, with live pricing and a client-safe preview. Save draft permits incomplete content. Stale edits or failed saves preserve inputs and offer Reload proposal. Unchanged saves do not add activity.
- Send proposal requires saved complete content, marks Sent, freezes editing and allocates a unique 256-bit cryptographically random token (`randomBytes(32)`, 43-character base64url). The resulting relative public link is converted to the current origin for manual Copy link. No outbound email is sent. Logout/authorization loss clears proposal data, preview and copied-link fields.
- Protected `/api/admin/proposals` supports GET by `id` or `inquiry`, POST create and PATCH save/send. Anonymous `/api/proposal?token=<token>` supports GET and confirmed POST accept/decline. Explicit production rewrites precede the general admin rewrite; local dev aliases mirror APIs and token-page rendering. BUILD_SCOPE retains the new static shell; admin/proposal utility routes remain excluded from the sitemap.

### Public document and security

- `/proposal/<token>/` is accessible without login and renders the existing Volatile Solutions logo, proposal number/date/status/validity, prepared-for name/company/email, title/summary, line items, totals and client notes. No UUIDs, internal notes, inquiry notes, activity or token fields occur in the public JSON document. Submitted copy is rendered with textContent, never interpreted as HTML.
- Accept and Decline use a native confirmation dialog before a server write. Only unexpired Sent proposals can respond. Row locking/status/date guards prevent repeated or racing responses, record the respective timestamp and log the client action atomically. Invalid and unavailable tokens share a generic unavailable response. Possession of the link authorizes review/response; this is not a signature or verified client identity.
- Same-origin mutations, strict bounded payloads, native endpoint rate limiting and no-store responses remain. Proposal pages/API responses use no-referrer/noindex controls; token links must be treated as confidential. No Identity SDK, database driver or database secret is loaded in the public proposal page.
- Admin authorization is checked before database access. Every query binds parameters. Proposal/items/activity writes use one PostgreSQL data-modifying CTE statement, an atomic transaction under the Neon HTTP query model. Fresh committed results come from that statement, avoiding a second read that could misreport a successful write as failure. Save/send guards use advancing millisecond versions. Shared database transport preserves the earlier inquiry query/runtime-secret behavior.
- Print / Save as PDF uses browser print CSS: A4, existing logo, client-safe details, repeated table headers, unbroken item rows and grouped totals, without controls/navigation. Block-flow print layout avoids overlapping totals on multi-page documents. No server PDF generator is added.

### Activity and rollout validation

- `004` adds `proposal_created`, `proposal_updated`, `proposal_sent`, `proposal_accepted` and `proposal_declined`, with a bounded proposal-number field on inquiry activity. Created/updated/sent use Admin; accepted/declined use Client. Existing system/admin event guards remain. Full proposal text and notes are not copied into activity; failed or unchanged saves add no events.
- The focused proposal/inquiry/CRM/URL suite passes 144 tests across eight files, including 34 proposal cases on isolated PostgreSQL (PGlite): sequence concurrency, arithmetic, validation, privacy/auth, transitions, expiration, rollback and existing inquiry compatibility. Astro/TypeScript checks 445 files with zero errors. A direct temporary Astro build emits ten pages without asset regeneration; all four modern Functions bundle with Netlify esbuild. All 76 data JSON files parse.
- Isolated Chrome at 320/375/430/768/1024/1440px verifies create/editor/back context, add/remove/reorder, draft/send, unsaved-input preservation, actual database failure rollback/stale rejection, read-only publication, copy link, anonymous client privacy, confirmation/cancel/accept/decline/expiry, keyboard/focus/labels/live feedback, duplicate IDs, reduced motion and no overflow. One-page and 25-item/three-page PDF renders are visually reviewed without table/total overlap.
- Existing List/Pipeline/search/combined filters/history/detail/status/notes/follow-up/global metrics/archived exclusion/refresh/logout browser checks pass. The five-step public wizard also passes validation, Back/Edit, consent, failure/retry, stable keys, double-submit protection, keyboard and client-router entrance at all six widths. Identity and public intake receipts are explicitly synthetic; private and proposal requests execute actual Functions/store SQL against in-memory PostgreSQL. No live Identity/Neon/CDN/deployment result is claimed.
- Hash checks preserve migrations 001–003, auth verification/Identity callback and login logic, all data/images/legacy assets, public wizard/Function, dependencies and global CSS. Styles are limited to proposal components/layout/page and compact admin additions; deployment/build configuration changes serve only proposal routes. Temporary browser database fixtures are removed after testing.
- After manually applying 004 and deploying, create a real proposal from the existing test inquiry, copy its link, review anonymously in an incognito window, accept and verify the recorded client event. This staged/live check remains a rollout step, not a result of local testing.

No invoices, Stripe/payments, contracts/signatures, uploads, client portal, outbound email/reminders, proposal version history, accounting exports or recurring billing are added.

## Historical Phase 3: Search, filters and follow-up operations — October 9, 2026

The user reports the complete Phase 1/2 system is live-verified. Phase 3 adds only private search, richer filters and follow-up operations. The earlier implementation records below are historical.

**Deployment prerequisite: migration 003 requires manual Neon execution before deployment.** Apply `database/migrations/003_add_follow_up_fields.sql` once to the intended branch, after the already-applied 001/002 migrations. Neither earlier migration is changed or rerun. No live Neon connection, migration or deployment occurs in this pass.

- One parameterized, fixed SQL predicate serves List rows/totals and Pipeline. Case-insensitive literal search matches name, email, company and project summary; input is trimmed, control-character checked and limited to 160 characters. SQL wildcard characters are escaped as literal search characters. No private records are fetched for browser-only search.
- Optional, combinable Status, Project type, Budget, Timeline and Follow-up filters reuse shared enum options. Sort and 25-row List pagination remain. Pipeline ignores the retained List status filter and excludes Archived; its columns count the actual filtered summaries. Detail/activity loads only when opened. List uses three queries and Pipeline two, independent of card count.
- Search, filters, sort, page and selected view live in URL queries and survive detail/Back/Forward/refresh/sign-in return. Changes reset List page to 1. Clear filters resets search and all filters/sort/page while preserving the selected view. Status is hidden in Pipeline. A labeled toolbar stacks on mobile. New filter loads clear stale results; failures do not display old records as though they match new filters.
- `003` adds nullable `next_follow_up_at` (`timestamptz(3)`) and separate `follow_up_note` (`varchar(2000)`, default empty), a partial date index, and nullable `inquiry_activity.follow_up_at`. It extends only the allowed activity types/checks needed for follow-up; the original FK/cascade/creation guards remain. Existing inquiries receive NULL/empty defaults with no schedules or fabricated history.
- Detail has a labeled local date/time input, bounded follow-up note, Save follow-up and Clear follow-up. Clear removes both schedule and follow-up note; saving a blank date can remove the schedule while keeping its note. Native invalid date inputs, impossible dates/DST gaps, malformed UTC timestamps and oversized notes are rejected. Browser-local values are converted to UTC, preserving saved seconds/milliseconds when the displayed minute is unchanged. Saving either detail form preserves unsaved drafts in the other form.
- Follow-up saves use the existing admin PATCH with strict `{action:"follow-up",nextFollowUpAt,followUpNote,updatedAt}` validation. They lock/check the same record version and atomically persist follow-up fields plus server-generated activity; status/general notes are untouched. Failure rolls back; conflicts preserve drafts and ask for Reload inquiry. Unchanged saves add no events.
- `follow_up_scheduled`, `follow_up_updated` and `follow_up_cleared` store only event/actor/resulting timestamp, never full follow-up notes. Note-only changes count as updates, including an undated note. Activity stays compact/newest first. Save events use the record's advancing millisecond update timestamp so rapid consecutive saves remain ordered. A history refresh failure never turns a confirmed write into an apparent failed save.
- Follow-up labels are derived, never persisted: No follow-up scheduled, Due today, Overdue, Upcoming. Due today is the entire local calendar day, including earlier hours today; Overdue is before its local midnight; Upcoming starts next local day. Browser-supplied UTC day boundaries make SQL filters/metrics agree with display, including 23/25-hour DST days. API callers without boundaries use the current UTC day.
- Existing New/Total/Active/Won metrics stay global and are explicitly labeled. A compact global Due today/Overdue summary queries real rows, excluding Archived. List/Pipeline counts are filter-aware. Archived inquiries retain schedules/notes/activity, remain searchable/filterable in List, and never appear in active Pipeline or actionable follow-up metrics.
- Identity/admin authorization, same-origin checks, runtime secrets, private response headers, parameter binding and public receipt-only responses remain. No emails, notifications, proposals, invoices, Stripe, uploads, tasks, calendars, portal or charts are added. Public content/assets/localization/dependencies/configuration remain untouched.

### Phase 3 validation

- All 76 data JSON files parse. The final focused inquiry/CRM/URL run passes 110 tests across seven files, including 42 real in-memory PostgreSQL cases and six local-day/DST/URL helper cases. The existing earlier-phase tests remain included. A migration upgrade test verifies preexisting inquiry values/activity remain intact with NULL/empty defaults after 003.
- Astro/TypeScript checks 430 files with zero errors. A direct temporary Astro static build passes eight routes without running asset generators; both Functions bundle successfully through Netlify's esbuild bundler. Client bundles contain no DATABASE_URL or Neon import; static admin HTML contains no private/fixture records and admin stays out of the sitemap.
- Isolated Chrome checks at 320/375/430/768/1024/1440px pass existing List/Pipeline/detail/history/movement workflows and the new search, combined filters, clear/view/back-forward context, follow-up save/update/clear/unchanged save, separate draft preservation, actual PostgreSQL failure rollback/stale rejection, local date display, archived metric exclusion, refresh and logout cleanup. Labels, live feedback, keyboard activation, duplicate IDs, hidden focus, reduced motion and page overflow were checked. No runtime errors were recorded.
- The public wizard passes all five steps, validation, Back/Edit, consent, stable-key failure/retry/success, double-submit protection, keyboard and Astro client-router CTA entrance at the same six widths. Identity and public receipt responses are explicitly synthetic; private requests execute the actual Function/store against in-memory PostgreSQL, never live Neon. Temporary fixtures are removed after testing.
- Hash comparisons preserve migrations 001/002, auth/HTTP helpers, public Function/wizard source, all data/assets/localization, layouts/routes, dependencies, configuration and global CSS. The shared InquiryField only adds search/datetime-local support for the admin controls; existing public field rendering stays the same. New styles are confined to admin components. The optional atomic audit still reports only the untouched ChecklistItem margin violation and HeroSplit advisory; no new findings.
- Migration 003 remains unapplied in Neon and must be executed manually before deployment. No live deployment, credentials, invitations, outbound messages or database changes are performed.

## Historical Phase 2: Pipeline and inquiry activity — October 9, 2026

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
