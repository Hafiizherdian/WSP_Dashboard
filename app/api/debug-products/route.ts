import { pool } from '@/lib/db';

export async function GET() {
  try {
    const client = await pool.connect();

    // Semua product per category, grouped per file
    const categoryProducts = await client.query(`
      SELECT 
        file_id,
        category,
        product,
        COUNT(*)           AS record_count,
        SUM(units_dos)     AS total_dos,
        SUM(omzet)         AS total_omzet
      FROM sales_records
      GROUP BY file_id, category, product
      ORDER BY file_id, category, product
    `);

    // Summary: berapa product unik per category per file
    const categorySummary = await client.query(`
      SELECT
        file_id,
        category,
        COUNT(DISTINCT product) AS product_count,
        SUM(units_dos)          AS total_dos,
        SUM(omzet)              AS total_omzet
      FROM sales_records
      GROUP BY file_id, category
      ORDER BY file_id, category
    `);

    // Product yang kategorinya TIDAK KONSISTEN antar file (nama sama, category beda)
    const inconsistentCategory = await client.query(`
      SELECT
        product,
        COUNT(DISTINCT category) AS category_count,
        ARRAY_AGG(DISTINCT category ORDER BY category) AS categories
      FROM sales_records
      GROUP BY product
      HAVING COUNT(DISTINCT category) > 1
      ORDER BY product
    `);

    client.release();

    // Reshape: { file_id -> { category -> product[] } }
    const grouped: Record<string, Record<string, { product: string; record_count: number; total_dos: number; total_omzet: number }[]>> = {};

    for (const row of categoryProducts.rows) {
      const fid = String(row.file_id);
      const cat = row.category ?? '(null)';
      if (!grouped[fid]) grouped[fid] = {};
      if (!grouped[fid][cat]) grouped[fid][cat] = [];
      grouped[fid][cat].push({
        product:      row.product,
        record_count: Number(row.record_count),
        total_dos:    Number(row.total_dos),
        total_omzet:  Number(row.total_omzet),
      });
    }

    return Response.json({
      success: true,
      // Struktur tree: file_id → category → products[]
      grouped,
      // Flat summary per file+category
      categorySummary: categorySummary.rows,
      // Product dengan category tidak konsisten lintas file
      inconsistentCategory: inconsistentCategory.rows,
    });

  } catch (error) {
    console.error('Debug category error:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}