import { Resend } from "resend";
import { z } from "zod";
import { HttpError } from "./http";
import { runtimeValue } from "./runtime-env";
export const runtimeEmailValue = runtimeValue;
export function emailConfiguration(requireKey = true) {
  const key = runtimeEmailValue("RESEND_API_KEY"),
    from = runtimeEmailValue("EMAIL_FROM"),
    replyTo = runtimeEmailValue("EMAIL_REPLY_TO");
  const mailbox = from.match(/^[^<>\r\n]*<([^<>]+)>$/)?.[1] ?? from;
  if (
    !from ||
    /[\r\n]/.test(from) ||
    from.length > 320 ||
    !z.string().email().safeParse(mailbox).success
  )
    throw new HttpError(
      503,
      "Configure a verified EMAIL_FROM sender in Netlify before sending email.",
    );
  if (!z.string().email().safeParse(replyTo).success)
    throw new HttpError(
      503,
      "Configure EMAIL_REPLY_TO in Netlify before sending email.",
    );
  if (requireKey && !key)
    throw new HttpError(
      503,
      "Configure RESEND_API_KEY in Netlify before sending email.",
    );
  return { key, from, replyTo };
}
export class EmailProviderError extends Error {
  constructor(public code: "provider_rejected" | "delivery_unconfirmed") {
    super("Email provider did not confirm acceptance.");
  }
}
export interface OutboundEmail {
  id: string;
  from: string;
  replyTo: string;
  to: string;
  subject: string;
  html: string;
  text: string;
}
// Resend's development logger includes raw provider errors. Keep payloads/errors out of logs.
export async function sendInquiryEmail(mail: OutboundEmail): Promise<string> {
  const { key } = emailConfiguration();
  try {
    const client = new Resend(key);
    Reflect.set(client, "logError", () => {});
    const { data, error } = await client.emails.send(
      {
        from: mail.from,
        to: [mail.to],
        replyTo: mail.replyTo,
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
      },
      {
        idempotencyKey: "crm-message/" + mail.id,
        signal: AbortSignal.timeout(15000),
      },
    );
    if (error)
      throw new EmailProviderError(
        error.statusCode &&
          error.statusCode >= 400 &&
          error.statusCode < 500 &&
          error.statusCode !== 409
          ? "provider_rejected"
          : "delivery_unconfirmed",
      );
    if (!data?.id) throw new EmailProviderError("delivery_unconfirmed");
    return data.id;
  } catch (error) {
    if (error instanceof EmailProviderError) throw error;
    throw new EmailProviderError("delivery_unconfirmed");
  }
}
