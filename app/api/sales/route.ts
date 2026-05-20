/**
 * API route untuk mengambil data penjualan dari Posted by
 * Endpoint: GET /api/sales
 * Query params:
 * - year1: Filter by first year (optional)
 * - year2: Filter by second year (optional)
 * - weekStart1: Filter by first year week start (optional)
 * - weekEnd1: Filter by first year week end (optional)
 * - weekStart2: Filter by second year week start (optional)
 * - weekEnd2: Filter by second year week end (optional)
 * - product: Filter by product name (optional, ILIKE)
 * - city: Filter by area ID or specific city name (optional)
 * - area: Filter by area ID (optional)
 * - limit: Limit results (default: 1000)
 */

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { withAuth } from '@/lib/auth/session';
import { canAccessArea } from '@/lib/auth/types';

// // Database connection
// const pool = new Pool({
//   host: process.env.DB_HOST || 'localhost',
//   port: parseInt(process.env.DB_PORT || '5432'),
//   database: process.env.DB_NAME || 'dashboard_db',
//   user: process.env.DB_USER || 'postgres',
//   password: process.env.DB_PASSWORD || 'cakra123',
// });

export async function GET(request: NextRequest) {
  return withAuth(request, 'view_stats', async (user) => {
    try {
      const { searchParams } = new URL(request.url);
      const year1Param = searchParams.get('year1');
      const year2Param = searchParams.get('year2');
      const weekStart1Param = searchParams.get('weekStart1');
      const weekEnd1Param = searchParams.get('weekEnd1');
      const weekStart2Param = searchParams.get('weekStart2');
      const weekEnd2Param = searchParams.get('weekEnd2');
      const product = searchParams.get('product');
      const city = searchParams.get('city');
      const area = searchParams.get('area');
      const limit = Math.min(parseInt(searchParams.get('limit') || '2000'), 500000);

      console.log('🎯 API Sales - Query params:', {
        year1Param, year2Param, weekStart1Param, weekEnd1Param, 
        weekStart2Param, weekEnd2Param, product, city, area, limit,
        userRole: user.role,
        userAreas: user.allowed_areas
      });

      const year1 = year1Param ? parseInt(year1Param) : undefined;
      const year2 = year2Param ? parseInt(year2Param) : undefined;

    const normalizeWeekRange = (start?: string | null, end?: string | null) => {
      const startNum = start ? parseInt(start) : undefined;
      const endNum = end ? parseInt(end) : undefined;
      if (!startNum && !endNum) {
        return undefined;
      }

      const boundedStart = startNum ? Math.max(1, Math.min(startNum, 52)) : undefined;
      const boundedEnd = endNum ? Math.max(1, Math.min(endNum, 52)) : boundedStart;

      if (boundedStart !== undefined && boundedEnd !== undefined && boundedStart > boundedEnd) {
        return { start: boundedEnd, end: boundedStart };
      }

      return {
        start: boundedStart ?? boundedEnd ?? 1,
        end: boundedEnd ?? boundedStart ?? 52,
      };
    };

    const range1 = normalizeWeekRange(weekStart1Param, weekEnd1Param);
    const range2 = normalizeWeekRange(weekStart2Param, weekEnd2Param);

    let query = `
      SELECT * FROM sales_records 
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (year1 !== undefined && year2 !== undefined) {
      const year1Conditions: string[] = [];
      year1Conditions.push(`EXTRACT(YEAR FROM date) = $${paramIndex}`);
      params.push(year1);
      paramIndex++;

      if (range1) {
        year1Conditions.push(`week BETWEEN $${paramIndex} AND $${paramIndex + 1}`);
        params.push(range1.start, range1.end);
        paramIndex += 2;
      }

      const year2Conditions: string[] = [];
      year2Conditions.push(`EXTRACT(YEAR FROM date) = $${paramIndex}`);
      params.push(year2);
      paramIndex++;

      if (range2) {
        year2Conditions.push(`week BETWEEN $${paramIndex} AND $${paramIndex + 1}`);
        params.push(range2.start, range2.end);
        paramIndex += 2;
      }

      const yearClauses = [];
      yearClauses.push(`(${year1Conditions.join(' AND ')})`);
      yearClauses.push(`(${year2Conditions.join(' AND ')})`);

      query += ` AND (${yearClauses.join(' OR ')})`;
    } else if (year1 !== undefined) {
      query += ` AND EXTRACT(YEAR FROM date) = $${paramIndex}`;
      params.push(year1);
      paramIndex++;

      const range = range1 ?? range2;
      if (range) {
        query += ` AND week BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
        params.push(range.start, range.end);
        paramIndex += 2;
      }
    }

    if (product) {
      query += ` AND product ILIKE $${paramIndex}`;
      params.push(`%${product}%`);
      paramIndex++;
    }

    if (city) {
      // Filter by area column (simplified approach)
      query += ` AND area = $${paramIndex}`;
      params.push(city);
      paramIndex++;
    }

    if (area) {
      // Filter by area ID - validate user access first
      if (!canAccessArea(user, area)) {
        return NextResponse.json(
          { success: false, error: 'Anda tidak memiliki akses ke area ini' },
          { status: 403 }
        );
      }
      query += ` AND area = $${paramIndex}`;
      params.push(area);
      paramIndex++;
    } else {
      // If no specific area filter, apply user's allowed areas
      if (user.role !== 'root' && user.allowed_areas.length > 0) {
        query += ` AND area = ANY($${paramIndex})`;
        params.push(user.allowed_areas);
        paramIndex++;
      }
    }

    query += ` AND (area IS NOT NULL OR area IS NULL)`;

    if (Number.isFinite(limit) && limit > 0) {
      query += ` LIMIT $${paramIndex}`;
      params.push(limit);
    }

    console.log('🔍 Final Query:', query);
    console.log('🔍 Params:', params);
    
    const result = await pool.query(query, params);
    console.log('📊 Query Result Count:', result.rows.length);

    return NextResponse.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });

  } catch (error) {
    console.error('Error fetching sales data:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal untuk fetch sales data' },
      { status: 500 }
    );
  }
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { records } = body;

    if (!records || !Array.isArray(records)) {
      return NextResponse.json(
        { success: false, error: 'Invalid records data' },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      const insertQuery = `
        INSERT INTO sales_records (
          grand_total, week, date, product, category, customer_no, customer,
          customer_type, salesman, village, district, city, units_bks, units_slop,
          units_bal, units_dos, omzet
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        RETURNING id
      `;

      const insertedRecords = [];
      
      for (const record of records) {
        const values = [
          record.grand_total,
          record.week,
          record.date,
          record.product,
          record.category,
          record.customer_no,
          record.customer,
          record.customer_type,
          record.salesman,
          record.village,
          record.district,
          record.city,
          record.units_bks,
          record.units_slop,
          record.units_bal,
          record.units_dos,
          record.omzet
        ];

        const result = await client.query(insertQuery, values);
        insertedRecords.push(result.rows[0]);
      }

      await client.query('COMMIT');

      return NextResponse.json({
        success: true,
        data: {
          inserted_count: insertedRecords.length,
          records: insertedRecords
        }
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error untuk insert sales data:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal untuk insert sales data' },
      { status: 500 }
    );
  }
}
