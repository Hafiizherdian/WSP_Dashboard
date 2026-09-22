/**
 * Database utilities untuk dashboard
 * Fungsi untuk fetch dan process data dari PostgreSQL
 *
 * File ini adalah entry point module `databasev2` (dipanggil sebagai
 * `@/lib/databasev2` dari API routes). Isinya cuma orchestrator:
 * jalankan streaming sales records + target queries secara paralel,
 * lalu delegasikan agregasi ke generator-generator di file terpisah:
 *   - dateUtils.ts        → parsing tanggal & resolusi ISO week
 *   - streamSales.ts      → streaming query sales_records (pg-cursor)
 *   - targetQueries.ts    → query target_data (per area/produk/kuartal)
 *   - piutangQueries.ts   → query piutang_records
 *   - quarterlyData.ts    → generateQuarterlyData (target vs actual)
 *   - quarterlyYoY.ts     → generateQuarterlyYoYData (actual vs actual)
 *   - l4wc4w.ts           → generateL4WC4WData + generateProductL4WC1WData
 *   - aggregationUtils.ts → buildByWeekMap, getOmzetValue, getUnitValue
 *   - emptyData.ts        → fallback data kosong
 *   - types.ts            → tipe internal (FetchFilters, UnitAgg, dst)
 *
 */

import {
  SalesData, WeeklySales, WeekComparison,
  YearOnYearGrowth, ComparisonWeeks,
  WeekComparisonProductDetail, OutletSalesData,
} from '@/types/sales';

import { parseDateLocal, resolveWeekYear } from './dateUtils';
import { streamSalesRecords } from './streamSales';
import { resolveTargetAreas, fetchTargetQueriesParallel } from './targetQueries';
import { fetchPiutangData } from './piutangQueries';
import { generateQuarterlyData } from './quarterlyData';
import { generateQuarterlyYoYData } from './quarterlyYoY';
import { generateL4WC4WData } from './l4wc4w';
import { buildByWeekMap } from './aggregationUtils';
import {
  generateEmptyQuarterlyData,
  generateEmptyQuarterlyYoYData,
  generateEmptyL4WC4WData,
  generateEmptyYearOnYearGrowth,
  generateEmptyComparisonWeeks,
} from './emptyData';
import { getProductCategory } from '../productCategories';
import { FetchFilters, UnitAgg, OutletAgg, TargetQueriesResult } from './types';

export type { FetchFilters };

const OMZET_SCALE = 1;

export async function fetchSalesData(filters?: FetchFilters): Promise<SalesData> {
  try {
    console.log('fetchSalesData - Filter diterima:', JSON.stringify(filters));

    // Jalankan parallel: sales records + piutang
    const [salesResult, piutangList] = await Promise.all([
      processSalesRecords(filters),
      fetchPiutangData(filters),
    ]);

    console.log(`piutangList: ${piutangList.length} records`);

    return {
      ...salesResult,
      piutangList,
    };
  } catch (error) {
    console.error('Error fetching sales data:', error);
    return {
      weeklyData:       [],
      quarterlyData:    generateEmptyQuarterlyData(),
      QuarterlyYoYData: generateEmptyQuarterlyYoYData(),
      weekComparisons:  [],
      l4wc4wData:       generateEmptyL4WC4WData(),
      yearOnYearGrowth: generateEmptyYearOnYearGrowth(),
      comparisonYears:  { previousYear: null, currentYear: null },
      comparisonWeeks:  generateEmptyComparisonWeeks(),
      outletData:       [],
      piutangList:      [],
    };
  }
}

