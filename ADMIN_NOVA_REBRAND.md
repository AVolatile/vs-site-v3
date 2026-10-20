# Nova admin presentation rebrand

The private workspace now uses Nova's existing Satoshi typography, warm surfaces, copper accents, thin rules, Button/Heading/Text atoms, and container conventions. Open sections replace repeated bordered cards. Desktop records use asymmetric contact/opportunity and communication/document columns; mobile uses deliberate stacked layouts.

## Delivered

- Shared desktop/mobile navigation, active-page treatment, page headers and contextual action hierarchy.
- Compact inquiry summary, integrated filters with selected-filter feedback, ruled directories, labelled mobile records, and restrained pipeline stages.
- Inquiry and Lead working records with section navigation, grouped contact fields, follow-up, private notes, communication, documents, bookings, conversion and history.
- Calendar/agenda, booking details and confirmations, weekly availability, date exceptions and integrations.
- Proposal and invoice admin editors with structured project/billing, pricing, line-item and notes layouts.

The shared components are `AdminNavigation`, `AdminPageHeader`, `AdminSectionHeading`, and `AdminRecordNav`. Inquiry details reuse the existing `InquiryProposal` component. Repeated private styles are consolidated into `admin.css`; all selectors are scoped to `body.admin-ui`. The small presentation module adds mobile table labels, selected-filter feedback and record headings without requests or CRM mutations.

## Boundaries preserved

Generated proposal/invoice documents, email markup/content, sender/delivery behavior, CRM controllers/contracts, authentication, booking mechanics, provider synchronization, database/migration 010, dependencies and deployment configuration are unchanged. Public content, public styling, design tokens, localization structures and page composition are unchanged. No unrelated visual changes were made.

## Changed files

New:

- `src/components/admin/AdminNavigation.astro`
- `src/components/admin/AdminPageHeader.astro`
- `src/components/admin/AdminSectionHeading.astro`
- `src/components/admin/AdminRecordNav.astro`
- `src/components/admin/workspace.test.ts`
- `src/lib/admin/presentation.ts`
- `ADMIN_NOVA_REBRAND.md`

Updated:

- `src/layouts/AdminLayout.astro`
- `src/styles/admin.css`
- `src/components/admin/InquiryAdmin.astro`
- `src/components/admin/LeadsAdmin.astro`
- `src/components/admin/InquiryPipeline.astro`
- `src/components/admin/InquiryCommunication.astro`
- `src/components/admin/InquiryBooking.astro`
- `src/components/admin/InquiryActivity.astro`
- `src/components/admin/BookingCalendar.astro`
- `src/components/admin/CalendarAvailability.astro`
- `src/components/admin/IntegrationSettings.astro`
- `src/components/proposals/ProposalEditor.astro`
- `src/components/invoices/InvoiceEditor.astro`

## Validation

- `npm run check:types` — passed, 540 files, zero errors.
- `npx vitest run netlify src/lib/leads src/lib/inquiries src/components/admin/workspace.test.ts` — passed, 425 tests across 16 files. Includes Leads, inquiries, proposal, invoice, booking, integration and communication regressions, plus navigation/label/section-link contracts.
- `node node_modules/astro/bin/astro.mjs build` — passed, all 22 production pages.
- `node src/scripts/scope-pages.mjs build` — Astro compilation passed; the existing wrapper exits with an error because nine tracked routes already reside under `src/pages/_disabled/`. Disabled routes and build tooling were left unchanged. The complete `npm run build` pipeline is therefore not reported as passing.
- Data contracts, component registrations and legacy-motion checks passed using their existing `src/scripts/check-*.ts` scripts with `node --import tsx`.
- Import audit retains three existing relative-import findings in inquiry/proposal controllers. Atomic-design audit retains the existing `ChecklistItem` margin finding and `HeroSplitBlock` advisory. No new findings were introduced.
- Local Chrome QA used synthetic records and mocked APIs at 1440, 1024, 768, 375 and 320 pixels: 91 screenshots, no page overflow, duplicate IDs or runtime exceptions. Checked list/pipeline/detail/create/edit, communication, follow-up/history, calendar/booking/dialogs, availability, editors and integrations. Lead/inquiry note saves, availability save and mobile-menu Escape behavior passed. No live database, mail or meeting-provider calls were made.
- `git diff --check` — passed. Protected paths have no diff.

Screenshot gallery: `/private/tmp/vs-admin-nova-qa/index.html`. Browser QA script: `/private/tmp/admin-rebrand-visual.mjs`. Logs: `/tmp/admin-rebrand-final-{types,tests,build,browser}.log`.

No unresolved visual defect was observed in the checked Chrome sizes. Manual review should use real records and Safari/touch devices; those were not part of the local browser matrix. Desktop pipeline scrolling is intentionally contained within the board.

## Suggested Git commands

Work remains uncommitted on `design/admin-nova-rebrand`. No commit, push, merge or deployment was performed.

```sh
git add -- ADMIN_NOVA_REBRAND.md src/components/admin src/components/proposals/ProposalEditor.astro src/components/invoices/InvoiceEditor.astro src/layouts/AdminLayout.astro src/styles/admin.css src/lib/admin
git commit -m "Rebrand admin workspace with Nova presentation"
git push -u origin design/admin-nova-rebrand
```
