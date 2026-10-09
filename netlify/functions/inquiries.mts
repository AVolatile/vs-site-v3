import type { Config } from '@netlify/functions';
import { submissionSchema, inquirySchema, fieldErrors, MIN_INTERACTION_MS } from '../../src/lib/inquiries/contract';
import { createInquiry } from '../lib/inquiry-store';
import { json, readJson, sameOrigin, failure, HttpError } from '../lib/http';

export default async (request: Request): Promise<Response> => {
  try {
    if (request.method !== 'POST') return new Response(null, { status: 405, headers: { Allow: 'POST', 'Cache-Control': 'no-store' } });
    sameOrigin(request);
    const result = submissionSchema.safeParse(await readJson(request));
    if (!result.success) throw new HttpError(422, 'Check the highlighted fields.', fieldErrors(result.error));
    const elapsed = Date.now() - result.data.startedAt;
    if (result.data.honeypot || elapsed < MIN_INTERACTION_MS || elapsed > 7 * 24 * 60 * 60 * 1000) {
      throw new HttpError(422, 'This submission could not be accepted. Please review your details and try again.');
    }
    const reference = await createInquiry(inquirySchema.parse(result.data), result.data.submissionKey);
    return json({ received: true, reference }, 201);
  } catch (error) { return failure(error); }
};
export const config: Config = {
  rateLimit: { action: 'rate_limit', aggregateBy: 'ip', windowSize: 60, windowLimit: 8 },
};
