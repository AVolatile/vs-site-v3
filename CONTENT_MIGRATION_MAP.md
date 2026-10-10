# Content Migration Map — Nova → Volatile Solutions / Anthony Volatile

## Approved final pre-launch cleanup — October 10, 2026

The user authorizes removal of false public legal/business facts, accurate Organization/WebSite schema, empty English hero stats, legacy redirects, factual Privacy/Cookie policies and llms.txt, and configuration-aware public Zoom availability. Shared address/postal/city/hours/NIP/KRS/REGON values remain empty until real facts are approved; no office location, coordinates, hours, registration status or performance numbers are invented. Existing assets remain unchanged; schema image is /volatile-solutions-og.png and logo is /assets/images/t001-nova/t001-nova-navbar-logo.png.

Layout canonical, social and schema URLs share the existing PUBLIC_SITE_URL build override. Runtime secure document/email/booking URLs continue using SITE_URL and optional EMAIL_PUBLIC_URL assets. Public Zoom is hidden/disabled without all four provider configuration values; Phone stays available and a stale new Zoom request is rejected before persistence. Booking timing and existing provider architecture are preserved. Indexing remains false; production-only enabling is a separate explicit launch step.

Permanent legacy mappings: /about → /#zespol; /contact → /start-a-project/; /graphic-design and /packages → /#services; /privacy → /polityka-prywatnosci/; /terms → /start-a-project/ for contact, because no active Terms page exists. /pl redirects remain unchanged. Full manual environment, email DNS and domain-cutover gates are recorded in [INQUIRY_ADMIN_SETUP.md](INQUIRY_ADMIN_SETUP.md#final-pre-launch-cleanup--october-10-2026). Prior unresolved legal/schema/metrics/route cleanup notes are historical; production configuration/live workflow verification is still pending.


Repository snapshot: October 7, 2026. This document specifies existing capacity and current values; it supplies no replacement copy, business claims, translations, new fields, or design decisions.

The repository-root `AGENTS.md` governs future work. Relevant documentation inspected includes `AI-QUICKSTART.md`, `CUSTOMIZATION.md`, `CONTENT-GUIDE.md`, `DESIGN_RULES.md`, the Nova design documentation, CSS-layer documentation, deployment guidance, and asset/license documentation. Preserve active runtime behavior where older documentation differs. No documentation discrepancy is resolved here.

# Current Phase 7 invoice module — October 9, 2026

The user authorizes the first invoice system after the read-only audit confirmed none existed. Migration 009 creates invoices/invoice_items, safe VS-INV-YYYY-NNNN numbering, restricted accepted-proposal/inquiry relationships, six invoice activity types and hash-only email snapshots. **Migration 009 requires manual Neon execution before deployment**; 001–008 are unchanged and 009 is not applied live.

