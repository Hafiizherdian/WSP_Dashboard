const { Pool } = require('pg');

async function checkColumns() {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'dashboard_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'cakra123',
  });

  try {
    const res = await pool.query(`
      SELECT column_name, data_type, numeric_precision, numeric_scale
      FROM information_schema.columns
      WHERE table_name = 'sales_records'
      ORDER BY ordinal_position;
    `);
    console.table(res.rows);
  } catch (error) {
    console.error('Failed to inspect schema:', error);
  } finally {
    await pool.end();
  }
}

checkColumns();
