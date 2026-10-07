import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { COURSE_COOKIE, makeCourseCookie } from '@/lib/courseAccess';

function safeTokenEqual(a: string, b: string) {
  const left = crypto.createHash('sha256').update(a).digest();
  const right = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(left, right);
}

export async function GET(req: NextRequest) {
  const secret = process.env.COURSE_ACCESS_TOKEN;
  const token = req.nextUrl.searchParams.get('t') ?? '';

  if (!secret || !token || !safeTokenEqual(token, secret)) {
    return NextResponse.redirect(new URL('/course?access=invalid', req.url));
  }

  const res = NextResponse.redirect(new URL('/course', req.url));
  res.cookies.set(COURSE_COOKIE, makeCourseCookie(secret), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  });
  return res;
}
