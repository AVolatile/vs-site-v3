import { MAX_BODY_BYTES } from '../../src/lib/inquiries/contract';

export class HttpError extends Error {
  constructor(public status: number, message: string, public fields?: Record<string, string>) { super(message); }
}
export function json(value: unknown, status = 200): Response {
  return Response.json(value, { status, headers: {
    'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer', 'Vary': 'Cookie',
  } });
}
export function sameOrigin(request: Request): void {
  if (request.headers.get('origin') !== new URL(request.url).origin) throw new HttpError(403, 'This request could not be accepted. Refresh this page and try again.');
}
export async function readJson(request: Request): Promise<unknown> {
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) throw new HttpError(415, 'Send this request as JSON.');
  if (Number(request.headers.get('content-length')) > MAX_BODY_BYTES) throw new HttpError(413, 'This inquiry is too large. Please shorten the details.');
  if (!request.body) throw new HttpError(400, 'The request is empty.');
  const reader = request.body.getReader(); const parts: Uint8Array[] = []; let length = 0;
  while (true) {
    const { done, value } = await reader.read(); if (done) break;
    length += value.byteLength;
    if (length > MAX_BODY_BYTES) { await reader.cancel(); throw new HttpError(413, 'This inquiry is too large. Please shorten the details.'); }
    parts.push(value);
  }
  const bytes = new Uint8Array(length); let offset = 0;
  for (const part of parts) { bytes.set(part, offset); offset += part.length; }
  try { return JSON.parse(new TextDecoder().decode(bytes)); }
  catch { throw new HttpError(400, 'The request could not be read. Please try again.'); }
}
export function failure(error: unknown): Response {
  if (error instanceof HttpError) return json({ error: error.message, ...(error.fields ? { fields: error.fields } : {}) }, error.status);
  // Never include payloads, database URLs, tokens, SQL or exception details in logs/responses.
  console.error('Inquiry service request failed.');
  return json({ error: 'The inquiry service is temporarily unavailable. Please try again.' }, 503);
}
