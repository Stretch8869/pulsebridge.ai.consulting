import crypto from 'node:crypto';
import { cookies } from 'next/headers';

export const COURSE_COOKIE = 'pb_course_access';

function accessDigest(secret: string) {
  return crypto.createHmac('sha256', secret).update('pulsebridge-ai-automation-course-2026').digest('hex');
}

export async function hasCourseAccess() {
  const secret = process.env.COURSE_ACCESS_TOKEN;
  if (!secret) return false;

  const store = await cookies();
  const value = store.get(COURSE_COOKIE)?.value;
  if (!value) return false;

  const expected = accessDigest(secret);
  try {
    return crypto.timingSafeEqual(Buffer.from(value, 'hex'), Buffer.from(expected, 'hex'));
  } catch {
    return false;
  }
}

export function makeCourseCookie(secret: string) {
  return accessDigest(secret);
}
