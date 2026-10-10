# Production readiness and visual QA — October 10, 2026

## Final pre-launch cleanup update — October 10, 2026

**Local P0/P1 content and configuration-presentation fixes are implemented; HOLD the actual domain cutover until the manual deployment gates are verified.** The earlier findings and scores below are retained as historical audit evidence, not the current unresolved content state.

Resolved: false public legal/company address and registration information; LocalBusiness geography/hours/legacy image replaced with approved Organization/WebSite facts; schema staging origin now follows Layout; dash hero metrics hidden through empty English data; six legacy 301 redirects added; factual privacy/cookie disclosure and llms.txt; missing-configuration Zoom hidden and disabled, with new stale submissions rejected before a booking write. Email renderer already has safe branding, useful alt/dimensions and complete plain text and was preserved. No artwork, migrations, authentication, CRM/proposal/invoice/pricing or booking calculation changes are made.

Remaining **manual gates, not diagnosed missing secrets**: verify applied migrations 001–009/intended Neon branch; Functions variable scopes and stable token keys; Builds PUBLIC_SITE_URL for staging/production; deployed owned Identity and project/document/email/phone-booking smoke test; verified Resend sender DKIM/SPF and reply behavior; deploy these changes to staging and verify them; move the production domain only after sign-off and confirm HTTPS/assets/routes. DMARC status is unknown and manual hardening is recommended, not claimed present. Outlook/Zoom are intentionally dormant and are not prerequisites. Indexing stays off until the documented post-cutover switch.

