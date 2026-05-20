/**
 * Database utilities untuk dashboard
 * Fungsi untuk fetch dan process data dari PostgreSQL
 *
 * PERUBAHAN v2 (fix OOM):
 *   - querySalesRecords dihapus, diganti streamSalesRecords (pg-cursor, batch 10k)
 *   - processSalesRecords tidak lagi menampung raw records di array besar;
 *     semua agregasi dilakukan on-the-fly saat streaming
 *   - generateOutletData & generateYearOnYearGrowth diinline ke streaming loop
 *   - generateQuarterlyData & generateL4WC4WData tetap menerima "virtual records"
 *     yang direkonstruksi dari Map agregat (jauh lebih kecil dari raw records)
 *
 * PERUBAHAN v3 (fix RangeError: too many function arguments):
 *   - getWeekRangeFromData: ganti Array.from().sort() dengan reduce loop
 *   - sortedYears/sortedWeeks: ganti Array.from() spread dengan forEach push
 *   - Semua Math.max/Math.min pada array besar diganti dengan reduce loop
 *
 * PERUBAHAN v4 (fix outletData terpotong / truncation):
 *   - outletKey tanpa week → aggregate per customer×product×year
 *
 * PERUBAHAN v5 (fix ISO week boundary):
 *   - resolveWeekYear: gunakan calcISOWeekYear untuk validasi aktual
 *   - Tidak hardcode day >= 29, biarkan kalkulasi ISO yang memutuskan
 *
 * PERUBAHAN v6 (fix doz tidak terhitung untuk Des 29-31):
 *   - Tambah debug log untuk trace record boundary Des/Jan
 *   - Pastikan weekProductMap key menggunakan isoYear bukan rawYear
 *
 * PERUBAHAN v7 (optimasi performa — output identik):
 *   - reconstructVirtualRecords dihapus total; weekProductMap + omzetByProductWeek
 *     dipass langsung ke generateQuarterlyData dan generateL4WC4WData
 *   - generateQuarterlyData: satu pass pre-group byWeek (O(N)) menggantikan
 *     O(N×52) filter berulang per kuartal dan per minggu
 *   - generateL4WC4WData: iterasi langsung weekProductMap, tidak pakai array virtual
 *   - generateProductL4WC1WData: terima Map<string,UnitAgg> langsung (no re-iterate)
 *   - Semua reduce 4× per unit type diganti lookup O(1) dari pre-grouped Map
 *
 * PERUBAHAN v8 (optimasi performa lanjutan — output identik):
 *   - B4: Target DB queries dijalankan PARALEL dengan streamSalesRecords via Promise.all
 *         → eliminasi idle time antara streaming selesai dan query target mulai
 *   - B1: 3 target queries serial digabung jadi Promise.all(3 queries paralel)
 *         → 3 round-trips serial → 1 round-trip paralel
 *   - B3: productTotalsMap di-preallocate sekali di luar loop minggu, di-reset in-place
 *         → tidak ada new Map() per iterasi week
 *   - B6: monthlyBreakdown menggunakan satu-pass pre-grouping (Map bucket per bulan)
 *         → ganti filter() O(4W) dengan O(W) single pass
 *   - B2: outletData di-sort server-side (dozNet desc) sebelum dikirim ke client
 *         → client tidak perlu sort tambahan, first-render lebih cepat
 *
 * PERUBAHAN v9 (fix target multi-area):
 *   - resolveTargetAreas: helper baru untuk resolve area IDs sebelum target query
 *     → areaId spesifik    → [areaId]
 *     → allowedAreas user  → allowedAreas (multi-area sum)
 *     → root tanpa filter  → semua area dari DB (SELECT id FROM areas)
 *   - Target queries: ganti WHERE area = $1 → WHERE area = ANY($1)
 *     → support array area, GROUP BY tetap menangani sum otomatis lintas area
 *   - generateQuarterlyData: terima targetAreas[] sebagai parameter tambahan
 *     → tidak lagi bergantung pada areaId tunggal
 *   - processSalesRecords: targetAreasPromise berjalan paralel sebelum streaming
 *     → resolvedTargetAreas dipass ke generateQuarterlyData
 */

import Cursor from 'pg-cursor';
import { pool } from './db';
import {
  SalesData, WeeklySales, QuarterlyData, WeekComparison,
  L4WC4WData, YearOnYearGrowth, ComparisonWeeks,
  WeekComparisonProductDetail, WeeklyTrendData, OutletSalesData,
  ProductL4WC1WData, WeeklyBreakdown, MonthlyBreakdown, QuarterlyProductDetail,
} from '@/types/sales';
import { getProductCategory } from './productCategories';

const OMZET_SCALE = 1;
const STREAM_BATCH_SIZE = 20_000;

function getOmzetValue(record: any): number {
  if (!record) return 0;
  if (typeof record.omzetValue === 'number') return record.omzetValue;
  const raw = record.omzet;
  const numeric = typeof raw === 'number' ? raw : parseFloat(raw ?? '0');
  const normalized = Number.isFinite(numeric) ? numeric * OMZET_SCALE : 0;
  record.omzetValue = normalized;
  return normalized;
}

function getUnitValue(record: any, unitType: string): number {
  switch (unitType) {
    case 'units_bks':  return Number(record.units_bks)  || 0;
    case 'units_slop': return Number(record.units_slop) || 0;
    case 'units_bal':  return Number(record.units_bal)  || 0;
    case 'units_dos':
    default:           return Number(record.units_dos)  || 0;
  }
}

interface FetchFilters {
  year1?: number;
  year2?: number;
  product?: string;
  city?: string;
  area?: string;
  weekStart1?: number;
  weekEnd1?: number;
  weekStart2?: number;
  weekEnd2?: number;
  selectedUnit?: string;
  allowedAreas?: string[];
}

// ─── ISO week cross-year resolution ──────────────────────────────────────────

function parseDateLocal(dateVal: any): { year: number; month: number; day: number } {
  let str: string | null = null;
  if (typeof dateVal === 'string') {
    str = dateVal;
  } else if (dateVal instanceof Date) {
    const utcHour = dateVal.getUTCHours();
    if (utcHour < 12) {
      const wibMs   = dateVal.getTime() + 7 * 60 * 60 * 1000;
      const wibDate = new Date(wibMs);
      return {
        year:  wibDate.getUTCFullYear(),
        month: wibDate.getUTCMonth(),
        day:   wibDate.getUTCDate(),
      };
    }
    return {
      year:  dateVal.getUTCFullYear(),
      month: dateVal.getUTCMonth(),
      day:   dateVal.getUTCDate(),
    };
  }

  if (str) {
    const match = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      return {
        year:  parseInt(match[1]),
        month: parseInt(match[2]) - 1,
        day:   parseInt(match[3]),
      };
    }
  }

  const d = new Date(dateVal);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth(), day: d.getUTCDate() };
}

function calcISOWeekYear(year: number, month: number, day: number): { week: number; isoYear: number } {
  const d      = new Date(Date.UTC(year, month, day));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const isoYear   = d.getUTCFullYear();
  const yearStart = new Date(Date.UTC(isoYear, 0, 1));
  const week      = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return { week, isoYear };
}

function resolveWeekYear(record: any): { week: number; year: number } {
  const { year: rawYear, month, day } = parseDateLocal(record.date);
  const dbWeek = Number(record.week);

  if (month === 11 && dbWeek === 1) {
    return { week: 1, year: rawYear + 1 };
  }

  if (month === 0 && (dbWeek === 52 || dbWeek === 53)) {
    return { week: dbWeek, year: rawYear - 1 };
  }

  return { week: dbWeek, year: rawYear };
}

function getCalendarYearsToFetch(isoYears: number[]): number[] {
  const calYears = new Set<number>();
  for (const isoYear of isoYears) {
    calYears.add(isoYear - 1);
    calYears.add(isoYear);
    calYears.add(isoYear + 1);
  }
  return Array.from(calYears).sort((a, b) => a - b);
}

