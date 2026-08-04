/**
 * GET /api/piutang/files/[id]
 * Preview 10 baris pertama dari file piutang berdasarkan fileId.
 * Response konsisten dengan /api/files/[id]/preview di penjualan.
 */

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }, // 1. Ubah tipe data menjadi Promise
) {
  try {
    // 2. Unwrapped / await params-nya di sini
    const resolvedParams = await params;
    const fileId = resolvedParams.id?.trim();
    
    if (!fileId) {
      return NextResponse.json({ success: false, error: 'fileId required' }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      // Meta dulu
      const metaRes = await client.query(
        `SELECT original_name AS "originalName", row_count AS "rowCount", area, uploaded_at AS "uploadedAt"
         FROM piutang_files WHERE id = $1`,
        [fileId],
      );

      if (metaRes.rows.length === 0) {
        return NextResponse.json({ success: false, error: 'File tidak ditemukan' }, { status: 404 });
      }

      const meta = metaRes.rows[0];

      // Preview 10 rows — format mirip file preview penjualan
      const rowsRes = await client.query(
        `SELECT
           faktur                                     AS "Faktur",
           kode                                       AS "Kode",
           outlet                                     AS "Outlet",
           kota                                       AS "Kota",
           kecamatan                                  AS "Kecamatan",
           kel_desa                                   AS "Kel/Desa",
           NULLIF(salesman, '')                      AS "Salesman",
           TO_CHAR(tanggal,     'DD-Mon-YYYY')       AS "Tanggal",
           TO_CHAR(jatuh_tempo, 'DD-Mon-YYYY')       AS "Jatuh Tempo",
           hari                                       AS "Hari",
           piutang                                   AS "Piutang",
           giro                                       AS "Giro"
         FROM piutang_records
         WHERE file_id = $1
         ORDER BY hari DESC NULLS LAST
         LIMIT 100`,
        [fileId],
      );

      return NextResponse.json({
        success: true,
        meta,
        data: rowsRes.rows,
      });

    } finally {
      client.release();
    }

  } catch (err: any) {
    console.error('Piutang preview error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}