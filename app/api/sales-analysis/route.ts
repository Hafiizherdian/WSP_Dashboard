import { NextRequest, NextResponse } from 'next/server';
import { fetchSalesData } from '@/lib/databasev2';
import { withAuth } from '@/lib/auth/session';

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

      // ── Area-based filtering & target resolution per role ─────────────────
      if (user.role === 'root') {
        // Root dengan area spesifik → validasi tidak diperlukan, langsung pakai
        // Root tanpa area filter   → resolveTargetAreas() di databasev2 akan
        //                            fetch semua area dari DB secara otomatis
        // Tidak perlu set allowedAreas — biarkan databasev2 yang menangani
      } else if (user.allowed_areas && user.allowed_areas.length > 0) {
        if (filters.area) {
          // Ada area spesifik dipilih — validasi akses
          if (!user.allowed_areas.includes(filters.area)) {
            return NextResponse.json(
              { success: false, error: 'Anda tidak memiliki akses ke area ini' },
              { status: 403 },
            );
          }
          // filters.area valid — resolveTargetAreas() akan pakai [filters.area]
        } else {
          // Tidak pilih area → pakai semua allowed areas milik user
          // Berlaku untuk: filter sales records DAN target queries
          filters.allowedAreas = user.allowed_areas;
        }
      } else {
        // User tanpa allowed_areas sama sekali → tidak ada data & target
        filters.allowedAreas = [];
      }

      const data = await fetchSalesData(filters);

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