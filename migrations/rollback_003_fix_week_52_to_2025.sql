-- =====================================================
-- Rollback: Fix Week 52 Data to Year 2025
-- Description: Restore W52 records to 2026 (original state)
-- =====================================================

-- Restore from backup
TRUNCATE sales_records;
INSERT INTO sales_records SELECT * FROM sales_records_backup;
DROP TABLE sales_records_backup;
