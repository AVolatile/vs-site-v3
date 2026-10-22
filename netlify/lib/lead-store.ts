import { createHash } from "node:crypto";
import { query } from "./database";
import { HttpError } from "./http";
import { changeAdminBooking } from "./booking-store";
import { attemptBookingSync } from "./integrations/sync";
import type { InquiryInput } from "../../src/lib/inquiries/contract";
import type {
  Lead,
  LeadInput,
  LeadList,
  LeadActivity,
  leadBrowseSchema,
} from "../../src/lib/leads/contract";
import type { z } from "zod";

const iso = (value: unknown) =>
  value == null
    ? null
    : (value instanceof Date ? value : new Date(String(value))).toISOString();
function detail(row: Record<string, unknown>): Lead {
  return {
    id: String(row.id),
    createdAt: iso(row.created_at)!,
    updatedAt: iso(row.updated_at)!,
    company: String(row.company),
    name: String(row.name),
    email: String(row.email),
    phone: String(row.phone),
    website: String(row.website),
    location: String(row.location),
    category: String(row.category),
    source: String(row.source),
    status: row.status as Lead["status"],
    priority: row.priority as Lead["priority"],
    adminNotes: String(row.admin_notes),
    lastContactAt: iso(row.last_contact_at),
    nextFollowUpAt: iso(row.next_follow_up_at),
    followUpNote: String(row.follow_up_note),
    convertedInquiryId: row.converted_inquiry_id
      ? String(row.converted_inquiry_id)
      : null,
    convertedAt: iso(row.converted_at),
    emailSuppressed: !!row.email_suppressed,
    lastEmailAt: iso(row.last_email_at),
    lastReplyAt: iso(row.last_reply_at),
  };
}
const emailDates = `(SELECT max(sent_at) FROM inquiry_messages WHERE lead_id=leads.id AND status='sent' AND direction='outbound')`;
const replyDates = `(SELECT max(received_at) FROM inquiry_messages WHERE lead_id=leads.id AND direction='inbound')`;
const blockedEmail = `(leads.email_suppressed OR EXISTS(SELECT 1 FROM leads suppressed
  WHERE leads.email<>'' AND lower(suppressed.email)=lower(leads.email) AND suppressed.email_suppressed)
  OR EXISTS(SELECT 1 FROM inquiry_messages blocked WHERE leads.email<>'' AND lower(blocked.to_email)=lower(leads.email)
    AND blocked.direction='outbound' AND blocked.delivery_state IN('bounced','complained','suppressed')))`;
const selection = `SELECT leads.*,${blockedEmail} AS email_suppressed,GREATEST(leads.last_contact_at,${emailDates}) AS last_contact_at,
  ${emailDates} AS last_email_at,${replyDates} AS last_reply_at FROM leads`;
