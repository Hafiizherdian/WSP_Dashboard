-- Simple root user creation without complex constraints
-- Password: RootAdmin123!

-- Delete existing root user if exists
DELETE FROM users WHERE username = 'root';

-- Insert new root user with ALL areas access
INSERT INTO users (
  username, 
  email, 
  password_hash, 
  role, 
  is_active, 
  allowed_areas
) VALUES (
  'root',
  'root@example.com', 
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj5o.k0GW3Aq',
  'root',
  true,
  '{}' -- Empty array means access to ALL areas for root
);
