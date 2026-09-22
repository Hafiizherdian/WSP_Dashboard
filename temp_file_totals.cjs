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
             SUM(omzet) AS total_omzet,
             COUNT(DISTINCT product) AS total_products,
             COUNT(DISTINCT units_bks) AS total_units_bks,
             SUM(units_bks) AS total_units_bks_sum,
             COUNT(DISTINCT units_slop) AS total_units_slop,
             SUM(units_slop) AS total_units_slop_sum,
             COUNT(DISTINCT units_bal) AS total_units_bal,
             SUM(units_bal) AS total_units_bal_sum,
             COUNT(DISTINCT units_dos) AS total_units_dos,
             SUM(units_dos) AS total_units_dos_sum
      FROM sales_records
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
