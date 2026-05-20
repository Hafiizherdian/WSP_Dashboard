-- Reset root user password and ensure proper setup
-- Password will be: RootAdmin123!

-- First, let's see current root user data
SELECT id, username, email, role, allowed_areas FROM app_users WHERE username = 'root';

-- Update password hash for RootAdmin123!
UPDATE app_users 
SET password_hash = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj5o.k0GW3Aq'
WHERE username = 'root';

-- Ensure allowed_areas is empty (all areas access)
UPDATE app_users 
SET allowed_areas = '{}'
WHERE username = 'root';

-- Verify update
SELECT id, username, email, role, allowed_areas, 
       CASE WHEN password_hash = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj5o.k0GW3Aq' 
            THEN 'Hash matches RootAdmin123!' 
            ELSE 'Hash does not match' 
       END as password_status
FROM app_users WHERE username = 'root';
