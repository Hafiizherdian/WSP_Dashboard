-- =====================================================
-- Migration: Fix Cross-Year Data
-- Description: Move December 2025 data to 2026 for W52 and W1 files
-- =====================================================

-- Create backup table
CREATE TABLE IF NOT EXISTS sales_records_backup AS 
SELECT * FROM sales_records;

-- Fix cross-year data for Bandung W1 2026.xlsx and Bandung W52.xlsx
UPDATE sales_records sr
SET date = date + INTERVAL '1 year'
WHERE sr.file_id IN (
    SELECT id FROM uploaded_files WHERE original_name IN (
        'Bandung W1 2026.xlsx', 'Bandung W52.xlsx'
    )
) AND EXTRACT(YEAR FROM date) = 2025;

-- Verification query
SELECT 
    EXTRACT(YEAR FROM date) as year,
    COUNT(*) as records,
    SUM(omzet) as total_omzet
FROM sales_records
WHERE EXTRACT(YEAR FROM date) IN (2025, 2026)
GROUP BY EXTRACT(YEAR FROM date)
ORDER BY year;
