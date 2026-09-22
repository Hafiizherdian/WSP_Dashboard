/**
 * Semua query yang berhubungan dengan tabel `target_data` / `areas`:
 * target per minggu, per produk, per kuartal, dan resolusi daftar area
 * yang jadi scope target (root vs user dengan allowedAreas).
 */

import { pool } from '../db';
import {
  ProductTargetRow,
  ProductQuarterTargetRow,
  WeekQuarterTargetRow,
  ProductQuarterRawRow,
  ProductWeekRawRow,
  TargetQueriesResult,
} from './types';

// ─── Query area targets ───────────────────────────────────────────────────────
export async function queryAreaTargets(areaId: string): Promise<{ [key: string]: number }> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT quarterly_targets FROM areas WHERE id = $1 LIMIT 1`,
      [areaId]
    );
    if (result.rows.length > 0 && result.rows[0].quarterly_targets) {
      return result.rows[0].quarterly_targets as { [key: string]: number };
    }
    return {};
  } finally {
    client.release();
  }
}

export async function queryProductTargets(
  areaId: string,
  year:   number,
): Promise<Map<string, ProductTargetRow>> {
  const client = await pool.connect();
  try {
    const result = await client.query<{
      product:    string;
      units_dos:  string;
      units_bks:  string;
      units_slop: string;
      units_bal:  string;
    }>(
      `SELECT
         product,
         SUM(COALESCE(units_dos,  0)) AS units_dos,
         SUM(COALESCE(units_bks,  0)) AS units_bks,
         SUM(COALESCE(units_slop, 0)) AS units_slop,
         SUM(COALESCE(units_bal,  0)) AS units_bal
       FROM target_data
       WHERE area        = $1
         AND year        = $2
         AND target_type = 'WEEKLY'
         AND product     != 'DEFAULT_PRODUCT'
       GROUP BY product`,
      [areaId, year],
    );

    const map = new Map<string, ProductTargetRow>();
    result.rows.forEach(r => {
      map.set(r.product, {
        product:    r.product,
        units_dos:  parseFloat(r.units_dos)  || 0,
        units_bks:  parseFloat(r.units_bks)  || 0,
        units_slop: parseFloat(r.units_slop) || 0,
        units_bal:  parseFloat(r.units_bal)  || 0,
      });
    });

    console.log(`Product targets loaded: ${map.size} produk untuk area=${areaId} tahun=${year}`);
    return map;
  } finally {
    client.release();
  }
}

export async function queryProductQuarterTargets(
  areaId: string,
  year:   number,
): Promise<Map<string, Map<number, ProductQuarterTargetRow>>> {
  const client = await pool.connect();
  try {
    const result = await client.query<{
      product:    string;
      quarter:    string;
      units_dos:  string;
      units_bks:  string;
      units_slop: string;
      units_bal:  string;
    }>(
      `SELECT
         product,
         quarter,
         SUM(COALESCE(units_dos,  0)) AS units_dos,
         SUM(COALESCE(units_bks,  0)) AS units_bks,
         SUM(COALESCE(units_slop, 0)) AS units_slop,
         SUM(COALESCE(units_bal,  0)) AS units_bal
       FROM target_data
       WHERE area        = $1
         AND year        = $2
         AND target_type = 'WEEKLY'
         AND product     != 'DEFAULT_PRODUCT'
       GROUP BY product, quarter
       ORDER BY product, quarter`,
      [areaId, year],
    );

    const map = new Map<string, Map<number, ProductQuarterTargetRow>>();
    result.rows.forEach(r => {
      const qNum = Number(r.quarter);
      if (!map.has(r.product)) map.set(r.product, new Map());
      map.get(r.product)!.set(qNum, {
        product:    r.product,
        quarter:    qNum,
        units_dos:  parseFloat(r.units_dos)  || 0,
        units_bks:  parseFloat(r.units_bks)  || 0,
        units_slop: parseFloat(r.units_slop) || 0,
        units_bal:  parseFloat(r.units_bal)  || 0,
      });
    });

    return map;
  } finally {
    client.release();
  }
}

// ─── v9: Resolve area IDs untuk target query ─────────────────────────────────
export async function resolveTargetAreas(
  areaId?:       string,
  allowedAreas?: string[],
): Promise<string[]> {
  if (areaId && areaId.trim().length > 0) {
    return [areaId.trim()];
  }
  if (allowedAreas && allowedAreas.length > 0) {
    return allowedAreas;
  }
  const client = await pool.connect();
  try {
    const res = await client.query<{ id: string }>(`SELECT id FROM areas ORDER BY id`);
    const ids  = res.rows.map(r => r.id);
    console.log(`[resolveTargetAreas] Root all-area: ${ids.length} area ditemukan`);
    return ids;
  } finally {
    client.release();
  }
}

// ─── B1-parallel: week×quarter, product×quarter, product×week targets ────────
// Dipakai di index.ts (processSalesRecords) untuk prefetch target secara
// paralel dengan streaming sales records, lalu diteruskan ke generateQuarterlyData
// supaya tidak query dua kali.
export async function fetchTargetQueriesParallel(
  targetAreas: string[],
  year:        number,
): Promise<TargetQueriesResult> {
  const weekQuarterPromise = pool.connect().then(async client => {
    try {
      const res = await client.query<WeekQuarterTargetRow>(
        `SELECT
           week, quarter,
           SUM(COALESCE(units_dos,  0)) AS units_dos,
           SUM(COALESCE(units_bks,  0)) AS units_bks,
           SUM(COALESCE(units_slop, 0)) AS units_slop,
           SUM(COALESCE(units_bal,  0)) AS units_bal
         FROM target_data
         WHERE area        = ANY($1)
           AND year        = $2
           AND target_type = 'WEEKLY'
         GROUP BY week, quarter
         ORDER BY week`,
        [targetAreas, year],
      );
      console.log(`[B1-parallel] Week×quarter targets: ${res.rows.length} rows`);
      return res.rows;
    } finally { client.release(); }
  });

  const productQuarterPromise = pool.connect().then(async client => {
    try {
      const res = await client.query<ProductQuarterRawRow>(
        `SELECT
           product, quarter,
           SUM(COALESCE(units_dos,  0)) AS units_dos,
           SUM(COALESCE(units_bks,  0)) AS units_bks,
           SUM(COALESCE(units_slop, 0)) AS units_slop,
           SUM(COALESCE(units_bal,  0)) AS units_bal
         FROM target_data
         WHERE area        = ANY($1)
           AND year        = $2
           AND target_type = 'WEEKLY'
           AND product     != 'DEFAULT_PRODUCT'
         GROUP BY product, quarter
         ORDER BY product, quarter`,
        [targetAreas, year],
      );
      console.log(`[B1-parallel] Product×quarter targets: ${res.rows.length} rows`);
      return res.rows;
    } finally { client.release(); }
  });

  const productWeekPromise = pool.connect().then(async client => {
    try {
      const res = await client.query<ProductWeekRawRow>(
        `SELECT
           product, week,
           SUM(COALESCE(units_dos,  0)) AS units_dos,
           SUM(COALESCE(units_bks,  0)) AS units_bks,
           SUM(COALESCE(units_slop, 0)) AS units_slop,
           SUM(COALESCE(units_bal,  0)) AS units_bal
         FROM target_data
         WHERE area        = ANY($1)
           AND year        = $2
           AND target_type = 'WEEKLY'
           AND product     != 'DEFAULT_PRODUCT'
         GROUP BY product, week
         ORDER BY product, week`,
        [targetAreas, year],
      );
      console.log(`[B1-parallel] Product×week targets: ${res.rows.length} rows`);
      return res.rows;
    } finally { client.release(); }
  });

  return Promise.all([weekQuarterPromise, productQuarterPromise, productWeekPromise]);
}

// ─── Fallback serial fetch (dipakai generateQuarterlyData saat preFetchedTargets
//     null, mis. dipanggil dari luar alur fetchSalesData utama) ───────────────
export async function fetchTargetQueriesSerial(
  targetAreas: string[],
  year:        number,
): Promise<TargetQueriesResult> {
  const client2 = await pool.connect();
  try {
    const [resWQ, resPQ, resPW] = await Promise.all([
      client2.query<WeekQuarterTargetRow>(
        `SELECT week, quarter,
           SUM(COALESCE(units_dos,0)) AS units_dos, SUM(COALESCE(units_bks,0)) AS units_bks,
           SUM(COALESCE(units_slop,0)) AS units_slop, SUM(COALESCE(units_bal,0)) AS units_bal
         FROM target_data
         WHERE area = ANY($1) AND year = $2 AND target_type = 'WEEKLY'
         GROUP BY week, quarter ORDER BY week`,
        [targetAreas, year],
      ),
      client2.query<ProductQuarterRawRow>(
        `SELECT product, quarter,
           SUM(COALESCE(units_dos,0)) AS units_dos, SUM(COALESCE(units_bks,0)) AS units_bks,
           SUM(COALESCE(units_slop,0)) AS units_slop, SUM(COALESCE(units_bal,0)) AS units_bal
         FROM target_data
         WHERE area = ANY($1) AND year = $2 AND target_type = 'WEEKLY'
           AND product != 'DEFAULT_PRODUCT'
         GROUP BY product, quarter ORDER BY product, quarter`,
        [targetAreas, year],
      ),
      client2.query<ProductWeekRawRow>(
        `SELECT product, week,
           SUM(COALESCE(units_dos,0)) AS units_dos, SUM(COALESCE(units_bks,0)) AS units_bks,
           SUM(COALESCE(units_slop,0)) AS units_slop, SUM(COALESCE(units_bal,0)) AS units_bal
         FROM target_data
         WHERE area = ANY($1) AND year = $2 AND target_type = 'WEEKLY'
           AND product != 'DEFAULT_PRODUCT'
         GROUP BY product, week ORDER BY product, week`,
        [targetAreas, year],
      ),
    ]);
    return [resWQ.rows, resPQ.rows, resPW.rows];
  } finally {
    client2.release();
  }
}