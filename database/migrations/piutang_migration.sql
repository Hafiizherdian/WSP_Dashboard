-- Migration piutang_records
-- psql -U <user> -d <db> -f piutang_migration.sql


CREATE TABLE IF NOT EXISTS piutang_records (
    id              SERIAL PRIMARY KEY,
    file_id         TEXT NOT NULL,
    area            VARCHAR(50) NOT NULL,
    faktur          TEXT NOT NULL,
    kode            TEXT NOT NULL,
    outlet          TEXT NOT NULL,
    kota            TEXT NOT NULL DEFAULT '',
    kecamatan       TEXT NOT NULL DEFAULT '',
    kel_desa        TEXT NOT NULL DEFAULT '',
    salesman        TEXT NOT NULL DEFAULT '',
    tanggal         DATE,
    jatuh_tempo     DATE,
    hari            INTEGER,
    piutang         BIGINT NOT NULL DEFAULT 0,
    giro            BIGINT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index untuk query umum
CREATE INDEX IF NOT EXISTS idx_piutang_kota         ON piutang_records (kota);
CREATE INDEX IF NOT EXISTS idx_piutang_salesman     ON piutang_records (salesman);
CREATE INDEX IF NOT EXISTS idx_piutang_hari         ON piutang_records (hari);
CREATE INDEX IF NOT EXISTS idx_piutang_file_id      ON piutang_records (file_id);

-- Tabel file metadata (upload history)
CREATE TABLE IF NOT EXISTS piutang_files (
    id              TEXT PRIMARY KEY,
    original_name   TEXT NOT NULL,
    area            VARCHAR(50) NOT NULL,
    row_count       INTEGER NOT NULL DEFAULT 0,
    uploaded_by     TEXT NOT NULL DEFAULT '-',
    uploaded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);