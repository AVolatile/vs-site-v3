# Leads workspace

Leads live at `/admin/leads/`. They represent manually identified prospects and remain separate from inbound inquiries. No prospect data is seeded or imported.

## Architecture and shared workflows

- `leads` stores partial contact/research information, status, priority, private notes, manual last contact, follow-up and conversion references. Only the business / lead name is required. Last contact also includes confirmed outbound email dates.
- Existing messages, booking links, bookings, proposals, invoices and activity gain nullable `lead_id` ownership. Each record has exactly one owner: an inquiry or a lead. Existing inquiry callers retain their UUID arguments; lead callers supply an explicit lead reference.
- The existing Netlify Identity admin authorization, same-origin mutation checks, strict Zod validation, parameterized Neon queries, private response headers and timestamp conflict checks remain in use.
- Email uses the existing composer, templates, Resend adapter, frozen snapshots, idempotency keys and safe retry window. A valid lead email is required to send. History remains readable if the email is later cleared.
- Bookings use the existing links, availability, reservation/change SQL functions, calendar, Zoom and Outlook synchronization. A valid email is required to create a lead booking link; the booking form collects the actual contact name/phone.
- Proposals use the existing one-proposal-per-owner builder and publish/accept/decline behavior. Sparse leads can have drafts without fabricated contact information.
- Invoices retain the existing prerequisite: an accepted proposal. The existing editor, sending/status flow, snapshots and generated document remain in use.
- Shared activity records lead creation/edits/conversion, follow-up changes and all existing document, email and booking outcomes. Private note bodies are not copied into activity.
- Admin component/controller code changed to support lead context and navigation. New layout rules are scoped to the Leads component. Public Nova pages, design tokens, global styles, localization structures, dependencies, generated email design and generated proposal/invoice markup are unchanged.

## Migration and deployment

1. Apply `database/migrations/010_create_leads.sql` once to the intended Neon branch after migrations 001–009. Historical migrations are unchanged.
2. Deploy code and Functions together after the migration. The existing build scope already includes child pages under `/admin`; production and development aliases now include the Leads API/page.
3. Existing Identity, Resend, booking, Outlook/Zoom and document token settings continue to apply. No new environment variables are required.
4. Verify real Identity cookies/CDN admin gates and provider delivery/calendar behavior on the deployed environment. Automated checks use isolated PostgreSQL and mocked providers; no live emails, meetings, migrations or deployments were performed.

Example migration command, after explicitly selecting the intended database connection:

```sh
psql "$DATABASE_URL" --set ON_ERROR_STOP=on --file database/migrations/010_create_leads.sql
```

Migration 010 adds leads, owner checks/indexes, lead relationship guards and lead activity types. It replaces the two existing scheduler functions only to propagate lead ownership; their reservation, overlap, idempotency and change rules are retained. Inquiry `consent_at` becomes nullable so admin conversions can truthfully record no wizard consent. Public inquiry submissions retain their existing consent requirement and default timestamp.

## Permanent deletion

The trash action opens the existing confirmation dialog; there is no typed confirmation. A version check prevents stale deletion. In-flight email blocks deletion. Scheduled meetings are cancelled using the existing booking/sync workflow before deleting local records; unresolved cancellation or an active sync lease blocks cleanup so provider references remain available for reconciliation.

`delete_lead` performs the local cleanup in one PostgreSQL transaction: owned activity, messages, bookings, links, invoices/items, proposals/items and the lead. Existing item cascades are reused only after explicitly deleting their parent documents. Lead foreign keys restrict unexpected deletion, and any unexpected dependency rolls back all local deletes. Relationships prevent lead records from referencing another owner's documents/meetings/messages. Existing inquiry-to-inquiry reference behavior remains compatible.

A successful external meeting cancellation remains cancelled if a later local delete fails. Refresh the lead and reconcile sending/sync status before retrying. Completed historical provider calendar events are retained. Neither converted inquiries nor unrelated leads/inquiries are deleted. Deleting a converted inquiry clears the lead's inquiry reference while preserving its Converted status and conversion date; conversion cannot silently create a second inquiry.

## Conversion

`Convert to Inquiry` intentionally opens a form. Known contact/business fields are prefilled; project type, stage, summary, budget and timeline require actual admin input using the existing inquiry validation. No project values or consent are fabricated. The transaction creates a new inquiry, copies private notes/follow-up, records both histories, preserves the original lead and marks it Converted. Repeated/concurrent conversion requests reuse the first result. Earlier lead email/bookings/proposals/invoices stay with the lead; subsequent inquiry work belongs to the new inquiry. Phone/location/category/research remain on the linked original lead because the inquiry schema has no equivalent fields.

