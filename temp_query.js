const { Client } = require('pg');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'dashboard_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'cakra123',
};

const client = new Client(dbConfig);

async function getTotalOmzet() {
  try {
    await client.connect();
    const res = await client.query('SELECT SUM(CAST(omzet AS NUMERIC)) FROM sales_records');
    console.log('Total Omzet from Database:', res.rows[0].sum);
  } catch (err) {
    console.error('Error executing query', err.stack);
  } finally {
    await client.end();
  }
}

getTotalOmzet();
