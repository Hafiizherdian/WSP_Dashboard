const { Client } = require('pg');

async function run() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME || 'dashboard_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'cakra123',
  });

  try {
    await client.connect();
    const result = await client.query('SELECT COALESCE(SUM(omzet), 0) AS total_omzet FROM sales_records');
    console.log('Total omzet:', result.rows[0].total_omzet);
  } catch (error) {
    console.error('Query failed:', error);
  } finally {
    await client.end();
  }
}

run();
