import { z } from "zod";
export const TEMPLATE_KEYS = [
  "personal",
  "thanks",
  "discovery",
  "proposal",
  "follow-up",
] as const;
const text = (max: number, required = "Enter a message.") =>
  z
    .string()
    .trim()
    .min(1, required)
    .max(max, `Use ${max} characters or fewer.`)
    .refine(
      (value) => !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value),
      "Remove unsupported control characters.",
    );
export const compositionSchema = z
  .object({
    to: z.string().trim().email("Use the saved contact email.").max(254),
    subject: text(200, "Enter a subject.").refine(
      (value) => !/[\r\n]/.test(value),
      "Use a single-line subject.",
    ),
    message: text(20000),
    templateKey: z.enum(TEMPLATE_KEYS),
    includeProposal: z.boolean(),
    format: z.enum(["branded", "quick"]).optional(),
    replyToMessageId: z.string().uuid().optional(),
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
  direction: "outbound" | "inbound";
  format: "branded" | "quick";
  threadId: string;
  receivedAt: string | null;
  internetMessageId: string | null;
  deliveryState: string | null;
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
  emailSuppressed?: boolean;
  mailbox?: { status: "connected" | "outbound-only"; message: string };
  items: MessageSummary[];
  total: number;
  page: number;
  proposal: { number: string; url: string } | null;
  booking?: { url: string } | null;
  invoice?: { number: string; url: string } | null;
}
export const messageHasFailure = (message: MessageSummary): boolean =>
  message.status === "failed" ||
  ["bounced", "complained", "suppressed", "failed"].includes(
    message.deliveryState ?? "",
  );
export const messageStatusText = (message: MessageSummary): string => {
  if (message.direction === "inbound") return "Received";
  if (message.deliveryState && message.deliveryState !== "sent")
    return "Provider: " + message.deliveryState.replaceAll("_", " ");
  if (message.status === "sent") return "Sent — accepted by email provider";
  if (message.errorCode === "delivery_unconfirmed")
    return "Failed — send outcome unconfirmed";
  return message.status[0].toUpperCase() + message.status.slice(1);
};
export const messageFailureText = (message: MessageSummary): string => {
  if (
    message.status === "sent" &&
    message.deliveryState &&
    message.deliveryState !== "sent"
  )
    return `Email accepted. Latest provider status: ${message.deliveryState.replaceAll("_", " ")}.${messageHasFailure(message) ? " Review this contact before sending again." : ""}`;
  if (message.status === "sent")
    return "Email sent. Accepted by the email provider; delivery is not confirmed.";
  if (message.status === "sending")
    return "Sending is still being confirmed. Refresh history before retrying; do not send a new copy.";
  if (message.errorCode === "delivery_unconfirmed")
    return "The provider outcome is unconfirmed. Retry the saved message with its original key; do not send a new copy.";
  return "Email was not sent. Check sender configuration, then retry the saved message. Your composition is preserved.";
};
