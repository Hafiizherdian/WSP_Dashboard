-- Migration script to change unit fields from INTEGER to DECIMAL
-- Run this script to update existing database

-- Alter unit columns to support decimal values
ALTER TABLE sales_records 
ALTER COLUMN units_bks TYPE DECIMAL(10,3) USING units_bks::DECIMAL(15,3),
ALTER COLUMN units_slop TYPE DECIMAL(10,3) USING units_slop::DECIMAL(15,3),
ALTER COLUMN units_bal TYPE DECIMAL(10,3) USING units_bal::DECIMAL(15,3),
ALTER COLUMN units_dos TYPE DECIMAL(10,3) USING units_dos::DECIMAL(15,3);

-- Update any existing integer values to decimal format (optional)
-- UPDATE sales_records SET 
--   units_bks = units_bks::DECIMAL(10,3),
--   units_slop = units_slop::DECIMAL(10,3),
--   units_bal = units_bal::DECIMAL(10,3),
--   units_dos = units_dos::DECIMAL(10,3);
