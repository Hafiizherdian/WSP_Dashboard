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
      SELECT EXTRACT(YEAR FROM date) AS year,
             COUNT(*) AS records,
             SUM(omzet) AS total_omzet
      FROM sales_records
      GROUP BY 1
      ORDER BY 1
    `);

    console.log(result.rows);
  } catch (error) {
    console.error('Query failed:', error);
  } finally {
    await client.end();
  }
}

run();
