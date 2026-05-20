-- Migration: Add allowed_areas field to app_users table
-- Run this script to add area-based access control

-- Add allowed_areas field as TEXT array
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS allowed_areas TEXT[] DEFAULT '{}';

-- Create GIN index for efficient array queries
CREATE INDEX IF NOT EXISTS idx_app_users_allowed_areas ON app_users USING GIN(allowed_areas);

-- Update existing users - assign all default areas temporarily
UPDATE app_users 
SET allowed_areas = ARRAY['banyuwangi', 'jember', 'surabaya', 'malang', 'pasuruan']
WHERE allowed_areas = '{}' OR allowed_areas IS NULL;

-- Set root user to have all areas (empty array)
UPDATE app_users 
SET allowed_areas = '{}'
WHERE username = 'root';

-- Add comment for documentation
COMMENT ON COLUMN app_users.allowed_areas IS 'Array of area IDs that this user is allowed to access';
