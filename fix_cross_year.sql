-- =====================================================
-- FIX CROSS-YEAR DATA - PINDAHKAN DESEMBER 2025 KE 2026
-- =====================================================

-- 1. BACKUP DATA TERLEBIH DAHULU
CREATE TABLE sales_records_backup AS SELECT * FROM sales_records;

-- 2. TAMPILKAN DATA SEBELUM FIX
SELECT 
    'BEFORE FIX' as status,
    EXTRACT(YEAR FROM date) as year,
    COUNT(*) as records,
    SUM(omzet) as total_omzet
FROM sales_records
GROUP BY EXTRACT(YEAR FROM date)
ORDER BY year;

-- 3. PINDAHKAN DATA DESEMBER 2025 KE 2026
-- Untuk file Bandung W1 2026.xlsx dan Bandung W52.xlsx
UPDATE sales_records sr
SET date = date + INTERVAL '1 year'
WHERE sr.file_id IN (
    SELECT id FROM uploaded_files WHERE original_name IN (
        'Bandung W1 2026.xlsx', 'Bandung W52.xlsx'
    )
) AND EXTRACT(YEAR FROM date) = 2025;

-- 4. TAMPILKAN DATA SETELAH FIX
SELECT 
    'AFTER FIX' as status,
    EXTRACT(YEAR FROM date) as year,
    COUNT(*) as records,
    SUM(omzet) as total_omzet
FROM sales_records
GROUP BY EXTRACT(YEAR FROM date)
ORDER BY year;

-- 5. VERIFICATION - BANDINGKAN DENGAN ADMIN PANEL
SELECT 
    'VERIFICATION' as status,
    CASE 
        WHEN EXTRACT(YEAR FROM date) = 2025 THEN 'Expected: 471,933 records'
        WHEN EXTRACT(YEAR FROM date) = 2026 THEN 'Expected: 5,857 records'
        ELSE 'Other year'
    END as expected,
    EXTRACT(YEAR FROM date) as year,
    COUNT(*) as actual_records,
    CASE 
        WHEN EXTRACT(YEAR FROM date) = 2025 AND COUNT(*) = 471933 THEN '✅ MATCH'
        WHEN EXTRACT(YEAR FROM date) = 2026 AND COUNT(*) = 5857 THEN '✅ MATCH'
        ELSE '❌ MISMATCH'
    END as verification
FROM sales_records
WHERE EXTRACT(YEAR FROM date) IN (2025, 2026)
GROUP BY EXTRACT(YEAR FROM date)
ORDER BY year;

-- =====================================================
-- ROLLBACK COMMAND (JIKA ADA MASALAH)
-- =====================================================
-- Uncomment dan jalankan ini jika rollback diperlukan:

-- TRUNCATE sales_records;
-- INSERT INTO sales_records SELECT * FROM sales_records_backup;
-- DROP TABLE sales_records_backup;

-- =====================================================
-- INSTRUKSI:
-- 1. Backup database: pg_dump dashboard_db > backup.sql
-- 2. Run script ini: psql dashboard_db < fix_cross_year.sql
-- 3. Refresh dashboard
-- 4. Verify hasil
-- =====================================================
