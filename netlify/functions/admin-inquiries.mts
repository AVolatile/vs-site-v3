import type { Context } from '@netlify/functions';
import { z } from 'zod';
import { updateSchema, moveSchema, followUpSchema, fieldErrors } from '../../src/lib/inquiries/contract';
import { browseSchema } from '../../src/lib/inquiries/admin-browse';
import { requireAdmin } from '../lib/authorize';
import { listInquiries, getInquiry, updateInquiry, updateFollowUp, listInquiryActivity, getInquiryPipeline } from '../lib/inquiry-store';
import { json, readJson, sameOrigin, failure, HttpError } from '../lib/http';

export default async (request: Request, context: Context): Promise<Response> => {
  try {
    // Authentication/authorization precedes any database access or private response.
    await requireAdmin();
    const id = context.params.id ?? new URL(request.url).searchParams.get('id');
    if (id && !z.string().uuid().safeParse(id).success) throw new HttpError(400, 'Invalid inquiry reference.');
    if (request.method === 'GET') {
      if (id) {
        const [inquiry, activity] = await Promise.all([getInquiry(id), listInquiryActivity(id)]);
        return json({ inquiry, activity });
      }
      const url = new URL(request.url);
      const view = url.searchParams.get('view') ?? 'list';
      if (!['list', 'pipeline'].includes(view)) throw new HttpError(400, 'Choose a valid inquiry view.');
      const result = browseSchema.safeParse(Object.fromEntries(url.searchParams));
      if (!result.success) throw new HttpError(400, 'Choose valid search and filter values.', fieldErrors(result.error));
      const filters = result.data;
      if (view === 'pipeline') return json(await getInquiryPipeline(filters));
      return json(await listInquiries(filters.status, filters.sort, filters.page, filters));
    }
    if (request.method === 'PATCH' && id) {
      sameOrigin(request);
      const body = await readJson(request);
      if (typeof body === 'object' && body !== null && 'action' in body && body.action === 'follow-up') {
        const result = followUpSchema.safeParse(body);
        if (!result.success) throw new HttpError(422, 'Check the highlighted fields.', fieldErrors(result.error));
        return json({ inquiry: await updateFollowUp(id, result.data.nextFollowUpAt, result.data.followUpNote, result.data.updatedAt) });
      }
      const moving = typeof body === 'object' && body !== null && 'action' in body && body.action === 'move';
      const result = moving ? moveSchema.safeParse(body) : updateSchema.safeParse(body);
      if (!result.success) throw new HttpError(422, 'Check the highlighted fields.', fieldErrors(result.error));
      const notes = 'adminNotes' in result.data ? result.data.adminNotes : undefined;
      return json({ inquiry: await updateInquiry(id, result.data.status, notes, result.data.updatedAt) });
    }
    return new Response(null, { status: 405, headers: { Allow: id ? 'GET, PATCH' : 'GET', 'Cache-Control': 'no-store' } });
  } catch (error) { return failure(error); }
};
