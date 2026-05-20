/**
 * app/api/areas/route.ts
 * Sumber data: area_overrides (nama resmi) + dim_filters (list lengkap)
 * Bukan lagi dari hardcode defaultAreas atau data/areas.json
 */

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { withAuth } from '@/lib/auth/session';
import { canAccessArea } from '@/lib/auth/types';

export async function GET(request: NextRequest) {
  return withAuth(request, 'view_areas', async (session) => {
    try {
      // Ambil semua area dari area_overrides (ada nama resminya)
      // LEFT JOIN ke dim_filters untuk area yang ada di data tapi belum di area_overrides
      const result = await pool.query(`
        SELECT
          ao.area_id                          AS id,
          ao.area_name                        AS name,
          COUNT(DISTINCT ao.city_name)        AS city_count
        FROM area_overrides ao
        GROUP BY ao.area_id, ao.area_name
        ORDER BY ao.area_name ASC
      `);

      // Jika area_overrides kosong, fallback ke DISTINCT area dari sales_records
      let areas = result.rows;

      if (!areas.length) {
        const fallback = await pool.query(`
          SELECT
            area       AS id,
            initcap(replace(replace(area, 'area_', ''), '_', ' ')) AS name,
            COUNT(*)   AS record_count
          FROM sales_records
          WHERE area IS NOT NULL
          GROUP BY area
          ORDER BY name ASC
        `);
        areas = fallback.rows;
      }

      // Filter berdasarkan allowed_areas user (root dapat semua)
      if (session.role !== 'root') {
        areas = areas.filter(a => canAccessArea(session, a.id));
      }

      return NextResponse.json({
        success: true,
        data: { areas },
        count: areas.length,
      });

    } catch (error) {
      console.error('[api/areas GET]', error);
      return NextResponse.json(
        { success: false, error: 'Gagal mengambil data area' },
        { status: 500 }
      );
    }
  });
}

export async function POST(request: NextRequest) {
  return withAuth(request, 'manage_areas', async (session) => {
    try {
      const body = await request.json();
      const { action, area } = body;

      if (!action || !area) {
        return NextResponse.json(
          { success: false, error: 'action dan area wajib diisi' },
          { status: 400 }
        );
      }

      if (action === 'add') {
        // Tambah area baru — minimal satu entry di area_overrides
        await pool.query(`
          INSERT INTO area_overrides (city_name, area_id, area_name, city_type)
          VALUES ($1, $2, $3, 'kota')
          ON CONFLICT (city_name) DO NOTHING
        `, [area.name, area.id, area.name]);

      } else if (action === 'update') {
        // Update nama area di semua baris area_overrides yang punya area_id ini
        await pool.query(`
          UPDATE area_overrides SET area_name = $1, updated_at = now()
          WHERE area_id = $2
        `, [area.name, area.id]);

      } else if (action === 'delete') {
        // Hanya root boleh delete area
        if (session.role !== 'root') {
          return NextResponse.json(
            { success: false, error: 'Hanya root yang bisa menghapus area' },
            { status: 403 }
          );
        }
        await pool.query(
          'DELETE FROM area_overrides WHERE area_id = $1',
          [area.id]
        );

      } else {
        return NextResponse.json(
          { success: false, error: `Action tidak dikenal: ${action}` },
          { status: 400 }
        );
      }

      // Kembalikan list area terbaru
      const updated = await pool.query(`
        SELECT area_id AS id, area_name AS name,
               COUNT(DISTINCT city_name) AS city_count
        FROM area_overrides
        GROUP BY area_id, area_name
        ORDER BY area_name ASC
      `);

      return NextResponse.json({
        success: true,
        data: { areas: updated.rows },
        count: updated.rows.length,
      });

    } catch (error) {
      console.error('[api/areas POST]', error);
      return NextResponse.json(
        { success: false, error: 'Gagal mengelola area' },
        { status: 500 }
      );
    }
  });
}