import type { Config, Context } from '@netlify/functions';
import { tokenSchema, responseSchema } from '../../src/lib/proposals/contract';
import { getPublicProposal, respondToProposal } from '../lib/proposal-store';
import { failure, HttpError, json, readJson, sameOrigin } from '../lib/http';
export default async (request: Request, _context: Context): Promise<Response> => {
  try {
    const token = tokenSchema.safeParse(new URL(request.url).searchParams.get('token'));
    if (!token.success) throw new HttpError(404, 'This proposal is unavailable.');
    if (request.method === 'GET') return json({ proposal: await getPublicProposal(token.data) });
    if (request.method === 'POST') {
      sameOrigin(request);
      const result = responseSchema.safeParse(await readJson(request));
      if (!result.success) throw new HttpError(422, 'Confirm your proposal response before continuing.');
      return json({ proposal: await respondToProposal(token.data, result.data.action) });
    }
    return new Response(null, { status: 405, headers: { Allow: 'GET, POST', 'Cache-Control': 'no-store' } });
  } catch (error) {
    return failure(error, 'proposal');
  }
};
export const config: Config = {
  rateLimit: { action: 'rate_limit', aggregateBy: ['ip', 'domain'], windowSize: 60, windowLimit: 120 },
};