- Explicit Create invoice copies an accepted proposal into one independent draft; acceptance never auto-creates it. Existing exact integer-cent/discount/tax/USD pricing is reused. Drafts support optional client addresses, title/items, dates and notes/terms, with stale guards. Issue date defaults to today in a snapshotted business timezone; due date is explicitly selected, never an invented 14-day policy.
- Sender identity uses approved name/email/phone/website only; no Warsaw address or registration placeholders are inherited. No street address or business terms are invented. Published content freezes; statuses persist Draft/Sent/Paid/Void, with Viewed/Overdue derived. Manual Paid and Void require confirmation and are recorded as Admin actions, with no processor verification. Paid cannot be voided here.
- `/admin/invoices/` follows the existing proposal/Nova editor pattern. Inquiry and accepted-proposal views have compact invoice summaries/actions/history. `/invoice/<token>/` is a branded client-safe document with browser Print/Save as PDF. A visible-document acknowledgment sets first/last view times server-side and creates one first-view event; editor/preview/API GET adds no event.
- Public links use a dedicated stable INVOICE_TOKEN_SECRET and purpose-bound HMAC, storing only hash/publication time. SITE_URL controls origins. Existing composer adds optional View Invoice for a published invoice, stores placeholder/hash metadata, and reconstructs bearer URLs only at runtime. No automatic email is sent.
- Stripe, payment processing, cards/ACH, webhooks, receipts, partial payments/refunds, recurring invoices, reminders, accounting exports and client portal remain excluded. Existing CRM/follow-up/proposal/email/booking/calendar/integration behavior stays independent. Full model/security/manual rollout: [INQUIRY_ADMIN_SETUP.md](INQUIRY_ADMIN_SETUP.md#phase-7-invoice-system--october-9-2026).

# Current Phase 6B.1 Outlook Calendar and Zoom integrations — October 9, 2026

The user replaces active Google Calendar with Outlook Calendar / Microsoft Graph. Neon remains authoritative; Zoom's existing Server-to-Server adapter is preserved. The user confirms migration 007 is already applied. New migration 008 is required, must be applied manually before deployment, and is not applied live here. Migrations 001–007 are untouched.

- Microsoft authorization code + PKCE defaults to `common` for personal and work/school accounts. Delegated scopes are exactly `offline_access`, `User.Read`, `Calendars.ReadWrite`. Browser-bound, ten-minute, one-use state and purpose-bound AES-256-GCM token encryption remain. Refresh rotation, reconnect states and safe account/calendar selection are supported.
- Provider-neutral `calendarProvider` uses selected-calendar Graph calendarView for expanded recurring/all-day busy ranges, supporting both account types. Busy/tentative/oof/unknown states block; free/workingElsewhere do not. Cache is 60 seconds; final reservations/reschedules bypass it; verified own-event exclusion preserves overlaps. Unknown availability fails conservatively while CRM/current-call management stays available.
- Neon commits first, Zoom reconciles first, and Outlook mirrors the saved call with a ready Zoom URL. Existing leases/revisions and statuses remain. Durable Outlook creation intent, transactionId and extended-property lookup prevent blind creation replay. Events contain safe contact context and admin link, no private notes/budget/attendees/invitations. No automatic email/webhook is added.
- 008 renames Google booking fields to neutral calendar fields, adds stable Microsoft account binding/creation intent and restricts active providers to outlook_calendar/zoom. Retired Google connection snapshots and event references are archived privately before clearing active fields; their IDs are never treated as Outlook IDs. Zoom state, booking dates, CRM versions and activity are preserved. Old remote Google events/consent require manual cleanup; no Google API is called.
- `/admin/settings/integrations/` keeps Nova controls/layout and existing admin authorization. Outlook Connect/Reconnect/Disconnect, writable selection and Test connection replace Google. Booking detail/inquiry sync labels use Outlook Calendar. Local disconnect clears tokens/selection without deleting calls/events or revoking unrelated Microsoft user sessions.
- Active variables: `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`, optional `MICROSOFT_REDIRECT_URI`/`MICROSOFT_TENANT_ID`, existing `INTEGRATION_ENCRYPTION_KEY`, `SITE_URL`, four unchanged Zoom variables and existing booking/Neon/email configuration. Callback: `/.netlify/functions/microsoft-calendar-oauth-callback`, derived from SITE_URL. Google variables and implementation files are removed from active configuration.

Exact manual Microsoft/Zoom setup, migration/archive behavior and failure/reconciliation boundaries: [INQUIRY_ADMIN_SETUP.md](INQUIRY_ADMIN_SETUP.md#phase-6b1-outlook-calendar-and-zoom-integrations--october-9-2026). No live migration, provider connection, secret change, deployment, asset regeneration or additional CRM feature is performed.

# Historical Phase 6A booking engine and admin calendar — October 9, 2026

The user authorizes custom inquiry booking links, client scheduling, configurable account availability and a private Month/Agenda calendar. This supersedes historical booking deferrals only for Phase 6A. Existing CRM, follow-ups, proposals, email and intake remain independent; no Google/Zoom API, automatic messages/reminders, SMS, invoices/payments or client portal is included.

`006_create_bookings.sql` adds booking_settings, booking_availability, booking_exceptions, booking_links and bookings, six booking activity types, atomic PostgreSQL booking/change functions, GiST overlap protection, one scheduled booking per inquiry and nullable token-free email snapshot columns. **Migration 006 requires manual Neon execution before deployment.** Migrations 001–005 remain unchanged; no live schema or records are created.

Default account rules: America/New_York, 30-minute calls (15/30/45/60 supported), zero buffer, 12-hour notice, 60-day horizon; all weekday windows start disabled until Anthony configures actual hours. One-off unavailable/custom windows override weekly hours. Server Temporal resolves IANA zones/DST; UTC and source timezone are stored. Availability reads use one database snapshot and version checks, locking plus exclusion constraints prevent concurrent overlap, and booking/activity changes are atomic.

Links use random 256-bit nonces, a stable server HMAC key and stored SHA-256 hashes; raw booking tokens are never persisted, including email bodies/activity. Repeated creation/read reuses the current link; deliberate regeneration invalidates the old one and preserves bookings. BOOKING_TOKEN_SECRET is a dedicated 64-hex server secret that must be backed up and kept stable. Key changes require restoration or explicit link regeneration, not casual deployment rotation.

Public `/book/<token>/` provides branded Phone/Zoom choice, server dates/slots, labeled contact/notes controls, confirmation, refresh-safe result, secure pre-start cancellation/reschedule, inline validation and keyboard/focus feedback. Only client-safe contact/availability/current-booking metadata is returned; no DB IDs, inquiry summary/budget/private notes/proposals/messages/activity. Zoom URLs remain null. Public rate protection applies. Protected `/admin/calendar/` offers Month/Agenda, date/query/history navigation, details and confirmed Cancel/Complete/Reschedule; below 1024px Month presents an agenda. `/admin/calendar/settings/` edits recurring hours, exceptions and rules with stale guards. Completion is available after the call ends.

Inquiry detail adds deliberate Create/Copy/Open/Regenerate and current-call management. The composer offers Schedule a Call only for an existing usable link; Discovery chooses it when available. Preview/opening never creates tokens or sends email. Frozen nonce/hash snapshots replace raw tokens with a marker in persisted messages and rehydrate only at runtime; old regenerated invitations cannot be retried as dead CTAs. No booking action changes inquiry status, notes, follow-ups or proposals.

SITE_URL now controls generated proposal/booking/email CTA origins. Staging: https://vs-site-v3.netlify.app; production later: https://volatile-solutions.net. These are deployment configuration, not new runtime literals. EMAIL_PUBLIC_URL remains an optional email asset override; transitional link fallback when SITE_URL is absent preserves Phase 5. Both origins require normalized HTTPS without credentials/path/query/fragment. Empty placeholders only are added to .env.example; no secret is recorded. The existing company/canonical/noindex data and all images/global CSS remain unchanged.

Full schema, token model/key handling, privacy, URL rules, manual rollout and local validation boundaries: [INQUIRY_ADMIN_SETUP.md](INQUIRY_ADMIN_SETUP.md). Local tests/browser fixtures never create real bookings, connect to Neon, deliver email or configure Identity/deployments. Phase 6A did not include external integrations; the authorized Phase 6B scope is recorded above.

**Local validation:** 250 tests across eleven files (55 booking cases), 76 data JSON files, zero Astro/TypeScript errors, 13 static pages and seven Function bundles pass. Browser checks at 320/375/430/768/1024/1440px cover public booking, calendar, settings, CRM/email integration and existing CRM/intake regressions using isolated PostgreSQL and mocked Identity/Resend. Hashes preserve migrations 001–005, auth/database verification, existing inquiry/proposal API logic, follow-up helpers, public wizard/data/assets/global CSS and every legacy source. Temporary fixtures are removed; no live deployment/database/email result is claimed.

# Historical Phase 5 CRM communications — October 9, 2026

The user confirms the existing CRM/proposal system is live and authorizes private Resend transactional outbound email, editable templates, branded HTML/plain-text preview, inquiry correspondence and outcome activity. This supersedes older outbound-email deferrals only for Phase 5. Existing List/Pipeline/search/filter/detail/notes/follow-up/proposal/public intake behavior remains.

`005_create_inquiry_messages.sql` adds private message records, request/fingerprint/attempt tracking and email_sent/email_failed activity with message relationship/outcome uniqueness. Migrations 001–004 are unchanged; no records are backfilled. **Migration 005 requires manual Neon execution before deployment.** No live migration, DNS configuration, deployment or real email is performed in this pass.

Protected `/api/admin/messages?inquiry=<uuid>` handles history, ownership-checked content, preview, send and explicit saved-message retries. Recipients are restricted to the inquiry contact; subject/body/templates are strictly validated and escaped. Resend acceptance is Sent, never Delivered/Opened/Read. Sending/Failed records and frozen provider idempotency keys support recovery without ordinary duplicate sends, with a 23-hour safe retry window and 90-second active lease. Outcome/activity writes are atomic; provider and database are deliberately separate.

The compact Communication section uses Nova controls, five editable internal templates, server-generated sandboxed preview and ten-message history pages with lazy expansion. Proposal CTAs use only the current unexpired Sent offer's secure public token; sending does not change any inquiry/proposal/follow-up business state. Internal templates are not fabricated client data. Required runtime variables are RESEND_API_KEY, EMAIL_FROM and EMAIL_REPLY_TO, with optional EMAIL_PUBLIC_URL for a trusted deployed origin. All example-env values are empty; sender verification/setup remains manual. The main domain's prepared logo URL returned 404 locally, so deployment-origin/asset verification is an explicit setup step rather than silently assuming it works.

Email rendering uses the existing PNG logo, cream/near-black/copper palette, inline table-safe styling, web-safe font fallbacks, escaped paragraphs, optional View Proposal, Anthony's signature and a complete plain-text alternative. CTA structure permits a future approved booking link, but no booking/calendar/inbound/invoice/payment/attachment/bulk-mail feature is added. Full model, privacy, retry rules and exact rollout steps are in `INQUIRY_ADMIN_SETUP.md`.

**Local validation:** 195 tests pass (51 email cases), Astro/TypeScript reports zero errors, ten static pages and five Function bundles pass. Browser checks at 320/375/430/768/1024/1440px validate the composer/preview/history/retry and preserve existing CRM/public wizard flows. Private/proposal operations use real isolated PostgreSQL; Identity, Resend and preview-logo transport are explicitly mocked. No real email or live database/deployment result is claimed. Temporary fixtures are removed; original migrations, proposal/follow-up/public wizard code, data/assets and global CSS remain byte-identical.

# Historical Phase 4 proposal and estimate workflow — October 9, 2026

The user authorizes a proposal workflow on the existing live CRM. One proposal per inquiry is accessed from compact inquiry detail and edited at `/admin/proposals/?proposal=<uuid>` with preserved Back/search/filter/view context. Drafts can be incomplete; Send validates saved complete content, freezes the offer and reveals a manually copied public `/proposal/<random-token>/` link. No email is sent. Inquiry status, notes and follow-up scheduling remain independent.

`004_create_proposals.sql` adds proposals, ordered line items, safe sequence numbers (`VS-YYYY-NNNN`) and five proposal activity types. Money is server-calculated integer cents in USD: positive whole quantities, fixed discount and optional basis-point tax (default 0%, rounded half up on the discounted subtotal). Valid-through dates use inclusive UTC calendar days; expired Sent proposals cannot respond. Future versions remain deferred. Migrations 001–003 are unchanged and existing inquiries receive no proposals/backfill.

The anonymous branded document exposes only client-safe proposal/contact information, with confirmed Accept/Decline, server timestamps and Client activity. Published offers are read-only; repeated/racing decisions are rejected. Tokens have 256 bits of cryptographic entropy. Admin role checks, same-origin mutations, strict validation, parameterized SQL and atomic proposal/items/activity writes preserve the private boundary. Browser print/Save as PDF is supported without a generator; no private notes or IDs are sent to public clients.

**Migration 004 requires manual Neon execution before deployment.** No live migration or deployment occurs. The local proposal and CRM/URL suite passes 144 tests (34 proposal cases), Astro/TypeScript passes, ten static routes and four Function bundles pass, and six-width browser checks preserve the CRM and public wizard. One-page and three-page proposal PDFs were visually checked. Identity/receipt fixtures are synthetic; proposal/private requests use actual Functions and isolated PostgreSQL. Runtime limits, route contracts, security, validation boundaries and the manual rollout are recorded in `INQUIRY_ADMIN_SETUP.md`.

No invoice/payment/Stripe, signature/contract, upload, portal, outbound email/reminder, version history or accounting feature is included. Existing content, portfolio, imagery, localization and global CSS remain.

# Historical Phase 3 inquiry operations — October 9, 2026

The user confirms Phase 1/2 is live-verified and approves private server-side search across name/email/company/project summary, shared enum filters, follow-up scheduling/tracking/activity and a compact operational summary. The current List/Pipeline/detail/status/notes/public intake architecture remains. URL queries preserve view/filter/sort/page/deep-link context; Clear filters preserves view. List totals and Pipeline counts are filtered; clearly labeled summary metrics stay global.

Follow-up dates are stored in UTC and displayed/filtered by browser-local calendar days (including DST); due today covers today, overdue means before today, upcoming starts tomorrow. Separate follow-up notes are bounded and excluded from activity bodies. The protected PATCH retains same-origin/admin/stale-edit checks and atomic server-generated scheduled/updated/cleared events. Archived records keep their schedules and history but do not contribute to due/overdue metrics.

`003_add_follow_up_fields.sql` adds safe NULL/empty defaults and follow-up activity timestamps/types. Migrations 001/002 are unchanged. **Migration 003 requires manual Neon execution before deployment; no live database or deployment is modified.** Runtime and validation details are in `INQUIRY_ADMIN_SETUP.md`. No outbound email, notifications, proposals, invoices, payments, uploads, calendar, portal, charts or task management are included.

# Historical Phase 2 inquiry workflow — October 9, 2026

The user confirms Phase 1 is live-staging verified and authorizes only Pipeline plus inquiry activity. List remains first-class/default. `/admin/?view=pipeline` uses the seven existing statuses New through Lost; Archived remains available in List. Detail retains the existing `inquiry` query and view context through Back/Forward.

New private UI modules are `InquiryPipeline.astro`, `InquiryActivity.astro`, `admin-pipeline.ts` and `admin-activity.ts`. They reuse Nova atoms, status colors, controls and the existing admin shell. The protected API adds pipeline summary loading and activity in detail GET. Strict move requests use the existing PATCH, preserve notes server-side and retain timestamp conflict protection. Board counts come from all returned non-archived summaries; there is no per-card detail/activity fetch.

The shared store atomically records creation, actual status changes and actual note changes. Retries and unchanged saves add no duplicate events; full note text is not copied. `002_create_inquiry_activity.sql` is a separate migration with deliberate cascading cleanup, a history index and one-creation-event guard. `001` is unchanged, existing records are not backfilled, and `002` requires manual Neon execution before deployment. Details are recorded in `INQUIRY_ADMIN_SETUP.md`. No email, proposal, upload, reminder, task, portal, analytics, dependency, public-wizard UI or unrelated website change is included.

# Historical inquiry and admin foundation — October 8, 2026

The user explicitly approved a public project inquiry wizard, server-side Netlify Functions, Neon persistence and the initial private Netlify Identity admin workspace. This supersedes earlier mailto-only/no-admin/no-auth/no-Neon restrictions only for this Phase 1 scope. No real database connection, migration, Identity user, invitation or deployment was created: DATABASE_URL and a linked Netlify project were absent locally.

- Public route `/start-a-project/`: five steps (project type; contact/business; summary/help/stage; budget/timeline; review/consent). Required fields, adjacent errors, Back/Edit, keyboard focus, value preservation, explicit submit, loading/disabled controls, stable retry UUID, successful receipt state and failure/email fallback. Copy and editable ranges live in `src/data/inquiry.json`; no prices or delivery promises are added.
- Updated five business-intent CTA contracts: navigation Start a Project (both header states/drawer), hero Work With Me, Services Discuss a Project, About Let's Work Together and portfolio closing Start a Project → `/start-a-project/`. Footer Get in Touch remains company email. All portfolio items/filters/images/destinations, View My Work, phone, socials and legal links remain unchanged.
- Modern Functions in `netlify/functions/` handle public POST and protected list/detail/PATCH through explicit `/api/inquiries` and `/api/admin/inquiries[/<uuid>]` aliases before existing general routing. Shared strict Zod validation rejects enum/type/length/email/URL/consent/mass-assignment errors; bounded body reading, honeypot, minimum timing and native per-IP rate limit provide basic spam protection. Error responses/logs exclude database/identity secrets and exception details. Every private request verifies Identity getUser plus admin role before database access; mutations also require same-origin requests.
- Server-only `netlify/lib/inquiry-store.ts` uses @neondatabase/serverless and Functions-scoped DATABASE_URL. Parameterized queries create/list/get/update. `database/migrations/001_create_inquiries.sql` creates the minimal UUID-based table with source, consent timestamp, status, notes, unique submission key/fingerprint and indexes; no seeds/drop/delete. Identical retries return the same receipt; stale private edits conflict instead of overwriting notes. Date-object milliseconds are preserved for updatedAt checks.
- Private route `/admin/`, public login/callback shell `/admin/login/`: @netlify/identity email login, invitation/password-recovery handling, no signup UI or automatic admin assignment. Dashboard metrics derive from actual rows; list supports status filtering, newest/oldest/status sorting and 25-row pages; detail includes submitted fields, email action, eight approved statuses and private notes. Logout/authorization failures clear data/notes/contact hrefs; keyboard focus returns to the selected row or login form as appropriate. Admin uses Nova tokens with a minimal private layout, no public navigation entry/analytics and noindex/nofollow; excluded from sitemap. CDN admin-role gates have a login fallback; API authorization stands independently.
- Added compatible packages: @netlify/identity 2.0.0, @netlify/functions 6.0.2, @neondatabase/serverless 1.2.0; development @netlify/vite-plugin 3.0.1. Astro remains static with existing build behavior, English-only scope and Polish redirects. Dev-only API alias middleware mirrors production while disabling local CDN role/image/header emulation. `.env.example` documents only an empty DATABASE_URL key; local env/Netlify artifacts are ignored. Public Layout forwards recognized Identity callback fragments to login without putting the Identity SDK or database access into public markup.
- Full schema, exact source files, environment/configuration prerequisites and manual invitation/role/migration steps are in [INQUIRY_ADMIN_SETUP.md](INQUIRY_ADMIN_SETUP.md). Invite-only setup and real Identity cookies/callback/session/CDN checks require a configured deployment. Role assignment applies on next login or token refresh, not immediately. No real Neon test is claimed.
- **Validation:** all 76 data JSON files parse; Astro/TypeScript checks 417 files with zero errors; the safe temporary static build emits eight public/admin pages; both Functions bundle through Netlify's esbuild bundler. The 31 inquiry/auth/persistence-contract tests plus 11 URL tests pass (42 total); data/import/registration/motion checks pass. Atomic audit retains only the untouched ChecklistItem margin violation and HeroSplit advisory. No broad QA subprocess or asset generator is run.
- **Browser/credential boundary:** public wizard checks at 320/375/430/768/1024/1440px pass five-step validation, Back/Edit preservation, plain-text review, consent, disabled controls, double-submit prevention, stable-key mocked failure/retry/success, keyboard and Astro client-router entrance. Mocked admin checks pass real SDK login against intercepted synthetic responses, list/status/sort/detail, note/status failure/conflict/save, keyboard focus, logout cleanup and all six widths without overflow/runtime errors. These are explicit mocks, not real Identity or Neon success. Real local Functions return public invalid-payload 422, missing-database 503, unauthenticated read/update 401 and forged-role-cookie 401. No live DB credentials, migration, account/invitation or deployment are used. Client build contains no DATABASE_URL/Neon driver/connection string; admin HTML contains no private records and admin is excluded from sitemap. Final hashes preserve all existing image/legacy assets and the portfolio's 134 entries/42 thumbnails/48 contained boards. Changes are 13 existing source/config/document files plus 21 additions, listed in INQUIRY_ADMIN_SETUP.md.
- Deferred: kanban, email notifications/automation, uploads, proposals, client portal, advanced analytics and CRM automation. No fake lead/customer records, outbound emails or new image assets are included.

# Current portfolio regression correction and thumbnail restoration — October 8, 2026

This authorized correction supersedes the blanket 98-contain assignment and six-thumbnail count below. The user specifically confirmed cover for every non-brand-board card, including advertising/PVD. Those card crops change intentionally; their source artwork, factual content, classification and shell remain.

- Runtime files remain `src/data/portfolio.json`, `src/types/portfolio.ts` and the existing `src/components/portfolio/PortfolioCollection.astro`. Fit is **48 contain / 86 cover (134 records)**. All 48 full identity boards retain their 94% centered picture, 3% Nova cream inset, complete composition and no hover zoom. The 50 previous non-board entries now use cover. No grid/radius/typography/description/classification/CTA styling change.
- Optional `imagePosition` maps through a scoped CSS variable to object-position; only Mula uses `center top` to retain its wordmark. Other cards remain centered. Optional `mediaAspect: '16:9'` makes all actual thumbnail frames 16:9, full-frame cover without image zoom; absent mode retains 4:3. Thumbnail metadata now uses YouTube Thumbnails instead of the old Ads & Social cardLabel. Filter labels/IDs and existing native JS are unchanged.
- Narrow recursive legacy audit: 42 distinct decoded 1672×941 PNG thumbnails, visually reviewed. The six prior primary samples remain; 36 individual cards added, no new collection cards. The previous six topic-level cards exposed one sample each, not the complete series. Different source compositions/headlines warrant individual visibility; misleading filename subjects are corrected in tags from actual artwork. All thumbnail classifications are Creative Portfolio, unverified; no client/creator outcome claims.
- Category counts: All 134, Websites 11, Web Apps & Digital Products 5, Branding 48, Advertising & Marketing 30, YouTube Thumbnails 42. `?category=creative` retains the branding/ads/thumbnails union, now 120. Curated initial twelve, twelve-item Show More, original 98-entry order, query/history/keyboard, homepage flows and excluded projects remain.
- New assets only: 36 byte-preserved raw PNG copies plus 504 WebP/AVIF derivatives for the missing thumbnail families; seven widths (220/480/640/800/1080/1280/1600), no enlargement, unsuffixed 800 base. Existing 98 families and all legacy sources remain. No new dependency/component/global CSS, artwork generation, route, homepage, localization, SEO/noindex or navbar change.

Validation and isolation: 75 JSON files, all 134 records/image/action paths, 42 byte-identical source/raw mappings, 504 fully decoded new derivatives, 399-file Astro/TypeScript check, safe five-page static build, data/import/registration/motion checks and 11 URL tests pass. Browser comparison at 320/375/430/768/1024/1440px preserves 48 board treatments and all 92 existing non-thumbnail card shells. All 42 thumbnail frames were visually reviewed; six filters, 120-entry creative query, keyboard/history/Show More, late anchors, homepage flows, 120 artwork resources and reduced motion pass without overflow/runtime errors. Local filter sample averages 4.7ms (max 10ms); native lazy/async behavior remains. Full Vitest reports unrelated contract/route failures and a QA subprocess timeout; atomic audit retains the existing ChecklistItem violation/HeroSplit advisory. The QA subprocess unexpectedly regenerated existing derivatives: 150 were restored from hash-verified pre-change backups and 12 extra test-generated derivatives removed. Final hashes preserve every preexisting asset and legacy source; only five intended source/document files and 540 new thumbnail-family files remain. A fresh safe build's assets match the final public files exactly.

See the [complete final presentation audit and source/family mapping](VOLATILE_CONTENT_SOURCE.md#current-portfolio-regression-correction-and-thumbnail-restoration--october-8-2026) for every record, position/aspect, new family and source hash. Earlier notes remain historical.

# Current brand-board presentation refinement — October 8, 2026

The expressly authorized image-presentation/category pass supersedes the five-filter and no-optional-presentation-field notes below. Preserve the existing portfolio grid, 4:3 image frames, radii, typography, metadata/action positions, 98 records/order, prepared assets, navbar and homepage flows.

- `src/types/portfolio.ts`: optional `PortfolioItem.imageFit: 'cover' | 'contain'`; category ID adds `thumbnails`; optional category `cardLabel` allows approved filter names without changing existing card labels.
- `src/data/portfolio.json`: all 98 current entries explicitly use contain, preserving their actual previous runtime fit. **Fit audit: 98 contain / 0 cover.** Only the 48 actual identity boards receive new neutral framing; the other 50 keep their successful presentation. Luma Spritz is ads-only; six thumbnail collections are thumbnails-only. No content, classification, destinations, item order or image sources change.
- `src/components/portfolio/PortfolioCollection.astro`: absent imageFit defaults to cover. Contained branding entries tagged `Brand Identity` use the existing `--color-brand-cream` background and a centered picture at 94% width/height with 3% inset. These boards omit photographic image hover zoom; the other cards retain it. Frame/card dimensions and complete View Artwork resources remain. No imagePosition field, new component, dependency, global CSS or artwork derivative is introduced.
- Current filters: All 98 (initial 12, unchanged twelve-item Show More), Websites 11, Web Apps & Digital Products 5, Branding 48, Advertising & Marketing 30, YouTube Thumbnails 6. `?category=creative` retains all 84 creative entries through the branding/ads/thumbnails union. Existing filter/history/keyboard machinery is reused unchanged.
- Validation: 75 JSON files, all 98 IDs/data/image/action paths, 399-file Astro/TypeScript check, five-page temporary static build, data contracts and 11 URL tests pass. Browser comparison at 320/375/430/768/1440px confirms all 98 card/frame sizes and text/action positions unchanged; all 48 boards have full-image neutral treatment and the remaining 50 have unchanged fit/background/hover geometry. Explicit grid inspection includes Ember & Fig, FlowPilot, Ledger & Loom and Copper Fork. Six filters, query/history/creative alias, keyboard, reduced motion, homepage links and all 48 full-artwork actions pass without overflow or browser errors. Atomic audit reports the unchanged ChecklistItem margin violation and HeroSplit advisory. Assets remain byte-identical and are not regenerated.

The complete 48-board list and measured starting behavior are recorded in [Current brand-board presentation refinement](VOLATILE_CONTENT_SOURCE.md#current-brand-board-presentation-refinement--october-8-2026). Earlier notes remain historical context.

# Current Portfolio UX and navbar branding — October 8, 2026

This expressly authorized polish pass supersedes the full-list All behavior and initial ordering below, while retaining all 98 item records, five filters, categories/classifications, homepage links and existing image families. No project discovery, additions, case studies, admin, authentication or indexing change.

- **Navbar:** the existing company branding contract now supplies `/assets/images/t001-nova/t001-nova-navbar-logo.png` with intrinsic logoWidth 1539 / logoHeight 305. Logo.astro uses that source; both Floating.astro header states have the accessible home anchor. The graphical mark/wording occupy the former text-brand position across all public routes; drawer markup/engines and CTA/navigation placement remain. Responsive height is 40px below 640px and 44px thereafter, width automatic. Measured widths are approximately 202/222px; header remains approximately 69.6px at all six requested widths.
- **Logo preparation:** approved original `legacy-assets/Logos/logo-with-text.png` is 1672×941 RGBA. The lossless crop rectangle `(76,311)`–`(1615,616)` trims transparent padding/isolated alpha=1 residue while preserving visible artwork plus a two-pixel margin. Native production PNG is 154,496 bytes, unchanged colors and transparent edges. Source copy and prepared raw crop are `src/assets/raw/t001-nova/t001-nova-navbar-logo-source.png` and `src/assets/raw/t001-nova/t001-nova-navbar-logo.png`. No legacy bytes or existing portfolio assets change.
- **Browsing contract:** PortfolioData adds `browsing: { initialCount: 12, increment: 12 }`; labels add showMore/showing/of. All shows twelve initially and reveals twelve per Show More. Each filter exposes all its matching records; `creative` keeps its 84-entry union. Dynamic live counts remain the single count presentation. Without JS, all 98 remain visible and interactive-only controls stay hidden.
- **State/accessibility:** expanded All counts persist in history state, direct anchors reveal the required batch, and Astro after-swap/page-load reapply state before a history-transition full-list flash. Keyboard Show More focuses the first newly shown heading, with aria-controls and live status; the last batch hides the control safely. Filters, history, reduced motion and homepage links remain operational.
- **Card presentation:** contained full images, existing 4:3 frames and all image resources are retained. The picture wrapper is constrained to the frame, correcting intrinsic square-image overflow/clipping without editing artwork. No optional image-presentation fields or hardcoded per-item crop rules are necessary. Desktop rows stretch and align CTA bottoms; mobile wrapping stays natural. External URLs use the external-link icon; same-origin View Artwork uses an image icon and opens the existing larger resource. No whole-card or invented detail destinations.
- **Opening order:** The Moody Brewer, PVD Photography, MetricForge, Ledger & Loom, Northline Strength, Mula, Luma Spritz, GlassDash, Jobly, Cloud Keep, Ember & Fig, Aura Active. All other ordering remains intact; no work is deleted or reclassified. Fros Lawncare, TimeDock and StillPoint stay excluded.
- **Validation:** all 98 data records/image/action paths, JSON, 399-file Astro/TypeScript check, five-page static build, 11 URL tests, data/import/registration/motion checks pass. Browsers pass widths 320/375/430/768/1024/1440px, All progression to 98, filters/creative alias/history/late anchors, keyboard/focus, reduced motion, drawer, logo navigation, unique IDs, no-JS access, aligned actions and zero horizontal overflow/runtime exceptions. Atomic audit still reports the untouched ChecklistItem margin violation and HeroSplit advisory.
- **Performance:** lazy/async SmartImage behavior remains for all cards. Local sample: six initial card-image requests, 2,555 DOM nodes, approximately 63ms DOMContentLoaded; 25 filter changes including layout averaged 4.1ms, maximum 8.0ms. No claim of a production/Lighthouse score. SHA-256 comparisons preserve all legacy artwork/process sources and existing portfolio families; new assets are logo-only.

The full preparation, content, behavior and validation notes are in [Current Portfolio UX and navbar branding](VOLATILE_CONTENT_SOURCE.md#current-portfolio-ux-and-navbar-branding--october-8-2026). Older migration notes remain historical context and are not rewritten.

Final isolation note: two Finder metadata files changed independently during the pass, `legacy-assets/.DS_Store` and `legacy-assets/Graphic Design/Real Clients/.DS_Store`. They were not edited or reverted by the implementation. All legacy raster artwork, the approved source logo, the process Markdown and all preexisting portfolio source/production images remain byte-identical. The intended changes remain nine scoped UI/data/type/document files plus three logo PNG additions.

# Current Portfolio expansion — October 8, 2026

Explicitly authorized comprehensive expansion of the existing English portfolio. This supersedes the initial ten-entry selection and earlier deferrals only where supported below. The five primary filters, Nova PortfolioCollection, route, card architecture, navigation, typography, CSS, homepage project links and noindex policy remain unchanged. No case-study pages or admin features were added.

The user expressly requested leaving **Fros Lawncare, TimeDock and StillPoint out** during this pass. Their absence is intentional, not a claim that the work does not exist.

## Expanded inventory and evidence boundaries

Audited every current legacy raster by decoding it, checking dimensions and hashes, and visually inspecting the relevant website, identity, advertising, social and thumbnail work. The current library has **152 images**: 17 portfolio-folder images, 48 brand boards, 15 product/digital advertising concepts, 14 square social/event/service/flyer graphics, 3 LinkedIn banners, 42 thumbnails, 5 PVD client graphics, 4 founder images and 4 company-logo rasters. The older asset inventory remains a dated snapshot; current measured dimensions take precedence for this pass. No decoded-pixel duplicates were found. Distinct works can still share campaign/layout conventions.

Compared the original ten records, LEGACY_PROJECT_LINKS.md, LEGACY_ASSET_INVENTORY.md, approved source facts, the current public portfolio at https://volatile-solutions.net/portfolio and the 120-item creative data at https://volatile-solutions.net/js/graphic-portfolio-data.js?v=20260524packages1. The public links were extracted from actual HTML and all 14 project destinations returned HTTP 200 with verified TLS. Entry-page availability does not verify APIs, authentication, bookings, storage security, app functionality or business operations.

**Final live collection: 98 entries, including 88 additions and all ten retained records.** These are portfolio entries, not 98 clients, launches or delivered software applications. All actual available public website/software projects are included; the larger creative library accounts for the greater number of creative cards. Software and client work stay prominent in the default ordering and dedicated filters.

| Filter | Matching entries |
| --- | --- |
| All | 98 |
| Websites | 11 |
| Web Apps & Digital Products | 5 |
| Branding & Visual Design | 49 |
| Ads & Social | 36 |

Category counts overlap because some entries have multiple categories. The Creative Work query selects the branding/ads union: 84 entries. The default order starts The Moody Brewer, Mula, Ledger & Loom, MetricForge, PVD Photography, Cloud Keep, Northline Strength, GlassDash, Ember & Fig and Luma Spritz. Remaining identity sectors and marketing pieces are interleaved. No artificial item ceiling was applied.

## Classification and deliverable safety

- Verified Client Work is limited to Moody Brewer and the two distinct PVD advertising deliverables. PVD wedding and senior-portrait promotions are intentionally separate creative works; additional variants do not become extra project cards. No photography authorship, client website build or advertising result is claimed for PVD.
- Portfolio Work denotes a supported website/product presentation with unresolved client/personal/concept relationship. It never means Verified Client Work.
- Creative Portfolio denotes real creative artifacts without asserting a paying client. Identity-board app mockups do not establish working software; the only published category for those boards is Branding & Visual Design.
- Concept Project is used where the current public creative data expressly identifies a concept, and for Northline Plumbing, whose live page explicitly describes a fictional service brand.
- FLOWSTATE AI, REVNUE and VAULTIQ are advertisements/interface mockups under Ads & Social, not completed AI, finance or security applications. No backend or security claim is inferred.
- No new project technologies are published: the inspected public badges are not sufficient stack evidence. TimeDock's documented Electron/React/SQLite facts remain historical source context for an excluded record.
- No growth, ROI, revenue impact, conversion, customer or traffic claims are added. Existing illustrative interface/business details are distinguished from Anthony's results.

## Runtime content and source mappings

`src/data/portfolio.json` is the only changed runtime data file. All ten prior records are preserved field-for-field; 88 supported records are added. PortfolioCollection, PortfolioItem types, CSS, route, filtering, homepage links, shell and localization are unchanged. Source classifications, the complete 103-row project-candidate table, all new published descriptions/tags/URLs/images, per-family raw-source hashes, additional images and the complete 152-image disposition are recorded in [Current Portfolio expansion](VOLATILE_CONTENT_SOURCE.md#current-portfolio-expansion--october-8-2026).

| New work group | Count | Titles |
| --- | --- | --- |
| Website/product presentations | 9 | Mula; Cloud Keep; Birdie Bay; Frost; Sonoran Comfort Systems; Northline Plumbing; Solartec; Harbor & Steel; ScholarLink |
| Distinct identity boards | 47 | Ember & Fig; FlowPilot; Carbon Cue; Clip Forge; Patchline; Table Shift; Crestline Wealth Partners; Bridgewell Funding; Meridian Oak; Penny Pilot; Luma Grove Clinic; Haven Bloom Health; Pearl & Pine Dental; Solenne Dermatology; Stridewell Therapy; Glossline Studio; Gravelhorn Outfitters; MirrorBay Detail; Route Forge; Volt Nest; Wrench Run; Iron Vale; Align & Aura; ForgeHouse Athletics; GloveHouse Boxing; MacroMap; RangeLab Recovery; Northline Real Estate; HearthMark Lending; KeyHaven Property; RoomWright Studio; SagePoint Realty; Vale & Stone; Atlas Drift; Benny's Burgers; Juniper Hearth; Copper Fork; Fry Bird; Hollow Cup; TaskNest; Harborline Capital; Kindwell; Solara Stay; Tide & Trail; Bloom & Brick; Lantern Lane; Old Harbor |
| Product advertising concepts | 12 | Aura Active; Rift Product Advertising; Vanta Pulse; Macro Forge Meals; Volt Electrolytes; Brew Core; Crunch Forge; Level Up; Vyra Active; Flowstate AI; Revnue Admin; Vault IQ |
| Social/event/service/banner creative | 13 | Harbor Room — Local Table Night; Ironwood Training Hall; Juniper House — Author Evening; Paper Lantern Studio; Blue Harbor Advisory; Hale Street Realty; Stonebridge Web Services; Westmere Talent; Cedar Plate; House of Laurel; Kindred Desk; Marlow Pantry; North Ledger Consulting |
| PVD senior-portrait campaign | 1 | PVD Photography — Senior Portraits |
| Thumbnail collections | 6 | AI & Productivity Thumbnail Design; Faith & Lifestyle Thumbnail Design; Finance Thumbnail Design; Fitness Thumbnail Design; Food Thumbnail Design; Real Estate Thumbnail Design |

## Asset conventions and reproducibility

New bytes live only in `src/assets/raw/t001-nova/portfolio/` and `public/assets/images/t001-nova/portfolio/`. Each of 88 new families has a byte-preserved source copy and WebP/AVIF derivatives. Two additional prepared PNG masters make the claim-strip crops reproducible under the existing image pipeline: `cloud-keep-source.png` / `cloud-keep.png` and `northline-plumbing-source.png` / `northline-plumbing.png`. All other matching raw copies are directly byte-identical to their legacy sources. Source documentation contains exact mappings, widths, SHA-256 values and crop rectangles. Existing families are not regenerated; legacy images/metadata/process documentation are preserved.

Fros Lawncare has no matched deliverable or artwork in the audited material; JackFrost fitness is a separate project. The user expressly excluded Fros Lawncare, TimeDock and StillPoint. Euclid/HealthSync are unresolved; their placeholder assets/descriptions are not fabricated. The current website/product links are retained with explicit historical identity notes for Solartec and Mula, accurate golf context for Birdie Bay, and fictional-business classification for Northline Plumbing.

## Expansion validation

All 75 data JSON files parse; 98 unique portfolio IDs/titles/images and all destinations resolve to real records/resources. Astro checks (399 files, zero errors), the five-page temporary static build, data contracts (52 sections/two page configs), import/registration/motion checks and 11 focused URL tests pass. Browser filtering returns All 98 / Websites 11 / Web Apps 5 / Branding 49 / Ads 36; the Creative Work union returns 84. Keyboard, query/history/deep-link behavior, reduced motion and homepage/mobile navigation pass. All categories have zero horizontal/card-text overflow at 1440/768/390/320px, with 44px filter targets; all 98 card images load.

All 14 real external project links return HTTP 200; all 84 local artwork actions resolve. The 972 new derivatives fully decode and preserve dimensions/aspect without enlargement; all 88 raw source copies are byte-identical, and the two crop masters match the documented source pixels. SHA-256 comparisons preserve all 170 preexisting legacy files and every other preexisting source/asset outside portfolio.json and the two migration documents. New files: 90 raw PNGs + 972 WebP/AVIF derivatives, with no unrelated additions or deletions. No component/CSS/homepage/localization/SEO/configuration/license changes. Development preview renders 98 entries; nothing was deployed.

# Current footer follow-up — October 8, 2026

The user explicitly requested removal of the visible ThemeWagon and WebScale footer references. The shared Nova footer now displays only "All rights reserved." in its bottom row; unused footer attribution fields are removed from English content. This supersedes the earlier visible-credit retention decision below. Repository license and author notices in LICENSE.md and README.md remain unchanged.

# Current Portfolio implementation — October 8, 2026

Explicit user authorization adds an English-only `/portfolio/` page using the existing Nova Layout, atoms, tokens, responsive image/motion conventions and footer/header. This supersedes earlier restrictions on portfolio pages, filtering and optional per-project destinations for this pass only. English-only/noindex policy, existing homepage copy/metrics, prepared founder/project imagery, phone/email/social sources, and required WebScale author notice remain.

## Route and data architecture

- Route: `src/pages/portfolio.astro` → `/portfolio/`; build scope adds `/portfolio`.
- Data: `src/data/portfolio.json`; type contract: `src/types/portfolio.ts`; page-specific renderer: `src/components/portfolio/PortfolioCollection.astro`. Existing PageBuilder/section registry and component manifests are unchanged.
- Intro: Portfolio. Client websites, web applications, digital products, branding, and advertising, bringing development and visual design into one collection.
- SEO: Portfolio | Volatile Solutions. Indexing remains disabled. The existing schema/OG architecture is not rewritten.
- Records support id/title/categories/tags/classification/clientStatus/image/alt/shortDescription, optional imageNote/technologies/externalUrl/artworkHref/detailHref/actionLabel. Absent facts stay absent. No technology stack is asserted for the initial entries because project-specific technology evidence is unconfirmed.
- Images display in reserved 4:3 Nova-style rounded frames with object-fit:contain, keeping complete square artwork and identity boards readable without modifying the original work. Only real destinations receive action buttons. Artwork actions open prepared image resources; no fictional brand website or case-study route is invented.
- `formatInternalLink` now preserves known file-resource extensions, fixing artwork links that previously acquired a broken trailing slash. Page routes retain their existing slash convention; focused URL tests cover files/query/fragments.

## Categories and URL state

One primary filter group: All (`all`), Websites (`websites`), Web Apps & Digital Products (`web-apps`), Branding & Visual Design (`branding`), Ads & Social (`ads`). Records can have multiple categories; tags are secondary metadata, not another filter bar.

Native buttons use aria-pressed, visible checkmarks, keyboard activation and 44px minimum targets; a polite live count reports the visible selection. Filtering retains the card DOM and stable image slots, updates query state without a page reload, and supports browser back/forward. A short opacity fade respects prefers-reduced-motion. AbortController cleanup handles Astro view transitions. With JavaScript unavailable, all work remains visible and inactive filter controls stay hidden.

`?category=creative` selects the branding/ads union and visibly marks both corresponding buttons. Individual category URLs work too. Invalid categories fall back to All. If a valid project anchor conflicts with a filter, the selection resets to All so the anchor remains visible. No new scrolling engine is introduced.

## Initial curated records

Commissioning/classification uncertainty is kept explicit. Portfolio Work means the project is supported by the current public portfolio and source evidence, but its client/personal/concept/production relationship is not established. It is not a client claim. Creative Portfolio likewise does not certify a paying-client relationship. Luma Spritz is explicitly called a mock advertisement/campaign concept in the current public gallery data, so Concept Project is supported for that artwork.

| ID / title | Classification / client status | Work categories | Tags | Destination | Image |
| --- | --- | --- | --- | --- | --- |
| the-moody-brewer / The Moody Brewer | Verified Client Work / verified | websites | Client Work, Food & Beverage | https://themoodybrewer.net/ | `/assets/images/t001-nova/t001-nova-project-moody-brewer.webp` |
| pvd-photography / PVD Photography | Verified Client Work / verified | ads | Client Work, Photography | /assets/images/t001-nova/portfolio/pvd-photography@1080.webp | `/assets/images/t001-nova/portfolio/pvd-photography.webp` |
| metricforge / MetricForge | Portfolio Work / unverified | web-apps | Analytics, Dashboard | https://metric-forge.netlify.app/ | `/assets/images/t001-nova/portfolio/metricforge.webp` |
| glassdash / GlassDash | Portfolio Work / unverified | web-apps | Finance, Admin Interface | https://glass-dash-admin.netlify.app/ | `/assets/images/t001-nova/portfolio/glassdash.webp` |
| jobly / Jobly | Portfolio Work / unverified | web-apps, websites | Job Discovery, Web Interface | https://jobly-jobsearch.netlify.app/ | `/assets/images/t001-nova/portfolio/jobly.webp` |
| northline-strength / Northline Strength | Portfolio Work / unverified | websites | Fitness, Local Business | https://fitness-site-portfolio.netlify.app/ | `/assets/images/t001-nova/portfolio/northline-strength.webp` |
| ledger-and-loom / Ledger & Loom | Creative Portfolio / unverified | branding | Finance, Brand Identity | /assets/images/t001-nova/portfolio/ledger-and-loom@1280.webp | `/assets/images/t001-nova/portfolio/ledger-and-loom.webp` |
| luma-spritz / Luma Spritz | Concept Project / unverified | ads, branding | Food & Beverage, Concept Work | /assets/images/t001-nova/portfolio/luma-spritz@1080.webp | `/assets/images/t001-nova/portfolio/luma-spritz.webp` |
| sable-row / Sable Row | Creative Portfolio / unverified | ads | Fashion, Social Graphic | /assets/images/t001-nova/portfolio/sable-row@1080.webp | `/assets/images/t001-nova/portfolio/sable-row.webp` |
| alder-and-finch / Alder & Finch | Creative Portfolio / unverified | ads | Local Business, Promo Graphic | /assets/images/t001-nova/portfolio/alder-and-finch@1080.webp | `/assets/images/t001-nova/portfolio/alder-and-finch.webp` |

Source priority follows the user's brief: approved factual source, explicit user facts, current public Volatile Solutions work, legacy link audit and actual legacy artwork. Current public project metadata/URLs were read at https://volatile-solutions.net/portfolio. The Moody Brewer destination was verified at https://themoodybrewer.net/; MetricForge, Glass Admin, Jobly and Northline Strength destinations returned HTTP 200 in this pass. Public software branding does not prove implemented analytics/replay, authentication, backend security, usage, growth or client relationships. Interface figures are illustrative, with explicit image notes on MetricForge/GlassDash.

Current creative metadata was read from https://volatile-solutions.net/js/graphic-portfolio-data.js?v=20260524packages1. Ledger & Loom is a finance identity board; Luma Spritz is a mock beverage ad concept; Sable Row is a menswear social graphic; Alder & Finch is a cleaning-service promotional graphic. Each selected local image was visually inspected. No work was redesigned, no new brand was generated, and no included brand was upgraded to verified client status.

## User-confirmed client relationships

- **The Moody Brewer:** Verified Client Work; Client Website; included with the already-approved production family and claim-free MacBook image. Exact launch contribution comes from the factual source/user; live coffee-shop destination is https://themoodybrewer.net/. No traffic/customer-growth outcome or inferred technology is used.
- **PVD Photography:** user confirms a real client relationship and Anthony's advertising/creative work. Five real client promotional PNGs appeared during the pass under `legacy-assets/Graphic Design/Real Clients/PVD Photographer/`. The selected `PVD Wedding Photography Editorial Collage.png` was visually inspected and prepared without changing the artwork. Included as Verified Client Work / Ads & Social, with a real View Artwork action. Wedding/senior portrait advertising is supported; photography authorship, a website deliverable, campaign results and a client website URL are not inferred.
- **Fros Lawncare:** user newly confirms a real client relationship. Exact deliverable and asset mapping are not supplied and were not found in the legacy inventory or current public data. Clarification requested. `frost-thumbnail.png` depicts JackFrost fitness coaching and must not be substituted for Fros Lawncare. No invented scope or portfolio artwork is included.

PVD's supplied artwork resolves its asset gap. Fros Lawncare remains a confirmed relationship awaiting real source assets and exact scope; no visual entry has been fabricated. Other historical projects were reviewed but not forced into this initial selection. TimeDock/StillPoint lack identifiable assets/links; Cloud Keep's thumbnail carries unverified security/scale claims; other dense/weak or conflicting previews remain deferred. No guessed live URLs or image substitutes.

## Homepage and navigation wiring

- Projects intro: Explore My Work → `/portfolio/`.
- The Moody Brewer homepage card: `/portfolio/#the-moody-brewer`.
- Creative Work homepage card: `/portfolio/?category=creative`.
- ProjectsBlock adds only optional `href` to its existing category/title/image/alt record contract. A real href restores the existing Nova anchor/arrow treatment; missing href stays informational in English. Homepage images, content/title/category/alt and card geometry remain unchanged.
- Shared header/drawer/footer navigation: About Anthony → `/#zespol`; Services → `/#services`; Portfolio → `/portfolio/`. Header/drawer Start a Project → `/#contact`.
- Footer Explore Services → `/#services`; legal URLs stay `/polityka-prywatnosci/` and `/cookies/`; Get in Touch still derives mailto from company.email; four professional socials and tel:+14015456860 remain.
- Portfolio closing CTA: Have a project in mind? / Start a Project → `/#contact`.

## New asset families

The following raw source copies and only their responsive WebP/AVIF families were prepared. Existing masters/derivatives, all legacy source files and favicon assets remain unchanged. Pipeline convention: auto-orient, no enlargement, base filename at 800px, named widths, WebP quality 80 and AVIF quality 50. No global asset-generation command was run.

| Work | Legacy source | New raw copy | New production family / widths |
| --- | --- | --- | --- |
| metricforge | `legacy-assets/portfolio/metric-forge-thumbnail.png` | `src/assets/raw/t001-nova/portfolio/metricforge.png` | `public/assets/images/t001-nova/portfolio/metricforge` in WebP and AVIF; 220, 480, 640, 800px |
| glassdash | `legacy-assets/portfolio/glass-dash-thumbnail.png` | `src/assets/raw/t001-nova/portfolio/glassdash.png` | `public/assets/images/t001-nova/portfolio/glassdash` in WebP and AVIF; 220, 480, 640, 800px |
| jobly | `legacy-assets/portfolio/jobly-thumbnail.png` | `src/assets/raw/t001-nova/portfolio/jobly.png` | `public/assets/images/t001-nova/portfolio/jobly` in WebP and AVIF; 220, 480, 640, 800px |
| northline-strength | `legacy-assets/portfolio/northline-thumbnail.png` | `src/assets/raw/t001-nova/portfolio/northline-strength.png` | `public/assets/images/t001-nova/portfolio/northline-strength` in WebP and AVIF; 220, 480, 640, 800px |
| ledger-and-loom | `legacy-assets/Graphic Design/Brand Kits/Finance/Ledger-and-Loom.png` | `src/assets/raw/t001-nova/portfolio/ledger-and-loom.png` | `public/assets/images/t001-nova/portfolio/ledger-and-loom` in WebP and AVIF; 220, 480, 640, 800, 1080, 1280px |
| luma-spritz | `legacy-assets/Graphic Design/Food-and-Beverage/luma-spritz-water.png` | `src/assets/raw/t001-nova/portfolio/luma-spritz.png` | `public/assets/images/t001-nova/portfolio/luma-spritz` in WebP and AVIF; 220, 480, 640, 800, 1080px |
| sable-row | `legacy-assets/Graphic Design/Social Media Promo/Social Posts/sable-row-clothing.png` | `src/assets/raw/t001-nova/portfolio/sable-row.png` | `public/assets/images/t001-nova/portfolio/sable-row` in WebP and AVIF; 220, 480, 640, 800, 1080px |
| alder-and-finch | `legacy-assets/Graphic Design/Social Media Promo/Promo Flyers/cleaning-company-promo.png` | `src/assets/raw/t001-nova/portfolio/alder-and-finch.png` | `public/assets/images/t001-nova/portfolio/alder-and-finch` in WebP and AVIF; 220, 480, 640, 800, 1080px |
| pvd-photography | `legacy-assets/Graphic Design/Real Clients/PVD Photographer/PVD Wedding Photography Editorial Collage.png` | `src/assets/raw/t001-nova/portfolio/pvd-photography.png` | `public/assets/images/t001-nova/portfolio/pvd-photography` in WebP and AVIF; 220, 480, 640, 800, 1080px |

## Deferred architecture

Future detailHref values may point to separately approved, real case-study routes, including The Moody Brewer. No detail/case-study pages exist in this pass. Future expansion may add richer project records, additional supported categories and CMS/admin integration. Authentication, admin/private dashboard, inquiry database, Neon, lead pipeline, Netlify functions and deployment are not implemented.

## Final Portfolio validation and change isolation

Ten initial records now render, including verified client advertising for PVD Photography. All five filters and the combined Creative Work view pass browser checks, including keyboard Space, active-state/live-count updates, browser back/forward, invalid-query fallback, conflicting deep-link visibility, reduced motion, 44px targets and zero horizontal overflow at 320/390/768/1024/1440px. Homepage card navigation and mobile navigation between both routes pass; browser reports no runtime exceptions.

82 source JSON files parse; Astro/TypeScript has zero errors; the direct static build to a temporary directory passes with five public pages. The 11 focused URL tests pass. Data/page-registry/import/registration/motion/hardcoded checks pass. The atomic audit still flags the preexisting ChecklistItem layout violation and unrelated HeroSplit advisory; targeted mobile audit introduces no new errors. All image/artwork resource paths exist; file actions retain correct file URLs; external project URLs were checked without asserting unverified feature functionality. Noindex remains.

Nine raw copies match their exact legacy source bytes and only their 84 responsive WebP/AVIF derivatives were generated. Every preexisting production/raw image and original legacy artwork/source image remains unchanged. Two original macOS folder metadata files changed during the session (`legacy-assets/.DS_Store`, `legacy-assets/Graphic Design/.DS_Store`) and were left intact; the other 161 original legacy files match the baseline. Five PVD client PNGs and two new folder metadata files appeared during the pass; the new PVD files were separately snapshotted before preparation and remain unchanged. These supplied source additions are distinguished from generated production derivatives. No dependency/lockfile/design-token/license or admin change.

Fros Lawncare is a verified relationship with exact work scope/source artwork still pending. No Fros entry or fake image has been invented.

# Current English-only cleanup — October 8, 2026

The user explicitly approved retiring the Polish site, restoring the existing Nova metrics panel with non-claim placeholders, and removing only footer credits permitted by the actual local license. This decision supersedes earlier bilingual/English-first preservation rules and the prior metric/attribution treatment for this cleanup. All other approved homepage copy, projects/services/FAQ, founder imagery, capability icons, contact/social actions and prepared assets remain unchanged.

## Localization — English-only

The Volatile Solutions site is now English-only. Polish site/version has been retired.

- Removed source routes: `src/pages/pl/index.astro`, `src/pages/pl/cookies.astro`, `src/pages/pl/polityka-prywatnosci.astro`.
- Removed the parallel `pl` branch from `src/data/i18n/nova.json` and `src/data/global/legal.json`.
- Removed unused `src/content/legal/cookies-pl.json` and `src/content/legal/privacy-policy-pl.json` after confirming only the retired routes imported them.
- Removed LanguageSwitch from both floating headers and the mobile drawer, deleted its unused component and removed the empty drawer language wrapper.
- `site.config.mjs` remains SITE_LOCALE=en and build scope is now `/`, `/cookies`, `/polityka-prywatnosci` (404 always included). Shared homepage configuration now has English metadata and no testimonial entry.
- English legal contact now targets `/#contact`; 404 uses English metadata/hover fallbacks and `#contact`.
- Generic locale signatures and reusable legacy component branches remain internally for compatibility. getNovaCopy returns the sole English source; no public route can render a Polish copy variant. Generic section-preview data and disabled fixtures are not a Polish public site and are outside this cleanup.
- Existing internal section anchors #zespol/#realizacje and the English Privacy Policy URL `/polityka-prywatnosci/` are retained. Their historical naming does not imply Polish-language content.

## Retired URL behavior

Existing netlify.toml now puts permanent, forced 301 redirects for `/pl` and `/pl/*` to `/` before general routing rules. They apply after a Netlify deployment; no deployment was performed. Plain Astro dev/preview does not emulate Netlify redirects: retired PL paths return 404 locally and on hosts without those redirect rules. No redirect framework or dependency was introduced.

## Hero metrics

The original black Nova panel, responsive two/four-column layout, typography, spacing and motion are restored through its existing stats array. Hero metric values intentionally set to placeholders pending verified figures.

| Label | Current value |
| --- | --- |
| Projects | — |
| Experience | — |
| Development Hours | — |
| Creative Pieces | — |

Projects, Experience and Development Hours neutralize the old project/years/product-hours labels. Creative Pieces uses the user-approved neutral example for the documented creative body of work instead of the unsupported client-revenue label. These labels do not assert quantities. Edit `en.sections.nova-hero-wireframe.stats` only when verified figures are supplied. No demo number has returned. The trusted-by strip remains disabled: trustedBy is empty and trustItems is an empty array.

## Attribution decision

Inspected LICENSE.md (Nova Free Release License), README.md, ASSETS-LICENSES.md and template documentation. LICENSE.md section 3 explicitly prohibits removing "copyright and author notices". README identifies WebScale as the design/code author and ThemeWagon as distributor; its generic MIT reference does not supersede the repository's specific LICENSE.md restrictions.

- **WebScale retained:** the existing visible "Design and development by WebScale" author notice remains. Removal is not authorized by the inspected license. The local file describes possible future paid products but states no paid/commercial option allowing notice removal.
- **ThemeWagon removed from visible footer:** its separate distributor credit is not an author/copyright notice, and no inspected license clause requires a visible distributor footer link. The rights grant permits adaptation of finished website content. README distribution information and all license/author files are preserved.
- Removed the associated bullet separator and distributor link; no empty credit wrapper remains. Final bottom footer: All rights reserved. / Design and development by WebScale.

## SEO and preservation

Root canonical remains https://volatile-solutions.net/. All public documents are lang=en; no Polish alternate/hreflang/language control is emitted. No PL route or sitemap entry is generated. Indexing stays disabled (noindex, follow). No broader SEO, schema-geography or asset rewrite occurs.

The existing View My Work → #realizacje, Work With Me / Start a Project / Let’s Work Together / Discuss a Project → #contact, Get in Touch → mailto:volatile-solutions@outlook.com, and phone → tel:+14015456860 remain. Four primary professional socials are unchanged. Portfolio/filtering/case-study URLs, inquiry/admin systems, Netlify deployment and Neon remain future work.

## Previous English homepage completion — October 8, 2026

Historical record of the preceding completion pass; current localization, metrics and attribution are superseded by Current English-only cleanup above. This implementation update superseded initial snapshot constraints/current-value notes for the specifically authorized English homepage changes. Remaining detailed inventory rows describe the original template where not expressly updated. Source approvals and exact current copy are recorded in VOLATILE_CONTENT_SOURCE.md, Current English homepage completion. This is a controlled Nova completion pass, not a redesign or future portfolio/admin implementation.

### Current runtime composition and content

English: floating navbar → Nova hero → ProjectsBlock → ServicesHomeBlock → TeamBlock/About Anthony → Faq3Block → Nova footer. `[...page].astro` filters the shared testimonials entry only for the English Nova root; the shared index.json and explicit Polish route stay unchanged. Registry, PageBuilder, section order/variants and motion/scroll engines remain.

English hero uses the approved H1 and both work/contact actions. Empty stats/trust arrays remove demo proof without inventing replacements. About uses the exact approved paragraph/checks, 1 / Founder-led, existing founder image and Let’s Work Together. Four FAQs cover documented projects, Rhode Island/remote clients, existing-site support and initial inquiry steps. Demo banner is disabled in the English shell; stored component/copy and Polish banner remain. Required/uncleared WebScale/ThemeWagon attribution is intentionally retained.

### Functional interactions and socials

| Action | Current destination / behavior |
| --- | --- |
| About Anthony navigation / footer | `#zespol` |
| Services navigation / footer / footer Explore Services | `#services` |
| Selected Work navigation / footer / hero View My Work | `#realizacje` |
| Hero Work With Me / navigation Start a Project / About Let’s Work Together | `#contact` |
| Services / Projects Discuss a Project | `#contact`; replaces each section’s redundant self-link |
| Footer Get in Touch | `mailto:volatile-solutions@outlook.com`, rendered from company.email |
| FloatingBar call | `tel:+14015456860`; existing phone behavior retained |
| Service cards | Informational; no pointer cursor, link arrow or click-specific hover |
| Project cards | Informational in English; existing image hover retained, link wrapper and arrow disabled |

Primary socials are stored in company.json and rendered by the existing drawer helper, also reused in the English footer: Instagram, LinkedIn, GitHub, YouTube, in that order. Facebook remains empty. Personal Instagram stays a secondary approved source record and is omitted from this primary row.

- Business Instagram: https://www.instagram.com/volatile.solutions/
- LinkedIn: https://linkedin.com/in/anthony-volatile
- GitHub: https://github.com/AVolatile
- YouTube: https://www.youtube.com/@anthonyvolatile

### Contract extensions and layout constraints

Development → `code`; Design → `pen-nib`; Business / Strategy → `compass`. TeamBlock accepts an optional capabilities array of label/icon pairs. The meaningful list is named Capabilities, labels are visible, and icon wrappers are aria-hidden. English has no teammate avatars; the legacy Polish avatar branch remains intact. Existing section ID, founder image, metric row, layout and motion remain.

ProjectsBlock accepts locale and uses a non-link wrapper without the arrow in English; item data remains category/title/image/alt. ServicesHomeBlock keeps the four service/number/icon records while disabling English pointer/arrow/click-hover classes. The approved service title may wrap in the informational English branch. Its section introduction also wraps within the existing column to prevent observed heading/CTA overlap at 1024px. Both preserve the legacy Polish branch. NovaFooterBlock derives English mailto from company.email and reuses the same social helper in a compact English footer row. Global fallback description reflects Website Support & Optimization, with no indexing, schema geography or OG asset change.

English fixed-header top is 0 after banner removal; Polish keeps 2.75rem. Existing Lenis header offset and native section scroll-margin-top are retained and browser checked. Prepared responsive image families and all legacy sources must remain byte-identical.

### Future dependencies

- Dedicated broader portfolio page and category filtering.
- Creative Work collection destination, preserving body-of-work classification and uncertain individual client status.
- The Moody Brewer project/case-study destination, using verified project evidence only.
- Independent per-project URL support: the current item contract remains category/title/image/alt only.
- Legacy contact-form migration, inquiry intake, private authenticated admin dashboard, lead/prospect organization, pipeline/status management and notes/progress tracking.
- Netlify deployment and a Neon database-backed lead/client pipeline.

These are future dependencies, not implemented routes, features, services or deployment changes. No new dependency is introduced. The earlier Explore My Work portfolio intent is retained for that future destination; no fake /portfolio URL is created.

## How to read this map

- Array indices are zero-based. Empty strings are shown as `""`. Values are JSON-quoted so punctuation and trailing spaces remain identifiable.
- “Safe data-only replacement: Yes” means the existing contract accepts the value without component or CSS changes, subject to truthful supplied information, appropriate assets, and existing layout constraints. It is not blanket authorization to change targets, counts, indexing, tracking, or attribution.
- “No — protected” means the field participates in a structural/presentation contract and remains unchanged in initial migration. “Yes — stored only” identifies a value that can be edited but is not displayed by the active component.
- All localized tables include current English and Polish values. Their source and localization status are stated immediately above the table and apply to every row. Unknown Polish translations must be flagged, not invented.
- Active homepage data is `src/data/i18n/nova.json`. `PageBuilder.astro` merges variant props, matching section JSON, then localized overrides **shallowly**. Arrays and nested objects replace entire values. Section JSON is base/preview data, not the authoritative current EN/PL copy.
- Navigation and footer are rendered by `Layout.astro`; `PageBuilder` excludes those shell entries. Public site uses SITE_LOCALE=en; all three source PL routes and switch controls were retired by the current cleanup.
- Scope includes the homepage, its active global shell and metadata, active legal pages, 404, and conditionally available shared overlays. Disabled blog/catalog/QA routes and unrelated library fixtures are excluded.
- Constraints below come from source inspection, not a browser measurement. No install, build, or development server was run.

Active composition, protected during initial migration:

| Page entry | Component / owner | Source of rendered content |
| --- | --- | --- |
| `navbar / floating` | Floating navbar / Layout | `<locale>.navigation`, company logo |
| `hero / nova` | NovaHeroResponsiveBlock | `<locale>.sections.nova-hero-wireframe` |
| `portfolio / nova` | ProjectsBlock | `<locale>.sections.nova-projects` |
| `novaServices / default` | ServicesHomeBlock | `<locale>.sections.nova-services` |
| `novaTeam / default` | TeamBlock | `<locale>.sections.nova-team` |
| `faq3 / default` | Faq3Block | `<locale>.sections.faq3` |
| `testimonials / v2` | TestimonialV2Block — Polish only; English root filters this entry | No public testimonial entry; generic component/base data retained inactive |
| `footer / nova` | NovaFooterBlock / Layout | `<locale>.footer` |

# Section 1 — Global company identity

Source: `src/data/global/company.json`. There is no locale-specific company object. Its current values are shared by English and Polish routes. The active footer does not independently print the company name, email, or street address.


| Source file | JSON path/key | Current value | Intended real-world information | Used by | Localized: yes/no | Safe data-only replacement: yes/no | Notes/constraints |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `src/data/global/company.json` | `fullName` | `"Nova Creative Agency"` | Full business identity | LocalBusiness.name; privacy-policy {{COMPANY_FULL_NAME}} | No | Yes | Schema chooses fullName before name. Supply actual identity; no inferred registration status. |
| `src/data/global/company.json` | `name` | `"Nova"` | Short public business name | Navbar/404/legal-page Logo; schema fallback; {{COMPANY_NAME}} legal placeholders | No | Yes | Without logoImage the navbar prints name.toUpperCase(); wider names affect nav fit. Also becomes logo accessible text. |
| `src/data/global/company.json` | `branding.icon` | `"ph-star"` | Existing icon configuration | No active homepage logo consumer found | No | Yes — stored only | Logo.astro does not render this key. Changing it does not change favicon or visible wordmark. |
| `src/data/global/company.json` | `branding.font` | `"Satoshi"` | Existing brand-font configuration | No active homepage font consumer found | No | No — protected typography | The runtime font comes from Nova tokens/CSS, not this JSON key. Retain Satoshi. |
| `src/data/global/company.json` | `branding.tagline` | `"Websites for ambitious brands"` | Existing business tagline slot | Not rendered by the active Logo component | No | Yes — stored only | showTagline is false, and no tagline markup is rendered. Not the homepage hero description. |
| `src/data/global/company.json` | `branding.logoImage` | `""` | Public path to supplied business logo asset | Logo.astro in static/fixed navbar and shared pages | No | Yes — asset required | Empty currently selects uppercase wordmark. Image uses width/height 512 and compact h-11/lg:h-14 with w-auto/object-contain. Do not change geometry. |
| `src/data/global/company.json` | `branding.favicon` | `"/favicon.svg"` | Public path to supplied favicon asset | Layout icon link on all pages | No | Yes — asset required | Current /favicon.svg is declared with image/png by the custom branch; note mismatch, do not fix rendering code here. PNG/touch/shortcut fallbacks appear only when this key is empty. |
| `src/data/global/company.json` | `branding.logoSuffix` | `"Logo"` | Logo accessibility suffix | Logo image alt: name + space + logoSuffix | No | Yes | Only affects image-logo branch; not visible in the current wordmark branch. |
| `src/data/global/company.json` | `address` | `"123 Example Street, 00-001 Warsaw"` | Actual street/business address | Privacy body substitution; LocalBusiness.address.streetAddress | No | Yes | Current string includes postal code/city while schema also stores those separately. Preserve keys and supply verified information. |
| `src/data/global/company.json` | `zipCode` | `"00-001"` | Actual postal code | Schema postalCode; supported legal {{COMPANY_ZIP}} substitution | No | Yes | String; shared across locales. Legal replacement exists even where the current body does not include this token. |
| `src/data/global/company.json` | `city` | `"Warsaw"` | Actual business locality | Schema addressLocality; privacy {{COMPANY_CITY}} | No | Yes | Coordinate defaults and country in schema are separate and do not derive from city. |
| `src/data/global/company.json` | `phone` | `"+48 123 456 789"` | Actual public contact phone | FloatingBar tel: link; schema telephone | No | Yes | FloatingBar strips non-digits and prepends '+'. Empty hides the phone control. No form recipient configuration follows from this value. |
| `src/data/global/company.json` | `email` | `"contact@yourcompany.com"` | Actual public contact email | Schema email; privacy {{COMPANY_EMAIL}} and generated mailto link | No | Yes | Active Nova footer does not display email. Bundled PHP recipient is separate; changing this does not configure delivery. |
| `src/data/global/company.json` | `hours` | `"Mon-Fri: 8:00 AM - 9:00 PM"` | Actual business-hours information | LocalBusiness openingHoursSpecification | No | Yes — format constrained | Current parser splits ' - ' then ': '; current effective opens='8:00 AM', closes='9:00 PM'. Weekdays are hardcoded separately. Report incompatible hours rather than modifying renderer. |
| `src/data/global/company.json` | `nip` | `"1234567890"` | Existing tax-identity slot | Privacy {{COMPANY_NIP}} substitution | No | Yes — applicability required | Do not infer Polish registration or substitute unrelated identifiers as equivalent. |
| `src/data/global/company.json` | `krs` | `"0000123456"` | Existing company-register slot | Privacy {{COMPANY_KRS}} substitution | No | Yes — applicability required | Do not invent a registration number; policy wording may need later supplied content. |
| `src/data/global/company.json` | `regon` | `""` | Existing statistical-register slot | Privacy {{COMPANY_REGON}} substitution | No | Yes — applicability required | Current empty string; do not invent a registration number. |
| `src/data/global/company.json` | `siteUrl` | `"https://yourcompany.com"` | Actual public website URL | Legal {{SITE_URL}} substitution; Layout fallback if no environment/Astro.site | No | Yes — synchronization required | Must align with SITE_URL and URL overrides. Current value differs from configured Astro site. Does not independently control schema or sitemap. |
| `src/data/global/company.json` | `smtp.smtpHost` | `"smtp.example.com"` | Bundled SMTP placeholder, not public business content | No active homepage identity/form configuration consumer found | No | No — transport outside scope | Stored only; not read by bundled public/send-form.php. Do not configure transport during identity migration. |
| `src/data/global/company.json` | `smtp.smtpPort` | `587` | Bundled SMTP placeholder port | No active homepage consumer found | No | No — transport outside scope | Number; PHP handler has separate configuration. |
| `src/data/global/company.json` | `smtp.smtpUser` | `"noreply@yourcompany.com"` | Bundled SMTP placeholder account | No active homepage consumer found | No | No — transport outside scope | Not a public contact-email source. |
| `src/data/global/company.json` | `smtp.smtpPass` | `""` | Bundled SMTP password placeholder | No active homepage consumer found | No | No — secret/transport outside scope | Empty; never populate client-facing JSON with credentials. |
| `src/data/global/company.json` | `socials.facebook` | `""` | Verified Facebook profile URL | Mobile drawer and schema.sameAs when nonempty/non-# | No | Yes | Drawer uses fixed Facebook label/icon. Also inherited by legal/404 shell. |
| `src/data/global/company.json` | `socials.instagram` | `""` | Verified Instagram profile URL | Mobile drawer and schema.sameAs when nonempty/non-# | No | Yes | Drawer uses fixed Instagram label/icon. |
| `src/data/global/company.json` | `socials.youtube` | `""` | Verified YouTube profile URL | Mobile drawer and schema.sameAs when nonempty/non-# | No | Yes | Drawer uses fixed YouTube label/icon. |
| `src/data/global/company.json` | `socials.twitter` | `""` | Verified X/Twitter profile URL | Schema.sameAs; excluded from active drawer platform list | No | Yes — schema only | Setting this does not add an X link to active navigation/footer. Other platforms need a reported rendering limitation. |

No additional company fields are proposed. Effective hardcoded schema defaults are mapped in Section 2. The completion pass adds an English footer row by reusing the drawer social helper; LinkedIn/GitHub are now supported.

# Section 2 — SEO and site identity

The root and Polish homepages explicitly pass localized page title/description to Layout. These control document title, description, Open Graph title/description, Twitter title/description, and Open Graph image alt. The actual hero H1 comes from hero `heading` plus `headingAccent`, not `page.heading`.

**Source file:** `src/data/i18n/nova.json`. **Localized:** yes; `<locale>` is exactly `en` or `pl`. Each row identifies both complete JSON paths through this substitution. **Used by:** Root/pl homepage routes, PageBuilder and Layout.

| JSON path/key | Current EN value | Historical PL value (retired) | Intended real-world information | Used by / effects elsewhere | Safe data-only replacement | Notes/constraints |
| --- | --- | --- | --- | --- | --- | --- |
| `<locale>.page.title` | `"Anthony Volatile \| Developer, Designer & Digital Product Builder"` | `"Nova, strony internetowe dla ambitnych marek"` | Localized homepage metadata title | Homepage routes → Layout → document/OG/Twitter metadata | Yes | Preserve supported strings; no separate social-title/description fields are active. |
| `<locale>.page.description` | `"Founder-led websites, digital products, branding and visual design from Volatile Solutions, serving Rhode Island and remote clients."` | `"Tworzymy nowoczesne strony internetowe, które wzmacniają wizerunek, przyciągają klientów i wspierają rozwój biznesu."` | Localized homepage metadata description | Homepage routes → Layout → document/OG/Twitter metadata | Yes | Preserve supported strings; no separate social-title/description fields are active. |
| `<locale>.page.heading` | `"Developer, Designer & Digital Product Builder"` | `"Nowe możliwości dla ambitnych marek"` | Page-level heading configuration | Catch-all resolves it; PageBuilder passes pageHeading; active Nova hero does not consume pageHeading | Yes — no active H1 effect | Keep consistent with supplied positioning; change hero fields separately. |


| Source file | JSON path/key | Current value | Intended real-world information | Used by | Localized: yes/no | Safe data-only replacement: yes/no | Notes/constraints |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `src/data/global/seo.json` | `defaultTitle` | `"Nova, websites for ambitious brands"` | Default site/page title | Layout fallback; WebSite.name schema | No | Yes | Homepages override with localized page.title. Keep site naming synchronized. |
| `src/data/global/seo.json` | `defaultDescription` | `"We create modern websites that strengthen your image, attract clients and support business growth."` | Default site/page description | Layout fallback; LocalBusiness.description when company.description absent | No | Yes | Homepages override visible metadata. Schema currently uses this English global description on both locales. |
| `src/data/global/seo.json` | `defaultOgImage` | `"/og-image.png"` | Public path to supplied social preview asset | Layout og:image and twitter:image | No | Yes — asset required | Current PNG is 1200×630. Schema instead uses fixed /og-image.png. Synchronize both if filename ever changes. |
| `src/data/global/seo.json` | `index` | `false` | Existing indexing setting | Layout robots meta | No | No — explicit indexing instruction required | false yields noindex; do not enable indexing during content migration. |
| `src/data/global/seo.json` | `follow` | `true` | Existing link-following setting | Layout robots meta | No | No — indexing policy outside ordinary content replacement | true currently combines with noindex. Retain. |
| `src/data/global/seo.json` | `analytics.googleAnalyticsId` | `""` | Optional verified analytics identifier | Layout analytics config; tracking-dependent cookie banner | No | Yes — separately scoped tracking setup | Empty currently. PUBLIC_GA4_MEASUREMENT_ID can override; not a secret and not copy. |
| `src/data/global/seo.json` | `analytics.googleTagManagerId` | `""` | Optional verified tag-manager identifier | Layout analytics config and tracking behavior | No | Yes — separately scoped tracking setup | Empty currently. Changing tracking affects conditional consent UI. |
| `src/data/global/seo.json` | `analytics.facebookPixelId` | `""` | Optional verified pixel identifier | Layout analytics config and tracking behavior | No | Yes — separately scoped tracking setup | Empty currently; do not infer an account. |
| `src/data/global/seo.json` | `analytics.clarityId` | `""` | Optional verified Clarity identifier | Layout analytics config; tracking-dependent cookie banner | No | Yes — separately scoped tracking setup | Empty currently. PUBLIC_CLARITY_ID can override. |


| Source file / owner | Key or effective metadata field | Current value / computation | Intended information and use | Localized | Safe data-only replacement | Constraints / synchronization |
| --- | --- | --- | --- | --- | --- | --- |
| site.config.mjs | SITE_URL | `"https://webscale.pl/preview/nova/"` | Public deployment URL; Astro.site, sitemap, robots sitemap URL, and schema siteBase | No | Yes — configuration value only | Synchronize company.siteUrl and URL overrides; domain unchanged in this task. |
| site.config.mjs | SITE_LOCALE | `"en"` | Public document/homepage locale and shared shell locale | No | English-only | Polish routes and controls retired; generic locale APIs remain internally. |
| site.config.mjs | ACTIVE_TEMPLATE | `"nova"` | Active template identity and localized override behavior | No | No — protected | Keep Nova architecture/profile; not business branding. |
| site.config.mjs | BUILD_SCOPE.pages | `["/","/portfolio","/cookies","/polityka-prywatnosci"]` | Production route scope | No | No — protected | Keep scope and disabled routes. |
| astro.config.mjs | site / output | SITE_URL / 'static' | Astro canonical-site configuration and static build | No | No — protected architecture | Edit domain at site.config.mjs when explicitly supplied; do not rewrite Astro config. |
| Layout.astro / environment | PUBLIC_SITE_URL | Unset in committed .env.example; actual deployment environment not inspected | Highest-priority Layout publicSiteUrl override | No | No — deployment setup | Layout selects environment → Astro.site → company.siteUrl. Schema and sitemap do not automatically use this override. |
| Layout.astro / environment | PUBLIC_BASE_PATH | Unset in committed .env.example; build-preview sets 'preview/nova' | Canonical/asset path prefix | No | No — deployment setup | Otherwise Layout derives base from publicSiteUrl pathname or BASE_URL. Localization helpers use PUBLIC_BASE_PATH/BASE_URL, not SITE_URL pathname. |
| scripts/build-preview.mjs | PUBLIC_SITE_URL / PUBLIC_BASE_PATH | `"https://webscale.pl/preview/nova/"` / `"preview/nova"` | Existing isolated WebScale preview configuration | No | No — protected build script | Report inherited domain/prefix; changing site.config alone does not change this script. |
| Layout.astro / environment | NETLIFY / STAGING | true comparison; actual environment unknown | Forces default noIndex on staging | No | No — indexing policy | Even Netlify production satisfies NETLIFY==='true'; report behavior before any later indexing work. |
| Layout.astro | canonical / og:url | public origin + normalized base + current route pathname | Correct public URL for each page | By route | Derived | Retain generator and coordinate URL sources. With committed site URL, root canonical resolves https://webscale.pl/preview/nova/ and Polish https://webscale.pl/preview/nova/pl/ absent overrides. |
| Layout.astro | og:image / twitter:image | Absolute defaultOgImage URL through publicAsset | Shared social preview image | No | Derived from existing data | Default resolves https://webscale.pl/preview/nova/og-image.png absent overrides. No locale-specific image currently configured. |
| Layout.astro | og:type / twitter:card | `"website"` / `"summary_large_image"` | Social-preview type | No | No — renderer constants | No content field for changing these. |
| Layout.astro | og:image:width / height | `"1200"` / `"630"` | Declared preview dimensions | No | No — renderer constants | Keep replacement image compatible. |
| Layout.astro | html.lang / og:locale | en → en_US; pl → pl_PL | Page language metadata | Yes — derived | Derived | Preserve both route locales and supplied translation parity. |
| Layout.astro | meta generator | Astro.generator | Build-generated framework metadata | No | No — generated | Not business copy. |
| src/pages/robots.txt.ts | robots.txt body | User-agent: *; Allow: /; Disallow: /dev/; Disallow: /qa/; Sitemap: SITE_URL-relative sitemap-index.xml | Crawler instructions and sitemap discovery | No | No — protected generator | Separate from noindex meta; do not change indexing. |
| astro.config.mjs / @astrojs/sitemap | sitemap metadata | Uses SITE_URL; excludes /dev/ and /qa/; lastmod is build time | Public route discovery | No | Derived | No hand-edited sitemap source. |
| public/og-image.png | Embedded image lettering | `"Twoja Firma"`; `"Profesjonalne usługi dla Twojego biznesu"` | Actual social preview business text baked into raster | No | No — asset replacement required | Observed by inspecting current PNG, not inferred from company.name. Updating JSON does not rewrite pixels. |

## Existing schema output

Source: `src/components/ui/atoms/Schema.astro`. Active default output is LocalBusiness plus WebSite JSON-LD on homepage/legal/404 layouts. The affiliate branch is not selected by active pages and is excluded.


| Schema field | Current effective value / source | Real-information role | Localized | Safe data-only replacement | Dependencies / constraints |
| --- | --- | --- | --- | --- | --- |
| LocalBusiness.@context / @type | `"https://schema.org"` / `"LocalBusiness"` | Existing schema identity | No | No — renderer constants | Do not reinterpret business type during migration. |
| LocalBusiness.name | `"Nova Creative Agency"` (fullName \|\| name) | Real business name | No | Yes — company data | Also synchronize displayed wordmark and legal identity. |
| LocalBusiness.description | `"We create modern websites that strengthen your image, attract clients and support business growth."` | Business description | No | Yes — global SEO data | Current company object has no description field; do not add a new field in this map. |
| LocalBusiness.image | `"https://webscale.pl/preview/nova/og-image.png"` | Business preview asset | No | Yes — same-name asset replacement | Filename is fixed in schema; defaultOgImage renaming alone is insufficient. |
| LocalBusiness.@id / url; WebSite.url | `"https://webscale.pl/preview/nova"` | Public business/site identity | No | Yes — SITE_URL configuration | Schema strips final slash; doesn't use Layout PUBLIC_SITE_URL override. |
| LocalBusiness.telephone / email | company.phone / company.email (values in Section 1) | Public business contact | No | Yes — company data | Not form delivery. |
| LocalBusiness.priceRange | `"$$"` | Existing price-range default | No | No — fallback constant | No priceRange field exists in current company JSON; do not invent one. |
| LocalBusiness.address.streetAddress / locality / postalCode | company.address / city / zipCode (Section 1) | Actual location | No | Yes — company data | Country and geographic defaults are independent. |
| LocalBusiness.address.addressCountry | `"PL"` | Existing country assumption | No | No — renderer constant | If incompatible with supplied real information, report before any rendering-code change. |
| LocalBusiness.geo.latitude / longitude | 52.4064 / 16.9252 | Existing coordinate defaults | No | No — fallback constants | No geo object exists in current company JSON. Do not assume coordinates describe Anthony's business. |
| openingHoursSpecification.dayOfWeek | `["Monday","Tuesday","Wednesday","Thursday","Friday"]` | Existing operating-day assumption | No | No — renderer constant | Changing hours string cannot change these weekdays. |
| openingHoursSpecification.opens / closes | `"8:00 AM"` / `"9:00 PM"` | Current parser result from company.hours | No | Yes — format-constrained company data | Missing parse components fall back to 08:00 / 16:00; supplied schedules may exceed this parser. |
| LocalBusiness.sameAs | `[]` | Verified profile URLs | No | Yes — existing socials keys | Empty URLs are filtered out; schema social coverage differs from drawer coverage. |
| WebSite.@context / @type / name | `"https://schema.org"` / `"WebSite"` / seo.defaultTitle | Site identity | No | Yes — name via SEO only | Context/type remain renderer constants. |

Synchronization groups: (1) company `name/fullName`, localized metadata and actual logo/OG assets; (2) `SITE_URL`, `company.siteUrl`, deployed URL overrides, base paths, schema, canonical, sitemap and legal-domain substitution; (3) `seo.defaultTitle/defaultDescription` and both localized `page.title/page.description`; (4) `defaultOgImage` and the schema's fixed preview asset. Existing mismatches are documented, not repaired.

Page JSON also contains base SEO/heading values; they are not active localized homepage copy:


| Source file | JSON path/key | Current value | Intended real-world information | Used by | Localized: yes/no | Safe data-only replacement: yes/no | Notes/constraints |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `src/data/pages/index.json` | `seo.title` | `"Nova, strony internetowe dla ambitnych marek"` | Base homepage metadata | Catch-all fallback; localized page object takes precedence | No | Yes — base only | Updating this alone does not change current EN/PL homepage metadata or hero H1. |
| `src/data/pages/index.json` | `seo.description` | `"Tworzymy nowoczesne strony internetowe, które wzmacniają wizerunek, przyciągają klientów i wspierają rozwój biznesu."` | Base homepage metadata | Catch-all fallback; localized page object takes precedence | No | Yes — base only | Updating this alone does not change current EN/PL homepage metadata or hero H1. |
| `src/data/pages/index.json` | `heading` | `"Nowe możliwości dla ambitnych marek"` | Base page heading | Catch-all fallback; localized page object takes precedence | No | Yes — base only | Updating this alone does not change current EN/PL homepage metadata or hero H1. |

# Section 3 — Navigation

Active owners: `Navbar/layouts/Floating.astro`, `MenuToggle.astro`, `LanguageSwitch.astro`, and `Navbar/shared/MobileDrawer.astro`. The generic `src/data/navigation/header.json` is not the active floating-nav source.

Both static and scroll-fixed desktop headers use the same localized menu/CTA. The drawer repeats menu labels and CTA label/target; it does not display the CTA hover label. Desktop menu appears at lg; CTA link is hidden below sm; menu toggle/drawer provide the smaller-screen equivalent. Long labels consume fixed horizontal nav space; CTA text-roll wrappers are nowrap.

**Source file:** `src/data/i18n/nova.json`. **Localized:** yes; `<locale>` is exactly `en` or `pl`. Each row identifies both complete JSON paths through this substitution. **Used by:** Static/fixed floating navbar, mobile drawer and language switch.

| JSON path/key | Current EN value | Historical PL value (retired) | Intended real-world information | Used by / effects elsewhere | Safe data-only replacement | Notes/constraints |
| --- | --- | --- | --- | --- | --- | --- |
| `<locale>.navigation.menu[0].label` | `"About Anthony"` | `"O nas"` | Visible existing navigation or CTA label | Static/fixed navbar and matching mobile drawer link | Yes | Visible copy only; preserve matching href. Four menu entries currently. |
| `<locale>.navigation.menu[0].href` | `"#zespol"` | `"#zespol"` | Existing navigation destination | Navigation, hero/footer links, and the matching section ID | No — protected target | A URL field is supported by data, but initial migration preserves this structural anchor; visible-label changes do not authorize target changes. |
| `<locale>.navigation.menu[1].label` | `"Services"` | `"Usługi"` | Visible existing navigation or CTA label | Static/fixed navbar and matching mobile drawer link | Yes | Visible copy only; preserve matching href. Four menu entries currently. |
| `<locale>.navigation.menu[1].href` | `"#services"` | `"#uslugi"` | Existing navigation destination | Navigation, hero/footer links, and the matching section ID | No — protected target | A URL field is supported by data, but initial migration preserves this structural anchor; visible-label changes do not authorize target changes. |
| `<locale>.navigation.menu[2].label` | `"Selected Work"` | `"Realizacje"` | Visible existing navigation or CTA label | Static/fixed navbar and matching mobile drawer link | Yes | Visible copy only; preserve matching href. Four menu entries currently. |
| `<locale>.navigation.menu[2].href` | `"#realizacje"` | `"#realizacje"` | Existing navigation destination | Navigation, hero/footer links, and the matching section ID | No — protected target | A URL field is supported by data, but initial migration preserves this structural anchor; visible-label changes do not authorize target changes. |
| `<locale>.navigation.menu[3].label` | Not rendered in English | `"Opinie"` | Visible existing navigation or CTA label | Static/fixed navbar and matching mobile drawer link | Yes | Visible copy only; preserve matching href. Four menu entries currently. |
| `<locale>.navigation.menu[3].href` | Not rendered in English | `"#opinie"` | Existing navigation destination | Navigation, hero/footer links, and the matching section ID | No — protected target | A URL field is supported by data, but initial migration preserves this structural anchor; visible-label changes do not authorize target changes. |
| `<locale>.navigation.cta.label` | `"Start a Project"` | `"Rozpocznij projekt"` | Visible existing navigation or CTA label | Static/fixed navbar and matching mobile drawer link | Yes | Visible copy only; preserve matching href. Four menu entries currently. |
| `<locale>.navigation.cta.hoverLabel` | `"Let’s Talk"` | `"Porozmawiajmy"` | Short alternate CTA label | Both desktop nav CTA hover states | Yes | Text-roll effect; short nowrap label. Not printed as drawer CTA text. |
| `<locale>.navigation.cta.href` | `"#contact"` | `"#kontakt"` | Existing navigation destination | Navigation, hero/footer links, and the matching section ID | No — protected target | A URL field is supported by data, but initial migration preserves this structural anchor; visible-label changes do not authorize target changes. |
| `<locale>.navigation.aria.menuOpen` | `"Open navigation menu"` | `"Otwórz menu nawigacji"` | Accessible navigation/control name | MenuToggle / MobileDrawer semantics | Yes | Keep meaning aligned with control; menuClose, drawer and navMain identify existing controls. |
| `<locale>.navigation.aria.menuClose` | `"Close menu"` | `"Zamknij menu"` | Accessible navigation/control name | MenuToggle / MobileDrawer semantics | Yes | Keep meaning aligned with control; menuClose, drawer and navMain identify existing controls. |
| `<locale>.navigation.aria.menuExpand` | `"Expand submenu"` | `"Rozwiń podmenu"` | Accessible submenu-expand label | MobileDrawer only if an item has children | Yes — conditional | Current four menu records have no children; no expand control is currently rendered. |
| `<locale>.navigation.aria.navMain` | `"Main navigation"` | `"Nawigacja główna"` | Accessible navigation/control name | MenuToggle / MobileDrawer semantics | Yes | Keep meaning aligned with control; menuClose, drawer and navMain identify existing controls. |
| `<locale>.navigation.aria.drawer` | `"Navigation menu"` | `"Menu nawigacji"` | Accessible navigation/control name | MenuToggle / MobileDrawer semantics | Yes | Keep meaning aligned with control; menuClose, drawer and navMain identify existing controls. |
| `<locale>.navigation.languageLabel` | `"Choose language"` | `"Wybierz język"` | Accessible language-selector name | LanguageSwitch in header and drawer | Yes | Visible language codes are hardcoded PL/EN; this is an aria-label, not the visible code. |


| Structural target / ID | EN | PL | Owner and meaning | Replacement status |
| --- | --- | --- | --- | --- |
| Logo home link | / | /pl/ | getNovaNavigationPath('/', locale); base-aware | Protected locale route |
| Language-code link text | PL / EN | PL / EN | LanguageSwitch hardcoded text; links getNovaLocalePath('pl'/'en') | No JSON field; protected |
| About/team anchor | #zespol | #zespol | TeamBlock id='zespol' | Protected; translated label does not rename ID |
| Service anchor | #services | #uslugi | ServicesHomeBlock locale-specific id | Protected |
| Projects anchor | #realizacje | #realizacje | ProjectsBlock id='realizacje' | Protected |
| Reviews anchor | #opinie | #opinie | TestimonialV2Block id='opinie' | Protected |
| Contact anchor | #contact | #kontakt | NovaFooterBlock locale-specific footer ID | Protected |
| Hero / FAQ IDs | hero / faq3 | hero / faq3 | Component defaults, not menu entries | Protected |
| Drawer ID / aria-controls | site-nav-drawer | site-nav-drawer | MobileDrawer and MenuToggle link | Protected interaction ID |

Fragment links are preserved as-is by `getNovaNavigationPath`. On legal pages the same shell can therefore target a nonexistent in-page team/project section; that existing limitation is not changed here. Drawer socials come from Section 1, with fixed Facebook/Instagram/YouTube names and icons; the completion pass now renders the four approved primary socials, with LinkedIn/GitHub added to the existing helper.

# Section 4 — Hero

Owner: `src/components/registry/hero/NovaHeroResponsiveBlock.astro`; registry `hero / nova` → dataKey `nova-hero-wireframe`. The following localized values override base `nova-hero-wireframe.json`.

**Source file:** `src/data/i18n/nova.json`. **Localized:** yes; `<locale>` is exactly `en` or `pl`. Each row identifies both complete JSON paths through this substitution. **Used by:** NovaHeroResponsiveBlock; other sections do not derive text from these fields.

| JSON path/key | Current EN value | Historical PL value (retired) | Intended real-world information | Used by / effects elsewhere | Safe data-only replacement | Notes/constraints |
| --- | --- | --- | --- | --- | --- | --- |
| `<locale>.sections.nova-hero-wireframe.eyebrow` | `"STRATEGY / DESIGN / TECHNOLOGY"` | `"STRATEGIA / DESIGN / TECHNOLOGIA"` | Short existing discipline/kicker text | Hero text sequence | Yes | Uppercase tracked text, 0.18em tracking. No new badges or fields. |
| `<locale>.sections.nova-hero-wireframe.heading` | `"Developer, Designer &"` | `"Nowe możliwości dla"` | First portion of the real headline | Visible homepage H1 | Yes | Joined with one space to headingAccent; maximum 42rem, tight line height/tracking. |
| `<locale>.sections.nova-hero-wireframe.headingAccent` | `"Digital Product Builder"` | `"ambitnych marek"` | Highlighted portion of the same headline | Copper span within the single H1 | Yes | Not a second heading; preserve two-part hierarchy and existing styling. |
| `<locale>.sections.nova-hero-wireframe.description` | `"I build websites, digital products, and visual experiences that connect thoughtful design with practical development. Explore my work or get in touch about a project or opportunity."` | `"Tworzymy nowoczesne strony internetowe, które wzmacniają wizerunek, przyciągają klientów i realnie wspierają rozwój biznesu."` | Short real introduction supporting headline | Hero lead paragraph | Yes | max-width 38rem normally, 25rem at md, 38rem at lg; no fixed character cap. |
| `<locale>.sections.nova-hero-wireframe.primaryCTA.label` | `"View My Work"` | `"Rozpocznij projekt"` | Visible primary action label | Existing primary Button | Yes | Full width below sm; nowrap label/text-roll; use supplied action intent. |
| `<locale>.sections.nova-hero-wireframe.primaryCTA.href` | `"#realizacje"` | `"#kontakt"` | Existing navigation destination | Navigation, hero/footer links, and the matching section ID | No — protected target | A URL field is supported by data, but initial migration preserves this structural anchor; visible-label changes do not authorize target changes. |
| `<locale>.sections.nova-hero-wireframe.secondaryCTA.label` | `"Work With Me"` | `"Poznaj nas"` | Visible secondary action label | Existing outline Button | Yes | Full width below sm; nowrap label/text-roll; preserve target. |
| `<locale>.sections.nova-hero-wireframe.secondaryCTA.href` | `"#contact"` | `"#zespol"` | Existing navigation destination | Navigation, hero/footer links, and the matching section ID | No — protected target | A URL field is supported by data, but initial migration preserves this structural anchor; visible-label changes do not authorize target changes. |
| `<locale>.sections.nova-hero-wireframe.trustedBy` | `""` | `"Zaufali nam"` | Label describing verified trust relationships | Hero trust strip | Yes — evidence required | Small muted text; five adjacent names, not a new logo grid. |
| `<locale>.sections.nova-hero-wireframe.trustItems[0]` | Not rendered in English | `"MODO"` | Verified organization/brand name appropriate to the trust claim | Hero text-brand strip only | Yes — relationship evidence required | Plain string, not logo/image object; five entries. No inferred clients or endorsements. |
| `<locale>.sections.nova-hero-wireframe.trustItems[1]` | Not rendered in English | `"LUMI"` | Verified organization/brand name appropriate to the trust claim | Hero text-brand strip only | Yes — relationship evidence required | Plain string, not logo/image object; five entries. No inferred clients or endorsements. |
| `<locale>.sections.nova-hero-wireframe.trustItems[2]` | Not rendered in English | `"KOVO"` | Verified organization/brand name appropriate to the trust claim | Hero text-brand strip only | Yes — relationship evidence required | Plain string, not logo/image object; five entries. No inferred clients or endorsements. |
| `<locale>.sections.nova-hero-wireframe.trustItems[3]` | Not rendered in English | `"NOMA"` | Verified organization/brand name appropriate to the trust claim | Hero text-brand strip only | Yes — relationship evidence required | Plain string, not logo/image object; five entries. No inferred clients or endorsements. |
| `<locale>.sections.nova-hero-wireframe.trustItems[4]` | Not rendered in English | `"ASPEKT"` | Verified organization/brand name appropriate to the trust claim | Hero text-brand strip only | Yes — relationship evidence required | Plain string, not logo/image object; five entries. No inferred clients or endorsements. |
| `<locale>.sections.nova-hero-wireframe.image` | `"/assets/images/t001-nova/t001-nova-hero-anthony-volatile.webp"` | `"/assets/images/t001-nova/t001-nova-hero.webp"` | Path to supplied hero photograph | SmartImage in hero figure | Yes — asset required | 900×1125 attributes, object-cover and existing blob clip; derivative family must match. |
| `<locale>.sections.nova-hero-wireframe.imageAlt` | `"Anthony Volatile, founder of Volatile Solutions"` | `"Strateg pracujący przy laptopie"` | Accurate hero-image alternative text | Hero img alt | Yes | Describe actual supplied image; do not assert fictional people or identity. |
| `<locale>.sections.nova-hero-wireframe.stats[0].value` | `"—"` | `"2000+"` | Verified compact statistic value | Hero metric cell only | Yes — evidence required | String, not numeric counter. Keep four cells; do not invent outcomes, revenue or experience. |
| `<locale>.sections.nova-hero-wireframe.stats[0].label` | `"Projects"` | `"Zrealizowanych projektów"` | Label identifying the supplied statistic | Hero metric cell only | Yes | Short centered label must describe its paired value truthfully. |
| `<locale>.sections.nova-hero-wireframe.stats[1].value` | `"—"` | `"10+"` | Verified compact statistic value | Hero metric cell only | Yes — evidence required | String, not numeric counter. Keep four cells; do not invent outcomes, revenue or experience. |
| `<locale>.sections.nova-hero-wireframe.stats[1].label` | `"Experience"` | `"Lat doświadczenia"` | Label identifying the supplied statistic | Hero metric cell only | Yes | Short centered label must describe its paired value truthfully. |
| `<locale>.sections.nova-hero-wireframe.stats[2].value` | `"—"` | `"800+"` | Verified compact statistic value | Hero metric cell only | Yes — evidence required | String, not numeric counter. Keep four cells; do not invent outcomes, revenue or experience. |
| `<locale>.sections.nova-hero-wireframe.stats[2].label` | `"Development Hours"` | `"Godzin pracy nad produktem"` | Label identifying the supplied statistic | Hero metric cell only | Yes | Short centered label must describe its paired value truthfully. |
| `<locale>.sections.nova-hero-wireframe.stats[3].value` | `"—"` | `"150M+"` | Verified compact statistic value | Hero metric cell only | Yes — evidence required | String, not numeric counter. Keep four cells; do not invent outcomes, revenue or experience. |
| `<locale>.sections.nova-hero-wireframe.stats[3].label` | `"Creative Pieces"` | `"Przychodu u naszych klientów"` | Label identifying the supplied statistic | Hero metric cell only | Yes | Short centered label must describe its paired value truthfully. |

## Hero shape and visual constraints

- Statistics: exactly **4** current records, each `{ value: string, label: string }`; two columns below md, four columns at md+. Existing separators use even/first-two item selectors on mobile.
- Trust names: exactly **5** current string entries plus `trustedBy`. A three-column mobile grid becomes a nonwrapping flex row at lg; index-specific tracking applies to the second/fourth brand names.
- Headline: mobile `clamp(2.5rem,10vw,3.75rem)`; md/lg `clamp(3rem,4.4vw,4.75rem)`; leading 0.96, tracking -0.065em. No fixed character limit is encoded.
- Current combined headline lengths (including joining space): EN 38, PL 35 characters. Descriptions: EN 116, PL 124. These are observations, not new limits.
- Layout: one column on mobile, two columns from md, with existing fluid padding and image heights.
- Decoration: hardcoded, aria-hidden blob clip path `nova-responsive-photo-blob`; no editable decorative content record. Keep SVG geometry, stats separator lines, colors and reveal attributes untouched.
- Missing image invokes SmartImage's existing neutral placeholder; a nonempty invalid path can yield a broken image rather than a new designed fallback.

# Section 5 — Projects

Owner: `src/components/registry/portfolio/ProjectsBlock.astro`; registry `portfolio / nova` → dataKey `nova-projects`. Exactly **2** current project records. Localized overrides, not `portfolio.json` or base `nova-projects.json`, supply current cards.

**Source file:** `src/data/i18n/nova.json`. **Localized:** yes; `<locale>` is exactly `en` or `pl`. Each row identifies both complete JSON paths through this substitution. **Used by:** ProjectsBlock.

**October 8, 2026 approved English migration:** the EN values below reflect the user's exact Projects copy and two approved records, also recorded in `VOLATILE_CONTENT_SOURCE.md` B2. They supersede the original EN demo snapshot for this section. PL values and the existing four-field item contract remain unchanged. The shared `#realizacje` destination is retained.

| JSON path/key | Current EN value | Historical PL value (retired) | Intended real-world information | Used by / effects elsewhere | Safe data-only replacement | Notes/constraints |
| --- | --- | --- | --- | --- | --- | --- |
| `<locale>.sections.nova-projects.title` | `"Selected Work"` | `"Pomysły zamieniamy w realne efekty"` | Real selected-work section heading | Projects intro h2 | Yes | max-width 37rem; asymmetric intro grid at md+. |
| `<locale>.sections.nova-projects.description` | `"A selection of client work and creative projects across web development, digital products, branding, advertising, and visual design."` | `"Łączymy strategiczne myślenie, dopracowany design i nowoczesne technologie, aby tworzyć strony, które nie tylko wyglądają dobrze, ale przede wszystkim działają."` | Short introduction to supplied selected work | Projects intro lead | Yes | Right-aligned second intro column at md+; plain text, no project-level descriptions. |
| `<locale>.sections.nova-projects.linkLabel` | `"Discuss a Project"` | `"Zobacz realizacje"` | Visible existing section link label | Projects intro link | Yes | Existing text/arrow hover; preserve destination. |
| `<locale>.sections.nova-projects.linkHref` | `"#contact"` | `"#realizacje"` | Section-wide link destination | Intro link and EVERY project card | No — protected target | Currently #realizacje. No item-specific destination; changing this changes every card and intro link together. |
| `<locale>.sections.nova-projects.items[0].category` | `"Client Website"` | `"Strony internetowe"` | Actual classification/category of supplied project | Accepted/stored, NOT rendered by ProjectsBlock | Yes — stored only | Maintain truthful project classification; category is not currently visible on card. |
| `<locale>.sections.nova-projects.items[0].title` | `"The Moody Brewer"` | `"Marka premium z nową stroną"` | Actual concise project name/title | Card h3 in image overlay | Yes | max-width 75% leaves arrow space; longer titles increase overlay height. |
| `<locale>.sections.nova-projects.items[0].image` | `"/assets/images/t001-nova/t001-nova-project-moody-brewer.webp"` | `"/assets/images/t001-nova/t001-nova-project-laptop.webp"` | Public path to actual supplied project image | One project card SmartImage | Yes — asset required | Existing crop/derivative constraints in Section 12; no gallery relationship. |
| `<locale>.sections.nova-projects.items[0].alt` | `"The Moody Brewer website shown on a MacBook in a warm café setting"` | `"Laptop z projektem strony internetowej"` | Accurate project-image alternative text | One project img alt | Yes | Describe what supplied image shows; not a hidden project-description field. |
| `<locale>.sections.nova-projects.items[1].category` | `"Branding, Ads & Marketing"` | `"Wizerunek marki"` | Actual classification/category of supplied project | Accepted/stored, NOT rendered by ProjectsBlock | Yes — stored only | Maintain truthful project classification; category is not currently visible on card. |
| `<locale>.sections.nova-projects.items[1].title` | `"Creative Work"` | `"Nowy wizerunek dla ambitnej marki"` | Actual concise project name/title | Card h3 in image overlay | Yes | max-width 75% leaves arrow space; longer titles increase overlay height. |
| `<locale>.sections.nova-projects.items[1].image` | `"/assets/images/t001-nova/t001-nova-project-creative-work.webp"` | `"/assets/images/t001-nova/t001-nova-project-building.webp"` | Public path to actual supplied project image | One project card SmartImage | Yes — asset required | Existing crop/derivative constraints in Section 12; no gallery relationship. |
| `<locale>.sections.nova-projects.items[1].alt` | `"Collage of branding, advertising, social media, and digital design work"` | `"Nowoczesny budynek jako przykład realizacji"` | Accurate project-image alternative text | One project img alt | Yes | Describe what supplied image shows; not a hidden project-description field. |

## Supported output and layout

| Existing item field | Accepted | Rendered | Current role |
| --- | --- | --- | --- |
| `category` | Yes, required by Project type | No | Stored classification only |
| `title` | Yes | Yes | Image-overlay h3 |
| `image` | Yes | Yes | SmartImage source |
| `alt` | Yes | Yes, accessible | Image alternative text |

Mobile: single-column grid, 2rem gap, 3:2 figure ratio. From 48rem: columns `1.38fr 1fr`, 1.5rem gap, figure height `clamp(22rem,34vw,32rem)`, ratio auto. SmartImage attributes are 1280×800; actual base photos are 800×533. Display crops through object-fit: cover rather than using those attributes as the CSS ratio. Adding records is possible in the array but changes row count/rhythm; preserve two during initial migration.

English cards are informational and do not use linkHref. Polish cards retain the shared section-wide linkHref; the Portfolio pass now adds optional per-item href while preserving the base four fields. There is no description, technology list, slug, detail route, case-study body, per-project gallery or project API in this active implementation. Image hover scales 1.02 over 1200ms; arrows slide; keyboard focus has the existing outline. Keep behavior.

## Information we will eventually need from Anthony for each project

- Concise truthful `title`.
- Truthful `category`, with the understanding that it is stored but not visibly rendered.
- Supplied project `image` asset compatible with existing crop/derivatives.
- Accurate `alt` text describing that asset.

Only these four existing item fields are included. Section heading/description/link label are separate existing section-level slots.

## Information Anthony may want that the current component cannot display

Project descriptions, technologies, individual project/live/repository URLs, slugs, project-detail pages, case-study text, and linked project galleries are not consumed by ProjectsBlock. No desire for these is assumed; this is a capacity boundary.

Other bundled portfolio variants use `portfolio.json` and `img` rather than this block's `image`; several open images in a lightbox. They do not automatically extend this active contract. Do not switch variants or change architecture without explicit direction.

# Section 6 — Services

Owner: `src/components/registry/services/ServicesHomeBlock.astro`; `novaServices / default` → dataKey `nova-services`. Exactly **4** current service records. Item type: `{ number: string, icon?: string, title: string, description: string }`; all current records supply an icon. No per-item links or images exist.

**Source file:** `src/data/i18n/nova.json`. **Localized:** yes; `<locale>` is exactly `en` or `pl`. Each row identifies both complete JSON paths through this substitution. **Used by:** ServicesHomeBlock.

**October 8, 2026 approved English migration:** the EN values below reflect the user's exact Services copy and four approved records, also recorded in `VOLATILE_CONTENT_SOURCE.md` B3. They supersede this section's original EN demo snapshot. Polish values, the four-service count, existing numbers/icons and the `#services` destination remain unchanged.

| JSON path/key | Current EN value | Historical PL value (retired) | Intended real-world information | Used by / effects elsewhere | Safe data-only replacement | Notes/constraints |
| --- | --- | --- | --- | --- | --- | --- |
| `<locale>.sections.nova-services.title` | `"Services"` | `"Nasze usługi"` | Existing section heading role | Services intro h2 | Yes | Keep hierarchy and existing desktop three-part intro. |
| `<locale>.sections.nova-services.description` | `"Websites, web applications, visual design, and ongoing support built around real business needs."` | `"Kompleksowe wsparcie na każdym etapie, od koncepcji po wdrożenie i dalszy rozwój."` | Short section-level service introduction | Services intro lead | Yes | At 64rem+ white-space: nowrap in center intro column; longer content can overflow. |
| `<locale>.sections.nova-services.linkLabel` | `"Discuss a Project"` | `"Zobacz wszystkie"` | Visible services section-link label | Intro link | Yes | Text and arrow shift on hover; target protected. |
| `<locale>.sections.nova-services.linkHref` | `"#contact"` | `"#uslugi"` | Existing services section-link destination | Section-level link only | No — protected target | EN #services, PL #uslugi; no service-card URLs. |
| `<locale>.sections.nova-services.items[0].number` | `"01."` | `"01."` | Existing displayed service ordinal | Number/title line in card | Yes — preserve ordinal format | 01.–04. strings; not generated from array index. Keep current ordering. |
| `<locale>.sections.nova-services.items[0].icon` | `"palette"` | `"palette"` | Existing Phosphor icon identifier for supplied service | Decorative icon via Icon.astro | Yes — existing library only | Uses name, not image URL. Current palette/browser/paint-brush/lifebuoy; missing icon defaults to sparkle. |
| `<locale>.sections.nova-services.items[0].title` | `"Web Design & Development"` | `"UX/UI Design"` | Concise actual service name | Card h3 | Yes | Nowrap/ellipsis below 64rem; normal wrapping at 64rem+. Existing number/icon/arrow consume width. |
| `<locale>.sections.nova-services.items[0].description` | `"Custom websites built around your brand, goals, and customer experience."` | `"Nowoczesny i funkcjonalny design dopasowany do Twojej marki. Projektujemy doświadczenia, które są intuicyjne i wspierają cele biznesowe."` | Short description of actual service scope | Visible card body at every size | Yes | Description is not hover-only. Fluid small font, leading 1.45; preserve comparable density. |
| `<locale>.sections.nova-services.items[1].number` | `"02."` | `"02."` | Existing displayed service ordinal | Number/title line in card | Yes — preserve ordinal format | 01.–04. strings; not generated from array index. Keep current ordering. |
| `<locale>.sections.nova-services.items[1].icon` | `"browser"` | `"browser"` | Existing Phosphor icon identifier for supplied service | Decorative icon via Icon.astro | Yes — existing library only | Uses name, not image URL. Current palette/browser/paint-brush/lifebuoy; missing icon defaults to sparkle. |
| `<locale>.sections.nova-services.items[1].title` | `"Custom Web Applications"` | `"Strony internetowe"` | Concise actual service name | Card h3 | Yes | Nowrap/ellipsis below 64rem; normal wrapping at 64rem+. Existing number/icon/arrow consume width. |
| `<locale>.sections.nova-services.items[1].description` | `"Tailored digital tools, dashboards, and web-based applications built around specific business needs."` | `"Szybkie, responsywne i zoptymalizowane rozwiązania dla biznesu. Tworzymy strony, które dobrze wyglądają i skutecznie prowadzą do kontaktu."` | Short description of actual service scope | Visible card body at every size | Yes | Description is not hover-only. Fluid small font, leading 1.45; preserve comparable density. |
| `<locale>.sections.nova-services.items[2].number` | `"03."` | `"03."` | Existing displayed service ordinal | Number/title line in card | Yes — preserve ordinal format | 01.–04. strings; not generated from array index. Keep current ordering. |
| `<locale>.sections.nova-services.items[2].icon` | `"paint-brush"` | `"paint-brush"` | Existing Phosphor icon identifier for supplied service | Decorative icon via Icon.astro | Yes — existing library only | Uses name, not image URL. Current palette/browser/paint-brush/lifebuoy; missing icon defaults to sparkle. |
| `<locale>.sections.nova-services.items[2].title` | `"Branding & Visual Design"` | `"Identyfikacja wizualna"` | Concise actual service name | Card h3 | Yes | Nowrap/ellipsis below 64rem; normal wrapping at 64rem+. Existing number/icon/arrow consume width. |
| `<locale>.sections.nova-services.items[2].description` | `"Brand identities, advertisements, social graphics, and visual assets designed for consistency and impact."` | `"Spójny wizerunek, który wyróżnia markę i buduje zaufanie. Łączymy strategię, typografię i detale w jeden rozpoznawalny kierunek."` | Short description of actual service scope | Visible card body at every size | Yes | Description is not hover-only. Fluid small font, leading 1.45; preserve comparable density. |
| `<locale>.sections.nova-services.items[3].number` | `"04."` | `"04."` | Existing displayed service ordinal | Number/title line in card | Yes — preserve ordinal format | 01.–04. strings; not generated from array index. Keep current ordering. |
| `<locale>.sections.nova-services.items[3].icon` | `"lifebuoy"` | `"lifebuoy"` | Existing Phosphor icon identifier for supplied service | Decorative icon via Icon.astro | Yes — existing library only | Uses name, not image URL. Current palette/browser/paint-brush/lifebuoy; missing icon defaults to sparkle. |
| `<locale>.sections.nova-services.items[3].title` | `"Website Support & Optimization"` | `"Wsparcie i rozwój"` | Concise actual service name | Card h3 | Yes | Nowrap/ellipsis below 64rem; normal wrapping at 64rem+. Existing number/icon/arrow consume width. |
| `<locale>.sections.nova-services.items[3].description` | `"Ongoing updates, improvements, troubleshooting, and refinements to keep an existing site current, reliable, and effective."` | `"Stała opieka i rozwój strony po uruchomieniu projektu. Pomagamy utrzymać stronę aktualną, sprawną i gotową na kolejne etapy."` | Short description of actual service scope | Visible card body at every size | Yes | Description is not hover-only. Fluid small font, leading 1.45; preserve comparable density. |

Cards are `article` elements with hover styling and cursor-pointer, not linked controls; the arrow is decorative. Do not infer an active click destination. Grid: one column mobile, two columns at 48–63.99rem with 14rem minimum card height, four columns at 64rem+. No service image slot exists. Preserve interactive-card/reduced-motion classes and current icon/arrow behavior.

# Section 7 — Team / about

Owner: `src/components/registry/about/TeamBlock.astro`; `novaTeam / default` → dataKey `nova-team`. Current shape: title/description, one main image+alt, three check strings, teamCount/teamLabel/teamAriaLabel, three `{src,alt}` avatars, and buttonLabel/buttonHref.

**Source file:** `src/data/i18n/nova.json`. **Localized:** yes; `<locale>` is exactly `en` or `pl`. Each row identifies both complete JSON paths through this substitution. **Used by:** TeamBlock.

| JSON path/key | Current EN value | Historical PL value (retired) | Intended real-world information | Used by / effects elsewhere | Safe data-only replacement | Notes/constraints |
| --- | --- | --- | --- | --- | --- | --- |
| `<locale>.sections.nova-team.title` | `"About Anthony"` | `"Ludzie, którzy tworzą wartość"` | Real introduction heading for this existing section | Team h2 | Yes | Text column of md two-column split. |
| `<locale>.sections.nova-team.description` | `"I’m Anthony, the founder of Volatile Solutions. I combine development, design, and practical business thinking to turn ideas into polished digital experiences. From early concepts through launch and ongoing improvements, I stay hands-on throughout the process."` | `"Jesteśmy zespołem specjalistów, którzy łączą pasję do technologii z wyczuciem dobrego designu. Każdy projekt dopasowujemy do marki, jej celów i odbiorców."` | Short truthful about/founder/business introduction | Team lead text | Yes | Existing paragraph slot; no résumé or person-record collection. |
| `<locale>.sections.nova-team.image` | `"/assets/images/t001-nova/t001-nova-about-anthony-volatile.webp"` | `"/assets/images/t001-nova/t001-nova-about-team.webp"` | Supplied about/founder/business photo path | Main SmartImage figure | Yes — asset required | 1280×900 attributes; current source 800×600; min-height 20rem/object-cover. |
| `<locale>.sections.nova-team.imageAlt` | `"Anthony Volatile, founder of Volatile Solutions"` | `"Zespół Nova podczas pracy nad projektem"` | Accurate main-image alternative text | Main img alt | Yes | Describe supplied photograph, not assumed team. |
| `<locale>.sections.nova-team.checks[0]` | `"Development + Design"` | `"Strategiczne podejście"` | Verified short capability/value statement | Checklist text with decorative arrow | Yes | Plain string; three current checks; not an experience timeline. |
| `<locale>.sections.nova-team.checks[1]` | `"Business-Minded Problem Solving"` | `"Indywidualne podejście"` | Verified short capability/value statement | Checklist text with decorative arrow | Yes | Plain string; three current checks; not an experience timeline. |
| `<locale>.sections.nova-team.checks[2]` | `"Hands-On From Concept to Launch"` | `"Realne wsparcie"` | Verified short capability/value statement | Checklist text with decorative arrow | Yes | Plain string; three current checks; not an experience timeline. |
| `<locale>.sections.nova-team.teamCount` | `"1"` | `"10+"` | Verified compact count/value | Strong text beside avatar stack | Yes — evidence required | String, no numeric parsing; do not invent team size or another metric. |
| `<locale>.sections.nova-team.teamLabel` | `"Founder-led"` | `"specjalistów w zespole"` | Truthful label for paired count/value | Text beside teamCount | Yes | Sm+ row has whitespace-nowrap; keep compatible length and meaning. |
| `<locale>.sections.nova-team.teamAriaLabel` | `"Capabilities"` | `"Nasz zespół"` | Accessible name describing avatar group | Avatar wrapper aria-label | Yes | Needs to match actual supplied avatar group semantics. |
| `<locale>.sections.nova-team.teamAvatars[0].src` | Not rendered in English | `"/assets/images/t001-nova/t001-nova-avatar-01@220.webp"` | Supplied avatar image path | Overlapping raw img elements | Yes — asset required | Explicit @220.webp references; no SmartImage srcset here. Avoid fictional identity. |
| `<locale>.sections.nova-team.teamAvatars[0].alt` | Not rendered in English | `"Członkini zespołu Nova"` | Accurate avatar alternative text | Team avatar img alt | Yes | Match the depicted person/content; both locales have separate alt text. |
| `<locale>.sections.nova-team.teamAvatars[1].src` | Not rendered in English | `"/assets/images/t001-nova/t001-nova-avatar-02@220.webp"` | Supplied avatar image path | Overlapping raw img elements | Yes — asset required | Explicit @220.webp references; no SmartImage srcset here. Avoid fictional identity. |
| `<locale>.sections.nova-team.teamAvatars[1].alt` | Not rendered in English | `"Członek zespołu Nova"` | Accurate avatar alternative text | Team avatar img alt | Yes | Match the depicted person/content; both locales have separate alt text. |
| `<locale>.sections.nova-team.teamAvatars[2].src` | Not rendered in English | `"/assets/images/t001-nova/t001-nova-avatar-03@220.webp"` | Supplied avatar image path | Overlapping raw img elements | Yes — asset required | Explicit @220.webp references; no SmartImage srcset here. Avoid fictional identity. |
| `<locale>.sections.nova-team.teamAvatars[2].alt` | Not rendered in English | `"Członkini zespołu Nova"` | Accurate avatar alternative text | Team avatar img alt | Yes | Match the depicted person/content; both locales have separate alt text. |
| `<locale>.sections.nova-team.buttonLabel` | `"Let’s Work Together"` | `"Poznaj zespół"` | Visible existing CTA label | Team primary Button | Yes | Full-width mobile, width-fit at sm; nowrap text-roll. |
| `<locale>.sections.nova-team.buttonHref` | `"#contact"` | `"#zespol"` | Existing about/team action destination | Team Button and matching team anchor | No — protected target | Currently self-targets #zespol. No biography detail route is implied. |

**Template semantics:** source names and current copy describe a team, team size, team avatars and values.

**Possible content role:** title and description are ordinary string slots and main imagery is data-driven, so founder/about information can technically occupy those slots without changing the structure. The count/label/avatar group still needs truthful, coherent supplied meaning. This document does not choose that meaning or reinterpret the section as a résumé.

Mobile stacks image and text; md+ uses two equal columns. Avatar images are displayed at 40px, 48px from sm, cropped circularly and overlapped. Count/group row can wrap at the outer level, but the sm+ value/label pair is nowrap. The three checks are plain text, not structured job history.

# Section 8 — FAQ

Owner: `src/components/registry/faq/Faq3Block.astro`; `faq3 / default` → dataKey `faq3`. Exactly **4** current records with `{ q: string, a: string }`.

**Source file:** `src/data/i18n/nova.json`. **Localized:** yes; `<locale>` is exactly `en` or `pl`. Each row identifies both complete JSON paths through this substitution. **Used by:** Faq3Block and public/js/accordion.js.

| JSON path/key | Current EN value | Historical PL value (retired) | Intended real-world information | Used by / effects elsewhere | Safe data-only replacement | Notes/constraints |
| --- | --- | --- | --- | --- | --- | --- |
| `<locale>.sections.faq3.title` | `"Frequently asked questions"` | `"Najczęściej zadawane pytania"` | FAQ section heading | Centered SectionHeader | Yes | Header and accordion are max-width 48rem; preserve hierarchy/density. |
| `<locale>.sections.faq3.description` | `"Practical answers about projects, working together, and ongoing website support."` | `"Najważniejsze informacje o współpracy, procesie i efektach, które mogą Państwa interesować przed rozpoczęciem projektu."` | FAQ introduction | Centered SectionHeader | Yes | Header and accordion are max-width 48rem; preserve hierarchy/density. |
| `<locale>.sections.faq3.tagline` | `"FAQ"` | `"FAQ"` | Existing stored FAQ tagline | Accepted by props but NOT passed to SectionHeader | Yes — stored only | Not visible in active FAQ; do not assume editing it creates a kicker. |
| `<locale>.sections.faq3.items[0].q` | `"What kinds of projects do you take on?"` | `"Ile trwa przygotowanie nowej strony internetowej?"` | Supplied factual frequently asked question | Accordion summary h3 | Yes | 17px/18px question text, right padding and separate plus control; no hard cap. |
| `<locale>.sections.faq3.items[0].a` | `"I work on custom websites, web applications, branding, advertisements, social graphics, and other visual assets. I also support and improve existing websites."` | `"Standardowy projekt realizujemy zwykle w ciągu 2 do 4 tygodni. Termin zależy od zakresu strony, liczby podstron oraz szybkości przekazania materiałów."` | Supplied accurate answer | Accordion body Text | Yes | Plain text; max-width 42rem (max-w-2xl), no rich-answer schema. Longer text changes expanded height. |
| `<locale>.sections.faq3.items[1].q` | `"Do you work with clients outside Rhode Island?"` | `"Czy pomagacie w przygotowaniu treści i zdjęć?"` | Supplied factual frequently asked question | Accordion summary h3 | Yes | 17px/18px question text, right padding and separate plus control; no hard cap. |
| `<locale>.sections.faq3.items[1].a` | `"Yes. Volatile Solutions serves Rhode Island and remote clients. We can discuss your goals and project needs remotely."` | `"Tak. Możemy uporządkować istniejące materiały, przygotować strukturę treści oraz wskazać kierunek dla zdjęć i grafik, aby całość była spójna z marką."` | Supplied accurate answer | Accordion body Text | Yes | Plain text; max-width 42rem (max-w-2xl), no rich-answer schema. Longer text changes expanded height. |
| `<locale>.sections.faq3.items[2].q` | `"Can you improve a website I already have?"` | `"Czy strona będzie dobrze działać na telefonie?"` | Supplied factual frequently asked question | Accordion summary h3 | Yes | 17px/18px question text, right padding and separate plus control; no hard cap. |
| `<locale>.sections.faq3.items[2].a` | `"Yes. Website Support & Optimization includes updates, troubleshooting, and refinements to an existing site. I start by reviewing what you have and what you want to improve."` | `"Tak. Projektujemy od początku z myślą o telefonach, tabletach i komputerach. Każdy kluczowy widok sprawdzamy w kilku szerokościach ekranu."` | Supplied accurate answer | Accordion body Text | Yes | Plain text; max-width 42rem (max-w-2xl), no rich-answer schema. Longer text changes expanded height. |
| `<locale>.sections.faq3.items[3].q` | `"What happens after I reach out?"` | `"Czy po publikacji mogę samodzielnie edytować stronę?"` | Supplied factual frequently asked question | Accordion summary h3 | Yes | 17px/18px question text, right padding and separate plus control; no hard cap. |
| `<locale>.sections.faq3.items[3].a` | `"Share a brief overview of your project or opportunity and any relevant links. We can discuss your goals, review the scope, and identify sensible next steps."` | `"Tak. Przygotowujemy strukturę tak, aby najważniejsze treści można było później łatwo aktualizować. Po wdrożeniu przekazujemy również krótką instrukcję obsługi."` | Supplied accurate answer | Accordion body Text | Yes | Plain text; max-width 42rem (max-w-2xl), no rich-answer schema. Longer text changes expanded height. |

First question starts open. Native details/summary provides the toggle; the shared accordion script closes other entries in the same group when one opens. Plus rotates to an X; CSS handles expansion. Keep `data-accordion`, section ID `faq3`, keyboard/native semantics, and current behavior. No new questions are drafted here.

# Section 9 — Testimonials

Owner: `src/components/registry/social/TestimonialV2Block.astro`; `testimonials / v2` → dataKey `testimonial-v2`. Exactly **3 unique** current testimonial records, type `{ quote: string, author: string, initials: string, role: string, avatar?: string }`.

**Real testimonials must be supplied before demo testimonials can truthfully be replaced.** No quote, identity, outcome or endorsement is inferred.

**Source file:** `src/data/i18n/nova.json`. **Localized:** yes; `<locale>` is exactly `en` or `pl`. Each row identifies both complete JSON paths through this substitution. **Used by:** TestimonialV2Block.

| JSON path/key | Current EN value | Historical PL value (retired) | Intended real-world information | Used by / effects elsewhere | Safe data-only replacement | Notes/constraints |
| --- | --- | --- | --- | --- | --- | --- |
| `<locale>.sections.testimonial-v2.title` | `"Reviews that say more"` | `"Opinie, które mówią więcej"` | Testimonials section heading | Centered SectionHeader | Yes — truthful supplied copy | max-width 48rem; current claims belong to demo, not Anthony. |
| `<locale>.sections.testimonial-v2.description` | `"See how working with us translated into a stronger image and better results for our clients."` | `"Zobacz, jak współpraca z nami przełożyła się na lepszy wizerunek i wyniki naszych klientów."` | Testimonials section introduction | Centered SectionHeader | Yes — truthful supplied copy | max-width 48rem; current claims belong to demo, not Anthony. |
| `<locale>.sections.testimonial-v2.tagline` | `"Client reviews"` | `"Opinie klientów"` | Existing stored testimonials tagline | Accepted by props but NOT passed to SectionHeader | Yes — stored only | Not visible in active block. |
| `<locale>.sections.testimonial-v2.avatarAltPrefix` | `"Photo of"` | `"Zdjęcie"` | Localized prefix for real testimonial portrait alt | Derived img alt: prefix + space + author | Yes | No independent per-record alt field exists. |
| `<locale>.sections.testimonial-v2.items[0].quote` | `"The new website finally gave our communication a clear structure and started bringing better enquiries from the first week."` | `"Nowa strona uporządkowała naszą komunikację i od pierwszego tygodnia zaczęła przyciągać lepsze zapytania."` | Actual supplied/approved testimonial quote | Repeated testimonial card paragraph | Yes — real quote required | No length limit; variable heights affect scrolling track density/speed. |
| `<locale>.sections.testimonial-v2.items[0].author` | `"Anna Kowalska"` | `"Anna Kowalska"` | Actual supplied testimonial author name | Card cite and derived avatar alt | Yes — verified identity required | Repeated across columns/copies; never invented. |
| `<locale>.sections.testimonial-v2.items[0].initials` | `"AK"` | `"AK"` | Actual author's initials | 40px circular fallback behind avatar | Yes | Short compact string; becomes visible when avatar absent or fails. |
| `<locale>.sections.testimonial-v2.items[0].role` | `"Founder of a premium brand"` | `"Założycielka marki premium"` | Actual supplied author role/context | Card subtitle | Yes — verified role required | No company-logo or structured business record exists here. |
| `<locale>.sections.testimonial-v2.items[0].avatar` | `"https://i.pravatar.cc/150?u=anna-kowalska"` | `"https://i.pravatar.cc/150?u=anna-kowalska"` | Authorized supplied portrait URL/path | Raw 40×40 img, circular object-cover | Yes — authorized asset required | Remote current URL; no derivative pipeline/srcset. onerror removes img, revealing initials. CSP restricts remote origins. |
| `<locale>.sections.testimonial-v2.items[1].quote` | `"The process was focused, efficient and very well guided. We received a website that genuinely fits our brand."` | `"Proces był konkretny, sprawny i bardzo dobrze prowadzony. Dostaliśmy stronę, która naprawdę pasuje do naszej marki."` | Actual supplied/approved testimonial quote | Repeated testimonial card paragraph | Yes — real quote required | No length limit; variable heights affect scrolling track density/speed. |
| `<locale>.sections.testimonial-v2.items[1].author` | `"Michal Nowak"` | `"Michał Nowak"` | Actual supplied testimonial author name | Card cite and derived avatar alt | Yes — verified identity required | Repeated across columns/copies; never invented. |
| `<locale>.sections.testimonial-v2.items[1].initials` | `"MN"` | `"MN"` | Actual author's initials | 40px circular fallback behind avatar | Yes | Short compact string; becomes visible when avatar absent or fails. |
| `<locale>.sections.testimonial-v2.items[1].role` | `"Operations director"` | `"Dyrektor operacyjny"` | Actual supplied author role/context | Card subtitle | Yes — verified role required | No company-logo or structured business record exists here. |
| `<locale>.sections.testimonial-v2.items[1].avatar` | `"https://i.pravatar.cc/150?u=michal-nowak"` | `"https://i.pravatar.cc/150?u=michal-nowak"` | Authorized supplied portrait URL/path | Raw 40×40 img, circular object-cover | Yes — authorized asset required | Remote current URL; no derivative pipeline/srcset. onerror removes img, revealing initials. CSP restricts remote origins. |
| `<locale>.sections.testimonial-v2.items[2].quote` | `"We can finally present our work in a way that reflects its quality. Clients noticed the difference straight away."` | `"W końcu możemy pokazać nasze realizacje w sposób, który oddaje ich jakość. Klienci od razu to zauważyli."` | Actual supplied/approved testimonial quote | Repeated testimonial card paragraph | Yes — real quote required | No length limit; variable heights affect scrolling track density/speed. |
| `<locale>.sections.testimonial-v2.items[2].author` | `"Karolina Wojcik"` | `"Karolina Wójcik"` | Actual supplied testimonial author name | Card cite and derived avatar alt | Yes — verified identity required | Repeated across columns/copies; never invented. |
| `<locale>.sections.testimonial-v2.items[2].initials` | `"KW"` | `"KW"` | Actual author's initials | 40px circular fallback behind avatar | Yes | Short compact string; becomes visible when avatar absent or fails. |
| `<locale>.sections.testimonial-v2.items[2].role` | `"Studio owner"` | `"Właścicielka studia"` | Actual supplied author role/context | Card subtitle | Yes — verified role required | No company-logo or structured business record exists here. |
| `<locale>.sections.testimonial-v2.items[2].avatar` | `"https://i.pravatar.cc/150?u=karolina-wojcik"` | `"https://i.pravatar.cc/150?u=karolina-wojcik"` | Authorized supplied portrait URL/path | Raw 40×40 img, circular object-cover | Yes — authorized asset required | Remote current URL; no derivative pipeline/srcset. onerror removes img, revealing initials. CSP restricts remote origins. |

The UI constructs three reordered columns: original list; slice(2)+slice(0,2); slice(1)+slice(0,1). Each column repeats the full list **three times**. With three unique records this produces **27 card instances** in the DOM: nine per track. Two columns are hidden below md, leaving one visible track. Extra repetitions within each column have aria-hidden; the first copy in each column does not. Visible mask area is at most 720px high. Tracks run 14s/18s/12s, shift -33.333333%, pause on hover and stop for reduced motion. Changes in record count or quote length affect rhythm; repetition does not mean 27 distinct endorsements.

# Section 10 — Footer

Owner: `src/components/registry/shell/NovaFooterBlock.astro`. Source is localized `footer`, not generic `src/data/navigation/footer.json` or `src/data/sections/nova-cta.json`.

**Source file:** `src/data/i18n/nova.json`. **Localized:** yes; `<locale>` is exactly `en` or `pl`. Each row identifies both complete JSON paths through this substitution. **Used by:** NovaFooterBlock on homepages, active legal pages and 404.

| JSON path/key | Current EN value | Historical PL value (retired) | Intended real-world information | Used by / effects elsewhere | Safe data-only replacement | Notes/constraints |
| --- | --- | --- | --- | --- | --- | --- |
| `<locale>.footer.eyebrow` | `"Projects / Collaboration / Opportunities"` | `"Twoja marka zasługuje na więcej"` | Short closing CTA kicker | Footer CTA band | Yes | Small uppercase tracked copy between two decorative lines. |
| `<locale>.footer.heading` | `"Let’s create together"` | `"Zacznijmy tworzyć razem"` | Closing CTA heading | Footer h2 | Yes | clamp(2.5rem,7vw,5.5rem), leading .95; lg nowrap. Avoid overflow through content fit. |
| `<locale>.footer.description` | `"Have a project or opportunity in mind? Get in touch to discuss what you’re building and how I can contribute."` | `"Porozmawiajmy o Twoim projekcie i sprawdźmy, jak możemy pomóc w rozwoju Twojej marki."` | Short closing invitation/introduction | Footer paragraph | Yes | max-width 36rem; no contact-detail fields in active footer. |
| `<locale>.footer.primaryLabel` | `"Get in Touch"` | `"Skontaktuj się"` | Visible primary closing-action label | Accent Button | Yes | Mobile full width in max-w-xs stack, sm horizontal; nowrap text-roll. |
| `<locale>.footer.primaryHref` | `"mailto:volatile-solutions@outlook.com"` | `"#kontakt"` | Existing footer destination | Footer CTA, navigation or legal-page link | No — protected target | getNovaNavigationPath prefixes /pl for legal links; fragments unchanged. Preserve destination and route shape. |
| `<locale>.footer.secondaryLabel` | `"Explore Services"` | `"Poznaj ofertę"` | Visible secondary closing-action label | Outline Button | Yes | Existing dark-background button styling; target protected. |
| `<locale>.footer.secondaryHref` | `"#services"` | `"#uslugi"` | Existing footer destination | Footer CTA, navigation or legal-page link | No — protected target | getNovaNavigationPath prefixes /pl for legal links; fragments unchanged. Preserve destination and route shape. |
| `<locale>.footer.legalLinks[0].label` | `"Privacy policy"` | `"Polityka prywatności"` | Visible label identifying existing legal document | Footer legal nav; both homepage and legal/404 shell | Yes | Corresponds to existing document; no extra legal route is assumed. |
| `<locale>.footer.legalLinks[0].href` | `"/polityka-prywatnosci/"` | `"/polityka-prywatnosci/"` | Existing footer destination | Footer CTA, navigation or legal-page link | No — protected target | getNovaNavigationPath prefixes /pl for legal links; fragments unchanged. Preserve destination and route shape. |
| `<locale>.footer.legalLinks[1].label` | `"Cookies"` | `"Cookies"` | Visible label identifying existing legal document | Footer legal nav; both homepage and legal/404 shell | Yes | Corresponds to existing document; no extra legal route is assumed. |
| `<locale>.footer.legalLinks[1].href` | `"/cookies/"` | `"/cookies/"` | Existing footer destination | Footer CTA, navigation or legal-page link | No — protected target | getNovaNavigationPath prefixes /pl for legal links; fragments unchanged. Preserve destination and route shape. |
| `<locale>.footer.footerLinks[0].label` | `"About Anthony"` | `"O nas"` | Visible existing footer navigation label | Footer navigation; all Nova shell pages | Yes | Mobile two-column nav, wrapping flex from sm; anchors protected. |
| `<locale>.footer.footerLinks[0].href` | `"#zespol"` | `"#zespol"` | Existing footer destination | Footer CTA, navigation or legal-page link | No — protected target | getNovaNavigationPath prefixes /pl for legal links; fragments unchanged. Preserve destination and route shape. |
| `<locale>.footer.footerLinks[1].label` | `"Services"` | `"Usługi"` | Visible existing footer navigation label | Footer navigation; all Nova shell pages | Yes | Mobile two-column nav, wrapping flex from sm; anchors protected. |
| `<locale>.footer.footerLinks[1].href` | `"#services"` | `"#uslugi"` | Existing footer destination | Footer CTA, navigation or legal-page link | No — protected target | getNovaNavigationPath prefixes /pl for legal links; fragments unchanged. Preserve destination and route shape. |
| `<locale>.footer.footerLinks[2].label` | `"Selected Work"` | `"Realizacje"` | Visible existing footer navigation label | Footer navigation; all Nova shell pages | Yes | Mobile two-column nav, wrapping flex from sm; anchors protected. |
| `<locale>.footer.footerLinks[2].href` | `"#realizacje"` | `"#realizacje"` | Existing footer destination | Footer CTA, navigation or legal-page link | No — protected target | getNovaNavigationPath prefixes /pl for legal links; fragments unchanged. Preserve destination and route shape. |
| `<locale>.footer.footerLinks[3].label` | Not rendered in English | `"Opinie"` | Visible existing footer navigation label | Footer navigation; all Nova shell pages | Yes | Mobile two-column nav, wrapping flex from sm; anchors protected. |
| `<locale>.footer.footerLinks[3].href` | Not rendered in English | `"#opinie"` | Existing footer destination | Footer CTA, navigation or legal-page link | No — protected target | getNovaNavigationPath prefixes /pl for legal links; fragments unchanged. Preserve destination and route shape. |
| `<locale>.footer.ariaLegal` | `"Legal documents"` | `"Dokumenty prawne"` | Accessible legal-navigation name | Footer legal nav | Yes | Matches existing legal link grouping. |
| `<locale>.footer.ariaNavigation` | `"Footer navigation"` | `"Nawigacja stopki"` | Accessible footer-navigation name | Footer navigation | Yes | Matches existing site link grouping. |
| `<locale>.footer.copyright` | `"All rights reserved."` | `"Wszelkie prawa zastrzeżone."` | Supplied copyright wording in existing slot | Bottom text before fixed distributor credit | Yes — rights-sensitive wording | Currently no company name or year is printed here. Do not invent rights claims or authorship. |
| `<locale>.footer.attributionPrefix` | `"Design and development by "` | `"Projekt i wdrożenie: "` | Existing third-party author attribution | NovaFooterBlock bottom attribution link | No — attribution/user decision | Technically data-controlled; preserve required author notices. Do not relabel template authorship as Anthony's work. |
| `<locale>.footer.attributionLinkLabel` | `"WebScale"` | `"WebScale"` | Existing third-party author attribution | NovaFooterBlock bottom attribution link | No — attribution/user decision | Technically data-controlled; preserve required author notices. Do not relabel template authorship as Anthony's work. |
| `<locale>.footer.attributionLinkHref` | `"https://webscale.pl"` | `"https://webscale.pl"` | Existing third-party author attribution | NovaFooterBlock bottom attribution link | No — attribution/user decision | Technically data-controlled; preserve required author notices. Do not relabel template authorship as Anthony's work. |


| Non-JSON footer field | Current value | Classification | Localized | Safe data-only replacement | Constraints / effects |
| --- | --- | --- | --- | --- | --- |
| Footer ID | EN contact; PL kontakt | Structural contact anchor | By locale | No — protected | All primary contact fragment links depend on it. Footer primary CTA points back to this same footer. |
| Background URL | /assets/images/t001-nova/t001-nova-cta-mountains@1920.webp | Decorative image asset, hardcoded reference | No | No via JSON; same-path asset replacement possible | Inline background-image; bg-cover/bg-center; derivative details Section 12. nova-cta.json image is not read here. |
| Distributor prefix / text / URL | `"Distributed by"` / `"ThemeWagon"` / `"https://themewagon.com"` | Third-party attribution; preserve pending explicit direction | No | No — hardcoded attribution | Printed after copyright and a bullet on both locales. Do not remove or rewrite author/distributor notices in ordinary content replacement. |
| Decorative separator | •; eyebrow thin lines; dark overlay | Structural presentation | No | No — preserve | No content-data field. |
| Social links | None rendered by active footer | No active social-reference slot | No | Not applicable | Shared drawer's company socials remain separate. |
| Contact details | No email/phone/address block rendered | No active contact-detail slot | No | Not applicable | Global phone appears in floating control, not footer; no active footer form. |

English legal paths render `/polityka-prywatnosci/` and `/cookies/`; Polish renders `/pl/polityka-prywatnosci/` and `/pl/cookies/`, plus any configured base. Mobile footer CTA/navigation arrangement and larger-screen nowrap heading are existing constraints. Business copy, structural routes and third-party attribution must remain distinct. `LICENSE.md` and `ASSETS-LICENSES.md` are governing documents, not replaceable business copy.

# Section 11 — Demo/template content outside primary sections

## Active demo banner

`Layout.astro` renders `NovaDemoBanner` whenever shell is shown and theme is Nova, including active legal/404 pages. It remains after company-name changes. Label is hidden below sm and truncated above sm; the two links remain. Sticky banner participates in navbar positioning; no visibility switch exists in the current content contract.

**Source file:** `src/data/i18n/nova.json`. **Localized:** yes; `<locale>` = `en` or `pl`. Source/status apply to every row. **Used by:** NovaDemoBanner.

| JSON path/key | Current EN value | Historical PL value (retired) | Intended real-world information | Used by / effects elsewhere | Safe data-only replacement | Notes/constraints |
| --- | --- | --- | --- | --- | --- | --- |
| `<locale>.demoBanner.label` | `"This template was designed and built by WebScale."` | `"Ten template został zaprojektowany i wdrożony przez WebScale."` | Existing template author notice | NovaDemoBanner across Nova shell pages | No — later user/attribution decision | Data-controlled, but not ordinary company identity. Retain author notices; changing copy does not remove sticky structure or template analytics hooks. |
| `<locale>.demoBanner.downloadLabel` | `"Download template"` | `"Pobierz template"` | Existing template promotional link label | NovaDemoBanner across Nova shell pages | No — later user/attribution decision | Data-controlled, but not ordinary company identity. Retain author notices; changing copy does not remove sticky structure or template analytics hooks. |
| `<locale>.demoBanner.downloadHref` | `"https://github.com/themewagon/nova-astro"` | `"https://github.com/Wiktorkulas51/template-t001-nova"` | Existing template promotion destination | NovaDemoBanner across Nova shell pages | No — later user/attribution decision | Data-controlled, but not ordinary company identity. Retain author notices; changing copy does not remove sticky structure or template analytics hooks. |
| `<locale>.demoBanner.customizeLabel` | `"Request customization"` | `"Zamów customizację"` | Existing template promotional link label | NovaDemoBanner across Nova shell pages | No — later user/attribution decision | Data-controlled, but not ordinary company identity. Retain author notices; changing copy does not remove sticky structure or template analytics hooks. |
| `<locale>.demoBanner.customizeHref` | `"https://webscale.pl/?utm_source=nova-demo&utm_medium=banner&utm_campaign=t001-nova-custom"` | `"https://webscale.pl/?utm_source=nova-demo&utm_medium=banner&utm_campaign=t001-nova-custom"` | Existing template promotion destination | NovaDemoBanner across Nova shell pages | No — later user/attribution decision | Data-controlled, but not ordinary company identity. Retain author notices; changing copy does not remove sticky structure or template analytics hooks. |

Banner analytics hooks are hardcoded `template_github_click`, `template_customization_click`, with location `nova_demo_banner`. No new events or promotion behavior are proposed.

## 404 page

Actual owner: `src/pages/404.astro`. It reads specific data below even though `404.json.enabled` is false: that setting disables catch-all generation, not the explicit 404 route.

**Source file:** `src/data/pages/404.json`.

| JSON path/key | Current value | Intended real-world information | Used by / dependencies | Localized: yes/no | Safe data-only replacement | Notes/constraints |
| --- | --- | --- | --- | --- | --- | --- |
| `enabled` | `false` | Existing catch-all generation guard | Page registry; explicit 404 route still renders | No | No — protected | false is not permission to enable a second 404 page. |
| `title` | `"404"` | Stored 404 metadata, currently not passed by route | Not consumed for actual 404 title/description | No | Yes — stored only | Actual route title is hardcoded; actual description defaults to global SEO. |
| `heading` | `"Page not found"` | Error-page heading | Explicit 404 route | No | Yes | Shared data is English and not a per-locale structure; preserve existing visual hierarchy. |
| `body` | `"It looks like this page does not exist or has been moved."` | Short error explanation | Explicit 404 route | No | Yes | Shared data is English and not a per-locale structure; preserve existing visual hierarchy. |
| `cta1.label` | `"Back to home"` | Visible error-page CTA label | Explicit 404 route | No | Yes | Shared data is English and not a per-locale structure; preserve existing visual hierarchy. |
| `cta1.hover` | `"Going back!"` | Existing alternate error-page CTA label | Button hover text | No | Yes | Short nowrap text; Polish hardcoded fallback exists if empty. |
| `cta1.href` | `"/"` | Existing error-page action destination | 404 Button link | No | No — protected target | cta1 '/' works as home URL; cta2 '#kontakt' does not match default English footer '#contact'. Report, do not silently rename anchor. |
| `cta2.label` | `"Contact us"` | Visible error-page CTA label | Explicit 404 route | No | Yes | Shared data is English and not a per-locale structure; preserve existing visual hierarchy. |
| `cta2.hover` | `"Write to us"` | Existing alternate error-page CTA label | Button hover text | No | Yes | Short nowrap text; Polish hardcoded fallback exists if empty. |
| `cta2.href` | `"#kontakt"` | Existing error-page action destination | 404 Button link | No | No — protected target | cta1 '/' works as home URL; cta2 '#kontakt' does not match default English footer '#contact'. Report, do not silently rename anchor. |
| `seo.title` | `"Page not found"` | Stored 404 metadata, currently not passed by route | Not consumed for actual 404 title/description | No | Yes — stored only | Actual route title is hardcoded; actual description defaults to global SEO. |
| `seo.description` | `"The page you are looking for does not exist."` | Stored 404 metadata, currently not passed by route | Not consumed for actual 404 title/description | No | Yes — stored only | Actual route title is hardcoded; actual description defaults to global SEO. |


| Source / field | Current value | Classification / consumer | Localized | Data-only | Notes |
| --- | --- | --- | --- | --- | --- |
| src/pages/404.astro / title | `"404 - Nie znaleziono strony"` | Hardcoded document/OG/Twitter title | No | No | Does not use 404.json.title or seo.title. |
| src/pages/404.astro / noIndex | `true` | Protected metadata policy | No | No | 404 always noindex; global description remains fallback. |
| src/pages/404.astro / visual status text | `"404"` | Structural error status | No | No | Preserve status meaning and presentation. |
| src/pages/404.astro / hover fallback | `"Wracamy!"` / `"Napisz do nas"` | Conditional CTA hover text | No | No via fallback literal; cta.hover takes precedence | Keep nonempty supported data rather than modify components. |
| src/pages/404.astro / description | `"We create modern websites that strengthen your image, attract clients and support business growth."` | Inherited Layout description | No | Yes — global SEO | 404.json.seo.description is not currently passed. |
| src/data/pages/404.json / sections | `[]` | Unused catch-all content composition | No | No — protected | Explicit route owns page body. |

## Active legal pages and localized legal-shell labels

English privacy/cookies routes import flat `privacy-policy.json` / `cookies.json`. Polish routes import flat `privacy-policy-pl.json` / `cookies-pl.json`. The nested Markdoc/index.json copies and terms.json are not active sources for these routes. Do not confuse them with the current legal bodies.

**Source file:** `src/data/global/legal.json`. **Localized:** yes; `<locale>` = `en` or `pl`. Source/status apply to every row. **Used by:** LegalLayout.

| JSON path/key | Current EN value | Historical PL value (retired) | Intended real-world information | Used by / effects elsewhere | Safe data-only replacement | Notes/constraints |
| --- | --- | --- | --- | --- | --- | --- |
| `<locale>.updatedLabel` | Not rendered in English | `"Ostatnia aktualizacja:"` | Existing localized legal-page supporting text | LegalLayout on privacy/cookie routes | Yes | Back-link text, updated-date label, FAQ title/body and contact CTA have existing dedicated positions. Keep concise corresponding meanings. |
| `<locale>.legalBackLabel` | Not rendered in English | `"Wróć na stronę główną"` | Existing localized legal-page supporting text | LegalLayout on privacy/cookie routes | Yes | Back-link text, updated-date label, FAQ title/body and contact CTA have existing dedicated positions. Keep concise corresponding meanings. |
| `<locale>.legalFaqTitle` | Not rendered in English | `"Masz pytania dotyczące dokumentów prawnych?"` | Existing localized legal-page supporting text | LegalLayout on privacy/cookie routes | Yes | Back-link text, updated-date label, FAQ title/body and contact CTA have existing dedicated positions. Keep concise corresponding meanings. |
| `<locale>.legalFaqText` | Not rendered in English | `"Skontaktuj się z nami bezpośrednio, a wyjaśnimy wszystkie wątpliwości."` | Existing localized legal-page supporting text | LegalLayout on privacy/cookie routes | Yes | Back-link text, updated-date label, FAQ title/body and contact CTA have existing dedicated positions. Keep concise corresponding meanings. |
| `<locale>.legalContactCta` | Not rendered in English | `"Przejdź do kontaktu"` | Existing localized legal-page supporting text | LegalLayout on privacy/cookie routes | Yes | Back-link text, updated-date label, FAQ title/body and contact CTA have existing dedicated positions. Keep concise corresponding meanings. |
| `<locale>.legalContactHref` | Not rendered in English | `"/#kontakt"` | Existing legal-page contact destination | LegalLayout via getNovaNavigationPath | No — protected target | Stored /#kontakt in both locales: EN currently points to nonexistent English homepage kontakt; PL resolves /pl/#kontakt (plus any base). Report gap, do not fix now. |

### src/content/legal/privacy-policy.json

**Used by:** `/polityka-prywatnosci/` → LegalLayout. **Localized:** yes, through separate English/Polish files. **Safe data-only replacement:** yes for supplied document content using existing body syntax; no legal policy is authored or assumed here. Company substitution can change rendered values across documents.

| JSON path/key | Current value | Intended real-world information | Constraints / dependencies |
| --- | --- | --- | --- |
| `lastUpdated` | `"April 21, 2026"` | Actual supplied document revision date | Displayed date string, not automatic timestamp. |
| `title` | `"Privacy Policy"` | Existing legal-page heading and document/social title | Existing h1 and metadata string. |
| `description` | `"Privacy policy of {{COMPANY_NAME}}: how we process your personal data."` | Existing legal-page description/social description | Company placeholders are substituted before Layout metadata. |
| `body` | Exact stored text reproduced in the following body snapshot | Actual supplied legal document body | Escaped paragraph/## heading syntax; generated section IDs; email linkification. Not full Markdown/MDX. |

**Current `body` value (verbatim stored text; placeholders remain unexpanded):**

````text
Your privacy is our priority. This Privacy Policy explains how {{COMPANY_NAME}} collects, processes and protects your personal data in connection with using our website.

## 1. Data Controller

The controller of your personal data is {{COMPANY_FULL_NAME}} based in {{COMPANY_CITY}}, {{COMPANY_ADDRESS}}, Tax ID: {{COMPANY_NIP}}, REGON: {{COMPANY_REGON}}, KRS: {{COMPANY_KRS}}. Contact regarding data protection is available at: {{COMPANY_EMAIL}}.

## 2. Purposes and Legal Bases for Processing

Your data is processed to: a) respond to inquiries sent via the contact form (art. 6 sec. 1 lit. f GDPR), b) perform contracts or take steps before entering into them (art. 6 sec. 1 lit. b GDPR), c) send newsletters if you consent (art. 6 sec. 1 lit. a GDPR), d) analytical and statistical purposes related to site traffic (art. 6 sec. 1 lit. f GDPR).

## 3. Types of Data Processed

We may collect the following data: name, email address, phone number, IP address, location data and information about your activity on the site (via cookies).

## 4. Data Retention Period

Your data will be stored for the period necessary to achieve the purposes for which it was collected, and thereafter for the limitation period of potential claims or as required by law (e.g. tax law).

## 5. Data Recipients

Your data may be transferred to trusted third parties such as hosting providers, analytics tools (e.g. Google Analytics), mailing systems and accounting or legal service providers.

## 6. Your Rights

You have the right to: access your data, rectify it, erase it ('right to be forgotten'), restrict processing, data portability, object, and withdraw consent at any time. You also have the right to lodge a complaint with the President of the Personal Data Protection Office (PUODO).

## 7. Data Security

We apply appropriate technical and organizational measures to protect your data against unauthorized access, loss or destruction. All connections are encrypted with an SSL certificate.

## 8. Changes to this Privacy Policy

We reserve the right to make changes to this policy. The current version will always be available on this page.
````

### src/content/legal/privacy-policy-pl.json

**Used by:** `/pl/polityka-prywatnosci/` → LegalLayout. **Localized:** yes, through separate English/Polish files. **Safe data-only replacement:** yes for supplied document content using existing body syntax; no legal policy is authored or assumed here. Company substitution can change rendered values across documents.

| JSON path/key | Current value | Intended real-world information | Constraints / dependencies |
| --- | --- | --- | --- |
| `lastUpdated` | `"21 kwietnia 2026"` | Actual supplied document revision date | Displayed date string, not automatic timestamp. |
| `title` | `"Polityka prywatności"` | Existing legal-page heading and document/social title | Existing h1 and metadata string. |
| `description` | `"Polityka prywatności {{COMPANY_NAME}}: zasady przetwarzania danych osobowych."` | Existing legal-page description/social description | Company placeholders are substituted before Layout metadata. |
| `body` | Exact stored text reproduced in the following body snapshot | Actual supplied legal document body | Escaped paragraph/## heading syntax; generated section IDs; email linkification. Not full Markdown/MDX. |

**Current `body` value (verbatim stored text; placeholders remain unexpanded):**

````text
Prywatność użytkowników jest dla nas ważna. Niniejsza Polityka prywatności wyjaśnia, w jaki sposób {{COMPANY_NAME}} zbiera, przetwarza i chroni dane osobowe w związku z korzystaniem z naszej strony internetowej.

## 1. Administrator danych

Administratorem danych osobowych jest {{COMPANY_FULL_NAME}} z siedzibą w {{COMPANY_CITY}}, przy {{COMPANY_ADDRESS}}, NIP: {{COMPANY_NIP}}, REGON: {{COMPANY_REGON}}, KRS: {{COMPANY_KRS}}. W sprawach dotyczących ochrony danych można skontaktować się pod adresem: {{COMPANY_EMAIL}}.

## 2. Cele i podstawy przetwarzania

Dane są przetwarzane w celu: a) udzielania odpowiedzi na zapytania przesłane przez formularz kontaktowy, na podstawie art. 6 ust. 1 lit. f RODO, b) wykonania umowy lub podjęcia działań przed jej zawarciem, na podstawie art. 6 ust. 1 lit. b RODO, c) wysyłania newslettera, jeżeli użytkownik wyraził zgodę, na podstawie art. 6 ust. 1 lit. a RODO, d) prowadzenia analiz i statystyk związanych z ruchem na stronie, na podstawie art. 6 ust. 1 lit. f RODO.

