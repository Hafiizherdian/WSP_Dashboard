// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { compare } from 'bcryptjs';
import { signToken } from '@/lib/auth/jwt';
import { COOKIE_NAME } from '@/lib/auth/session';
import { pool as db } from '@/lib/db'; 

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username dan password wajib diisi' }, { status: 400 });
    }

    // Cari user
    const result = await db.query(
      `SELECT id, username, email, role, password_hash, is_active, allowed_areas
       FROM app_users WHERE username = $1 AND is_active = TRUE LIMIT 1`,
      [username.trim().toLowerCase()]
    );

    const user = result.rows[0];

    if (!user) {
      // Delay untuk mencegah timing attack
      await new Promise(r => setTimeout(r, 300));
      return NextResponse.json({ error: 'Username atau password salah' }, { status: 401 });
    }

    // Debug: Log user found
    // console.log('[DEBUG] User found:', {
    //   id: user.id,
    //   username: user.username,
    //   role: user.role,
    //   is_active: user.is_active,
    //   password_hash_length: user.password_hash?.length
    // });

    const valid = await compare(password, user.password_hash);
    // console.log('[DEBUG] Password comparison:', {
    //   input_password: password,
    //   hash_matches: valid
    // });
    
    if (!valid) {
      return NextResponse.json({ error: 'Username atau password salah' }, { status: 401 });
    }

    if (!user.is_active) {
      return NextResponse.json({ error: 'Akun ini dinonaktifkan' }, { status: 403 });
    }

    // Update last_login
    await db.query('UPDATE app_users SET last_login = now() WHERE id = $1', [user.id]);

    const token = await signToken({
      id:       user.id,
      username: user.username,
      email:    user.email,
      role:     user.role,
      allowed_areas: user.allowed_areas || [],
    });

    const res = NextResponse.json({
      success: true,
      data: { id: user.id, username: user.username, email: user.email, role: user.role },
    });

    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'development', //buat vps sementara ganti ke development
      sameSite: 'lax',
      maxAge:   8 * 60 * 60, // 8 jam
      path:     '/',
    });

    return res;
  } catch (err) {
    console.error('[auth/login]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}