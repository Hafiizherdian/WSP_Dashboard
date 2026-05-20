-- =====================================================
-- Migration: Fix Cross-Year Data - Correct Version
-- Description: Fix W52 to 2025 and W1 December dates to 2026
-- =====================================================

-- Create backup table
CREATE TABLE IF NOT EXISTS sales_records_backup AS 
SELECT * FROM sales_records;

-- Show current problematic data
SELECT 
    'BEFORE FIX' as status,
    uf.original_name,
    sr.week,
    EXTRACT(YEAR FROM sr.date) as current_year,
    EXTRACT(MONTH FROM sr.date) as current_month,
    COUNT(*) as records,
    SUM(sr.omzet) as total_omzet
FROM sales_records sr
JOIN uploaded_files uf ON sr.file_id = uf.id
WHERE uf.original_name IN ('Bandung W1 2026.xlsx', 'Bandung W52.xlsx')
GROUP BY uf.original_name, sr.week, EXTRACT(YEAR FROM sr.date), EXTRACT(MONTH FROM sr.date)
ORDER BY uf.original_name, sr.week;

-- Fix W52 data: Move all W52 records to 2025 (they should be December 2025)
UPDATE sales_records sr
SET date = date - INTERVAL '1 year'
WHERE sr.file_id = (SELECT id FROM uploaded_files WHERE original_name = 'Bandung W52.xlsx')
AND sr.week = 52;

-- Fix W1 data: Move December W1 records to 2026 (they are currently in 2026 but should be 2026, so no change needed)
-- Actually, W1 December records are already in 2026, which is correct for W1 2026
-- The issue is they should be January 2026, not December 2026

-- Fix W1 data: Move December W1 records to January 2026 (same year, different month)
UPDATE sales_records sr
SET date = make_date(2026, 1, EXTRACT(DAY FROM sr.date))
WHERE sr.file_id = (SELECT id FROM uploaded_files WHERE original_name = 'Bandung W1 2026.xlsx')
AND sr.week = 1
AND EXTRACT(MONTH FROM sr.date) = 12;

-- Verify the fix
SELECT 
    'AFTER FIX' as status,
    uf.original_name,
    sr.week,
    EXTRACT(YEAR FROM sr.date) as corrected_year,
    EXTRACT(MONTH FROM sr.date) as corrected_month,
    COUNT(*) as records,
    SUM(sr.omzet) as total_omzet
FROM sales_records sr
JOIN uploaded_files uf ON sr.file_id = uf.id
WHERE uf.original_name IN ('Bandung W1 2026.xlsx', 'Bandung W52.xlsx')
GROUP BY uf.original_name, sr.week, EXTRACT(YEAR FROM sr.date), EXTRACT(MONTH FROM sr.date)
ORDER BY uf.original_name, sr.week;

-- Show final yearly distribution
SELECT 
    'FINAL YEARLY' as status,
    EXTRACT(YEAR FROM date) as year,
    COUNT(*) as records,
    SUM(omzet) as total_omzet
FROM sales_records
GROUP BY EXTRACT(YEAR FROM date)
ORDER BY year;
