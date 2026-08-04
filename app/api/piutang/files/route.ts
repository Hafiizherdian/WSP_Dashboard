/**
 * GET /api/piutang/files
 * List semua file piutang yang pernah diupload.
 *
 * Query params:
 *   area - filter by area (opsional)
 */

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const area = req.nextUrl.searchParams.get('area')?.trim() || '';
    const conditions: string[] = [];
    const values: any[] = [];

    if (area) {
      values.push(area);
      conditions.push(`f.area = $${values.length}`);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT
          f.id,
          f.original_name  AS "originalName",
          f.row_count      AS "rowCount",
          f.area,
          f.uploaded_by    AS "uploadedBy",
          TO_CHAR(f.uploaded_at, 'DD-Mon-YYYY HH24:MI') AS "uploadedAt",
          COALESCE(SUM(r.piutang), 0)::BIGINT AS "totalPiutang",
          COALESCE(SUM(r.giro),    0)::BIGINT AS "totalGiro"
        FROM piutang_files f
        LEFT JOIN piutang_records r ON r.file_id = f.id
        ${where}
        GROUP BY f.id, f.original_name, f.row_count, f.area, f.uploaded_by, f.uploaded_at
        ORDER BY f.uploaded_at DESC
      `, values);

      return NextResponse.json({
        success: true,
        data: result.rows.map(r => ({
          ...r,
          totalPiutang: Number(r.totalPiutang),
          totalGiro:    Number(r.totalGiro),
        })),
      });
    } finally {
      client.release();
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}