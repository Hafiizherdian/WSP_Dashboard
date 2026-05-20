-- ─────────────────────────────────────────────────────────────────────────────
-- AUTH MIGRATION
-- Jalankan sekali di database yang sudah ada
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TYPE user_role AS ENUM ('root', 'admin', 'user');

CREATE TABLE IF NOT EXISTS app_users (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  username     VARCHAR(64) NOT NULL UNIQUE,
  email        VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT        NOT NULL,           -- bcrypt hash
  role         user_role   NOT NULL DEFAULT 'user',
  is_active    BOOLEAN     NOT NULL DEFAULT true,
  created_by   UUID        REFERENCES app_users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_login   TIMESTAMPTZ
);

-- Trigger: auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON app_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Index
CREATE INDEX IF NOT EXISTS idx_app_users_username ON app_users(username);
CREATE INDEX IF NOT EXISTS idx_app_users_role     ON app_users(role);

-- ─────────────────────────────────────────────────────────────────────────────
-- SEED: Root user pertama
-- Password default: "RootPass123!" → ganti setelah login pertama
-- Generate hash baru: node -e "const b=require('bcryptjs');b.hash('RootPass123!',12).then(console.log)"
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO app_users (username, email, password_hash, role)
VALUES (
  'root',
  'root@example.com',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj5o.k0GW3Aq', -- RootPass123!
  'root'
) ON CONFLICT DO NOTHING;