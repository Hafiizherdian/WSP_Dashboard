/**
 * app/api/distribution/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { withAuth } from '@/lib/auth/session';
import * as XLSX from 'xlsx';
import { getCached, setCached, invalidateAll } from '@/lib/distributionCache';

function parseNum(raw: unknown): number {
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  if (typeof raw !== 'string') return 0;
  const s = raw.trim().replace(/[^0-9.,\-]/g, '');
  const n = parseFloat(s.replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

function parseWeekNum(raw: unknown): number {
  if (typeof raw === 'number') return raw;
  if (typeof raw === 'string') {
    const m = raw.match(/\d+/);
    return m ? parseInt(m[0]) : 1;
  }
  return 1;
}

function log(step: string, detail?: Record<string, unknown>) {
  const ts = new Date().toISOString();
  if (detail) {
    console.log(`[dist-upload] [${ts}] ${step}`, JSON.stringify(detail, null, 2));
  } else {
    console.log(`[dist-upload] [${ts}] ${step}`);
  }
}

function logError(step: string, err: unknown, detail?: Record<string, unknown>) {
  const ts = new Date().toISOString();
  console.error(`[dist-upload] [${ts}]  ${step}`, detail ?? '', err);
}

function timedQuery(label: string) {
  return async (text: string, params?: any[]) => {
    const t0 = Date.now();
    try {
      const res = await pool.query(text, params);
      const ms = Date.now() - t0;
      log(`[GET] query "${label}" `, { ms, rows: res.rowCount });
      if (ms > 1000) {
        log(`[GET] ⚠ SLOW query "${label}"`, { ms });
      }
      return res;
    } catch (err) {
      logError(`[GET] query "${label}" `, err, { ms: Date.now() - t0 });
      throw err;
    }
  };
}

// 
// GET
// 
//
// (catatan definisi metrik & pola CTE dedup outlet sama seperti versi sebelumnya, tidak diubah, lihat komentar panjang di riwayat file ini)
//
// CACHE
// Sebelum menjalankan 10 query paralel 
// (yang bisa >100 detik pada dataset besar tanpa cache di server dengan resource terbatas), 
// dicek dulu apakah kombinasi filter yang sama sudah pernah dihitung baru-baru ini 
// via lib/distributionCache.ts. Cache di-invalidate penuh setiap ada upload/delete
// file baru (lihat invalidateAll() di POST & DELETE di bawah), 
// jadi user nggak akan pernah lihat data yang basi.
//
// PERUBAHAN:
// - 3 query yang dulu ada (achievementAreaSalesman, achievementAreaProduct,
//   achievementAreaOutletType) DIHAPUS karena tidak pernah dikonsumsi oleh
//   DistributionSection.tsx — cuma numpang lewat di normalizeResponse tanpa
//   pernah dirender. Menghapusnya mengurangi beban 13 -> 10 query paralel.
// - Query 'coverage' tadinya TIDAK mengembalikan outlet_count meski
//   CTE outlet_agg sudah punya kolom outlet — sekarang ditambahkan
//   COUNT(DISTINCT outlet), karena UI (tab Outlet) merender kolom Outlet
//   dari field ini.
//
export async function GET(request: NextRequest) {
  return withAuth(request, 'view_files', async (session) => {
    const getStart = Date.now();
    try {
      const { searchParams } = new URL(request.url);

      const mode = searchParams.get('mode');
      if (mode === 'files') {
        log('[GET] mode=files');
        const filesQ = await timedQuery('files-list')(`
          SELECT id, original_name, record_count, area, created_at
          FROM distribution_files
          WHERE status = 'completed'
          ORDER BY created_at DESC
        `);
        log('[GET] mode=files ', { ms: Date.now() - getStart, count: filesQ.rows.length });
        return NextResponse.json({
          success: true,
          data: { files: filesQ.rows },
        });
      }

      const area       = searchParams.get('area') || '';
      const salesman   = searchParams.get('salesman') || '';
      const product    = searchParams.get('product') || '';
      const weekStart  = parseInt(searchParams.get('weekStart') || '1');
      const weekEnd    = parseInt(searchParams.get('weekEnd') || '52');
      const city       = searchParams.get('city') || '';
      const fileId     = searchParams.get('fileId') || '';
      const outletType = searchParams.get('outletType') || '';

      log('[GET] request received', {
        user: session.username, role: session.role,
        area, salesman, product, city, fileId, outletType,
        weekStart, weekEnd,
      });

      // Cek cache dulu sebelum sentuh DB  
      const cacheParams = {
        area, salesman, product, city, fileId, outletType,
        weekStart: String(weekStart), weekEnd: String(weekEnd),
        // area kena RBAC per session, jadi ikut masuk key supaya user dengan
        // allowed_areas beda, hasil cache satu sama lain
        allowedAreas: session.role !== 'root' ? (session.allowed_areas ?? []).slice().sort().join(',') : 'root',
      };

      const cached = getCached(cacheParams);
      if (cached) {
        log('[GET] cache HIT', { ...cacheParams, ms: Date.now() - getStart });
        return NextResponse.json({ success: true, data: cached });
      }
      log('[GET] cache MISS — menjalankan query', cacheParams);

      // WHERE dengan semua filter (dipakai mayoritas query) 
      const params: any[] = [];
      let idx = 1;
      const conditions: string[] = ['1=1'];

      if (area) {
        conditions.push(`area = $${idx++}`);
        params.push(area);
      }
      if (session.role !== 'root' && session.allowed_areas?.length > 0) {
        conditions.push(`area = ANY($${idx++})`);
        params.push(session.allowed_areas);
      }
      if (salesman)   { conditions.push(`salesman ILIKE $${idx++}`);    params.push(`%${salesman}%`); }
      if (product)    { conditions.push(`product ILIKE $${idx++}`);     params.push(`%${product}%`);  }
      if (city)       { conditions.push(`city ILIKE $${idx++}`);        params.push(`%${city}%`);     }
      if (fileId)     { conditions.push(`dist_file_id = $${idx++}`);    params.push(parseInt(fileId)); }
      if (outletType) { conditions.push(`outlet_type ILIKE $${idx++}`); params.push(outletType); }
      conditions.push(`week_num BETWEEN $${idx++} AND $${idx++}`);
      params.push(weekStart, weekEnd);
      const where = conditions.join(' AND ');

      // WHERE tanpa filter salesman 
      const baseConditions: string[] = ['1=1'];
      const baseParams: any[] = [];
      let baseIdx = 1;
      if (area) { baseConditions.push(`area = $${baseIdx++}`); baseParams.push(area); }
      if (session.role !== 'root' && session.allowed_areas?.length > 0) {
        baseConditions.push(`area = ANY($${baseIdx++})`);
        baseParams.push(session.allowed_areas);
      }
      if (product)    { baseConditions.push(`product ILIKE $${baseIdx++}`);     baseParams.push(`%${product}%`);  }
      if (city)       { baseConditions.push(`city ILIKE $${baseIdx++}`);        baseParams.push(`%${city}%`);     }
      if (fileId)     { baseConditions.push(`dist_file_id = $${baseIdx++}`);    baseParams.push(parseInt(fileId)); }
      if (outletType) { baseConditions.push(`outlet_type ILIKE $${baseIdx++}`); baseParams.push(outletType); }
      baseConditions.push(`week_num BETWEEN $${baseIdx++} AND $${baseIdx++}`);
      baseParams.push(weekStart, weekEnd);
      const whereBase = baseConditions.join(' AND ');

      // WHERE dengan salesman tapi TANPA filter product 
      const withSalConditions: string[] = ['1=1'];
      const withSalParams: any[] = [];
      let withSalIdx = 1;
      if (area) { withSalConditions.push(`area = $${withSalIdx++}`); withSalParams.push(area); }
      if (session.role !== 'root' && session.allowed_areas?.length > 0) {
        withSalConditions.push(`area = ANY($${withSalIdx++})`);
        withSalParams.push(session.allowed_areas);
      }
      if (salesman)   { withSalConditions.push(`salesman ILIKE $${withSalIdx++}`);    withSalParams.push(`%${salesman}%`); }
      if (city)       { withSalConditions.push(`city ILIKE $${withSalIdx++}`);        withSalParams.push(`%${city}%`);     }
      if (fileId)     { withSalConditions.push(`dist_file_id = $${withSalIdx++}`);    withSalParams.push(parseInt(fileId)); }
      if (outletType) { withSalConditions.push(`outlet_type ILIKE $${withSalIdx++}`); withSalParams.push(outletType); }
      withSalConditions.push(`week_num BETWEEN $${withSalIdx++} AND $${withSalIdx++}`);
      withSalParams.push(weekStart, weekEnd);
      const whereWithSal = withSalConditions.join(' AND ');

      log('[GET] running queries in parallel...', { queryCount: 10 });
      const parallelStart = Date.now();

      const [
        achSalesmanQ,
        achProductQ,
        achAreaQ,
        trendQ,
        coverageQ,
        coverageSalesmanQ,
        summaryQ,
        outletTotalsQ,
        outletCountByTypeSalesmanQ,
        achSalesmanProductQ,
      ] = await Promise.all([

        timedQuery('achievementSalesman')(`
          WITH outlet_agg AS (
            SELECT salesman, outlet,
              MAX(CASE WHEN plan  > 0 THEN 1 ELSE 0 END) AS f_plan,
              MAX(CASE WHEN actual > 0 THEN 1 ELSE 0 END) AS f_actual,
              MAX(CASE WHEN av_in > 0 OR ec > 0 THEN 1 ELSE 0 END) AS f_avout
            FROM distribution_records WHERE ${where} GROUP BY salesman, outlet
          )
          SELECT salesman, SUM(f_plan) AS total_plan, SUM(f_actual) AS total_actual,
            SUM(f_avout) AS total_av_out, COUNT(DISTINCT outlet) AS outlet_count,
            CASE WHEN SUM(f_plan) > 0 THEN ROUND((SUM(f_avout)::numeric / SUM(f_plan)) * 100, 1) ELSE 0 END AS achievement_pct
          FROM outlet_agg GROUP BY salesman ORDER BY achievement_pct DESC
        `, params),

        timedQuery('achievementProduct')(`
          WITH outlet_agg AS (
            SELECT product, category, outlet,
              MAX(CASE WHEN plan  > 0 THEN 1 ELSE 0 END) AS f_plan,
              MAX(CASE WHEN actual > 0 THEN 1 ELSE 0 END) AS f_actual,
              MAX(CASE WHEN av_in > 0 OR ec > 0 THEN 1 ELSE 0 END) AS f_avout
            FROM distribution_records WHERE ${where} GROUP BY product, category, outlet
          )
          SELECT product, category, SUM(f_plan) AS total_plan, SUM(f_actual) AS total_actual,
            SUM(f_avout) AS total_av_out,
            CASE WHEN SUM(f_plan) > 0 THEN ROUND((SUM(f_avout)::numeric / SUM(f_plan)) * 100, 1) ELSE 0 END AS achievement_pct
          FROM outlet_agg GROUP BY product, category ORDER BY total_av_out DESC
        `, params),

        timedQuery('achievementArea')(`
          WITH outlet_agg AS (
            SELECT city, district, outlet,
              MAX(CASE WHEN plan  > 0 THEN 1 ELSE 0 END) AS f_plan,
              MAX(CASE WHEN actual > 0 THEN 1 ELSE 0 END) AS f_actual,
              MAX(CASE WHEN av_in > 0 OR ec > 0 THEN 1 ELSE 0 END) AS f_avout
            FROM distribution_records WHERE ${whereBase} GROUP BY city, district, outlet
          )
          SELECT city, district, SUM(f_plan) AS total_plan, SUM(f_actual) AS total_actual,
            SUM(f_avout) AS total_av_out, COUNT(DISTINCT outlet) AS outlet_count,
            CASE WHEN SUM(f_plan) > 0 THEN ROUND((SUM(f_avout)::numeric / SUM(f_plan)) * 100, 1) ELSE 0 END AS achievement_pct
          FROM outlet_agg GROUP BY city, district ORDER BY total_av_out DESC
        `, baseParams),

        timedQuery('trend')(`
          WITH outlet_agg AS (
            SELECT week, week_num, outlet,
              MAX(CASE WHEN plan  > 0 THEN 1 ELSE 0 END) AS f_plan,
              MAX(CASE WHEN actual > 0 THEN 1 ELSE 0 END) AS f_actual,
              MAX(CASE WHEN av_in > 0 THEN 1 ELSE 0 END) AS f_avin,
              MAX(CASE WHEN ec > 0 THEN 1 ELSE 0 END) AS f_ec,
              MAX(CASE WHEN av_in > 0 OR ec > 0 THEN 1 ELSE 0 END) AS f_avout
            FROM distribution_records WHERE ${where} GROUP BY week, week_num, outlet
          )
          SELECT week, week_num, SUM(f_plan) AS total_plan, SUM(f_actual) AS total_actual,
            SUM(f_avin) AS total_av_in, SUM(f_ec) AS total_ec, SUM(f_avout) AS total_av_out,
            COUNT(DISTINCT outlet) AS outlet_count
          FROM outlet_agg GROUP BY week, week_num ORDER BY week_num ASC
        `, params),

        timedQuery('coverage')(`
          WITH outlet_agg AS (
            SELECT outlet_type, outlet,
              MAX(CASE WHEN plan  > 0 THEN 1 ELSE 0 END) AS f_plan,
              MAX(CASE WHEN actual > 0 THEN 1 ELSE 0 END) AS f_actual,
              MAX(CASE WHEN av_in > 0 THEN 1 ELSE 0 END) AS f_avin,
              MAX(CASE WHEN ec > 0 THEN 1 ELSE 0 END) AS f_ec,
              MAX(CASE WHEN av_in > 0 OR ec > 0 THEN 1 ELSE 0 END) AS f_avout
            FROM distribution_records WHERE ${whereBase} GROUP BY outlet_type, outlet
          )
          SELECT outlet_type, SUM(f_plan) AS total_plan, SUM(f_actual) AS total_actual,
            SUM(f_avin) AS total_av_in, SUM(f_ec) AS total_ec, SUM(f_avout) AS total_av_out,
            COUNT(DISTINCT outlet) AS outlet_count,
            CASE WHEN SUM(f_plan) > 0 THEN ROUND((SUM(f_avout)::numeric / SUM(f_plan)) * 100, 1) ELSE 0 END AS achievement_pct
          FROM outlet_agg GROUP BY outlet_type ORDER BY total_av_out DESC
        `, baseParams),

        timedQuery('coverageSalesman')(`
          WITH outlet_agg AS (
            SELECT salesman, week_num, week, outlet,
              MAX(CASE WHEN plan  > 0 THEN 1 ELSE 0 END) AS f_plan,
              MAX(CASE WHEN actual > 0 THEN 1 ELSE 0 END) AS f_actual,
              MAX(CASE WHEN av_in > 0 THEN 1 ELSE 0 END) AS f_avin,
              MAX(CASE WHEN ec > 0 THEN 1 ELSE 0 END) AS f_ec,
              MAX(CASE WHEN av_in > 0 OR ec > 0 THEN 1 ELSE 0 END) AS f_avout
            FROM distribution_records WHERE ${where} GROUP BY salesman, week_num, week, outlet
          )
          SELECT salesman, week_num, week, SUM(f_plan) AS plan, SUM(f_actual) AS actual,
            SUM(f_avin) AS av_in, SUM(f_ec) AS ec, SUM(f_avout) AS av_out,
            COUNT(DISTINCT outlet) AS outlet_count,
            CASE WHEN SUM(f_plan) > 0 THEN ROUND((SUM(f_avout)::numeric / SUM(f_plan)) * 100, 1) ELSE 0 END AS achievement_pct
          FROM outlet_agg GROUP BY salesman, week_num, week ORDER BY salesman, week_num
        `, params),

        timedQuery('summary')(`
          WITH base AS (SELECT * FROM distribution_records WHERE ${where}),
          outlet_agg AS (
            SELECT outlet,
              MAX(CASE WHEN plan  > 0 THEN 1 ELSE 0 END) AS f_plan,
              MAX(CASE WHEN actual > 0 THEN 1 ELSE 0 END) AS f_actual,
              MAX(CASE WHEN av_in > 0 THEN 1 ELSE 0 END) AS f_avin,
              MAX(CASE WHEN ec > 0 THEN 1 ELSE 0 END) AS f_ec,
              MAX(CASE WHEN av_in > 0 OR ec > 0 THEN 1 ELSE 0 END) AS f_avout
            FROM base GROUP BY outlet
          )
          SELECT
            (SELECT COALESCE(SUM(f_plan), 0)   FROM outlet_agg) AS total_plan,
            (SELECT COALESCE(SUM(f_actual), 0) FROM outlet_agg) AS total_actual,
            (SELECT COALESCE(SUM(f_avin), 0)   FROM outlet_agg) AS total_av_in,
            (SELECT COALESCE(SUM(f_ec), 0)     FROM outlet_agg) AS total_ec,
            (SELECT COALESCE(SUM(f_avout), 0)  FROM outlet_agg) AS total_av_out,
            (SELECT COUNT(DISTINCT outlet)     FROM base)       AS total_outlets,
            (SELECT COUNT(DISTINCT salesman)   FROM base)       AS total_salesmen,
            (SELECT COUNT(DISTINCT product)    FROM base)       AS total_products,
            (SELECT COUNT(DISTINCT customer_id) FROM base)      AS total_customers,
            CASE WHEN (SELECT COALESCE(SUM(f_plan), 0) FROM outlet_agg) > 0
              THEN ROUND((SELECT COALESCE(SUM(f_avout), 0) FROM outlet_agg)::numeric / (SELECT SUM(f_plan) FROM outlet_agg) * 100, 1)
              ELSE 0 END AS overall_achievement
        `, params),

        timedQuery('outletTotals')(`
          SELECT outlet_type, COUNT(DISTINCT outlet) AS outlet_count, GROUPING(outlet_type) AS is_total
          FROM distribution_records WHERE ${whereWithSal}
          GROUP BY GROUPING SETS ((outlet_type), ())
        `, withSalParams),

        timedQuery('outletCountByTypeSalesman')(`
          SELECT salesman, outlet_type, COUNT(DISTINCT outlet) AS outlet_count
          FROM distribution_records WHERE ${where}
          GROUP BY salesman, outlet_type ORDER BY salesman, outlet_type
        `, params),

        timedQuery('achievementSalesmanProduct')(`
          WITH outlet_agg AS (
            SELECT salesman, product, outlet,
              MAX(CASE WHEN plan  > 0 THEN 1 ELSE 0 END) AS f_plan,
              MAX(CASE WHEN actual > 0 THEN 1 ELSE 0 END) AS f_actual,
              MAX(CASE WHEN av_in > 0 THEN 1 ELSE 0 END) AS f_avin,
              MAX(CASE WHEN ec > 0 THEN 1 ELSE 0 END) AS f_ec,
              MAX(CASE WHEN av_in > 0 OR ec > 0 THEN 1 ELSE 0 END) AS f_avout
            FROM distribution_records WHERE ${where} GROUP BY salesman, product, outlet
          )
          SELECT salesman, product, SUM(f_plan) AS total_plan, SUM(f_actual) AS total_actual,
            SUM(f_avin) AS total_av_in, SUM(f_ec) AS total_ec, SUM(f_avout) AS total_av_out,
            COUNT(DISTINCT outlet) AS outlet_count,
            CASE WHEN SUM(f_plan) > 0 THEN ROUND((SUM(f_avout)::numeric / SUM(f_plan)) * 100, 1) ELSE 0 END AS achievement_pct
          FROM outlet_agg GROUP BY salesman, product ORDER BY salesman, total_av_out DESC
        `, params),
      ]);

      const parallelMs = Date.now() - parallelStart;
      log('[GET] semua query selesai', { parallelMs });

      const outletCountByType = outletTotalsQ.rows.filter((r: any) => Number(r.is_total) === 0);
      const totalOutlets = parseInt(
        outletTotalsQ.rows.find((r: any) => Number(r.is_total) === 1)?.outlet_count ?? '0'
      );

      const responseData = {
        summary:                    summaryQ.rows[0] ?? {},
        achievementSalesman:        achSalesmanQ.rows,
        achievementProduct:         achProductQ.rows,
        achievementArea:            achAreaQ.rows,
        trend:                      trendQ.rows,
        coverage:                   coverageQ.rows,
        coverageSalesman:           coverageSalesmanQ.rows,
        outletCountByType,
        totalOutlets,
        outletCountByTypeSalesman:  outletCountByTypeSalesmanQ.rows,
        achievementSalesmanProduct: achSalesmanProductQ.rows,
      };

      //    Simpan ke cache SEBELUM return, supaya request berikutnya dengan
      //    filter yang sama nggak perlu tunggu query lagi 
      setCached(cacheParams, responseData);

      const totalMs = Date.now() - getStart;
      log('[GET] === SELESAI (cache miss, hasil disimpan) ===', { totalMs, parallelMs });
      if (totalMs > 3000) {
        log('[GET] Total response time tinggi — cek log query mana yang paling lambat di atas', { totalMs });
      }

      return NextResponse.json({ success: true, data: responseData });

    } catch (err) {
      logError('[GET] gagal', err, { ms: Date.now() - getStart });
      return NextResponse.json(
        { success: false, error: 'Gagal mengambil data distribusi' },
        { status: 500 }
      );
    }
  });
}

// 
// POST — Upload file Excel distribusi
// 
export async function POST(request: NextRequest) {
  return withAuth(request, 'upload_file', async (session) => {

    const uploadStart = Date.now();
    log('=== UPLOAD DISTRIBUSI START ===', { user: session.username, role: session.role });

    try {
      log('Step 1: Membaca form data...');
      const formData   = await request.formData();
      const file       = formData.get('file') as File;
      let selectedArea = formData.get('area') as string || '';

      if (!file) {
        return NextResponse.json({ success: false, error: 'File tidak ditemukan' }, { status: 400 });
      }

      log('Step 1: File diterima', {
        name: file.name, size: `${(file.size / 1024).toFixed(1)} KB`,
        type: file.type, area: selectedArea || '(belum dipilih)', userRole: session.role,
      });

      log('Step 2: Menentukan area...');
      if (session.role !== 'root' && !selectedArea) {
        const userAreas = session.allowed_areas || [];
        if (userAreas.length === 1) {
          selectedArea = userAreas[0];
          log('Step 2: Auto-assign area dari session', { area: selectedArea });
        } else {
          log('Step 2: Multiple area, tidak di-assign otomatis', { available: userAreas });
        }
      } else {
        log('Step 2: Area dari request', { area: selectedArea });
      }

      log('Step 3: Membaca file Excel...');
      const readStart = Date.now();
      const bytes     = await file.arrayBuffer();
      const buffer    = Buffer.from(bytes);

      let workbook: XLSX.WorkBook;
      try {
        workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
      } catch (xlsxErr) {
        logError('Step 3: Gagal parse Excel', xlsxErr, { file: file.name });
        return NextResponse.json(
          { success: false, error: 'File tidak bisa dibaca. Pastikan format .xlsx, .xls, atau .csv' },
          { status: 400 }
        );
      }

      const sheetNames = workbook.SheetNames;
      log('Step 3: Excel terbaca', { sheets: sheetNames, readMs: Date.now() - readStart });

      const sheet   = workbook.Sheets[sheetNames[0]];
      const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

      log('Step 3: Sheet di-parse', { totalRawRows: rawRows.length });

      if (!rawRows.length) {
        return NextResponse.json(
          { success: false, error: 'File kosong atau format tidak dikenali' },
          { status: 400 }
        );
      }

      const sampleRow       = rawRows[0] as Record<string, unknown>;
      const detectedColumns = Object.keys(sampleRow);
      log('Step 4: Kolom terdeteksi', { columns: detectedColumns });

      log('Step 5: Memproses baris data...');
      const parseStart = Date.now();
      const records: any[] = [];
      let skippedRows = 0;
      const skipReasons: Record<string, number> = {};

      for (const row of rawRows as any[]) {
        const weekRaw = row['Minggu']       || row['Week']     || '';
        const product = row['Produk']       || row['Product']  || '';
        const outlet  = row['Outlet']       || row['Customer'] || row['Nama Outlet'] || '';

        if (!product && !outlet) {
          skippedRows++;
          const reason = 'product+outlet kosong';
          skipReasons[reason] = (skipReasons[reason] ?? 0) + 1;
          continue;
        }

        const weekNum = parseWeekNum(weekRaw);

        records.push({
          week:        weekRaw.toString().trim() || `W${weekNum}`,
          week_num:    weekNum,
          product:     product.toString().trim(),
          category:    (row['Kategori Produk'] || row['Category'] || '').toString().trim(),
          customer_id: (row['Customer ID'] || row['No. Customer'] || '').toString().trim(),
          outlet:      outlet.toString().trim(),
          outlet_type: (row['Tipe Outlet'] || row['Outlet Type'] || '').toString().trim(),
          salesman:    (row['Salesman'] || '').toString().trim(),
          village:     (row['Desa']      || row['Village']  || '').toString().trim(),
          district:    (row['Kecamatan'] || row['District'] || '').toString().trim(),
          city:        (row['Kota']      || row['City']     || '').toString().trim(),
          area:        selectedArea || null,
          plan:    parseNum(row['Plan']),
          actual:  parseNum(row['Aktual']  ?? row['Actual']),
          av_in:   parseNum(row['Av-In']   ?? row['AvIn']   ?? row['AV IN']),
          ec:      parseNum(row['EC']),
          av_out:  parseNum(row['Av-Out']  ?? row['AvOut']  ?? row['AV OUT']),
        });
      }

      log('Step 5: Parse selesai', {
        totalRaw: rawRows.length, validRecords: records.length,
        skippedRows, skipReasons, parseMs: Date.now() - parseStart,
      });

      if (!records.length) {
        return NextResponse.json({
          success: false,
          error: 'Tidak ada data valid. Pastikan header kolom sesuai: Minggu, Produk, Outlet, Plan, Aktual, Av-In, EC, Av-Out',
        }, { status: 400 });
      }

      log('Step 6: Memulai transaksi database...');
      const dbStart = Date.now();
      const client  = await pool.connect();

      try {
        await client.query('BEGIN');

        const fileRes = await client.query(`
          INSERT INTO distribution_files
            (filename, original_name, file_size, record_count, status, uploaded_by, area)
          VALUES ($1, $2, $3, $4, 'processing', $5, $6)
          RETURNING id
        `, [
          `dist_${Date.now()}.xlsx`,
          file.name, file.size, records.length,
          session.username, selectedArea || null,
        ]);

        const fileId       = fileRes.rows[0].id;
        const BATCH        = 1000;
        const totalBatches = Math.ceil(records.length / BATCH);

        for (let i = 0; i < records.length; i += BATCH) {
          const batchNum = Math.floor(i / BATCH) + 1;
          const batch    = records.slice(i, i + BATCH);

          const valueStrings = batch.map((_, bi) => {
            const base = bi * 18;
            return `($${base+1},$${base+2},$${base+3},$${base+4},$${base+5},$${base+6},$${base+7},$${base+8},$${base+9},$${base+10},$${base+11},$${base+12},$${base+13},$${base+14},$${base+15},$${base+16},$${base+17},$${base+18})`;
          }).join(',');

          const vals = batch.flatMap(r => [
            fileId, r.week, r.week_num, r.product, r.category,
            r.customer_id, r.outlet, r.outlet_type, r.salesman,
            r.village, r.district, r.city, r.area,
            r.plan, r.actual, r.av_in, r.ec, r.av_out,
          ]);

          try {
            await client.query(`
              INSERT INTO distribution_records
                (dist_file_id, week, week_num, product, category, customer_id, outlet, outlet_type,
                 salesman, village, district, city, area, plan, actual, av_in, ec, av_out)
              VALUES ${valueStrings}
            `, vals);
          } catch (batchErr) {
            logError(`Step 6: Batch ${batchNum}/${totalBatches} gagal`, batchErr);
            throw batchErr;
          }
        }

        await client.query(
          `UPDATE distribution_files SET status = 'completed', record_count = $1 WHERE id = $2`,
          [records.length, fileId]
        );

        await client.query('COMMIT');

        //  Invalidate cache — data distribusi berubah, semua hasil GET yang di-cache sebelumnya sudah nggak akurat lagi
        invalidateAll();

        log('=== UPLOAD DISTRIBUSI SELESAI ✓ ===', {
          fileId, fileName: file.name, area: selectedArea,
          recordCount: records.length, totalMs: `${Date.now() - uploadStart}ms`,
        });

        return NextResponse.json({
          success: true,
          data: {
            file_id: fileId, filename: file.name,
            record_count: records.length, area: selectedArea,
            preview: records.slice(0, 5),
          },
        });

      } catch (err) {
        await client.query('ROLLBACK');
        logError('Step 6: ROLLBACK', err);
        throw err;
      } finally {
        client.release();
      }

    } catch (err) {
      logError(`=== UPLOAD GAGAL (${Date.now() - uploadStart}ms) ===`, err);
      return NextResponse.json(
        { success: false, error: 'Gagal memproses file distribusi' },
        { status: 500 }
      );
    }
  });
}

// 
// DELETE
// 
// FK dist_file_id -> distribution_files(id) sudah ON DELETE CASCADE, 
// jadi cukup hapus row file-nya, distribution_records terkait ikut kehapus otomatis oleh Postgres dalam satu transaksi  
// (atomic, tanpa perlu DELETE manual dua tahap).
export async function DELETE(request: NextRequest) {
  return withAuth(request, 'delete_file', async () => {
    const deleteStart = Date.now();
    try {
      const { searchParams } = new URL(request.url);
      const fileId = searchParams.get('id');

      if (!fileId) {
        return NextResponse.json({ success: false, error: 'ID file diperlukan' }, { status: 400 });
      }

      log('DELETE distribusi file', { fileId });

      const res = await pool.query(
        'DELETE FROM distribution_files WHERE id = $1 RETURNING original_name',
        [fileId]
      );

      if (!res.rows.length) {
        return NextResponse.json({ success: false, error: 'File tidak ditemukan' }, { status: 404 });
      }

      // Invalidate cache — sama alasannya dengan POST
      invalidateAll();

      log('DELETE selesai', {
        fileId, deletedFile: res.rows[0].original_name,
        totalMs: Date.now() - deleteStart,
      });

      return NextResponse.json({ success: true, deleted: res.rows[0].original_name });

    } catch (err) {
      logError('DELETE distribusi gagal', err);
      return NextResponse.json({ success: false, error: 'Gagal menghapus file' }, { status: 500 });
    }
  });
}