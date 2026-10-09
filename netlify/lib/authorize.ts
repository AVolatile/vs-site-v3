import { getUser } from '@netlify/identity';
import { HttpError } from './http';

export async function requireAdmin(): Promise<void> {
  let user;
  try { user = await getUser(); }
  catch { throw new HttpError(401, 'Sign in to continue.'); }
  if (!user) throw new HttpError(401, 'Sign in to continue.');
  if (!user.roles?.includes('admin')) throw new HttpError(403, 'This account does not have admin access.');
}
