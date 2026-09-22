const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'dashboard_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'cakra123',
});

async function fixOmzetSchema() {
  const client = await pool.connect();
  
  try {
    console.log('Checking current omzet column definition...');
    
    // Check current column definition
    const checkResult = await client.query(`
      SELECT 
        column_name, 
        data_type, 
        numeric_precision, 
        numeric_scale,
        character_maximum_length
      FROM information_schema.columns 
      WHERE table_name = 'sales_records' 
        AND column_name = 'omzet'
    `);
    
    console.log('Current omzet column definition:', checkResult.rows[0]);
    
    const columnDef = checkResult.rows[0];
    if (columnDef.numeric_precision === 10 && columnDef.numeric_scale === 2) {
      console.log('Found precision 10, scale 2 - fixing to precision 18, scale 2...');
      
      // Alter the column to increase precision
      await client.query('ALTER TABLE sales_records ALTER COLUMN omzet TYPE DECIMAL(18,2)');
      console.log('✓ Omzet column updated to DECIMAL(18,2)');
    } else {
      console.log('Omzet column already has correct definition');
    }
    
    // Check for other potentially problematic columns
    const otherColumnsResult = await client.query(`
      SELECT 
        column_name, 
        data_type, 
        numeric_precision, 
        numeric_scale
      FROM information_schema.columns 
      WHERE table_name = 'sales_records' 
        AND data_type IN ('decimal', 'numeric')
        AND numeric_precision = 10
    `);
    
    if (otherColumnsResult.rows.length > 0) {
      console.log('Other columns with precision 10 found:', otherColumnsResult.rows);
    } else {
      console.log('No other problematic columns found');
    }
    
  } catch (error) {
    console.error('Error fixing schema:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

fixOmzetSchema();
