-- Recreate root user with known good password
-- Password: admin

-- Delete existing root user
DELETE FROM app_users WHERE username = 'root';

-- Insert new root user with simple password "admin"
INSERT INTO app_users (
  id,
  username, 
  email, 
  password_hash, 
  role, 
  is_active, 
  allowed_areas
) VALUES (
  gen_random_uuid(),
  'root',
  'root@example.com', 
  '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- "admin"
  'root',
  true,
  '{}' -- Empty array = all areas
);

-- Verify creation
SELECT id, username, email, role, is_active, allowed_areas,
       'Password: admin' as password_note
FROM app_users WHERE username = 'root';
