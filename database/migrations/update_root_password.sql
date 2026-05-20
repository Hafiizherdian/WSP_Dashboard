-- Update root user password to RootAdmin123!
UPDATE app_users 
SET password_hash = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj5o.k0GW3Aq'
WHERE username = 'root';
