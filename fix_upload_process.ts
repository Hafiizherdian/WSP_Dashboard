// =====================================================
// FIX UPLOAD PROCESS - CORRECT CROSS-YEAR DATE HANDLING
// =====================================================

// Fungsi untuk menentukan tahun yang benar berdasarkan minggu
function getCorrectYearForWeek(week: number, parsedDate: Date): number {
  const dateYear = parsedDate.getFullYear();
  const dateMonth = parsedDate.getMonth(); // 0-11 (Jan-Dec)
  
  // W52 (minggu 52) biasanya Desember - jika minggu 52 tapi bulan Januari, kemungkinan salah tahun
  if (week === 52 && dateMonth === 0) { // Januari
    return dateYear - 1; // Kembali ke tahun sebelumnya
  }
  
  // W1 (minggu 1) biasanya Januari - jika minggu 1 tapi bulan Desember, kemungkinan salah tahun
  if (week === 1 && dateMonth === 11) { // Desember
    return dateYear + 1; // Maju ke tahun berikutnya
  }
  
  return dateYear;
}

// Fungsi parse tanggal dengan koreksi cross-year
function parseSalesDateWithCorrection(rawValue: string | Date, week: number): Date | null {
  if (!rawValue) {
    return null;
  }

  // Handle Date objects dari Excel
  if (rawValue instanceof Date) {
    const correctedYear = getCorrectYearForWeek(week, rawValue);
    const correctedDate = new Date(rawValue);
    correctedDate.setFullYear(correctedYear);
    return correctedDate;
  }

  // Handle string dates dari CSV
  if (typeof rawValue !== 'string') {
    return null;
  }

  let normalized = rawValue.replace(/^"|"$/g, '').trim();
  if (!normalized) {
    return null;
  }

  // Hapus format hari dalam bahasa Indonesia
  normalized = normalized.replace(/^(senin|selasa|rabu|kamis|jumat|jum'at|sabtu|minggu)\s*,\s*/i, '').trim();
  normalized = normalized.replace(/\s+/g, ' ');

  // Menterjemahkan bulan ke bahasa Inggris
  const monthTranslations: Record<string, string> = {
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
    desember: 'december', des: 'dec', dec: 'dec'
  };

  const monthRegex = new RegExp(`\\b(${Object.keys(monthTranslations).join('|')})\\b`, 'gi');
  normalized = normalized.replace(monthRegex, (match) => {
    return monthTranslations[match.toLowerCase()] || match;
  });

  let parsed = new Date(normalized);
  if (!isNaN(parsed.getTime())) {
    const correctedYear = getCorrectYearForWeek(week, parsed);
    parsed.setFullYear(correctedYear);
    return parsed;
  }

  // Try DD/MM/YYYY or DD-MM-YYYY formats
  const dmyMatch = normalized.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})$/);
  if (dmyMatch) {
    const [, dayStr, monthStr, yearStr] = dmyMatch;
    const year = parseInt(yearStr.length === 2 ? `20${yearStr}` : yearStr, 10);
    const month = parseInt(monthStr, 10) - 1;
    const day = parseInt(dayStr, 10);
    parsed = new Date(year, month, day);
    
    if (!isNaN(parsed.getTime())) {
      const correctedYear = getCorrectYearForWeek(week, parsed);
      parsed.setFullYear(correctedYear);
      return parsed;
    }
  }

  // Try YYYY/MM/DD or YYYY-MM-DD formats
  const ymdMatch = normalized.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})$/);
  if (ymdMatch) {
    const [, yearStr, monthStr, dayStr] = ymdMatch;
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10) - 1;
    const day = parseInt(dayStr, 10);
    parsed = new Date(year, month, day);
    
    if (!isNaN(parsed.getTime())) {
      const correctedYear = getCorrectYearForWeek(week, parsed);
      parsed.setFullYear(correctedYear);
      return parsed;
    }
  }

  return null;
}

