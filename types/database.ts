/**
 * types/database.ts
 * Type definitions untuk database schema PostgreSQL
 */

export interface SalesRecord {
  id: string;
  grand_total: string;
  week: number;
  date: Date;
  product: string;
  category: string;
  customer_no: string;
  customer: string;
  customer_type: string;
  salesman: string;
  village: string;
  district: string;
  city: string;
  units_bks: number;
  units_slop: number;
  units_bal: number;
  units_dos: number;
  omzet: number;
  created_at: Date;
  updated_at: Date;
}

export interface UploadedFile {
  id: string;
  filename: string;
  original_name: string;
  file_size: number;
  record_count: number;
  total_omzet: number;
  status: 'processing' | 'completed' | 'error';
  error_message?: string;
  uploaded_by: string;
  created_at: Date;
  updated_at: Date;
}

// ─── Sub-types untuk DatabaseStats ───────────────────────────────────────────

export interface TopEntry {
  name: string;
  value: number;
}

export interface FileStatusBreakdown {
  completed: number;
  processing: number;
  error: number;
}

// ─── Stats khusus penjualan (dipakai UploadPenjualanTab) ──────────────────────

export interface SalesStats {
  // Volume & omzet
  total_records: number;
  total_omzet: number;
  avg_omzet_per_week: number;
  avg_omzet_per_file: number;

  // Cakupan waktu
  earliest_week: number | null;
  latest_week: number | null;
  earliest_year: number | null;
  latest_year: number | null;
  active_weeks: number;
  peak_week: number | null;
  peak_week_omzet: number;

  // Entitas unik
  unique_products: number;
  unique_customers: number;
  unique_cities: number;
  unique_salesmen: number;

  // Top entries untuk mini bar
  top_cities_omzet: TopEntry[];   // top 3 kota by omzet
  top_products_dos: TopEntry[];   // top 3 produk by units_dos

  // File info
  total_files: number;
  latest_upload: Date | null;
  file_status: FileStatusBreakdown;
}

// ─── Stats khusus distribusi (dipakai UploadDistribusiTab) ────────────────────

export interface DistribusiStats {
  // Volume
  total_records: number;
  total_files: number;
  latest_upload: Date | null;

  // Cakupan
  earliest_week: number | null;
  latest_week: number | null;
  active_weeks: number;

  // Entitas unik
  unique_outlets: number;
  unique_products: number;
  unique_cities: number;

  // Rata-rata
  avg_aktual_per_week: number;
  avg_ec_per_outlet: number;

  // Top entries
  top_products_aktual: TopEntry[];  // top 3 produk by aktual
  top_cities_ec: TopEntry[];        // top 3 kota by EC

  // File status
  file_status: FileStatusBreakdown;
}

// ─── DatabaseStats gabungan (untuk keperluan admin/root overview) ─────────────

export interface DatabaseStats {
  // Penjualan
  total_records: number;
  total_omzet: number;
  total_files: number;
  latest_upload: Date | null;

  // Distribusi
  distribution_records: number;
  distribution_files_count: number;
  distribution_latest_upload: Date | null;
}