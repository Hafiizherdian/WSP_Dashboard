-- Test with freshly generated hash
-- We'll try multiple hash formats

-- First, let's see what we currently have
SELECT username, 
       LEFT(password_hash, 30) as hash_preview,
       LENGTH(password_hash) as hash_length
FROM app_users WHERE username = 'root';

-- Try hash with $2b$ prefix (most common)
UPDATE app_users 
SET password_hash = '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW' -- "admin"
WHERE username = 'root';

-- Show the result
SELECT username, 
       LEFT(password_hash, 30) as hash_preview,
       LENGTH(password_hash) as hash_length,
       'Try password: admin' as test_instruction
FROM app_users WHERE username = 'root';
