import { query } from "./database";
import { type CrmOwner, getOwnerContact } from "./crm-owner";
import { HttpError } from "./http";

export async function emailSuppressed(owner: CrmOwner) {
  const contact = await getOwnerContact(owner);
  const rows = await query(
    `SELECT 1 FROM leads WHERE (id=$1 OR (email<>'' AND lower(email)=lower($2))) AND email_suppressed
    UNION ALL SELECT 1 FROM inquiry_messages WHERE direction='outbound' AND lower(to_email)=lower($2)
      AND delivery_state IN('bounced','complained','suppressed') LIMIT 1`,
    [typeof owner === "string" ? null : owner.leadId, contact.email],
  );
  return rows.length > 0;
}
export async function requireEmailAllowed(owner: CrmOwner) {
  if (await emailSuppressed(owner))
    throw new HttpError(
      422,
      "Do not email: this contact is suppressed or has a bounce/complaint. Review the contact before sending.",
    );
}
export async function setEmailSuppression(
  owner: CrmOwner,
  suppressed: boolean,
) {
  if (typeof owner === "string") throw new HttpError(400, "Choose a lead.");
  try {
    const rows = await query(
      `WITH saved AS (
      UPDATE leads SET email_suppressed=$2 WHERE id=$1 AND email_suppressed IS DISTINCT FROM $2 RETURNING id
    ), activity AS (
      INSERT INTO inquiry_activity(lead_id,activity_type,actor,note)
      SELECT id,'lead_updated','admin',CASE WHEN $2 THEN 'Do not email enabled' ELSE 'Do not email removed' END FROM saved RETURNING id
    ) SELECT id FROM saved`,
      [owner.leadId, suppressed],
    );
    if (!rows.length) await getOwnerContact(owner);
  } catch (error) {
    if (
      typeof error === "object" &&
      error &&
      "code" in error &&
      error.code === "P0001"
    )
      throw new HttpError(
        409,
        "An email is still sending. Refresh its outcome before changing email permission.",
      );
    throw error;
  }
  return { emailSuppressed: await emailSuppressed(owner) };
}
