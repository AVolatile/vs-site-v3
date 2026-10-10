import { z } from "zod";
export const TEMPLATE_KEYS = [
  "personal",
  "thanks",
  "discovery",
  "proposal",
  "follow-up",
] as const;
const text = (max: number) =>
  z
    .string()
    .trim()
    .min(1, "Enter a message.")
    .max(max, `Use ${max} characters or fewer.`)
    .refine(
      (value) => !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value),
      "Remove unsupported control characters.",
    );
export const compositionSchema = z
  .object({
    to: z.string().trim().email("Use the inquiry contact email.").max(254),
    subject: text(200).refine(
      (value) => !/[\r\n]/.test(value),
      "Use a single-line subject.",
    ),
    message: text(20000),
    templateKey: z.enum(TEMPLATE_KEYS),
    includeProposal: z.boolean(),
    includeBooking: z.boolean().optional(),
    includeInvoice: z.boolean().optional(),
  })
  .strict();
export const sendEmailSchema = compositionSchema
  .extend({ action: z.literal("send"), requestKey: z.string().uuid() })
  .strict();
export const previewEmailSchema = compositionSchema
  .extend({ action: z.literal("preview") })
  .strict();
export const retryEmailSchema = z
  .object({ action: z.literal("retry"), messageId: z.string().uuid() })
  .strict();
export type Composition = z.infer<typeof compositionSchema>;
export type MessageStatus = "draft" | "sending" | "sent" | "failed";
export interface MessageSummary {
  id: string;
  createdAt: string;
  sentAt: string | null;
  to: string;
  from: string;
  subject: string;
  status: MessageStatus;
  templateKey: (typeof TEMPLATE_KEYS)[number];
  errorCode: string | null;
  canRetry: boolean;
}
export interface MessageDetail extends MessageSummary {
  bodyText: string;
  bodyHtml: string;
}
export interface EmailPreview {
  to: string;
  from: string;
  subject: string;
  bodyText: string;
  bodyHtml: string;
}
export interface MessageList {
  items: MessageSummary[];
  total: number;
  page: number;
  proposal: { number: string; url: string } | null;
  booking?: { url: string } | null;
  invoice?: {number:string;url:string}|null;
}
export const messageStatusText = (message: MessageSummary): string => {
  if (message.status === "sent") return "Sent — accepted by email provider";
  if (message.errorCode === "delivery_unconfirmed")
    return "Failed — send outcome unconfirmed";
  return message.status[0].toUpperCase() + message.status.slice(1);
};
export const messageFailureText = (message: MessageSummary): string => {
  if (message.status === "sent")
    return "Email sent. Accepted by the email provider; delivery is not confirmed.";
  if (message.status === "sending")
    return "Sending is still being confirmed. Refresh history before retrying; do not send a new copy.";
  if (message.errorCode === "delivery_unconfirmed")
    return "The provider outcome is unconfirmed. Retry the saved message with its original key; do not send a new copy.";
  return "Email was not sent. Check sender configuration, then retry the saved message. Your composition is preserved.";
};
