-- psql -d WSP_DB -f database/migrations/add_login_logs.sql

create table if not exists login_logs (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    ip_address  TEXT,
    user_agent  TEXT,
    success     BOOLEAN     NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

create index if not exists idx_login_logs_user_created on login_logs (user_id, created_at DESC);
create index if not exists idx_login_logs_created on login_logs (created_at DESC);

comment on table    login_logs              is 'Riwayat percobaan login (berhasil & gagal)';
comment on column   login_logs.user_id      is 'Referensi ke app_users. cascade delete.';
comment on column   login_logs.ip_address   is 'Alamat IP dari mana percobaan login dilakukan (dari x-forwarded-for atau remoteAddress).';
COMMENT ON COLUMN login_logs.user_agent   IS 'User-Agent header dari browser/client';
COMMENT ON COLUMN login_logs.success      IS 'true = login berhasil, false = password salah / akun nonaktif';
