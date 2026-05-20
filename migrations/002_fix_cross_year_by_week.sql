-- =====================================================
-- Migration: Fix Cross-Year Data by Week
-- Description: Move W52 2025 data to correct year 2025, W1 2026 to year 2026
-- Logic: W52 belongs to 2025, W1 belongs to 2026
-- =====================================================

-- Create backup table
CREATE TABLE IF NOT EXISTS sales_records_backup AS 
SELECT * FROM sales_records;

-- Check current week distribution
SELECT 
    'BEFORE FIX' as status,
    EXTRACT(YEAR FROM date) as year,
    week,
    COUNT(*) as records,
    SUM(omzet) as total_omzet
FROM sales_records
WHERE week IN (52, 1) 
AND EXTRACT(YEAR FROM date) IN (2025, 2026)
GROUP BY EXTRACT(YEAR FROM date), week
ORDER BY year, week;

-- Fix W52 data - should belong to 2025 (keep as is)
-- W52 is week 52 of 2025, so no changes needed for W52

-- Fix W1 data - should belong to 2026 (move any 2025 W1 to 2026)
UPDATE sales_records sr
SET date = date + INTERVAL '1 year'
WHERE sr.file_id IN (
    SELECT id FROM uploaded_files WHERE original_name = 'Bandung W1 2026.xlsx'
) 
AND week = 1 
AND EXTRACT(YEAR FROM date) = 2025;

-- Verify the fix
SELECT 
    'AFTER FIX' as status,
    EXTRACT(YEAR FROM date) as year,
    week,
    COUNT(*) as records,
    SUM(omzet) as total_omzet
FROM sales_records
WHERE week IN (52, 1) 
AND EXTRACT(YEAR FROM date) IN (2025, 2026)
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
