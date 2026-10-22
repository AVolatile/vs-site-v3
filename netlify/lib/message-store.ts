import { emailSuppressed, requireEmailAllowed } from "./email-safety";
import { mailboxStatus } from "./integrations/outlook-mail";
import {
  type CrmOwner,
  ownerId,
  ownerColumn,
  ownerFromRow,
  getOwnerContact,
  requireOwnerEmail,
} from "./crm-owner";
import { invoiceForEmail } from "./invoice-store";
import { checkedInvoiceToken, INVOICE_TOKEN_MARKER } from "./invoice-token";
import { bookingForEmail } from "./booking-links";
import { checkedToken, BOOKING_TOKEN_MARKER } from "./booking-token";
import { createHash } from "node:crypto";
import { query } from "./database";
import { getInquiryProposal } from "./proposal-store";
import {
  emailConfiguration,
  EmailProviderError,
  sendInquiryEmail,
  emailReceipt,
  validMessageId,
} from "./email";
import { renderEmail, publicEmailUrl } from "./email-render";
import { HttpError } from "./http";
import type {
  Composition,
  MessageDetail,
  MessageSummary,
  MessageList,
} from "../../src/lib/communications/contract";
const iso = (value: unknown) =>
  (value instanceof Date ? value : new Date(String(value))).toISOString();
const RETRY_WINDOW_HOURS = 23;
function tokenValue(row: Record<string, unknown>, strict = false) {
  if (!row.booking_nonce) return null;
  try {
    return checkedToken(
      String(row.booking_nonce),
      String(row.booking_token_hash),
    );
  } catch (error) {
    if (strict) throw error;
    return "[booking link unavailable]";
  }
}
function hydrate(value: unknown, row: Record<string, unknown>, strict = false) {
  const token = tokenValue(row, strict);
  let output = token
    ? String(value).split(BOOKING_TOKEN_MARKER).join(token)
    : String(value);
  if (row.invoice_id) {
    try {
      output = output
        .split(INVOICE_TOKEN_MARKER)
        .join(
          checkedInvoiceToken(
            String(row.invoice_id),
            iso(row.invoice_token_created_at),
            String(row.invoice_token_hash),
          ),
        );
    } catch (error) {
      if (strict) throw error;
      output = output
        .split(INVOICE_TOKEN_MARKER)
        .join("[invoice link unavailable]");
    }
  }
  return output;
}

