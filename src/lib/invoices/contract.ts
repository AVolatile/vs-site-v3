import { z } from "zod";
import {
  itemSchema,
  validDate,
  type ProposalItem,
  type ProposalTotals,
} from "@/lib/proposals/contract";
export {
  calculateTotals,
  money,
  decimalUnits,
  decimalValue,
  safeInquiryBack,
} from "@/lib/proposals/contract";
export const tokenSchema = z.string().regex(/^[A-Za-z0-9_-]{43}$/);
const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Use ${max} characters or fewer.`)
    .refine(
      (v) => !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(v),
      "Remove unsupported control characters.",
    )
    .transform((v) => v.replace(/\r\n?/g, "\n"));
const address = (max: number) => text(max).nullable();
export const billingSchema = z
  .object({
    line1: address(200),
    line2: address(200),
    city: address(120),
    region: address(120),
    postalCode: address(40),
    country: address(100),
  })
  .strict();
export const createInvoiceSchema = z
  .object({ proposalId: z.string().uuid() })
  .strict();
export const draftSchema = z
  .object({
    action: z.literal("save"),
    title: text(160).pipe(z.string().min(1, "Enter an invoice title.")),
    issueDate: validDate,
    dueDate: validDate.nullable(),
    clientName: text(120).pipe(z.string().min(1, "Enter the client name.")),
    clientCompany: text(160),
    clientEmail: z
      .string()
      .trim()
      .email("Enter a valid client email.")
      .max(254),
    billing: billingSchema,
    items: z.array(itemSchema).max(25, "Use 25 items or fewer."),
    discountCents: z.number().int().min(0).max(1000000000),
    taxRateBasisPoints: z.number().int().min(0).max(10000),
    notes: text(4000),
    terms: text(4000),
    updatedAt: z.string().datetime(),
  })
  .strict()
  .superRefine((v, c) => {
    if (v.dueDate && v.dueDate < v.issueDate)
      c.addIssue({
        code: "custom",
        path: ["dueDate"],
        message: "Due date cannot be before the issue date.",
      });
  });
export const actionSchema = z
  .object({
    action: z.enum(["send", "mark-paid", "void"]),
    updatedAt: z.string().datetime(),
    confirmed: z.literal(true),
  })
  .strict();
export type DraftInput = z.infer<typeof draftSchema>;
export type InvoiceStatus = "draft" | "sent" | "paid" | "void";
export type InvoiceDisplayStatus = InvoiceStatus | "viewed" | "overdue";
export interface PublicInvoice extends ProposalTotals {
  number: string;
  status: InvoiceDisplayStatus;
  title: string;
  currency: "USD";
  issueDate: string;
  dueDate: string | null;
  clientName: string;
  clientCompany: string;
  clientEmail: string;
  billing: z.infer<typeof billingSchema>;
  sender: { name: string; email: string; phone: string; website: string };
  items: ProposalItem[];
  notes: string;
  terms: string;
  paidAt: string | null;
  paymentStatus: string;
}
export interface AdminInvoice extends PublicInvoice {
  id: string;
  inquiryId: string;
  proposalId: string;
  persistedStatus: InvoiceStatus;
  businessTimezone: string;
  createdAt: string;
  updatedAt: string;
  sentAt: string | null;
  firstViewedAt: string | null;
  lastViewedAt: string | null;
  voidedAt: string | null;
  publicUrl: string | null;
}
export function businessDate(zone: string, now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const value = (name: string) => parts.find((p) => p.type === name)!.value;
  return value("year") + "-" + value("month") + "-" + value("day");
}
export function displayStatus(
  status: InvoiceStatus,
  due: string | null,
  viewed: string | null,
  zone: string,
  now = new Date(),
): InvoiceDisplayStatus {
  if (status !== "sent") return status;
  if (due && due < businessDate(zone, now)) return "overdue";
  return viewed ? "viewed" : "sent";
}
export const invoiceAdminUrl = (id: string, back?: string) =>
  "/admin/invoices/?invoice=" +
  encodeURIComponent(id) +
  (back ? "&back=" + encodeURIComponent(back) : "");
