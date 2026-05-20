-- Create or update root user with correct password
-- Password: RootAdmin123!
-- Hash: $2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj5o.k0GW3Aq

-- Delete existing root user if exists
DELETE FROM users WHERE username = 'root';

-- Insert new root user with ALL areas access (empty array = all areas)
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

-- Add last_login column if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;

-- Add created_by column if not exists (UUID type)
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);

-- Add updated_at column if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
