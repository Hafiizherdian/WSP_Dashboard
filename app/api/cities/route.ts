/**
 * API route untuk mengambil daftar kota yang tersedia
 * Endpoint: GET /api/cities
 * Query params:
 * - year1: Filter by first year (optional)
 * - year2: Filter by second year (optional)
 * Returns: Array of unique city names from sales_records
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
    const { searchParams } = new URL(request.url);
    const year1Param = searchParams.get('year1');
    const year2Param = searchParams.get('year2');

    const year1 = year1Param ? parseInt(year1Param) : undefined;
    const year2 = year2Param ? parseInt(year2Param) : undefined;

    let query = `
      SELECT DISTINCT city 
      FROM sales_records 
      WHERE city IS NOT NULL AND city != ''
    `;
    const params: any[] = [];

    if (year1 !== undefined && year2 !== undefined) {
      query += ` AND (EXTRACT(YEAR FROM date) = $1 OR EXTRACT(YEAR FROM date) = $2)`;
      params.push(year1, year2);
    } else if (year1 !== undefined) {
      query += ` AND EXTRACT(YEAR FROM date) = $1`;
      params.push(year1);
    } else if (year2 !== undefined) {
      query += ` AND EXTRACT(YEAR FROM date) = $1`;
      params.push(year2);
    }

    query += ` ORDER BY city ASC`;

    const result = await pool.query(query, params);

    const cities = result.rows.map(row => row.city).filter(Boolean);

    return NextResponse.json({
      success: true,
      data: cities,
      count: cities.length
    });

  } catch (error) {
    console.error('Error fetching cities:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch cities' },
      { status: 500 }
    );
  }
}
