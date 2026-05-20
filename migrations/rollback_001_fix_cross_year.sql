-- =====================================================
-- Rollback: Fix Cross-Year Data
-- Description: Restore data from backup
-- =====================================================

-- Restore from backup
TRUNCATE sales_records;
INSERT INTO sales_records SELECT * FROM sales_records_backup;
DROP TABLE sales_records_backup;
