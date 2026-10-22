# Lead email workspace

Leads can send individual email and continue conversations without conversion or project fields. The Communication panel reuses the shared `inquiry_messages` table, existing admin authorization, same-origin checks, sender/reply-to settings, Resend adapter, branded renderer, frozen snapshots, activity and retry/idempotency rules. Inquiry messages retain their existing branded composer and owner contract.

## Deploy and configure

1. Apply **011_lead_email_workspace.sql** once to the intended Neon branch after unchanged migrations 001–010, before deploying this code. This migration sends nothing and makes no provider calls. It adds no leads, inquiries or inbound fixtures.
2. Keep `DATABASE_URL`, `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_REPLY_TO`, `SITE_URL` / the existing public-email origin configuration unchanged. The existing verified sender remains the only outbound identity.
3. Resend email **read access** is needed to retrieve actual RFC Message-IDs and delivery events. Sending-only keys still send Quick Email and branded email successfully; receipt failures never revoke provider acceptance. Until an actual Message-ID is available, Reply reports that context is unavailable rather than inventing an identifier. If necessary, grant read access to the existing Resend integration in your provider configuration. Use **Check delivery status** to refresh the ten latest accepted outbound messages for a lead, including older records without RFC identifiers. A missing receipt remains unknown; “Sent” means accepted, not delivered. There is no webhook endpoint in this feature.
4. Optional inbound: add delegated Microsoft Graph **Mail.Read** permission to the existing Microsoft app registration. Set Functions-scoped `MICROSOFT_MAIL_ENABLED=true` and redeploy. Reconnect Outlook from `/admin/settings/integrations/` and consent to the added read permission. The connected account email must equal `EMAIL_REPLY_TO` (case insensitive). Use the actual business mailbox, not a calendar-only account or an alias/shared mailbox address. The existing `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`, optional `MICROSOFT_TENANT_ID` / `MICROSOFT_REDIRECT_URI`, `INTEGRATION_ENCRYPTION_KEY` and `SITE_URL` are reused. No Graph Mail.Send/Mail.ReadWrite permission, second OAuth grant or new email provider is required.
5. With the correct connected mailbox and scope, **Sync replies** appears in Lead Communication. Otherwise the panel explicitly shows **Outbound only**, and outbound email remains available. Calendar-only refresh tokens continue requesting their existing calendar scopes; enabling the flag does not silently broaden an existing grant.

Example migration command, only after selecting the intended database:

```sh
psql "$DATABASE_URL" --set ON_ERROR_STOP=on --file database/migrations/011_lead_email_workspace.sql
```

No live migration, deployment, connection change or real email delivery was performed during implementation.

## Compose and follow up

- **Compose → Quick Email** defaults to the saved Lead email. Recipient editing is disabled, and the server independently enforces the same contact address. Subject/body are freeform; normal paragraphs and pasted HTTP(S) links render safely. Text is sent as written, with no automatic greeting, signature, template-variable expansion or document button. HTML is escaped.
- **Branded / template email** exposes the existing templates and editable message, greeting, signature, logo and supported document buttons. The existing branded markup is reused, not copied into Leads. Proposals/invoices/booking links retain their existing prerequisites.
- **Reply** selects an owned saved message, preserves the thread and `Re:` subject, and sends `In-Reply-To` / bounded `References` using actual RFC identifiers. The server rejects another owner's parent, unsent parents and unavailable provider context. Reply still uses the current saved Lead address and existing sender/reply-to identity; there is no reply-all or automatic historical quotation in the composer.
- Conversation groups show chronological messages, direction, sender/recipient, timestamps and known status. The latest message opens automatically. Older messages remain expandable; ten-message pages retain thread identity across pages. History stays readable when sending is unavailable.
- Sending derives last contact from confirmed outbound acceptance without changing Lead status or its edit version. Inbound receipt exposes reply state without changing manual status or outbound last contact. **Schedule follow-up** opens the existing next-step fields; save the Lead to schedule it. Existing follow-up history is retained.
- The directory adds an Email filter for has-email, never emailed, awaiting reply, replied and do-not-email / blocked contacts, plus an indicator derived from actual outbound/inbound dates. Existing follow-up filters and dates continue to identify due follow-ups. These are communication indicators, not another Lead status system.

## Inbound and thread matching

`outlook-mail.ts` is the read-only mailbox adapter, isolated from sending. It reuses encrypted Microsoft credentials and the existing Graph transport. Sync is **on demand**, not a scheduled or live mailbox service. One click processes a bounded Inbox delta page; click again when the panel reports more messages. The first sync walks the existing Inbox, so a large Inbox can require several clicks. It imports only messages associated with currently known Leads, not unrelated mail or Inquiry-only correspondence.

Matching prioritizes `In-Reply-To` / `References` against stored Internet Message-IDs, then an already established account-scoped Graph conversation ID. Sender identity must agree, and conflicting owners/threads are rejected. With no stronger match, a sender address can attach only to one unambiguous CRM contact, which must be a Lead; this starts a new conversation. Subject text is never used to assign ownership or merge threads. If a Lead and Inquiry (or two Leads) share an address, only a verified thread match can resolve it. Unknown/ambiguous messages are left in Outlook, not guessed into the CRM. This is correlation, not proof of a sender's identity.

Immutable Graph message IDs plus mailbox account IDs deduplicate repeated pages. Message/activity insertion is atomic. A lease serializes sync; validated next/delta links advance only after processing succeeds. Failed pages remain replayable, and expired cursors restart safely through deduplication. Deletions/moves do not erase CRM snapshots. The adapter requests Graph text `uniqueBody` to avoid storing quoted history when supplied, falling back to the text body. Stored text is escaped and rendered with `textContent`; inbound HTML, remote images and attachments never execute in admin. Messages longer than 20,000 characters are explicitly shortened, with the full message available in Outlook.

