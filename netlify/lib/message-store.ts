import { bookingForEmail } from "./booking-links";
import { checkedToken, BOOKING_TOKEN_MARKER } from "./booking-token";
import { createHash } from "node:crypto";
import { query } from "./database";
import { getInquiry } from "./inquiry-store";
import { getInquiryProposal } from "./proposal-store";
import {
  emailConfiguration,
  EmailProviderError,
  sendInquiryEmail,
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
  return token
    ? String(value).split(BOOKING_TOKEN_MARKER).join(token)
    : String(value);
}

function summary(row: Record<string, unknown>): MessageSummary {
  const canRetry =
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
  };
}
function detail(row: Record<string, unknown>): MessageDetail {
  return {
    ...summary(row),
    bodyText: hydrate(row.body_text, row),
    bodyHtml: hydrate(row.body_html, row),
  };
}
async function messageRow(inquiryId: string, id: string) {
  const rows = await query(
    "SELECT * FROM inquiry_messages WHERE inquiry_id=$1 AND id=$2",
    [inquiryId, id],
  );
  if (!rows[0]) throw new HttpError(404, "This email could not be found.");
  return rows[0];
}
export async function getMessage(inquiryId: string, id: string) {
  return detail(await messageRow(inquiryId, id));
}
export async function proposalForEmail(inquiryId: string) {
  const p = await getInquiryProposal(inquiryId);
  return p?.status === "sent" && p.clientUrl
    ? { number: p.number, url: publicEmailUrl(p.clientUrl), id: p.id }
    : null;
}
export async function listMessages(
  inquiryId: string,
  page = 1,
): Promise<MessageList> {
  await getInquiry(inquiryId);
  const [rows, total, proposal, booking] = await Promise.all([
    query(
      "SELECT id,created_at,sent_at,to_email,from_email,subject,status,template_key,error_code,first_attempt_at,last_attempt_at,booking_nonce,booking_token_hash FROM inquiry_messages WHERE inquiry_id=$1 ORDER BY created_at DESC,id DESC LIMIT 10 OFFSET $2",
      [inquiryId, (page - 1) * 10],
    ),
    query(
      "SELECT count(*) AS total FROM inquiry_messages WHERE inquiry_id=$1",
      [inquiryId],
    ),
    proposalForEmail(inquiryId),
    bookingForEmail(inquiryId),
  ]);
  return {
    items: rows.map(summary),
    total: Number(total[0].total),
    page,
    proposal: proposal ? { number: proposal.number, url: proposal.url } : null,
    booking: booking ? { url: booking.url } : null,
  };
}
export async function previewEmail(inquiryId: string, input: Composition) {
  const config = emailConfiguration(false),
    inquiry = await getInquiry(inquiryId),
    proposal = await proposalForEmail(inquiryId);
  return renderEmail(
    input,
    inquiry,
    config.from,
    config.replyTo,
    proposal,
    await bookingForEmail(inquiryId),
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
    INSERT INTO inquiry_activity (inquiry_id,activity_type,actor,note,message_id)
    SELECT inquiry_id,CASE WHEN status='sent' THEN 'email_sent' ELSE 'email_failed' END,'admin',subject,id FROM saved
    ON CONFLICT (message_id,activity_type) WHERE message_id IS NOT NULL DO NOTHING RETURNING id
  ) SELECT * FROM saved`,
    [row.id, row.attempt_count, status, providerId, errorCode],
  );
  return rows[0]
    ? detail(rows[0])
    : getMessage(String(row.inquiry_id), String(row.id));
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
    });
  } catch (error) {
    if (!(error instanceof EmailProviderError)) throw error;
    return finish(row, null, error.code);
  }
  // If DB finalization fails after acceptance, leave Sending. A same-key retry can reconcile it.
  return finish(row, providerId, null);
}
export async function sendMessage(
  inquiryId: string,
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
        ...(input.includeBooking ? { includeBooking: true } : {}),
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
      existing[0].inquiry_id !== inquiryId
    )
      throw new HttpError(
        409,
        "This send key belongs to a different message. Start a new response deliberately.",
      );
    return detail(existing[0]);
  }
  const config = emailConfiguration(),
    inquiry = await getInquiry(inquiryId),
    proposal = await proposalForEmail(inquiryId);
  const booking = await bookingForEmail(inquiryId);
  const mail = renderEmail(
    input,
    inquiry,
    config.from,
    config.replyTo,
    proposal,
    booking,
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
  const frozen = fields.map((value) =>
    usesBooking ? value.split(rawToken!).join(BOOKING_TOKEN_MARKER) : value,
  );
  const rows = await query(
    `INSERT INTO inquiry_messages (inquiry_id,from_email,reply_to_email,to_email,subject,message_text,body_text,body_html,template_key,proposal_id,request_key,payload_fingerprint,booking_nonce,booking_token_hash)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) ON CONFLICT (request_key) DO NOTHING RETURNING *`,
    [
      inquiryId,
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
    ],
  );
  if (!rows[0]) return sendMessage(inquiryId, input);
  return deliver(rows[0]);
}
export async function retryMessage(
  inquiryId: string,
  id: string,
): Promise<MessageDetail> {
  const old = await messageRow(inquiryId, id);
  if (old.status === "sent") return detail(old);
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
    WHERE id=$1 AND inquiry_id=$2 AND attempt_count=$3 AND first_attempt_at > clock_timestamp()-interval '23 hours'
      AND (status='failed' OR (status='sending' AND last_attempt_at < clock_timestamp()-interval '90 seconds')) RETURNING *`,
    [id, inquiryId, old.attempt_count],
  );
  return rows[0] ? deliver(rows[0]) : getMessage(inquiryId, id);
}
