/**
 * POST /api/piutang/upload
 *
 * Menerima file .xlsx piutang + field `area`, parse kolom, insert ke piutang_records.
 *
 * Kolom Excel (match by header, case-insensitive):
 *   Faktur | Kode | Outlet | Kota | Kecamatan | Kel/Desa | Salesman |
 *   Tanggal | Jatuh Tempo | Hari | Piutang | Giro
 */

import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { pool } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normalizeHeader(h: string): string {
  return String(h ?? '').toLowerCase().replace(/[\s/]/g, '');
}

function parseNumber(val: any): number {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return Math.round(val);
  const cleaned = String(val).replace(/[,.\s]/g, '').replace(/[^0-9-]/g, '');
  const n = parseInt(cleaned, 10);
  return Number.isFinite(n) ? n : 0;
}

function parseHari(val: any): number | null {
  if (val === null || val === undefined || val === '') return null;
  const str = String(val).trim();
  if (str === '' || str === '-') return null;
  const n = parseInt(str.replace(/[^0-9-]/g, ''), 10);
  return Number.isFinite(n) ? n : null;
}

function parseDate(val: any): string | null {
  if (val === null || val === undefined || val === '') return null;

  if (typeof val === 'number') {
    const date = XLSX.SSF.parse_date_code(val);
    if (date) {
      const y = date.y;
      const m = String(date.m).padStart(2, '0');
      const d = String(date.d).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    return null;
  }

  const str = String(val).trim();
  if (!str || str === '-') return null;

  // "14-Aug-2012"
  const monthMap: Record<string, string> = {
    jan:'01', feb:'02', mar:'03', apr:'04', may:'05', jun:'06',
    jul:'07', aug:'08', sep:'09', oct:'10', nov:'11', dec:'12',
  };
  const ddMmmYyyy = str.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/);
  if (ddMmmYyyy) {
    const [, dd, mmm, yyyy] = ddMmmYyyy;
    const mm = monthMap[mmm.toLowerCase()];
    if (mm) return `${yyyy}-${mm}-${dd.padStart(2, '0')}`;
  }

  const d = new Date(str);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);

  return null;
}

