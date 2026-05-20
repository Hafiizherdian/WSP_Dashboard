// app/api/auth/setup/route.ts
// ⚠️  HAPUS FILE INI SETELAH SETUP SELESAI

import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { pool as db } from '@/lib/db';

// POST /api/auth/setup → buat tabel + seed root
export async function POST() {
  try {
    await db.query(`
      DO $$ BEGIN
        CREATE TYPE user_role AS ENUM ('root', 'admin', 'user');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS app_users (
        id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
        username      VARCHAR(64)  NOT NULL UNIQUE,
        email         VARCHAR(255) NOT NULL UNIQUE,
        password_hash TEXT         NOT NULL,
        role          user_role    NOT NULL DEFAULT 'user',
        is_active     BOOLEAN      NOT NULL DEFAULT true,
        created_by    UUID         REFERENCES app_users(id) ON DELETE SET NULL,
        created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
        updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
        last_login    TIMESTAMPTZ
      );
    `);

    await db.query(`CREATE INDEX IF NOT EXISTS idx_app_users_username ON app_users(username);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_app_users_role ON app_users(role);`);

    await db.query(`
      CREATE OR REPLACE FUNCTION update_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN NEW.updated_at = now(); RETURN NEW; END;
      $$ LANGUAGE plpgsql;
    `);

    await db.query(`
      DROP TRIGGER IF EXISTS trg_users_updated_at ON app_users;
      CREATE TRIGGER trg_users_updated_at
        BEFORE UPDATE ON app_users
        FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    `);

    // ✅ Hash di-generate runtime pakai bcryptjs project kamu — dijamin cocok
    const password_hash = await hash('RootPass123!', 12);

    await db.query(
      `INSERT INTO app_users (username, email, password_hash, role)
       VALUES ($1, $2, $3, 'root')
       ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
      ['root', 'root@example.com', password_hash]
    );

    const check = await db.query(`SELECT username, role FROM app_users`);

    return NextResponse.json({
      success: true,
      message: 'Selesai! Login: root / RootPass123!',
      users:   check.rows,
    });
  } catch (err) {
    console.error('[auth/setup]', err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

// PATCH /api/auth/setup → reset password user tertentu
// Body: { username: string, new_password: string }
export async function PATCH(req: NextRequest) {
  try {
    const { username, new_password } = await req.json();
    if (!username || !new_password)  return NextResponse.json({ error: 'username dan new_password wajib diisi' }, { status: 400 });
    if (new_password.length < 8)     return NextResponse.json({ error: 'Password minimal 8 karakter' }, { status: 400 });

    const password_hash = await hash(new_password, 12);
    const result = await db.query(
      `UPDATE app_users SET password_hash = $1 WHERE username = $2 RETURNING username, role`,
      [password_hash, username]
    );

    if (!result.rows.length) return NextResponse.json({ error: `User "${username}" tidak ditemukan` }, { status: 404 });
    return NextResponse.json({ success: true, message: `Password "${username}" berhasil direset`, user: result.rows[0] });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

// GET → cek status tabel & daftar user
export async function GET() {
  try {
    const exists = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables WHERE table_name = 'app_users'
      ) AS exists
    `);
    if (!exists.rows[0].exists) return NextResponse.json({ exists: false, message: 'Tabel belum ada. Jalankan POST /api/auth/setup' });
    const users = await db.query(`SELECT username, role, is_active, last_login FROM app_users ORDER BY created_at`);
    return NextResponse.json({ exists: true, users: users.rows });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}