This reads **Inbox only** for the connected account. Mail moved by rules before sync, other folders, shared mailboxes, aliases, attachments, reply-all, provider Sent-folder messages and automatic background sync are outside this feature. Messages that were skipped before the Lead existed are not retroactively imported by an already advanced delta cursor. Original pre-workspace emails each retain an independent thread until an actual provider/header relationship is known; no subject-based historical backfill is attempted.

Provider references: [Microsoft message delta](https://learn.microsoft.com/en-us/graph/api/message-delta?view=graph-rest-1.0), [Graph text bodies and message headers](https://learn.microsoft.com/en-us/graph/api/message-get?view=graph-rest-1.0), [Resend actual Message-ID retrieval and threading](https://resend.com/changelog/message-id-for-sent-emails).

## Contact safety and storage

**Do not email** blocks new sends, previews and retries on the server. It follows the Lead across email edits and also blocks other records using the same currently suppressed address. A recorded bounce, complaint or provider suppression blocks repeated sends to that address even if a manual flag is removed; review the contact/provider outcome before any database-level remediation. Suppression cannot cancel a send already accepted or in flight. A database guard serializes same-Lead message reservation with permission changes and refuses permission changes until a Sending outcome is resolved. Changing the saved email also prevents retrying an old message to the previous address.

Migration 011 extends shared storage with format, thread/reply ownership, RFC Message-ID/references, provider conversation/account IDs, received timestamp, delivery state and a Lead suppression flag. A database trigger enforces same-owner/thread parent relationships. The mailbox cursor/lease table contains only synchronization state. Existing Inquiry messages, snapshots, request keys and business workflows remain backward compatible. Activity records `email_received` alongside existing send/failure events; email bodies remain in message snapshots, never generic activity.

No campaigns, bulk sends, sequences, public website changes, localization changes, generated document redesign or authentication-role changes are included. Validate real mailbox consent, verified sender configuration, delivered email rendering and the actual send/reply cycle on the deployed environment with a deliberate test contact.

## Files changed

- Migration: `database/migrations/011_lead_email_workspace.sql`.
- Server: `netlify/functions/admin-messages.mts`; `netlify/lib/email.ts`, `email-render.ts`, `email-safety.ts`, `message-store.ts`, `lead-store.ts`; `netlify/lib/integrations/microsoft-auth.ts`, `outlook-mail.ts`.
- Admin UI: `src/components/admin/InquiryCommunication.astro`, `LeadsAdmin.astro`; `src/lib/communications/admin.ts`, `contract.ts`; `src/lib/leads/admin.ts`, `contract.ts`.
- Tests: `netlify/lead-email-workspace.test.ts`, `email-adapter.test.ts`, `messages.test.ts`, `leads.test.ts`, `integrations.test.ts`, `bookings.test.ts`, `invoices.test.ts`, `proposals.test.ts`; `src/lib/leads/admin.test.ts`. Existing suite fixtures advance to migration 011; the historical migration-010 upgrade test retains its original pre-010 boundary.
- Documentation: this file and `LEADS_ADMIN_SETUP.md`.

## Validation record

- Focused command: `npx vitest run netlify src/lib/leads/admin.test.ts src/components/admin/workspace.test.ts` — **452 passed**. Tests exercise actual PostgreSQL queries/migrations through isolated PGlite and synthetic Identity/Resend/Graph adapters. No live database or provider is used.
- `npm run check:types` — **545 files, zero errors**. Data contracts, registration and motion checks pass. All 12 Netlify Functions bundle for Node 22; the final messaging/Lead bundles also pass after the final server changes.
- `npm run build` — passed; the final production Astro build also passes with **22 pages**. Asset regeneration is excluded from the feature diff: regenerated public derivatives were restored. The build emits its existing warning about nine already tracked disabled routes; `npm run scope:restore` reports no manifest. No disabled routes were activated or modified.
- Isolated Chrome against production-built UI with synthetic local APIs passes **320, 375, 768 and 1440px**, no horizontal overflow or runtime exceptions. Covered: Quick Email, branded template selection, previews, chronological conversation display, replies, double submit, failed-draft preservation/retry, suppression, outbound-only/inbound states, directory display and existing follow-up save. Mobile/desktop screenshots were reviewed. Real Microsoft consent, mailbox delivery, sender verification and email-client rendering remain deployment checks.
- `git diff --check` passes. No historical migration, public page/content/asset, localization, design-token, dependency or authentication-role changes are included. Styling is limited to new conversation headings/spacing inside the existing admin communication component.
- Wider checks are not wholly green. `npm run ai:check` passes types/data, then stops at **three existing relative-import violations** in untouched Inquiry/Proposal controllers. Registration/motion were run separately and pass. Atomic audit reports the existing `ChecklistItem.astro` margin violation and `HeroSplitBlock.astro` advisory; neither file is changed.
- The full suite finishes with **1,350 passed and nine failures**. Eight failures in public/demo company content, Polish route assertions, About/LinkedIn contracts and the disabled developer thumbnail route reproduce against an unchanged HEAD copy. The ninth is the unrelated QA orchestrator's `qa:client` test timing out at 60 seconds while invoking its own production build. No unrelated test expectations or production behavior were changed. A plain `tsc --noEmit` also reports existing Astro-module declaration errors; the repository's supported Astro typecheck passes.