function str(val: any): string {
  return String(val ?? '').trim();
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const area = str(formData.get('area'));

    if (!file) {
      return NextResponse.json({ success: false, error: 'File tidak ditemukan' }, { status: 400 });
    }
    if (!area) {
      return NextResponse.json({ success: false, error: 'Area wajib dipilih' }, { status: 400 });
    }

    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.xlsx?$/i)) {
      return NextResponse.json({ success: false, error: 'File harus berformat .xlsx atau .xls' }, { status: 400 });
    }

    const buffer   = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: false });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return NextResponse.json({ success: false, error: 'Workbook kosong' }, { status: 400 });
    }

    const sheet = workbook.Sheets[sheetName];
    const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

    if (rows.length < 2) {
      return NextResponse.json({ success: false, error: 'Sheet kosong atau tidak ada data' }, { status: 400 });
    }

    // ── Header mapping ────────────────────────────────────────────────────────
    const headerRow = rows[0].map((h: any) => normalizeHeader(String(h)));

    const COL: Record<string, number> = {};
    const ALIASES: Record<string, string[]> = {
      faktur:     ['faktur', 'nofaktur', 'no.faktur', 'invoice'],
      kode:       ['kode', 'kodecustomer', 'cst'],
      outlet:     ['outlet', 'namaoutlet', 'customer', 'namatoko'],
      kota:       ['kota', 'kabupaten', 'kotakabupaten'],
      kecamatan:  ['kecamatan'],
      keldesa:    ['keldesa', 'kelurahan', 'desa', 'keldes'],
      salesman:   ['salesman', 'sales', 'namasales'],
      tanggal:    ['tanggal', 'tglfaktur', 'tanggalfaktur', 'date'],
      jatuhtempo: ['jatuhtempo', 'tgljatuhtempo', 'duedate'],
      hari:       ['hari', 'umur', 'overdue', 'aging'],
      piutang:    ['piutang', 'sisapiutang', 'jumlahpiutang', 'ar'],
      giro:       ['giro', 'jumlahgiro'],
    };

    for (const [field, aliases] of Object.entries(ALIASES)) {
      const idx = headerRow.findIndex((h: string) => aliases.includes(h));
      if (idx !== -1) COL[field] = idx;
    }

    const required = ['faktur', 'kode', 'outlet', 'piutang'];
    const missing  = required.filter(f => COL[f] === undefined);
    if (missing.length > 0) {
      return NextResponse.json({
        success: false,
        error: `Kolom tidak ditemukan: ${missing.join(', ')}. Header file: ${rows[0].join(' | ')}`,
      }, { status: 400 });
    }

    // ── Parse rows ────────────────────────────────────────────────────────────
    interface ParsedRow {
      faktur: string; kode: string; outlet: string;
      kota: string; kecamatan: string; kel_desa: string; salesman: string;
      tanggal: string | null; jatuh_tempo: string | null; hari: number | null;
      piutang: number; giro: number;
    }

    const parsed: ParsedRow[] = [];
    let skipped = 0;

    for (let i = 1; i < rows.length; i++) {
      const row    = rows[i];
      const faktur = str(COL.faktur !== undefined ? row[COL.faktur] : '');
      if (!faktur) { skipped++; continue; }

      // Skip baris subtotal/total
      if (/^(total|sub.?total|grand)/i.test(faktur)) { skipped++; continue; }

      parsed.push({
        faktur,
        kode:        str(COL.kode       !== undefined ? row[COL.kode]       : ''),
        outlet:      str(COL.outlet     !== undefined ? row[COL.outlet]     : ''),
        kota:        str(COL.kota       !== undefined ? row[COL.kota]       : ''),
        kecamatan:   str(COL.kecamatan  !== undefined ? row[COL.kecamatan]  : ''),
        kel_desa:    str(COL.keldesa    !== undefined ? row[COL.keldesa]    : ''),
        salesman:    str(COL.salesman   !== undefined ? row[COL.salesman]   : ''),
        tanggal:     parseDate(COL.tanggal    !== undefined ? row[COL.tanggal]    : null),
        jatuh_tempo: parseDate(COL.jatuhtempo !== undefined ? row[COL.jatuhtempo] : null),
        hari:        parseHari(COL.hari       !== undefined ? row[COL.hari]       : null),
        piutang:     parseNumber(COL.piutang  !== undefined ? row[COL.piutang]    : 0),
        giro:        parseNumber(COL.giro     !== undefined ? row[COL.giro]       : 0),
      });
    }

    if (parsed.length === 0) {
      return NextResponse.json({ success: false, error: 'Tidak ada baris valid ditemukan' }, { status: 400 });
    }

    // ── DB insert ─────────────────────────────────────────────────────────────
    const fileId = uuidv4();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Insert file metadata (include area)
      await client.query(
        `INSERT INTO piutang_files (id, original_name, row_count, area, uploaded_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [fileId, file.name, parsed.length, area],
      );

      // Bulk insert records (include area)
      const CHUNK = 1000;
      let inserted = 0;

      for (let start = 0; start < parsed.length; start += CHUNK) {
        const chunk = parsed.slice(start, start + CHUNK);
        const values: any[] = [];

        const placeholders = chunk.map((row, idx) => {
          const base = idx * 14;
          values.push(
            fileId, area,
            row.faktur, row.kode, row.outlet,
            row.kota, row.kecamatan, row.kel_desa, row.salesman,
            row.tanggal, row.jatuh_tempo, row.hari,
            row.piutang, row.giro,
          );
          return `($${base+1},$${base+2},$${base+3},$${base+4},$${base+5},$${base+6},$${base+7},$${base+8},$${base+9},$${base+10},$${base+11},$${base+12},$${base+13},$${base+14})`;
        });

        await client.query(
          `INSERT INTO piutang_records
             (file_id, area, faktur, kode, outlet, kota, kecamatan, kel_desa, salesman,
              tanggal, jatuh_tempo, hari, piutang, giro)
           VALUES ${placeholders.join(',')}`,
          values,
        );
        inserted += chunk.length;
      }

      await client.query('COMMIT');
      console.log(`Piutang upload: ${inserted} rows, area=${area}, fileId=${fileId}`);

      return NextResponse.json({ success: true, fileId, inserted, skipped, fileName: file.name, area });

    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

  } catch (err: any) {
    console.error('Piutang upload error:', err);
    return NextResponse.json({ success: false, error: err.message ?? 'Internal server error' }, { status: 500 });
  }
}