## 3. Rodzaje przetwarzanych danych

Możemy zbierać następujące dane: imię i nazwisko, adres e-mail, numer telefonu, adres IP, dane dotyczące lokalizacji oraz informacje o aktywności użytkownika na stronie, zbierane za pomocą plików cookies.

## 4. Okres przechowywania danych

Dane będą przechowywane przez okres niezbędny do realizacji celów, w których zostały zebrane, a następnie przez okres przedawnienia potencjalnych roszczeń lub przez czas wymagany przepisami prawa, na przykład przepisami podatkowymi.

## 5. Odbiorcy danych

Dane mogą być przekazywane zaufanym podmiotom trzecim, takim jak dostawcy hostingu, narzędzia analityczne, na przykład Google Analytics, systemy mailingowe oraz dostawcy usług księgowych lub prawnych.

## 6. Prawa użytkownika

Użytkownik ma prawo do dostępu do swoich danych, ich sprostowania, usunięcia, ograniczenia przetwarzania, przenoszenia danych, wniesienia sprzeciwu oraz wycofania zgody w dowolnym momencie. Użytkownik ma również prawo złożyć skargę do Prezesa Urzędu Ochrony Danych Osobowych.

## 7. Bezpieczeństwo danych

Stosujemy odpowiednie środki techniczne i organizacyjne, aby chronić dane przed nieuprawnionym dostępem, utratą lub zniszczeniem. Wszystkie połączenia są szyfrowane za pomocą certyfikatu SSL.

