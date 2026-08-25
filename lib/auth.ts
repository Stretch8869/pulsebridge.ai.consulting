import { cookies } from 'next/headers';
import crypto from 'node:crypto';
import { db } from './db';

export const SESSION_COOKIE = 'pb_crm_session';

export async function requireAdmin() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const sql = db();
  const rows = await sql`
    select u.id, u.email, u.name
    from admin_sessions s
    join admin_users u on u.id = s.user_id
    where s.token_hash = ${tokenHash} and s.expires_at > now()
    limit 1
  `;
  return rows[0] ?? null;
}

export function hashPassword(password: string, salt: string) {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

export function safeEqualHex(a: string, b: string) {
  try {
    return crypto.timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
  } catch {
    return false;
  }
}
