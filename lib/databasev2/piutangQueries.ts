/**
 * Query data piutang (receivables), diambil dari file terbaru per area
 * (piutang_files.uploaded_at DESC).
 */

import { pool } from '../db';
import { PiutangRecord } from '@/types/sales';
import { FetchFilters } from './types';

export async function fetchPiutangData(filters?: FetchFilters): Promise<PiutangRecord[]> {
  const conditions: string[] = [];
  const values: any[] = [];

  // Gunakan alias 'r.area' karena kita melakukan JOIN ke r (piutang_records)
  if (filters?.area && filters.area.trim().length > 0) {
    values.push(filters.area.trim());
    conditions.push(`r.area = $${values.length}`);
  } else if (filters?.allowedAreas && filters.allowedAreas.length > 0) {
    values.push(filters.allowedAreas);
    conditions.push(`r.area = ANY($${values.length})`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // JOIN dengan subquery untuk mengambil hanya file terbaru dari tiap area
  const sql = `
    SELECT
      r.faktur,
      r.kode,
      r.outlet,
      r.kota,
      r.kecamatan,
      r.kel_desa            AS "kelDesa",
      COALESCE(r.salesman, '') AS salesman,
      TO_CHAR(r.tanggal,     'DD-Mon-YYYY') AS tanggal,
      TO_CHAR(r.jatuh_tempo, 'DD-Mon-YYYY') AS "jatuhTempo",
      r.hari,
      r.piutang::BIGINT     AS piutang,
      r.giro::BIGINT        AS giro
    FROM piutang_records r
    JOIN (
      -- Ambil ID file paling update untuk masing-masing area
      SELECT DISTINCT ON (area) id
      FROM piutang_files
      ORDER BY area, uploaded_at DESC
    ) latest_files ON r.file_id = latest_files.id
    ${where}
    ORDER BY r.hari DESC NULLS LAST, r.piutang DESC
    LIMIT 10000
  `;

  const client = await pool.connect();
  try {
    const result = await client.query(sql, values);
    return result.rows.map((r: any): PiutangRecord => ({
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
  } finally {
    client.release();
  }
}