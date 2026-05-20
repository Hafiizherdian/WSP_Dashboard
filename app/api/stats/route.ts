/**
 * API route untuk database statistics
 * GET /api/stats - Get database statistics
 */

import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'dashboard_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'cakra123',
});

export async function GET(request: NextRequest) {
  try {
    const query = `
      SELECT 
        (SELECT COUNT(*) FROM sales_records) as total_records,
        (SELECT COALESCE(SUM(omzet), 0) FROM sales_records) as total_omzet,
        (SELECT COUNT(*) FROM uploaded_files) as total_files,
        (SELECT MAX(created_at) FROM uploaded_files WHERE status = 'completed') as latest_upload,
        (SELECT COUNT(*) FROM distribution_records) as distribution_records,
        (SELECT MAX(created_at) FROM distribution_files WHERE status = 'completed') as distribution_latest_upload,
        (SELECT COUNT(*) FROM distribution_files) as distribution_files_count
    `;

    const result = await pool.query(query);

    return NextResponse.json({
      success: true,
      data: {
        total_records: parseInt(result.rows[0].total_records) || 0,
        total_omzet: parseFloat(result.rows[0].total_omzet) || 0,
        total_files: parseInt(result.rows[0].total_files) || 0,
        latest_upload: result.rows[0].latest_upload,
        distribution_records: parseInt(result.rows[0].distribution_records) || 0,
        distribution_latest_upload: result.rows[0].distribution_latest_upload,
        distribution_files_count: parseInt(result.rows[0].distribution_files_count) || 0
      }
    });

  } catch (error) {
    console.error('Gagal untuk fetch statistics:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal untuk fetch statistics' },
      { status: 500 }
    );
  }
}
