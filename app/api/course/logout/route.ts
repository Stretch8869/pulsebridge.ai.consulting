import { NextRequest, NextResponse } from 'next/server';
import { COURSE_COOKIE } from '@/lib/courseAccess';

export async function GET(req: NextRequest) {
  const res = NextResponse.redirect(new URL('/course', req.url));
  res.cookies.set(COURSE_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return res;
}
