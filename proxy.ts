import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySessionToken } from '@/lib/session';

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === '/api/admin/login') return NextResponse.next();

  // only gate the API routes here — the /admin PAGE itself must always be
  // reachable, since it renders its own login form when unauthenticated.
  // Redirecting an unauthenticated /admin request back to /admin is a
  // self-loop (this was the ERR_TOO_MANY_REDIRECTS bug).
  const isAdminApiRoute = pathname.startsWith('/api/admin');
  if (!isAdminApiRoute) return NextResponse.next();

  const token = req.cookies.get('admin_session')?.value;
  const username = verifySessionToken(token);

  if (!username) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/admin/:path*'],
};