function summary(row: Record<string, unknown>): MessageSummary {
  const canRetry =
    row.direction !== "inbound" &&
    row.status !== "sent" &&
    row.status !== "draft" &&
    Date.parse(iso(row.first_attempt_at)) >
      Date.now() - RETRY_WINDOW_HOURS * 3600000 &&
    (row.status === "failed" ||
      Date.parse(iso(row.last_attempt_at)) < Date.now() - 90000);
  return {
    id: String(row.id),
    createdAt: iso(row.created_at),
    sentAt: row.sent_at ? iso(row.sent_at) : null,
    to: String(row.to_email),
    from: String(row.from_email),
    subject: hydrate(row.subject, row),
    status: row.status as MessageSummary["status"],
    templateKey: row.template_key as MessageSummary["templateKey"],
    errorCode: row.error_code == null ? null : String(row.error_code),
    canRetry,
    direction: row.direction === "inbound" ? "inbound" : "outbound",
    format: row.format === "quick" ? "quick" : "branded",
    threadId: String(row.thread_id),
    receivedAt: row.received_at ? iso(row.received_at) : null,
    internetMessageId: row.internet_message_id
      ? String(row.internet_message_id)
      : null,
    deliveryState: row.delivery_state ? String(row.delivery_state) : null,
  };
}
function detail(row: Record<string, unknown>): MessageDetail {
  return {
    ...summary(row),
    bodyText: hydrate(row.body_text, row),
    bodyHtml: hydrate(row.body_html, row),
  };
}
async function messageRow(inquiryId: CrmOwner, id: string) {
  const rows = await query(
    `SELECT * FROM inquiry_messages WHERE ${ownerColumn(inquiryId)}=$1 AND id=$2`,
    [ownerId(inquiryId), id],
  );
  if (!rows[0]) throw new HttpError(404, "This email could not be found.");
  return rows[0];
}
export async function getMessage(inquiryId: CrmOwner, id: string) {
  return detail(await messageRow(inquiryId, id));
}
export async function proposalForEmail(inquiryId: CrmOwner) {
  const p = await getInquiryProposal(inquiryId);
  return p?.status === "sent" && p.clientUrl
    ? { number: p.number, url: publicEmailUrl(p.clientUrl), id: p.id }
    : null;
}
export async function listMessages(
  inquiryId: CrmOwner,
  page = 1,
): Promise<MessageList> {
  await getOwnerContact(inquiryId);
  const [rows, total, proposal, booking, invoice] = await Promise.all([
    query(
      `SELECT * FROM inquiry_messages WHERE ${ownerColumn(inquiryId)}=$1 ORDER BY ${typeof inquiryId === "string" ? "created_at" : "COALESCE(received_at,sent_at,created_at)"} DESC,id DESC LIMIT 10 OFFSET $2`,
      [ownerId(inquiryId), (page - 1) * 10],
    ),
    query(
      `SELECT count(*) AS total FROM inquiry_messages WHERE ${ownerColumn(inquiryId)}=$1`,
      [ownerId(inquiryId)],
    ),
    proposalForEmail(inquiryId),
    bookingForEmail(inquiryId),
    invoiceForEmail(inquiryId),
  ]);
  return {
    items: rows.map(summary),
    ...(typeof inquiryId !== "string"
      ? {
          emailSuppressed: await emailSuppressed(inquiryId),
          mailbox: await mailboxStatus(),
        }
      : {}),
    total: Number(total[0].total),
    page,
    proposal: proposal ? { number: proposal.number, url: proposal.url } : null,
    booking: booking ? { url: booking.url } : null,
    invoice: invoice ? { number: invoice.number, url: invoice.url } : null,
  };
}
export async function previewEmail(inquiryId: CrmOwner, input: Composition) {
  await requireEmailAllowed(inquiryId);
  const config = emailConfiguration(false),
    inquiry = await requireOwnerEmail(inquiryId),
    proposal = await proposalForEmail(inquiryId);
  return renderEmail(
    input,
    inquiry,
    config.from,
    config.replyTo,
    proposal,
    await bookingForEmail(inquiryId),
    input.includeInvoice ? await invoiceForEmail(inquiryId, true) : null,
  );
}
// Only a confirmed provider result can finalize a record. Activity and DB outcome are atomic.
async function finish(
  row: Record<string, unknown>,
  providerId: string | null,
  errorCode: string | null,
) {
  const status = providerId ? "sent" : "failed";
  const rows = await query(
    `WITH saved AS (
    UPDATE inquiry_messages SET status=$3,provider_message_id=$4,sent_at=CASE WHEN $3='sent' THEN clock_timestamp() ELSE NULL END,error_code=$5,updated_at=clock_timestamp()
    WHERE id=$1 AND status<>'sent' AND ($3='sent' OR (status='sending' AND attempt_count=$2)) RETURNING *
  ), activity AS (
    INSERT INTO inquiry_activity (inquiry_id,lead_id,activity_type,actor,note,message_id)
    SELECT inquiry_id,lead_id,CASE WHEN status='sent' THEN 'email_sent' ELSE 'email_failed' END,'admin',subject,id FROM saved
    ON CONFLICT (message_id,activity_type) WHERE message_id IS NOT NULL DO NOTHING RETURNING id
  ) SELECT * FROM saved`,
    [row.id, row.attempt_count, status, providerId, errorCode],
  );
  return rows[0]
    ? detail(rows[0])
    : getMessage(ownerFromRow(row), String(row.id));
}
async function deliver(row: Record<string, unknown>): Promise<MessageDetail> {
  let providerId: string;
  try {
    providerId = await sendInquiryEmail({
      id: String(row.id),
      from: String(row.from_email),
      replyTo: String(row.reply_to_email),
      to: String(row.to_email),
      subject: hydrate(row.subject, row),
      html: hydrate(row.body_html, row, true),
      text: hydrate(row.body_text, row, true),
      ...(validMessageId(row.in_reply_to)
        ? { inReplyTo: row.in_reply_to, references: String(row.reference_ids) }
        : {}),
    });
  } catch (error) {
    if (!(error instanceof EmailProviderError)) throw error;
    return finish(row, null, error.code);
  }
  // If DB finalization fails after acceptance, leave Sending. A same-key retry can reconcile it.
  const saved = await finish(row, providerId, null);
  try {
    await refreshMessageReceipt(String(row.id), providerId);
  } catch {
    /* Acceptance remains authoritative. */
  }
  return getMessage(ownerFromRow(row), saved.id);
}
export async function sendMessage(
  inquiryId: CrmOwner,
  input: Composition & { requestKey: string },
): Promise<MessageDetail> {
  const fingerprint = createHash("sha256")
    .update(
      JSON.stringify({
        inquiryId,
        to: input.to.toLowerCase(),
        subject: input.subject,
        message: input.message,
        templateKey: input.templateKey,
        includeProposal: input.includeProposal,
        ...(input.format ? { format: input.format } : {}),
        ...(input.replyToMessageId
          ? { replyToMessageId: input.replyToMessageId }
          : {}),
        ...(input.includeBooking ? { includeBooking: true } : {}),
        ...(input.includeInvoice ? { includeInvoice: true } : {}),
      }),
    )
    .digest("hex");
  const existing = await query(
    "SELECT * FROM inquiry_messages WHERE request_key=$1",
    [input.requestKey],
  );
  if (existing[0]) {
    if (
      existing[0].payload_fingerprint !== fingerprint ||
      existing[0][ownerColumn(inquiryId)] !== ownerId(inquiryId)
    )
      throw new HttpError(
        409,
        "This send key belongs to a different message. Start a new response deliberately.",
      );
    return detail(existing[0]);
  }
  await requireEmailAllowed(inquiryId);
  const parent = input.replyToMessageId
    ? await messageRow(inquiryId, input.replyToMessageId)
    : null;
  if (parent && parent.status !== "sent")
    throw new HttpError(422, "Reply to a sent or received message.");
  if (
    parent &&
    !validMessageId(parent.internet_message_id) &&
    parent.provider === "resend" &&
    parent.provider_message_id
  ) {
    await refreshMessageReceipt(
      String(parent.id),
      String(parent.provider_message_id),
    );
    Object.assign(parent, await messageRow(inquiryId, String(parent.id)));
  }
  if (parent && !validMessageId(parent.internet_message_id))
    throw new HttpError(
      409,
      "The email provider has not supplied reply context yet. Refresh email status and try Reply again.",
    );
  const replyReferences = parent
    ? [
        ...new Set([
          ...String(parent.reference_ids || "")
            .split(/\s+/)
            .filter(validMessageId),
          String(parent.internet_message_id),
        ]),
      ]
        .slice(-10)
        .join(" ")
    : "";
  const config = emailConfiguration(),
    inquiry = await requireOwnerEmail(inquiryId),
    proposal = await proposalForEmail(inquiryId);
  const booking = await bookingForEmail(inquiryId);
  const invoice = await invoiceForEmail(inquiryId, !!input.includeInvoice);
  const mail = renderEmail(
    input,
    inquiry,
    config.from,
    config.replyTo,
    proposal,
    booking,
    invoice,
  );
  const rawToken = booking ? checkedToken(booking.nonce, booking.hash) : null;
  const fields = [mail.subject, input.message, mail.bodyText, mail.bodyHtml];
  const usesBooking =
    !!rawToken && fields.some((value) => value.includes(rawToken));
  if (
    fields.some((value) =>
      /\/book\/[A-Za-z0-9_-]{43}/.test(
        value.replaceAll(rawToken ?? "__absent__", ""),
      ),
    )
  )
    throw new HttpError(
      422,
      "Use this inquiry’s existing booking link or the Schedule a Call button.",
    );
  const invoiceToken = invoice
    ? checkedInvoiceToken(invoice.id, invoice.createdAt, invoice.hash)
    : null;
  const usesInvoice =
    !!invoiceToken && fields.some((v) => v.includes(invoiceToken));
  if (
    fields.some((v) =>
      /\/invoice\/[A-Za-z0-9_-]{43}/.test(
        v.replaceAll(invoiceToken ?? "__absent__", ""),
      ),
    )
  )
    throw new HttpError(
      422,
      "Use this inquiry’s published invoice link or the View Invoice button.",
    );
  const frozen = fields.map((value) => {
    const output = usesBooking
      ? value.split(rawToken!).join(BOOKING_TOKEN_MARKER)
      : value;
    return usesInvoice
      ? output.split(invoiceToken!).join(INVOICE_TOKEN_MARKER)
      : output;
  });
  const rows = await query(
    `INSERT INTO inquiry_messages (${ownerColumn(inquiryId)},from_email,reply_to_email,to_email,subject,message_text,body_text,body_html,template_key,proposal_id,request_key,payload_fingerprint,booking_nonce,booking_token_hash,invoice_id,invoice_token_hash,invoice_token_created_at,format,thread_id,reply_message_id,in_reply_to,reference_ids)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,COALESCE($19::uuid,gen_random_uuid()),$20,$21,$22) ON CONFLICT (request_key) DO NOTHING RETURNING *`,
    [
      ownerId(inquiryId),
      config.from,
      config.replyTo,
      mail.to,
      ...frozen,
      input.templateKey,
      input.includeProposal ? proposal?.id : null,
      input.requestKey,
      fingerprint,
      usesBooking ? booking!.nonce : null,
      usesBooking ? booking!.hash : null,
      usesInvoice ? invoice!.id : null,
      usesInvoice ? invoice!.hash : null,
      usesInvoice ? invoice!.createdAt : null,
      input.format || "branded",
      parent?.thread_id ?? null,
      parent?.id ?? null,
      parent?.internet_message_id ?? null,
      replyReferences,
    ],
  );
  if (!rows[0]) return sendMessage(inquiryId, input);
  return deliver(rows[0]);
}
export async function retryMessage(
  inquiryId: CrmOwner,
  id: string,
): Promise<MessageDetail> {
  const old = await messageRow(inquiryId, id);
  if (old.status === "sent") return detail(old);
  await requireEmailAllowed(inquiryId);
  const contact = await requireOwnerEmail(inquiryId);
  if (String(old.to_email).toLowerCase() !== contact.email.toLowerCase())
    throw new HttpError(
      409,
      "The contact email changed. Review the saved email before composing a new message.",
    );
  emailConfiguration();
  if (old.booking_nonce) {
    const current = await bookingForEmail(inquiryId);
    if (!current || current.hash !== old.booking_token_hash)
      throw new HttpError(
        409,
        "The booking link changed. Check the previous send outcome before composing a new response.",
      );
    checkedToken(String(old.booking_nonce), String(old.booking_token_hash));
  }
  if (old.invoice_id) {
    const current = await invoiceForEmail(inquiryId);
    if (
      !current ||
      current.id !== old.invoice_id ||
      current.hash !== old.invoice_token_hash
    )
      throw new HttpError(
        409,
        "This invoice link is no longer available for sending. Check the previous send outcome before composing another message.",
      );
    checkedInvoiceToken(
      String(old.invoice_id),
      iso(old.invoice_token_created_at),
      String(old.invoice_token_hash),
    );
  }
  // Never reuse an expired provider key: an ambiguous old send needs manual reconciliation.
  if (
    Date.parse(iso(old.first_attempt_at)) <=
    Date.now() - RETRY_WINDOW_HOURS * 3600000
  )
    throw new HttpError(
      409,
      "The safe retry window has ended. Check the Resend dashboard before composing another email.",
    );
  const rows = await query(
    `UPDATE inquiry_messages SET status='sending',error_code=NULL,attempt_count=attempt_count+1,last_attempt_at=clock_timestamp(),updated_at=clock_timestamp()
    WHERE id=$1 AND ${ownerColumn(inquiryId)}=$2 AND attempt_count=$3 AND first_attempt_at > clock_timestamp()-interval '23 hours'
      AND (status='failed' OR (status='sending' AND last_attempt_at < clock_timestamp()-interval '90 seconds')) RETURNING *`,
    [id, ownerId(inquiryId), old.attempt_count],
  );
  return rows[0] ? deliver(rows[0]) : getMessage(inquiryId, id);
}

