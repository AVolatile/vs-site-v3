import type { Context } from '@netlify/functions';
import { z } from 'zod';
import { requireAdmin } from '../lib/authorize';
import { failure, HttpError, json, readJson, sameOrigin } from '../lib/http';
import { createProposalSchema, draftSchema, sendSchema } from '../../src/lib/proposals/contract';
import { fieldErrors } from '../../src/lib/inquiries/contract';
import {
  createProposal,
  getAdminProposal,
  getInquiryProposal,
  saveProposal,
  sendProposal,
} from '../lib/proposal-store';
export default async (request: Request, _context: Context): Promise<Response> => {
  try {
    await requireAdmin();
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const inquiryId = url.searchParams.get('inquiry');
    if (
      (id && !z.string().uuid().safeParse(id).success) ||
      (inquiryId && !z.string().uuid().safeParse(inquiryId).success)
    )
      throw new HttpError(400, 'Invalid proposal reference.');
    if (request.method === 'GET') {
      if (id) return json({ proposal: await getAdminProposal(id) });
      if (inquiryId) return json({ proposal: await getInquiryProposal(inquiryId) });
      throw new HttpError(400, 'Choose an inquiry or proposal.');
    }
    if (request.method === 'POST') {
      sameOrigin(request);
      const result = createProposalSchema.safeParse(await readJson(request));
      if (!result.success) throw new HttpError(422, 'Check the proposal fields.', fieldErrors(result.error));
      return json({ proposal: await createProposal(result.data.inquiryId, result.data.title) }, 201);
    }
    if (request.method === 'PATCH' && id) {
      sameOrigin(request);
      const body = await readJson(request, 128000);
      const sending = typeof body === 'object' && body !== null && 'action' in body && body.action === 'send';
      if (sending) {
        const result = sendSchema.safeParse(body);
        if (!result.success) throw new HttpError(422, 'Reload the saved draft before sending.');
        return json({ proposal: await sendProposal(id, result.data.updatedAt) });
      }
      const result = draftSchema.safeParse(body);
      if (!result.success) throw new HttpError(422, 'Check the proposal fields.', fieldErrors(result.error));
      return json({ proposal: await saveProposal(id, result.data) });
    }
    return new Response(null, {
      status: 405,
      headers: { Allow: 'GET, POST, PATCH', 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    return failure(error, 'proposal');
  }
};
