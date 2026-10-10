# Client inquiry and admin foundation

## Final pre-launch cleanup — October 10, 2026

This entry supersedes the earlier legal/schema/metrics/legacy-route launch findings. Code is prepared locally; domain transfer, deployment, DNS changes, migrations, live emails and provider connection were not performed. The user reports a successful first Resend email, initially placed in Outlook Junk. That confirms that reported delivery, not ongoing inbox placement or independently verified DNS.

### Manual cutover checklist

1. Confirm migrations 001–009 are applied to the intended Neon branch. Preserve existing invoice/booking token keys and Identity users/admin roles. Do not rotate keys as part of domain cutover.
2. On the existing staging project, set **PUBLIC_SITE_URL=https://vs-site-v3.netlify.app** with **Builds** scope and **SITE_URL=https://vs-site-v3.netlify.app** with **Functions** scope. Rebuild/redeploy for build-time metadata changes. PUBLIC_SITE_URL controls Layout canonical, OG/Twitter and Organization/WebSite URLs; SITE_URL controls secure document, booking and email CTA links. Neither is a secret. Existing site.config.mjs/company.siteUrl retain the intended production origin; the sitemap uses site.config.mjs and production indexing remains off.
3. Verify Functions-scoped DATABASE_URL, stable BOOKING_TOKEN_SECRET/INVOICE_TOKEN_SECRET, RESEND_API_KEY, EMAIL_FROM and EMAIL_REPLY_TO without copying values into browser configuration or source control. EMAIL_FROM must use a Resend-verified owned domain, while EMAIL_REPLY_TO may use the approved volatile-solutions@outlook.com contact. The renderer validates syntax; it cannot verify DNS.
4. In Resend, manually confirm the chosen sending domain is verified and its exact required DKIM/SPF records pass. Keep transactional open/click tracking disabled. Inspect the delivered message’s authentication results and test replies. DMARC is a recommended manual hardening task, **not confirmed configured**; coordinate any policy with all legitimate mail sources rather than adding an unreviewed strict policy. See [verified domains](https://resend.com/docs/dashboard/domains/introduction) and [DMARC guidance](https://resend.com/docs/dashboard/domains/dmarc).
5. **EMAIL_PUBLIC_URL** optionally overrides only email image assets when SITE_URL is set. Leave it empty to follow SITE_URL, or intentionally use the staging HTTPS origin until production serves the new logo. It does not override CTA links when SITE_URL is present. On cutover change SITE_URL and PUBLIC_SITE_URL to **https://volatile-solutions.net**, and clear/update any EMAIL_PUBLIC_URL override. Existing absolute links in already-sent mail are historical and are not rewritten; retain the staging project/link reachability or explicitly plan their redirects. Server reconstruction uses the current trusted origin without changing hashes.
6. Confirm the staging deployment includes the new legal copy, Organization schema, hidden metrics, six legacy redirects and phone-only booking. Then manually move the production domain to the intended existing Netlify project, check DNS/HTTPS and each current asset/document/API/admin route, and preserve Identity email/callback domain configuration. No cutover is performed by this pass.
7. Keep Microsoft/Zoom intentionally unconfigured for launch. Phone scheduling uses CRM availability when Outlook is disconnected; connected-but-failing calendar checks remain conservative. New Zoom choices appear only when all four existing Zoom variables are present; this checks configuration presence, not provider health. Set and test actual credentials/scopes/host before offering Zoom. Existing Zoom bookings/retries/cancel/reschedule remain supported if configuration later becomes unavailable. Missing providers are not launch blockers.
8. Verify the optional analytics identifiers remain empty in launch build configuration: PUBLIC_GA4_MEASUREMENT_ID/PUBLIC_CLARITY_ID plus all four seo.analytics values. Consent controls remain available if optional tracking is deliberately enabled later. Privacy/cookie text reflects this launch configuration, essential Identity storage, actual inquiry/document/booking processing and external links; no compliance guarantee or invented legal details are made.
9. Complete an owned deployed Identity invite/login/recovery/refresh and staging inquiry → proposal → invoice/email plus phone-booking smoke test. Local synthetic tests and anonymous requests cannot confirm the production database/Identity workflow.
10. **Only after cutover and sign-off**, change **src/data/global/seo.json: index=false → true**, remove any STAGING=true override and use production PUBLIC_SITE_URL. Deploy-preview/branch-deploy contexts and .netlify.app metadata origins remain noindex. The former blanket NETLIFY=true guard is replaced by actual preview detection, so a production Netlify build can index after this deliberate switch. AdminLayout and public proposal/invoice/booking pages independently remain noindex, nofollow, excluded from sitemap and protected by existing headers. Verify robots.txt and public metadata after rebuilding.

Local cleanup checks pass: 385 focused tests, 68 additional booking/metadata tests, zero Astro/TypeScript errors, two 16-page direct static builds, 11 Node 22 Function bundles, 60 responsive checks and staging brand-asset byte comparisons. These checks do not replace the manual deployed workflow/DNS gates above.

### Resolved public content and routing

Unverified address/postal/city/hours/registration fields are empty, preserving their shared JSON contract. Organization/WebSite schema uses approved company contact/social details, prepared navbar logo and approved OG image, with the same build origin/base-path as Layout metadata. No location/hours/price assertions are emitted. English hero stats are an empty array, so Nova’s existing conditional removes dash metrics without component/CSS changes.

Permanent redirects: /about → /#zespol; /contact → /start-a-project/; /graphic-design and /packages → /#services; /privacy → /polityka-prywatnosci/; /terms → /start-a-project/. No active Terms route exists: the last redirect provides contact for terms questions and does not pretend Privacy is Terms. Existing /pl and /pl/* 301 behavior is preserved; these rules precede the general slash rewrite.

Email rendering already provides a public absolute approved logo, 240×48 dimensions, useful Volatile Solutions alt, readable message/signature/footer with images blocked and complete plain text including an intentional CTA. No renderer rewrite, tracking pixel or artwork derivative is needed.


## Phase 7: Invoice system — October 9, 2026

The user authorizes the first invoice module after the audit confirmed that only proposals existed. **No Stripe/payment processing is included.** Existing CRM/proposal/communication/booking/calendar/integration behavior remains independent. The user confirms migrations 001–008 are applied; they remain byte-identical. **Migration 009 requires manual Neon execution before deployment.** `database/migrations/009_create_invoices.sql` is created and tested locally only; it is not applied live and nothing is deployed.

### Model, conversion and pricing

- `invoices` and `invoice_items` use UUID IDs, restricted inquiry/proposal relationships, one invoice per accepted proposal, independent item rows, authoritative integer-cent pricing and immutable published content through guarded APIs. Migration 009 adds a composite proposal/inquiry relationship constraint without changing proposal fields/data. Invoice numbering uses a PostgreSQL sequence: **VS-INV-YYYY-NNNN** with the UTC year, a continuous counter, deliberate gaps and no truncation beyond 9999; it does not reset annually or use row counts.
- Creation is an explicit admin **Create invoice** action, never an acceptance side effect. It locks an accepted proposal and atomically snapshots its client identity, title, copied items/rates/quantities, discount/tax/totals/currency and client-facing notes. Private proposal/inquiry notes are excluded. Retries return the same invoice without duplicate creation activity. Later invoice edits do not alter accepted proposal prices/items, and later inquiry/proposal changes cannot alter the invoice snapshot.
- Drafts edit title, issue/due dates, client identity, optional client billing fields, up to 25 item rows, whole-number quantities/rates, fixed discount, tax, notes and terms. Existing proposal BigInt integer-cent calculations and half-up tax on the discounted subtotal are reused. USD is the sole currency; totals/status/payment metadata submitted by the browser are rejected. Stale versions preserve local edits and require explicit reload. Unchanged saves produce no update event.
- Issue date defaults to the current business date. **No due date or 14-day policy is assumed**; choose an explicit due date before Send. Due date cannot precede issue date. Each invoice snapshots the account's configured IANA timezone from booking settings (fallback America/New_York) solely for date interpretation; invoice actions do not change booking configuration. Published status derivation uses that saved business date, not the execution host/browser timezone.

### Billing authority

Sender snapshots use only approved company **name, email, phone and website**. Neither the Warsaw placeholder address/postal fields nor NIP/KRS/other registration values are copied or rendered. No business street address is invented. Client billing address line 1/2, city, region, postal code and country are **optional** and supplied deliberately in the editor. Notes/terms are client-visible; terms default empty. This phase makes no legal/tax-policy assumptions.

### Lifecycle and admin/public routes

- Persisted statuses: **draft, sent, paid, void**. Sent with a first-view timestamp displays **Viewed**; unpaid Sent with due date before the saved business date displays **Overdue**, which takes precedence over Viewed. Paid/Void take precedence over derived states. Reads do not persist Overdue or require a job.
- `/admin/invoices/?invoice=<uuid>&back=<inquiry-context>` reuses AdminLayout, Nova atoms, labeled InquiryField controls, proposal-style editor/preview and the existing confirmation dialog. Identity admin role and server authorization apply; login preserves the invoice return path. Compact inquiry and accepted-proposal summaries show number/status/total/issue/due dates, with Create only when no invoice exists, View when it does, and Edit for Draft only. Inquiry activity provides invoice history.
- **Send invoice** validates the saved draft, requires explicit confirmation, creates its token metadata, publishes the private client URL, marks Sent and freezes content. It does not deliver an email. **Mark as paid** requires confirmation, records `paid_at` and Admin activity, and explicitly describes a manual record rather than processor verification. Only Sent invoices can become Paid/Void, with stale/version protection. Paid cannot be voided; Void cannot become Paid in this phase. Neither action alters inquiry/proposal status.
- `/invoice/<token>/` and `/api/invoice?token=<token>` require no login. Client output is an explicit allowlist: invoice number/title/dates/status, sender and snapshotted client/billing information, items/totals, notes/terms and manual payment status. No UUIDs, token hashes, private CRM data, provider references or admin timestamps are exposed. Accepted public proposal pages link to their own invoice only after it is published; Draft invoices remain private.
- Public GET, admin editor and document/email previews are read-only. After rendering a visible public invoice, the browser submits a same-origin **view acknowledgment**; the server atomically sets first/last viewed times and records **one invoice_viewed event**. Repeat legitimate acknowledgments update last-viewed time without another event or changing the admin stale-edit version. Paid/Void views add no new view event. This identifies a token-authorized document view, not a verified individual or read receipt; hidden pages/link-prefetch GETs do not count.
- Browser **Print / Save as PDF** uses A4 print CSS, brand logo, two-column sender/client details, repeated table headings, protected item rows and grouped totals. Screen controls are hidden in print. No server PDF dependency/service is added.

### Hash-only tokens and communications

Set an additional Functions-scoped secret **INVOICE_TOKEN_SECRET**, generated with `openssl rand -hex 32` (64 hex characters), separately from BOOKING_TOKEN_SECRET/INTEGRATION_ENCRYPTION_KEY. Keep it stable and securely backed up; `.env.example` has an empty placeholder only. Tokens are 256-bit purpose-bound HMAC-SHA-256 over the invoice UUID plus publication timestamp. Only **public_token_hash** and **public_token_created_at** are stored, never a raw bearer token or encrypted token. Hash validation allows already-issued public links to remain usable if the sharing key is temporarily unavailable; reconstruction/copy/email requires restoring the original key. No token-regeneration action is added.

Generated links use existing trusted HTTPS **SITE_URL** handling, never hardcoded staging/production origins. Admin sharing fails safely if the key cannot validate the saved hash; invoice reading still works. The communication dropdown hides unavailable invoice buttons rather than blocking unrelated compositions.

The existing composer supports optional **View Invoice** for a published Sent/Paid invoice belonging to that inquiry. Draft/Void cannot become new invoice email CTAs. Choose one button (Invoice/Proposal/Booking); preview sends nothing, and there is no automatic message on conversion/publication/view/payment/void. Existing recipient restrictions, Resend idempotency keys and retry window remain unchanged.

Migration 009 adds private `invoice_id`, `invoice_token_hash`, `invoice_token_created_at` email snapshots. Stored subject/message/HTML/text replace a used bearer token with **{{INVOICE_TOKEN}}** and rehydrate only at runtime after hash/key validation. Pasted foreign invoice links are rejected; failed message retry validates that its invoice link remains usable. Voiding an invoice prevents sending/retrying its old invoice invitation; existing sent message history remains readable and the public document shows Void. Payment placeholder fields `payment_provider` / `payment_reference` remain NULL; manual Paid only sets status/time. No cards, ACH, processor calls, payment links, webhooks, receipts, partial payments, refunds, recurring invoices, accounting exports, reminders or portal are implemented.

### Activity, security and transaction boundary

New events: **invoice_created, invoice_updated, invoice_sent, invoice_viewed, invoice_paid, invoice_voided**. All except Viewed are Admin; Viewed is Client/token-authorized. Activity contains the invoice relationship/number, not full billing/content/private notes/tokens. Opening editor, typing and previewing create no events. Existing proposal/booking/email activity checks remain.

All private reads authenticate before SQL. Mutations require same origin, strict bounded payloads and parameterized queries. Invoice/items/activity operations use one PostgreSQL data-modifying CTE statement under Neon HTTP, with row locking, uniqueness and advancing millisecond stale versions. Failure rolls back the whole operation. Public token shape/hash lookups, same-origin view acknowledgments, no-store/no-referrer/noindex controls and native Function rate protection (120 requests/minute per IP/domain) apply. Identity/CDN/rate enforcement remains a manual deployed check; no live accounts or secrets are altered locally.



### Phase 7 validation and exact file scope

- **378 focused tests pass across fourteen files**, including 46 invoice tests and all 332 existing CRM/proposal/email/follow-up/booking/provider/URL/social-metadata cases. Tests use mocked Identity/Resend/providers and isolated PGlite, never live Neon, outbound email or provider APIs. Coverage includes full lifecycle, accepted-only/duplicate-safe creation, independent snapshots, integer pricing, explicit dates, stale edits, confirmed transitions, public privacy, hash-only tokens, first-view concurrency, manual Paid, Void, transaction rollback and invoice email snapshots/retry eligibility.
- Astro/TypeScript checks **515 files with zero errors**. Direct Astro static build produces **16 pages** in a temporary output directory, bypassing image generation. All **eleven Netlify Functions** bundle for Node 22/API v2. All **76 data JSON files** parse; data contracts (52 section files / 2 page contracts), registrations and motion checks pass.
- Isolated Chrome checks at **320, 375, 430, 768, 1024 and 1440px** cover draft/published invoice editor, public document, inquiry summary and accepted-proposal editor. Creation, saved edits, stale conflict preservation, explicit Send/Paid/Void confirmation, first/repeat view behavior, proposal invoice link and optional invoice email preview pass. Field-specific quantity, rate and discount errors associate with and focus the correct input, including a second-row rate error, without submitting invalid requests. No horizontal overflow, duplicate IDs, hidden focused elements or runtime exceptions were observed; labels/focus/confirmation dismissal and reduced-motion behavior remain usable.
- Browser Print/Save as PDF produces a **one-page short invoice and a three-page 25-item invoice**. Every PDF page was rendered and visually inspected after print-specific spacing fixes. Logo, billing blocks, repeated table headings, item rows, totals and notes remain readable without overlap; screen controls are excluded.
- Import-path audit retains only **three preexisting relative imports** in inquiry/proposal code; no new import audit finding remains. The previously reported broad template/QA suite failures are outside this pass. This is focused validation, not a claim that the complete template test suite is green. Deployed Identity/CDN roles, native rate enforcement and live account behavior remain manual deployment checks.
- SHA-256 comparison verifies **2,721 original files remain byte-identical**. This includes migrations 001–008, all original public/legacy assets, public/localized data, global styles, dependencies/lockfile, Identity/admin authorization, database access helper, public wizard and booking/integration backend/adapters. Invoice-related proposal/email/activity extensions are listed below. Temporary repository browser fixtures were removed and their isolated servers/browser stopped. No production assets were generated.

Reproduction uses the installed supported Node version, `npm run check:types`, a direct `npm run astro -- build --outDir /private/tmp/vs-invoice-build-final` and the focused Vitest files below (rather than the QA chain that can regenerate assets):

```text
netlify/invoices.test.ts
netlify/proposals.test.ts
netlify/messages.test.ts
netlify/email-adapter.test.ts
netlify/bookings.test.ts
netlify/integrations.test.ts
netlify/inquiries.test.ts
netlify/inquiry-store.test.ts
netlify/admin-detail-route.test.ts
netlify/crm-workflow.test.ts
src/lib/inquiries/admin-routes.test.ts
src/lib/inquiries/follow-up.test.ts
src/utils/url.test.ts
src/layouts/social-metadata.test.ts
```

Only **31 existing files / 16 additions / no removals** are within this pass.

Modified:

```text
.env.example
CONTENT_MIGRATION_MAP.md
INQUIRY_ADMIN_SETUP.md
VOLATILE_CONTENT_SOURCE.md
astro.config.mjs
netlify.toml
netlify/bookings.test.ts
netlify/dev-api-aliases.mjs
netlify/integrations.test.ts
netlify/lib/email-render.ts
netlify/lib/inquiry-store.ts
netlify/lib/message-store.ts
netlify/lib/proposal-store.ts
netlify/messages.test.ts
netlify/proposals.test.ts
site.config.mjs
src/components/admin/InquiryAdmin.astro
src/components/admin/InquiryCommunication.astro
src/components/proposals/ProposalEditor.astro
src/layouts/ProposalLayout.astro
src/lib/bookings/admin-session.ts
src/lib/communications/admin.ts
src/lib/communications/contract.ts
src/lib/inquiries/admin-activity.ts
src/lib/inquiries/admin.ts
src/lib/inquiries/contract.ts
src/lib/proposals/admin.ts
src/lib/proposals/contract.ts
src/lib/proposals/inquiry-panel.ts
src/lib/proposals/public.ts
src/pages/proposal/index.astro
```

Added:

```text
database/migrations/009_create_invoices.sql
netlify/functions/admin-invoices.mts
netlify/functions/invoice.mts
netlify/invoices.test.ts
netlify/lib/invoice-store.ts
netlify/lib/invoice-token.ts
src/components/invoices/InvoiceDocument.astro
src/components/invoices/InvoiceEditor.astro
src/components/invoices/InvoiceSummary.astro
src/lib/invoices/admin.ts
src/lib/invoices/contract.ts
src/lib/invoices/document.ts
src/lib/invoices/proposal-panel.ts
src/lib/invoices/public.ts
src/pages/admin/invoices/index.astro
src/pages/invoice/index.astro
```


## Phase 6B.1: Outlook Calendar and Zoom integrations — October 9, 2026

Outlook Calendar through Microsoft Graph replaces the active Google Calendar integration. **Neon remains authoritative.** Zoom Server-to-Server OAuth is preserved. No live migration, provider connection, deployment, real environment change or automatic client notification is performed.

### Migration 008 and existing data

The user confirms **007 is already applied**. Apply `database/migrations/008_outlook_calendar_integration.sql` manually once to the intended branch before deploying Phase 6B.1. Migrations **001–007 remain byte-identical**; 008 is tested only in isolated PostgreSQL locally.

008 renames `google_sync_status/error/last_synced_at` to `calendar_sync_status/error/last_synced_at`, and `google_calendar_id/account_email/event_generation` to `calendar_id/account_email/event_generation`. It updates the pending trigger, retains the existing indexes/constraints with neutral names, adds a stable Microsoft account ID and durable calendar creation intent, and changes the active provider constraint to `outlook_calendar` / `zoom`.

Retired Google connection rows are moved intact into private `retired_calendar_connections.snapshot` records, including their already-encrypted credentials. Existing booking calendar IDs/statuses/targets are preserved in private `legacy_calendar_reference` JSON, then cleared from the active Outlook fields. Scheduled calls become calendar Pending; other calls become Not required. **Google IDs are never sent to Graph.** Booking dates, Zoom identifiers/statuses, CRM `updated_at`, sync revisions and activity remain unchanged. Expiring Google OAuth state is invalidated. Neither archive is returned by any API. No old Google event is deleted remotely and no historical booking is automatically synced by this migration: deliberate **Check sync** mirrors a scheduled call to Outlook after connection. Remove old Google app consent manually and review old calendar copies separately if necessary; this implementation no longer accesses Google.

### Manual Microsoft setup

1. In Microsoft Entra / Azure, create an app registration with supported accounts **Accounts in any organizational directory and personal Microsoft accounts**. This supports Microsoft 365 work/school and Outlook.com accounts. The default runtime authority is `common`. Organizational policies may require an administrator to approve delegated consent.
2. Add a **Web** redirect URI on the intended deployed origin: staging example `https://vs-site-v3.netlify.app/.netlify/functions/microsoft-calendar-oauth-callback`. Production uses the same path on its configured SITE_URL. Register each exact trusted origin; arbitrary deploy previews are not automatically allowed.
3. Configure Microsoft Graph **delegated** permissions `User.Read` and `Calendars.ReadWrite`; the OAuth request also asks for `offline_access`. No application permissions, Mail, Files, Contacts, user-session revocation or unrelated permissions are needed. The selected calendar must be writable with these permissions; sharing scenarios requiring additional scopes are not supported in this pass.
4. Create a client secret, record its **value** securely, and set Functions-scoped `MICROSOFT_CLIENT_ID` and `MICROSOFT_CLIENT_SECRET` in Netlify. Keep existing trusted HTTPS `SITE_URL`. Optional `MICROSOFT_REDIRECT_URI` derives the callback from SITE_URL when blank; an explicit URI must match its origin/path exactly. Optional `MICROSOFT_TENANT_ID` defaults to `common`; setting a tenant GUID/domain or `organizations` intentionally restricts the audience. `consumers` restricts to personal accounts. Do not expose any of these server credentials with a PUBLIC_ prefix.
5. Preserve the existing `INTEGRATION_ENCRYPTION_KEY` (a separate stable 64-hex key, generated with `openssl rand -hex 32` when first setting up). Back it up; changing it makes stored encrypted tokens unreadable. Preserve BOOKING_TOKEN_SECRET, Neon and email configuration. `.env.example` has empty placeholders only. Remove retired Google variables from active deployment configuration manually when ready.
6. After manual schema/configuration/deployment, sign in as admin and open **Calendar → Integrations** at `/admin/settings/integrations/`. Choose **Connect Outlook Calendar**, sign in and consent, select the intended writable **Booking calendar**, then save. The default calendar is preferred initially; same-account reconnection preserves a still-writable selection. Changing selection affects future bookings; existing mirrors retain their original target.
7. Use **Test connection** (read-only, creates no event). Add a busy event to that selected calendar and verify it blocks availability. Deliberately test an owned call's creation, reschedule, cancellation and retry, including a Zoom call. Live account policies, delegated consent, deployed callback cookies and provider behavior require these manual account checks.

OAuth starts behind the unchanged admin role guard and same-origin POST protection. It uses PKCE S256, 256-bit random state/browser binding, a hashed ten-minute one-use database state and Secure/HttpOnly/SameSite=Lax host cookie. The encrypted state also binds the tenant authority; changing configuration invalidates the old attempt. The callback consumes state before exchanging a code and returns a fixed success/failure marker, never query values or raw provider errors. Access/refresh tokens and verifier use existing purpose-bound **AES-256-GCM**. Refresh persists rotated refresh tokens with compare-and-swap protection, tolerates omitted replacement token/scope, and marks missing/revoked credentials or reduced scopes Reconnect required. An early Graph 401 triggers one refresh; transient failures remain retryable.

Only display name and email / user principal name are surfaced as account metadata. Stable account IDs and calendar targets remain server/admin-only. Graph pagination URLs must stay on the fixed `https://graph.microsoft.com/v1.0/` origin/path; bearer credentials cannot follow external nextLink URLs or redirects.

Microsoft references: [authorization code flow and PKCE](https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-auth-code-flow), [calendarView](https://learn.microsoft.com/en-us/graph/api/calendar-list-calendarview?view=graph-rest-1.0), [calendar permissions/properties](https://learn.microsoft.com/en-us/graph/api/resources/calendar?view=graph-rest-1.0), [event transactionId](https://learn.microsoft.com/en-us/graph/api/resources/event?view=graph-rest-1.0), [extended-property reconciliation](https://learn.microsoft.com/en-us/graph/api/singlevaluelegacyextendedproperty-get?view=graph-rest-1.0), [immutable IDs](https://learn.microsoft.com/en-us/graph/outlook-immutable-id).

### Manual Zoom setup

1. In Zoom App Marketplace, create an internal **Server-to-Server OAuth** app in the intended account. An account administrator must grant the relevant developer/app-management permissions. Activate the app after configuring credentials and scopes.
2. Add only the meeting capabilities used here. Current granular account scopes: `meeting:write:meeting:admin` (create), `meeting:read:meeting:admin` (get), `meeting:read:list_meetings:admin` (reconcile/list), `meeting:update:meeting:admin` (reschedule), `meeting:delete:meeting:admin` (cancel). If the account still uses classic scope selection, the equivalent meeting read/write admin capabilities apply; choose the endpoint-specific granular scopes when available.
3. Set Functions-scoped secrets **ZOOM_ACCOUNT_ID**, **ZOOM_CLIENT_ID**, **ZOOM_CLIENT_SECRET**, plus **ZOOM_USER_ID** (the configured host's email or user ID in that account). Verify the host can create meetings and its plan supports the configured call duration. Do not configure a host `start_url`, host token or credentials in public content.
4. Redeploy after environment changes, then use **Test connection** on the integrations page. Zoom shows **Configured / Not configured** and the configured host, not a misleading interactive Connect flow. Test a deliberate Zoom booking, reschedule and cancellation using an owned test inquiry. Phone bookings never call Zoom.

Zoom uses short-lived account-credentials access tokens acquired on the server for an operation, never persisted as a permanent credential. Meetings use the existing call topic, saved UTC start, duration, business timezone, waiting room, no join-before-host, no automatic recording and no registration. Only meeting ID and validated HTTPS Zoom **join_url** are persisted/exposed to the client; **start_url** is discarded.

Zoom setup reference: [create an internal app](https://developers.zoom.us/docs/internal-apps/create/), [OAuth account credentials](https://developers.zoom.us/docs/integrations/oauth/), [meeting API and scopes](https://developers.zoom.us/docs/api/meetings/).

### Booking, availability and failure behavior

- `calendarProvider` is the provider-neutral boundary used by booking and sync orchestration; Graph requests stay in the Outlook adapter. Availability is configured weekly hours minus date exceptions, CRM reservations and selected-calendar external occupied ranges.
- Use **calendarView**, not getSchedule: [Microsoft documents getSchedule as unsupported for personal accounts](https://learn.microsoft.com/en-us/graph/api/calendar-getschedule?view=graph-rest-1.0). calendarView supports personal/work accounts and selected non-default calendars, expanding recurring occurrences/exceptions and all-day events. Responses explicitly request UTC; unknown/custom timezones or malformed time ranges fail conservatively. Event payloads use UTC instants to preserve DST/repeated-hour accuracy, and include the saved business timezone in their body; Neon retains its original IANA zone unchanged.
- `busy`, `tentative`, `oof`, `unknown`, missing and future/unrecognized showAs states **block**. Explicit `free` and `workingElsewhere` do not block (working elsewhere declares location rather than occupied time). Cancelled events are skipped. Paged results must complete within a bounded 20-page loop or availability fails; no truncated result is interpreted as free.
- Batched ranges use a bounded process-local **60-second cache**, invalidated after sync, selection and disconnect. Final booking/reschedule bypasses it. Own-event exclusion verifies saved account/calendar/immutable event ID and the booking/inquiry marker; it excludes only that event and preserves overlapping personal appointments.
- An unavailable/reconnect-required connected provider causes a generic temporary-availability error for new scheduling/rescheduling. Existing booking summaries/cancellation and CRM remain usable. No connected Outlook means CRM-only availability; disconnect deliberately stops external busy blocking. Provider lookup and Neon cannot share a transaction: an external event added between lookup and reservation remains a cross-system race. Existing settings-row locks and GiST exclusion remain the concurrent CRM guarantee.
- Neon commits booking/activity first and stores Pending. Netlify `context.waitUntil` runs bounded synchronization afterwards. **Zoom runs first**, then Outlook receives a validated ready Zoom join URL; a failed Zoom update omits the stale join URL until a later retry succeeds. Neither external failure rolls back a saved booking or changes CRM stale-edit versions/activity.
- Independent calendar/Zoom statuses remain `not_required`, `pending`, `synced`, `failed`. Admin detail/inquiry panels show **Outlook Calendar**, sanitized errors and Retry sync/Check sync. A 90-second per-booking lease and revision checks serialize attempts and leave concurrent edits Pending for the newest revision. The shared provider deadline is 14 seconds; safe reads/updates/deletes have at most one immediate retry and bounded Retry-After.
- Outlook owner-only events include safe contact/company/phone context and an admin inquiry link, never private notes/budget/proposal data. No attendees, automatic invites or Graph online meeting are created. Stored immutable `calendar_event_id` is reused for updates/cancel deletion. Completion retains history. If attendees were manually added, mutation is refused to avoid triggering client invitations.
- Outlook create persists intent before POST and supplies a stable booking/generation `transactionId` plus a single-value extended booking/inquiry marker. Graph creation responses omit the newly written ownership property, so an expanded GET verifies it before claiming Synced. An ambiguous result is **not blindly POSTed again**: Retry queries the marker in the original calendar and verifies ownership before adopting/updating the event. If none can be verified, sync stays Failed/unconfirmed for manual review; if more than one exists, it fails as a conflict. A definite missing saved event or definite creation rejection permits safe replacement/retry. Microsoft does not document an unlimited transactionId retention period, so it is defense in depth rather than justification for blind late replay.
- Zoom retains its existing account-credentials OAuth, adapter, durable intent, verified meeting-marker lookup, host/account binding, creation/update/delete, missing-item replacement and no blind ambiguous POST behavior. Completed calls retain provider history. Changing Microsoft account or Zoom host/account flags the prior target instead of modifying another account's items.
- Disconnect clears local Microsoft credentials/selection and marks disconnected, retaining Neon bookings and Outlook event IDs/history. There is no suitable per-app revocation endpoint for this delegated grant. It does **not** revoke all Microsoft user sessions or request broader permissions; remove app consent in the Microsoft account / My Apps portal when remote revocation is desired. Reconnect the original account to manage its existing items.
- Public APIs contain no tokens, provider IDs, calendar metadata, archived Google data or sync internals. Public confirmation and explicitly composed booking email show Join Zoom only when ready. Existing message snapshots/retry logic and manual email delivery remain unchanged; no notification is sent automatically.

Required Microsoft runtime variables: `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`, existing `INTEGRATION_ENCRYPTION_KEY` and `SITE_URL`. Optional `MICROSOFT_REDIRECT_URI`, `MICROSOFT_TENANT_ID`. Preserve `ZOOM_ACCOUNT_ID`, `ZOOM_CLIENT_ID`, `ZOOM_CLIENT_SECRET`, `ZOOM_USER_ID`, `BOOKING_TOKEN_SECRET`, Neon and email variables. Google variables/callback/adapters are no longer supported in the active product.

### Phase 6B.1 validation

Local tests use mocked Microsoft/Zoom responses and isolated PGlite, never live accounts, provider APIs, Neon or outbound email. The populated forward-migration test verifies preserved Google archives, unchanged Zoom data/CRM versions/activity and the renamed pending trigger. Validation passes: **332 focused tests across thirteen files** (75 integration/provider/security/migration cases, 55 booking cases, 195 CRM/follow-up/proposal/email/URL cases and 7 social-metadata regression cases); Astro/TypeScript checks 500 files with zero errors; 76 data JSON files parse; 52 section files / 2 page contracts pass. The direct Astro static build produces 14 pages without running image generation. Nine Netlify Functions bundle for Node 22/API v2, including the new Microsoft callback and excluding the removed Google callback.

Isolated Chrome checks at 320/375/430/768/1024/1440px cover connected/reconnect/disconnect states, calendar selection/tests, confirmation dismissal/focus restoration, calendar/inquiry Retry sync, public ready Zoom CTA and reduced motion. No horizontal overflow, duplicate IDs, hidden focused elements, runtime errors or provider duplicates were observed. Identity/provider transports are mocked and browser fixture data uses isolated PostgreSQL; temporary fixture/processes are removed/stopped. Deployed Identity gates and real Microsoft/Zoom account behavior remain manual checks. The four known preexisting template/QA suites are untouched; this is focused validation, not a claim that the entire template suite is green.

SHA-256 comparison verifies 2,092 protected files are unchanged, including all original public/legacy assets, localized/public data, styles, migrations 001–007, Zoom adapter, encryption helper, Identity/admin guard, database module, CRM/follow-up/proposal/email stores and dependencies. Only the following 17 existing files / 5 additions / 3 removals are within this pass.

Modified:

```text
.env.example
CONTENT_MIGRATION_MAP.md
INQUIRY_ADMIN_SETUP.md
VOLATILE_CONTENT_SOURCE.md
netlify/bookings.test.ts
netlify/functions/admin-integrations.mts
netlify/integrations.test.ts
netlify/lib/booking-store.ts
netlify/lib/integrations/provider.ts
netlify/lib/integrations/settings.ts
netlify/lib/integrations/sync.ts
src/components/admin/IntegrationSettings.astro
src/components/booking/BookingSyncStatus.astro
src/lib/bookings/contract.ts
src/lib/bookings/sync-presentation.ts
src/lib/integrations/admin.ts
src/lib/integrations/contract.ts
```

Added:

```text
database/migrations/008_outlook_calendar_integration.sql
netlify/functions/microsoft-calendar-oauth-callback.mts
netlify/lib/integrations/calendar.ts
netlify/lib/integrations/microsoft-auth.ts
netlify/lib/integrations/outlook-calendar.ts
```

Removed:

```text
netlify/functions/google-calendar-oauth-callback.mts
netlify/lib/integrations/google-auth.ts
netlify/lib/integrations/google-calendar.ts
```

### Historical Phase 6B validation and exact file scope (superseded calendar provider)

- **302 focused tests pass across twelve files**: 52 integration/provider/security/continuation cases, all 55 existing booking/DST/conflict cases and 195 existing CRM/follow-up/proposal/email/URL cases. Provider adapters use mocked responses and an isolated PGlite database with migrations 001–007; no real Google/Zoom requests, Neon connection or email send is made.
- Astro/TypeScript checks **498 files with zero errors**. The static build produces **14 pages**, including integrations. All **nine Netlify Functions** bundle for Node 22/API v2. The final validation uses the direct Astro build into a temporary directory rather than the asset-generation build chain.
- Chrome browser checks pass at **320, 375, 430, 768, 1024 and 1440px**: connected/reconnect states, calendar selection/tests, disconnect confirmation/Escape/focus/no write on dismissal, calendar/inquiry sync/retry, public ready Zoom CTA, reduced motion, no horizontal overflow, duplicate IDs or runtime exceptions. Identity and providers are mocked; deployed OAuth consent/account activation and CDN role enforcement remain manual checks.
- All **76 data JSON files** parse. Data contracts, registrations and motion checks pass. Import audit retains only the three preexisting relative imports; atomic audit retains the existing ChecklistItem margin finding and HeroSplit advisory, with no new finding.
- The broad template suite reports **eight failures in four existing suites**: retired Polish route/link expectations, AboutExpert LinkedIn expectations, missing dev thumbnail route, and the QA-client placeholder check timing out. Their test/source contracts are outside Phase 6B. The QA test invoked asset generation; its changed files were restored from byte-matching local preview copies, its ten new derivatives removed, and final hashes verify every original public/legacy asset is unchanged.
- Final SHA-256 comparison records **21 existing files modified, 17 additions, no removals**. Migrations 001–006, public/legacy assets, public/localized JSON, existing global/booking CSS, packages/lockfile, Astro/site configuration, auth guard, inquiry/follow-up/proposal stores and public wizard remain byte-identical. Temporary fixture/browser/server files and processes are removed/stopped.

Modified files:

```text
.env.example
CONTENT_MIGRATION_MAP.md
INQUIRY_ADMIN_SETUP.md
VOLATILE_CONTENT_SOURCE.md
netlify.toml
netlify/bookings.test.ts
netlify/dev-api-aliases.mjs
netlify/functions/admin-bookings.mts
netlify/functions/booking.mts
netlify/lib/booking-links.ts
netlify/lib/booking-store.ts
netlify/lib/email-render.ts
src/components/admin/BookingCalendar.astro
src/components/admin/InquiryBooking.astro
src/components/booking/BookingSummary.astro
src/lib/bookings/admin-session.ts
src/lib/bookings/calendar.ts
src/lib/bookings/contract.ts
src/lib/bookings/inquiry-panel.ts
src/lib/bookings/presentation.ts
src/lib/bookings/public.ts
```

Added files:

```text
database/migrations/007_create_integrations.sql
netlify/functions/admin-integrations.mts
netlify/functions/google-calendar-oauth-callback.mts
netlify/integrations.test.ts
netlify/lib/integrations/crypto.ts
netlify/lib/integrations/google-auth.ts
netlify/lib/integrations/google-calendar.ts
netlify/lib/integrations/provider.ts
netlify/lib/integrations/settings.ts
netlify/lib/integrations/sync.ts
netlify/lib/integrations/zoom.ts
src/components/admin/IntegrationSettings.astro
src/components/booking/BookingSyncStatus.astro
src/lib/bookings/sync-presentation.ts
src/lib/integrations/admin.ts
src/lib/integrations/contract.ts
src/pages/admin/settings/integrations/index.astro
```

## Phase 6A: Custom booking engine and admin calendar — October 9, 2026

Phase 6A adds deliberate inquiry booking links, client scheduling, account availability and a private Month/Agenda calendar. It supersedes older booking/calendar deferrals only for this authorized scope. Existing CRM, proposals, follow-ups, outbound email and intake remain independent. No external calendar/Zoom integration, automatic email/reminder, SMS, invoice/payment or portal is included.

**Migration 006 requires manual Neon execution before deployment.** Apply `database/migrations/006_create_bookings.sql` once to the intended branch after 001–005; none of those migrations is edited. Do not deploy the new Functions before the schema exists. No live migration, database connection, deployment, real booking or real email is performed in this pass.

### Schema, booking links and timestamp integrity

- `booking_settings` is a singleton account configuration; `booking_availability` has seven weekday rows and one local daytime window per day; `booking_exceptions` overrides a date as unavailable or custom hours. `booking_links` holds one current link per inquiry. `bookings` retains inquiry/link relationships, UTC start/end and blocked-until timestamps, source timezone, client details/notes, status, meeting type, cancellation/completion timestamps, request-key/fingerprint and nullable future calendar/Zoom IDs. Deletion is restricted; cancellation releases the range while retaining history. No existing bookings, client records or activity are fabricated/backfilled.
- Default timezone **America/New_York**, duration **30 minutes** (15/30/45/60 supported), buffer **0 minutes**, notice **12 hours**, horizon **60 days**. All weekdays start **disabled**. The 09:00–17:00 editable structural window does not assert Anthony's working hours and publishes nothing until he deliberately enables days. One same-day window per weekday/date; split or overnight hours and Week view are deferred.
- Generate a random 256-bit nonce, then derive the 43-character bearer token with HMAC-SHA-256 and the server-only **BOOKING_TOKEN_SECRET**. Persist the SHA-256 token hash, nonce and optional last four characters, never the raw token. The nonce alone cannot reconstruct the token. Repeated reads/creation reuse the current URL; explicit regeneration atomically changes nonce/hash and adds activity, invalidating the old URL while preserving bookings. Public queries match hashes, never inquiry IDs/emails/proposal numbers.
- Keep the key stable and backed up securely. Changing it does not revoke already issued hash-validated bearer links automatically, but prevents reconstructing old URLs/email content. Restore the original key or explicitly regenerate affected links; don't rotate casually. Existing bearer links contain client contact details, so share them privately.
- Server-only `@js-temporal/polyfill` 0.5.1 (plus transitive jsbi) resolves local IANA-zone hours, DST gaps and repeated times accurately on Node 22. UTC is persisted; available slot labels identify timezone/offset, with both distinct fall-back instants and no nonexistent spring-forward times. Public/calendar display uses the configured business timezone explicitly, independent of browser timezone. Existing confirmed bookings preserve their source zone and times when availability changes.

### Server authority, concurrency and security

`/api/admin/bookings` reuses the existing server Identity/admin-role guard before database access. Query-string GET modes read settings, inquiry link/booking, month, detail or available reschedule times. POST handles settings (including all exception edits), deliberate link creation/regeneration, cancellation, completion or reschedule. Same-origin mutations, strict bounded Zod payloads, parameterized SQL and no-store/no-referrer responses apply. Calendar routes additionally use the existing CDN admin-role gates; local guards/whitelisted login return paths preserve auth behavior. Real Identity/CDN rate enforcement remains a deployment check.

`/api/booking?token=<token>` anonymously serves a narrow safe contact/availability/current-booking DTO. It never exposes database IDs, inquiry summary/budget, admin/private notes, messages, proposal internals or activity. POST confirms creation, cancellation or rescheduling. Public native Netlify rate protection is 60 requests/minute per IP/domain. Tokens, date ranges, actual generated slot membership, meeting type, matching inquiry contact email, name/phone/notes, IANA zone and scheduling limits are validated. Phone calls require a bounded 7–15 digit number; Zoom is a preference only and has no fabricated URL or credentials.

Availability version/hours/exceptions are read in **one database snapshot**. A settings timestamp detects concurrent changes. `reserve_booking` and `change_booking` are PostgreSQL functions executed as single Neon HTTP statements: lock account settings, compare the expected configuration version, lock/validate link or booking, check overlaps and atomically write booking/activity. Fresh substatements see preceding committed reservations. A native GiST exclusion constraint on scheduled/completed `[start_at,busy_until)` ranges independently rejects overlapping writes, including outside the application; no extension is needed. The current configured buffer also protects older bookings whose stored buffer was shorter. A partial unique constraint permits only one scheduled call per inquiry. Request-key/fingerprint checks make identical retries, including concurrent duplicates, return the same booking without duplicate activity.

Cancellation, completion and reschedule use stale guards. Reschedule releases the previous slot and claims the new slot with activity in the same transaction; conflicts leave the original intact. Clients can change their current booking only before it begins and with the current link/expected start. Admin completion is available after the call ends. Activity failures roll back changes. Booking/link creation, regeneration, scheduled, cancelled, completed and rescheduled events have explicit Admin/Client actors; viewing settings/pages creates no event. Status, private notes, follow-ups and proposals are never changed by booking actions.

### Public booking, calendar and inquiry UX

- `/book/<token>/` uses existing prepared branding/Nova atoms and a noindex/no-referrer utility layout. Choose Phone/Zoom, an available date/server-provided selected slot, then contact details/optional notes and a real confirmation dialog. Name/email are prefilled; email stays readonly. Inline errors, labeled inputs, keyboard slot buttons, aria-pressed selection, native dialog focus, busy controls and aria-live results are included. Booking results survive refresh; the same link supports confirmed cancellation and choosing a new available time. Confirmation does not depend on email.
- `/admin/calendar/` has Month and date-grouped Agenda views, Previous/Next/Today, explicit business-zone labels, query/history/refresh state and real empty states. On screens below 1024px, Month uses the readable agenda presentation. Compact events show client/company/time/type/status; details expose owned inquiry, email, phone/notes and deliberate confirmed Cancel/Complete/Reschedule. Auth loss clears private content. No fake meetings or calendar dependency.
- `/admin/calendar/settings/` edits timezone, duration, buffer, minimum notice, horizon, weekday toggles/windows and date exceptions. Save atomically replaces the account configuration with stale protection. Failed edits stay present; saved settings survive refresh and immediately determine public slots, without moving existing calls.
- Inquiry detail has a compact Booking panel: Create deliberately, Copy, Open, Regenerate, current call summary and Manage booking. Link actions preserve other unsaved CRM/composer edits and refresh activity/link context without sending. No per-card booking queries are added to List/Pipeline.
- The composer offers **Schedule a Call** only for a current usable link; Discovery selects it when available. Creating a link is never a side effect of opening a composer/preview. No-link or regenerated-link requests cannot produce/send a dead CTA. Existing owned proposal CTA remains independent; one selected CTA per message.

### Public URLs and token-free email storage

**SITE_URL** is the normalized trusted HTTPS origin for generated proposal, booking and email CTA links. Set staging to `https://vs-site-v3.netlify.app`; later set production to `https://volatile-solutions.net`. Neither hostname is hardcoded in new runtime code. Origins reject credentials, non-HTTPS, path/query/fragment and browser-controlled hosts. During transition only, an absent SITE_URL falls back to EMAIL_PUBLIC_URL, then company.siteUrl, preserving Phase 5. Configure SITE_URL deliberately before sharing staging links.

**EMAIL_PUBLIC_URL** remains an optional HTTPS **email asset** origin override when SITE_URL exists. Without that override, assets use SITE_URL. Verify the existing PNG wordmark and anonymous proposal/booking routes on the selected deployed origins. Canonical/company JSON and existing public SEO/noindex settings are unchanged.

Migration 006 adds nullable booking nonce/hash snapshots to `inquiry_messages`. A booking token is replaced with `{{BOOKING_TOKEN}}` before storing subject/original text/rendered text/HTML/activity; the private runtime hydrates it only for preview/history/provider delivery. Arbitrary raw booking URLs without a corresponding owned snapshot are rejected. Frozen snapshots retain identical mail content/provider idempotency keys on retry. Regenerating a link blocks retry of an older booking invitation; key mismatch prevents delivery rather than sending an invalid token. Legacy messages are not rewritten, and ordinary email behavior is unchanged. No raw booking token is persisted in any booking/link/message/activity column.

### Manual rollout

1. Apply 006 once on the intended Neon branch after 001–005. Do not alter or reapply earlier migrations.
2. In Netlify Functions-scoped runtime configuration set **SITE_URL** to the staging or production HTTPS origin above. Set EMAIL_PUBLIC_URL only if mail images should use a different deployed origin. Preserve existing DATABASE_URL and Resend sender/key configuration.
3. Generate a dedicated 32-byte key locally with `openssl rand -hex 32`; store its 64 hex characters as secret **BOOKING_TOKEN_SECRET**, Functions scope. Back it up securely; never prefix PUBLIC_, commit, paste into docs or regenerate per deployment. `.env.example` contains empty placeholders only.
4. Deploy schema-compatible code. Sign in as the existing admin and deliberately configure/enable actual hours and exceptions. Defaults expose no bookable weekdays.
5. From an owned test inquiry create a link, verify anonymous Phone/Zoom booking/cancel/reschedule and private calendar/activity. Test near timezone/DST boundaries and two simultaneous clients. Preview a Discovery invitation; sending real email remains an explicit admin action. Confirm site/CDN role and rate protection with a real deployment before sharing links.

### Phase 6A validation boundaries

The focused suite passes **250 tests across eleven files**, including **55 booking cases** and all 195 existing email/proposal/CRM/follow-up/URL cases. All **76 data JSON files** parse; Astro/TypeScript checks **478 files with zero errors**, the safe temporary static build emits **13 pages**, and all **seven modern Functions** bundle for Node 22/API v2 without asset regeneration. Browser tests use real Functions/store SQL against isolated PostgreSQL (PGlite), with synthetic Identity and mocked Resend; no live database/provider result is claimed. Six-width/public/calendar/settings/CRM checks cover keyboard/focus, labels, selected states, dialogs, responsive agenda, refresh/history, errors and draft preservation. Browser validation passes Phone/Zoom, review/back, same-request double-submit, refresh, client/admin cancel/reschedule, admin completion, availability save/custom hours/weekday and inline errors, current Discovery CTA with one mocked send and token-free persisted mail/hydrated history, existing List/Pipeline/search/filters/follow-up/stale/rollback flows and the public five-step wizard. Identity and provider responses are explicitly mocked; real CDN role/rate behavior remains a deployment check. Public/legacy images and global CSS are not regenerated; migrations 001–005 remain byte-identical. Final hashes show 27 modified existing files and 24 additions, no removals or unrelated changes. The temporary browser fixture/server/Chrome are removed/stopped. Atomic/import audits retain only the existing ChecklistItem margin violation, HeroSplit advisory and three preexisting cross-directory relative imports; this pass adds no new findings.



### Phase 6A exact file scope

Modified existing files:

```text
.env.example
CONTENT_MIGRATION_MAP.md
INQUIRY_ADMIN_SETUP.md
VOLATILE_CONTENT_SOURCE.md
astro.config.mjs
netlify.toml
netlify/dev-api-aliases.mjs
netlify/lib/email-render.ts
netlify/lib/email.ts
netlify/lib/http.ts
netlify/lib/message-store.ts
netlify/lib/proposal-store.ts
netlify/messages.test.ts
package-lock.json
package.json
site.config.mjs
src/components/admin/InquiryAdmin.astro
src/components/admin/InquiryCommunication.astro
src/layouts/AdminLayout.astro
src/lib/communications/admin.ts
src/lib/communications/contract.ts
src/lib/communications/templates.ts
src/lib/inquiries/admin-activity.ts
src/lib/inquiries/admin.ts
src/lib/inquiries/contract.ts
src/lib/proposals/admin.ts
src/lib/proposals/contract.ts
```

Added files:

```text
database/migrations/006_create_bookings.sql
netlify/bookings.test.ts
netlify/functions/admin-bookings.mts
netlify/functions/booking.mts
netlify/lib/booking-links.ts
netlify/lib/booking-settings.ts
netlify/lib/booking-slots.ts
netlify/lib/booking-store.ts
netlify/lib/booking-token.ts
netlify/lib/public-url.ts
netlify/lib/runtime-env.ts
src/components/admin/BookingCalendar.astro
src/components/admin/CalendarAvailability.astro
src/components/admin/InquiryBooking.astro
src/layouts/BookingLayout.astro
src/lib/bookings/admin-session.ts
src/lib/bookings/calendar.ts
src/lib/bookings/contract.ts
src/lib/bookings/inquiry-panel.ts
src/lib/bookings/public.ts
src/lib/bookings/settings.ts
src/pages/admin/calendar/index.astro
src/pages/admin/calendar/settings/index.astro
src/pages/book/index.astro
```

## Historical Phase 5: CRM communications — October 9, 2026

The user confirms Phases 1–4 are live and working. Phase 5 adds private transactional outbound mail, editable templates and inquiry communication history, preserving the CRM/proposal workflow. Earlier records below remain historical; their email deferrals are superseded only for this scope.

**Migration 005 requires manual Neon execution before deployment.** Apply `database/migrations/005_create_inquiry_messages.sql` once to the intended branch after 001–004. Those earlier migrations are unchanged. No live migration, DNS change, provider account configuration, deployment or real email is performed during implementation/testing.

### Server, schema and delivery meaning

- Installed Resend Node SDK 6.32.1 (Node >=20; the existing Node 22 deployment remains compatible). All SDK interaction is isolated in server-only `netlify/lib/email.ts`. The CRM uses `message-store.ts`; rendering and plain-text generation live in `email-render.ts`. The adapter receives a frozen mail envelope/content plus a stable message ID, so another transactional provider can replace Resend later without changing the composer.
- Runtime variables: **RESEND_API_KEY**, **EMAIL_FROM**, **EMAIL_REPLY_TO**. All are Functions-scoped server configuration; `.env.example` contains empty placeholders. Sender/reply addresses are validated, including header-injection rejection. There is no production fallback sender. Missing configuration prevents provider access and shows a specific admin configuration message; preview requires valid sender/reply configuration but does not require a provider key.
- Optional **EMAIL_PUBLIC_URL** selects a trusted HTTPS website origin for logo and proposal URLs, defaulting to company.siteUrl. It must be an origin without credentials, path, query or fragment. The main domain's prepared logo URL returned 404 during this pass, so verify the deployed website/asset before enabling mail or explicitly set this to the current functioning deployment origin. This does not modify company data or site routing. Never derive outbound links from a browser-supplied host/URL.
- `inquiry_messages` stores UUID/inquiry IDs, created/updated timestamps, direction, status, frozen sender/reply-to/recipient, subject, original message text, generated text/HTML, provider/message ID, template key, optional owned proposal FK, UUID request key, payload fingerprint, attempt count/timestamps, sent timestamp and bounded error category. Inquiry/proposal FKs use RESTRICT to preserve correspondence; no delete UI/backfill is included. Direction reserves inbound, and statuses reserve Draft, but Phase 5 does not implement inbound receiving or server-saved composer drafts.
- Actual states are Sending, Sent and Failed. **Sent means the provider accepted the API request; it does not mean Delivered, Opened or Read.** No webhook data, tracking pixels, delivery events or fake delivery claims are added. Known provider rejection is Failed/provider_rejected; transport/ambiguous errors are Failed/delivery_unconfirmed with explicit uncertainty in the admin UI. Private provider error text, raw payloads and secrets are not logged or returned.

### Idempotency and recovery

1. Authorize admin and validate same-origin, inquiry ownership, recipient, bounded subject/body, template and optional current Sent proposal.
2. Insert a Sending record with frozen sender/content, a unique request UUID and a SHA-256 payload fingerprint before provider access. Concurrent duplicate submissions create one record and make one initial provider call. Reusing a request key for different content/inquiry conflicts. Ordinary repeated Send requests return the stored state and never invoke delivery again.
3. Send through Resend with `crm-message/<message-uuid>` as the provider idempotency key, HTML and plain text, and a 15-second request deadline.
4. Persist provider acceptance/message ID plus `email_sent`, or failure category plus `email_failed`, in one PostgreSQL data-modifying CTE transaction. A failure in activity persistence rolls back the database outcome. Database/provider calls cannot share a transaction and are not described as doing so.
5. If the provider accepted but final database persistence failed, the record remains Sending. A later explicit Retry saved email resubmits identical content/key to reconcile provider acceptance. Failed sends also retain their composition and support deliberate saved-message retry. A 90-second lease plus attempt-count comparison prevents concurrent active retries; completed Sent records never resend.

Resend retains keys for 24 hours. The application conservatively allows recovery only within 23 hours of the first attempt, leaving an hour of margin; it never automatically rolls an old uncertain send onto a fresh key. After the safe window, inspect the Resend dashboard before deliberately starting a new response. A retry preserves the original sender/reply-to as well as content even if runtime settings changed. Configure/verify that original sender before retrying, or start a new response deliberately after checking the previous outcome. One failure and one eventual acceptance are recorded per message; repeated failures do not spam inquiry activity.

Official references: [Resend Node SDK](https://resend.com/docs/send-with-nodejs), [send API](https://resend.com/docs/api-reference/emails/send-email), [idempotency window](https://resend.com/docs/dashboard/emails/idempotency-keys).

### Composer, preview and history

- Inquiry detail gains one clearly separated Communication section. It loads summaries only when an inquiry is opened, not per List/Pipeline card. Ten messages per history page show date/time, recipient, subject, template and actual status. Newer/Older controls reveal older messages; full plain-text content loads only when expanded. No raw HTML is dumped into Activity/history.
- Respond to inquiry opens the compact Nova composer: readonly inquiry-contact To, editable Subject and Message, labeled Template, optional Proposal button, Preview and Send email. There are no arbitrary recipients, CC/BCC, attachments, HTML editor or WYSIWYG dependency. Subject is bounded to 200 characters; message to 20,000. Failed/stale/network outcomes preserve inputs. A known recorded outcome disables ordinary Send and directs retries through the saved message. Starting another response after an attempt asks for deliberate confirmation; closing the composer never sends and reopening preserves an unsent in-memory composition.
- Five internal templates: Personal response, Thanks for reaching out, Discovery call invitation, Proposal ready and Follow-up. Selection populates editable text, with a confirmation before replacing a nonempty draft. Discovery asks for suitable times/timezone by reply; it includes no booking link. Controlled variables are firstName, company, projectType, proposalNumber and proposalUrl, with intentional company/name fallbacks. Unknown tokens or unavailable proposal variables are rejected; there is no template execution/eval.
- Preview is a protected POST that performs no send/write/activity. It shows recipient, subject, sender and the exact server-generated branded HTML in a sandboxed, script-free iframe. Closing/editing clears stale previews. Plain-text content is available in expanded history. Labels/errors, keyboard controls, focus feedback, busy/disabled states and aria-live are preserved; logout/authorization loss clears recipient, composition, history and iframe content.
- A View Proposal CTA is available only for the inquiry's current unexpired Sent proposal. The server resolves the relationship/token and constructs the trusted public `/proposal/<token>/` URL. Draft/Accepted/Declined/Expired offers provide no CTA option. Requests cannot submit arbitrary proposal IDs/URLs. Sending mail does not change proposal pricing/acceptance, inquiry status, private notes or follow-up schedules.
- The branded email uses the existing production PNG wordmark, Nova cream/near-black/copper colors, inline table-based CSS, Arial/Helvetica fallbacks, greeting, escaped editable paragraphs, optional simple button, Anthony's signature and website/reply footer. A complete explicit plain-text alternative includes any CTA URL. User content is text, never executable HTML. The small typed CTA contract is ready for a future approved booking link, but no calendar/booking URL/control exists now.

### Private API and activity

`/api/admin/messages?inquiry=<uuid>` is the stable protected alias. GET reads a history page; GET with `message=<uuid>` reads ownership-checked content; POST actions are preview, send and retry. Authentication/admin role precede all database access, mutations require same Origin, strict payloads reject mass assignment, reads/writes are parameterized, responses use no-store/no-referrer and the Function applies native per-IP/domain rate protection. Production/dev aliases precede general routing. Message history is never added to public inquiry/proposal responses or static HTML.

Migration 005 extends the allowed activity types with `email_sent` and `email_failed`, and adds a nullable message FK/outcome uniqueness index. Existing system/admin/client actor rules and proposal/follow-up checks remain. Email events show saved subject/date and Admin actor; body/recipient secrets are not duplicated into activity. Preview/template selection/opening/typing creates no event. Existing inquiry deletion remains restricted by business records; archiving retains correspondence.

### Manual rollout for Anthony

1. Create/configure a Resend account and choose the domain/subdomain you intend to use for the sender. In Resend Domains, add that domain; add the exact verification/sending DNS records Resend displays at your DNS provider, then wait for verified status. Do not enable inbound receiving, tracking or webhooks for this phase. [Domain setup](https://resend.com/docs/dashboard/domains/introduction)
2. Create a sending API key restricted to the intended verified domain where supported. Keep it private; do not paste it into source or browser-visible settings.
3. On the intended Netlify site/context, set secret **RESEND_API_KEY** with Functions scope. Set **EMAIL_FROM** to the approved display name and mailbox on that verified domain, and **EMAIL_REPLY_TO** to the inbox that should receive client replies. Replies reach that inbox; they are not synced into CRM history.
4. Set **EMAIL_PUBLIC_URL** if the functioning site is still on a staging/custom deployment origin different from company.siteUrl. Confirm that origin serves the prepared logo at `/assets/images/t001-nova/t001-nova-navbar-logo.png` and existing public proposal token routes anonymously over HTTPS.
5. Apply migration **005** once on the intended Neon branch after the existing 001–004 migrations. Then deploy Phase 5 so the new schema and Functions/configuration are present together.
6. From an existing test inquiry belonging to you, preview all desired templates and send one deliberate real message. Verify Resend's provider ID/acceptance, inbox HTML/plain-text rendering, reply address, CRM Sent/history and email_sent activity. If using a proposal CTA, open it anonymously and verify the existing proposal workflow. Real inbox delivery, Gmail/Outlook client rendering, sender-domain verification and CDN rate behavior remain manual deployment checks, not local test claims.

No calendar/scheduling UI, inbound mail/sync, invoices, payments/Stripe, signatures/contracts, attachments or bulk marketing are implemented.

### Phase 5 local validation and boundaries

- All 76 data JSON files parse. The focused email/proposal/inquiry/CRM/URL suite passes **195 tests across ten files**, including **51 email cases** for real in-memory PostgreSQL persistence/rollback/concurrency/privacy, rendering/template safety, configured URL validation and the installed Resend SDK with a mocked fetch transport. Automated tests never send real email.
- Astro/TypeScript checks **455 files with zero errors**. A direct temporary static build passes ten pages without asset regeneration; all five modern Functions bundle through Netlify esbuild with runtime API v2. Client bundles contain no provider/database credentials or SDK imports, static public/admin HTML contains no private fixture records, and admin/proposal utility routes stay outside the sitemap.
- Isolated Chrome at **320/375/430/768/1024/1440px** passes composer labels/validation/editable templates, script-free sandboxed preview, provider-call-free preview, owned proposal CTA, one-call double-submit protection, accepted/failed history, deliberate same-record retry, preserved drafts, page/expansion/refresh behavior and logout cleanup. A final synthetic-response UI check verifies that a follow-up save preserves failed-email composition and restores the saved-message Send/Retry disabled states. Actual Functions/store SQL run against PostgreSQL (PGlite); Identity and Resend delivery are mocked. No live credentials or messages are used.
- The approved PNG wordmark was rendered in the sandboxed iframe using a mocked asset response from the unchanged local production asset. At all six widths the iframe has zero horizontal overflow and no scripts; mobile/desktop screenshots were visually reviewed. Real logo availability must be verified on EMAIL_PUBLIC_URL/company.siteUrl during rollout. This is browser HTML validation, not a claim of Gmail/Outlook inbox compatibility or actual delivery.
- Existing List/Pipeline/search/combined filters/query-history/detail/status/general notes/follow-up/archived metrics/rollback/stale handling and six-width layout checks pass. The public wizard passes all five steps, validation, Back/Edit, consent, stable-key failure/retry/success, double-submit protection, keyboard and client-router entrance at the same six widths with synthetic receipts. Proposal regression tests and privacy/acceptance behavior remain included.
- Hash checks preserve migrations 001–004, auth verification/login/callback logic, database/inquiry/proposal store and Functions, follow-up UI/helpers, all public wizard code/data/images/legacy assets, global CSS and existing deployment/build-scope behavior outside the new email alias. Temporary browser fixtures were removed. The atomic audit retains only the untouched ChecklistItem margin violation and HeroSplit advisory; the import audit retains three preexisting cross-directory relative imports from the proposal pass. No new findings are introduced.
- No live migration, deployment, sender/DNS/account configuration or actual email is performed. Migration 005 and sender/public-origin configuration remain manual prerequisites before real rollout.

## Historical Phase 4: Proposals and estimates — October 9, 2026

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