export async function refreshMessageReceipt(id: string, providerId: string) {
  const receipt = await emailReceipt(providerId);
  if (!receipt) return false;
  await query(
    `UPDATE inquiry_messages SET internet_message_id=COALESCE($2,internet_message_id),
    delivery_state=CASE WHEN delivery_state IN('bounced','complained','suppressed') THEN delivery_state ELSE $3 END
    WHERE id=$1 AND provider='resend' AND status='sent'`,
    [id, receipt.internetMessageId, receipt.state],
  );
  return true;
}
export async function refreshEmailReceipts(owner: CrmOwner) {
  await getOwnerContact(owner);
  const rows = await query(
    `SELECT id,provider_message_id FROM inquiry_messages WHERE ${ownerColumn(owner)}=$1
    AND provider='resend' AND status='sent' ORDER BY created_at DESC LIMIT 10`,
    [ownerId(owner)],
  );
  // Bound concurrency and avoid provider-rate spikes in an individual workspace.
  let refreshed = 0;
  for (let i = 0; i < rows.length; i += 2) {
    const outcomes = await Promise.all(
      rows
        .slice(i, i + 2)
        .map((row) =>
          refreshMessageReceipt(
            String(row.id),
            String(row.provider_message_id),
          ),
        ),
    );
    refreshed += outcomes.filter(Boolean).length;
  }
  return { refreshed, total: rows.length };
}