## 8. Zmiany w Polityce prywatności

Zastrzegamy sobie prawo do wprowadzania zmian w niniejszej Polityce prywatności. Aktualna wersja dokumentu będzie zawsze dostępna na tej stronie.
````

### src/content/legal/cookies.json

**Used by:** `/cookies/` → LegalLayout. **Localized:** yes, through separate English/Polish files. **Safe data-only replacement:** yes for supplied document content using existing body syntax; no legal policy is authored or assumed here. Company substitution can change rendered values across documents.

| JSON path/key | Current value | Intended real-world information | Constraints / dependencies |
| --- | --- | --- | --- |
| `lastUpdated` | `"April 21, 2026"` | Actual supplied document revision date | Displayed date string, not automatic timestamp. |
| `title` | `"Cookie Policy"` | Existing legal-page heading and document/social title | Existing h1 and metadata string. |
| `description` | `"Cookie policy of {{COMPANY_NAME}}: what data we collect and how we use it."` | Existing legal-page description/social description | Company placeholders are substituted before Layout metadata. |
| `body` | Exact stored text reproduced in the following body snapshot | Actual supplied legal document body | Escaped paragraph/## heading syntax; generated section IDs; email linkification. Not full Markdown/MDX. |

**Current `body` value (verbatim stored text; placeholders remain unexpanded):**

