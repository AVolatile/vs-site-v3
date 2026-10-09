import { z } from 'zod';
export const PROPOSAL_STATUSES = ['draft', 'sent', 'accepted', 'declined', 'expired'] as const;
export type ProposalStatus = (typeof PROPOSAL_STATUSES)[number];
export const tokenSchema = z.string().regex(/^[A-Za-z0-9_-]{43}$/);
const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Use ${max} characters or fewer.`)
    .refine(
      (value) => !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value),
      'Remove unsupported control characters.',
    )
    .transform((value) => value.replace(/\r\n?/g, '\n'));
export const validDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Choose a valid date.')
  .refine((value) => {
    const date = new Date(value + 'T00:00:00Z');
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }, 'Choose a valid date.');
export const itemSchema = z
  .object({
    description: text(500),
    quantity: z.number().int().min(1).max(10000),
    unitPriceCents: z.number().int().min(0).max(100000000),
  })
  .strict();
export const createProposalSchema = z
  .object({
    inquiryId: z.string().uuid(),
    title: text(160).pipe(z.string().min(1, 'Enter a proposal title.')),
  })
  .strict();
export const draftSchema = z
  .object({
    action: z.literal('save'),
    title: text(160).pipe(z.string().min(1, 'Enter a proposal title.')),
    summary: text(4000),
    validUntil: validDate.nullable(),
    items: z.array(itemSchema).max(25, 'Use 25 items or fewer.'),
    discountCents: z.number().int().min(0).max(1000000000),
    taxRateBasisPoints: z.number().int().min(0).max(10000),
    internalNotes: text(4000),
    clientNotes: text(4000),
    updatedAt: z.string().datetime(),
  })
  .strict();
export const sendSchema = z.object({ action: z.literal('send'), updatedAt: z.string().datetime() }).strict();
export const responseSchema = z
  .object({ action: z.enum(['accept', 'decline']), confirmed: z.literal(true) })
  .strict();
export type DraftInput = z.infer<typeof draftSchema>;
export type ProposalItem = z.infer<typeof itemSchema> & { lineTotalCents: number };
export interface ProposalTotals {
  subtotalCents: number;
  discountCents: number;
  taxRateBasisPoints: number;
  taxCents: number;
  totalCents: number;
}
export interface PublicProposal extends ProposalTotals {
  number: string;
  status: ProposalStatus;
  title: string;
  summary: string;
  currency: 'USD';
  validUntil: string | null;
  date: string;
  acceptedAt: string | null;
  declinedAt: string | null;
  clientNotes: string;
  preparedFor: { name: string; company: string; email: string };
  items: ProposalItem[];
}
export interface AdminProposal extends PublicProposal {
  id: string;
  inquiryId: string;
  createdAt: string;
  updatedAt: string;
  internalNotes: string;
  clientUrl: string | null;
}
/** Integer cents with exact half-up tax on the discounted subtotal. */
export function calculateTotals(
  items: z.infer<typeof itemSchema>[],
  discountCents: number,
  taxRateBasisPoints: number,
): ProposalTotals {
  let subtotal = 0n;
  for (const item of items) {
    const line = BigInt(item.quantity) * BigInt(item.unitPriceCents);
    if (line > 1000000000n) throw new Error('An item total exceeds the supported limit.');
    subtotal += line;
  }
  if (subtotal > 1000000000n) throw new Error('The subtotal exceeds the supported limit.');
  if (BigInt(discountCents) > subtotal) throw new Error('Discount cannot exceed the subtotal.');
  const tax = ((subtotal - BigInt(discountCents)) * BigInt(taxRateBasisPoints) + 5000n) / 10000n;
  return {
    subtotalCents: Number(subtotal),
    discountCents,
    taxRateBasisPoints,
    taxCents: Number(tax),
    totalCents: Number(subtotal - BigInt(discountCents) + tax),
  };
}
export const money = (cents: number): string =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
export function decimalUnits(value: string): number {
  if (!/^\d{1,9}(?:\.\d{1,2})?$/.test(value.trim()))
    throw new Error('Enter a non-negative amount with up to two decimal places.');
  const [whole, fraction = ''] = value.trim().split('.');
  return Number(BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0')));
}
export const decimalValue = (units: number): string =>
  `${Math.floor(units / 100)}.${String(units % 100).padStart(2, '0')}`;
export const proposalAdminUrl = (id: string, back?: string): string =>
  '/admin/proposals/?proposal=' + encodeURIComponent(id) + (back ? '&back=' + encodeURIComponent(back) : '');
export function safeInquiryBack(value: string | null, inquiryId: string): string {
  try {
    const url = new URL(value ?? '', 'https://internal.invalid');
    if (
      url.origin === 'https://internal.invalid' &&
      url.pathname === '/admin/' &&
      url.searchParams.get('inquiry') === inquiryId
    )
      return url.pathname + url.search;
  } catch {}
  return '/admin/?inquiry=' + encodeURIComponent(inquiryId);
}