// Fungsi processSalesData yang diperbaiki
function processSalesDataFixed(data: any[], selectedArea?: string): any[] {
  const processed = [];

  for (const row of data) {
    try {
      // Skip empty rows
      if (!row || Object.keys(row).length === 0) {
        continue;
      }

      // Mengambil nomor minggu dari "W1", "W2", etc.
      let week = 1;
      const weekStr = row['Minggu'] || '';
      if (weekStr.startsWith('W')) {
        week = parseInt(weekStr.substring(1)) || 1;
      } else {
        week = parseInt(weekStr) || 1;
      }

      const rawDate = row['Tanggal'] || row['Date'] || '';
      const parsedDate = parseSalesDateWithCorrection(rawDate, week);
      if (!parsedDate) {
        console.warn('Skipping row due to invalid date format:', {
          rawDate,
          week,
          product: row['Produk'] || row['Product'],
          customer: row['Customer']
        });
        continue;
      }

      // Memetakan data dari CSV ke database
      const city = row['Kota'] || row['City'] || '';
      const record = {
        grand_total: parseNumericValue(row['Grand Total']),
        week: week,
        date: parsedDate,
        product: row['Produk'] || row['Product'] || '',
        category: row['Kategori'] || row['Category'] || '',
        customer_no: row['No. Customer'] || row['Customer No'] || '',
        customer: row['Customer'] || '',
        customer_type: row['Tipe Customer'] || row['Customer Type'] || '',
        salesman: row['Salesman'] || '',
        village: row['Desa'] || row['Village'] || '',
        district: row['Kecamatan'] || row['District'] || '',
        city: city,
        area: selectedArea || null,
        units_bks: parseNumericValue(row['Jual (Bks Net)']),
        units_slop: parseNumericValue(row['Jual (Slop Net)']),
        units_bal: parseNumericValue(row['Jual (Bal Net)']),
        units_dos: parseNumericValue(row['Jual (Dos Net)']),
        omzet: parseNumericValue(row['Omzet (Nett)'])
      };

      // Memvalidasi field yang diperlukan
      if (record.product && record.customer && Number.isFinite(record.omzet) && !isNaN(record.week)) {
        processed.push(record);
        
        // Log untuk debugging cross-year cases
        const originalDate = new Date(rawDate);
        if (originalDate.getFullYear() !== parsedDate.getFullYear()) {
          console.log('Cross-year correction applied:', {
            week,
            originalDate: originalDate.toISOString(),
            correctedDate: parsedDate.toISOString(),
            product: record.product,
            customer: record.customer
          });
        }
      } else {
        // Log kegagalan memvalidasi file untuk debug
        if (record.product || record.customer || record.omzet !== 0) {
          console.log('Validation failed for row:', {
            product: record.product,
            customer: record.customer,
            omzet: record.omzet,
            week: record.week,
            area: record.area
          });
        }
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

// Helper function untuk parse numeric value (sama seperti original)
function parseNumericValue(raw: unknown): number {
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return raw;
  }

  if (typeof raw !== 'string') {
    return 0;
  }

  const trimmed = raw.trim();
  if (!trimmed) {
    return 0;
  }

  const simpleDecimal = trimmed.match(/^[\d.]+$/);
  if (simpleDecimal) {
    const parsed = parseFloat(trimmed);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  const sanitized = trimmed.replace(/[^0-9.,\-]/g, '');
  const negative = sanitized.includes('-');
  const unsigned = sanitized.replace(/-/g, '');

  const hasComma = unsigned.includes(',');
  const hasDot = unsigned.includes('.');

  let normalized: string;

  if (hasComma && hasDot) {
    const lastComma = unsigned.lastIndexOf(',');
    const lastDot = unsigned.lastIndexOf('.');
    const commaAfterDot = lastComma > lastDot;
    
    if (commaAfterDot) {
      const parts = unsigned.split(',');
      const integerPart = parts[0].replace(/\./g, '') || '0';
      const fractionalPart = parts.slice(1).join('');
      normalized = fractionalPart ? `${integerPart}.${fractionalPart}` : integerPart;
    } else {
      const parts = unsigned.split('.');
      const integerPart = parts[0].replace(/,/g, '') || '0';
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
  } else if (hasDot) {
    normalized = unsigned;
  } else {
    normalized = unsigned;
  }

  const parsed = Number.parseFloat(normalized);
  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return negative ? -parsed : parsed;
}

export { 
  getCorrectYearForWeek, 
  parseSalesDateWithCorrection, 
  processSalesDataFixed 
};
