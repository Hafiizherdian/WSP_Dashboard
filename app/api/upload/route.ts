/**
 * API route untuk upload file Excel/CSV
 * Endpoint: POST /api/upload
 * Multipart form data dengan file
 */

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { join } from 'path';
import csv from 'csv-parser';
import { createReadStream } from 'fs';
import * as XLSX from 'xlsx';
import { withAuth } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  return withAuth(request, 'upload_file', async (session) => {
    try {
      const formData = await request.formData();
      const file = formData.get('file') as File;
      let selectedArea = formData.get('area') as string;

      if (session.role !== 'root') {
        const userAreas = session.allowed_areas || [];
        if (!selectedArea && userAreas.length === 1) {
          selectedArea = userAreas[0];
          console.log(`[API/upload] Auto-assigned area ${selectedArea} for user ${session.username}`);
        }
        if (selectedArea && !userAreas.includes(selectedArea)) {
          return NextResponse.json(
            { success: false, error: `Anda tidak memiliki akses ke area: ${selectedArea}` },
            { status: 403 }
          );
        }
      }

      if (!file) {
        return NextResponse.json(
          { success: false, error: 'No file provided' },
          { status: 400 }
        );
      }

      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv',
      ];

      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          {
            success: false,
            error: `Tipe file tidak valid: ${file.type}. Hanya Excel dan CSV file yang diterima`,
          },
          { status: 400 }
        );
      }

      const tempDir = join(process.cwd(), 'temp');
      try {
        await mkdir(tempDir, { recursive: true });
      } catch {
        // Directory already exists
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const tempPath = join(tempDir, file.name);

      await writeFile(tempPath, buffer);

      try {
        let data: any[] = [];

        if (file.type === 'text/csv') {
          console.log('Processing CSV file...');
          data = await processCSVFile(tempPath);
        } else {
          console.log('Processing Excel file...');
          data = await processExcelFile(buffer);
        }

        const processedData = processSalesData(data, selectedArea);

        if (processedData.length === 0) {
          return NextResponse.json(
            {
              success: false,
              error:
                'Data tidak valid. Cek kembali kolom yang diperlukan: Grand Total, Minggu, Tanggal, Produk, Customer, Omzet (Nett)',
            },
            { status: 400 }
          );
        }

        const client = await pool.connect();

        try {
          await client.query('BEGIN');

          const fileQuery = `
            INSERT INTO uploaded_files (
              filename, original_name, file_size, record_count, total_omzet,
              status, uploaded_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id
          `;

          const totalOmzet = processedData.reduce((sum, record) => sum + record.omzet, 0);

          const fileResult = await client.query(fileQuery, [
            `upload_${Date.now()}.xlsx`,
            file.name,
            file.size,
            processedData.length,
            totalOmzet,
            'processing',
            'admin',
          ]);

          const fileId = fileResult.rows[0].id;

          const salesQuery = `
            INSERT INTO sales_records (
              file_id, grand_total, week, date, product, category, customer_no, customer,
              customer_type, salesman, village, district, city, area, units_bks, units_slop,
              units_bal, units_dos, omzet
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
          `;

          for (const record of processedData) {
            await client.query(salesQuery, [
              fileId,
              record.grand_total,
              record.week,
              record.date,
              record.product,
              record.category,
              record.customer_no,
              record.customer,
              record.customer_type,
              record.salesman,
              record.village,
              record.district,
              record.city,
              record.area,
              record.units_bks,
              record.units_slop,
              record.units_bal,
              record.units_dos,
              record.omzet,
            ]);
          }

          await client.query('UPDATE uploaded_files SET status = $1 WHERE id = $2', [
            'completed',
            fileId,
          ]);

          await client.query('COMMIT');

          return NextResponse.json({
            success: true,
            data: {
              file_id: fileId,
              filename: file.name,
              record_count: processedData.length,
              total_omzet: totalOmzet,
              preview: processedData.slice(0, 5),
            },
          });
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        } finally {
          client.release();
        }
      } finally {
        try {
          await unlink(tempPath);
        } catch {
          // File might not exist, ignore
        }
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to process file upload' },
        { status: 500 }
      );
    }
  });
}

// ─── Helper: Process Excel ────────────────────────────────────────────────────
// cellDates: false → baca serial number mentah, hindari konversi UTC oleh XLSX
// raw: true → nilai numerik tetap sebagai angka

