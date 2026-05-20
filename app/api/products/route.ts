// app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const area    = searchParams.get('area');
  const yearStr = searchParams.get('year');

  // year tetap wajib, area sekarang opsional
  if (!yearStr) {
    return NextResponse.json(
      { success: false, error: 'Parameter year wajib diisi' },
      { status: 400 }
    );
  }

  const year = parseInt(yearStr, 10);
  if (isNaN(year) || year < 2000 || year > 2100) {
    return NextResponse.json(
      { success: false, error: 'Year harus berupa tahun yang valid (misal 2025)' },
      { status: 400 }
    );
  }

  const client = await pool.connect();
  try {
    let result;

    if (area) {
      // ada area → filter per area (behaviour lama, masih dipakai di tempat lain)
      result = await client.query(
        `SELECT DISTINCT product
         FROM sales_records
         WHERE area = $1
           AND EXTRACT(YEAR FROM date) = $2
           AND week BETWEEN 1 AND 52
         ORDER BY product ASC`,
        [area, year]
      );
    } else {
      // tanpa area → semua produk yang pernah ada di tahun tersebut
      result = await client.query(
        `SELECT DISTINCT product
         FROM sales_records
         WHERE EXTRACT(YEAR FROM date) = $1
           AND week BETWEEN 1 AND 52
         ORDER BY product ASC`,
        [year]
      );
    }

    const products = result.rows.map(row => row.product);
    return NextResponse.json({ success: true, data: { products } });

  } catch (err: any) {
    console.error('Error fetching unique products:', err);
    return NextResponse.json(
      {
        success: false,
        error: process.env.NODE_ENV === 'development'
          ? err.message
          : 'Gagal mengambil data produk dari database',
      },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}