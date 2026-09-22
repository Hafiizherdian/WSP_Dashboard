// lib/auth/session.ts
import { cookies } from 'next/headers';
import { verifyToken } from './jwt';
import { SessionUser, UserRole, can, Permission } from './types';

export const COOKIE_NAME = 'auth_token';

export async function getSession(): Promise<SessionUser | null> {
  try {
    // Tambahkan await di sini
    const cookieStore = await cookies(); 
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) return null;
    
    const payload = await verifyToken(token);
    if (!payload) return null;
    
    return { 
      id: payload.id, 
      username: payload.username, 
      email: payload.email, 
      role: payload.role,
      allowed_areas: payload.allowed_areas || []
    };
  } catch (error) {
    return null;
  }
}


export async function requireSession(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) throw new Error('UNAUTHORIZED');
  return session;
}

export async function requireRole(...roles: UserRole[]): Promise<SessionUser> {
  const session = await requireSession();
  if (!roles.includes(session.role)) throw new Error('FORBIDDEN');
  return session;
}

export async function requirePermission(permission: Permission): Promise<SessionUser> {
  const session = await requireSession();
  if (!can(session.role, permission)) throw new Error('FORBIDDEN');
  return session;
}

// ─── API route helper ─────────────────────────────────────────────────────────
import { NextRequest, NextResponse } from 'next/server';

export async function withAuth(
  req: NextRequest,
  permission: Permission,
  handler: (session: SessionUser) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    const token = req.cookies.get(COOKIE_NAME)?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Token tidak valid' }, { status: 401 });
    if (!can(payload.role, permission)) return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    return handler({
      id: payload.id,
      username: payload.username,
      email: payload.email,
      role: payload.role,
      allowed_areas: payload.allowed_areas || []
    });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}