// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { compare } from 'bcryptjs';
import { signToken } from '@/lib/auth/jwt';
import { COOKIE_NAME } from '@/lib/auth/session';
import { pool as db } from '@/lib/db';

// ─── Helper: ambil IP client ──────────────────────────────────────────────────
function getClientIp(req: NextRequest): string | null {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    null
  );
}

// ─── Helper: catat login log (fire-and-forget, tidak boleh blokir response) ───
async function writeLoginLog(
  userId: string,
  ip: string | null,
  userAgent: string | null,
  success: boolean
): Promise<void> {
  try {
    await db.query(
      `INSERT INTO login_logs (user_id, ip_address, user_agent, success)
       VALUES ($1, $2, $3, $4)`,
      [userId, ip, userAgent, success]
    );
  } catch (err) {
    // Jangan sampai error log merusak response login
    console.error('[login_logs] Gagal mencatat log:', err);
  }
}

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const ip        = getClientIp(req);
  const userAgent = req.headers.get('user-agent');

  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username dan password wajib diisi' },
        { status: 400 }
      );
    }

    // ── Cari user ──────────────────────────────────────────────────────────────
    const result = await db.query(
      `SELECT id, username, email, role, password_hash, is_active, allowed_areas
       FROM app_users
       WHERE username = $1
       LIMIT 1`,
      [username.trim().toLowerCase()]
    );

    const user = result.rows[0];

    // User tidak ditemukan — delay anti-timing-attack, tidak catat log
    // (tidak ada user_id yang bisa direferensikan)
    if (!user) {
      await new Promise(r => setTimeout(r, 300));
      return NextResponse.json(
        { error: 'Username atau password salah' },
        { status: 401 }
      );
    }

    // ── Verifikasi password ────────────────────────────────────────────────────
    const valid = await compare(password, user.password_hash);

    if (!valid) {
      // Catat percobaan gagal (password salah)
      await writeLoginLog(user.id, ip, userAgent, false);
      return NextResponse.json(
        { error: 'Username atau password salah' },
        { status: 401 }
      );
    }

    // ── Akun nonaktif ─────────────────────────────────────────────────────────
    if (!user.is_active) {
      // Catat percobaan gagal (akun diblokir)
      await writeLoginLog(user.id, ip, userAgent, false);
      return NextResponse.json(
        { error: 'Akun ini dinonaktifkan' },
        { status: 403 }
      );
    }

    // ── Login berhasil — update last_login & catat log ─────────────────────────
    await Promise.all([
      db.query('UPDATE app_users SET last_login = now() WHERE id = $1', [user.id]),
      writeLoginLog(user.id, ip, userAgent, true),
    ]);

    const token = await signToken({
      id:            user.id,
      username:      user.username,
      email:         user.email,
      role:          user.role,
      allowed_areas: user.allowed_areas || [],
    });

    const res = NextResponse.json({
      success: true,
      data: {
        id:       user.id,
        username: user.username,
        email:    user.email,
        role:     user.role,
      },
    });

    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'development', // buat vps sementara ganti ke development
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