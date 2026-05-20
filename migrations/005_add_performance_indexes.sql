-- =====================================================
-- Migration: Add Performance Indexes
-- Description: Add comprehensive indexes for better query performance
-- =====================================================

-- Single column indexes for basic filtering
CREATE INDEX IF NOT EXISTS idx_sales_records_city ON sales_records(city);
CREATE INDEX IF NOT EXISTS idx_sales_records_area ON sales_records(area);
CREATE INDEX IF NOT EXISTS idx_sales_records_category ON sales_records(category);
CREATE INDEX IF NOT EXISTS idx_sales_records_customer_type ON sales_records(customer_type);
CREATE INDEX IF NOT EXISTS idx_sales_records_salesman ON sales_records(salesman);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_sales_records_date_week ON sales_records(date, week);
CREATE INDEX IF NOT EXISTS idx_sales_records_year_week ON sales_records(EXTRACT(YEAR FROM date), week);
CREATE INDEX IF NOT EXISTS idx_sales_records_year_product ON sales_records(EXTRACT(YEAR FROM date), product);
CREATE INDEX IF NOT EXISTS idx_sales_records_year_city ON sales_records(EXTRACT(YEAR FROM date), city);
CREATE INDEX IF NOT EXISTS idx_sales_records_year_area ON sales_records(EXTRACT(YEAR FROM date), area);
CREATE INDEX IF NOT EXISTS idx_sales_records_week_product ON sales_records(week, product);
CREATE INDEX IF NOT EXISTS idx_sales_records_week_city ON sales_records(week, city);
CREATE INDEX IF NOT EXISTS idx_sales_records_week_area ON sales_records(week, area);

-- Performance indexes for dashboard queries
CREATE INDEX IF NOT EXISTS idx_sales_records_date_product_customer ON sales_records(date, product, customer);
CREATE INDEX IF NOT EXISTS idx_sales_records_year_week_product ON sales_records(EXTRACT(YEAR FROM date), week, product);
CREATE INDEX IF NOT EXISTS idx_sales_records_year_week_city ON sales_records(EXTRACT(YEAR FROM date), week, city);
CREATE INDEX IF NOT EXISTS idx_sales_records_year_week_area ON sales_records(EXTRACT(YEAR FROM date), week, area);

-- Indexes for aggregation queries
CREATE INDEX IF NOT EXISTS idx_sales_records_date_omzet ON sales_records(date, omzet);
CREATE INDEX IF NOT EXISTS idx_sales_records_year_omzet ON sales_records(EXTRACT(YEAR FROM date), omzet);
CREATE INDEX IF NOT EXISTS idx_sales_records_week_omzet ON sales_records(week, omzet);

-- Additional indexes for uploaded_files
CREATE INDEX IF NOT EXISTS idx_uploaded_files_uploaded_by ON uploaded_files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_original_name ON uploaded_files(original_name);

-- Partial indexes for common filters
CREATE INDEX IF NOT EXISTS idx_sales_records_active ON sales_records(date, week, product) WHERE omzet > 0;
CREATE INDEX IF NOT EXISTS idx_uploaded_files_completed ON uploaded_files(created_at) WHERE status = 'completed';

-- Analyze tables for better query planning
ANALYZE sales_records;
ANALYZE uploaded_files;
ANALYZE users;

-- Show index information
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('sales_records', 'uploaded_files', 'users')
ORDER BY tablename, indexname;
