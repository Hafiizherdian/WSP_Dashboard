-- Fix constraints issues
-- Remove problematic foreign key constraint if exists
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_created_by_fkey;

-- Add created_by column without foreign key constraint for now
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_by integer;

-- Update existing users to set created_by to root (id = 10) if null
UPDATE users SET created_by = 10 WHERE created_by IS NULL AND id != 10;
