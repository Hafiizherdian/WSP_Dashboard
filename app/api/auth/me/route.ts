// app/api/auth/me/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { COOKIE_NAME } from '@/lib/auth/session';
import { pool } from '@/lib/db';

export async function GET(req: NextRequest) {
  const token   = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: 'Token tidak valid' }, { status: 401 });

  // Fetch user with allowed_areas from database
  try {
    const result = await pool.query(
      'SELECT id, username, email, role, allowed_areas FROM app_users WHERE id = $1',
      [payload.id]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }

    const user = result.rows[0];
    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        allowed_areas: user.allowed_areas || [],
      },
    });
  } catch (error) {
    console.error('Error fetching user data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}