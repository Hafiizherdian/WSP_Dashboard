const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'dashboard_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'cakra123',
});

async function fixUnitsSchema() {
  const client = await pool.connect();
  
  try {
    console.log('Fixing units columns to match schema.sql (INTEGER)...');
    
    const unitsColumns = ['units_bks', 'units_slop', 'units_bal', 'units_dos'];
    
    for (const column of unitsColumns) {
      console.log(`Checking ${column}...`);
      
      // Check current column definition
      const checkResult = await client.query(`
        SELECT 
          column_name, 
          data_type, 
          numeric_precision, 
          numeric_scale
        FROM information_schema.columns 
        WHERE table_name = 'sales_records' 
          AND column_name = $1
      `, [column]);
      
      const columnDef = checkResult.rows[0];
      console.log(`Current ${column} definition:`, columnDef);
      
      if (columnDef.data_type === 'numeric' && columnDef.numeric_precision === 10) {
        console.log(`Converting ${column} from DECIMAL(10,2) to INTEGER...`);
        
        // First, round the values to integers, then convert
        await client.query(`
          ALTER TABLE sales_records 
          ALTER COLUMN ${column} TYPE INTEGER USING ROUND(${column}::numeric)::INTEGER
        `);
        
        console.log(`✓ ${column} updated to INTEGER`);
      } else {
        console.log(`${column} already has correct definition`);
      }
    }
    
    console.log('All units columns fixed successfully!');
    
  } catch (error) {
    console.error('Error fixing units schema:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

fixUnitsSchema();
