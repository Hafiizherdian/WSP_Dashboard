-- Check current schema and fix omzet field precision issue
-- This script will check the current column definition and fix it if needed

-- Check current column definition
SELECT 
    column_name, 
    data_type, 
    numeric_precision, 
    numeric_scale,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'sales_records' 
    AND column_name = 'omzet';

-- If the omzet column has precision 10, scale 2, we need to alter it to 18,2
-- This will allow values up to 99,999,999,999,999,999.99

-- Uncomment the following line if you need to fix the column:
-- ALTER TABLE sales_records ALTER COLUMN omzet TYPE DECIMAL(18,2);

-- Check other numeric columns that might have similar issues
SELECT 
    column_name, 
    data_type, 
    numeric_precision, 
    numeric_scale
FROM information_schema.columns 
WHERE table_name = 'sales_records' 
    AND data_type IN ('decimal', 'numeric')
    AND numeric_precision = 10;