## Validation

- `npm run build`: passed, including scoped Astro output with `/admin/leads/`. Build-generated source assets were restored; no public asset changes remain.
- `npm run check:types`: passed after adding explicit typing to the migration test fixture.
- `npx vitest run netlify src/lib/leads src/lib/inquiries`: **410 tests passed across 15 files**. Covers the lead lifecycle, partial contacts, filtering, follow-up/history, shared email/booking/proposal/invoice workflows, conversion, deletion/rollback/ownership, authorization and inquiry regressions.
- Headless Chrome on generated production output: passed at 1440, 768, 375 and 320px, with no page overflow or runtime exceptions. Synthetic local fixtures cover required-field validation, name/phone-only creation, editing/status/priority/follow-up, email preview/send, booking link, search/filter, shared proposal builder and return navigation, conversion validation, delete cancel/confirm and authorization redirect.
- All twelve Netlify Functions bundle successfully with the installed esbuild.
- Data contracts, section registration, legacy motion and `git diff --check`: passed.
- `npm run ai:check` stops at **three pre-existing import-path violations**. The new files use aliases and add no import findings. Remaining checks were run independently.
- Full suite: **1,286 passed; nine failed** in that run. Eight content/component failures reproduce against an unchanged HEAD snapshot (company data, Polish links, AboutExpert and a missing dev thumbnail route). The other failure is the existing QA client test timing out while launching its nested production build. No unrelated fixes were made. Three additional conversion/migration tests added afterward are included in the passing 410-test CRM run.
- Atomic audit retains the existing ChecklistItem margin violation and HeroSplit advisory; no new findings.

Browser providers and Identity were mocked locally. Real deployed authentication, provider delivery and calendar behavior require the deployment smoke test above. No live database was connected, migrated or seeded. Nothing was committed or pushed.

## Changed files

- `LEADS_ADMIN_SETUP.md`
- `database/migrations/010_create_leads.sql`
- `netlify.toml`
- `netlify/bookings.test.ts`
- `netlify/dev-api-aliases.mjs`
- `netlify/functions/admin-bookings.mts`
- `netlify/functions/admin-invoices.mts`
- `netlify/functions/admin-leads.mts`
- `netlify/functions/admin-messages.mts`
- `netlify/functions/admin-proposals.mts`
- `netlify/inquiry-delete.test.ts`
- `netlify/integrations.test.ts`
- `netlify/invoices.test.ts`
- `netlify/leads.test.ts`
- `netlify/lib/booking-links.ts`
- `netlify/lib/booking-store.ts`
- `netlify/lib/crm-owner.ts`
- `netlify/lib/email-render.ts`
- `netlify/lib/inquiry-store.ts`
- `netlify/lib/integrations/sync.ts`
- `netlify/lib/invoice-store.ts`
- `netlify/lib/lead-store.ts`
- `netlify/lib/message-store.ts`
- `netlify/lib/proposal-store.ts`
- `netlify/messages.test.ts`
- `netlify/proposals.test.ts`
- `src/components/admin/InquiryCommunication.astro`
- `src/components/admin/InquiryProposal.astro`
- `src/components/admin/LeadsAdmin.astro`
- `src/layouts/AdminLayout.astro`
- `src/lib/bookings/admin-session.ts`
- `src/lib/bookings/calendar.ts`
- `src/lib/bookings/contract.ts`
- `src/lib/bookings/inquiry-panel.ts`
- `src/lib/communications/admin.ts`
- `src/lib/inquiries/admin.ts`
- `src/lib/inquiries/contract.ts`
- `src/lib/invoices/admin.ts`
- `src/lib/invoices/contract.ts`
- `src/lib/leads/admin.test.ts`
- `src/lib/leads/admin.ts`
- `src/lib/leads/contract.ts`
- `src/lib/proposals/admin.ts`
- `src/lib/proposals/contract.ts`
- `src/lib/proposals/inquiry-panel.ts`
- `src/pages/admin/leads/index.astro`

## Suggested Git commands

After applying the migration to the database used by the next deploy:

```sh
git add -- LEADS_ADMIN_SETUP.md database/migrations/010_create_leads.sql netlify.toml netlify src/components/admin src/layouts/AdminLayout.astro src/lib src/pages/admin/leads
git commit -m "Add admin leads workspace with shared CRM workflows"
git push -u origin feature/admin-leads
```

These commands were not executed.
