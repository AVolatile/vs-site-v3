import type { Context } from '@netlify/functions';
import { z } from 'zod';
import { STATUS_OPTIONS, updateSchema, fieldErrors } from '../../src/lib/inquiries/contract';
import { requireAdmin } from '../lib/authorize';
import { listInquiries, getInquiry, updateInquiry } from '../lib/inquiry-store';
import { json, readJson, sameOrigin, failure, HttpError } from '../lib/http';

export default async (request: Request, context: Context): Promise<Response> => {
  try {
    // Authentication/authorization precedes any database access or private response.
    await requireAdmin();
    const id = context.params.id ?? new URL(request.url).searchParams.get('id');
    if (id && !z.string().uuid().safeParse(id).success) throw new HttpError(400, 'Invalid inquiry reference.');
    if (request.method === 'GET') {
      if (id) return json({ inquiry: await getInquiry(id) });
      const url = new URL(request.url);
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
      const result = updateSchema.safeParse(await readJson(request));
      if (!result.success) throw new HttpError(422, 'Check the highlighted fields.', fieldErrors(result.error));
      return json({ inquiry: await updateInquiry(id, result.data.status, result.data.adminNotes, result.data.updatedAt) });
    }
    return new Response(null, { status: 405, headers: { Allow: id ? 'GET, PATCH' : 'GET', 'Cache-Control': 'no-store' } });
  } catch (error) { return failure(error); }
};
