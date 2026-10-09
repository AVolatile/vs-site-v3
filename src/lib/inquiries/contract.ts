import { z } from 'zod';
import content from '@data/inquiry.json';

export { content as inquiryContent };
export const STATUS_OPTIONS = ['new', 'reviewing', 'contacted', 'qualified', 'proposal', 'won', 'lost', 'archived'] as const;
export const MAX_BODY_BYTES = 16_384;
export const MIN_INTERACTION_MS = 3_000;
const choice = (options: { value: string }[], message: string) => z.enum(options.map(option => option.value) as [string, ...string[]], { message });
const text = (max: number) => z.string().trim().max(max, `Use ${max} characters or fewer.`)
  .refine(value => !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value), 'Remove unsupported control characters.')
  .transform(value => value.replace(/\r\n?/g, '\n'));

export const inquirySchema = z.object({
  projectType: choice(content.projectTypes, 'Choose a project type.'),
  name: text(120).pipe(z.string().min(1, 'Enter your name.')),
  email: text(254).pipe(z.string().email('Enter a valid email address.')).transform(value => value.toLowerCase()),
  company: text(160),
  website: text(2048).transform(value => value && !/^[a-z][a-z\d+.-]*:/i.test(value) ? `https://${value}` : value)
    .pipe(z.string().max(2048, 'Use 2048 characters or fewer for the complete website address.'))
    .refine(value => {
      if (!value) return true;
      try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) && Boolean(url.hostname.includes('.')) && !url.username && !url.password; }
      catch { return false; }
    }, 'Enter a valid website address, or leave this blank.'),
  projectStage: choice(content.projectStages, 'Choose a project stage.'),
  projectSummary: text(4000).pipe(z.string().min(10, 'Describe your project in at least 10 characters.')),
  helpNeeded: text(2000),
  budgetRange: choice(content.budgets, 'Choose a budget range, or select Not sure yet.'),
  timeline: choice(content.timelines, 'Choose a timeline, or select Flexible / Not sure.'),
});
export const submissionSchema = inquirySchema.extend({
  consent: z.literal(true, { message: 'Please agree to storing your inquiry and being contacted.' }),
  submissionKey: z.string().uuid(),
  startedAt: z.number().int().positive(),
  honeypot: z.string().max(200),
}).strict();
export const updateSchema = z.object({
  status: z.enum(STATUS_OPTIONS),
  adminNotes: text(10_000),
  updatedAt: z.string().datetime(),
}).strict();
export const STEP_FIELDS = [
  ['projectType'], ['name', 'email', 'company', 'website'],
  ['projectSummary', 'helpNeeded', 'projectStage'], ['budgetRange', 'timeline'],
] as const;
export function fieldErrors(error: z.ZodError): Record<string, string> {
  return Object.fromEntries(error.issues.map(issue => [String(issue.path[0] ?? 'form'), issue.message]));
}
export function optionLabel(options: { value: string; label: string }[], value: string): string {
  return options.find(option => option.value === value)?.label ?? value;
}
export type InquiryInput = z.infer<typeof inquirySchema>;
export type InquiryStatus = typeof STATUS_OPTIONS[number];
export interface Inquiry extends InquiryInput {
  id: string; createdAt: string; updatedAt: string; consentAt: string;
  status: InquiryStatus; source: string; adminNotes: string;
}
export type InquirySummary = Pick<Inquiry, 'id' | 'name' | 'company' | 'projectType' | 'budgetRange' | 'timeline' | 'status' | 'createdAt'>;
export interface InquiryList {
  items: InquirySummary[]; page: number; pageSize: number; total: number;
  metrics: { total: number; new: number; active: number; won: number };
}
