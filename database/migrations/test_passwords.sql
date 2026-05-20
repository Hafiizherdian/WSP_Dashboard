-- Test multiple password hashes for root user
-- Try different common password hashes

-- Hash for "admin"
UPDATE app_users 
SET password_hash = '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'
WHERE username = 'root';

-- Test result
SELECT username, 
       CASE WHEN password_hash = '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'
            THEN 'Password set to: admin'
            ELSE 'Password not set correctly'
       END as status
FROM app_users WHERE username = 'root';