````text
The {{COMPANY_NAME}} website uses cookies to ensure the highest quality of services and to adapt the site to your individual needs.

## 1. What are cookies?

Cookies are small text files sent by the web server and stored on your end device (e.g. computer, smartphone). They allow the site to recognize your device and display content accordingly.

## 2. Types of cookies used

We use the following types of cookies: a) Essential — necessary for the site to work correctly, b) Functional — remembering your settings (e.g. language), c) Analytics — helping us understand how users use the site (e.g. Google Analytics), d) Marketing — used to display personalized ads.

## 3. Analytics and marketing tools

Our site may use tools such as Google Analytics, Facebook Pixel or Google Ads. These tools may collect anonymous information about your visits, time spent on the site or buttons clicked.

## 4. Managing cookies

Most web browsers accept cookies by default. However, you can change these settings at any time in your browser by blocking automatic cookie handling or requesting information each time they are set. Note that restricting cookies may affect some site functionality.

## 5. Storage

Cookies may be 'session' (deleted after closing the browser) or 'persistent' (remaining on the device for a specified time or until manually deleted).
````

### src/content/legal/cookies-pl.json

**Used by:** `/pl/cookies/` → LegalLayout. **Localized:** yes, through separate English/Polish files. **Safe data-only replacement:** yes for supplied document content using existing body syntax; no legal policy is authored or assumed here. Company substitution can change rendered values across documents.

