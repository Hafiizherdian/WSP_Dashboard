/**
 * Type definitions untuk data penjualan
 * 
 * Mendefinisikan struktur data yang digunakan dalam dashboard analisis penjualan
 */

/**
 * Data penjualan mingguan untuk satu tahun
 */
export interface WeeklySales {
  week: number;        // Nomor minggu (1-52)
  year: number;         // Tahun penjualan
  sales: number;        // Total penjualan minggu tersebut
  target?: number;      // Target penjualan (opsional)
}

/**
 * Data penjualan per outlet untuk analisis kontribusi
 */
export interface OutletSalesData {
  week: number;           // Nomor minggu (1-52)
  year: number;           // Tahun penjualan
  outletType: string;     // Tipe outlet (contoh: Retail, Whole Sale)
  category: string;       // Kategori produk (contoh: Food, Beverage)
  product: string;        // Nama produk (contoh: CAKRA PRIMA 16 K)
  dozNet: number;        // DOZ Net (dozen netto)
  sales?: number;         // Total penjualan (opsional)
  target?: number;        // Target penjualan (opsional)
  city?: string;          // Kota/kabupaten
  district?: string;      // Kecamatan
  village?: string;       // Desa/kelurahan
  customer_no?: string;
  customer?: string;      // Nama customer
  salesman?: string;      // Nama salesman
  weeklyDozNet?:  Record<number, number>; 
}

/**
 * Data kuartal dengan target dan actual
 */
export interface QuarterlyProductDetail {
  product: string;
  productCategory: string;
  target: number;
  actual: number;
  variance: number;
  variancePercentage: number;
  units_bks?:  { target: number; actual: number };
  units_slop?: { target: number; actual: number };
  units_bal?:  { target: number; actual: number };
  units_dos?:  { target: number; actual: number };
}

// ─── QuarterlyData — versi baru dengan field details ──────────────────────────
export interface WeeklyBreakdown {
  week: number;
  target: number;
  actual: number;
  variance: number;
  variancePercentage: number;
  achievement: number;
  // New fields for unit-specific data
  units_bks?: { target: number; actual: number };
  units_slop?: { target: number; actual: number };
  units_bal?: { target: number; actual: number };
  units_dos?: { target: number; actual: number };
}

export interface MonthlyBreakdown {
  month: string;
  target: number;
  actual: number;
  variance: number;
  variancePercentage: number;
  achievement: number;
  // New fields for unit-specific data
  units_bks?: { target: number; actual: number };
  units_slop?: { target: number; actual: number };
  units_bal?: { target: number; actual: number };
  units_dos?: { target: number; actual: number };
}

export interface QuarterlyData {
  quarter: string;              // Kuartal (Q1, Q2, Q3, Q4)
  target: number;               // Target penjualan (omzet agregat)
  actual: number;               // Actual penjualan (omzet agregat)
  variance: number;             // Selisih actual - target
  variancePercentage: number;   // Persentase variance
  details?: QuarterlyProductDetail[]; // Detail per produk (opsional, untuk filter)
  
  // New fields for detailed analysis
  weeklyBreakdown?: WeeklyBreakdown[];
  monthlyBreakdown?: MonthlyBreakdown[];
}

/**
 * Data perbandingan mingguan antar tahun
 */
export interface WeekComparisonProductDetail {
  product: string;
  previousYear: number;
  currentYear: number;
  variance: number;
  variancePercentage: number;
  units_bks?: { previous: number; current: number };
  units_slop?: { previous: number; current: number };
  units_bal?: { previous: number; current: number };
  units_dos?: { previous: number; current: number };
}

export interface WeekComparison {
  week: number;                    // Nomor minggu
  previousYear: number;            // Penjualan tahun sebelumnya
  currentYear: number;             // Penjualan tahun sekarang
  variance: number;                // Selisih penjualan
  variancePercentage: number;      // Persentase variance
  details?: WeekComparisonProductDetail[];
}

/**
 * Data L4W vs C4W
 */
export interface ProductL4WC1WData {
  product: string;
  year: number;
  l4wValue: number;
  c1wValue: number;
  variance: number;
  variancePercentage: number;
  // Tambah l4wTotal ke tiap unit field
units_bks:  { l4w: number; c1w: number; l4wTotal?: number };
units_slop: { l4w: number; c1w: number; l4wTotal?: number };
units_bal:  { l4w: number; c1w: number; l4wTotal?: number };
units_dos:  { l4w: number; c1w: number; l4wTotal?: number };
}

export interface L4WC4WData {
  l4wAverage: number;              // Rata-rata Last 4 Weeks
  c4wAverage: number;              // Rata-rata Current 4 Weeks
  c1wValue: number;                // Nilai Current 1 Week (minggu terakhir)
  variance: number;                 // Selisih C4W - L4W
  variancePercentage: number;      // Persentase variance
  weeklyTrendData?: WeeklyTrendData[]; // Data tren mingguan untuk line chart
  productDetails?: ProductL4WC1WData[]; // Data detail per produk
  l4wWeekRange?: string;           // Rentang minggu untuk L4W (contoh: "Week 45-48")
  c1wWeekNumber?: number;         // Nomor minggu untuk C1W (contoh: 49)
}

/**
 * Data tren mingguan untuk line chart L4W vs C1W
 */
export interface WeeklyTrendData {
  week: string;    // Label minggu (W-4, W-3, ..., W+1)
  value: number;   // Nilai penjualan minggu tersebut
  period: 'L4W' | 'C1W'; // Periode mana minggu ini termasuk
}

/**
 * Data pertumbuhan tahun ke tahun
 */
export interface YearOnYearGrowth {
  previousYearTotal: number;       // Total penjualan tahun sebelumnya
  currentYearTotal: number;        // Total penjualan tahun sekarang
  variance: number;                 // Selisih penjualan
  variancePercentage: number;      // Persentase pertumbuhan
}

export interface ComparisonYears {
  previousYear: number | null;
  currentYear: number | null;
}

export interface WeekRange {
  start: number;
  end: number;
}

export interface ComparisonWeeks {
  previousYear: WeekRange | null;
  currentYear: WeekRange | null;
}

/**
 * Data penjualan lengkap untuk dashboard
 */
export interface SalesData {
  weeklyData: WeeklySales[];
  quarterlyData: QuarterlyData[];
  weekComparisons: WeekComparison[];
  l4wc4wData: L4WC4WData;
  yearOnYearGrowth: YearOnYearGrowth;
  comparisonYears: ComparisonYears;
  comparisonWeeks: ComparisonWeeks;
  outletData?: OutletSalesData[];  // Data penjualan per outlet (opsional)
}

/**
 * Data penjualan untuk CMS (dengan ID dan produk)
 */
export interface SalesDataCMS {
  id: string;
  week: number;
  year: number;
  sales: number;
  target: number;
  product: string;
  region: string;
}

/**
 * Partial data untuk form tambah data
 */
export interface PartialSalesData {
  week?: number;
  year?: number;
  sales?: number;
  target?: number;
  product?: string;
  region?: string;
}