const fields = [
  "company",
  "name",
  "email",
  "phone",
  "website",
  "location",
  "category",
  "source",
  "status",
  "priority",
  "admin_notes",
  "last_contact_at",
  "next_follow_up_at",
  "follow_up_note",
];
const values = (input: LeadInput) => [
  input.company,
  input.name,
  input.email,
  input.phone,
  input.website,
  input.location,
  input.category,
  input.source,
  input.status,
  input.priority,
  input.adminNotes,
  input.lastContactAt,
  input.nextFollowUpAt,
  input.followUpNote,
];
export async function getLead(id: string): Promise<Lead> {
  const row = (await query(selection + " WHERE id=$1", [id]))[0];
  if (!row) throw new HttpError(404, "This lead could not be found.");
  return detail(row);
}
export async function createLead(input: LeadInput): Promise<Lead> {
  if (input.status === "converted")
    throw new HttpError(
      422,
      "Use Convert to Inquiry to mark a lead Converted.",
      { status: "Choose a status before conversion." },
    );
  const rows = await query(
    `WITH created AS (
    INSERT INTO leads(${fields.join(",")}) VALUES(${fields.map((_, index) => "$" + (index + 1)).join(",")}) RETURNING *
  ),activity AS (
    INSERT INTO inquiry_activity(lead_id,activity_type,actor) SELECT id,'lead_created','admin' FROM created RETURNING id
  ) SELECT * FROM created`,
    values(input),
  );
  return detail(rows[0]);
}
export async function updateLead(
  id: string,
  input: LeadInput,
  version: string,
): Promise<Lead> {
  const rows = await query(
    `WITH previous AS MATERIALIZED(SELECT * FROM leads WHERE id=$1 FOR UPDATE), saved AS (
    UPDATE leads l SET ${fields.map((field, index) => `${field}=$${index + 2}`).join(",")},
      updated_at=GREATEST(date_trunc('milliseconds',clock_timestamp()),previous.updated_at+interval '1 millisecond')
    FROM previous WHERE l.id=previous.id AND previous.updated_at=$16::timestamptz
      AND (($10='converted')=(previous.converted_at IS NOT NULL))
    RETURNING l.*,ROW(${fields.map((field) => "previous." + field).join(",")}) IS DISTINCT FROM ROW(${fields.map((field) => "l." + field).join(",")}) AS changed,
      previous.status AS old_status,previous.priority AS old_priority,
      previous.next_follow_up_at AS old_follow_up_at,previous.follow_up_note AS old_follow_up_note
  ),activity AS (
    INSERT INTO inquiry_activity(lead_id,activity_type,actor,note,follow_up_at)
    SELECT id,'lead_updated','admin',CASE WHEN old_status<>status OR old_priority<>priority
      THEN 'Status: '||status||'; priority: '||priority ELSE 'Lead details updated' END,NULL::timestamptz FROM saved WHERE changed
    UNION ALL
    SELECT id,CASE WHEN old_follow_up_at IS NULL AND next_follow_up_at IS NOT NULL THEN 'follow_up_scheduled'
      WHEN old_follow_up_at IS NOT NULL AND next_follow_up_at IS NULL THEN 'follow_up_cleared' ELSE 'follow_up_updated' END,
      'admin','',next_follow_up_at FROM saved WHERE old_follow_up_at IS DISTINCT FROM next_follow_up_at OR old_follow_up_note<>follow_up_note
    RETURNING id
  ) SELECT * FROM saved`,
    [id, ...values(input), version],
  );
  if (!rows[0]) {
    const lead = await getLead(id);
    if ((input.status === "converted") !== !!lead.convertedAt)
      throw new HttpError(
        422,
        "Converted status is managed by Convert to Inquiry.",
        {
          status: lead.convertedAt
            ? "Keep Converted for this lead."
            : "Use Convert to Inquiry.",
        },
      );
    throw new HttpError(
      409,
      "This lead changed in another session. Reload before saving. Your edits are still here.",
    );
  }
  return detail(rows[0]);
}
export async function listLeads(
  filters: z.infer<typeof leadBrowseSchema>,
): Promise<LeadList> {
  const pattern = filters.search
    ? "%" + filters.search.replace(/[\\%_]/g, (value) => "\\" + value) + "%"
    : "";
  const where = `($1='all' OR status=$1) AND ($2='all' OR priority=$2)
    AND ($3='' OR company ILIKE $3 ESCAPE '\\' OR name ILIKE $3 ESCAPE '\\' OR email ILIKE $3 ESCAPE '\\'
      OR phone ILIKE $3 ESCAPE '\\' OR category ILIKE $3 ESCAPE '\\' OR location ILIKE $3 ESCAPE '\\')
    AND ($4='all' OR ($4='none' AND next_follow_up_at IS NULL) OR ($4='overdue' AND next_follow_up_at<clock_timestamp())
      OR ($4='upcoming' AND next_follow_up_at>=clock_timestamp()))
    AND ($5='all' OR ($5='has-email' AND email<>'') OR ($5='suppressed' AND ${blockedEmail})
      OR ($5='never' AND email<>'' AND ${emailDates} IS NULL AND ${replyDates} IS NULL)
      OR ($5='awaiting' AND ${emailDates} IS NOT NULL AND (${replyDates} IS NULL OR ${emailDates}>${replyDates}))
      OR ($5='replied' AND ${replyDates} IS NOT NULL AND (${emailDates} IS NULL OR ${replyDates}>=${emailDates})))`;
  const params = [
    filters.status,
    filters.priority,
    pattern,
    filters.followUp,
    filters.communication ?? "all",
  ];
  const [rows, count] = await Promise.all([
    query(
      selection +
        ` WHERE ${where} ORDER BY created_at DESC,id DESC LIMIT 25 OFFSET $6`,
      [...params, (filters.page - 1) * 25],
    ),
    query(`SELECT count(*) AS total FROM leads WHERE ${where}`, params),
  ]);
  return {
    items: rows.map(detail),
    total: Number(count[0].total),
    page: filters.page,
    pageSize: 25,
  };
}
export async function listLeadActivity(id: string): Promise<LeadActivity[]> {
  const rows = await query(
    `SELECT id,created_at,activity_type,actor,note,proposal_number,invoice_number,follow_up_at FROM inquiry_activity
    WHERE lead_id=$1 ORDER BY created_at DESC,id DESC`,
    [id],
  );
  return rows.map((row) => ({
    id: String(row.id),
    createdAt: iso(row.created_at)!,
    type: String(row.activity_type),
    actor: String(row.actor),
    note: String(row.note),
    proposalNumber:
      row.proposal_number == null ? null : String(row.proposal_number),
    invoiceNumber:
      row.invoice_number == null ? null : String(row.invoice_number),
    followUpAt: iso(row.follow_up_at),
  }));
}
export async function convertLead(
  id: string,
  version: string,
  input: InquiryInput,
): Promise<Lead> {
  const fingerprint = createHash("sha256")
    .update(JSON.stringify(input))
    .digest("hex");
  await query(
    `WITH previous AS MATERIALIZED(SELECT * FROM leads WHERE id=$1 FOR UPDATE),created AS (
    INSERT INTO inquiries(name,email,company,website,project_type,project_stage,project_summary,help_needed,budget_range,timeline,
      source,admin_notes,next_follow_up_at,follow_up_note,consent_at,submission_key,payload_fingerprint)
    SELECT $3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'lead-conversion',admin_notes,next_follow_up_at,follow_up_note,NULL,gen_random_uuid(),$13
    FROM previous WHERE converted_at IS NULL AND updated_at=$2::timestamptz RETURNING id
  ),saved AS (
    UPDATE leads l SET status='converted',converted_inquiry_id=created.id,converted_at=clock_timestamp(),
      updated_at=GREATEST(date_trunc('milliseconds',clock_timestamp()),l.updated_at+interval '1 millisecond')
    FROM created WHERE l.id=$1 RETURNING l.*
  ),inquiry_event AS (
    INSERT INTO inquiry_activity(inquiry_id,activity_type,actor) SELECT id,'inquiry_created','system' FROM created RETURNING id
  ),lead_event AS (
    INSERT INTO inquiry_activity(lead_id,activity_type,actor,note) SELECT id,'lead_converted','admin','Converted to an inquiry' FROM saved RETURNING id
  ) SELECT id FROM saved`,
    [
      id,
      version,
      input.name,
      input.email,
      input.company,
      input.website,
      input.projectType,
      input.projectStage,
      input.projectSummary,
      input.helpNeeded,
      input.budgetRange,
      input.timeline,
      fingerprint,
    ],
  );
  const lead = await getLead(id);
  if (!lead.convertedAt)
    throw new HttpError(409, "This lead changed. Reload it before converting.");
  return lead;
}
export async function deleteLead(id: string, version: string): Promise<void> {
  const lead = await getLead(id);
  if (lead.updatedAt !== version)
    throw new HttpError(409, "This lead changed. Reload before deleting.");
  if (
    (
      await query(
        "SELECT id FROM inquiry_messages WHERE lead_id=$1 AND status='sending' LIMIT 1",
        [id],
      )
    ).length
  )
    throw new HttpError(
      409,
      "An email is still sending. Refresh communication history before deleting this lead.",
    );
  // Use the existing cancellation/sync workflow before discarding provider references.
  const bookings = await query(
    "SELECT id,status,updated_at,calendar_sync_status,zoom_sync_status FROM bookings WHERE lead_id=$1",
    [id],
  );
  for (const booking of bookings) {
    if (booking.status === "scheduled")
      await changeAdminBooking({
        id: String(booking.id),
        action: "cancel",
        updatedAt: iso(booking.updated_at)!,
        confirmed: true,
      });
    else if (
      booking.status === "cancelled" &&
      [booking.calendar_sync_status, booking.zoom_sync_status].some(
        (status) => !["synced", "not_required"].includes(String(status)),
      )
    )
      await attemptBookingSync(String(booking.id));
  }
  try {
    const result = (
      await query("SELECT delete_lead($1,$2::timestamptz) AS deleted", [
        id,
        version,
      ])
    )[0];
    if (!result?.deleted)
      throw new HttpError(404, "This lead has already been deleted.");
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      ["P0001", "23503", "40001", "40P01"].includes(String(error.code))
    )
      throw new HttpError(
        409,
        "Deletion could not finish. Refresh the lead and check sending emails or meeting cancellation sync before retrying. No lead records were deleted.",
      );
    throw error;
  }
}