The domain switch checklist and email/URL architecture are in [INQUIRY_ADMIN_SETUP.md](INQUIRY_ADMIN_SETUP.md#final-pre-launch-cleanup--october-10-2026).

### Cleanup validation

- All 83 source JSON files parse. Full focused CRM/proposal/invoice/communication/booking/integration/URL/metadata run: **385 tests pass across 14 files**. Additional booking/metadata rerun after blocking all unexpected fetches in the booking harness: **68 pass**. Added coverage verifies phone-only missing-provider behavior, rejected Zoom writes/activity, configured Zoom and retry integrity, factual schema, staging origins, preview indexing guards and complete image-blocked/plain-text email.
- Astro/TypeScript: zero errors. Direct Astro builds succeed with 16 pages for both intentionally staged PUBLIC_SITE_URL and default production origin. No asset generators are run. All 11 Netlify Functions bundle with Node 22/esbuild.
- Metadata/schema inspection: 16 noindex HTML pages, 12 parsed Organization/WebSite records, approved OG/Twitter/logo origins in both builds, no false address/geography/hours. Sensitive routes remain independently noindex and outside sitemap. No server-secret identifiers/connection strings appear in HTML/browser JS; no missing internal page links. All 134 portfolio records and image paths remain valid.
- Netlify’s installed redirect parser accepts the config: six new permanent legacy rules plus two preserved Polish rules precede the general rewrite, with no direct loops. Seven existing role-conditioned admin route gates retain their anonymous login fallback; focused tests cover anonymous/non-admin Function denial and public DTO allowlists, frozen token-free mail and stale edit behavior.
- Local Chrome: **60 responsive checks at 320/375/430/768/1024/1440px** cover homepage, privacy, cookies, portfolio, login, public proposal/invoice, phone-only/configured-Zoom booking and image-blocked email. No horizontal overflow, duplicate IDs, unlabelled visible fields or browser exceptions. Tab skips the hidden disabled Zoom option to the date field. Public document data/Identity use synthetic intercepted responses; invoice-view acknowledgment is intercepted, and no real client booking/email/provider action occurs. Visual captures inspected. A new privacy heading collision with the existing contact footer was fixed in content.
- Anonymous public staging OG/navbar-logo/favicon downloads return the approved files byte-for-byte (SHA-256). Production output includes those identical assets under the intended production URLs; domain assignment is still pending. Source baseline comparison preserves all 1,934 production/legacy artwork files and all nine migrations. Existing admin CSS/booking CSS/AdminLayout, Polish locale, portfolio, dependencies and provider adapters remain unchanged by cleanup.
- The only remaining cutover blockers are the manual deployment/configuration and owned workflow checks above. No domain transfer, deployment, DNS modification or live migration is performed.

### Placeholder and staging-reference classification

Resolved production-facing residue: Warsaw/example street/postal code/dummy NIP/KRS/hours in shared company/legal content; fixed PL/coordinates/hours/price/image schema assertions; unsupported template processing/newsletter/advertising/legal-authority claims; dash-only homepage metrics; template llms.txt product description; missing legacy destinations. No new registration/legal/tax facts are substituted.

Preserved intentionally: test fixtures use example.test/example.com and synthetic records; inactive generic form data/PHP SMTP placeholders and disabled legal/demo pages are not the active inquiry transport or routed homepage; Polish locale/demo sections are retired/inactive; portfolio concepts remain labeled concepts; template implementation identifiers (including WebScaleCookies and motion globals) are internal compatibility APIs, not visible brand credits. Legacy unused placeholder artwork is not referenced by current metadata and is preserved under the no-asset-change constraint. HTML template tags/CSS grid-template and legitimate input placeholders are not false business claims. Current rendered public text, metadata and document shells contain no false address/IDs or visible ThemeWagon/WebScale brand attribution.

All exact vs-site-v3.netlify.app source occurrences are documentation/environment examples in this audit, setup, migration map and content source, or staging-origin fixtures/assertions in src/layouts/social-metadata.test.ts. No component/server runtime contains that literal. An intentionally staged build contains it in canonical, OG/Twitter and schema output because PUBLIC_SITE_URL was supplied; this is configured output, not a hardcoded production dependency.

## Decision

**HOLD domain cutover until the confirmed content blockers and deployment gates below are resolved.** No new business feature or business-logic defect was found that required implementation in this pass. The low-risk admin presentation corrections are implemented locally; nothing was deployed.

These are subjective product/design scores based on the inspected screens and verified source/build behavior, not Lighthouse or WCAG certification:

| Surface | Score /10 | Meaning |
| --- | ---: | --- |
| Public site | 8.2 | Strong authentic visual work; dash metrics and legal/schema residue prevent launch polish. |
| Admin/back-office | 8.5 | Consistent compact Nova controls and clearer actions after this pass. |
| Mobile admin | 8.3 | Usable at 320px; long inquiry/pipeline workflows remain more scroll-heavy than ideal. |
| Production readiness | 6.5 | Functionality and focused checks are strong; public identity facts and deployment configuration are not signed off. |

## Evidence and scope

Inspected AGENTS.md, Nova guidance/tokens, AdminLayout, all seven admin routes, every component in `src/components/admin/`, proposal/invoice editors/documents, booking controls/styles/dialogs, relevant client/server contracts, production metadata, build scripts and Netlify routing. Active routes and rendered output take precedence over historical migration notes.

Local browser data is synthetic. Identity, email and provider responses are mocked; database fixtures use isolated PGlite with migrations 001–009. No real Neon connection, invitation, outgoing email, provider action, migration execution or deployment occurs. Read-only Netlify project/deploy metadata and anonymous public HEAD checks supplement local checks. No secret values are read or reported.

Current portfolio is **134 records / six filters**, including YouTube Thumbnails, rather than the older 98-record/five-filter milestone. All 134 records retain their assets/classifications and remain available. All starts with 12 and reveals 12 more per action; category and `creative` query aliases remain intact.

## Visual scores by admin area

H = hierarchy, S = spacing, T = typography, C = control consistency, D = density, M = mobile usability, N = Nova alignment, P = overall polish. Scores describe the final local presentation.

| Area | H | S | T | C | D | M | N | P |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Login / recovery form shell | 8.8 | 8.7 | 8.8 | 8.8 | 8.6 | 8.6 | 8.9 | 8.8 |
| Inquiry list / filters | 8.5 | 8.4 | 8.7 | 8.7 | 8.2 | 8.1 | 8.7 | 8.4 |
| Pipeline | 8.3 | 8.2 | 8.6 | 8.7 | 8.0 | 7.8 | 8.6 | 8.2 |
| Inquiry detail | 8.6 | 8.5 | 8.7 | 8.7 | 8.3 | 8.1 | 8.7 | 8.5 |
| Follow-up | 8.7 | 8.6 | 8.7 | 8.8 | 8.5 | 8.4 | 8.7 | 8.6 |
| Communication composer/history | 8.5 | 8.4 | 8.6 | 8.7 | 8.2 | 8.0 | 8.6 | 8.4 |
| Proposal editor | 8.7 | 8.7 | 8.7 | 8.8 | 8.5 | 8.3 | 8.8 | 8.7 |
| Invoice editor | 8.8 | 8.7 | 8.7 | 8.8 | 8.6 | 8.4 | 8.8 | 8.8 |
| Booking controls / detail | 8.7 | 8.6 | 8.6 | 8.7 | 8.5 | 8.3 | 8.7 | 8.6 |
| Calendar month / agenda | 8.7 | 8.6 | 8.6 | 8.7 | 8.4 | 8.5 | 8.7 | 8.6 |
| Availability / exceptions | 8.5 | 8.5 | 8.6 | 8.7 | 8.4 | 8.3 | 8.7 | 8.5 |
| Integrations settings | 8.6 | 8.5 | 8.6 | 8.7 | 8.4 | 8.3 | 8.7 | 8.5 |
| Activity history | 8.4 | 8.4 | 8.5 | 8.5 | 8.4 | 8.2 | 8.6 | 8.4 |
| Confirmation dialogs | 8.9 | 8.8 | 8.8 | 8.9 | 8.7 | 8.8 | 8.9 | 8.9 |
| Empty / error / loading states | 8.5 | 8.5 | 8.6 | 8.6 | 8.3 | 8.3 | 8.7 | 8.5 |

Pipeline mobile usability is below 8 because seven stages stack vertically and the global metrics/filter area precedes the board. Finding later stages takes substantial scrolling even with little data. It is not overflowing or inaccessible; collapsing/filtering stage presentation would need a separately scoped UX decision. The desktop board intentionally scrolls within its region, with keyboard focus and horizontal overflow contained.

## Visual findings, fixes and remaining work

| Area | Main issue before this pass | Fix applied | Remaining issue |
| --- | --- | --- | --- |
| Login | Pill inputs, widely tracked labels, heavy primary shadow; mobile form sat low below the mark. | Shared compact controls, Satoshi labels, restrained shadow-free actions, earlier mobile form placement; approved favicon links. | Live invite/recovery/session flows still require an owned deployed account check. |
| Inquiry list | Marketing-scale pills and shadows mixed with compact filters. | Same compact button/form treatment as booking; smaller-radius status labels. | Metrics/filter toolbar still takes appreciable mobile space. |
| Inquiry detail | Unloaded global metric cards displayed large dashes above the record; small document-link text clipped inside short buttons. | Hide global metrics and follow-up totals only while detail is visible; normalize button height/padding, making proposal/invoice actions readable. | The record still contains many modules; no accordion/navigation redesign was attempted. |
| Follow-up | Oversized uppercase optional label, rounded textarea and equally prominent full-width desktop actions. | Consistent labels/inputs, intrinsic desktop action widths and restrained red Clear action. | Browser-native date/time controls remain intentional. No timestamp behavior changes. |
| Communication | Pills, shadows, overly rounded textarea; configuration errors lacked a consistent panel. | Shared form treatment and contextual error surfaces; read-only recipient has a subdued background. | Long template-variable help and a tall email preview can be refined later. |
| Proposal / invoice | Pill actions/fields, Add item stretched across the panel; pricing fields used unnecessary full-width rows. | Same control system, intrinsic Add item, two-column desktop pricing with full-width notes/totals and clear total separator. | Editor CSS is still duplicated; extracting shared layout is a later refactor. |
| Booking / calendar / availability | Already the strongest compact-control reference. | Existing geometry retained; admin form-border/focus and destructive-action consistency extend to these screens. | Very busy month cells need a future high-density real-data review. Mobile agenda remains the existing fallback. |
| Integrations | Empty metadata paragraphs reserved blank vertical gaps; presentation varied from other admin routes. | Hide empty metadata paragraphs and align labels/actions/error treatment. | Connected account selection and reconnect remain provider-dependent deployment checks. |
| Activity | Simple readable chronological list. | Retained, with surrounding admin consistency. | Larger histories are still long; no pagination/CRM functionality added. |
| Dialogs | Existing styled top-layer dialog already appropriate. | Preserved centered panel, overlay, focus trap and conservative action grouping. | No modal redesign needed. |
| States | Feedback treatment varied between modules. | Scoped error panels unify context without hiding feedback. | Empty document errors could later offer an explicit contact/home action. |

### Button and form system

- **Primary:** save/publish/send/confirm the current task; charcoal filled Nova Button, no marketing shadow.
- **Secondary:** back/view/edit/reload/preview/add; one-pixel outlined Nova Button.
- **Tertiary:** sign out, close/reload where already tertiary; restrained underlined treatment.
- **Destructive:** Clear follow-up, Void, Disconnect, Regenerate, Cancel; explicit text, error token and existing confirmation where the workflow already requires it.

All retain the actual Button atom, text-swap structure and existing click handlers. Compact controls use the existing booking system's 8px radius and approximately 44–46px targets; page/filter-specific responsive structure remains. Forms retain associated labels, native date/time controls, helper/error associations, read-only behavior and existing validation. Status labels remain small and textual; existing semantic colors are retained. No new pill badge system, fonts, colors, library, shadows or animations were introduced.

Satoshi, warm light/cream surfaces, charcoal text, restrained accent, thin borders and the existing radius/spacing tokens remain authoritative. Remaining differences are workflow density, nested pipeline surfaces and duplicate component CSS, not a competing admin theme.

## P0 — confirmed blockers before domain cutover

1. **Public Privacy Policy asserts false business identity/location.** `src/content/legal/privacy-policy.json` expands placeholders from `src/data/global/company.json` through `src/pages/polityka-prywatnosci.astro`, rendering Warsaw, `123 Example Street`, dummy Tax ID and KRS. The policy also retains unverified template processing/legal-authority claims. Replace with approved factual policy content; do not invent an address or determine legal applicability from template prose.
2. **Public LocalBusiness JSON-LD publishes demo location facts.** `src/components/ui/atoms/Schema.astro` emits the Warsaw address, fixed `addressCountry: PL`, fallback coordinates `52.4064 / 16.9252`, unverified hours and legacy `/og-image.png`. This is emitted on public Layout pages despite English/Rhode Island copy. Use approved facts or a suitably limited business/website schema; do not fabricate US street coordinates/hours. Its opening-hours strings also need valid formatting if retained.

These are content/metadata decisions, outside the authorized low-risk visual fix pass. They were reported rather than silently rewritten.

### P0 deployment gates — unverified, not claims of missing configuration

- Confirm migration 009 is applied once to the intended Neon branch before relying on deployed invoices. Repository SQL existence and a Ready deploy do not prove database schema state. Migrations 001–009 remain unchanged here.
- Confirm Functions-scoped production DATABASE_URL, SITE_URL, stable BOOKING_TOKEN_SECRET / INVOICE_TOKEN_SECRET, and verified email configuration on the chosen Netlify project. No local real `.env` is present; the available connector does not expose individual-site environment values/scopes. Actual missing values are **unknown**, not assumed.
- Exercise an owned invite/admin account, recovery/login/session refresh, anonymous/non-admin denial and a deliberate staging inquiry/document/email/phone-booking workflow before sign-off. Local auth/provider mocks and anonymous HEAD checks do not substitute for those authenticated deployment checks.

## P1 — pre-launch decisions/fixes still required

- **Legacy production URLs:** the current live homepage links `/about`, `/contact`, `/graphic-design`, `/packages`, `/privacy`, `/terms`. These pages are not in the new build. Add deliberately approved redirects/content at cutover. Existing `/portfolio` and `/cookies` are supported; `/pl` and `/pl/*` are intentionally retired and already return 301 to `/`.
- Suggested mappings supported by current destinations: `/about` → `/#zespol`; `/contact` → `/start-a-project/`; `/graphic-design` → `/portfolio/?category=creative`; `/privacy` → `/polityka-prywatnosci/`. Decide `/packages` and `/terms` deliberately; no pricing/package page or general Terms content should be invented or misleadingly redirected to Privacy.
- **Homepage metrics:** four dash placeholders remain in the restored Nova metrics band. Keep the existing approval history, but decide whether to hide that band until verified figures exist. No fabricated counts were inserted.
- **Cookie policy accuracy:** `src/content/legal/cookies.json` still describes template analytics/marketing/functional uses; tracking identifiers are blank locally and marketing tools are not enabled by that fact alone. Review against actual public and private behavior before launch.
- **Social-preview staging host:** public OG/Twitter tags intentionally use the production canonical origin. `/volatile-solutions-og.png` returns 200 on staging but currently 404 on the older production site. Recheck social previews after transferring the domain; do not claim staging's production-origin card is currently valid.
- **Dormant Zoom:** the public booking form still offers Zoom when Zoom credentials are absent. A booking can persist while sync fails and no ready join link exists. Either configure/test Zoom before offering it or approve a separate small meeting-option availability change. Do not treat disconnected Outlook as universally blocking: CRM-only phone availability is supported. Connected-but-unavailable Outlook correctly prevents new scheduling/rescheduling.
- **Machine-readable template copy:** `public/llms.txt` still describes “Nova Template,” testimonials/blog/template features and homepage contact form. Replace with approved factual site notes or remove deliberately.

No API/lifecycle/booking/auth changes were made to address these decisions.

## P2 — safe post-launch polish

- Reduce mobile inquiry-filter/metric overhead and improve navigation through many pipeline stages, with a separately scoped UX decision.
- Reduce duplicated proposal/invoice editor CSS; unify page-header/back-link patterns through a shared presentation component if it is worth the refactor.
- Shorten contextual composer help, improve long activity/history browsing and add a deliberate contact/home affordance to unavailable document screens.
- Review a crowded calendar with realistic volumes and consider clearer selected-date treatment without changing scheduling behavior.
- Measure production Lighthouse/performance/contrast budgets after final content/hosting is stable. No Lighthouse score or complete WCAG certification is claimed here.
- Review the legacy regex-like trailing-slash rewrite in netlify.toml; Netlify already normalizes slash matching. It is not needed to make the existing tested public pages work.
- Retire unused public template assets later through the existing build-scope tooling, preserving licenses and approved originals.

## P3 — future enhancements

Stripe/payments, reminders, partial payments/refunds, richer CRM navigation and document-editor abstractions remain separate future work. None were started.

## Production environment

| Setting | Required behavior | Verified state / action |
| --- | --- | --- |
| Build Node | >=22.12.0 | package.json requires it; Netlify NODE_VERSION=22 and published Functions use Node 22/API v2. |
| Build canonical | https://volatile-solutions.net/ | site.config.mjs and company.siteUrl already agree; no hardcoded staging host in active business link generation. |
| SITE_URL | Explicit trusted HTTPS origin in Functions scope | Staging should use its staging origin; production should use volatile-solutions.net. Actual site value/scope not accessible here. |
| EMAIL_PUBLIC_URL | Optional HTTPS asset origin | May be blank to use SITE_URL; if set, it must actually serve logo/assets. Avoid an old/staging override after cutover. |
| DATABASE_URL | Server-only intended Neon branch | Actual value/schema access unverified. No PUBLIC_ prefix. |
| BOOKING_TOKEN_SECRET | Stable 64-hex key | Preserve the existing key for the same booking dataset. No secret was generated/read/changed. |
| INVOICE_TOKEN_SECRET | Stable separate 64-hex key | Preserve the key for published invoice reconstruction/email links. Public hash validation does not justify discarding it. |
| RESEND_API_KEY / EMAIL_FROM / EMAIL_REPLY_TO | Verified server-only sender/reply configuration | Actual provider/domain setup unverified; local missing-config presentation tested with synthetic errors. |
| Microsoft variables | Optional while Outlook stays disconnected | If enabled: CLIENT_ID, CLIENT_SECRET, stable INTEGRATION_ENCRYPTION_KEY and SITE_URL; optional tenant/redirect. A configured redirect must match the trusted origin and registered callback. |
| Zoom variables | Optional for phone-only operation | ACCOUNT_ID, CLIENT_ID, CLIENT_SECRET and USER_ID are needed for usable Zoom calls. See the public Zoom-option decision above. |
| Analytics PUBLIC_ IDs | Optional nonsecret build identifiers | Current data values are blank; no tracking/indexing enabled automatically. |

Runtime secrets in netlify.toml's build environment would not configure Functions. Configure runtime values through the project's environment controls, with appropriate scope/context. No dead Google Calendar environment requirement remains in active code.

## Domain cutover

Read-only Netlify metadata confirms **two distinct projects**: `vs-site-v3` owns the staging alias and currently has a Ready invoice-system deploy; `volatile-solutions` still owns `volatile-solutions.net` and serves the older website. Changing SITE_URL alone will not transfer the domain or deployment.

1. Resolve the P0 content/schema blockers and approve old-URL mappings/policy copy/metric/Zoom decisions.
2. Verify intended Neon migration state, backups, server env scopes/contexts, stable token/encryption keys and email sender configuration. Preserve keys when preserving the same records.
3. Prefer keeping the existing vs-site-v3 project/Identity accounts and transferring the custom domain from the legacy project to it. Keep the old project/deploy available for rollback; do not create another app/Identity system merely for the domain move.
4. Register the production Microsoft Web callback `https://volatile-solutions.net/.netlify/functions/microsoft-calendar-oauth-callback` before changing SITE_URL, if Outlook is being enabled. Set/unset explicit MICROSOFT_REDIRECT_URI accordingly; do not leave an explicit staging callback with a production trusted origin. Preserve the original app/key configuration unless deliberately migrating it.
5. Verify Identity site/email callback URLs, invite/recovery templates and custom-domain behavior on the chosen project. Expect users to sign in on the new hostname; browser cookies do not move between unrelated hostnames.
6. Configure Functions SITE_URL as `https://volatile-solutions.net`; clear or update EMAIL_PUBLIC_URL to an asset origin that serves this build. Static canonicals/OG/company URL are already production-oriented.
7. Deploy the reviewed changes to the selected project, transfer/assign the custom domain at the scheduled cutover, set the primary host and verify DNS/HTTPS and www behavior. No domain or deploy action was performed here.
8. Verify root/portfolio/wizard/legal/404, legacy redirects, anonymous/non-admin/admin boundaries, owned proposal/invoice/booking links and deliberate email/provider checks. Preserve the staging alias for previously issued links unless a tested redirect plan replaces it; email snapshots can retain their original hostname.
9. Recheck `/volatile-solutions-og.png`, VS favicon assets, canonical/OG/Twitter URLs, robots and sitemap on the final host. Only after explicit indexing approval should seo.index be changed; sensitive documents/admin remain noindex/nofollow.

## SEO / social / routing

- Rendered public titles/descriptions and canonicals use Volatile Solutions and the correct production URLs. Portfolio metadata contains no exact item count. Public pages retain **noindex, follow**; this was not enabled for indexing.
- OG/Twitter use the approved `/volatile-solutions-og.png`, image dimensions/alt and summary_large_image. Local/staging image files exist. Schema's legacy image/location is a separate blocker.
- Public favicon points to approved VS assets. AdminLayout now uses the same existing icon/touch icon; no derivative created.
- Sitemap excludes admin/proposal/invoice/book/dev/QA routes. robots allows crawlers to read public noindex tags; it does not independently enable indexing.
- Current rendered public internal page/anchor/asset links pass the build audit. All 134 portfolio asset references exist. All 14 external portfolio URLs returned HTTP 200 in HEAD checks, which confirms availability rather than the correctness of every destination's content.
- Anonymous live HEAD checks: protected admin entry/editor/calendar/integrations routes redirect to login, login is public, six private Functions return 401, `/pl` and a `/pl/*` sample return 301 to `/`. No retired PL source path was falsely counted as a broken production route.

## Security / functional integrity

Existing Identity role checks precede private SQL; mutations retain same-origin protections and parameterized queries. Admin HTML shells contain no inquiry data. Public proposal/invoice/booking APIs remain token-gated and exclude database IDs/private CRM metadata; booking/invoice tokens use hash lookups, while proposal storage retains its existing bearer-token model. Sensitive layouts and APIs retain no-store/no-referrer/noindex controls as appropriate. No runtime secret value was detected/read in browser output.

Published Netlify metadata reports eleven Functions, configured public rate limits and a clean deployment secret scan; this does not independently prove every production secret is configured or that an authenticated end-to-end workflow succeeds.

Final SHA-256 comparison verifies **2,766 original files remain byte-identical**, with two existing files modified, two additions and no removals. All business logic, migrations 001–009, data, dependencies, original assets, public wizard and provider/auth implementation remain unchanged. Only admin presentation files and this report are within scope. Public booking controls keep the same existing `.booking-ui` rule semantics; shared selectors additionally serve `.admin-ui`.

## Files modified / created

Modified:

```text
src/layouts/AdminLayout.astro
src/styles/booking.css
```

Created:

```text
src/styles/admin.css
PRODUCTION_READINESS_AUDIT.md
```

No images/assets, packages, migrations, environment values, business data, auth, server functions, pricing/lifecycle calculations or public content were modified. Temporary repository browser fixtures are removed after checks; temporary browser/server processes are stopped.

## Validation

- **378 focused tests / fourteen suites pass**: invoices, proposals, communications/email adapter, bookings, integrations, inquiries/stores/detail routing, CRM workflow, follow-up/admin routes, URL and social-metadata tests.
- Astro/TypeScript: **zero errors**. Direct Astro static build: **16 pages**, using temporary output and bypassing image generation.
- **76 JSON files parse**; contracts for 52 section files / two page configurations, registry and motion checks pass. All 134 portfolio IDs are unique and referenced local assets exist.
- **385 final state/width checks** at 320/375/430/768/1024/1280/1440px, plus 224 before-fix comparisons. Covers every admin route, list/pipeline/detail/follow-up, composer/history/activity, both editors/items, booking/calendar/agenda/settings/exceptions/integrations, confirmation, empty/failure/configuration/provider states, public routes and unavailable token pages. No page overflow, duplicate IDs, unlabeled visible fields, hidden focus or runtime errors were observed.
- Keyboard checks include confirmation Tab/Shift+Tab trapping, Escape/cancel/focus restoration and portfolio Enter activation/focus preservation. Portfolio category/creative URLs, counts, Load More 12→24, history restoration, homepage project destinations and wizard review pass without submitting an inquiry.
- Focused atomic audit retains the existing ChecklistItem margin violation and HeroSplit pill advisory outside touched files; neither was altered. The known broad template/QA failures were not repaired or rerun through an asset-generating QA chain. No complete-suite green claim is made.
- Python's first remote HEAD attempt failed local certificate validation; curl with normal TLS verification completed the actual live status checks. Browser-driver context/key/hash-navigation issues were corrected in temporary tooling, not production code.

No Lighthouse benchmark, live authenticated workflow, provider connection, paid transaction or production database operation is claimed.

## References

- [Staging project](https://app.netlify.com/projects/vs-site-v3) and [legacy production project](https://app.netlify.com/projects/volatile-solutions): project/deploy/domain state checked read-only.
- [Current production website](https://volatile-solutions.net/): legacy route inventory, distinct existing site and preview-asset availability.
- [Netlify redirect options](https://docs.netlify.com/manage/routing/redirects/redirect-options/): first-match routing, slash normalization, query forwarding and domain-assignment behavior.
- [Netlify environment variables](https://docs.netlify.com/build/environment-variables/overview/): scope/context and runtime configuration.
