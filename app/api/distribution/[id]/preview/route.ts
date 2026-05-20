/**
 * API route untuk preview data dari file distribusi yang diupload
 * GET /api/distribution/[id]/preview - Ambil sample data dari file tertentu
 */
import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'dashboard_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'cakra123',
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const fileId = parseInt(resolvedParams.id);

    if (isNaN(fileId)) {
      return NextResponse.json(
        { success: false, error: 'ID tidak valid' },
        { status: 400 }
      );
    }

    // Cek apakah file ada di tabel distribution_files
    const fileCheck = await pool.query(
      `SELECT id, original_name, record_count, area
       FROM distribution_files
       WHERE id = $1`,
      [fileId]
    );

    if (fileCheck.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'File tidak ditemukan di database' },
        { status: 404 }
      );
    }

    const fileInfo = fileCheck.rows[0];

    // Pakai dist_file_id — file_id lama sudah di-drop FK-nya oleh migration
    const dataResult = await pool.query(
      `SELECT
        week        AS "Minggu",
        product     AS "Produk",
        outlet      AS "Outlet",
        outlet_type AS "Tipe Outlet",
        salesman    AS "Salesman",
        district    AS "Kecamatan",
        city        AS "Kota",
        plan        AS "Plan",
        actual      AS "Aktual",
        av_in       AS "Av-In",
        ec          AS "EC",
        av_out      AS "Av-Out"
       FROM distribution_records
       WHERE dist_file_id = $1
       ORDER BY id ASC
       LIMIT 100`,
      [fileId]
    );

    return NextResponse.json({
      success: true,
      data: dataResult.rows,
      meta: {
        file: fileInfo,
        shown: dataResult.rows.length,
        total: fileInfo.record_count,
      },
    });
  } catch (error) {
    console.error('Error fetching distribution preview:', error);
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        success: false,
        error: `Gagal memuat preview: ${errMsg}. Pastikan nama kolom di tabel bener cah.`,
      },
      { status: 500 }
    );
  }
}