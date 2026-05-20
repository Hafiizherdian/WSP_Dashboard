/**
 * API route untuk mengelola uploaded files
 * GET /api/files - Get all uploaded files (filtered by user area)
 * DELETE /api/files - Delete uploaded file dan recordnya
 */
import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { withAuth } from '@/lib/auth/session';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'dashboard_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'cakra123',
});

export async function GET(request: NextRequest) {
  return withAuth(request, 'view_files', async (session) => {
    try {
      const { searchParams } = new URL(request.url);
      // FIX: Naikkan default limit dari 50 → 1000 agar semua file tampil
      const limit = parseInt(searchParams.get('limit') || '1000');
      const offset = parseInt(searchParams.get('offset') || '0');

      let query = `
        SELECT 
          id, filename, original_name, file_size, record_count, total_omzet,
          status, uploaded_by, created_at, updated_at
        FROM uploaded_files 
      `;
      
      let queryParams: any[] = [limit, offset];
      
      // Add area filtering for non-root users
      if (session.role !== 'root') {
        const userAreas = session.allowed_areas || [];
        if (userAreas.length > 0) {
          query += `
            WHERE id IN (
              SELECT DISTINCT file_id 
              FROM sales_records 
              WHERE area = ANY($3)
            )
          `;
          queryParams.push(userAreas);
        }
      }
      
      query += ' ORDER BY created_at DESC LIMIT $1 OFFSET $2';

      const result = await pool.query(query, queryParams);

      // Juga ambil total count untuk keperluan pagination di masa depan
      let countQuery = 'SELECT COUNT(*) FROM uploaded_files';
      let countParams: any[] = [];
      
      if (session.role !== 'root') {
        const userAreas = session.allowed_areas || [];
        if (userAreas.length > 0) {
          countQuery += `
            WHERE id IN (
              SELECT DISTINCT file_id 
              FROM sales_records 
              WHERE area = ANY($1)
            )
          `;
          countParams.push(userAreas);
        }
      }
      
      const countResult = await pool.query(countQuery, countParams);
      const total = parseInt(countResult.rows[0].count);

      return NextResponse.json({
        success: true,
        data: result.rows,
        meta: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      });
    } catch (error) {
      console.error('Error fetching files:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch files' },
        { status: 500 }
      );
    }
  });
}

export async function DELETE(request: NextRequest) {
  return withAuth(request, 'delete_file', async (session) => {
    try {
      const { searchParams } = new URL(request.url);
      const fileId = searchParams.get('id');

      if (!fileId) {
        return NextResponse.json(
          { success: false, error: 'File ID is required' },
          { status: 400 }
        );
      }

      // Check if user can delete this file (area-based access)
      if (session.role !== 'root') {
        const fileCheck = await pool.query(
          'SELECT COUNT(*) as count FROM sales_records WHERE file_id = $1 AND area = ANY($2)',
          [fileId, session.allowed_areas || []]
        );
        
        if (parseInt(fileCheck.rows[0].count) === 0) {
          return NextResponse.json(
            { success: false, error: 'Anda tidak memiliki akses ke file ini' },
            { status: 403 }
          );
        }
      }

      const client = await pool.connect();

      try {
        await client.query('BEGIN');

        // Hapus sales records terkait dulu
        await client.query('DELETE FROM sales_records WHERE file_id = $1', [fileId]);

        // Hapus record file
        const deleteResult = await client.query(
          'DELETE FROM uploaded_files WHERE id = $1 RETURNING *',
          [fileId]
        );

        if (deleteResult.rows.length === 0) {
          await client.query('ROLLBACK');
          return NextResponse.json(
            { success: false, error: 'File not found' },
            { status: 404 }
          );
        }

        await client.query('COMMIT');

        return NextResponse.json({
          success: true,
          data: deleteResult.rows[0],
        });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to delete file' },
        { status: 500 }
      );
    }
  });
}