// ─── ISO week → date range ────────────────────────────────────────────────────
function isoWeekToDateRange(
  isoYear:   number,
  weekStart: number,
  weekEnd:   number,
): { startDate: Date; endDate: Date } {
  const jan4    = new Date(Date.UTC(isoYear, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7;
  const mondayW1 = new Date(jan4);
  mondayW1.setUTCDate(jan4.getUTCDate() - (jan4Day - 1));

  const startDate = new Date(mondayW1);
  startDate.setUTCDate(mondayW1.getUTCDate() + (weekStart - 1) * 7);

  const endDate = new Date(mondayW1);
  endDate.setUTCDate(mondayW1.getUTCDate() + (weekEnd - 1) * 7 + 6 + 3);

  startDate.setUTCDate(startDate.getUTCDate() - 3);

  console.log(
    `📅 isoWeekToDateRange: ISO ${isoYear} W${weekStart}-W${weekEnd}` +
    ` → ${startDate.toISOString().slice(0, 10)} .. ${endDate.toISOString().slice(0, 10)}`,
  );

  return { startDate, endDate };
}

// ─── Streaming query dengan pg-cursor ────────────────────────────────────────
async function streamSalesRecords(
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
    console.log(`📡 year1=${filters.year1} W${ws}-W${we} → date range ditambahkan`);
  }

  if (filters?.year2 !== undefined && filters.year2 !== filters.year1) {
    const ws = filters.weekStart2 ?? 1;
    const we = filters.weekEnd2   ?? 53;
    addDateRange(filters.year2, ws, we);
    console.log(`📡 year2=${filters.year2} W${ws}-W${we} → date range ditambahkan`);
  }

  if (dateConditions.length === 0 && filters?.year1 === undefined && filters?.year2 === undefined) {
    console.warn('⚠️  streamSalesRecords dipanggil tanpa year filter — fetch semua tanggal');
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

  console.log(`\n🔍 streamSalesRecords SQL conditions: ${conditions.join(' AND ') || '(none)'}`);

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

    console.log(`✅ Streaming selesai: ${totalRows} records diproses`);
  } finally {
    client.release();
  }
}

// ─── Query area targets ───────────────────────────────────────────────────────
async function queryAreaTargets(areaId: string): Promise<{ [key: string]: number }> {
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

interface ProductTargetRow {
  product:    string;
  units_dos:  number;
  units_bks:  number;
  units_slop: number;
  units_bal:  number;
}

async function queryProductTargets(
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

    console.log(`✅ Product targets loaded: ${map.size} produk untuk area=${areaId} tahun=${year}`);
    return map;
  } finally {
    client.release();
  }
}

interface ProductQuarterTargetRow {
  product:    string;
  quarter:    number;
  units_dos:  number;
  units_bks:  number;
  units_slop: number;
  units_bal:  number;
}

async function queryProductQuarterTargets(
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

// ─── Tipe internal untuk agregasi streaming ───────────────────────────────────
interface UnitAgg {
  bks:  number;
  slop: number;
  bal:  number;
  dos:  number;
}

interface OutletAgg {
  dozNet:       number;
  weeklyDozNet: Record<number, number>;
  city:         string;
  district:     string;
  village:      string;
  salesman:     string;
  customer_no:  string;
  year:         number;
  outletType:   string;
  category:     string;
  product:      string;
  customer:     string;
  weekMin:      number;
  weekMax:      number;
}

// ─── OPTIMASI v7: Pre-grouped Map untuk akses O(1) ───────────────────────────
function buildByWeekMap(
  weekProductMap: Map<string, UnitAgg>,
): Map<number, Map<number, Map<string, UnitAgg>>> {
  const byYear = new Map<number, Map<number, Map<string, UnitAgg>>>();

  for (const [key, agg] of weekProductMap) {
    const firstDash  = key.indexOf('-');
    const secondDash = key.indexOf('-', firstDash + 1);
    const year       = parseInt(key.slice(0, firstDash));
    const week       = parseInt(key.slice(firstDash + 1, secondDash));
    const product    = key.slice(secondDash + 1);

    if (!byYear.has(year)) byYear.set(year, new Map());
    const byWeek = byYear.get(year)!;
    if (!byWeek.has(week)) byWeek.set(week, new Map());
    byWeek.get(week)!.set(product, agg);
  }

  return byYear;
}

// ─── v9: Resolve area IDs untuk target query ─────────────────────────────────
// Jika ada areaId spesifik → [areaId]
// Jika ada allowedAreas    → allowedAreas (user multi-area, di-sum)
// Jika root tanpa filter   → semua area dari DB
async function resolveTargetAreas(
  areaId?:       string,
  allowedAreas?: string[],
): Promise<string[]> {
  if (areaId && areaId.trim().length > 0) {
    return [areaId.trim()];
  }
  if (allowedAreas && allowedAreas.length > 0) {
    return allowedAreas;
  }
  // Root tanpa filter area → ambil semua area dari DB
  const client = await pool.connect();
  try {
    const res = await client.query<{ id: string }>(`SELECT id FROM areas ORDER BY id`);
    const ids  = res.rows.map(r => r.id);
    console.log(`✅ [resolveTargetAreas] Root all-area: ${ids.length} area ditemukan`);
    return ids;
  } finally {
    client.release();
  }
}

export async function fetchSalesData(filters?: FetchFilters): Promise<SalesData> {
  try {
    console.log('🔍 fetchSalesData - Filter diterima:', JSON.stringify(filters));
    return await processSalesRecords(filters);
  } catch (error) {
    console.error('Error fetching sales data:', error);
    return {
      weeklyData:       [],
      quarterlyData:    generateEmptyQuarterlyData(),
      weekComparisons:  [],
      l4wc4wData:       generateEmptyL4WC4WData(),
      yearOnYearGrowth: generateEmptyYearOnYearGrowth(),
      comparisonYears:  { previousYear: null, currentYear: null },
      comparisonWeeks:  generateEmptyComparisonWeeks(),
      outletData:       [],
    };
  }
}

// ─── OPTIMASI v8: Row types untuk parallel target queries ────────────────────
interface WeekQuarterTargetRow {
  week: string; quarter: string;
  units_dos: string; units_bks: string; units_slop: string; units_bal: string;
}
interface ProductQuarterRawRow {
  product: string; quarter: string;
  units_dos: string; units_bks: string; units_slop: string; units_bal: string;
}
interface ProductWeekRawRow {
  product: string; week: string;
  units_dos: string; units_bks: string; units_slop: string; units_bal: string;
}

async function processSalesRecords(filters?: FetchFilters): Promise<SalesData> {
  const areaId       = filters?.area;
  const selectedUnit = filters?.selectedUnit || 'units_dos';

  const clampWeek = (w: number) => Math.max(1, Math.min(52, w));

  const year1 = filters?.year1;
  const year2 = filters?.year2;

  const preRangeYear1: { start: number; end: number } | null =
    (filters?.weekStart1 !== undefined || filters?.weekEnd1 !== undefined)
      ? { start: clampWeek(filters?.weekStart1 ?? 1), end: clampWeek(filters?.weekEnd1 ?? 52) }
      : null;

  const preRangeYear2: { start: number; end: number } | null =
    (filters?.weekStart2 !== undefined || filters?.weekEnd2 !== undefined)
      ? { start: clampWeek(filters?.weekStart2 ?? 1), end: clampWeek(filters?.weekEnd2 ?? 52) }
      : null;

  console.log(`\n🔧 [PRE-RANGE] year1=${year1} range=${preRangeYear1 ? `W${preRangeYear1.start}-W${preRangeYear1.end}` : 'all'}`);
  console.log(`   [PRE-RANGE] year2=${year2} range=${preRangeYear2 ? `W${preRangeYear2.start}-W${preRangeYear2.end}` : 'all'}`);

  const weekProductMap     = new Map<string, UnitAgg>();
  const weekYearSet        = new Map<number, Set<number>>();
  const allProductsSet     = new Set<string>();
  const outletAggMap       = new Map<string, OutletAgg>();
  const yearUnitMap        = new Map<number, number>();
  const omzetByProductWeek = new Map<string, number>();

  let crossYearCount    = 0;
  let totalRecordCount  = 0;
  let filteredOutByWeek = 0;
  let boundaryDosTotal  = 0;

  const requestedISOYears = new Set<number>();
  if (filters?.year1 !== undefined) requestedISOYears.add(filters.year1);
  if (filters?.year2 !== undefined) requestedISOYears.add(filters.year2);

  const isWeekInRange = (isoYear: number, isoWeek: number): boolean => {
    if (isoYear === year1 && preRangeYear1 !== null) {
      return isoWeek >= preRangeYear1.start && isoWeek <= preRangeYear1.end;
    }
    if (isoYear === year2 && preRangeYear2 !== null) {
      return isoWeek >= preRangeYear2.start && isoWeek <= preRangeYear2.end;
    }
    return true;
  };

  // ── v9: Resolve target areas SEBELUM streaming (paralel) ─────────────────
  // targetAreasPromise berjalan di background selama streaming
  const targetAreasPromise = resolveTargetAreas(filters?.area, filters?.allowedAreas);

  const effectiveYearForTargets = year2 ?? year1;

  // ── v9: Target queries pakai area array (ANY($1)) ─────────────────────────
  // Mendukung: area spesifik, multi-area user, root semua area
  const targetQueriesPromise: Promise<[
    WeekQuarterTargetRow[],
    ProductQuarterRawRow[],
    ProductWeekRawRow[],
  ] | null> = effectiveYearForTargets !== undefined
    ? targetAreasPromise.then(targetAreas => {
        if (targetAreas.length === 0) {
          console.log(`ℹ️  [target] Tidak ada area untuk di-query target`);
          return null;
        }
        console.log(`🎯 [target] Fetching untuk ${targetAreas.length} area: [${targetAreas.join(', ')}]`);
        return Promise.all([
          // ── Query A: week × quarter aggregated targets ──────────────────
          pool.connect().then(async client => {
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
                [targetAreas, effectiveYearForTargets],
              );
              console.log(`✅ [B1-parallel] Week×quarter targets: ${res.rows.length} rows`);
              return res.rows;
            } finally { client.release(); }
          }),

          // ── Query B: product × quarter targets ─────────────────────────
          pool.connect().then(async client => {
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
                [targetAreas, effectiveYearForTargets],
              );
              console.log(`✅ [B1-parallel] Product×quarter targets: ${res.rows.length} rows`);
              return res.rows;
            } finally { client.release(); }
          }),

          // ── Query C: product × week targets ────────────────────────────
          pool.connect().then(async client => {
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
                [targetAreas, effectiveYearForTargets],
              );
              console.log(`✅ [B1-parallel] Product×week targets: ${res.rows.length} rows`);
              return res.rows;
            } finally { client.release(); }
          }),
        ]);
      })
    : Promise.resolve(null);

  // ── Streaming dan target queries jalan BERSAMAAN ──────────────────────────
  await Promise.all([
    streamSalesRecords(filters, (batch) => {
      for (const record of batch) {
        totalRecordCount++;

        const { month, day } = parseDateLocal(record.date);
        const rawDbWeek      = Number(record.week);
        const resolved       = resolveWeekYear(record);
        const isoYear        = resolved.year;
        const isoWeek        = resolved.week;
        const rawDateYear    = parseDateLocal(record.date).year;

        if ((month === 11 && day >= 28) || (month === 0 && day <= 3)) {
          console.log(`[BOUNDARY] date=${record.date} day=${day} month=${month+1} dbWeek=${rawDbWeek} → isoYear=${isoYear} isoWeek=${isoWeek} dos=${record.units_dos}`);
        }

        if (isoYear !== rawDateYear || isoWeek !== rawDbWeek) crossYearCount++;

        if (requestedISOYears.size > 0 && !requestedISOYears.has(isoYear)) {
          if ((month === 11 && day >= 28) || (month === 0 && day <= 3)) {
            console.log(`[BOUNDARY-SKIP] isoYear=${isoYear} tidak ada di requestedISOYears=${[...requestedISOYears]}`);
          }
          continue;
        }

        if (!isWeekInRange(isoYear, isoWeek)) {
          filteredOutByWeek++;
          continue;
        }

        if (!weekYearSet.has(isoYear)) weekYearSet.set(isoYear, new Set());
        weekYearSet.get(isoYear)!.add(isoWeek);

        const product = record.product || 'Produk Tidak Diketahui';
        allProductsSet.add(product);

        const bks  = Number(record.units_bks)  || 0;
        const slop = Number(record.units_slop) || 0;
        const bal  = Number(record.units_bal)  || 0;
        const dos  = Number(record.units_dos)  || 0;
        const omz  = (() => {
          const raw     = record.omzet;
          const numeric = typeof raw === 'number' ? raw : parseFloat(raw ?? '0');
          return Number.isFinite(numeric) ? numeric * OMZET_SCALE : 0;
        })();

        if ((month === 11 && day >= 28) || (month === 0 && day <= 3)) {
          boundaryDosTotal += dos;
          console.log(`[BOUNDARY-AGG] wpKey=${isoYear}-${isoWeek}-${product} dos=${dos} runningTotal=${boundaryDosTotal}`);
        }

        const wpKey    = `${isoYear}-${isoWeek}-${product}`;
        const existing = weekProductMap.get(wpKey);
        if (existing) {
          existing.bks  += bks;
          existing.slop += slop;
          existing.bal  += bal;
          existing.dos  += dos;
        } else {
          weekProductMap.set(wpKey, { bks, slop, bal, dos });
        }

        omzetByProductWeek.set(wpKey, (omzetByProductWeek.get(wpKey) || 0) + omz);

        const unitVal = selectedUnit === 'units_bks'  ? bks
                      : selectedUnit === 'units_slop' ? slop
                      : selectedUnit === 'units_bal'  ? bal
                      : dos;
        yearUnitMap.set(isoYear, (yearUnitMap.get(isoYear) || 0) + unitVal);

        const outletType  = record.customer_type || 'Tipe Customer tidak diketahui';
        const category    = getProductCategory(product);
        const customer    = record.customer    || 'Unknown';
        const customer_no = record.customer_no || '';
        let city     = (record.city     || '').trim() || 'Tidak diketahui';
        let district = (record.district || '').trim() || 'Tidak diketahui';
        const area   = (record.area     || '').trim();

        if ((city === 'Unknown' || district === 'Unknown') && area.length > 0) {
          if (area.includes(',')) {
            const parts = area.split(',').map((p: string) => p.trim());
            if (district === 'Unknown' && parts[0]) district = parts[0];
            if (city     === 'Unknown' && parts[1]) city     = parts[1];
          } else if (city === 'Unknown') {
            city = area;
          }
        }

        const village  = record.village  || 'Unknown';
        const salesman = record.salesman || 'Unknown';

        const customerKey = customer_no ? `${customer_no}||${customer}` : `||${customer}`;
        const outletKey   = `${isoYear}|${outletType}|${category}|${product}|${customerKey}`;

        const existingOutlet = outletAggMap.get(outletKey);
        if (existingOutlet) {
          existingOutlet.dozNet += dos;
          existingOutlet.weeklyDozNet[isoWeek] = (existingOutlet.weeklyDozNet[isoWeek] ?? 0) + dos;
          if (isoWeek < existingOutlet.weekMin) existingOutlet.weekMin = isoWeek;
          if (isoWeek > existingOutlet.weekMax) existingOutlet.weekMax = isoWeek;
        } else {
          outletAggMap.set(outletKey, {
            dozNet: dos,
            weeklyDozNet: { [isoWeek]: dos },
            city, district, village, salesman, customer_no,
            year: isoYear, outletType, category, product, customer,
            weekMin: isoWeek, weekMax: isoWeek,
          });
        }
      }
    }),
    // targetQueriesPromise berjalan paralel di background selama streaming
    targetQueriesPromise,
  ]);

  console.log(`\n🔄 [STEP-1] Streaming selesai: ${totalRecordCount} total records`);
  console.log(`   ISO cross-year remap: ${crossYearCount} records`);
  console.log(`   Filtered out by week range: ${filteredOutByWeek} records`);
  console.log(`   Records masuk agregasi: ${totalRecordCount - filteredOutByWeek} records`);
  console.log(`   [BOUNDARY] Total dos Des28+/Jan1-3 yang masuk agregasi: ${boundaryDosTotal}`);
  console.log(`   outletAggMap size: ${outletAggMap.size}`);
  console.log(`   weekProductMap size: ${weekProductMap.size}`);
  console.log(`   allProductsSet size: ${allProductsSet.size}`);
  console.log(`✅ Fetched ${totalRecordCount} records dari DB`);

  if (totalRecordCount === 0) {
    return {
      weeklyData:       [],
      quarterlyData:    generateEmptyQuarterlyData(),
      weekComparisons:  [],
      l4wc4wData:       generateEmptyL4WC4WData(),
      yearOnYearGrowth: generateEmptyYearOnYearGrowth(),
      comparisonYears:  { previousYear: null, currentYear: null },
      comparisonWeeks:  generateEmptyComparisonWeeks(),
      outletData:       [],
    };
  }

  const sortedYears: number[] = [];
  weekYearSet.forEach((_, year) => sortedYears.push(year));
  sortedYears.sort((a, b) => a - b);

  const currentYear  = filters?.year2  ?? sortedYears[sortedYears.length - 1];
  const previousYear = filters?.year1  ?? (sortedYears.length > 1 ? sortedYears[sortedYears.length - 2] : currentYear);
  const comparisonYears = {
    previousYear: previousYear ?? null,
    currentYear:  currentYear  ?? null,
  };

  const getWeekRangeFromData = (year: number): { start: number; end: number } | null => {
    const weeks = weekYearSet.get(year);
    if (!weeks || weeks.size === 0) return null;
    let minWeek = Infinity;
    let maxWeek = -Infinity;
    weeks.forEach(w => {
      if (w < minWeek) minWeek = w;
      if (w > maxWeek) maxWeek = w;
    });
    if (!isFinite(minWeek)) return null;
    return { start: minWeek, end: maxWeek };
  };

  const dataRangeYear1 = previousYear !== undefined ? getWeekRangeFromData(previousYear) : null;
  const dataRangeYear2 = currentYear  !== undefined ? getWeekRangeFromData(currentYear)  : null;

  const previousYearWeekRange: { start: number; end: number } | null =
    previousYear !== undefined
      ? (preRangeYear1 ?? dataRangeYear1 ?? { start: 1, end: 52 })
      : null;

  const currentYearWeekRange: { start: number; end: number } | null =
    currentYear !== undefined
      ? (preRangeYear2 ?? dataRangeYear2 ?? { start: 1, end: 52 })
      : null;

  console.log(`\n🔍 [STEP-2] Week ranges:`);
  console.log(`   Data range year1=${previousYear}: [${dataRangeYear1?.start ?? '-'} - ${dataRangeYear1?.end ?? '-'}]`);
  console.log(`   Data range year2=${currentYear}:  [${dataRangeYear2?.start ?? '-'} - ${dataRangeYear2?.end ?? '-'}]`);
  console.log(`   Final range year1: [${previousYearWeekRange?.start ?? '-'} - ${previousYearWeekRange?.end ?? '-'}] ${preRangeYear1 ? '(dari filter)' : '(dari data)'}`);
  console.log(`   Final range year2: [${currentYearWeekRange?.start ?? '-'} - ${currentYearWeekRange?.end ?? '-'}] ${preRangeYear2 ? '(dari filter)' : '(dari data)'}`);

  const comparisonWeeks: ComparisonWeeks = {
    previousYear: previousYearWeekRange,
    currentYear:  currentYearWeekRange,
  };

  const getAgg = (year: number, week: number, product: string): UnitAgg =>
    weekProductMap.get(`${year}-${week}-${product}`) ?? { bks: 0, slop: 0, bal: 0, dos: 0 };

  const getUnitFromAgg = (agg: UnitAgg): number =>
    selectedUnit === 'units_bks'  ? agg.bks
    : selectedUnit === 'units_slop' ? agg.slop
    : selectedUnit === 'units_bal'  ? agg.bal
    : agg.dos;

  const weeklyData: WeeklySales[]         = [];
  const weekComparisons: WeekComparison[] = [];

  const allWeeks = new Set<number>();
  if (previousYear !== undefined) weekYearSet.get(previousYear)?.forEach(w => allWeeks.add(w));
  if (currentYear  !== undefined) weekYearSet.get(currentYear)?.forEach(w  => allWeeks.add(w));

  const sortedWeeks: number[] = [];
  allWeeks.forEach(w => sortedWeeks.push(w));
  sortedWeeks.sort((a, b) => a - b);

  // ── OPTIMASI B3: Pre-allocate productTotalsMap sekali di luar loop minggu ──
  type ProductTotals = {
    previous: number; current: number;
    units_bks:  { previous: number; current: number };
    units_slop: { previous: number; current: number };
    units_bal:  { previous: number; current: number };
    units_dos:  { previous: number; current: number };
  };

  const productTotalsMap = new Map<string, ProductTotals>();
  allProductsSet.forEach(product => {
    productTotalsMap.set(product, {
      previous: 0, current: 0,
      units_bks:  { previous: 0, current: 0 },
      units_slop: { previous: 0, current: 0 },
      units_bal:  { previous: 0, current: 0 },
      units_dos:  { previous: 0, current: 0 },
    });
  });

  for (const week of sortedWeeks) {
    // ── Reset in-place (bukan new Map) ──────────────────────────────────────
    productTotalsMap.forEach(t => {
      t.previous = 0; t.current = 0;
      t.units_bks.previous  = 0; t.units_bks.current  = 0;
      t.units_slop.previous = 0; t.units_slop.current = 0;
      t.units_bal.previous  = 0; t.units_bal.current  = 0;
      t.units_dos.previous  = 0; t.units_dos.current  = 0;
    });

    let prevYearSales = 0;
    let currYearSales = 0;

    if (previousYear !== undefined && weekYearSet.get(previousYear)?.has(week)) {
      for (const product of allProductsSet) {
        const agg    = getAgg(previousYear, week, product);
        const totals = productTotalsMap.get(product)!;
        const uval   = getUnitFromAgg(agg);
        totals.previous              += uval;
        totals.units_bks.previous    += agg.bks;
        totals.units_slop.previous   += agg.slop;
        totals.units_bal.previous    += agg.bal;
        totals.units_dos.previous    += agg.dos;
        prevYearSales                += uval;
      }
    }

    if (currentYear !== undefined && weekYearSet.get(currentYear)?.has(week)) {
      for (const product of allProductsSet) {
        const agg    = getAgg(currentYear, week, product);
        const totals = productTotalsMap.get(product)!;
        const uval   = getUnitFromAgg(agg);
        totals.current             += uval;
        totals.units_bks.current   += agg.bks;
        totals.units_slop.current  += agg.slop;
        totals.units_bal.current   += agg.bal;
        totals.units_dos.current   += agg.dos;
        currYearSales              += uval;
      }
    }

    const details: WeekComparisonProductDetail[] = [];
    productTotalsMap.forEach((totals, product) => {
      const variance           = totals.current - totals.previous;
      const variancePercentage = totals.previous > 0 ? (variance / totals.previous) * 100 : 0;
      details.push({
        product,
        previousYear: totals.previous,
        currentYear:  totals.current,
        variance,
        variancePercentage,
        units_bks:  { previous: totals.units_bks.previous,  current: totals.units_bks.current  },
        units_slop: { previous: totals.units_slop.previous, current: totals.units_slop.current },
        units_bal:  { previous: totals.units_bal.previous,  current: totals.units_bal.current  },
        units_dos:  { previous: totals.units_dos.previous,  current: totals.units_dos.current  },
      });
    });
    details.sort((a, b) => b.currentYear - a.currentYear);

    if (prevYearSales > 0 || currYearSales > 0) {
      weekComparisons.push({
        week,
        previousYear:       prevYearSales,
        currentYear:        currYearSales,
        variance:           currYearSales - prevYearSales,
        variancePercentage: prevYearSales > 0 ? ((currYearSales - prevYearSales) / prevYearSales) * 100 : 0,
        details,
      });
    }

    if (currYearSales > 0 && currentYear !== undefined)
      weeklyData.push({ week, year: currentYear,  sales: currYearSales, target: currYearSales * 1.1 });
    if (prevYearSales > 0 && previousYear !== undefined)
      weeklyData.push({ week, year: previousYear, sales: prevYearSales, target: prevYearSales * 1.1 });
  }

  console.log(`\n📦 [STEP-4] outletAggMap size=${outletAggMap.size} (no truncation needed)`);

  // ── OPTIMASI B2: Sort outletData server-side ─────────────────────────────
  const outletData: OutletSalesData[] = [];
  outletAggMap.forEach(agg => {
    outletData.push({
      week:         agg.weekMin,
      year:         agg.year,
      outletType:   agg.outletType,
      category:     agg.category,
      product:      agg.product,
      dozNet:       agg.dozNet,
      weeklyDozNet: agg.weeklyDozNet,
      city:         agg.city,
      district:     agg.district,
      village:      agg.village,
      customer:     agg.customer,
      customer_no:  agg.customer_no,
      salesman:     agg.salesman,
    });
  });
  outletData.sort((a, b) => b.dozNet - a.dozNet);

  console.log(`   outletData entries dikirim ke client: ${outletData.length}`);

  const effectiveYear     = currentYear  ?? sortedYears[sortedYears.length - 1];
  const effectivePrevYear = previousYear ?? (currentYear ?? sortedYears[0]);

  const toFixed2 = (n: number) => Math.round(n * 100) / 100;

  const yearOnYearGrowth: YearOnYearGrowth = (() => {
    const prevTotal = yearUnitMap.get(effectivePrevYear) || 0;
    const currTotal = yearUnitMap.get(effectiveYear)     || 0;
    const variance  = currTotal - prevTotal;
    return {
      previousYearTotal:  toFixed2(prevTotal),
      currentYearTotal:   toFixed2(currTotal),
      variance:           toFixed2(variance),
      variancePercentage: prevTotal > 0 ? Math.round((variance / prevTotal) * 100 * 10) / 10 : 0,
    };
  })();

  // Ambil hasil target queries yang sudah selesai (paralel dengan streaming)
  const targetResults = await targetQueriesPromise;

  // v9: Await resolvedTargetAreas (sudah selesai sejak streaming berjalan)
  const resolvedTargetAreas = await targetAreasPromise;

  const byWeekMap = buildByWeekMap(weekProductMap);

  const quarterlyData = await generateQuarterlyData(
    byWeekMap,
    omzetByProductWeek,
    effectiveYear,
    areaId,
    filters?.selectedUnit,
    targetResults,
    resolvedTargetAreas,   // v9: pass resolved area list
  );

  const l4wc4wData = generateL4WC4WData(
    byWeekMap,
    omzetByProductWeek,
    currentYear,
    filters,
  );

  return {
    weeklyData,
    quarterlyData,
    weekComparisons,
    l4wc4wData,
    yearOnYearGrowth,
    comparisonYears,
    comparisonWeeks,
    outletData,
  };
}