| JSON path/key | Current value | Intended real-world information | Constraints / dependencies |
| --- | --- | --- | --- |
| `lastUpdated` | `"21 kwietnia 2026"` | Actual supplied document revision date | Displayed date string, not automatic timestamp. |
| `title` | `"Polityka cookies"` | Existing legal-page heading and document/social title | Existing h1 and metadata string. |
| `description` | `"Polityka cookies {{COMPANY_NAME}}: jakie dane zbieramy i jak je wykorzystujemy."` | Existing legal-page description/social description | Company placeholders are substituted before Layout metadata. |
| `body` | Exact stored text reproduced in the following body snapshot | Actual supplied legal document body | Escaped paragraph/## heading syntax; generated section IDs; email linkification. Not full Markdown/MDX. |

**Current `body` value (verbatim stored text; placeholders remain unexpanded):**

````text
Strona internetowa {{COMPANY_NAME}} wykorzystuje pliki cookies, aby zapewnić najwyższą jakość usług i dostosować stronę do indywidualnych potrzeb użytkowników.

## 1. Czym są pliki cookies?

Pliki cookies to małe pliki tekstowe wysyłane przez serwer internetowy i zapisywane na urządzeniu użytkownika, na przykład komputerze lub smartfonie. Pozwalają stronie rozpoznać urządzenie i odpowiednio wyświetlać treści.

