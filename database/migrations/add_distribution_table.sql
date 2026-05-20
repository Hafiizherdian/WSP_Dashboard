-- =====================================================
-- MIGRATION: Add Distribution Records Table
-- File: database/migrations/add_distribution_table.sql
-- Jalankan: psql dashboard_db < database/migrations/add_distribution_table.sql
-- =====================================================

-- 1. Buat tabel utama distribution_records
CREATE TABLE IF NOT EXISTS distribution_records (
  id            SERIAL       PRIMARY KEY,
  file_id       INTEGER      REFERENCES uploaded_files(id) ON DELETE CASCADE,
  week          VARCHAR(10)  NOT NULL,              -- 'W1', 'W2', dst
  week_num      SMALLINT     NOT NULL,              -- 1, 2, dst (untuk sorting)
  product       VARCHAR(255) NOT NULL,
  category      VARCHAR(100),
  customer_id   VARCHAR(50),
  outlet        VARCHAR(255),
  outlet_type   VARCHAR(100),
  salesman      VARCHAR(255),
  village       VARCHAR(255),
  district      VARCHAR(255),
  city          VARCHAR(255),
  area          VARCHAR(50),
  plan          DECIMAL(10,2) DEFAULT 0,
  actual        DECIMAL(10,2) DEFAULT 0,
  av_in         DECIMAL(10,2) DEFAULT 0,
  ec            DECIMAL(10,2) DEFAULT 0,
  av_out        DECIMAL(10,2) DEFAULT 0,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- 2. Buat tabel untuk file upload distribusi (terpisah dari uploaded_files sales)
CREATE TABLE IF NOT EXISTS distribution_files (
  id            SERIAL       PRIMARY KEY,
  filename      VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  file_size     BIGINT       DEFAULT 0,
  record_count  INTEGER      DEFAULT 0,
  status        VARCHAR(20)  DEFAULT 'processing',
  uploaded_by   VARCHAR(100),
  area          VARCHAR(50),
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Update foreign key di distribution_records ke distribution_files
ALTER TABLE distribution_records 
  DROP CONSTRAINT IF EXISTS distribution_records_file_id_fkey;

ALTER TABLE distribution_records
  ADD COLUMN IF NOT EXISTS dist_file_id INTEGER REFERENCES distribution_files(id) ON DELETE CASCADE;

-- 3. Index untuk performa query
CREATE INDEX IF NOT EXISTS idx_dist_records_week      ON distribution_records(week_num);
CREATE INDEX IF NOT EXISTS idx_dist_records_salesman  ON distribution_records(salesman);
CREATE INDEX IF NOT EXISTS idx_dist_records_product   ON distribution_records(product);
CREATE INDEX IF NOT EXISTS idx_dist_records_area      ON distribution_records(area);
CREATE INDEX IF NOT EXISTS idx_dist_records_city      ON distribution_records(city);
CREATE INDEX IF NOT EXISTS idx_dist_records_outlet_type ON distribution_records(outlet_type);
CREATE INDEX IF NOT EXISTS idx_dist_files_status      ON distribution_files(status);

-- 4. Verifikasi
SELECT 
  'distribution_records' AS table_name,
  COUNT(*) AS column_count
FROM information_schema.columns
WHERE table_name = 'distribution_records'
UNION ALL
SELECT 
  'distribution_files' AS table_name,
  COUNT(*) AS column_count
FROM information_schema.columns
WHERE table_name = 'distribution_files';