// ─── generateQuarterlyData — refactored (v7 + v8 + v9) ───────────────────────
// v9: menerima targetAreas[] — support multi-area dan root semua area
async function generateQuarterlyData(
  byWeekMap:          Map<number, Map<number, Map<string, UnitAgg>>>,
  omzetByProductWeek: Map<string, number>,
  year:               number,
  areaId?:            string,
  selectedUnit?:      string,
  preFetchedTargets?: [WeekQuarterTargetRow[], ProductQuarterRawRow[], ProductWeekRawRow[]] | null,
  targetAreas?:       string[],
): Promise<QuarterlyData[]> {
  const quarters      = ['Q1', 'Q2', 'Q3', 'Q4'] as const;
  const quarterlyData: QuarterlyData[] = [];
  const unitType      = selectedUnit || 'units_dos';

  const pickUnit = (agg: UnitAgg): number =>
    unitType === 'units_bks'  ? agg.bks
    : unitType === 'units_slop' ? agg.slop
    : unitType === 'units_bal'  ? agg.bal
    : agg.dos;

  const yearWeekMap = byWeekMap.get(year) ?? new Map<number, Map<string, UnitAgg>>();

  const allProductsThisYear = new Set<string>();
  yearWeekMap.forEach(prodMap => prodMap.forEach((_, p) => allProductsThisYear.add(p)));

  interface WeekTargetRow {
    week:       number;
    quarter:    number;
    units_dos:  number;
    units_bks:  number;
    units_slop: number;
    units_bal:  number;
    has_target: boolean;
  }

  const weekTargetMap        = new Map<number, WeekTargetRow>();
  const productWeekTargetMap = new Map<string, Map<number, {
    units_dos: number; units_bks: number; units_slop: number; units_bal: number;
  }>>();
  let productQuarterTargets  = new Map<string, Map<number, ProductQuarterTargetRow>>();

  // v9: Gunakan effectiveTargetAreas — support multi-area
  const effectiveTargetAreas: string[] =
    targetAreas && targetAreas.length > 0
      ? targetAreas
      : areaId ? [areaId] : [];

  if (effectiveTargetAreas.length > 0) {
    let weekQuarterRows:    WeekQuarterTargetRow[]  = [];
    let productQuarterRows: ProductQuarterRawRow[]  = [];
    let productWeekRows:    ProductWeekRawRow[]      = [];

    if (preFetchedTargets) {
      // Data sudah ada dari parallel fetch — nol round-trip tambahan
      [weekQuarterRows, productQuarterRows, productWeekRows] = preFetchedTargets;
      console.log(`✅ [B4] Menggunakan pre-fetched target data (${effectiveTargetAreas.length} area)`);
    } else {
      // Fallback: fetch jika parallel queries tidak tersedia
      console.warn(`⚠️  [B4] preFetchedTargets null — fallback ke serial queries`);
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
            [effectiveTargetAreas, year],
          ),
          client2.query<ProductQuarterRawRow>(
            `SELECT product, quarter,
               SUM(COALESCE(units_dos,0)) AS units_dos, SUM(COALESCE(units_bks,0)) AS units_bks,
               SUM(COALESCE(units_slop,0)) AS units_slop, SUM(COALESCE(units_bal,0)) AS units_bal
             FROM target_data
             WHERE area = ANY($1) AND year = $2 AND target_type = 'WEEKLY'
               AND product != 'DEFAULT_PRODUCT'
             GROUP BY product, quarter ORDER BY product, quarter`,
            [effectiveTargetAreas, year],
          ),
          client2.query<ProductWeekRawRow>(
            `SELECT product, week,
               SUM(COALESCE(units_dos,0)) AS units_dos, SUM(COALESCE(units_bks,0)) AS units_bks,
               SUM(COALESCE(units_slop,0)) AS units_slop, SUM(COALESCE(units_bal,0)) AS units_bal
             FROM target_data
             WHERE area = ANY($1) AND year = $2 AND target_type = 'WEEKLY'
               AND product != 'DEFAULT_PRODUCT'
             GROUP BY product, week ORDER BY product, week`,
            [effectiveTargetAreas, year],
          ),
        ]);
        weekQuarterRows    = resWQ.rows;
        productQuarterRows = resPQ.rows;
        productWeekRows    = resPW.rows;
      } finally {
        client2.release();
      }
    }

    // Build weekTargetMap
    weekQuarterRows.forEach(r => {
      const dos = parseFloat(r.units_dos) || 0;
      weekTargetMap.set(Number(r.week), {
        week:       Number(r.week),
        quarter:    Number(r.quarter),
        units_dos:  dos,
        units_bks:  parseFloat(r.units_bks)  || 0,
        units_slop: parseFloat(r.units_slop) || 0,
        units_bal:  parseFloat(r.units_bal)  || 0,
        has_target: dos > 0,
      });
    });
    console.log(`✅ Week targets built: ${weekTargetMap.size} minggu`);

    // Build productQuarterTargets
    productQuarterRows.forEach(r => {
      const qNum = Number(r.quarter);
      if (!productQuarterTargets.has(r.product)) productQuarterTargets.set(r.product, new Map());
      productQuarterTargets.get(r.product)!.set(qNum, {
        product:    r.product,
        quarter:    qNum,
        units_dos:  parseFloat(r.units_dos)  || 0,
        units_bks:  parseFloat(r.units_bks)  || 0,
        units_slop: parseFloat(r.units_slop) || 0,
        units_bal:  parseFloat(r.units_bal)  || 0,
      });
    });
    console.log(`✅ Product×quarter targets built: ${productQuarterTargets.size} produk`);

    // Build productWeekTargetMap
    productWeekRows.forEach(r => {
      const wNum = Number(r.week);
      if (!productWeekTargetMap.has(r.product)) productWeekTargetMap.set(r.product, new Map());
      productWeekTargetMap.get(r.product)!.set(wNum, {
        units_dos:  parseFloat(r.units_dos)  || 0,
        units_bks:  parseFloat(r.units_bks)  || 0,
        units_slop: parseFloat(r.units_slop) || 0,
        units_bal:  parseFloat(r.units_bal)  || 0,
      });
    });
    console.log(`✅ Product×week targets built: ${productWeekTargetMap.size} produk`);
  }

  type QuarterAccum = { dos: number; bks: number; slop: number; bal: number; weekCount: number };
  const quarterTargetMap: Record<string, QuarterAccum> = {
    Q1: { dos:0, bks:0, slop:0, bal:0, weekCount:0 },
    Q2: { dos:0, bks:0, slop:0, bal:0, weekCount:0 },
    Q3: { dos:0, bks:0, slop:0, bal:0, weekCount:0 },
    Q4: { dos:0, bks:0, slop:0, bal:0, weekCount:0 },
  };

  weekTargetMap.forEach(r => {
    if (!r.has_target) return;
    const qKey = `Q${r.quarter}` as keyof typeof quarterTargetMap;
    if (quarterTargetMap[qKey]) {
      quarterTargetMap[qKey].dos  += r.units_dos;
      quarterTargetMap[qKey].bks  += r.units_bks;
      quarterTargetMap[qKey].slop += r.units_slop;
      quarterTargetMap[qKey].bal  += r.units_bal;
      quarterTargetMap[qKey].weekCount++;
    }
  });

  const getMonthFromWeek = (week: number): string => {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const jan4    = new Date(year, 0, 4);
    const jan4Day = jan4.getDay() || 7;
    const startOfWeek1 = new Date(jan4);
    startOfWeek1.setDate(jan4.getDate() - (jan4Day - 1));
    const targetDate = new Date(startOfWeek1);
    targetDate.setDate(startOfWeek1.getDate() + (week - 1) * 7);
    return months[targetDate.getMonth()];
  };

  const generateQuarterlyProductDetails = (
    quarterIndex: number,
    quarterWeeks: number[],
  ): QuarterlyProductDetail[] => {
    const qNum = quarterIndex + 1;

    const productActualMap = new Map<string, {
      units_dos: number; units_bks: number; units_slop: number; units_bal: number;
    }>();

    const productWeeklyMap = new Map<string, Map<number, {
      units_dos: number; units_bks: number; units_slop: number; units_bal: number;
    }>>();

    for (const week of quarterWeeks) {
      const prodMap = yearWeekMap.get(week);
      if (!prodMap) continue;

      prodMap.forEach((agg, product) => {
        if (!productActualMap.has(product)) {
          productActualMap.set(product, { units_dos:0, units_bks:0, units_slop:0, units_bal:0 });
        }
        const d = productActualMap.get(product)!;
        d.units_dos  += agg.dos;
        d.units_bks  += agg.bks;
        d.units_slop += agg.slop;
        d.units_bal  += agg.bal;

        if (!productWeeklyMap.has(product)) productWeeklyMap.set(product, new Map());
        const wm = productWeeklyMap.get(product)!;
        const wd = wm.get(week) ?? { units_dos:0, units_bks:0, units_slop:0, units_bal:0 };
        wd.units_dos  += agg.dos;
        wd.units_bks  += agg.bks;
        wd.units_slop += agg.slop;
        wd.units_bal  += agg.bal;
        wm.set(week, wd);
      });
    }

    if (productActualMap.size === 0) {
      allProductsThisYear.forEach(p => {
        if (!productActualMap.has(p)) {
          productActualMap.set(p, { units_dos:0, units_bks:0, units_slop:0, units_bal:0 });
        }
      });
    }

    const result: QuarterlyProductDetail[] = [];
    productActualMap.forEach((actual, product) => {
      const dbTarget   = productQuarterTargets.get(product)?.get(qNum);
      const dosTarget  = dbTarget?.units_dos  ?? 0;
      const bksTarget  = dbTarget?.units_bks  ?? 0;
      const slopTarget = dbTarget?.units_slop ?? 0;
      const balTarget  = dbTarget?.units_bal  ?? 0;

      const selectedActual = unitType === 'units_bks'  ? actual.units_bks
                           : unitType === 'units_slop' ? actual.units_slop
                           : unitType === 'units_bal'  ? actual.units_bal
                           : actual.units_dos;
      const selectedTarget = unitType === 'units_bks'  ? bksTarget
                           : unitType === 'units_slop' ? slopTarget
                           : unitType === 'units_bal'  ? balTarget
                           : dosTarget;

      const variance           = selectedActual - selectedTarget;
      const variancePercentage = selectedTarget > 0 ? (variance / selectedTarget) * 100 : 0;

      const weeklyActuals: Record<number, {
        units_dos: number; units_bks: number; units_slop: number; units_bal: number;
      }> = {};
      productWeeklyMap.get(product)?.forEach((vals, week) => {
        weeklyActuals[week] = {
          units_dos:  parseFloat(vals.units_dos.toFixed(2)),
          units_bks:  parseFloat(vals.units_bks.toFixed(2)),
          units_slop: parseFloat(vals.units_slop.toFixed(2)),
          units_bal:  parseFloat(vals.units_bal.toFixed(2)),
        };
      });

      result.push({
        product,
        productCategory:    getProductCategory(product),
        target:             parseFloat(selectedTarget.toFixed(2)),
        actual:             parseFloat(selectedActual.toFixed(2)),
        variance:           parseFloat(variance.toFixed(2)),
        variancePercentage: parseFloat(variancePercentage.toFixed(1)),
        units_bks:  { target: parseFloat(bksTarget.toFixed(2)),  actual: parseFloat(actual.units_bks.toFixed(2))  },
        units_slop: { target: parseFloat(slopTarget.toFixed(2)), actual: parseFloat(actual.units_slop.toFixed(2)) },
        units_bal:  { target: parseFloat(balTarget.toFixed(2)),  actual: parseFloat(actual.units_bal.toFixed(2))  },
        units_dos:  { target: parseFloat(dosTarget.toFixed(2)),  actual: parseFloat(actual.units_dos.toFixed(2))  },
        weeklyActuals,
      } as any);
    });

    return result;
  };

  console.log(`\n📊 [generateQuarterlyData] year=${year}, total weekMap entries=${yearWeekMap.size}`);
  [1,2,3,4].forEach(q => {
    const s = (q-1)*13+1, e = Math.min(q*13, 52);
    let cnt = 0;
    for (let w = s; w <= e; w++) { if (yearWeekMap.has(w)) cnt++; }
    console.log(`   Q${q} (W${s}-W${e}): ${cnt} minggu dengan data`);
  });

  for (let qIndex = 0; qIndex < quarters.length; qIndex++) {
    const quarter   = quarters[qIndex];
    const startWeek = qIndex * 13 + 1;
    const endWeek   = Math.min((qIndex + 1) * 13, 52);
    const qKey      = quarter;

    const quarterWeeks: number[] = [];
    for (let w = startWeek; w <= endWeek; w++) {
      if (yearWeekMap.has(w)) quarterWeeks.push(w);
    }

    let quarterActual_dos  = 0;
    let quarterActual_bks  = 0;
    let quarterActual_slop = 0;
    let quarterActual_bal  = 0;

    for (const week of quarterWeeks) {
      const prodMap = yearWeekMap.get(week)!;
      prodMap.forEach(agg => {
        quarterActual_dos  += agg.dos;
        quarterActual_bks  += agg.bks;
        quarterActual_slop += agg.slop;
        quarterActual_bal  += agg.bal;
      });
    }

    const qt     = quarterTargetMap[qKey];
    const target = qt && qt.weekCount > 0 ? qt.dos : 0;

    const quarterTargetForUnit = unitType === 'units_bks'  ? (qt?.bks  ?? 0)
                               : unitType === 'units_slop' ? (qt?.slop ?? 0)
                               : unitType === 'units_bal'  ? (qt?.bal  ?? 0)
                               : target;

    const quarterActual = unitType === 'units_bks'  ? quarterActual_bks
                        : unitType === 'units_slop' ? quarterActual_slop
                        : unitType === 'units_bal'  ? quarterActual_bal
                        : quarterActual_dos;

    const details = generateQuarterlyProductDetails(qIndex, quarterWeeks);

    const weeklyBreakdown: WeeklyBreakdown[] = [];
    for (let week = startWeek; week <= endWeek; week++) {
      const prodMap = yearWeekMap.get(week);

      let weekActual_bks  = 0;
      let weekActual_slop = 0;
      let weekActual_bal  = 0;
      let weekActual_dos  = 0;

      if (prodMap) {
        prodMap.forEach(agg => {
          weekActual_bks  += agg.bks;
          weekActual_slop += agg.slop;
          weekActual_bal  += agg.bal;
          weekActual_dos  += agg.dos;
        });
      }

      const weekTargetRow = weekTargetMap.get(week);
      const hasTarget     = weekTargetRow?.has_target ?? false;

      const weekTarget_bks  = weekTargetRow?.units_bks  ?? 0;
      const weekTarget_slop = weekTargetRow?.units_slop ?? 0;
      const weekTarget_bal  = weekTargetRow?.units_bal  ?? 0;
      const weekTarget_dos  = weekTargetRow?.units_dos  ?? 0;

      const weekActual = unitType === 'units_bks'  ? weekActual_bks
                       : unitType === 'units_slop' ? weekActual_slop
                       : unitType === 'units_bal'  ? weekActual_bal
                       : weekActual_dos;
      const weekTarget = unitType === 'units_bks'  ? weekTarget_bks
                       : unitType === 'units_slop' ? weekTarget_slop
                       : unitType === 'units_bal'  ? weekTarget_bal
                       : weekTarget_dos;

      const weekVariance    = weekActual - weekTarget;
      const weekVariancePct = hasTarget && weekTarget > 0 ? (weekVariance / weekTarget) * 100 : 0;
      const weekAchievement = hasTarget && weekTarget > 0
        ? (weekActual / weekTarget) * 100
        : weekActual > 0 ? -1 : 0;

      weeklyBreakdown.push({
        week,
        target:             parseFloat(weekTarget.toFixed(2)),
        actual:             parseFloat(weekActual.toFixed(2)),
        variance:           parseFloat(weekVariance.toFixed(2)),
        variancePercentage: parseFloat(weekVariancePct.toFixed(1)),
        achievement:        parseFloat(weekAchievement.toFixed(1)),
        units_bks:  { target: parseFloat(weekTarget_bks.toFixed(2)),  actual: parseFloat(weekActual_bks.toFixed(2))  },
        units_slop: { target: parseFloat(weekTarget_slop.toFixed(2)), actual: parseFloat(weekActual_slop.toFixed(2)) },
        units_bal:  { target: parseFloat(weekTarget_bal.toFixed(2)),  actual: parseFloat(weekActual_bal.toFixed(2))  },
        units_dos:  { target: parseFloat(weekTarget_dos.toFixed(2)),  actual: parseFloat(weekActual_dos.toFixed(2))  },
        hasTarget,
      } as WeeklyBreakdown & { hasTarget: boolean });
    }

    const monthsInQuarter =
      qIndex === 0 ? ['Jan', 'Feb', 'Mar'] :
      qIndex === 1 ? ['Apr', 'May', 'Jun'] :
      qIndex === 2 ? ['Jul', 'Aug', 'Sep'] :
                     ['Oct', 'Nov', 'Dec'];

    // ── OPTIMASI B6: One-pass pre-grouping untuk monthlyBreakdown ────────────
    const wbByMonth = new Map<string, (WeeklyBreakdown & { hasTarget: boolean })[]>();
    monthsInQuarter.forEach(m => wbByMonth.set(m, []));
    for (const wb of weeklyBreakdown) {
      const m = getMonthFromWeek(wb.week);
      wbByMonth.get(m)?.push(wb as WeeklyBreakdown & { hasTarget: boolean });
    }

    const monthlyBreakdown: MonthlyBreakdown[] = monthsInQuarter.map(month => {
      const monthWeeks = wbByMonth.get(month) ?? [];

      const monthActual_bks  = monthWeeks.reduce((s, wb) => s + (wb.units_bks?.actual  ?? 0), 0);
      const monthActual_slop = monthWeeks.reduce((s, wb) => s + (wb.units_slop?.actual ?? 0), 0);
      const monthActual_bal  = monthWeeks.reduce((s, wb) => s + (wb.units_bal?.actual  ?? 0), 0);
      const monthActual_dos  = monthWeeks.reduce((s, wb) => s + (wb.units_dos?.actual  ?? 0), 0);

      const monthTarget_bks  = monthWeeks.reduce((s, wb) => s + (wb.units_bks?.target  ?? 0), 0);
      const monthTarget_slop = monthWeeks.reduce((s, wb) => s + (wb.units_slop?.target ?? 0), 0);
      const monthTarget_bal  = monthWeeks.reduce((s, wb) => s + (wb.units_bal?.target  ?? 0), 0);
      const monthTarget_dos  = monthWeeks.reduce((s, wb) => s + (wb.units_dos?.target  ?? 0), 0);

      const hasMonthTarget = monthWeeks.some(wb => wb.hasTarget === true);

      const monthActual = unitType === 'units_bks'  ? monthActual_bks
                        : unitType === 'units_slop' ? monthActual_slop
                        : unitType === 'units_bal'  ? monthActual_bal
                        : monthActual_dos;
      const monthTarget = unitType === 'units_bks'  ? monthTarget_bks
                        : unitType === 'units_slop' ? monthTarget_slop
                        : unitType === 'units_bal'  ? monthTarget_bal
                        : monthTarget_dos;

      const monthVar    = monthActual - monthTarget;
      const monthVarPct = hasMonthTarget && monthTarget > 0 ? (monthVar    / monthTarget) * 100 : 0;
      const monthAch    = hasMonthTarget && monthTarget > 0 ? (monthActual / monthTarget) * 100 : 0;

      return {
        month,
        target:             parseFloat(monthTarget.toFixed(2)),
        actual:             parseFloat(monthActual.toFixed(2)),
        variance:           parseFloat(monthVar.toFixed(2)),
        variancePercentage: parseFloat(monthVarPct.toFixed(1)),
        achievement:        parseFloat(monthAch.toFixed(1)),
        units_bks:  { target: parseFloat(monthTarget_bks.toFixed(2)),  actual: parseFloat(monthActual_bks.toFixed(2))  },
        units_slop: { target: parseFloat(monthTarget_slop.toFixed(2)), actual: parseFloat(monthActual_slop.toFixed(2)) },
        units_bal:  { target: parseFloat(monthTarget_bal.toFixed(2)),  actual: parseFloat(monthActual_bal.toFixed(2))  },
        units_dos:  { target: parseFloat(monthTarget_dos.toFixed(2)),  actual: parseFloat(monthActual_dos.toFixed(2))  },
        hasTarget:  hasMonthTarget,
      } as MonthlyBreakdown & { hasTarget: boolean };
    });

    quarterlyData.push({
      quarter,
      target:             parseFloat(quarterTargetForUnit.toFixed(2)),
      actual:             parseFloat(quarterActual.toFixed(2)),
      variance:           parseFloat((quarterActual - quarterTargetForUnit).toFixed(2)),
      variancePercentage: quarterTargetForUnit > 0 ? parseFloat(((quarterActual - quarterTargetForUnit) / quarterTargetForUnit * 100).toFixed(1)) : 0,
      details,
      weeklyBreakdown,
      monthlyBreakdown,
    });
  }

  return quarterlyData;
}