async function processExcelFile(buffer: Buffer): Promise<any[]> {
  try {
    const workbook = XLSX.read(buffer, {
      type: 'buffer',
      cellDates: false,
      cellNF: false,
      cellText: false,
    });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];

    const data = XLSX.utils.sheet_to_json(worksheet, {
      defval: '',
      blankrows: false,
      raw: true,
    });

    return data;
  } catch (error) {
    console.error('Error processing Excel file:', error);
    throw new Error(
      `Gagal untuk process Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// ─── Helper: Process CSV ──────────────────────────────────────────────────────

async function processCSVFile(filePath: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const results: any[] = [];

    createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => {
        if (!data || Object.keys(data).length === 0) return;
        if (data['Grand Total'] !== undefined && Object.keys(data).length === 1) return;
        results.push(data);
      })
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
}

// ─── Date Parsing ─────────────────────────────────────────────────────────────

const INDONESIAN_MONTH_TRANSLATIONS: Record<string, string> = {
  januari: 'january', jan: 'jan',
  februari: 'february', feb: 'feb',
  maret: 'march', mar: 'mar',
  april: 'april', apr: 'apr',
  mei: 'may',
  juni: 'june', jun: 'jun',
  juli: 'july', jul: 'jul',
  agustus: 'august', agu: 'aug', ags: 'aug', aug: 'aug',
  september: 'september', sep: 'sep', sept: 'sep',
  oktober: 'october', okt: 'oct', oct: 'oct',
  november: 'november', nov: 'nov',
  desember: 'december', des: 'dec', dec: 'dec',
};

const INDONESIAN_DAY_PREFIX =
  /^(senin|selasa|rabu|kamis|jumat|jum'at|sabtu|minggu)\s*,\s*/i;
const MONTH_TRANSLATION_REGEX = new RegExp(
  `\\b(${Object.keys(INDONESIAN_MONTH_TRANSLATIONS).join('|')})\\b`,
  'gi'
);

/**
 * Konversi Excel date serial number ke Date local.
 * Excel serial: 1 = 1 Jan 1900, dengan bug leap year 1900 (serial 60).
 * Hasilnya Date local tanpa UTC shift.
 */
function excelSerialToLocalDate(serial: number): Date | null {
  if (!Number.isFinite(serial) || serial < 1) return null;

  // Koreksi bug Excel leap year 1900 (serial 60 = 29 Feb 1900 yang tidak ada)
  const adjusted = serial > 60 ? serial - 1 : serial;

  // Excel epoch: serial 1 = 1 Jan 1900
  // Gunakan UTC murni — Date.UTC(1899, 11, 31) = 31 Des 1899 00:00 UTC
  const epochMs  = Date.UTC(1899, 11, 31); // ← UTC, bukan local
  const targetMs = epochMs + adjusted * 86_400_000;

  // Ekstrak komponen UTC, bukan local — tidak ada timezone shift
  const d = new Date(targetMs);
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  //              ↑ getUTC*, bukan getFullYear/Month/Date
}

/**
 * Parse tanggal dari berbagai format tanpa mengubah tahun.
 * Selalu menggunakan local time — tidak ada UTC konversi.
 * Koreksi ISO week sepenuhnya ditangani oleh resolveWeekYear() di database.ts.
 */
function parseSalesDate(rawValue: string | Date | number): Date | null {
  if (rawValue === null || rawValue === undefined || rawValue === '') return null;

  // Excel serial number → konversi ke local date
  if (typeof rawValue === 'number') {
    return excelSerialToLocalDate(rawValue);
  }

  // Date object → ekstrak komponen local, hindari UTC shift
  if (rawValue instanceof Date) {
    if (isNaN(rawValue.getTime())) return null;
    return new Date(rawValue.getFullYear(), rawValue.getMonth(), rawValue.getDate());
  }

  if (typeof rawValue !== 'string') return null;

  let normalized = rawValue.replace(/^"|"$/g, '').trim();
  if (!normalized) return null;

  normalized = normalized.replace(INDONESIAN_DAY_PREFIX, '').trim();
  normalized = normalized.replace(/\s+/g, ' ');
  normalized = normalized.replace(MONTH_TRANSLATION_REGEX, (match) => {
    return INDONESIAN_MONTH_TRANSLATIONS[match.toLowerCase()] ?? match;
  });

  // Format DD/MM/YYYY atau DD-MM-YYYY
  const dmyMatch = normalized.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})$/);
  if (dmyMatch) {
    const [, dayStr, monthStr, yearStr] = dmyMatch;
    const year  = parseInt(yearStr.length === 2 ? `20${yearStr}` : yearStr, 10);
    const month = parseInt(monthStr, 10) - 1;
    const day   = parseInt(dayStr, 10);
    const result = new Date(year, month, day);
    return isNaN(result.getTime()) ? null : result;
  }

  // Format YYYY/MM/DD atau YYYY-MM-DD
  const ymdMatch = normalized.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})$/);
  if (ymdMatch) {
    const [, yearStr, monthStr, dayStr] = ymdMatch;
    const year  = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10) - 1;
    const day   = parseInt(dayStr, 10);
    const result = new Date(year, month, day);
    return isNaN(result.getTime()) ? null : result;
  }

  // Fallback: parse string lalu ekstrak komponen local
  const direct = new Date(normalized);
  if (!isNaN(direct.getTime())) {
    return new Date(direct.getFullYear(), direct.getMonth(), direct.getDate());
  }

  return null;
}

// ─── Numeric Parsing ──────────────────────────────────────────────────────────

function parseNumericValue(raw: unknown): number {
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  if (typeof raw !== 'string') return 0;

  const trimmed = raw.trim();
  if (!trimmed) return 0;

  const simpleDecimal = trimmed.match(/^[\d.]+$/);
  if (simpleDecimal) {
    const parsed = parseFloat(trimmed);
    if (Number.isFinite(parsed)) return parsed;
  }

  const sanitized = trimmed.replace(/[^0-9.,\-]/g, '');
  const negative  = sanitized.includes('-');
  const unsigned  = sanitized.replace(/-/g, '');

  const hasComma = unsigned.includes(',');
  const hasDot   = unsigned.includes('.');

  let normalized: string;

  if (hasComma && hasDot) {
    const lastComma     = unsigned.lastIndexOf(',');
    const lastDot       = unsigned.lastIndexOf('.');
    const commaAfterDot = lastComma > lastDot;

    if (commaAfterDot) {
      const parts          = unsigned.split(',');
      const integerPart    = parts[0].replace(/\./g, '') || '0';
      const fractionalPart = parts.slice(1).join('');
      normalized = fractionalPart ? `${integerPart}.${fractionalPart}` : integerPart;
    } else {
      const parts          = unsigned.split('.');
      const integerPart    = parts[0].replace(/,/g, '') || '0';
      const fractionalPart = parts.slice(1).join('');
      normalized = fractionalPart ? `${integerPart}.${fractionalPart}` : integerPart;
    }
  } else if (hasComma) {
    const parts = unsigned.split(',');
    if (parts.length === 2 && parts[1].length <= 2) {
      normalized = `${parts[0]}.${parts[1]}`;
    } else {
      normalized = parts.join('');
    }
  } else {
    normalized = unsigned;
  }

  const parsed = Number.parseFloat(normalized);
  if (!Number.isFinite(parsed)) return 0;

  return negative ? -parsed : parsed;
}

// ─── Sales Data Processing ────────────────────────────────────────────────────

function processSalesData(data: any[], selectedArea?: string): any[] {
  const processed = [];

  for (const row of data) {
    try {
      if (!row || Object.keys(row).length === 0) continue;

      let week = 1;
      const weekStr = row['Minggu'] || '';
      if (typeof weekStr === 'string' && weekStr.startsWith('W')) {
        week = parseInt(weekStr.substring(1)) || 1;
      } else {
        week = parseInt(String(weekStr)) || 1;
      }

      const rawDate    = row['Tanggal'] || row['Date'] || '';
      const parsedDate = parseSalesDate(rawDate);

      if (!parsedDate) {
        console.warn('Skipping row due to invalid date format:', {
          rawDate,
          product:  row['Produk'] || row['Product'],
          customer: row['Customer'],
        });
        continue;
      }

      console.log(`[upload] week=${week} rawDate="${rawDate}" → ${parsedDate.getFullYear()}-${String(parsedDate.getMonth()+1).padStart(2,'0')}-${String(parsedDate.getDate()).padStart(2,'0')}`);

      const city = row['Kota'] || row['City'] || '';

      const record = {
        grand_total:   parseNumericValue(row['Grand Total']),
        week,
        date:          parsedDate,
        product:       row['Produk']        || row['Product']       || '',
        category:      row['Kategori']      || row['Category']      || '',
        customer_no:   row['No. Customer']  || row['Customer No']   || '',
        customer:      row['Customer']      || '',
        customer_type: row['Tipe Customer'] || row['Customer Type'] || '',
        salesman:      row['Salesman']      || '',
        village:       row['Desa']          || row['Village']       || '',
        district:      row['Kecamatan']     || row['District']      || '',
        city,
        area:          selectedArea         || null,
        units_bks:     parseNumericValue(row['Jual (Bks Net)']),
        units_slop:    parseNumericValue(row['Jual (Slop Net)']),
        units_bal:     parseNumericValue(row['Jual (Bal Net)']),
        units_dos:     parseNumericValue(row['Jual (Dos Net)']),
        omzet:         parseNumericValue(row['Omzet (Nett)']),
      };

      if (
        record.product &&
        record.customer &&
        Number.isFinite(record.omzet) &&
        !isNaN(record.week)
      ) {
        processed.push(record);
      }
    } catch (error) {
      console.warn('Error processing row:', error);
      continue;
    }
  }

  console.log(`Processed ${processed.length} valid records from ${data.length} total rows`);
  if (selectedArea) {
    console.log(`All records assigned to area: ${selectedArea}`);
  }

  return processed;
}