import { z } from "zod";
import { getInquiry } from "./inquiry-store";
import { query } from "./database";
import { HttpError } from "./http";

// Existing callers keep passing an inquiry UUID. Leads opt in explicitly.
export type CrmOwner = string | { leadId: string };
export const ownerId = (owner: CrmOwner) =>
  typeof owner === "string" ? owner : owner.leadId;
export const ownerColumn = (owner: CrmOwner) =>
  typeof owner === "string" ? "inquiry_id" : "lead_id";
export const ownerFromRow = (row: Record<string, unknown>): CrmOwner =>
  row.lead_id ? { leadId: String(row.lead_id) } : String(row.inquiry_id);
export function ownerFromParams(params: URLSearchParams): CrmOwner | null {
  const inquiry = params.get("inquiry"),
    lead = params.get("lead");
  if (
    (inquiry !== null && lead !== null) ||
    [inquiry, lead].some(
      (id) => id !== null && !z.string().uuid().safeParse(id).success,
    )
  )
    throw new HttpError(400, "Choose one valid inquiry or lead.");
  return lead ? { leadId: lead } : inquiry;
}
export async function getOwnerContact(owner: CrmOwner) {
  if (typeof owner === "string") return getInquiry(owner);
  const row = (
    await query("SELECT id,name,company,email FROM leads WHERE id=$1", [
      owner.leadId,
    ])
  )[0];
  if (!row) throw new HttpError(404, "This lead could not be found.");
  return {
    id: String(row.id),
    name: String(row.name),
    company: String(row.company),
    email: String(row.email),
    projectType: "",
  };
}
export async function requireOwnerEmail(owner: CrmOwner) {
  const contact = await getOwnerContact(owner);
  if (!z.string().email().safeParse(contact.email).success)
    throw new HttpError(
      422,
      "Add a valid contact email to this lead before creating a booking link or sending email.",
      { email: "Add a valid contact email." },
    );
  return contact;
}
