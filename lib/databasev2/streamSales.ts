/**
 * Streaming query sales_records pakai pg-cursor supaya tidak OOM di dataset
 * besar (~jutaan baris). Dipanggil dari index.ts (processSalesRecords).
 */

import Cursor from 'pg-cursor';
import { pool } from '../db';
import { isoWeekToDateRange } from './dateUtils';
import { FetchFilters } from './types';

const STREAM_BATCH_SIZE = 20_000;

// ─── Streaming query dengan pg-cursor ────────────────────────────────────────
export async function streamSalesRecords(
  filters: FetchFilters | undefined,
  onBatch: (rows: any[]) => void,
): Promise<void> {
  const conditions: string[] = [];
  const values: any[]        = [];

  if (filters?.area && filters.area.trim().length > 0) {
    values.push(filters.area.trim());
    conditions.push(`area = $${values.length}`);
  } else if (filters?.allowedAreas && filters.allowedAreas.length > 0) {
    values.push(filters.allowedAreas);
    conditions.push(`area = ANY($${values.length})`);
  }

  const dateConditions: string[] = [];

  const addDateRange = (isoYear: number, weekStart: number, weekEnd: number) => {
    const { startDate, endDate } = isoWeekToDateRange(isoYear, weekStart, weekEnd);
    values.push(startDate.toISOString().slice(0, 10));
    const idxStart = values.length;
    values.push(endDate.toISOString().slice(0, 10));
    const idxEnd = values.length;
    dateConditions.push(`date BETWEEN $${idxStart} AND $${idxEnd}`);
  };

  if (filters?.year1 !== undefined) {
    const ws = filters.weekStart1 ?? 1;
    const we = filters.weekEnd1   ?? 53;
    addDateRange(filters.year1, ws, we);
    console.log(` year1=${filters.year1} W${ws}-W${we} → date range ditambahkan`);
  }

  if (filters?.year2 !== undefined && filters.year2 !== filters.year1) {
    const ws = filters.weekStart2 ?? 1;
    const we = filters.weekEnd2   ?? 53;
    addDateRange(filters.year2, ws, we);
    console.log(` year2=${filters.year2} W${ws}-W${we} → date range ditambahkan`);
  }

  if (dateConditions.length === 0 && filters?.year1 === undefined && filters?.year2 === undefined) {
    console.warn('streamSalesRecords dipanggil tanpa year filter — fetch semua tanggal');
  } else if (dateConditions.length > 0) {
    conditions.push(`(${dateConditions.join(' OR ')})`);
  }

  if (filters?.product && filters.product.trim().length > 0) {
    values.push(filters.product.trim());
    conditions.push(`product = $${values.length}`);
  }

  if (filters?.city && filters.city.trim().length > 0) {
    values.push(filters.city.trim());
    conditions.push(`city = $${values.length}`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  console.log(`\nstreamSalesRecords SQL conditions: ${conditions.join(' AND ') || '(none)'}`);

  const query = `
    SELECT
      id, file_id, grand_total, week, date, product, category,
      customer_no, customer, customer_type, salesman,
      village, district, city, area,
      units_bks, units_slop, units_bal, units_dos, omzet
    FROM sales_records
    ${whereClause}
  `;

  const client = await pool.connect();
  try {
    const cursor  = client.query(new Cursor(query, values));
    let totalRows = 0;

    while (true) {
      const rows: any[] = await new Promise<any[]>((resolve, reject) => {
        cursor.read(STREAM_BATCH_SIZE, (err: Error | null | undefined, result: any[]) => {
          if (err) reject(err);
          else resolve(result);
        });
      });

      if (rows.length === 0) break;
      totalRows += rows.length;
      onBatch(rows);
    }

    await new Promise<void>((resolve, reject) => {
      cursor.close((err: Error | null) => (err ? reject(err) : resolve()));
    });

    console.log(`Streaming selesai: ${totalRows} records diproses`);
  } finally {
    client.release();
  }
}