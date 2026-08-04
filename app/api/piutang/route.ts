/**
 * GET  /api/piutang          — ambil list records piutang
 * DELETE /api/piutang?fileId=xxx — hapus file + records
 *
 * Query params GET (semua opsional):
 *   area, kota, salesman, fileId, minHari, maxHari, search, limit
 */

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { PiutangRecord } from '@/types/sales';

export async function GET(req: NextRequest) {
  try {
    const sp       = req.nextUrl.searchParams;
    const area     = sp.get('area')?.trim()     || '';
    const kota     = sp.get('kota')?.trim()     || '';
    const salesman = sp.get('salesman')?.trim()  || '';
    const fileId   = sp.get('fileId')?.trim()    || '';
    const search   = sp.get('search')?.trim()    || '';
    const minHari  = sp.get('minHari') ? parseInt(sp.get('minHari')!) : null;
    const maxHari  = sp.get('maxHari') ? parseInt(sp.get('maxHari')!) : null;
    const limit    = Math.min(parseInt(sp.get('limit') ?? '5000'), 20000);

    const conditions: string[] = [];
    const values: any[] = [];

    if (area) {
      values.push(area);
      conditions.push(`area = $${values.length}`);
    }
    if (kota) {
      values.push(kota);
      conditions.push(`kota = $${values.length}`);
    }
    if (salesman) {
      values.push(salesman);
      conditions.push(`salesman = $${values.length}`);
    }
    if (fileId) {
      values.push(fileId);
      conditions.push(`file_id = $${values.length}`);
    }
    if (minHari !== null && !isNaN(minHari)) {
      values.push(minHari);
      conditions.push(`hari >= $${values.length}`);
    }
    if (maxHari !== null && !isNaN(maxHari)) {
      values.push(maxHari);
      conditions.push(`hari <= $${values.length}`);
    }
    if (search) {
      values.push(`%${search}%`);
      const idx = values.length;
      conditions.push(
        `(faktur ILIKE $${idx} OR kode ILIKE $${idx} OR outlet ILIKE $${idx} OR kecamatan ILIKE $${idx} OR kel_desa ILIKE $${idx})`
      );
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    values.push(limit);

    const sql = `
      SELECT
        faktur, kode, outlet, kota, kecamatan,
        kel_desa   AS "kelDesa",
        salesman,
        TO_CHAR(tanggal,     'DD-Mon-YYYY') AS tanggal,
        TO_CHAR(jatuh_tempo, 'DD-Mon-YYYY') AS "jatuhTempo",
        hari,
        piutang,
        giro
      FROM piutang_records
      ${where}
      ORDER BY hari DESC NULLS LAST, piutang DESC
      LIMIT $${values.length}
    `;

    const client = await pool.connect();
    try {
      const result = await client.query(sql, values);
      const data: PiutangRecord[] = result.rows.map(r => ({
        faktur:     r.faktur,
        kode:       r.kode,
        outlet:     r.outlet,
        kota:       r.kota,
        kecamatan:  r.kecamatan,
        kelDesa:    r.kelDesa ?? '',
        salesman:   r.salesman ?? '',
        tanggal:    r.tanggal  ?? '',
        jatuhTempo: r.jatuhTempo ?? '',
        hari:       r.hari !== null ? Number(r.hari) : null,
        piutang:    Number(r.piutang),
        giro:       Number(r.giro),
      }));
      return NextResponse.json({ success: true, data, count: data.length });
    } finally {
      client.release();
    }

  } catch (err: any) {
    console.error('Piutang GET error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const fileId = req.nextUrl.searchParams.get('fileId')?.trim();
    if (!fileId) {
      return NextResponse.json({ success: false, error: 'fileId required' }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const del = await client.query(`DELETE FROM piutang_records WHERE file_id = $1`, [fileId]);
      await client.query(`DELETE FROM piutang_files WHERE id = $1`, [fileId]);
      await client.query('COMMIT');
      return NextResponse.json({ success: true, deleted: del.rowCount });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

  } catch (err: any) {
    console.error('Piutang DELETE error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}