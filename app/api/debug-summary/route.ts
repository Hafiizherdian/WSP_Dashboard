import { pool } from '@/lib/db';

export async function GET() {
  try {
    const client = await pool.connect();
    
    // Query untuk melihat total units_dos per file untuk ON BOLD 20 F
    const fileTotals = await client.query(`
      SELECT 
        f.id as file_id,
        f.filename,
        COUNT(s.id) as record_count,
        SUM(CASE WHEN s.product = 'ON BOLD 20 F' THEN s.units_dos ELSE 0 END) as bold_dos_total,
        SUM(s.units_dos) as all_dos_total
      FROM uploaded_files f
      LEFT JOIN sales_records s ON f.id = s.file_id
      WHERE f.id IN (25, 26)
      GROUP BY f.id, f.filename
      ORDER BY f.id
    `);
    
    // Query untuk melihat summary ON BOLD 20 F
    const boldSummary = await client.query(`
      SELECT 
        EXTRACT(YEAR FROM date) as year,
        COUNT(*) as total_records,
        SUM(CASE WHEN units_dos > 0 THEN 1 ELSE 0 END) as records_with_dos,
        SUM(CASE WHEN units_dos = 0 THEN 1 ELSE 0 END) as records_with_zero_dos,
        SUM(units_dos) as total_dos,
        AVG(units_dos) as avg_dos,
        MAX(units_dos) as max_dos,
        MIN(units_dos) as min_dos
      FROM sales_records 
      WHERE product = 'ON BOLD 20 F' 
      GROUP BY EXTRACT(YEAR FROM date)
      ORDER BY year
    `);
    
    // Query untuk melihat top 10 highest units_dos values
    const topDosValues = await client.query(`
      SELECT 
        week,
        date,
        units_dos,
        omzet
      FROM sales_records 
      WHERE product = 'ON BOLD 20 F' 
        AND EXTRACT(YEAR FROM date) = 2024
        AND units_dos > 0
      ORDER BY CAST(units_dos AS DECIMAL) DESC
      LIMIT 10
    `);
    
    client.release();
    
    return Response.json({
      success: true,
      fileTotals: fileTotals.rows,
      boldSummary: boldSummary.rows,
      topDosValues: topDosValues.rows
    });
    
  } catch (error) {
    console.error('Database query error:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