## 2. Rodzaje wykorzystywanych plików cookies

Wykorzystujemy następujące rodzaje plików cookies: a) niezbędne, potrzebne do prawidłowego działania strony, b) funkcjonalne, zapamiętujące ustawienia użytkownika, na przykład wybrany język, c) analityczne, pomagające nam zrozumieć sposób korzystania ze strony, na przykład za pomocą Google Analytics, d) marketingowe, wykorzystywane do wyświetlania spersonalizowanych reklam.

## 3. Narzędzia analityczne i marketingowe

Strona może korzystać z narzędzi takich jak Google Analytics, Facebook Pixel lub Google Ads. Narzędzia te mogą zbierać anonimowe informacje o wizytach, czasie spędzonym na stronie oraz klikanych przyciskach.

## 4. Zarządzanie plikami cookies

Większość przeglądarek internetowych domyślnie akceptuje pliki cookies. Użytkownik może jednak w dowolnym momencie zmienić te ustawienia, blokując automatyczną obsługę plików cookies lub włączając prośbę o potwierdzenie za każdym razem, gdy są one zapisywane. Ograniczenie plików cookies może wpłynąć na działanie niektórych funkcji strony.

## 5. Okres przechowywania

Pliki cookies mogą być sesyjne, czyli usuwane po zamknięciu przeglądarki, albo stałe, czyli pozostające na urządzeniu przez określony czas lub do momentu ich ręcznego usunięcia.
````

### Legal placeholder dependencies

All recognized placeholder replacements are shown below. Privacy routes recognize every listed token; cookie routes recognize COMPANY_NAME and SITE_URL. Some recognized tokens do not currently occur in a body. These are existing substitutions, not proposed fields. Policy prose mentioning registrations, geography, privacy rights, cookies or services is demonstration content and must not be assumed to describe Anthony's operation.


| Existing token | Company JSON key | Current substituted value | Consumers |
| --- | --- | --- | --- |
| `{{COMPANY_NAME}}` | `name` | `"Nova"` | Privacy and cookie routes if token occurs |
| `{{COMPANY_FULL_NAME}}` | `fullName` | `"Nova Creative Agency"` | Privacy routes if token occurs |
| `{{COMPANY_ADDRESS}}` | `address` | `"123 Example Street, 00-001 Warsaw"` | Privacy routes if token occurs |
| `{{COMPANY_CITY}}` | `city` | `"Warsaw"` | Privacy routes if token occurs |
| `{{COMPANY_ZIP}}` | `zipCode` | `"00-001"` | Privacy routes if token occurs |
| `{{COMPANY_NIP}}` | `nip` | `"1234567890"` | Privacy routes if token occurs |
| `{{COMPANY_REGON}}` | `regon` | `""` | Privacy routes if token occurs |
| `{{COMPANY_KRS}}` | `krs` | `"0000123456"` | Privacy routes if token occurs |
| `{{COMPANY_EMAIL}}` | `email` | `"contact@yourcompany.com"` | Privacy routes if token occurs |
| `{{SITE_URL}}` | `siteUrl` | `"https://yourcompany.com"` | Privacy and cookie routes if token occurs |

Missing/falsy siteUrl uses the hardcoded fallback `nasza-strona.pl`. Updating company identity alone does not update policy wording or revision dates.

## Active and conditionally available global UI

**Source file:** `src/data/global/floating-bar.json`.

| JSON path/key | Current value | Intended real-world information | Used by / dependencies | Localized: yes/no | Safe data-only replacement | Notes/constraints |
| --- | --- | --- | --- | --- | --- | --- |
| `ariaBackToTop` | `"Back to top"` | Accessible back-to-top label | FloatingBar on active pages; phone comes from company.phone | No | Yes | Icon-only label. Shared EN text also appears on PL routes. Back-to-top depends on scroll/upward intent; phone bar appears after scroll threshold. |
| `ariaCall` | `"Call us"` | Accessible phone-action label | FloatingBar on active pages; phone comes from company.phone | No | Yes | Icon-only label. Shared EN text also appears on PL routes. Back-to-top depends on scroll/upward intent; phone bar appears after scroll threshold. |

Other floating-bar JSON keys (WhatsApp/Facebook/text labels) are not consumed by active FloatingBar; they are excluded rather than presented as available controls. Phone action currently resolves `tel:+48123456789`.

CookieConsent is rendered only if any resolved optional tracking identifier is nonempty. Committed identifiers are empty, so it is **not currently rendered absent environment overrides**. No deployment environment was inspected. It may reasonably appear through existing tracking setup; its exact content is:

**Source file:** `src/data/global/cookie-consent.json`.

| JSON path/key | Current value | Intended real-world information | Used by / dependencies | Localized: yes/no | Safe data-only replacement | Notes/constraints |
| --- | --- | --- | --- | --- | --- | --- |
| `title` | `"We use cookies"` | Existing cookie-banner title | Conditional CookieConsent on all active Layout pages | No | Yes — conditional shared copy | Single shared English source, not translated by nova.json. Description uses set:html; preserve supported safe link/markup. Banner max-width 400px at md; nowrap buttons. |
| `description` | `"This site uses cookies to improve browsing experience and analyze traffic. By using the site, you agree to our <a href=\"/cookies/\" class=\"font-semibold text-brand-primary underline decoration-brand-primary/30 underline-offset-4 hover:decoration-brand-primary transition-all\">cookie policy</a>."` | Existing consent explanation and embedded policy link | Conditional CookieConsent on all active Layout pages | No | Yes — conditional shared copy | Single shared English source, not translated by nova.json. Description uses set:html; preserve supported safe link/markup. Banner max-width 400px at md; nowrap buttons. |
| `acceptLabel` | `"Accept"` | Existing consent-button/default-hover label | Conditional CookieConsent on all active Layout pages | No | Yes — conditional shared copy | Single shared English source, not translated by nova.json. Description uses set:html; preserve supported safe link/markup. Banner max-width 400px at md; nowrap buttons. |
| `essentialLabel` | `"Essential"` | Existing consent-button/default-hover label | Conditional CookieConsent on all active Layout pages | No | Yes — conditional shared copy | Single shared English source, not translated by nova.json. Description uses set:html; preserve supported safe link/markup. Banner max-width 400px at md; nowrap buttons. |
| `hover` | `"Got it!"` | Existing consent-button/default-hover label | Conditional CookieConsent on all active Layout pages | No | Yes — conditional shared copy | Single shared English source, not translated by nova.json. Description uses set:html; preserve supported safe link/markup. Banner max-width 400px at md; nowrap buttons. |
| `essentialHover` | `"Only these"` | Existing consent-button/default-hover label | Conditional CookieConsent on all active Layout pages | No | Yes — conditional shared copy | Single shared English source, not translated by nova.json. Description uses set:html; preserve supported safe link/markup. Banner max-width 400px at md; nowrap buttons. |

Cookie fallback literals if data is empty: title `Prywatność i Cookies`; accept `Akceptuję`; essential `Niezbędne`; accept hover `Rozumiem!`; essential hover `Tylko te` (after essentialLabel fallback). Description fallback is hardcoded Polish text:

> Używamy plików cookie, aby poprawić wygodę przeglądania. Korzystając ze strony, zgadzasz się na naszą [politykę prywatności](/cookies/).

Actual fallback HTML uses the existing `/cookies/` link and styling classes from CookieConsent. These literals are code-owned: no data-only replacement of the fallback itself. Nonempty existing JSON fields prevent the fallback. No cookie-policy claims are written here.

ImageLightbox is mounted globally but active ProjectsBlock has no lightbox triggers; its cards navigate to the shared fragment. Labels below are conditional production UI, not an active project-gallery capability:

**Source file:** `src/data/global/lightbox.json`.

| JSON path/key | Current value | Intended real-world information | Used by / dependencies | Localized: yes/no | Safe data-only replacement | Notes/constraints |
| --- | --- | --- | --- | --- | --- | --- |
| `closeLabel` | `"Close preview"` | Existing accessible preview-control label | Globally mounted ImageLightbox; existing triggers only | No | Yes — conditional shared copy | Not localized. No active project trigger; next/previous depends on gallery. Generic labels are not project details. |
| `alt` | `"Enlarged image preview"` | Generic accessible image-preview text | Globally mounted ImageLightbox; existing triggers only | No | Yes — conditional shared copy | Not localized. No active project trigger; next/previous depends on gallery. Generic labels are not project details. |
| `prevLabel` | `"Previous image"` | Existing accessible preview-control label | Globally mounted ImageLightbox; existing triggers only | No | Yes — conditional shared copy | Not localized. No active project trigger; next/previous depends on gallery. Generic labels are not project details. |
| `nextLabel` | `"Next image"` | Existing accessible preview-control label | Globally mounted ImageLightbox; existing triggers only | No | Yes — conditional shared copy | Not localized. No active project trigger; next/previous depends on gallery. Generic labels are not project details. |
| `emptyLabel` | `"No image preview"` | Existing empty-preview feedback | Globally mounted ImageLightbox; existing triggers only | No | Yes — conditional shared copy | Not localized. No active project trigger; next/previous depends on gallery. Generic labels are not project details. |

**Source file:** `src/data/global/custom-code.json`.

| JSON path/key | Current value | Intended real-world information | Used by / dependencies | Localized: yes/no | Safe data-only replacement | Notes/constraints |
| --- | --- | --- | --- | --- | --- | --- |
| `customHead` | `""` | Existing raw custom-code injection slot (currently empty) | Layout head | No | No — custom code outside migration | set:html can inject scripts/markup. Do not populate to bypass content contracts. |
| `customBodyEnd` | `""` | Existing raw custom-code injection slot (currently empty) | Layout body end | No | No — custom code outside migration | set:html can inject scripts/markup. Do not populate to bypass content contracts. |


