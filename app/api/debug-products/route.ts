import { pool } from '@/lib/db';

export async function GET() {
  try {
    const client = await pool.connect();
    
    // Query untuk melihat semua products dan total units_dos mereka (file 25)
    const allProductsDos = await client.query(`
      SELECT 
        product,
        SUM(units_dos) as total_dos,
        COUNT(*) as record_count,
        MIN(units_dos) as min_dos,
        MAX(units_dos) as max_dos,
        AVG(units_dos) as avg_dos
      FROM sales_records 
      WHERE file_id = 25
        AND units_dos > 0
      GROUP BY product
      ORDER BY total_dos DESC
      LIMIT 20
    `);
    
    // Query untuk melihat ON BOLD 20 F detail per file
    const boldPerFile = await client.query(`
      SELECT 
        file_id,
        SUM(units_dos) as total_dos,
        COUNT(*) as record_count,
        COUNT(CASE WHEN units_dos > 0 THEN 1 END) as records_with_dos,
        COUNT(CASE WHEN units_dos = 0 THEN 1 END) as records_with_zero_dos
      FROM sales_records 
      WHERE product = 'ON BOLD 20 F'
      GROUP BY file_id
      ORDER BY file_id
    `);
    
    // Query untuk melihat total semua products per file
    const totalPerFile = await client.query(`
      SELECT 
        file_id,
        SUM(units_dos) as total_dos,
        COUNT(*) as record_count
      FROM sales_records 
      WHERE file_id IN (25, 26)
      GROUP BY file_id
      ORDER BY file_id
    `);
    
    client.release();
    
    return Response.json({
      success: true,
      allProductsDos: allProductsDos.rows,
      boldPerFile: boldPerFile.rows,
      totalPerFile: totalPerFile.rows,
      expected: {
        file25: "10390.558",
        file26: "12161.279"
      }
    });
    
  } catch (error) {
    console.error('Database query error:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
