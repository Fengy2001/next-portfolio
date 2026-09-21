import { NextResponse } from 'next/server';
import { verifyLogin } from '@/lib/auth';
import { createSessionToken } from '@/lib/session';
import { checkRateLimit } from '@/lib/rateLimit';

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Too many login attempts. Try again in a few minutes.' },
      { status: 429 }
    );
  }

  const { username, password } = await req.json();

  if (typeof username !== 'string' || typeof password !== 'string') {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  if (!verifyLogin(username, password)) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const token = createSessionToken(username);
  const res = NextResponse.json({ ok: true });
  res.cookies.set('admin_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24,
  });
  return res;
}