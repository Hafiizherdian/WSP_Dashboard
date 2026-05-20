-- =====================================================
-- Migration: Fix Week 52 Data to Year 2025
-- Description: Move W52 records from 2026 to 2025 (correct year)
-- Logic: W52 belongs to 2025, not 2026
-- =====================================================

-- Create backup table
CREATE TABLE IF NOT EXISTS sales_records_backup AS 
SELECT * FROM sales_records;

-- Show current W52 distribution
SELECT 
    'BEFORE FIX' as status,
    EXTRACT(YEAR FROM date) as year,
    week,
    COUNT(*) as records,
    SUM(omzet) as total_omzet
FROM sales_records
WHERE week = 52 
AND file_id = (SELECT id FROM uploaded_files WHERE original_name = 'Bandung W52.xlsx')
GROUP BY EXTRACT(YEAR FROM date), week
ORDER BY year, week;

-- Fix W52 data - move from 2026 to 2025
UPDATE sales_records sr
SET date = date - INTERVAL '1 year'
WHERE sr.file_id = (SELECT id FROM uploaded_files WHERE original_name = 'Bandung W52.xlsx')
AND EXTRACT(YEAR FROM date) = 2026;

-- Verify the fix
SELECT 
    'AFTER FIX' as status,
    EXTRACT(YEAR FROM date) as year,
    week,
    COUNT(*) as records,
    SUM(omzet) as total_omzet
FROM sales_records
WHERE week = 52 
AND file_id = (SELECT id FROM uploaded_files WHERE original_name = 'Bandung W52.xlsx')
GROUP BY EXTRACT(YEAR FROM date), week
ORDER BY year, week;

-- Show final yearly distribution
SELECT 
    'FINAL YEARLY' as status,
    EXTRACT(YEAR FROM date) as year,
    COUNT(*) as records,
    SUM(omzet) as total_omzet
FROM sales_records
GROUP BY EXTRACT(YEAR FROM date)
ORDER BY year;