async function processSalesRecords(filters?: FetchFilters): Promise<SalesData> {
  const areaId       = filters?.area;
  const selectedUnit = filters?.selectedUnit || 'units_dos';

  const clampWeek = (w: number) => Math.max(1, Math.min(52, w));

  const year1 = filters?.year1;
  const year2 = filters?.year2;

  const preRangeYear1: { start: number; end: number } | null =
    (filters?.weekStart1 !== undefined || filters?.weekEnd1 !== undefined)
      ? { start: clampWeek(filters?.weekStart1 ?? 1), end: clampWeek(filters?.weekEnd1 ?? 52) }
      : null;

  const preRangeYear2: { start: number; end: number } | null =
    (filters?.weekStart2 !== undefined || filters?.weekEnd2 !== undefined)
      ? { start: clampWeek(filters?.weekStart2 ?? 1), end: clampWeek(filters?.weekEnd2 ?? 52) }
      : null;

  console.log(`\n [PRE-RANGE] year1=${year1} range=${preRangeYear1 ? `W${preRangeYear1.start}-W${preRangeYear1.end}` : 'all'}`);

  const weekProductMap     = new Map<string, UnitAgg>();
  const weekYearSet        = new Map<number, Set<number>>();
  const allProductsSet     = new Set<string>();
  const outletAggMap       = new Map<string, OutletAgg>();
  const yearUnitMap        = new Map<number, number>();
  const omzetByProductWeek = new Map<string, number>();

  let crossYearCount    = 0;
  let totalRecordCount  = 0;
  let filteredOutByWeek = 0;
  let boundaryDosTotal  = 0;

  const requestedISOYears = new Set<number>();
  if (filters?.year1 !== undefined) requestedISOYears.add(filters.year1);
  if (filters?.year2 !== undefined) requestedISOYears.add(filters.year2);

  const isWeekInRange = (isoYear: number, isoWeek: number): boolean => {
    if (isoYear === year1 && preRangeYear1 !== null) {
      return isoWeek >= preRangeYear1.start && isoWeek <= preRangeYear1.end;
    }
    if (isoYear === year2 && preRangeYear2 !== null) {
      return isoWeek >= preRangeYear2.start && isoWeek <= preRangeYear2.end;
    }
    return true;
  };

  const targetAreasPromise = resolveTargetAreas(filters?.area, filters?.allowedAreas);

  const effectiveYearForTargets = year2 ?? year1;

  const targetQueriesPromise: Promise<TargetQueriesResult | null> = effectiveYearForTargets !== undefined
    ? targetAreasPromise.then(targetAreas => {
        if (targetAreas.length === 0) {
          console.log(`[target] Tidak ada area untuk di-query target`);
          return null;
        }
        console.log(`[target] Fetching untuk ${targetAreas.length} area: [${targetAreas.join(', ')}]`);
        return fetchTargetQueriesParallel(targetAreas, effectiveYearForTargets);
      })
    : Promise.resolve(null);

  await Promise.all([
    streamSalesRecords(filters, (batch) => {
      for (const record of batch) {
        totalRecordCount++;

        const { month, day } = parseDateLocal(record.date);
        const rawDbWeek      = Number(record.week);
        const resolved       = resolveWeekYear(record);
        const isoYear        = resolved.year;
        const isoWeek        = resolved.week;
        const rawDateYear    = parseDateLocal(record.date).year;

        if (isoYear !== rawDateYear || isoWeek !== rawDbWeek) crossYearCount++;

        if (requestedISOYears.size > 0 && !requestedISOYears.has(isoYear)) {
          if ((month === 11 && day >= 28) || (month === 0 && day <= 3)) {
            console.log(`[BOUNDARY-SKIP] isoYear=${isoYear} tidak ada di requestedISOYears=${[...requestedISOYears]}`);
          }
          continue;
        }

        if (!isWeekInRange(isoYear, isoWeek)) {
          filteredOutByWeek++;
          continue;
        }

        if (!weekYearSet.has(isoYear)) weekYearSet.set(isoYear, new Set());
        weekYearSet.get(isoYear)!.add(isoWeek);

        const product = record.product || 'Produk Tidak Diketahui';
        allProductsSet.add(product);

        const bks  = Number(record.units_bks)  || 0;
        const slop = Number(record.units_slop) || 0;
        const bal  = Number(record.units_bal)  || 0;
        const dos  = Number(record.units_dos)  || 0;
        const omz  = (() => {
          const raw     = record.omzet;
          const numeric = typeof raw === 'number' ? raw : parseFloat(raw ?? '0');
          return Number.isFinite(numeric) ? numeric * OMZET_SCALE : 0;
        })();

        if ((month === 11 && day >= 28) || (month === 0 && day <= 3)) {
          boundaryDosTotal += dos;
        }

        const wpKey    = `${isoYear}-${isoWeek}-${product}`;
        const existing = weekProductMap.get(wpKey);
        if (existing) {
          existing.bks  += bks;
          existing.slop += slop;
          existing.bal  += bal;
          existing.dos  += dos;
        } else {
          weekProductMap.set(wpKey, { bks, slop, bal, dos });
        }

        omzetByProductWeek.set(wpKey, (omzetByProductWeek.get(wpKey) || 0) + omz);

        const unitVal = selectedUnit === 'omzet'      ? omz
                      : selectedUnit === 'units_bks'  ? bks
                      : selectedUnit === 'units_slop' ? slop
                      : selectedUnit === 'units_bal'  ? bal
                      : dos;
        yearUnitMap.set(isoYear, (yearUnitMap.get(isoYear) || 0) + unitVal);

        const outletType  = record.customer_type || 'Tipe Customer tidak diketahui';
        const category    = getProductCategory(product);
        const customer    = record.customer    || 'Unknown';
        const customer_no = record.customer_no || '';
        let city     = (record.city     || '').trim() || 'Tidak diketahui';
        let district = (record.district || '').trim() || 'Tidak diketahui';
        const area   = (record.area     || '').trim();

        if ((city === 'Unknown' || district === 'Unknown') && area.length > 0) {
          if (area.includes(',')) {
            const parts = area.split(',').map((p: string) => p.trim());
            if (district === 'Unknown' && parts[0]) district = parts[0];
            if (city     === 'Unknown' && parts[1]) city     = parts[1];
          } else if (city === 'Unknown') {
            city = area;
          }
        }

        const village  = record.village  || 'Unknown';
        const salesman = record.salesman || 'Unknown';

        const customerKey = customer_no ? `${customer_no}||${customer}` : `||${customer}`;
        const outletKey   = `${isoYear}|${outletType}|${category}|${product}|${customerKey}`;

        const existingOutlet = outletAggMap.get(outletKey);
        if (existingOutlet) {
          existingOutlet.dozNet    += dos;
          existingOutlet.unitsBks  += bks;
          existingOutlet.unitsSlop += slop;
          existingOutlet.unitsBal  += bal;
          existingOutlet.omzet     += omz;
          existingOutlet.weeklyDozNet[isoWeek]    = (existingOutlet.weeklyDozNet[isoWeek]    ?? 0) + dos;
          existingOutlet.weeklyUnitsBks[isoWeek]  = (existingOutlet.weeklyUnitsBks[isoWeek]  ?? 0) + bks;   // NEW
          existingOutlet.weeklyUnitsSlop[isoWeek] = (existingOutlet.weeklyUnitsSlop[isoWeek] ?? 0) + slop;  // NEW
          existingOutlet.weeklyUnitsBal[isoWeek]  = (existingOutlet.weeklyUnitsBal[isoWeek]  ?? 0) + bal;   // NEW
          existingOutlet.weeklyOmzet[isoWeek]     = (existingOutlet.weeklyOmzet[isoWeek]     ?? 0) + omz;   // NEW
          if (isoWeek < existingOutlet.weekMin) existingOutlet.weekMin = isoWeek;
          if (isoWeek > existingOutlet.weekMax) existingOutlet.weekMax = isoWeek;
        } else {
          outletAggMap.set(outletKey, {
            dozNet: dos, unitsBks: bks, unitsSlop: slop, unitsBal: bal, omzet: omz,
            weeklyDozNet:    { [isoWeek]: dos },
            weeklyUnitsBks:  { [isoWeek]: bks },    // NEW
            weeklyUnitsSlop: { [isoWeek]: slop },   // NEW
            weeklyUnitsBal:  { [isoWeek]: bal },    // NEW
            weeklyOmzet:     { [isoWeek]: omz },    // NEW
            city, district, village, salesman, customer_no,
            year: isoYear, outletType, category, product, customer,
            weekMin: isoWeek, weekMax: isoWeek,
          });
        }
      }
    }),
    targetQueriesPromise,
  ]);

  console.log(`\n [STEP-1] Streaming selesai: ${totalRecordCount} total records`);
  console.log(`   ISO cross-year remap: ${crossYearCount} records`);
  console.log(`   Filtered out by week range: ${filteredOutByWeek} records`);
  console.log(`   Records masuk agregasi: ${totalRecordCount - filteredOutByWeek} records`);
  console.log(`   outletAggMap size: ${outletAggMap.size}`);
  console.log(`   weekProductMap size: ${weekProductMap.size}`);
  console.log(`   allProductsSet size: ${allProductsSet.size}`);
  console.log(`   Fetched ${totalRecordCount} records dari DB`);

  if (totalRecordCount === 0) {
    return {
      weeklyData:       [],
      quarterlyData:    generateEmptyQuarterlyData(),
      QuarterlyYoYData: generateEmptyQuarterlyYoYData(),
      weekComparisons:  [],
      l4wc4wData:       generateEmptyL4WC4WData(),
      yearOnYearGrowth: generateEmptyYearOnYearGrowth(),
      comparisonYears:  { previousYear: null, currentYear: null },
      comparisonWeeks:  generateEmptyComparisonWeeks(),
      outletData:       [],
    };
  }

  const sortedYears: number[] = [];
  weekYearSet.forEach((_, year) => sortedYears.push(year));
  sortedYears.sort((a, b) => a - b);

  const currentYear  = filters?.year2  ?? sortedYears[sortedYears.length - 1];
  const previousYear = filters?.year1  ?? (sortedYears.length > 1 ? sortedYears[sortedYears.length - 2] : currentYear);
  const comparisonYears = {
    previousYear: previousYear ?? null,
    currentYear:  currentYear  ?? null,
  };

  const getWeekRangeFromData = (year: number): { start: number; end: number } | null => {
    const weeks = weekYearSet.get(year);
    if (!weeks || weeks.size === 0) return null;
    let minWeek = Infinity;
    let maxWeek = -Infinity;
    weeks.forEach(w => {
      if (w < minWeek) minWeek = w;
      if (w > maxWeek) maxWeek = w;
    });
    if (!isFinite(minWeek)) return null;
    return { start: minWeek, end: maxWeek };
  };

  const dataRangeYear1 = previousYear !== undefined ? getWeekRangeFromData(previousYear) : null;
  const dataRangeYear2 = currentYear  !== undefined ? getWeekRangeFromData(currentYear)  : null;

  const previousYearWeekRange: { start: number; end: number } | null =
    previousYear !== undefined
      ? (preRangeYear1 ?? dataRangeYear1 ?? { start: 1, end: 52 })
      : null;

  const currentYearWeekRange: { start: number; end: number } | null =
    currentYear !== undefined
      ? (preRangeYear2 ?? dataRangeYear2 ?? { start: 1, end: 52 })
      : null;

  console.log(`\n [STEP-2] Week ranges:`);
  console.log(`   Data range year1=${previousYear}: [${dataRangeYear1?.start ?? '-'} - ${dataRangeYear1?.end ?? '-'}]`);
  console.log(`   Data range year2=${currentYear}:  [${dataRangeYear2?.start ?? '-'} - ${dataRangeYear2?.end ?? '-'}]`);
  console.log(`   Final range year1: [${previousYearWeekRange?.start ?? '-'} - ${previousYearWeekRange?.end ?? '-'}] ${preRangeYear1 ? '(dari filter)' : '(dari data)'}`);
  console.log(`   Final range year2: [${currentYearWeekRange?.start ?? '-'} - ${currentYearWeekRange?.end ?? '-'}] ${preRangeYear2 ? '(dari filter)' : '(dari data)'}`);

  const comparisonWeeks: ComparisonWeeks = {
    previousYear: previousYearWeekRange,
    currentYear:  currentYearWeekRange,
  };

  const getAgg = (year: number, week: number, product: string): UnitAgg =>
    weekProductMap.get(`${year}-${week}-${product}`) ?? { bks: 0, slop: 0, bal: 0, dos: 0 };

  const getUnitFromAgg = (agg: UnitAgg, wpKey?: string): number => {
    if (selectedUnit === 'omzet' && wpKey) return omzetByProductWeek.get(wpKey) ?? 0;
    if (selectedUnit === 'units_bks')  return agg.bks;
    if (selectedUnit === 'units_slop') return agg.slop;
    if (selectedUnit === 'units_bal')  return agg.bal;
    return agg.dos;
  };

  const weeklyData: WeeklySales[]         = [];
  const weekComparisons: WeekComparison[] = [];

  const allWeeks = new Set<number>();
  if (previousYear !== undefined) weekYearSet.get(previousYear)?.forEach(w => allWeeks.add(w));
  if (currentYear  !== undefined) weekYearSet.get(currentYear)?.forEach(w  => allWeeks.add(w));

  const sortedWeeks: number[] = [];
  allWeeks.forEach(w => sortedWeeks.push(w));
  sortedWeeks.sort((a, b) => a - b);

  type ProductTotals = {
    previous: number; current: number;
    units_bks:  { previous: number; current: number };
    units_slop: { previous: number; current: number };
    units_bal:  { previous: number; current: number };
    units_dos:  { previous: number; current: number };
    omzet:      { previous: number; current: number };
  };

  const productTotalsMap = new Map<string, ProductTotals>();
  allProductsSet.forEach(product => {
    productTotalsMap.set(product, {
      previous: 0, current: 0,
      units_bks:  { previous: 0, current: 0 },
      units_slop: { previous: 0, current: 0 },
      units_bal:  { previous: 0, current: 0 },
      units_dos:  { previous: 0, current: 0 },
      omzet:      { previous: 0, current: 0 },
    });
  });

  for (const week of sortedWeeks) {
    productTotalsMap.forEach(t => {
      t.previous = 0; t.current = 0;
      t.units_bks.previous  = 0; t.units_bks.current  = 0;
      t.units_slop.previous = 0; t.units_slop.current = 0;
      t.units_bal.previous  = 0; t.units_bal.current  = 0;
      t.units_dos.previous  = 0; t.units_dos.current  = 0;
      t.omzet.previous      = 0; t.omzet.current      = 0;
    });

    let prevYearSales = 0;
    let currYearSales = 0;

    if (previousYear !== undefined && weekYearSet.get(previousYear)?.has(week)) {
      for (const product of allProductsSet) {
        const agg    = getAgg(previousYear, week, product);
        const totals = productTotalsMap.get(product)!;
        const wpKey  = `${previousYear}-${week}-${product}`;
        const uval   = getUnitFromAgg(agg, wpKey);
        totals.previous              += uval;
        totals.units_bks.previous    += agg.bks;
        totals.units_slop.previous   += agg.slop;
        totals.units_bal.previous    += agg.bal;
        totals.units_dos.previous    += agg.dos;
        totals.omzet.previous        += omzetByProductWeek.get(wpKey) ?? 0;
        prevYearSales                += uval;
      }
    }

    if (currentYear !== undefined && weekYearSet.get(currentYear)?.has(week)) {
      for (const product of allProductsSet) {
        const agg    = getAgg(currentYear, week, product);
        const totals = productTotalsMap.get(product)!;
        const wpKey  = `${currentYear}-${week}-${product}`;
        const uval   = getUnitFromAgg(agg, wpKey);
        totals.current             += uval;
        totals.units_bks.current   += agg.bks;
        totals.units_slop.current  += agg.slop;
        totals.units_bal.current   += agg.bal;
        totals.units_dos.current   += agg.dos;
        totals.omzet.current       += omzetByProductWeek.get(wpKey) ?? 0;
        currYearSales              += uval;
      }
    }

    const details: WeekComparisonProductDetail[] = [];
    productTotalsMap.forEach((totals, product) => {
      const variance           = totals.current - totals.previous;
      const variancePercentage = totals.previous > 0 ? (variance / totals.previous) * 100 : 0;
      details.push({
        product,
        previousYear: totals.previous,
        currentYear:  totals.current,
        variance,
        variancePercentage,
        units_bks:  { previous: totals.units_bks.previous,  current: totals.units_bks.current  },
        units_slop: { previous: totals.units_slop.previous, current: totals.units_slop.current },
        units_bal:  { previous: totals.units_bal.previous,  current: totals.units_bal.current  },
        units_dos:  { previous: totals.units_dos.previous,  current: totals.units_dos.current  },
        omzet:      { previous: totals.omzet.previous,      current: totals.omzet.current      },
      });
    });
    details.sort((a, b) => b.currentYear - a.currentYear);

    if (prevYearSales > 0 || currYearSales > 0) {
      weekComparisons.push({
        week,
        previousYear:       prevYearSales,
        currentYear:        currYearSales,
        variance:           currYearSales - prevYearSales,
        variancePercentage: prevYearSales > 0 ? ((currYearSales - prevYearSales) / prevYearSales) * 100 : 0,
        details,
      });
    }

    // Omzet murni minggu ini (independen dari selectedUnit), untuk card "Omzet 1 Bulan" di Piutang
    const weekOmzetCurrent = currentYear !== undefined
      ? Array.from(allProductsSet).reduce(
          (s, p) => s + (omzetByProductWeek.get(`${currentYear}-${week}-${p}`) ?? 0), 0,
        )
      : 0;
    const weekOmzetPrevious = previousYear !== undefined
      ? Array.from(allProductsSet).reduce(
          (s, p) => s + (omzetByProductWeek.get(`${previousYear}-${week}-${p}`) ?? 0), 0,
        )
      : 0;

    if (currYearSales > 0 && currentYear !== undefined)
      weeklyData.push({ week, year: currentYear,  sales: currYearSales, target: currYearSales * 1.1, omzetTotal: weekOmzetCurrent });
    if (prevYearSales > 0 && previousYear !== undefined)
      weeklyData.push({ week, year: previousYear, sales: prevYearSales, target: prevYearSales * 1.1, omzetTotal: weekOmzetPrevious });
  }

  console.log(`\n [STEP-4] outletAggMap size=${outletAggMap.size}`);

  const outletData: OutletSalesData[] = [];
  outletAggMap.forEach(agg => {
    outletData.push({
      week:         agg.weekMin,
      year:         agg.year,
      outletType:   agg.outletType,
      category:     agg.category,
      product:      agg.product,
      dozNet:       agg.dozNet,
      unitsBks:     agg.unitsBks,
      unitsSlop:    agg.unitsSlop,
      unitsBal:     agg.unitsBal,
      omzet:        agg.omzet,
      weeklyDozNet: agg.weeklyDozNet,
      weeklyUnitsBks:  agg.weeklyUnitsBks,   // NEW
      weeklyUnitsSlop: agg.weeklyUnitsSlop,  // NEW
      weeklyUnitsBal:  agg.weeklyUnitsBal,   // NEW
      weeklyOmzet:     agg.weeklyOmzet,      // NEW
      city:         agg.city,
      district:     agg.district,
      village:      agg.village,
      customer:     agg.customer,
      customer_no:  agg.customer_no,
      salesman:     agg.salesman,
    });
  });
  outletData.sort((a, b) => b.dozNet - a.dozNet);

  console.log(`   outletData entries dikirim ke client: ${outletData.length}`);

  const effectiveYear     = currentYear  ?? sortedYears[sortedYears.length - 1];
  const effectivePrevYear = previousYear ?? (currentYear ?? sortedYears[0]);

  const toFixed2 = (n: number) => Math.round(n * 100) / 100;

  const yearOnYearGrowth: YearOnYearGrowth = (() => {
    const prevTotal = yearUnitMap.get(effectivePrevYear) || 0;
    const currTotal = yearUnitMap.get(effectiveYear)     || 0;
    const variance  = currTotal - prevTotal;
    return {
      previousYearTotal:  toFixed2(prevTotal),
      currentYearTotal:   toFixed2(currTotal),
      variance:           toFixed2(variance),
      variancePercentage: prevTotal > 0 ? Math.round((variance / prevTotal) * 100 * 10) / 10 : 0,
    };
  })();

  const targetResults = await targetQueriesPromise;
  const resolvedTargetAreas = await targetAreasPromise;

  const byWeekMap = buildByWeekMap(weekProductMap);

  const quarterlyData = await generateQuarterlyData(
    byWeekMap,
    omzetByProductWeek,
    effectiveYear,
    areaId,
    filters?.selectedUnit,
    targetResults,
    resolvedTargetAreas,
  );

  const QuarterlyYoYData = await generateQuarterlyYoYData(
    byWeekMap,
    omzetByProductWeek,
    effectiveYear,
    effectivePrevYear,
    areaId,
  );

  const l4wc4wData = generateL4WC4WData(
    byWeekMap,
    omzetByProductWeek,
    currentYear,
    filters,
  );

  return {
    weeklyData,
    quarterlyData,
    QuarterlyYoYData,
    weekComparisons,
    l4wc4wData,
    yearOnYearGrowth,
    comparisonYears,
    comparisonWeeks,
    outletData,
  };
}