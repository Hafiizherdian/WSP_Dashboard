// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { withAuth } from '@/lib/auth/session';
import { pool as db } from '@/lib/db';
import { canAccessArea } from '@/lib/auth/types';

// ─── GET /api/users ───────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  return withAuth(req, 'view_users', async () => {
    const result = await db.query(
      `SELECT u.id, u.username, u.email, u.role, u.is_active, u.created_at, u.last_login, u.allowed_areas,
              c.username AS created_by_name
       FROM   app_users u
       LEFT JOIN app_users c ON c.id = u.created_by
       ORDER  BY u.created_at DESC`
    );
    return NextResponse.json({ success: true, data: result.rows });
  });
}

// ─── POST /api/users  (create) ────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  return withAuth(req, 'manage_users', async (session) => {
    const { username, email, password, role, allowed_areas } = await req.json();

    if (!username || !email || !password || !role) {
      return NextResponse.json({ error: 'Semua field wajib diisi' }, { status: 400 });
    }
    if (!['root', 'admin', 'user'].includes(role)) {
      return NextResponse.json({ error: 'Role tidak valid' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password minimal 8 karakter' }, { status: 400 });
    }

    if (allowed_areas && Array.isArray(allowed_areas)) {
      for (const areaId of allowed_areas) {
        if (!canAccessArea(session, areaId)) {
          return NextResponse.json(
            { error: `Anda tidak memiliki akses ke area: ${areaId}` },
            { status: 403 }
          );
        }
      }
    }

    const password_hash = await hash(password, 12);

    try {
      const result = await db.query(
        `INSERT INTO app_users (username, email, password_hash, role, allowed_areas, created_by)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, username, email, role, is_active, created_at, allowed_areas`,
        [username.trim().toLowerCase(), email.trim().toLowerCase(), password_hash, role, allowed_areas || [], session.id]
      );
      return NextResponse.json({ success: true, data: result.rows[0] }, { status: 201 });
    } catch (err: unknown) {
      const pg = err as { code?: string };
      if (pg.code === '23505') {
        return NextResponse.json({ error: 'Username atau email sudah digunakan' }, { status: 409 });
      }
      throw err;
    }
  });
}

// ─── PATCH /api/users?id=xxx  (update) ───────────────────────────────────────
export async function PATCH(req: NextRequest) {
  return withAuth(req, 'manage_users', async (session) => {
    const id   = req.nextUrl.searchParams.get('id');
    const body = await req.json();

    if (!id) return NextResponse.json({ error: 'ID diperlukan' }, { status: 400 });

    if (id === session.id && (body.role !== undefined || body.is_active === false)) {
      return NextResponse.json({ error: 'Tidak bisa mengubah role/status akun sendiri' }, { status: 400 });
    }

    //  Tambah 'username' ke daftar field yang boleh diupdate
    const allowed = ['username', 'role', 'is_active', 'email', 'allowed_areas'];
    const fields: string[] = [];
    const values: unknown[] = [];
    let   idx = 1;

    for (const key of allowed) {
      if (body[key] !== undefined) {
        // Normalise username ke lowercase saat update
        const val = key === 'username'
          ? (body[key] as string).trim().toLowerCase()
          : body[key];
        fields.push(`${key} = $${idx++}`);
        values.push(val);
      }
    }

    if (body.allowed_areas && Array.isArray(body.allowed_areas)) {
      for (const areaId of body.allowed_areas) {
        if (!canAccessArea(session, areaId)) {
          return NextResponse.json(
            { error: `Anda tidak memiliki akses ke area: ${areaId}` },
            { status: 403 }
          );
        }
      }
    }

    if (body.password) {
      if (body.password.length < 8) return NextResponse.json({ error: 'Password minimal 8 karakter' }, { status: 400 });
      fields.push(`password_hash = $${idx++}`);
      values.push(await hash(body.password, 12));
    }

    if (!fields.length) return NextResponse.json({ error: 'Tidak ada data yang diupdate' }, { status: 400 });

    values.push(id);

    //  Wrap dengan try/catch untuk handle duplikat username/email
    try {
      const result = await db.query(
        `UPDATE app_users SET ${fields.join(', ')} WHERE id = $${idx}
         RETURNING id, username, email, role, is_active, updated_at, allowed_areas`,
        values
      );
      if (!result.rows.length) return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
      return NextResponse.json({ success: true, data: result.rows[0] });
    } catch (err: unknown) {
      const pg = err as { code?: string };
      if (pg.code === '23505') {
        return NextResponse.json({ error: 'Username atau email sudah digunakan' }, { status: 409 });
      }
      throw err;
    }
  });
}

// ─── DELETE /api/users?id=xxx ─────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  return withAuth(req, 'manage_users', async (session) => {
    const id = req.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID diperlukan' }, { status: 400 });
    if (id === session.id) return NextResponse.json({ error: 'Tidak bisa menghapus akun sendiri' }, { status: 400 });

    const result = await db.query(
      'DELETE FROM app_users WHERE id = $1 RETURNING id', [id]
    );
    if (!result.rows.length) return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    return NextResponse.json({ success: true });
  });
}