| Source | Current value / item | Safe to replace during migration | Structural / license-sensitive / decision | Notes |
| --- | --- | --- | --- | --- |
| Toast.astro / aria-label | `"Komunikaty"` | No — code-owned accessible label | Shared interaction structure; later localization decision | Toast root exists; no business copy stored here. |
| public/js/toast.js / close aria-label | `"Zamknij komunikat"` | No — code-owned conditional label | Later explicit localization task | Appears when a non-loading toast is created. |
| public/js/lightbox.js / fallback | `"Brak podglądu obrazu"` | No — interaction engine | Conditional empty/error fallback | JSON supplies dialog label; script can use literal when item alt/title missing. |
| SmartImage.astro / missing source | Neutral landscape-placeholder SVG in aspect-video wrapper | No — protected primitive | Structural fallback; real asset input needed | Current supplied source paths exist. |
| ServicesHomeBlock / missing icon | `"sparkle"` | No — fallback code; existing icon key supported | Protected existing library behavior | Current records all specify icons. |
| NovaFooterBlock / mountain asset | t001-nova-cta-mountains@1920.webp | Yes — later same-path licensed asset replacement | No JSON footer image slot; user asset decision | Keep background/overlay/structure; Section 12. |
| NovaFooterBlock / distributor | Distributed by ThemeWagon → https://themewagon.com | No — preserve pending direction | Third-party attribution / license-sensitive | Hardcoded across locales; company data does not affect it. |
| Localized footer / author attribution | Values in Section 10 | No — preserve pending direction | Author notice / license-sensitive | LICENSE.md contains terms different from README's MIT label. |
| public/og-image.png | Twoja Firma; Profesjonalne usługi dla Twojego biznesu | Yes — later supplied preview asset | Business/demo image; asset decision | Not generated from nova.json. |
| company branding.favicon → public/favicon.svg | Existing copper N mark on a rounded dark square | Yes — later supplied icon | Business asset; no redesign here | Name changes do not rewrite icon. |
| public/llms.txt | Exact current text below | Yes — later accurate site-description content | Public demo description; user decision | Blog/dark mode/form claims exceed active runtime; no fix here. |

### Current public/llms.txt content

````text
# Nova Template

A business website template (Astro + Tailwind v4) for creative agencies, design studios and ambitious brands, with a modern design, dark mode, a component gallery and a blog.

## Structure

- Homepage: selected work, services, testimonials and contact
- Blog: articles about services and pricing (`src/content/blog`)
- Legal pages: privacy policy, terms and cookies

## Machine-readable notes

- Sitemap: /sitemap-index.xml
- Contact: contact form on the homepage
- Language: configurable with the `lang` prop in `Layout`
````

Bundled form data/PHP, generic header/footer JSON, disabled blog/terms routes and gallery fixtures are not active homepage copy and are not mapped as available slots. Static build removes `send-form.php`; real contact identity does not configure delivery. This map records policy wording/dependencies, not legal conclusions.

# Section 12 — Images and asset slots

All eight local photo families live under `public/assets/images/t001-nova/`. Source image files under `src/assets/raw/` are absent. `SmartImage` builds srcsets only from derivatives present on disk. The pipeline supports WebP and AVIF widths 220/480/640/800/1080/1280/1600/1920; **800 uses no suffix**, not @800. Do not infer missing derivatives or assume originals exist.


| Slot | Current file / URL | Source field and alt-text source | Ratio / dimensions | Mobile behavior | Desktop behavior | Formats actually selected | Matching derivatives needed |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Hero | /assets/images/t001-nova/t001-nova-hero.webp | <locale>.sections.nova-hero-wireframe.image / imageAlt | Source 800×1000 (4:5); attrs 900×1125 (4:5) | Stacks below text; height clamp(22rem,92vw,31rem), object-cover, existing clip | md height clamp(30rem,62vw,38rem), lg clamp(36rem,45vw,48rem); md position center 35%; existing blob clip | SmartImage WebP srcset + AVIF sources | Yes — replace referenced family consistently |
| Project 0 | /assets/images/t001-nova/t001-nova-project-laptop.webp | <locale>.sections.nova-projects.items[0].image / alt | Source 800×533 (~3:2); attrs 1280×800; displayed mobile 3:2 | Single-column 3:2 crop/object-cover | Wider 1.38fr column; height clamp(22rem,34vw,32rem), object-cover | SmartImage WebP srcset + AVIF sources | Yes |
| Project 1 | /assets/images/t001-nova/t001-nova-project-building.webp | <locale>.sections.nova-projects.items[1].image / alt | Source 800×533 (~3:2); attrs 1280×800; displayed mobile 3:2 | Single-column 3:2 crop/object-cover | Narrower 1fr column; same desktop height | SmartImage WebP srcset + AVIF sources | Yes |
| About main image | /assets/images/t001-nova/t001-nova-about-team.webp | <locale>.sections.nova-team.image / imageAlt | Source 800×600 (4:3); attrs 1280×900 (~1.42:1); no CSS fixed ratio | Stacked figure; min-height 20rem; object-cover | md two-column split; width fills column with existing minimum height/crop | SmartImage WebP srcset + AVIF sources | Yes |
| About avatar 0 | /assets/images/t001-nova/t001-nova-avatar-01@220.webp | <locale>.sections.nova-team.teamAvatars[0].src / alt | Source 220×220; circular 1:1 | 40×40 displayed, overlapping stack | 48×48 from sm, overlapping stack | Direct @220.webp raw img; no AVIF/srcset selection | At least referenced WebP; keep replacement family coherent |
| About avatar 1 | /assets/images/t001-nova/t001-nova-avatar-02@220.webp | <locale>.sections.nova-team.teamAvatars[1].src / alt | Source 220×220; circular 1:1 | 40×40 displayed, overlapping stack | 48×48 from sm, overlapping stack | Direct @220.webp raw img; no AVIF/srcset selection | At least referenced WebP; keep replacement family coherent |
| About avatar 2 | /assets/images/t001-nova/t001-nova-avatar-03@220.webp | <locale>.sections.nova-team.teamAvatars[2].src / alt | Source 220×220; circular 1:1 | 40×40 displayed, overlapping stack | 48×48 from sm, overlapping stack | Direct @220.webp raw img; no AVIF/srcset selection | At least referenced WebP; keep replacement family coherent |
| Footer mountain background | /assets/images/t001-nova/t001-nova-cta-mountains@1920.webp | Hardcoded NovaFooterBlock inline style; no alt field | Source 1920×640 (3:1); displayed ratio follows content | Cover/center crops to variable footer height | Cover/center behind CTA/nav/credits | Explicit WebP CSS background; no AVIF/srcset selection | Replace exact @1920.webp and coordinate family; no data-only URL field |

Current localized photo/alt values are mapped in Sections 4, 5 and 7. Decorative footer background has no alternative-text slot. Do not introduce an alt field expecting it to render.

## Exact existing local derivative families

Each basename below is relative to `public/assets/images/t001-nova/`. All **92 files** are enumerated from disk, not inferred from maximum pipeline widths.

### t001-nova-about-team

```text
t001-nova-about-team.avif
t001-nova-about-team.webp
t001-nova-about-team@1080.avif
t001-nova-about-team@1080.webp
t001-nova-about-team@1280.avif
t001-nova-about-team@1280.webp
t001-nova-about-team@220.avif
t001-nova-about-team@220.webp
t001-nova-about-team@480.avif
t001-nova-about-team@480.webp
t001-nova-about-team@640.avif
t001-nova-about-team@640.webp
```

### t001-nova-avatar-01

```text
t001-nova-avatar-01.avif
t001-nova-avatar-01.webp
t001-nova-avatar-01@1080.avif
t001-nova-avatar-01@1080.webp
t001-nova-avatar-01@220.avif
t001-nova-avatar-01@220.webp
t001-nova-avatar-01@480.avif
t001-nova-avatar-01@480.webp
t001-nova-avatar-01@640.avif
t001-nova-avatar-01@640.webp
```

### t001-nova-avatar-02

```text
t001-nova-avatar-02.avif
t001-nova-avatar-02.webp
t001-nova-avatar-02@1080.avif
t001-nova-avatar-02@1080.webp
t001-nova-avatar-02@220.avif
t001-nova-avatar-02@220.webp
t001-nova-avatar-02@480.avif
t001-nova-avatar-02@480.webp
t001-nova-avatar-02@640.avif
t001-nova-avatar-02@640.webp
```

### t001-nova-avatar-03

```text
t001-nova-avatar-03.avif
t001-nova-avatar-03.webp
t001-nova-avatar-03@1080.avif
t001-nova-avatar-03@1080.webp
t001-nova-avatar-03@220.avif
t001-nova-avatar-03@220.webp
t001-nova-avatar-03@480.avif
t001-nova-avatar-03@480.webp
t001-nova-avatar-03@640.avif
t001-nova-avatar-03@640.webp
```

### t001-nova-cta-mountains

```text
t001-nova-cta-mountains.avif
t001-nova-cta-mountains.webp
t001-nova-cta-mountains@1080.avif
t001-nova-cta-mountains@1080.webp
t001-nova-cta-mountains@1280.avif
t001-nova-cta-mountains@1280.webp
t001-nova-cta-mountains@1600.avif
t001-nova-cta-mountains@1600.webp
t001-nova-cta-mountains@1920.avif
t001-nova-cta-mountains@1920.webp
t001-nova-cta-mountains@220.avif
t001-nova-cta-mountains@220.webp
t001-nova-cta-mountains@480.avif
t001-nova-cta-mountains@480.webp
t001-nova-cta-mountains@640.avif
t001-nova-cta-mountains@640.webp
```

### t001-nova-hero

```text
t001-nova-hero.avif
t001-nova-hero.webp
t001-nova-hero@1080.avif
t001-nova-hero@1080.webp
t001-nova-hero@220.avif
t001-nova-hero@220.webp
t001-nova-hero@480.avif
t001-nova-hero@480.webp
t001-nova-hero@640.avif
t001-nova-hero@640.webp
```

### t001-nova-project-building

```text
t001-nova-project-building.avif
t001-nova-project-building.webp
t001-nova-project-building@1080.avif
t001-nova-project-building@1080.webp
t001-nova-project-building@1280.avif
t001-nova-project-building@1280.webp
t001-nova-project-building@220.avif
t001-nova-project-building@220.webp
t001-nova-project-building@480.avif
t001-nova-project-building@480.webp
t001-nova-project-building@640.avif
t001-nova-project-building@640.webp
```

### t001-nova-project-laptop

```text
t001-nova-project-laptop.avif
t001-nova-project-laptop.webp
t001-nova-project-laptop@1080.avif
t001-nova-project-laptop@1080.webp
t001-nova-project-laptop@1280.avif
t001-nova-project-laptop@1280.webp
t001-nova-project-laptop@220.avif
t001-nova-project-laptop@220.webp
t001-nova-project-laptop@480.avif
t001-nova-project-laptop@480.webp
t001-nova-project-laptop@640.avif
t001-nova-project-laptop@640.webp
```

## Other homepage identity/portrait asset slots


| Slot | Current asset/reference | Source / accessible text | Presentation | Derivative requirement | Replacement contract |
| --- | --- | --- | --- | --- | --- |
| Testimonial portrait 0 | https://i.pravatar.cc/150?u=anna-kowalska | <locale>.sections.testimonial-v2.items[0].avatar; alt derives avatarAltPrefix + author | 40×40 circular crop mobile/desktop; direct raw img | No local derivatives; authorized supplied image/URL; failure reveals initials | Yes through existing avatar value; preserve remote CSP compatibility |
| Testimonial portrait 1 | https://i.pravatar.cc/150?u=michal-nowak | <locale>.sections.testimonial-v2.items[1].avatar; alt derives avatarAltPrefix + author | 40×40 circular crop mobile/desktop; direct raw img | No local derivatives; authorized supplied image/URL; failure reveals initials | Yes through existing avatar value; preserve remote CSP compatibility |
| Testimonial portrait 2 | https://i.pravatar.cc/150?u=karolina-wojcik | <locale>.sections.testimonial-v2.items[2].avatar; alt derives avatarAltPrefix + author | 40×40 circular crop mobile/desktop; direct raw img | No local derivatives; authorized supplied image/URL; failure reveals initials | Yes through existing avatar value; preserve remote CSP compatibility |
| Logo image (currently wordmark) | company.branding.logoImage = empty string | company.branding.logoImage; alt company.name + logoSuffix | Uppercase NOVA currently; optional image h-11/lg:h-14, w-auto/object-contain | No SmartImage derivative family | Yes existing key + supplied asset; no component change |
| Favicon | /favicon.svg | company.branding.favicon; no alt field | Browser tab icon; no body crop | Current SVG; PNG/ICO/apple-touch files are separate fallback assets | Yes supplied asset/current path; coordinate fallback bundle |
| Social preview | /og-image.png | seo.defaultOgImage; metadata alt derives page title | 1200×630 (~1.9:1), external social preview | PNG; no WebP/AVIF srcset; schema fixed same PNG name | Yes supplied asset; coordinate schema filename/metadata |

Testimonial URLs are identical across locales for each record; localized author spelling changes derived alt. There is no per-testimonial alt key. Current OG PNG contains demo wording identified in Section 2. Existing SVG decoration, line separators, avatar geometry, fonts and icons remain presentation infrastructure.

# Section 13 — Current content cardinality

Array contracts allow different lengths; that does not authorize changing composition. Initial migration preserves observed counts unless explicitly directed.


| Content group | Current count per locale | Visually significant? | Data structure accepts count change? | Potential layout/behavior effect |
| --- | --- | --- | --- | --- |
| Hero statistics | EN 4 placeholders / PL retired | Yes: mobile 2×2 / md four columns | Yes — array | Changes row count and nth-child separators. |
| Hero trust names | EN 0 / PL retired | Yes: kicker plus five names | Yes — string array | Changes mobile grid and lg nonwrapping strip. |
| Projects | 2 | Yes: asymmetric pair | Yes — item array | Changes rows or leaves asymmetric pair incomplete. |
| Services | 4 | Yes: desktop four-column grid | Yes — item array | Changes density at one/two/four columns. |
| Team/about checks | 3 | Yes: checklist density | Yes — string array | Changes text height/image balance. |
| Team/about avatars | EN 0, 3 labeled capabilities / PL retired | Yes: overlapping stack | Yes — {src,alt} array | Changes width and relationship to count/label. |
| FAQs | 4 | Yes: accordion length | Yes — {q,a} array | Changes height; first supplied item opens. |
| Testimonials | Not rendered; PL retired | Yes: reordered/repeated tracks | Yes — record array | Changes track heights and rotation meaning; current 27 DOM cards. |
| Navigation menu | EN 3 / PL retired | Yes: desktop horizontal fit | Yes — menu array | Changes fit/drawer stagger; no implicit entries. |
| Footer navigation / legal links | EN 3 / 2; PL retired | Yes: grid/wrapping | Yes — link arrays | Changes footer density; routes/IDs protected. |

# Section 14 — Required input from Anthony

This checklist is derived from existing slots, not proposed copy. Missing evidence is a user-decision gap, not an invitation to invent claims. Preserve unknown Polish structures and flag translation gaps.

### Identity

- [ ] Actual public short business name and full business identity for name/fullName.
- [ ] Supplied logo asset/path, or instruction to use the existing text-wordmark mechanism with the actual name.
- [ ] Favicon asset and logo accessibility suffix if relevant.
- [ ] Verified applicability/value of existing NIP/KRS/REGON slots; no inferred registration.
- [ ] Supplied legal identity/document text for active legal pages; unresolved policy questions retained for later decision.

### Professional positioning

- [ ] Actual positioning for existing metadata, introductions, headings/descriptions and global default description.
- [x] Polish localization retired; no translation dependency remains.
- [ ] Truthful classification of supplied client, employment, personal, concept, experimental or mock-business work; no classification inferred from demo content.

### Hero

- [x] English hero headline split and supporting introduction implemented under guided autonomy; exact text in source completion record.
- [x] View My Work → #realizacje; Work With Me → #contact.
- [x] Hero metrics panel restored with four dash placeholders; verified numeric figures remain pending.
- [x] English trust treatment resolved: empty trust array, conditionally hidden. No verified relationships invented.
- [ ] Hero photo and accurate localized alt.

### Projects

- [x] Two approved English records: The Moody Brewer, then Creative Work, using only title, category, image and alt; exact values in Section 5 and source B2. Polish records remain unchanged.
- [x] English section heading, description and link label approved; exact values in Section 5 and source B2. The completion pass supersedes the temporary self-link with Discuss a Project → #contact; #realizacje remains the work-section navigation anchor.
- [ ] Separate direction if individual links/descriptions/technologies/case studies are later requested; those are not existing inputs.

### Services

- [x] Four approved English service titles and exact descriptions in B3 order; current values recorded in Section 6. Polish records remain unchanged.
- [x] English section title, description and link label approved; exact values recorded in Section 6 and source B3. The completion pass supersedes the section self-link with Discuss a Project → #contact; #services remains the navigation anchor.
- [ ] Existing-library icon identifiers if replacements are supplied; retain numbering and unsupported-link boundary.

### About/founder

- [x] About Anthony and exact founder paragraph implemented; see source completion record.
- [x] Three exact approved founder checks implemented.
- [x] 1 / Founder-led; no employee implication.
- [x] Existing Anthony photo/alt retained; three labeled Phosphor capabilities replace English avatars.
- [x] Let’s Work Together → #contact, superseding About self-link.
- [x] User-approved small local capability branch implemented; Polish avatars remain.

### FAQ

- [x] Four factual English question/answer pairs written under guided autonomy and recorded in source.
- [x] English FAQ heading and practical intro implemented.
- [x] Demo timelines/handoff assumptions replaced with documented service/inquiry facts.

### Testimonials

- [x] User-approved English removal implemented; real endorsements remain unavailable.
- [ ] Optional authorized portrait for each record.
- [ ] Section heading/intro and localized avatar-alt prefix.
- [ ] Real endorsement evidence; no invented outcomes, names or roles.

### Contact information

- [ ] Actual public phone, email, address, city, postal code and business hours for existing global/schema/legal slots.
- [ ] Facts needed to identify mismatches with existing country/coordinate/day/hour assumptions before separately scoped schema work.
- [x] English footer primary action now derives mailto from company.email. Form transport/admin remains future work.

### Social links

- [x] Approved primary Instagram/LinkedIn/GitHub/YouTube URLs wired; Facebook/X empty and personal Instagram omitted.
- [x] LinkedIn/GitHub rendering gap resolved by minimal existing social-helper extension.

### SEO/domain

- [ ] Public URL, localized homepage title/description and global defaults.
- [ ] Social-preview asset.
- [ ] Deployment URL/base-path facts to coordinate existing sources later.
- [ ] Explicit indexing instruction if/when needed; current noindex remains.
- [ ] Later direction on template promotion/attribution respecting author notices and bundled terms.

### Images/assets

- [ ] Hero, two project images, about photo, three avatar images and optional authorized testimonial portraits.
- [ ] Supplied footer background if replacement is requested, preserving presentation.
- [ ] Logo/favicon/OG assets as applicable.
- [ ] Actual source images, dimensions and usage rights; originals of demo derivatives are not assumed available.
- [ ] Accurate localized alt where supported.
- [ ] Coordinated SmartImage WebP/AVIF/width families and exact raw-img/CSS references.

# Section 15 — Data file migration order

Future data-first sequence only; no stage is executed. Update supplied content and preserve Polish structures when equivalents are unknown.


| Future stage | Existing files likely touched | Data-first objective | Dependencies / boundary |
| --- | --- | --- | --- |
| 1. Shared identity | src/data/global/company.json | Verified identity/contact/social values and supported asset paths | Avoid SMTP/font keys; report independent schema assumptions. |
| 2. URL and metadata | site.config.mjs; src/data/global/seo.json; src/data/i18n/nova.json page | Supplied domain and localized/global metadata | Coordinate Layout/schema/sitemap/legal URLs; preserve indexing; report preview-script mismatch. |
| 3. Navigation and hero | src/data/i18n/nova.json navigation + nova-hero-wireframe | Existing labels, introduction and verified records | No anchors/variants/count changes; no invented metrics/trust. |
| 4. Projects | src/data/i18n/nova.json nova-projects | Two four-field items and intro/link label | No arbitrary per-item URLs/descriptions/technologies. |
| 5. Services/about | src/data/i18n/nova.json nova-services + nova-team | Four services and existing about/check/count/avatar fields | Fit existing density; flag missing truthful count/avatar meaning. |
| 6. FAQ/testimonials | src/data/i18n/nova.json faq3 + testimonial-v2 | Actual FAQ and real supplied testimonials | Missing testimonials remain user decision; no removal. |
| 7. Footer/support labels | src/data/i18n/nova.json footer; relevant src/data/global/*.json | Existing CTA/navigation/support copy | Preserve attribution/anchors; tracking/form/custom-code separate. |
| 8. Legal/404 | src/content/legal/privacy-policy.json; privacy-policy-pl.json; cookies.json; cookies-pl.json; src/data/global/legal.json; src/data/pages/404.json | Supplied legal/error text and dates | Report hardcoded title/anchor/schema limits, no rendering rewrite. |
| 9. Supplied assets | public/assets/images/t001-nova/*; current logo/favicon/OG assets and data path keys | Coordinated supplied-asset replacements | Separate asset step; preserve crop and raw/derivative paths. No image generation. |
| 10. Base copy, only if included | src/data/sections/nova-hero-wireframe.json; nova-projects.json; nova-services.json; nova-team.json; faq3.json; testimonial-v2.json; src/data/pages/index.json base seo/heading | Align corresponding base content with supplied data | Does not replace localized edits; don't edit page sections; nova-cta.json isn't active footer content. |
| 11. Static public copy, only if included | public/llms.txt | Supplied accurate machine-readable description | No unrelated documentation cleanup; promotion decisions explicit. |
| 12. Future validation | No content edits implied | Documented ai:check/build/link/image/SEO and desktop/mobile verification | Install/build generate files; not run during this document-only step. |

# Section 16 — Do-not-touch list

Initial content migration preserves the following unless a separately scoped explicit requirement authorizes necessary work:

- `AGENTS.md`, governing documentation, `LICENSE.md`, `ASSETS-LICENSES.md` and required author notices.
- `src/data/pages/index.json.sections`, section order/IDs/variants; route composition in `src/pages/*.astro` and `src/pages/pl/*.astro`.
- `design/nova.md`, global/scoped CSS, generated `themes.css`, `tailwind-theme.css`, `tailwind.tokens.js` and Phosphor CSS.
- `src/components/PageBuilder.astro`, `src/config/section-registry.ts` and registry modules, `component-manifest.ts`, `component-map.ts`, data contracts/resolution utilities.
- Active section markup/scoped styles, `Layout.astro`, `LegalLayout.astro`, typography/button/card/image/layout primitives.
- `public/js/motion.js`, `lenis.js`, `lenis-lib.min.js`, `navbar.js`, `accordion.js`, `lightbox.js`; lifecycle/reduced-motion behavior.
- Form transport, `public/send-form.php`, browser form-handler, CSP and contact processing.
- `src/studio/`, development catalog, `src/pages/_disabled/`, QA fixtures and unrelated bundled variants.
- Dependencies/lockfile, Astro/TypeScript configuration, shadcn/Starwind configuration.
- `src/scripts/`, build/packaging/generation scripts in `scripts/`, contract tests, audit tooling and deployment behavior.

Supported-by-data values that remain structural/protected include navigation hrefs, hero CTA hrefs, project/services linkHref, team buttonHref, footer destinations, legal contact hrefs, section IDs and locale routes. Visible labels remain separate.

## Verification of this map

- Localized/shared values were extracted directly from active source JSON, not reconstructed from preview/base examples.
- Stored-but-unrendered, hardcoded and derived values are distinguished.
- Unsupported project/about/social/form fields are not presented as active capacity.
- All 92 local photo derivatives were inventoried; key source dimensions and OG PNG lettering were inspected read-only.
- No replacement copy, translation, project outcome, metric, service, endorsement or visual concept was created.
- Before creation, 734 existing files (including AGENTS.md) were hashed; aggregate SHA-256: `e96bf8cc9176b133e40d7d96e1556c6c5726e2e57fc4140598d312d843bb8f16`.
- Completion verification compares the file set and hashes excluding only this new document. No build result is claimed.

# Section 17 — Migration rule

Future implementation should first fit supplied real information into the existing data schema, item counts, text hierarchy, imagery expectations, section order and component contracts. Missing evidence or translations must be reported. If a requirement cannot be represented correctly, report that limitation before any architectural or visual change. This map does not authorize a migration stage.

> Content should be adapted to Nova before Nova is adapted to the content.
