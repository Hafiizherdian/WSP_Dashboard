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
    const result = await client.query(`
      SELECT omzet::numeric AS omzet
      FROM sales_records
      WHERE week = 1 AND EXTRACT(YEAR FROM date) = 2024
      ORDER BY omzet::numeric DESC
      LIMIT 20
    `);

    console.log(result.rows);
  } catch (error) {
    console.error('Query failed:', error);
  } finally {
    await client.end();
  }
}

run();
