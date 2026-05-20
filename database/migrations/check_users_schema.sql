-- Check users table structure
\d users

-- Check if root user exists
SELECT id, username, email, role, is_active, allowed_areas, created_at, last_login 
FROM users 
WHERE username = 'root';
