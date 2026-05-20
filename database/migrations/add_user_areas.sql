-- Migration: Add allowed_areas field to users table
-- Run this script to add area-based access control

-- Add allowed_areas field as TEXT array
ALTER TABLE users ADD COLUMN IF NOT EXISTS allowed_areas TEXT[] DEFAULT '{}';

-- Create GIN index for efficient array queries
CREATE INDEX IF NOT EXISTS idx_users_allowed_areas ON users USING GIN(allowed_areas);

-- Migration for existing users - assign all default areas temporarily
-- This ensures existing users continue to work until areas are properly assigned
UPDATE users 
SET allowed_areas = ARRAY['banyuwangi', 'jember', 'surabaya', 'malang', 'pasuruan']
WHERE allowed_areas = '{}' OR allowed_areas IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN users.allowed_areas IS 'Array of area IDs that this user is allowed to access';
