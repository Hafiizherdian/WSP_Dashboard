/**
 * app/api/regions/route.ts
 * Regional = grouping dari beberapa area (area_ids), disimpan di tabel `regions`.
 * Tabel di-lazy-create (CREATE TABLE IF NOT EXISTS) supaya tidak perlu migration terpisah.
 */

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { withAuth } from '@/lib/auth/session';

async function ensureRegionsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS regions (
      id         TEXT PRIMARY KEY,
      name       TEXT NOT NULL,
      area_ids   TEXT[] NOT NULL DEFAULT '{}',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
}

function slugify(name: string): string {
  return 'regional_' + name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export async function GET(request: NextRequest) {
  return withAuth(request, 'view_areas', async (session) => {
    try {
      await ensureRegionsTable();

      const result = await pool.query(`
        SELECT id, name, area_ids AS "areaIds"
        FROM regions
        ORDER BY name ASC
      `);

      let regions = result.rows;

      // Non-root hanya lihat regional yang area-anggotanya beririsan
      // dengan allowed_areas dia (defense in depth — frontend juga filter ulang).
      if (session.role !== 'root') {
        const allowed = new Set(session.allowed_areas ?? []);
        regions = regions.filter((r: any) =>
          (r.areaIds ?? []).some((id: string) => allowed.has(id))
        );
      }

      return NextResponse.json({
        success: true,
        data: { regions },
        count: regions.length,
      });

    } catch (error) {
      console.error('[api/regions GET]', error);
      return NextResponse.json(
        { success: false, error: 'Gagal mengambil data regional' },
        { status: 500 }
      );
    }
  });
}

export async function POST(request: NextRequest) {
  return withAuth(request, 'manage_areas', async (session) => {
    try {
      await ensureRegionsTable();

      const body = await request.json();
      const { name, areaIds } = body;

      if (!name || !Array.isArray(areaIds) || areaIds.length === 0) {
        return NextResponse.json(
          { success: false, error: 'name dan areaIds (minimal 1) wajib diisi' },
          { status: 400 }
        );
      }

      let id = slugify(name);

      // Hindari tabrakan id kalau nama mirip
      const existing = await pool.query('SELECT id FROM regions WHERE id = $1', [id]);
      if (existing.rows.length > 0) {
        id = `${id}_${Date.now().toString(36)}`;
      }

      await pool.query(`
        INSERT INTO regions (id, name, area_ids)
        VALUES ($1, $2, $3)
      `, [id, name, areaIds]);

      const updated = await pool.query(`
        SELECT id, name, area_ids AS "areaIds" FROM regions ORDER BY name ASC
      `);

      return NextResponse.json({
        success: true,
        data: { regions: updated.rows },
      });

    } catch (error) {
      console.error('[api/regions POST]', error);
      return NextResponse.json(
        { success: false, error: 'Gagal membuat regional' },
        { status: 500 }
      );
    }
  });
}

export async function PATCH(request: NextRequest) {
  return withAuth(request, 'manage_areas', async (session) => {
    try {
      await ensureRegionsTable();

      const body = await request.json();
      const { id, name, areaIds } = body;

      if (!id) {
        return NextResponse.json(
          { success: false, error: 'id wajib diisi' },
          { status: 400 }
        );
      }
      if (!name && !Array.isArray(areaIds)) {
        return NextResponse.json(
          { success: false, error: 'Tidak ada perubahan yang dikirim' },
          { status: 400 }
        );
      }

      const sets: string[] = [];
      const values: any[] = [];
      let i = 1;

      if (name) { sets.push(`name = $${i++}`); values.push(name); }
      if (Array.isArray(areaIds)) {
        if (areaIds.length === 0) {
          return NextResponse.json(
            { success: false, error: 'areaIds tidak boleh kosong' },
            { status: 400 }
          );
        }
        sets.push(`area_ids = $${i++}`); values.push(areaIds);
      }
      sets.push(`updated_at = now()`);
      values.push(id);

      const result = await pool.query(
        `UPDATE regions SET ${sets.join(', ')} WHERE id = $${i} RETURNING id`,
        values
      );

      if (result.rows.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Regional tidak ditemukan' },
          { status: 404 }
        );
      }

      const updated = await pool.query(`
        SELECT id, name, area_ids AS "areaIds" FROM regions ORDER BY name ASC
      `);

      return NextResponse.json({
        success: true,
        data: { regions: updated.rows },
      });

    } catch (error) {
      console.error('[api/regions PATCH]', error);
      return NextResponse.json(
        { success: false, error: 'Gagal memperbarui regional' },
        { status: 500 }
      );
    }
  });
}

export async function DELETE(request: NextRequest) {
  return withAuth(request, 'manage_areas', async (session) => {
    try {
      // Hanya root — sama seperti kebijakan hapus area
      if (session.role !== 'root') {
        return NextResponse.json(
          { success: false, error: 'Hanya root yang bisa menghapus regional' },
          { status: 403 }
        );
      }

      await ensureRegionsTable();

      const { searchParams } = new URL(request.url);
      const id = searchParams.get('id');

      if (!id) {
        return NextResponse.json(
          { success: false, error: 'id wajib diisi' },
          { status: 400 }
        );
      }

      const result = await pool.query('DELETE FROM regions WHERE id = $1 RETURNING id', [id]);

      if (result.rows.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Regional tidak ditemukan' },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, data: { id } });

    } catch (error) {
      console.error('[api/regions DELETE]', error);
      return NextResponse.json(
        { success: false, error: 'Gagal menghapus regional' },
        { status: 500 }
      );
    }
  });
}