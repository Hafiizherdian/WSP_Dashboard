// middleware.ts  (root of project, next to package.json)
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { COOKIE_NAME } from '@/lib/auth/session';

// Routes yang butuh login
const PROTECTED = ['/admin', '/dashboard'];
// Routes yang hanya boleh diakses saat BELUM login
const AUTH_ONLY = ['/login'];

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token  = req.cookies.get(COOKIE_NAME)?.value;
  const payload = token ? await verifyToken(token) : null;

  const isProtected = PROTECTED.some(p => pathname.startsWith(p));
  const isAuthOnly  = AUTH_ONLY.some(p => pathname.startsWith(p));

  // Belum login → redirect ke login
  if (isProtected && !payload) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  // Sudah login → jangan masuk login page lagi
  if (isAuthOnly && payload) {
    return NextResponse.redirect(new URL('/admin', req.url));
  }

  // Role-based route guard
  if (payload && pathname.startsWith('/admin/users') && payload.role !== 'root') {
    return NextResponse.redirect(new URL('/admin?error=forbidden', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/login'],
};