// ─── generateL4WC4WData — refactored (v7) ────────────────────────────────────
function generateL4WC4WData(
  byWeekMap:          Map<number, Map<number, Map<string, UnitAgg>>>,
  omzetByProductWeek: Map<string, number>,
  currentYear?:       number,
  filters?:           FetchFilters,
): L4WC4WData {
  const empty: L4WC4WData = { l4wAverage: 0, c4wAverage: 0, c1wValue: 0, variance: 0, variancePercentage: 0, weeklyTrendData: [] };
  const selectedUnit      = filters?.selectedUnit || 'units_dos';
  const effectiveYear     = filters?.year2 ?? currentYear;

  const yearWeekMap = effectiveYear !== undefined
    ? (byWeekMap.get(effectiveYear) ?? new Map<number, Map<string, UnitAgg>>())
    : (() => {
        const merged = new Map<number, Map<string, UnitAgg>>();
        byWeekMap.forEach(ywm => ywm.forEach((pm, w) => {
          if (!merged.has(w)) merged.set(w, new Map());
          pm.forEach((agg, p) => {
            const ex = merged.get(w)!.get(p);
            if (ex) { ex.bks += agg.bks; ex.slop += agg.slop; ex.bal += agg.bal; ex.dos += agg.dos; }
            else merged.get(w)!.set(p, { ...agg });
          });
        }));
        return merged;
      })();

  if (yearWeekMap.size === 0) return empty;

  const weeklyTotalsMap = new Map<number, number>();
  yearWeekMap.forEach((prodMap, week) => {
    let weekTotal = 0;
    prodMap.forEach(agg => {
      weekTotal += selectedUnit === 'units_bks'  ? agg.bks
                 : selectedUnit === 'units_slop' ? agg.slop
                 : selectedUnit === 'units_bal'  ? agg.bal
                 : agg.dos;
    });
    weeklyTotalsMap.set(week, (weeklyTotalsMap.get(week) ?? 0) + weekTotal);
  });

  const weeklyTotals: { week: number; total: number }[] = [];
  weeklyTotalsMap.forEach((total, week) => weeklyTotals.push({ week, total }));
  weeklyTotals.sort((a, b) => a.week - b.week);

  if (weeklyTotals.length < 2) {
    const c1wValue = weeklyTotals[weeklyTotals.length - 1]?.total ?? 0;
    return { ...empty, c4wAverage: Math.round(c1wValue), c1wValue: Math.round(c1wValue) };
  }

  const c1wEntry = weeklyTotals[weeklyTotals.length - 1];
  const c1wValue = c1wEntry.total;
  const l4wWeeks = weeklyTotals.slice(Math.max(0, weeklyTotals.length - 5), weeklyTotals.length - 1);

  if (l4wWeeks.length === 0) return { ...empty, c1wValue: Math.round(c1wValue) };

  const l4wAverageRaw = l4wWeeks.reduce((sum, e) => sum + e.total, 0) / l4wWeeks.length;

  let l4wMinWeek = Infinity;
  let l4wMaxWeek = -Infinity;
  l4wWeeks.forEach(w => {
    if (w.week < l4wMinWeek) l4wMinWeek = w.week;
    if (w.week > l4wMaxWeek) l4wMaxWeek = w.week;
  });
  const l4wWeekRange = l4wMinWeek === l4wMaxWeek
    ? `Week ${l4wMinWeek}`
    : `Week ${l4wMinWeek}-${l4wMaxWeek}`;

  const weeklyTrendData: WeeklyTrendData[] = [
    ...l4wWeeks.map((entry): WeeklyTrendData => ({
      week:   `W${entry.week.toString().padStart(2, '0')}`,
      value:  Math.round(entry.total),
      period: 'L4W',
    })),
    {
      week:   `W${c1wEntry.week.toString().padStart(2, '0')}`,
      value:  Math.round(c1wValue),
      period: 'C1W',
    },
  ];

  const l4wWeekNums = l4wWeeks.map(w => w.week);

  return {
    l4wAverage:      Math.round(l4wAverageRaw),
    c4wAverage:      0,
    c1wValue:        Math.round(c1wValue),
    variance:        0,
    variancePercentage: 0,
    weeklyTrendData,
    l4wWeekRange,
    c1wWeekNumber:   c1wEntry.week,
    productDetails:  generateProductL4WC1WData(
      yearWeekMap,
      omzetByProductWeek,
      effectiveYear,
      c1wEntry.week,
      l4wWeekNums,
    ),
  } as L4WC4WData;
}

