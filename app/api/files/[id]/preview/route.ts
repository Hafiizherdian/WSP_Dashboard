/**
 * API route untuk preview data dari file yang diupload
 * GET /api/files/[id]/preview - Ambil sample data dari file tertentu
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
    // 1. Pastikan ID dikonversi ke Number
    const resolvedParams = await params;
    const fileId = parseInt(resolvedParams.id);

    if (isNaN(fileId)) {
      return NextResponse.json({ success: false, error: "ID tidak valid" }, { status: 400 });
    }

    // 2. Gunakan explicit casting di SQL jika perlu
    const fileCheck = await pool.query(
      `SELECT id, original_name, record_count, status 
       FROM uploaded_files 
       WHERE id = $1`,
      [fileId] // Gunakan variable yang sudah di-parseInt
    );

    if (fileCheck.rows.length === 0) {
      // Debugging: Log jika tidak ketemu
      console.log(`[DEBUG] File ID ${fileId} tidak ditemukan di database.`);
      return NextResponse.json(
        { success: false, error: "File tidak ditemukan di database" },
        { status: 404 }
      );
    }

    // ... sisa kode

    const fileInfo = fileCheck.rows[0];

    const dataResult = await pool.query(
      `SELECT 
        week,
        date,
        product,
        category,
        customer_no,
        customer,
        customer_type,
        city,
        units_bks,
        units_slop,
        units_bal,
        units_dos,
        omzet
       FROM sales_records 
       WHERE file_id = $1 
       ORDER BY id ASC
       LIMIT $2`,
      [fileId, 100]
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
    console.error("Error fetching preview:", error);

    const errMsg =
      error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        success: false,
        error: `Gagal memuat preview: ${errMsg}. Pastikan nama kolom di tabel sales_records sudah sesuai.`,
      },
      { status: 500 }
    );
  }
}