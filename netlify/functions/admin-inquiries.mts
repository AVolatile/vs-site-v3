import type { Context } from '@netlify/functions';
import { z } from 'zod';
import { STATUS_OPTIONS, updateSchema, moveSchema, fieldErrors } from '../../src/lib/inquiries/contract';
import { requireAdmin } from '../lib/authorize';
import { listInquiries, getInquiry, updateInquiry, listInquiryActivity, getInquiryPipeline } from '../lib/inquiry-store';
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
      if (url.searchParams.get('view') === 'pipeline') return json(await getInquiryPipeline());
      if (url.searchParams.has('view') && url.searchParams.get('view') !== 'list') throw new HttpError(400, 'Choose a valid inquiry view.');
      const status = url.searchParams.get('status') ?? 'all';
      const sort = url.searchParams.get('sort') ?? 'newest';
      const page = Number(url.searchParams.get('page') ?? '1');
      if ((status !== 'all' && !STATUS_OPTIONS.includes(status as typeof STATUS_OPTIONS[number])) || !['newest','oldest','status'].includes(sort) || !Number.isInteger(page) || page < 1 || page > 10_000) {
        throw new HttpError(400, 'Choose a valid status, sort order and page.');
      }
      return json(await listInquiries(status, sort, page));
    }
    if (request.method === 'PATCH' && id) {
      sameOrigin(request);
      const body = await readJson(request);
      const moving = typeof body === 'object' && body !== null && 'action' in body && body.action === 'move';
      const result = moving ? moveSchema.safeParse(body) : updateSchema.safeParse(body);
      if (!result.success) throw new HttpError(422, 'Check the highlighted fields.', fieldErrors(result.error));
      const notes = 'adminNotes' in result.data ? result.data.adminNotes : undefined;
      return json({ inquiry: await updateInquiry(id, result.data.status, notes, result.data.updatedAt) });
    }
    return new Response(null, { status: 405, headers: { Allow: id ? 'GET, PATCH' : 'GET', 'Cache-Control': 'no-store' } });
  } catch (error) { return failure(error); }
};
