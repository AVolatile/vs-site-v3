import { z } from 'zod';
import { inquiryContent, STATUS_OPTIONS, FOLLOW_UP_OPTIONS } from './contract';
import { localDayBounds } from './follow-up';

const option = (values: readonly { value: string }[]) => z.enum(['all', ...values.map(value => value.value)] as [string, ...string[]]).default('all');
export const browseSchema = z.object({
  search: z.string().trim().max(160, 'Use 160 characters or fewer for search.').refine(value => !/[\u0000-\u001f\u007f]/.test(value), 'Remove unsupported control characters.').default(''),
  status: z.enum(['all', ...STATUS_OPTIONS]).default('all'),
  projectType: option(inquiryContent.projectTypes), budget: option(inquiryContent.budgets), timeline: option(inquiryContent.timelines),
  followUp: z.enum(FOLLOW_UP_OPTIONS.map(value => value.value)).default('all'),
  sort: z.enum(['newest', 'oldest', 'status']).default('newest'),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  dayStart: z.string().datetime().optional(), dayEnd: z.string().datetime().optional(),
}).superRefine((value, context) => {
  if (Boolean(value.dayStart) !== Boolean(value.dayEnd) || value.dayStart && value.dayEnd &&
      (Date.parse(value.dayEnd) <= Date.parse(value.dayStart) || Date.parse(value.dayEnd) - Date.parse(value.dayStart) > 26 * 60 * 60 * 1000)) {
    context.addIssue({ code: 'custom', path: ['dayStart'], message: 'Choose a valid local calendar day.' });
  }
});
export type AdminBrowse = z.infer<typeof browseSchema>;
export const BROWSE_KEYS = ['search', 'status', 'projectType', 'budget', 'timeline', 'followUp', 'sort', 'page'] as const;
export const browseDefaults = (): AdminBrowse => browseSchema.parse({});
export function browseFromUrl(url: URL): AdminBrowse {
  const result = browseSchema.safeParse(Object.fromEntries(BROWSE_KEYS.filter(key => url.searchParams.has(key)).map(key => [key, url.searchParams.get(key)])));
  return result.success ? result.data : browseDefaults();
}
export function hasBrowseFilters(state: AdminBrowse): boolean {
  return Boolean(state.search || ['status', 'projectType', 'budget', 'timeline', 'followUp'].some(key => state[key as keyof AdminBrowse] !== 'all'));
}
export function browseApiQuery(state: AdminBrowse): URLSearchParams {
  const query = new URLSearchParams();
  BROWSE_KEYS.forEach(key => query.set(key, String(state[key])));
  const day = localDayBounds(); query.set('dayStart', day.dayStart); query.set('dayEnd', day.dayEnd);
  return query;
}
