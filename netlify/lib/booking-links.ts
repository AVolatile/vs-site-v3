import { query } from "./database";
import { getInquiry } from "./inquiry-store";
import {
  createBookingToken,
  checkedToken,
  bookingTokenHash,
} from "./booking-token";
import { publicUrl } from "./public-url";
import { HttpError } from "./http";
export async function getBookingLink(inquiryId: string) {
  const rows = await query("SELECT * FROM booking_links WHERE inquiry_id=$1", [
    inquiryId,
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
export async function bookingForEmail(inquiryId: string) {
  const row = await getBookingLink(inquiryId);
  return row
    ? {
        url: linkUrl(row),
        nonce: String(row.token_nonce),
        hash: String(row.token_hash),
      }
    : null;
}
export async function publicBookingLink(token: string) {
  const rows = await query(
    "SELECT l.*,i.name,i.email FROM booking_links l JOIN inquiries i ON i.id=l.inquiry_id WHERE l.token_hash=$1",
    [bookingTokenHash(token)],
  );
  if (!rows[0]) throw new HttpError(404, "This booking link is unavailable.");
  return rows[0];
}
export async function createInquiryBookingLink(
  inquiryId: string,
  regenerate = false,
) {
  await getInquiry(inquiryId);
  const existing = await getBookingLink(inquiryId);
  if (existing && !regenerate)
    return {
      url: linkUrl(existing),
      lastFour: String(existing.token_last_four),
    };
  const next = createBookingToken();
  const rows = await query(
    `WITH guard AS MATERIALIZED(SELECT id FROM booking_settings WHERE id=true FOR UPDATE),saved AS(
 INSERT INTO booking_links(inquiry_id,token_hash,token_nonce,token_last_four) SELECT $1,$2,$3,$4 FROM guard
 ON CONFLICT(inquiry_id) DO UPDATE SET token_hash=CASE WHEN $5 THEN EXCLUDED.token_hash ELSE booking_links.token_hash END,token_nonce=CASE WHEN $5 THEN EXCLUDED.token_nonce ELSE booking_links.token_nonce END,token_last_four=CASE WHEN $5 THEN EXCLUDED.token_last_four ELSE booking_links.token_last_four END,updated_at=CASE WHEN $5 THEN clock_timestamp() ELSE booking_links.updated_at END
 RETURNING *),activity AS(INSERT INTO inquiry_activity(inquiry_id,activity_type,actor,note) SELECT inquiry_id,CASE WHEN $5 THEN 'booking_link_regenerated' ELSE 'booking_link_created' END,'admin','Booking link available' FROM saved WHERE token_hash=$2 RETURNING id) SELECT * FROM saved`,
    [inquiryId, next.hash, next.nonce, next.token.slice(-4), regenerate],
  );
  if (!rows[0]) throw new HttpError(503, "Booking settings are unavailable.");
  return { url: linkUrl(rows[0]), lastFour: String(rows[0].token_last_four) };
}
