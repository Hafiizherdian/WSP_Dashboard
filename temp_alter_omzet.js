const { Pool } = require('pg');

async function alterOmzetColumn() {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'dashboard_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'cakra123',
  });

  try {
    await pool.query("ALTER TABLE sales_records ALTER COLUMN omzet TYPE DECIMAL(18,2);");
    console.log('✅ Column omzet berhasil diubah menjadi DECIMAL(18,2).');
  } catch (error) {
    console.error('❌ Gagal mengubah kolom omzet:', error);
  } finally {
    await pool.end();
  }
}

alterOmzetColumn();
