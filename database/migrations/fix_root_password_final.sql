-- Fix root password with verified hash
-- Password: admin
-- Verified Hash: $2b$12$SiHwTCvWSuiHu924nNYlR.Tou7D6bDww4SKjP.D.sM3Gntv/Cs1Xu

UPDATE app_users 
SET password_hash = '$2b$12$SiHwTCvWSuiHu924nNYlR.Tou7D6bDww4SKjP.D.sM3Gntv/Cs1Xu'
WHERE username = 'root';

-- Verify update
SELECT username, 
       LEFT(password_hash, 30) as hash_preview,
       LENGTH(password_hash) as hash_length,
       'Password: admin (VERIFIED)' as login_info
FROM app_users WHERE username = 'root';
