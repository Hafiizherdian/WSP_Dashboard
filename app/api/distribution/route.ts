/**
 * app/api/distribution/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { withAuth } from '@/lib/auth/session';
import * as XLSX from 'xlsx';

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
  console.error(`[dist-upload] [${ts}] ❌ ${step}`, detail ?? '', err);
}

// ═══════════════════════════════════════════════════════════════════════════════
// GET
// ═══════════════════════════════════════════════════════════════════════════════
export async function GET(request: NextRequest) {
  return withAuth(request, 'view_files', async (session) => {
    try {
      const { searchParams } = new URL(request.url);

      // ── Early return: hanya daftar file (untuk admin page load awal) ──────
      const mode = searchParams.get('mode');
      if (mode === 'files') {
        const filesQ = await pool.query(`
          SELECT id, original_name, record_count, area, created_at
          FROM distribution_files
          WHERE status = 'completed'
          ORDER BY created_at DESC
        `);
        return NextResponse.json({
          success: true,
          data: { files: filesQ.rows },
        });
      }

      // ── Query lengkap ─────────────────────────────────────────────────────
      const area      = searchParams.get('area') || '';
      const salesman  = searchParams.get('salesman') || '';
      const product   = searchParams.get('product') || '';
      const weekStart = parseInt(searchParams.get('weekStart') || '1');
      const weekEnd   = parseInt(searchParams.get('weekEnd') || '52');
      const city      = searchParams.get('city') || '';
      const fileId    = searchParams.get('fileId') || '';

      // ── WHERE dengan semua filter (dipakai mayoritas query) ────────────────
      const params: any[] = [];
      let idx = 1;
      const conditions: string[] = ['1=1'];

      if (session.role !== 'root' && session.allowed_areas?.length > 0) {
        conditions.push(`area = ANY($${idx++})`);
        params.push(session.allowed_areas);
      } else if (area) {
        conditions.push(`area = $${idx++}`);
        params.push(area);
      }

      if (salesman) { conditions.push(`salesman ILIKE $${idx++}`); params.push(`%${salesman}%`); }
      if (product)  { conditions.push(`product ILIKE $${idx++}`);  params.push(`%${product}%`);  }
      if (city)     { conditions.push(`city ILIKE $${idx++}`);     params.push(`%${city}%`);     }
      if (fileId)   { conditions.push(`dist_file_id = $${idx++}`); params.push(parseInt(fileId)); }

      conditions.push(`week_num BETWEEN $${idx++} AND $${idx++}`);
      params.push(weekStart, weekEnd);

      const where = conditions.join(' AND ');

      // ── WHERE tanpa filter salesman (untuk query area/coverage) ───────────
      const baseConditions: string[] = ['1=1'];
      const baseParams: any[] = [];
      let baseIdx = 1;

      if (session.role !== 'root' && session.allowed_areas?.length > 0) {
        baseConditions.push(`area = ANY($${baseIdx++})`);
        baseParams.push(session.allowed_areas);
      } else if (area) {
        baseConditions.push(`area = $${baseIdx++}`);
        baseParams.push(area);
      }

      if (product)  { baseConditions.push(`product ILIKE $${baseIdx++}`);  baseParams.push(`%${product}%`);  }
      if (city)     { baseConditions.push(`city ILIKE $${baseIdx++}`);     baseParams.push(`%${city}%`);     }
      if (fileId)   { baseConditions.push(`dist_file_id = $${baseIdx++}`); baseParams.push(parseInt(fileId)); }

      baseConditions.push(`week_num BETWEEN $${baseIdx++} AND $${baseIdx++}`);
      baseParams.push(weekStart, weekEnd);

      const whereBase = baseConditions.join(' AND ');

      // ── WHERE tanpa filter salesman DAN tanpa filter product ───────────────
      const noSalNoProdConditions: string[] = ['1=1'];
      const noSalNoProdParams: any[] = [];
      let noSalNoProdIdx = 1;

      if (session.role !== 'root' && session.allowed_areas?.length > 0) {
        noSalNoProdConditions.push(`area = ANY($${noSalNoProdIdx++})`);
        noSalNoProdParams.push(session.allowed_areas);
      } else if (area) {
        noSalNoProdConditions.push(`area = $${noSalNoProdIdx++}`);
        noSalNoProdParams.push(area);
      }

      if (city)   { noSalNoProdConditions.push(`city ILIKE $${noSalNoProdIdx++}`);   noSalNoProdParams.push(`%${city}%`);   }
      if (fileId) { noSalNoProdConditions.push(`dist_file_id = $${noSalNoProdIdx++}`); noSalNoProdParams.push(parseInt(fileId)); }

      noSalNoProdConditions.push(`week_num BETWEEN $${noSalNoProdIdx++} AND $${noSalNoProdIdx++}`);
      noSalNoProdParams.push(weekStart, weekEnd);

      const whereNoSalNoProd = noSalNoProdConditions.join(' AND ');

      // ── WHERE dengan salesman tapi TANPA filter product ────────────────────
      const withSalConditions: string[] = ['1=1'];
      const withSalParams: any[] = [];
      let withSalIdx = 1;

      if (session.role !== 'root' && session.allowed_areas?.length > 0) {
        withSalConditions.push(`area = ANY($${withSalIdx++})`);
        withSalParams.push(session.allowed_areas);
      } else if (area) {
        withSalConditions.push(`area = $${withSalIdx++}`);
        withSalParams.push(area);
      }

      if (salesman) { withSalConditions.push(`salesman ILIKE $${withSalIdx++}`); withSalParams.push(`%${salesman}%`); }
      if (city)     { withSalConditions.push(`city ILIKE $${withSalIdx++}`);     withSalParams.push(`%${city}%`);     }
      if (fileId)   { withSalConditions.push(`dist_file_id = $${withSalIdx++}`); withSalParams.push(parseInt(fileId)); }

      withSalConditions.push(`week_num BETWEEN $${withSalIdx++} AND $${withSalIdx++}`);
      withSalParams.push(weekStart, weekEnd);

      const whereWithSal = withSalConditions.join(' AND ');

      // ── WHERE untuk minggu sebelumnya (WoW) ───────────────────────────────
      // Pakai filter yang sama dengan `where` tapi range minggu digeser -1
      // Hanya berlaku jika weekStart > 1, jika tidak hasilnya kosong (wajar)
      const prevWeekStart = weekStart - 1;
      const prevWeekEnd   = weekEnd   - 1;

      const prevConditions: string[] = ['1=1'];
      const prevParams: any[] = [];
      let prevIdx = 1;

      if (session.role !== 'root' && session.allowed_areas?.length > 0) {
        prevConditions.push(`area = ANY($${prevIdx++})`);
        prevParams.push(session.allowed_areas);
      } else if (area) {
        prevConditions.push(`area = $${prevIdx++}`);
        prevParams.push(area);
      }

      if (salesman) { prevConditions.push(`salesman ILIKE $${prevIdx++}`); prevParams.push(`%${salesman}%`); }
      if (product)  { prevConditions.push(`product ILIKE $${prevIdx++}`);  prevParams.push(`%${product}%`);  }
      if (city)     { prevConditions.push(`city ILIKE $${prevIdx++}`);     prevParams.push(`%${city}%`);     }
      if (fileId)   { prevConditions.push(`dist_file_id = $${prevIdx++}`); prevParams.push(parseInt(fileId)); }

      // Hanya query prev jika ada minggu sebelumnya yang valid
      if (prevWeekStart >= 1) {
        prevConditions.push(`week_num BETWEEN $${prevIdx++} AND $${prevIdx++}`);
        prevParams.push(prevWeekStart, prevWeekEnd);
      } else {
        // Paksa kosong — tidak ada minggu sebelumnya
        prevConditions.push('1=0');
      }

      const wherePrevWeek = prevConditions.join(' AND ');

      const [
        achSalesmanQ,
        achProductQ,
        achAreaQ,
        trendQ,
        coverageQ,
        coverageSalesmanQ,
        summaryQ,
        filesQ,
        outletCountByTypeQ,
        totalOutletsQ,
        outletCountByTypeSalesmanQ,
        achAreaSalesmanQ,
        achAreaProductQ,
        achAreaOutletTypeQ,
        // ── BARU ──────────────────────────────────────────────────────────────
        missEcQ,
        summaryPrevWeekQ,
      ] = await Promise.all([

        // Achievement per salesman × product
        pool.query(`
          SELECT
            salesman,
            product,
            SUM(plan)   AS total_plan,
            SUM(actual) AS total_actual,
            SUM(av_out) AS total_av_out,
            COUNT(DISTINCT outlet) AS outlet_count,
            CASE
              WHEN SUM(plan) > 0
              THEN ROUND((SUM(av_out) / SUM(plan)) * 100, 1)
              ELSE 0
            END AS achievement_pct
          FROM distribution_records
          WHERE ${where}
          GROUP BY salesman, product
          ORDER BY achievement_pct DESC
        `, params),

        // Achievement per produk
        pool.query(`
          SELECT
            product,
            category,
            SUM(plan)   AS total_plan,
            SUM(actual) AS total_actual,
            SUM(av_out) AS total_av_out,
            CASE
              WHEN SUM(plan) > 0
              THEN ROUND((SUM(av_out) / SUM(plan)) * 100, 1)
              ELSE 0
            END AS achievement_pct
          FROM distribution_records
          WHERE ${where}
          GROUP BY product, category
          ORDER BY total_av_out DESC
        `, params),

        // Achievement per area (base — tanpa filter salesman)
        pool.query(`
          SELECT
            city,
            district,
            SUM(plan)   AS total_plan,
            SUM(actual) AS total_actual,
            SUM(av_out) AS total_av_out,
            COUNT(DISTINCT outlet) AS outlet_count,
            CASE
              WHEN SUM(plan) > 0
              THEN ROUND((SUM(av_out) / SUM(plan)) * 100, 1)
              ELSE 0
            END AS achievement_pct
          FROM distribution_records
          WHERE ${whereBase}
          GROUP BY city, district
          ORDER BY total_av_out DESC
        `, baseParams),

        // Trend mingguan × product
        pool.query(`
          SELECT
            week,
            week_num,
            product,
            SUM(plan)              AS total_plan,
            SUM(actual)            AS total_actual,
            SUM(av_in)             AS total_av_in,
            SUM(ec)                AS total_ec,
            SUM(av_out)            AS total_av_out,
            COUNT(DISTINCT outlet) AS outlet_count
          FROM distribution_records
          WHERE ${where}
          GROUP BY week, week_num, product
          ORDER BY week_num ASC, product ASC
        `, params),

        // Coverage per tipe outlet × product (tanpa filter salesman)
        pool.query(`
          SELECT
            outlet_type,
            product,
            SUM(plan)   AS total_plan,
            SUM(actual) AS total_actual,
            SUM(av_in)  AS total_av_in,
            SUM(ec)     AS total_ec,
            SUM(av_out) AS total_av_out,
            CASE
              WHEN SUM(plan) > 0
              THEN ROUND((SUM(av_out) / SUM(plan)) * 100, 1)
              ELSE 0
            END AS achievement_pct
          FROM distribution_records
          WHERE ${whereBase}
          GROUP BY outlet_type, product
          ORDER BY total_av_out DESC
        `, baseParams),

        // Coverage salesman per minggu × product × outlet_type (heatmap)
        pool.query(`
          SELECT
            salesman,
            week_num,
            week,
            product,
            outlet_type,
            SUM(plan)   AS plan,
            SUM(actual) AS actual,
            SUM(av_in)  AS av_in,
            SUM(ec)     AS ec,
            SUM(av_out) AS av_out,
            COUNT(DISTINCT outlet) AS outlet_count,
            CASE
              WHEN SUM(plan) > 0
              THEN ROUND((SUM(av_out) / SUM(plan)) * 100, 1)
              ELSE 0
            END AS achievement_pct
          FROM distribution_records
          WHERE ${where}
          GROUP BY salesman, week_num, week, product, outlet_type
          ORDER BY salesman, week_num, product
        `, params),

        // Summary keseluruhan
        pool.query(`
          SELECT
            SUM(plan)                   AS total_plan,
            SUM(actual)                 AS total_actual,
            SUM(av_in)                  AS total_av_in,
            SUM(ec)                     AS total_ec,
            SUM(av_out)                 AS total_av_out,
            COUNT(DISTINCT outlet)      AS total_outlets,
            COUNT(DISTINCT salesman)    AS total_salesmen,
            COUNT(DISTINCT product)     AS total_products,
            COUNT(DISTINCT customer_id) AS total_customers,
            CASE
              WHEN SUM(plan) > 0
              THEN ROUND((SUM(av_out) / SUM(plan)) * 100, 1)
              ELSE 0
            END AS overall_achievement
          FROM distribution_records
          WHERE ${where}
        `, params),

        // Daftar file upload
        pool.query(`
          SELECT id, original_name, record_count, area, created_at
          FROM distribution_files
          WHERE status = 'completed'
          ORDER BY created_at DESC
        `),

        // Outlet count per tipe — ikut filter salesman (pakai whereWithSal)
        pool.query(`
          SELECT
            outlet_type,
            COUNT(DISTINCT outlet) AS outlet_count
          FROM distribution_records
          WHERE ${whereWithSal}
          GROUP BY outlet_type
        `, withSalParams),

        // Total outlet — ikut filter salesman (pakai whereWithSal)
        pool.query(`
          SELECT COUNT(DISTINCT outlet) AS total_outlets
          FROM distribution_records
          WHERE ${whereWithSal}
        `, withSalParams),

        // Outlet count per outlet_type per salesman
        pool.query(`
          SELECT
            salesman,
            outlet_type,
            COUNT(DISTINCT outlet) AS outlet_count
          FROM distribution_records
          WHERE ${where}
          GROUP BY salesman, outlet_type
          ORDER BY salesman, outlet_type
        `, params),

        // Achievement area per SALESMAN × city × district
        pool.query(`
          SELECT
            salesman,
            city,
            district,
            SUM(plan)   AS total_plan,
            SUM(actual) AS total_actual,
            SUM(av_out) AS total_av_out,
            COUNT(DISTINCT outlet) AS outlet_count,
            CASE
              WHEN SUM(plan) > 0
              THEN ROUND((SUM(av_out) / SUM(plan)) * 100, 1)
              ELSE 0
            END AS achievement_pct
          FROM distribution_records
          WHERE ${where}
          GROUP BY salesman, city, district
          ORDER BY total_av_out DESC
        `, params),

        // Achievement area per PRODUCT × city × district
        pool.query(`
          SELECT
            product,
            city,
            district,
            SUM(plan)   AS total_plan,
            SUM(actual) AS total_actual,
            SUM(av_out) AS total_av_out,
            COUNT(DISTINCT outlet) AS outlet_count,
            CASE
              WHEN SUM(plan) > 0
              THEN ROUND((SUM(av_out) / SUM(plan)) * 100, 1)
              ELSE 0
            END AS achievement_pct
          FROM distribution_records
          WHERE ${whereNoSalNoProd}
          GROUP BY product, city, district
          ORDER BY total_av_out DESC
        `, noSalNoProdParams),

        // Achievement area per OUTLET_TYPE × city × district
        pool.query(`
          SELECT
            outlet_type,
            city,
            district,
            SUM(plan)   AS total_plan,
            SUM(actual) AS total_actual,
            SUM(av_out) AS total_av_out,
            COUNT(DISTINCT outlet) AS outlet_count,
            CASE
              WHEN SUM(plan) > 0
              THEN ROUND((SUM(av_out) / SUM(plan)) * 100, 1)
              ELSE 0
            END AS achievement_pct
          FROM distribution_records
          WHERE ${whereNoSalNoProd}
          GROUP BY outlet_type, city, district
          ORDER BY total_av_out DESC
        `, noSalNoProdParams),

        // ── BARU: Miss Distribusi ──────────────────────────────────────────────────
        // Outlet yang dikunjungi (actual >= 1) tapi tidak ada distribusi (av_out = 0)
        pool.query(`
          SELECT
            outlet,
            salesman,
            city,
            district,
            outlet_type,
            SUM(actual) AS total_actual,
            SUM(ec)     AS total_ec,
            SUM(av_in)  AS total_av_in,
            SUM(av_out) AS total_av_out
          FROM distribution_records
          WHERE ${where}
          GROUP BY outlet, salesman, city, district, outlet_type
          HAVING SUM(actual) >= 1 AND SUM(av_out) = 0
          ORDER BY SUM(actual) DESC
        `, params),

        // ── BARU: Summary minggu sebelumnya (WoW delta) ───────────────────────
        // Range digeser mundur 1 minggu: weekStart-1 s/d weekEnd-1
        // Pakai filter area/salesman/product yang sama agar perbandingan apple-to-apple
        pool.query(`
          SELECT
            SUM(plan)              AS total_plan,
            SUM(actual)            AS total_actual,
            SUM(av_in)             AS total_av_in,
            SUM(ec)                AS total_ec,
            SUM(av_out)            AS total_av_out,
            COUNT(DISTINCT outlet) AS total_outlets,
            CASE
              WHEN SUM(plan) > 0
              THEN ROUND((SUM(av_out) / SUM(plan)) * 100, 1)
              ELSE 0
            END AS overall_achievement
          FROM distribution_records
          WHERE ${wherePrevWeek}
        `, prevParams),
      ]);

      // ── Bangun summaryPrevWeek: hanya kirim jika ada data ─────────────────
      // const prevRow = summaryPrevWeekQ.rows[0];
      // const hasPrevData = prevRow && parseFloat(prevRow.total_plan ?? '0') > 0;
      // const summaryPrevWeek = hasPrevData
      //   ? {
      //       total_plan:          parseFloat(prevRow.total_plan          ?? 0),
      //       total_actual:        parseFloat(prevRow.total_actual        ?? 0),
      //       total_av_in:         parseFloat(prevRow.total_av_in         ?? 0),
      //       total_ec:            parseFloat(prevRow.total_ec            ?? 0),
      //       total_av_out:        parseFloat(prevRow.total_av_out        ?? 0),
      //       total_outlets:       parseFloat(prevRow.total_outlets       ?? 0),
      //       overall_achievement: parseFloat(prevRow.overall_achievement ?? 0),
      //     }
      //   : null;

      return NextResponse.json({
        success: true,
        data: {
          summary:                    summaryQ.rows[0] ?? {},
          achievementSalesman:        achSalesmanQ.rows,
          achievementProduct:         achProductQ.rows,
          achievementArea:            achAreaQ.rows,
          trend:                      trendQ.rows,
          coverage:                   coverageQ.rows,
          coverageSalesman:           coverageSalesmanQ.rows,
          // files:                   filesQ.rows,
          outletCountByType:          outletCountByTypeQ.rows,
          totalOutlets:               parseInt(totalOutletsQ.rows[0]?.total_outlets ?? '0'),
          outletCountByTypeSalesman:  outletCountByTypeSalesmanQ.rows,
          achievementAreaSalesman:    achAreaSalesmanQ.rows,
          achievementAreaProduct:     achAreaProductQ.rows,
          achievementAreaOutletType:  achAreaOutletTypeQ.rows,
          // ── BARU ────────────────────────────────────────────────────────────
          missDistribusi: missEcQ.rows,
          // summaryPrevWeek,
        },
      });

    } catch (err) {
      console.error('[api/distribution GET]', err);
      return NextResponse.json(
        { success: false, error: 'Gagal mengambil data distribusi' },
        { status: 500 }
      );
    }
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// POST — Upload file Excel distribusi
// ═══════════════════════════════════════════════════════════════════════════════
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
        log('Step 1: ❌ File tidak ditemukan di form data');
        return NextResponse.json(
          { success: false, error: 'File tidak ditemukan' },
          { status: 400 }
        );
      }

      log('Step 1: ✓ File diterima', {
        name:     file.name,
        size:     `${(file.size / 1024).toFixed(1)} KB`,
        type:     file.type,
        area:     selectedArea || '(belum dipilih)',
        userRole: session.role,
      });

      log('Step 2: Menentukan area...');
      if (session.role !== 'root' && !selectedArea) {
        const userAreas = session.allowed_areas || [];
        if (userAreas.length === 1) {
          selectedArea = userAreas[0];
          log('Step 2: Auto-assign area dari session', { area: selectedArea });
        } else {
          log('Step 2: ⚠ Multiple area, tidak di-assign otomatis', { available: userAreas });
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
      log('Step 3: ✓ Excel terbaca', { sheets: sheetNames, readMs: Date.now() - readStart });

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

      log('Step 5: ✓ Parse selesai', {
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
          file.name,
          file.size,
          records.length,
          session.username,
          selectedArea || null,
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

        log('=== UPLOAD DISTRIBUSI SELESAI ✓ ===', {
          fileId, fileName: file.name, area: selectedArea,
          recordCount: records.length,
          totalMs: `${Date.now() - uploadStart}ms`,
        });

        return NextResponse.json({
          success: true,
          data: {
            file_id:      fileId,
            filename:     file.name,
            record_count: records.length,
            area:         selectedArea,
            preview:      records.slice(0, 5),
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

// ═══════════════════════════════════════════════════════════════════════════════
// DELETE
// ═══════════════════════════════════════════════════════════════════════════════
export async function DELETE(request: NextRequest) {
  return withAuth(request, 'delete_file', async () => {
    try {
      const { searchParams } = new URL(request.url);
      const fileId = searchParams.get('id');

      if (!fileId) {
        return NextResponse.json(
          { success: false, error: 'ID file diperlukan' },
          { status: 400 }
        );
      }

      log('DELETE distribusi file', { fileId });

      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        const delRecords = await client.query(
          'DELETE FROM distribution_records WHERE dist_file_id = $1',
          [fileId]
        );

        const res = await client.query(
          'DELETE FROM distribution_files WHERE id = $1 RETURNING original_name',
          [fileId]
        );

        await client.query('COMMIT');

        if (!res.rows.length) {
          return NextResponse.json(
            { success: false, error: 'File tidak ditemukan' },
            { status: 404 }
          );
        }

        log('DELETE selesai', {
          fileId,
          deletedFile:    res.rows[0].original_name,
          deletedRecords: delRecords.rowCount,
        });

        return NextResponse.json({
          success: true,
          deleted: res.rows[0].original_name,
        });

      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }

    } catch (err) {
      logError('DELETE distribusi gagal', err);
      return NextResponse.json(
        { success: false, error: 'Gagal menghapus file' },
        { status: 500 }
      );
    }
  });
}