-- =====================================================
-- MIGRATION: Optimize Distribution Records Performance
-- File: database/migrations/optimize_distribution.sql
-- Target: GET /api/distribution < 500ms untuk >1 juta record
-- Jalankan: psql dashboard_db < database/migrations/optimize_distribution.sql
-- =====================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 1: Composite Index — ini kunci utama performa
-- Single-column index (area), (week_num) tidak efisien untuk query yang
-- selalu filter keduanya bersamaan. Composite index jauh lebih cepat.
-- ─────────────────────────────────────────────────────────────────────────────

-- Index utama: semua filter WHERE yang dipakai dashboard
-- Kolom urutan: area dulu (selectivity tinggi), lalu week_num (range filter)
CREATE INDEX IF NOT EXISTS idx_dist_area_week
  ON distribution_records(area, week_num);

-- Index untuk query achievement salesman (GROUP BY salesman, product)
CREATE INDEX IF NOT EXISTS idx_dist_area_week_salesman
  ON distribution_records(area, week_num, salesman);

-- Index untuk query coverage outlet type (GROUP BY outlet_type)
CREATE INDEX IF NOT EXISTS idx_dist_area_week_outlet
  ON distribution_records(area, week_num, outlet_type);

-- Index untuk trend query (GROUP BY week, week_num, product)
-- Include kolom numerik agar PostgreSQL bisa index-only scan (tidak perlu heap fetch)
CREATE INDEX IF NOT EXISTS idx_dist_area_week_product
  ON distribution_records(area, week_num, product)
  INCLUDE (plan, actual, av_in, ec, av_out);

-- Index untuk dist_file_id (foreign key, dipakai filter fileId)
CREATE INDEX IF NOT EXISTS idx_dist_file_id
  ON distribution_records(dist_file_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 2: Drop single-column index lama yang sekarang redundant
-- (composite index sudah mencakup kolom-kolom ini)
-- Hati-hati: hapus hanya jika tidak dipakai query lain di luar distribution
-- ─────────────────────────────────────────────────────────────────────────────

-- Uncomment jika yakin tidak ada query lain yang pakai index ini:
-- DROP INDEX IF EXISTS idx_dist_records_week;
-- DROP INDEX IF EXISTS idx_dist_records_salesman;
-- DROP INDEX IF EXISTS idx_dist_records_area;

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 3: Materialized View untuk Summary
-- Summary (total plan, actual, av_out, dll) adalah query paling berat karena
-- full aggregation. Materialized view menyimpan hasilnya dan di-refresh
-- setiap kali ada upload baru.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_dist_summary AS
SELECT
  area,
  week_num,
  product,
  outlet_type,
  salesman,
  SUM(plan)                   AS total_plan,
  SUM(actual)                 AS total_actual,
  SUM(av_in)                  AS total_av_in,
  SUM(ec)                     AS total_ec,
  SUM(av_out)                 AS total_av_out,
  COUNT(DISTINCT outlet)      AS outlet_count,
  COUNT(DISTINCT customer_id) AS customer_count
FROM distribution_records
GROUP BY area, week_num, product, outlet_type, salesman;

-- Index di materialized view agar query di atasnya juga cepat
CREATE INDEX IF NOT EXISTS idx_mv_dist_area_week
  ON mv_dist_summary(area, week_num);

CREATE INDEX IF NOT EXISTS idx_mv_dist_area_week_product
  ON mv_dist_summary(area, week_num, product);

CREATE INDEX IF NOT EXISTS idx_mv_dist_area_week_outlet
  ON mv_dist_summary(area, week_num, outlet_type);

CREATE INDEX IF NOT EXISTS idx_mv_dist_area_week_salesman
  ON mv_dist_summary(area, week_num, salesman);

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 4: Fungsi refresh materialized view
-- Dipanggil dari route.ts setelah POST (upload) dan DELETE berhasil.
-- CONCURRENTLY = tidak lock tabel saat refresh, tapi butuh unique index.
-- ─────────────────────────────────────────────────────────────────────────────

-- Unique index diperlukan untuk REFRESH CONCURRENTLY
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_dist_unique
  ON mv_dist_summary(area, week_num, product, outlet_type, salesman);

CREATE OR REPLACE FUNCTION refresh_dist_summary()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_dist_summary;
END;
$$ LANGUAGE plpgsql;

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 5: Verifikasi index yang terbuat
-- ─────────────────────────────────────────────────────────────────────────────

SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN ('distribution_records', 'mv_dist_summary')
ORDER BY tablename, indexname;