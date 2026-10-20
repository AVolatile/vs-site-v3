import { z } from "zod";
import { inquirySchema } from "@/lib/inquiries/contract";

export const LEAD_STATUSES = [
  "saved",
  "researching",
  "ready-to-contact",
  "contacted",
  "follow-up",
  "interested",
  "not-interested",
  "converted",
] as const;
export const LEAD_PRIORITIES = ["low", "medium", "high"] as const;
export const leadLabel = (value: string) =>
  value
    .split("-")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Use ${max} characters or fewer.`)
    .refine(
      (value) => !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value),
      "Remove unsupported control characters.",
    );
export const leadSchema = z
  .object({
    company: text(160).pipe(
      z.string().min(1, "Enter the business or lead name."),
    ),
    name: text(120).default(""),
    email: z
      .union([
        z.literal(""),
        z.string().trim().max(254).email("Enter a valid email address."),
      ])
      .transform((value) => value.toLowerCase())
      .default(""),
    phone: text(40).default(""),
    website: inquirySchema.shape.website.default(""),
    location: text(240).default(""),
    category: text(120).default(""),
    source: text(240).default(""),
    status: z.enum(LEAD_STATUSES).default("saved"),
    priority: z.enum(LEAD_PRIORITIES).default("medium"),
    adminNotes: text(10000).default(""),
    lastContactAt: z.string().datetime().nullable().default(null),
    nextFollowUpAt: z.string().datetime().nullable().default(null),
    followUpNote: text(2000).default(""),
  })
  .strict();
export const leadUpdateSchema = leadSchema
  .extend({ updatedAt: z.string().datetime() })
  .strict();
export const leadVersionSchema = z
  .object({ updatedAt: z.string().datetime() })
  .strict();
export const convertLeadSchema = z
  .object({
    action: z.literal("convert"),
    updatedAt: z.string().datetime(),
    inquiry: inquirySchema.strict(),
  })
  .strict();
export const leadBrowseSchema = z.object({
  search: text(160).default(""),
  status: z.enum(["all", ...LEAD_STATUSES]).default("all"),
  priority: z.enum(["all", ...LEAD_PRIORITIES]).default("all"),
  followUp: z.enum(["all", "overdue", "upcoming", "none"]).default("all"),
  page: z.coerce.number().int().min(1).max(10000).default(1),
});
export type LeadInput = z.infer<typeof leadSchema>;
export interface Lead extends LeadInput {
  id: string;
  createdAt: string;
  updatedAt: string;
  convertedInquiryId: string | null;
  convertedAt: string | null;
}
export interface LeadActivity {
  id: string;
  createdAt: string;
  type: string;
  actor: string;
  note: string;
  proposalNumber: string | null;
  invoiceNumber: string | null;
  followUpAt: string | null;
}
export interface LeadList {
  items: Lead[];
  total: number;
  page: number;
  pageSize: number;
}
