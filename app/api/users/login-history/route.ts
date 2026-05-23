// app/api/users/login-history/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/session';
import { pool as db } from '@/lib/db';

// ─── GET /api/users/login-history?userId=xxx ─────────────────────────────────
//
// Permission:
//   - root  → bisa lihat riwayat siapa saja
//   - admin → bisa lihat riwayat user (role = 'user') yang di-manage-nya
//   - user  → hanya bisa lihat riwayat milik sendiri
//
export async function GET(req: NextRequest) {
  return withAuth(req, 'view_users', async (session) => {
    const userId = req.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Parameter userId wajib diisi' },
        { status: 400 }
      );
    }

    // ── Otorisasi granular ─────────────────────────────────────────────────────
    // User biasa hanya boleh lihat log milik sendiri
    if (session.role === 'user' && session.id !== userId) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    // Admin hanya boleh lihat log user dengan role 'user'
    // (tidak bisa intip log sesama admin / root)
    if (session.role === 'admin' && session.id !== userId) {
      const target = await db.query(
        `SELECT role FROM app_users WHERE id = $1 LIMIT 1`,
        [userId]
      );
      if (!target.rows.length) {
        return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
      }
      if (target.rows[0].role !== 'user') {
        return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
      }
    }

    // ── Pastikan target user memang ada ────────────────────────────────────────
    const userCheck = await db.query(
      `SELECT id FROM app_users WHERE id = $1 LIMIT 1`,
      [userId]
    );
    if (!userCheck.rows.length) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }

    // ── Ambil log — max 100 entri terbaru ─────────────────────────────────────
    const logs = await db.query(
      `SELECT id, created_at, ip_address, user_agent, success
       FROM   login_logs
       WHERE  user_id = $1
       ORDER  BY created_at DESC
       LIMIT  100`,
      [userId]
    );

    return NextResponse.json({ success: true, data: logs.rows });
  });
}