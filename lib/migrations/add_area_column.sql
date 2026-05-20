-- Migration untuk menambahkan kolom area ke tabel sales_records
-- Jalankan query ini jika kolom area belum ada

ALTER TABLE sales_records 
ADD COLUMN IF NOT EXISTS area VARCHAR(50);

-- Create index untuk performa filter by area
CREATE INDEX IF NOT EXISTS idx_sales_records_area ON sales_records(area);

-- Update existing records dengan area berdasarkan kota (opsional)
-- UPDATE sales_records 
-- SET area = CASE 
--   WHEN city LIKE '%Banyuwangi%' THEN 'banyuwangi'
--   WHEN city LIKE '%Jember%' THEN 'jember'
--   WHEN city LIKE '%Surabaya%' OR city LIKE '%Sidoarjo%' OR city LIKE '%Gresik%' THEN 'surabaya'
--   WHEN city LIKE '%Malang%' OR city LIKE '%Batu%' THEN 'malang'
--   WHEN city LIKE '%Pasuruan%' OR city LIKE '%Probolinggo%' THEN 'pasuruan'
--   ELSE NULL
-- END
-- WHERE area IS NULL;