// ─── generateProductL4WC1WData — refactored (v7) ─────────────────────────────
function generateProductL4WC1WData(
  yearWeekMap:        Map<number, Map<string, UnitAgg>>,
  omzetByProductWeek: Map<string, number>,
  effectiveYear:      number | undefined,
  c1wWeek:            number,
  l4wWeeks:           number[],
): ProductL4WC1WData[] {
  type WeekEntry = { omzet: number; units_bks: number; units_slop: number; units_bal: number; units_dos: number };

  const productMap = new Map<string, Map<number, WeekEntry>>();

  const relevantWeeks = new Set([...l4wWeeks, c1wWeek]);

  relevantWeeks.forEach(week => {
    const prodMap = yearWeekMap.get(week);
    if (!prodMap) return;

    prodMap.forEach((agg, product) => {
      const omzetKey = `${effectiveYear}-${week}-${product}`;
      const omzet    = omzetByProductWeek.get(omzetKey) ?? 0;

      if (!productMap.has(product)) productMap.set(product, new Map());
      const weekMap  = productMap.get(product)!;
      const existing = weekMap.get(week) ?? { omzet: 0, units_bks: 0, units_slop: 0, units_bal: 0, units_dos: 0 };
      weekMap.set(week, {
        omzet:      existing.omzet      + omzet,
        units_bks:  existing.units_bks  + agg.bks,
        units_slop: existing.units_slop + agg.slop,
        units_bal:  existing.units_bal  + agg.bal,
        units_dos:  existing.units_dos  + agg.dos,
      });
    });
  });

  const fallbackEntry: WeekEntry = { omzet: 0, units_bks: 0, units_slop: 0, units_bal: 0, units_dos: 0 };
  const year = effectiveYear ?? new Date().getFullYear();

  const productData: ProductL4WC1WData[] = [];

  for (const [product, weekMap] of productMap.entries()) {
    const c1wData    = weekMap.get(c1wWeek) ?? fallbackEntry;
    const l4wEntries = l4wWeeks
      .map(w => weekMap.get(w))
      .filter((d): d is WeekEntry => d !== undefined && d.omzet > 0);

    const avg = (arr: WeekEntry[], key: keyof WeekEntry): number =>
      l4wEntries.length > 0 ? arr.reduce((s, d) => s + (d[key] as number), 0) / arr.length : 0;
    const sum = (arr: WeekEntry[], key: keyof WeekEntry): number =>
      arr.reduce((s, d) => s + (d[key] as number), 0);

    const l4wAvg: WeekEntry = {
      omzet:      avg(l4wEntries, 'omzet'),
      units_bks:  avg(l4wEntries, 'units_bks'),
      units_slop: avg(l4wEntries, 'units_slop'),
      units_bal:  avg(l4wEntries, 'units_bal'),
      units_dos:  avg(l4wEntries, 'units_dos'),
    };
    const l4wTotal: WeekEntry = {
      omzet:      sum(l4wEntries, 'omzet'),
      units_bks:  sum(l4wEntries, 'units_bks'),
      units_slop: sum(l4wEntries, 'units_slop'),
      units_bal:  sum(l4wEntries, 'units_bal'),
      units_dos:  sum(l4wEntries, 'units_dos'),
    };

    const variance           = c1wData.omzet - l4wAvg.omzet;
    const variancePercentage = l4wAvg.omzet > 0 ? (variance / l4wAvg.omzet) * 100 : 0;

    productData.push({
      product,
      year,
      l4wValue:  Math.round(l4wAvg.omzet),
      c1wValue:  Math.round(c1wData.omzet),
      variance:  Math.round(variance),
      variancePercentage: Math.round(variancePercentage * 10) / 10,
      units_bks:  { l4w: Math.round(l4wAvg.units_bks   * 100) / 100, c1w: Math.round(c1wData.units_bks   * 100) / 100, l4wTotal: Math.round(l4wTotal.units_bks  * 100) / 100 },
      units_slop: { l4w: Math.round(l4wAvg.units_slop  * 100) / 100, c1w: Math.round(c1wData.units_slop  * 100) / 100, l4wTotal: Math.round(l4wTotal.units_slop * 100) / 100 },
      units_bal:  { l4w: Math.round(l4wAvg.units_bal   * 100) / 100, c1w: Math.round(c1wData.units_bal   * 100) / 100, l4wTotal: Math.round(l4wTotal.units_bal  * 100) / 100 },
      units_dos:  { l4w: Math.round(l4wAvg.units_dos   * 100) / 100, c1w: Math.round(c1wData.units_dos   * 100) / 100, l4wTotal: Math.round(l4wTotal.units_dos  * 100) / 100 },
    });
  }

  return productData.sort((a, b) => b.c1wValue - a.c1wValue);
}

// ─── Fallback empty data generators ──────────────────────────────────────────
function generateEmptyQuarterlyData(): QuarterlyData[] {
  return ['Q1', 'Q2', 'Q3', 'Q4'].map(quarter => ({
    quarter, target: 0, actual: 0, variance: 0, variancePercentage: 0,
    weeklyBreakdown: [], monthlyBreakdown: [],
  }));
}

function generateEmptyL4WC4WData(): L4WC4WData {
  return { l4wAverage: 0, c4wAverage: 0, c1wValue: 0, variance: 0, variancePercentage: 0, weeklyTrendData: [], l4wWeekRange: '', c1wWeekNumber: 0 };
}

function generateEmptyYearOnYearGrowth(): YearOnYearGrowth {
  return { previousYearTotal: 0, currentYearTotal: 0, variance: 0, variancePercentage: 0 };
}

function generateEmptyComparisonWeeks(): ComparisonWeeks {
  return { previousYear: null, currentYear: null };
}