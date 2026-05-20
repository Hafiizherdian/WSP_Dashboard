import { pool } from '@/lib/db';

export async function GET() {
  try {
    const client = await pool.connect();
    
    // Query untuk melihat raw data units_dos untuk ON BOLD 20 F
    const rawData = await client.query(`
      SELECT 
        week,
        date,
        EXTRACT(YEAR FROM date) as year,
        units_dos,
        omzet,
        file_id
      FROM sales_records 
      WHERE product = 'ON BOLD 20 F' 
      ORDER BY EXTRACT(YEAR FROM date), week
    `);
    
    // Query untuk melihat total units_dos per file
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
    
    // Query untuk melihat semua units_dos values (termasuk yang 0)
    const allDosValues = await client.query(`
      SELECT 
        units_dos,
        COUNT(*) as count
      FROM sales_records 
      WHERE product = 'ON BOLD 20 F' 
        AND EXTRACT(YEAR FROM date) = 2024
      GROUP BY units_dos
      ORDER BY units_dos DESC
      LIMIT 20
    `);
    
    client.release();
    
    return Response.json({
      success: true,
      rawData: rawData.rows,
      fileTotals: fileTotals.rows,
      allDosValues: allDosValues.rows,
      summary: {
        totalRecords: rawData.rows.length,
        totalDos2024: rawData.rows.filter(r => r.year === 2024).reduce((sum, r) => sum + parseFloat(r.units_dos || 0), 0),
        totalDos2025: rawData.rows.filter(r => r.year === 2025).reduce((sum, r) => sum + parseFloat(r.units_dos || 0), 0)
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
