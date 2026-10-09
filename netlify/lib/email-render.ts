import company from "../../src/data/global/company.json";
import {
  compositionSchema,
  type Composition,
  type EmailPreview,
} from "../../src/lib/communications/contract";
import { personalize } from "../../src/lib/communications/templates";
import {
  inquiryContent,
  optionLabel,
  type Inquiry,
} from "../../src/lib/inquiries/contract";
import { HttpError } from "./http";
import { publicUrl } from "./public-url";
export const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ]!,
  );
export const publicEmailUrl = (path: string) => publicUrl(path);
// A typed CTA keeps future booking integration separate from text; no booking link is emitted now.
export interface EmailCta {
  label: string;
  url: string;
}
export function renderEmail(
  input: Composition,
  inquiry: Inquiry,
  from: string,
  replyTo: string,
  proposal: { number: string; url: string } | null,
  booking: { url: string } | null = null,
): EmailPreview {
  if (input.to.toLowerCase() !== inquiry.email.toLowerCase())
    throw new HttpError(
      422,
      "Email can only be sent to this inquiry’s contact.",
      { to: "Use the inquiry contact email." },
    );
  if (input.includeProposal && !proposal)
    throw new HttpError(
      422,
      "A current sent proposal is required for this CTA.",
    );
  if (input.includeBooking && !booking)
    throw new HttpError(
      422,
      "Create a booking link before including Schedule a Call.",
    );
  if (input.includeBooking && input.includeProposal)
    throw new HttpError(422, "Choose one email button.");
  const firstName = inquiry.name.trim().split(/\s+/)[0] || "there";
  const variables = {
    firstName,
    company: inquiry.company || "your business",
    projectType: optionLabel(inquiryContent.projectTypes, inquiry.projectType),
    proposalNumber: proposal?.number || "",
    proposalUrl: proposal?.url || "",
    bookingUrl: booking?.url || "",
  };
  let subject: string, message: string;
  try {
    subject = personalize(input.subject, variables);
    message = personalize(input.message, variables);
  } catch (error) {
    throw new HttpError(
      422,
      error instanceof Error
        ? error.message
        : "Check personalization variables.",
    );
  }
  const expanded = compositionSchema.safeParse({
    to: input.to,
    subject,
    message,
    templateKey: input.templateKey,
    includeProposal: input.includeProposal,
    ...(input.includeBooking ? { includeBooking: true } : {}),
  });
  if (!expanded.success)
    throw new HttpError(
      422,
      "Expanded subject or message is too long. Shorten the composition.",
    );
  const cta: EmailCta | null =
    input.includeBooking && booking
      ? { label: "Schedule a Call", url: booking.url }
      : input.includeProposal && proposal
        ? { label: "View Proposal", url: proposal.url }
        : null;
  const website = publicEmailUrl("/"),
    logo = publicUrl(company.branding.logoImage, true);
  const content = message
    .split(/\n\s*\n/)
    .map(
      (paragraph) =>
        `<p style="margin:0 0 20px;line-height:1.65;overflow-wrap:anywhere;word-break:break-word;">${escapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`,
    )
    .join("");
  const bodyHtml = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(subject)}</title></head><body style="margin:0;background:#f4f0e9;color:#161616;font-family:Arial,Helvetica,sans-serif;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f0e9;"><tr><td align="center" style="padding:32px 12px;"><table role="presentation" width="600" cellspacing="0" cellpadding="0" style="width:100%;max-width:600px;background:#fffdf9;border:1px solid #ddd4c9;"><tr><td style="padding:32px 24px;border-bottom:3px solid #b98b6e;"><img src="${escapeHtml(logo)}" width="240" height="48" alt="Volatile Solutions" style="display:block;width:240px;max-width:100%;height:auto;border:0;"></td></tr><tr><td style="padding:32px 24px;font-size:16px;line-height:1.65;word-break:break-word;"><p style="margin:0 0 24px;">Hi ${escapeHtml(firstName)},</p>${content}${cta ? `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:24px 0;"><tr><td bgcolor="#161616" style="border-radius:24px;"><a href="${escapeHtml(cta.url)}" style="display:inline-block;padding:14px 24px;color:#fffdf9;font-size:14px;font-weight:bold;text-decoration:none;">${escapeHtml(cta.label)}</a></td></tr></table>` : ""}<p style="margin:24px 0 0;">Anthony Volatile<br><strong>Volatile Solutions</strong></p></td></tr><tr><td style="padding:24px;border-top:1px solid #ddd4c9;font-size:13px;line-height:1.7;word-break:break-word;"><a href="${escapeHtml(website)}" style="color:#68635d;">${escapeHtml(new URL(website).hostname)}</a><br><a href="mailto:${escapeHtml(replyTo)}" style="color:#68635d;">${escapeHtml(replyTo)}</a></td></tr></table></td></tr></table></body></html>`;
  return {
    to: inquiry.email,
    from,
    subject,
    bodyHtml,
    bodyText: `Hi ${firstName},\n\n${message}${cta ? `\n\n${cta.label}: ${cta.url}` : ""}\n\nAnthony Volatile\nVolatile Solutions\n${website}\n${replyTo}`,
  };
}
