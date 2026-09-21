import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySessionToken } from '@/lib/session';

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // never gate the login endpoint itself, or nothing could ever log in
  if (pathname === '/api/admin/login') return NextResponse.next();

  const isAdminRoute = pathname.startsWith('/admin') || pathname.startsWith('/api/admin');
  if (!isAdminRoute) return NextResponse.next();

  const token = req.cookies.get('admin_session')?.value;
  const username = verifySessionToken(token);

  if (!username) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/admin', req.url)); // bounce to login screen
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};