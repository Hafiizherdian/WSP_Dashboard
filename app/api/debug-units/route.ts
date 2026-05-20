import { pool } from '@/lib/db';

export async function GET() {
  try {
    const client = await pool.connect();
    
    // Query untuk melihat total units_dos untuk ON BOLD 20 F per tahun
    const result = await client.query(`
      SELECT 
        EXTRACT(YEAR FROM date) as year,
        SUM(CASE WHEN product = 'ON BOLD 20 F' THEN units_dos ELSE 0 END) as total_dos,
        COUNT(CASE WHEN product = 'ON BOLD 20 F' THEN 1 END) as record_count,
        MIN(CASE WHEN product = 'ON BOLD 20 F' THEN week END) as min_week,
        MAX(CASE WHEN product = 'ON BOLD 20 F' THEN week END) as max_week
      FROM sales_records 
      WHERE product = 'ON BOLD 20 F' 
        AND units_dos IS NOT NULL 
        AND units_dos != 0
      GROUP BY EXTRACT(YEAR FROM date)
      ORDER BY year
    `);
    
    // Query untuk melihat detail data per minggu
    const weeklyData = await client.query(`
      SELECT 
        week,
        date,
        EXTRACT(YEAR FROM date) as year,
        units_dos,
        omzet
      FROM sales_records 
      WHERE product = 'ON BOLD 20 F' 
        AND units_dos IS NOT NULL 
        AND units_dos != 0
      ORDER BY EXTRACT(YEAR FROM date), week
    `);
    
    // Query untuk melihat semua records ON BOLD 20 F (termasuk yang units_dos = 0)
    const allRecords = await client.query(`
      SELECT 
        week,
        date,
        EXTRACT(YEAR FROM date) as year,
        units_bks,
        units_slop,
        units_bal,
        units_dos,
        omzet
      FROM sales_records 
      WHERE product = 'ON BOLD 20 F' 
      ORDER BY EXTRACT(YEAR FROM date), week
    `);
    
    client.release();
    
    return Response.json({
      success: true,
      yearlyTotals: result.rows,
      weeklyData: weeklyData.rows,
      allRecords: allRecords.rows,
      totalRecords: weeklyData.rows.length,
      allRecordsCount: allRecords.rows.length
    });
    
  } catch (error) {
    console.error('Database query error:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
