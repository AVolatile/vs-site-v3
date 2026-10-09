import { neon } from '@neondatabase/serverless';
import { HttpError } from './http';
export async function query(
  statement: string,
  parameters: unknown[] = [],
): Promise<Record<string, unknown>[]> {
  const runtime = globalThis as typeof globalThis & {
    Netlify?: { env: { get: (name: string) => string | undefined } };
  };
  const url = runtime.Netlify?.env.get('DATABASE_URL') ?? process.env.DATABASE_URL;
  if (!url) throw new HttpError(503, 'The inquiry service is temporarily unavailable. Please try again.');
  return neon(url).query(statement, parameters, { fetchOptions: { signal: AbortSignal.timeout(10_000) } });
}
