import { type CrmOwner, ownerId, ownerColumn, requireOwnerEmail } from './crm-owner';
import { query } from "./database";
import {
  createBookingToken,
  checkedToken,
  bookingTokenHash,
} from "./booking-token";
import { publicUrl } from "./public-url";
import { HttpError } from "./http";
export async function getBookingLink(inquiryId: CrmOwner) {
  const rows = await query(`SELECT * FROM booking_links WHERE ${ownerColumn(inquiryId)}=$1`, [
    ownerId(inquiryId),
  ]);
  return rows[0] ?? null;
}
export function linkUrl(row: Record<string, unknown>) {
  return publicUrl(
    "/book/" +
      checkedToken(String(row.token_nonce), String(row.token_hash)) +
      "/",
  );
}
export async function bookingForEmail(inquiryId: CrmOwner) {
  const row = await getBookingLink(inquiryId);
  const call=(await query(`SELECT zoom_join_url FROM bookings b WHERE ${ownerColumn(inquiryId)}=$1 AND status='scheduled' AND meeting_type='zoom' AND to_jsonb(b)->>'zoom_sync_status'='synced' ORDER BY created_at DESC LIMIT 1`,[ownerId(inquiryId)]))[0];
  return row
    ? {
        url: linkUrl(row),
        nonce: String(row.token_nonce),
        hash: String(row.token_hash),
        ...(call?.zoom_join_url ? {zoomJoinUrl:String(call.zoom_join_url)} : {}),
      }
    : null;
}
export async function publicBookingLink(token: string) {
  const rows = await query(
    "SELECT l.*,COALESCE(i.name,l2.name) AS name,COALESCE(i.email,l2.email) AS email FROM booking_links l LEFT JOIN inquiries i ON i.id=l.inquiry_id LEFT JOIN leads l2 ON l2.id=l.lead_id WHERE l.token_hash=$1",
    [bookingTokenHash(token)],
  );
  if (!rows[0]) throw new HttpError(404, "This booking link is unavailable.");
  return rows[0];
}
export async function createInquiryBookingLink(
  inquiryId: CrmOwner,
  regenerate = false,
) {
  await requireOwnerEmail(inquiryId);
  const existing = await getBookingLink(inquiryId);
  if (existing && !regenerate)
    return {
      url: linkUrl(existing),
      lastFour: String(existing.token_last_four),
    };
  const next = createBookingToken();
  const rows = await query(
    `WITH guard AS MATERIALIZED(SELECT id FROM booking_settings WHERE id=true FOR UPDATE),saved AS(
 INSERT INTO booking_links(${ownerColumn(inquiryId)},token_hash,token_nonce,token_last_four) SELECT $1,$2,$3,$4 FROM guard
 ON CONFLICT(${ownerColumn(inquiryId)}) DO UPDATE SET token_hash=CASE WHEN $5 THEN EXCLUDED.token_hash ELSE booking_links.token_hash END,token_nonce=CASE WHEN $5 THEN EXCLUDED.token_nonce ELSE booking_links.token_nonce END,token_last_four=CASE WHEN $5 THEN EXCLUDED.token_last_four ELSE booking_links.token_last_four END,updated_at=CASE WHEN $5 THEN clock_timestamp() ELSE booking_links.updated_at END
 RETURNING *),activity AS(INSERT INTO inquiry_activity(inquiry_id,lead_id,activity_type,actor,note) SELECT inquiry_id,lead_id,CASE WHEN $5 THEN 'booking_link_regenerated' ELSE 'booking_link_created' END,'admin','Booking link available' FROM saved WHERE token_hash=$2 RETURNING id) SELECT * FROM saved`,
    [ownerId(inquiryId), next.hash, next.nonce, next.token.slice(-4), regenerate],
  );
  if (!rows[0]) throw new HttpError(503, "Booking settings are unavailable.");
  return { url: linkUrl(rows[0]), lastFour: String(rows[0].token_last_four) };
}
