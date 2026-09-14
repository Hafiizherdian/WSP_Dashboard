import { NextRequest, NextResponse } from 'next/server';
import { fetchSalesData } from '@/lib/databasev2';
import { withAuth } from '@/lib/auth/session';
import { getCached, setCached } from '@/lib/salesCache';
import { pool } from '@/lib/db';

export async function GET(request: NextRequest) {
  return withAuth(request, 'view_stats', async (user) => {
    try {
      const { searchParams } = new URL(request.url);

      // Parse filter parameters
      const filters: any = {};

      const year1       = searchParams.get('year1');
      const year2       = searchParams.get('year2');
      const weekStart1  = searchParams.get('weekStart1');
      const weekEnd1    = searchParams.get('weekEnd1');
      const weekStart2  = searchParams.get('weekStart2');
      const weekEnd2    = searchParams.get('weekEnd2');
      const product     = searchParams.get('product');
      const city        = searchParams.get('city');
      const area        = searchParams.get('area');
      const regional     = searchParams.get('regional');
      const limit       = searchParams.get('limit');
      const selectedUnit = searchParams.get('selectedUnit');

      if (year1)        filters.year1        = parseInt(year1);
      if (year2)        filters.year2        = parseInt(year2);
      if (weekStart1)   filters.weekStart1   = parseInt(weekStart1);
      if (weekEnd1)     filters.weekEnd1     = parseInt(weekEnd1);
      if (weekStart2)   filters.weekStart2   = parseInt(weekStart2);
      if (weekEnd2)     filters.weekEnd2     = parseInt(weekEnd2);
      if (product)      filters.product      = product;
      if (city)         filters.city         = city;
      if (area)         filters.area         = area;
      if (limit)        filters.limit        = parseInt(limit);
      if (selectedUnit) filters.selectedUnit = selectedUnit;

      // ── Resolve regional → daftar area_ids (dipakai lewat filters.allowedAreas,
      //    jalur yang sama dengan RBAC multi-area di bawah) ────────────────────
      let regionalAreaIds: string[] | null = null;
      if (regional) {
        const r = await pool.query('SELECT area_ids FROM regions WHERE id = $1', [regional]);
        if (r.rows.length === 0) {
          return NextResponse.json(
            { success: false, error: 'Regional tidak ditemukan' },
            { status: 404 },
          );
        }
        regionalAreaIds = r.rows[0].area_ids ?? [];
      }

      // ── Area-based filtering & target resolution per role ─────────────────
      if (user.role === 'root') {
        if (regionalAreaIds) {
          // Root pilih regional → filter ke area-area anggotanya
          filters.allowedAreas = regionalAreaIds;
        }
        // Root tanpa area/regional filter → resolveTargetAreas() di databasev2
        //                                    fetch semua area dari DB otomatis
      } else if (user.allowed_areas && user.allowed_areas.length > 0) {
        if (regionalAreaIds) {
          // Non-root pilih regional → irisan dengan allowed_areas dia (defense
          // in depth, frontend juga sudah filter regional yang bisa dipilih)
          const intersect = regionalAreaIds.filter(id => user.allowed_areas.includes(id));
          if (intersect.length === 0) {
            return NextResponse.json(
              { success: false, error: 'Anda tidak memiliki akses ke regional ini' },
              { status: 403 },
            );
          }
          filters.allowedAreas = intersect;
        } else if (filters.area) {
          if (!user.allowed_areas.includes(filters.area)) {
            return NextResponse.json(
              { success: false, error: 'Anda tidak memiliki akses ke area ini' },
              { status: 403 },
            );
          }
        } else {
          filters.allowedAreas = user.allowed_areas;
        }
      } else {
        filters.allowedAreas = [];
      }

      // Cek cache dulu sebelum sentuh DB.
      // allowedAreas ikut masuk cache key karena kena RBAC per user —
      // supaya user dengan allowed_areas beda nggak saling "berbagi" hasil cache.
      const cacheParams = { ...filters };
      const cached = getCached(cacheParams);
      if (cached) {
        return NextResponse.json({ success: true, data: cached });
      }

      const data = await fetchSalesData(filters);

      setCached(cacheParams, data);

      return NextResponse.json({
        success: true,
        data,
      });
    } catch (error) {
      console.error('[API/sales-analysis] Error:', error);
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 },
      );
    }
  });
}