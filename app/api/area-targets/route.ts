import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { defaultProductUnitMapping } from '@/lib/productCategories';

// ─── Quarter → week ranges ────────────────────────────────────────────────────
const QUARTER_OF_WEEK = (week: number): number =>
  week <= 13 ? 1 : week <= 26 ? 2 : week <= 39 ? 3 : 4;

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/area-targets?area=X&year=Y
//
// Return shape:
// {
//   success: true,
//   data: {
//     products: Array<{ product: string; weeks: Record<number, number> }>,
//     quarterlyTargets: { Q1, Q2, Q3, Q4 },   ← sum DOS per quarter (area level)
//     areaTotals: { q1_dos, q2_dos, … }
//   }
// }
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const area = searchParams.get('area');
  const year = searchParams.get('year');

  if (!area || !year) {
    return NextResponse.json(
      { success: false, error: 'area dan year wajib diisi' },
      { status: 400 },
    );
  }

  const client = await pool.connect();
  try {
    // ── Query: ambil SEMUA baris per minggu (bukan AVG) ──────────────────────
    const result = await client.query<{
      product: string;
      week: number;
      units_dos: string;
      units_bal: string;
      units_slop: string;
      units_bks: string;
    }>(
      `SELECT product, week, units_dos, units_bal, units_slop, units_bks
       FROM target_data
       WHERE area = $1
         AND year = $2
         AND target_type = 'WEEKLY'
       ORDER BY product, week`,
      [area, Number(year)],
    );

    // ── Bangun map: { product → { weekNumber → dos } } ───────────────────────
    const productMap: Record<
      string,
      { weeks: Record<number, number>; qDos: Record<number, number> }
    > = {};

    for (const row of result.rows) {
      const p = row.product;
      if (!productMap[p]) productMap[p] = { weeks: {}, qDos: { 1: 0, 2: 0, 3: 0, 4: 0 } };
      const dos = parseFloat(row.units_dos) || 0;
      productMap[p].weeks[row.week] = dos;
      productMap[p].qDos[QUARTER_OF_WEEK(row.week)] += dos;
    }

    // ── Flatten ke array ─────────────────────────────────────────────────────
    const products = Object.entries(productMap).map(([product, { weeks }]) => ({
      product,
      weeks, // { 1: 7.5, 2: 7.5, ..., 52: 6.0 }
    }));

    // ── Area-level totals (sum DOS per quarter, semua produk) ─────────────────
    const areaTotals: Record<string, number> = { q1_dos: 0, q2_dos: 0, q3_dos: 0, q4_dos: 0 };
    for (const { qDos } of Object.values(productMap)) {
      for (let q = 1; q <= 4; q++) areaTotals[`q${q}_dos`] += qDos[q] ?? 0;
    }

    const quarterlyTargets = {
      Q1: areaTotals.q1_dos,
      Q2: areaTotals.q2_dos,
      Q3: areaTotals.q3_dos,
      Q4: areaTotals.q4_dos,
    };

    return NextResponse.json({ success: true, data: { products, quarterlyTargets, areaTotals } });
  } catch (err: any) {
    console.error('[GET /api/area-targets]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  } finally {
    client.release();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/area-targets
//
// Body JSON (baru — per minggu):
// {
//   area: string,
//   product: string,
//   year: number,
//   week_values: Record<number, number>,   // { 1: 7.5, 2: 7.5, ..., 52: 6.0 }
//   company?: string,
//   brand?: string,
//   product_category?: string
// }
//
// Backward compat: jika body masih pakai format lama { quarter, dos_value },
// otomatis di-convert ke week_values (spread sama rata).
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  let body: {
    area: string;
    product: string;
    year: number;
    // Format baru
    week_values?: Record<number, number>;
    // Format lama (backward compat)
    quarter?: number;
    dos_value?: number;
    company?: string;
    brand?: string;
    product_category?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Body JSON tidak valid' }, { status: 400 });
  }

  const {
    area, product, year,
    company = '', brand = '', product_category = '',
  } = body;

  if (!area || !product || !year) {
    return NextResponse.json(
      { success: false, error: 'area, product, year wajib diisi' },
      { status: 400 },
    );
  }

  // ── Resolve week_values ───────────────────────────────────────────────────
  let weekValues: Record<number, number>;

  if (body.week_values && Object.keys(body.week_values).length > 0) {
    // Format baru: per minggu
    weekValues = Object.fromEntries(
      Object.entries(body.week_values).map(([k, v]) => [Number(k), Number(v)]),
    );
  } else if (body.quarter && body.dos_value !== undefined) {
    // Format lama: spread rata ke semua minggu dalam quarter (backward compat)
    const QUARTER_WEEKS: Record<number, { start: number; end: number }> = {
      1: { start: 1, end: 13 },
      2: { start: 14, end: 26 },
      3: { start: 27, end: 39 },
      4: { start: 40, end: 52 },
    };
    const range = QUARTER_WEEKS[body.quarter];
    if (!range) {
      return NextResponse.json({ success: false, error: `Quarter tidak valid: ${body.quarter}` }, { status: 400 });
    }
    weekValues = {};
    for (let w = range.start; w <= range.end; w++) weekValues[w] = body.dos_value!;
  } else {
    return NextResponse.json(
      { success: false, error: 'Sertakan week_values atau {quarter, dos_value}' },
      { status: 400 },
    );
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const mapping = defaultProductUnitMapping[product] ?? null;
    let rowsAffected = 0;

    for (const [weekStr, dos_value] of Object.entries(weekValues)) {
      const week = Number(weekStr);
      if (week < 1 || week > 52) continue;

      const quarter = QUARTER_OF_WEEK(week);

      // Konversi DOS → BAL → SLOP → BKS
      let units_bal = 0, units_slop = 0, units_bks = 0;
      if (mapping) {
        units_bal  = dos_value * mapping.balPerDos;
        units_slop = dos_value * mapping.balPerDos * mapping.slopPerBal;
        units_bks  = dos_value * mapping.balPerDos * mapping.slopPerBal * mapping.packPerSlop;
      } else {
        units_bal  = dos_value * 10;
        units_slop = dos_value * 100;
        units_bks  = dos_value * 1000;
      }

      await client.query(
        `INSERT INTO target_data
           (area, product, year, week, quarter, target_type, target_value, unit_type,
            units_dos, units_bal, units_slop, units_bks, company, brand, product_category)
         VALUES
           ($1, $2, $3, $4, $5, 'WEEKLY', $6, 'UNITS',
            $6, $7, $8, $9, $10, $11, $12)
         ON CONFLICT (area, product, year, week, target_type)
         DO UPDATE SET
           units_dos        = EXCLUDED.units_dos,
           units_bal        = EXCLUDED.units_bal,
           units_slop       = EXCLUDED.units_slop,
           units_bks        = EXCLUDED.units_bks,
           target_value     = EXCLUDED.target_value,
           quarter          = EXCLUDED.quarter,
           updated_at       = CURRENT_TIMESTAMP`,
        [area, product, year, week, quarter, dos_value, units_bal, units_slop, units_bks,
         company, brand, product_category],
      );
      rowsAffected++;
    }

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      data: {
        message: `Upserted ${rowsAffected} rows untuk ${area}/${product}/${year}`,
        rows_affected: rowsAffected,
      },
    });
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('[POST /api/area-targets]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  } finally {
    client.release();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/area-targets?area=X&product=Y&year=Z[&quarter=Q]
// ─────────────────────────────────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const area    = searchParams.get('area');
  const product = searchParams.get('product');
  const year    = searchParams.get('year');
  const quarter = searchParams.get('quarter');

  if (!area || !product || !year) {
    return NextResponse.json(
      { success: false, error: 'area, product, year wajib diisi' },
      { status: 400 },
    );
  }

  const client = await pool.connect();
  try {
    let query = `DELETE FROM target_data
                 WHERE area=$1 AND product=$2 AND year=$3 AND target_type='WEEKLY'`;
    const params: (string | number)[] = [area, product, Number(year)];

    if (quarter) {
      params.push(Number(quarter));
      query += ` AND quarter=$${params.length}`;
    }

    const res = await client.query(query, params);
    return NextResponse.json({ success: true, data: { rows_deleted: res.rowCount } });
  } catch (err: any) {
    console.error('[DELETE /api/area-targets]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  } finally {
    client.release();
  }
}