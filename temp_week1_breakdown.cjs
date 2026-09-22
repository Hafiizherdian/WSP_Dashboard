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
      SELECT file_id,
             COUNT(*) AS rows,
             SUM(omzet) AS total_omzet
      FROM sales_records
      WHERE week = 1 AND EXTRACT(YEAR FROM date) = 2024
      GROUP BY file_id
      ORDER BY file_id
    `);

    console.log(result.rows);
  } catch (error) {
    console.error('Query failed:', error);
  } finally {
    await client.end();
  }
}

run();
