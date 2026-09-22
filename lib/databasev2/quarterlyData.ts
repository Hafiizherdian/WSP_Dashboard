/**
 *
 * PERUBAHAN v11 (fix omzet di QuarterlyProductDetail):
 *   - generateQuarterlyProductDetails: hitung productOmzetActual SELALU
 *     (bukan cuma saat unitType==='omzet') dan push sebagai field
 *     omzet: { target: 0, actual: productOmzetActual } di setiap detail
 *     produk
 *   - weeklyActuals per minggu per produk kini menyertakan field omzet
 *     QuarterlyAnalysis.tsx bisa baca omzet terfilter-kategori per minggu
 */

import {
  QuarterlyData, WeeklyBreakdown, MonthlyBreakdown, QuarterlyProductDetail,
} from '@/types/sales';
import { getProductCategory } from '../productCategories';
import { UnitAgg, ProductQuarterTargetRow, TargetQueriesResult } from './types';
import { fetchTargetQueriesSerial } from './targetQueries';

// ─── generateQuarterlyData ────────────────────────────────────────────────────
export async function generateQuarterlyData(
  byWeekMap:          Map<number, Map<number, Map<string, UnitAgg>>>,
  omzetByProductWeek: Map<string, number>,
  year:               number,
  areaId?:            string,
  selectedUnit?:      string,
  preFetchedTargets?: TargetQueriesResult | null,
  targetAreas?:       string[],
): Promise<QuarterlyData[]> {
  const quarters      = ['Q1', 'Q2', 'Q3', 'Q4'] as const;
  const quarterlyData: QuarterlyData[] = [];
  const unitType      = selectedUnit || 'units_dos';

  const pickUnit = (agg: UnitAgg, wpKey?: string): number => {
    if (unitType === 'omzet' && wpKey) return omzetByProductWeek.get(wpKey) ?? 0;
    if (unitType === 'units_bks')  return agg.bks;
    if (unitType === 'units_slop') return agg.slop;
    if (unitType === 'units_bal')  return agg.bal;
    return agg.dos;
  };

  const yearWeekMap = byWeekMap.get(year) ?? new Map<number, Map<string, UnitAgg>>();

  const allProductsThisYear = new Set<string>();
  yearWeekMap.forEach(prodMap => prodMap.forEach((_, p) => allProductsThisYear.add(p)));

  interface WeekTargetRow {
    week:       number;
    quarter:    number;
    units_dos:  number;
    units_bks:  number;
    units_slop: number;
    units_bal:  number;
    has_target: boolean;
  }

  const weekTargetMap        = new Map<number, WeekTargetRow>();
  const productWeekTargetMap = new Map<string, Map<number, {
    units_dos: number; units_bks: number; units_slop: number; units_bal: number;
  }>>();
  let productQuarterTargets  = new Map<string, Map<number, ProductQuarterTargetRow>>();

  const effectiveTargetAreas: string[] =
    targetAreas && targetAreas.length > 0
      ? targetAreas
      : areaId ? [areaId] : [];

  if (effectiveTargetAreas.length > 0) {
    let weekQuarterRows, productQuarterRows, productWeekRows;

    if (preFetchedTargets) {
      [weekQuarterRows, productQuarterRows, productWeekRows] = preFetchedTargets;
      console.log(`\n [B4] Menggunakan pre-fetched target data (${effectiveTargetAreas.length} area)`);
    } else {
      console.warn(`[B4] preFetchedTargets null — fallback ke serial queries`);
      [weekQuarterRows, productQuarterRows, productWeekRows] =
        await fetchTargetQueriesSerial(effectiveTargetAreas, year);
    }

    weekQuarterRows.forEach(r => {
      const dos = parseFloat(r.units_dos) || 0;
      weekTargetMap.set(Number(r.week), {
        week:       Number(r.week),
        quarter:    Number(r.quarter),
        units_dos:  dos,
        units_bks:  parseFloat(r.units_bks)  || 0,
        units_slop: parseFloat(r.units_slop) || 0,
        units_bal:  parseFloat(r.units_bal)  || 0,
        has_target: dos > 0,
      });
    });
    console.log(`Week targets built: ${weekTargetMap.size} minggu`);

    productQuarterRows.forEach(r => {
      const qNum = Number(r.quarter);
      if (!productQuarterTargets.has(r.product)) productQuarterTargets.set(r.product, new Map());
      productQuarterTargets.get(r.product)!.set(qNum, {
        product:    r.product,
        quarter:    qNum,
        units_dos:  parseFloat(r.units_dos)  || 0,
        units_bks:  parseFloat(r.units_bks)  || 0,
        units_slop: parseFloat(r.units_slop) || 0,
        units_bal:  parseFloat(r.units_bal)  || 0,
      });
    });
    console.log(`Product×quarter targets built: ${productQuarterTargets.size} produk`);

    productWeekRows.forEach(r => {
      const wNum = Number(r.week);
      if (!productWeekTargetMap.has(r.product)) productWeekTargetMap.set(r.product, new Map());
      productWeekTargetMap.get(r.product)!.set(wNum, {
        units_dos:  parseFloat(r.units_dos)  || 0,
        units_bks:  parseFloat(r.units_bks)  || 0,
        units_slop: parseFloat(r.units_slop) || 0,
        units_bal:  parseFloat(r.units_bal)  || 0,
      });
    });
    console.log(`Product×week targets built: ${productWeekTargetMap.size} produk`);
  }

  type QuarterAccum = { dos: number; bks: number; slop: number; bal: number; weekCount: number };
  const quarterTargetMap: Record<string, QuarterAccum> = {
    Q1: { dos:0, bks:0, slop:0, bal:0, weekCount:0 },
    Q2: { dos:0, bks:0, slop:0, bal:0, weekCount:0 },
    Q3: { dos:0, bks:0, slop:0, bal:0, weekCount:0 },
    Q4: { dos:0, bks:0, slop:0, bal:0, weekCount:0 },
  };

  weekTargetMap.forEach(r => {
    if (!r.has_target) return;
    const qKey = `Q${r.quarter}` as keyof typeof quarterTargetMap;
    if (quarterTargetMap[qKey]) {
      quarterTargetMap[qKey].dos  += r.units_dos;
      quarterTargetMap[qKey].bks  += r.units_bks;
      quarterTargetMap[qKey].slop += r.units_slop;
      quarterTargetMap[qKey].bal  += r.units_bal;
      quarterTargetMap[qKey].weekCount++;
    }
  });

  const getMonthFromWeek = (week: number): string => {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const jan4    = new Date(year, 0, 4);
    const jan4Day = jan4.getDay() || 7;
    const startOfWeek1 = new Date(jan4);
    startOfWeek1.setDate(jan4.getDate() - (jan4Day - 1));
    const targetDate = new Date(startOfWeek1);
    targetDate.setDate(startOfWeek1.getDate() + (week - 1) * 7);
    return months[targetDate.getMonth()];
  };

  // ─── FIX v11: generateQuarterlyProductDetails ────────────────────────────
  // Sebelumnya `omzet` per produk hanya dihitung saat unitType==='omzet' dan
  // TIDAK pernah disertakan di field `omzet` pada setiap QuarterlyProductDetail.
  // Akibatnya getDetailActual(d,'omzet') di QuarterlyAnalysis.tsx selalu balikin 0
  // karena d.omzet selalu undefined — meski backend punya datanya di weekProductMap.
  //
  // Fix: hitung productOmzetActual SELALU (independen dari unitType), dan push
  // sebagai omzet: { target: 0, actual: productOmzetActual } di setiap detail.
  // Juga tambahkan omzet ke weeklyActuals per minggu agar filter kategori + omzet
  // bisa menggunakan nilai terfilter (bukan wb.actual yang tidak terfilter).
  const generateQuarterlyProductDetails = (
    quarterIndex: number,
    quarterWeeks: number[],
  ): QuarterlyProductDetail[] => {
    const qNum = quarterIndex + 1;

    const productActualMap = new Map<string, {
      units_dos: number; units_bks: number; units_slop: number; units_bal: number;
    }>();

    const productWeeklyMap = new Map<string, Map<number, {
      units_dos: number; units_bks: number; units_slop: number; units_bal: number;
    }>>();

    for (const week of quarterWeeks) {
      const prodMap = yearWeekMap.get(week);
      if (!prodMap) continue;

      prodMap.forEach((agg, product) => {
        if (!productActualMap.has(product)) {
          productActualMap.set(product, { units_dos:0, units_bks:0, units_slop:0, units_bal:0 });
        }
        const d = productActualMap.get(product)!;
        d.units_dos  += agg.dos;
        d.units_bks  += agg.bks;
        d.units_slop += agg.slop;
        d.units_bal  += agg.bal;

        if (!productWeeklyMap.has(product)) productWeeklyMap.set(product, new Map());
        const wm = productWeeklyMap.get(product)!;
        const wd = wm.get(week) ?? { units_dos:0, units_bks:0, units_slop:0, units_bal:0 };
        wd.units_dos  += agg.dos;
        wd.units_bks  += agg.bks;
        wd.units_slop += agg.slop;
        wd.units_bal  += agg.bal;
        wm.set(week, wd);
      });
    }

    if (productActualMap.size === 0) {
      allProductsThisYear.forEach(p => {
        if (!productActualMap.has(p)) {
          productActualMap.set(p, { units_dos:0, units_bks:0, units_slop:0, units_bal:0 });
        }
      });
    }

    const result: QuarterlyProductDetail[] = [];
    productActualMap.forEach((actual, product) => {
      const dbTarget   = productQuarterTargets.get(product)?.get(qNum);
      const dosTarget  = dbTarget?.units_dos  ?? 0;
      const bksTarget  = dbTarget?.units_bks  ?? 0;
      const slopTarget = dbTarget?.units_slop ?? 0;
      const balTarget  = dbTarget?.units_bal  ?? 0;

      // ── FIX v11: hitung omzet per produk per kuartal SELALU,
      //    bukan hanya saat unitType === 'omzet'. Ini yang sebelumnya
      //    hilang sehingga d.omzet selalu undefined di frontend.
      const productOmzetActual = quarterWeeks.reduce((sum, week) => {
        return sum + (omzetByProductWeek.get(`${year}-${week}-${product}`) ?? 0);
      }, 0);

      const selectedActual = unitType === 'omzet'
        ? productOmzetActual
        : unitType === 'units_bks'  ? actual.units_bks
        : unitType === 'units_slop' ? actual.units_slop
        : unitType === 'units_bal'  ? actual.units_bal
        : actual.units_dos;

      const selectedTarget = unitType === 'omzet'      ? 0
                           : unitType === 'units_bks'  ? bksTarget
                           : unitType === 'units_slop' ? slopTarget
                           : unitType === 'units_bal'  ? balTarget
                           : dosTarget;

      const variance           = selectedActual - selectedTarget;
      const variancePercentage = selectedTarget > 0 ? (variance / selectedTarget) * 100 : 0;

      // ── FIX v11: sertakan omzet per minggu di weeklyActuals ──────────
      const weeklyActuals: Record<number, {
        units_dos: number; units_bks: number; units_slop: number; units_bal: number; omzet: number;
      }> = {};
      productWeeklyMap.get(product)?.forEach((vals, week) => {
        weeklyActuals[week] = {
          units_dos:  parseFloat(vals.units_dos.toFixed(2)),
          units_bks:  parseFloat(vals.units_bks.toFixed(2)),
          units_slop: parseFloat(vals.units_slop.toFixed(2)),
          units_bal:  parseFloat(vals.units_bal.toFixed(2)),
          omzet:      parseFloat(
            (omzetByProductWeek.get(`${year}-${week}-${product}`) ?? 0).toFixed(2)
          ),
        };
      });

      result.push({
        product,
        productCategory:    getProductCategory(product),
        target:             parseFloat(selectedTarget.toFixed(2)),
        actual:             parseFloat(selectedActual.toFixed(2)),
        variance:           parseFloat(variance.toFixed(2)),
        variancePercentage: parseFloat(variancePercentage.toFixed(1)),
        units_bks:  { target: parseFloat(bksTarget.toFixed(2)),  actual: parseFloat(actual.units_bks.toFixed(2))  },
        units_slop: { target: parseFloat(slopTarget.toFixed(2)), actual: parseFloat(actual.units_slop.toFixed(2)) },
        units_bal:  { target: parseFloat(balTarget.toFixed(2)),  actual: parseFloat(actual.units_bal.toFixed(2))  },
        units_dos:  { target: parseFloat(dosTarget.toFixed(2)),  actual: parseFloat(actual.units_dos.toFixed(2))  },
        // ── FIX v11: field omzet sekarang selalu ada di setiap detail produk ──
        omzet:      { target: 0, actual: parseFloat(productOmzetActual.toFixed(2)) },
        weeklyActuals,
      } as any);
    });

    return result;
  };

  console.log(`\n[generateQuarterlyData] year=${year}, total weekMap entries=${yearWeekMap.size}`);
  [1,2,3,4].forEach(q => {
    const s = (q-1)*13+1, e = Math.min(q*13, 52);
    let cnt = 0;
    for (let w = s; w <= e; w++) { if (yearWeekMap.has(w)) cnt++; }
    console.log(`   Q${q} (W${s}-W${e}): ${cnt} minggu dengan data`);
  });

  for (let qIndex = 0; qIndex < quarters.length; qIndex++) {
    const quarter   = quarters[qIndex];
    const startWeek = qIndex * 13 + 1;
    const endWeek   = Math.min((qIndex + 1) * 13, 52);
    const qKey      = quarter;

    const quarterWeeks: number[] = [];
    for (let w = startWeek; w <= endWeek; w++) {
      if (yearWeekMap.has(w)) quarterWeeks.push(w);
    }

    let quarterActual_dos  = 0;
    let quarterActual_bks  = 0;
    let quarterActual_slop = 0;
    let quarterActual_bal  = 0;

    for (const week of quarterWeeks) {
      const prodMap = yearWeekMap.get(week)!;
      prodMap.forEach(agg => {
        quarterActual_dos  += agg.dos;
        quarterActual_bks  += agg.bks;
        quarterActual_slop += agg.slop;
        quarterActual_bal  += agg.bal;
      });
    }

    const qt     = quarterTargetMap[qKey];
    const target = qt && qt.weekCount > 0 ? qt.dos : 0;

    const quarterTargetForUnit = unitType === 'omzet'       ? 0
                               : unitType === 'units_bks'  ? (qt?.bks  ?? 0)
                               : unitType === 'units_slop' ? (qt?.slop ?? 0)
                               : unitType === 'units_bal'  ? (qt?.bal  ?? 0)
                               : target;

    const quarterActual = unitType === 'omzet'
      ? (() => {
          let total = 0;
          for (const week of quarterWeeks) {
            const prodMap = yearWeekMap.get(week);
            if (!prodMap) continue;
            prodMap.forEach((_, product) => {
              total += omzetByProductWeek.get(`${year}-${week}-${product}`) ?? 0;
            });
          }
          return total;
        })()
      : unitType === 'units_bks'  ? quarterActual_bks
      : unitType === 'units_slop' ? quarterActual_slop
      : unitType === 'units_bal'  ? quarterActual_bal
      : quarterActual_dos;

    const details = generateQuarterlyProductDetails(qIndex, quarterWeeks);

    const weeklyBreakdown: WeeklyBreakdown[] = [];
    for (let week = startWeek; week <= endWeek; week++) {
      const prodMap = yearWeekMap.get(week);

      let weekActual_bks  = 0;
      let weekActual_slop = 0;
      let weekActual_bal  = 0;
      let weekActual_dos  = 0;

      if (prodMap) {
        prodMap.forEach(agg => {
          weekActual_bks  += agg.bks;
          weekActual_slop += agg.slop;
          weekActual_bal  += agg.bal;
          weekActual_dos  += agg.dos;
        });
      }

      const weekTargetRow = weekTargetMap.get(week);
      const hasTarget     = weekTargetRow?.has_target ?? false;

      const weekTarget_bks  = weekTargetRow?.units_bks  ?? 0;
      const weekTarget_slop = weekTargetRow?.units_slop ?? 0;
      const weekTarget_bal  = weekTargetRow?.units_bal  ?? 0;
      const weekTarget_dos  = weekTargetRow?.units_dos  ?? 0;

      const weekActual = unitType === 'omzet'
        ? (() => {
            const pm = yearWeekMap.get(week);
            if (!pm) return 0;
            let total = 0;
            pm.forEach((_, product) => {
              total += omzetByProductWeek.get(`${year}-${week}-${product}`) ?? 0;
            });
            return total;
          })()
        : unitType === 'units_bks'  ? weekActual_bks
        : unitType === 'units_slop' ? weekActual_slop
        : unitType === 'units_bal'  ? weekActual_bal
        : weekActual_dos;

      const weekTarget = unitType === 'omzet'       ? 0
                       : unitType === 'units_bks'  ? weekTarget_bks
                       : unitType === 'units_slop' ? weekTarget_slop
                       : unitType === 'units_bal'  ? weekTarget_bal
                       : weekTarget_dos;

      const weekVariance    = weekActual - weekTarget;
      const weekVariancePct = hasTarget && weekTarget > 0 ? (weekVariance / weekTarget) * 100 : 0;
      const weekAchievement = hasTarget && weekTarget > 0
        ? (weekActual / weekTarget) * 100
        : weekActual > 0 ? -1 : 0;

      weeklyBreakdown.push({
        week,
        target:             parseFloat(weekTarget.toFixed(2)),
        actual:             parseFloat(weekActual.toFixed(2)),
        variance:           parseFloat(weekVariance.toFixed(2)),
        variancePercentage: parseFloat(weekVariancePct.toFixed(1)),
        achievement:        parseFloat(weekAchievement.toFixed(1)),
        units_bks:  { target: parseFloat(weekTarget_bks.toFixed(2)),  actual: parseFloat(weekActual_bks.toFixed(2))  },
        units_slop: { target: parseFloat(weekTarget_slop.toFixed(2)), actual: parseFloat(weekActual_slop.toFixed(2)) },
        units_bal:  { target: parseFloat(weekTarget_bal.toFixed(2)),  actual: parseFloat(weekActual_bal.toFixed(2))  },
        units_dos:  { target: parseFloat(weekTarget_dos.toFixed(2)),  actual: parseFloat(weekActual_dos.toFixed(2))  },
        hasTarget,
      } as WeeklyBreakdown & { hasTarget: boolean });
    }

    const monthsInQuarter =
      qIndex === 0 ? ['Jan', 'Feb', 'Mar'] :
      qIndex === 1 ? ['Apr', 'May', 'Jun'] :
      qIndex === 2 ? ['Jul', 'Aug', 'Sep'] :
                     ['Oct', 'Nov', 'Dec'];

    const wbByMonth = new Map<string, (WeeklyBreakdown & { hasTarget: boolean })[]>();
    monthsInQuarter.forEach(m => wbByMonth.set(m, []));
    for (const wb of weeklyBreakdown) {
      const m = getMonthFromWeek(wb.week);
      wbByMonth.get(m)?.push(wb as WeeklyBreakdown & { hasTarget: boolean });
    }

    const monthlyBreakdown: MonthlyBreakdown[] = monthsInQuarter.map(month => {
      const monthWeeks = wbByMonth.get(month) ?? [];

      const monthActual_bks  = monthWeeks.reduce((s, wb) => s + (wb.units_bks?.actual  ?? 0), 0);
      const monthActual_slop = monthWeeks.reduce((s, wb) => s + (wb.units_slop?.actual ?? 0), 0);
      const monthActual_bal  = monthWeeks.reduce((s, wb) => s + (wb.units_bal?.actual  ?? 0), 0);
      const monthActual_dos  = monthWeeks.reduce((s, wb) => s + (wb.units_dos?.actual  ?? 0), 0);

      const monthTarget_bks  = monthWeeks.reduce((s, wb) => s + (wb.units_bks?.target  ?? 0), 0);
      const monthTarget_slop = monthWeeks.reduce((s, wb) => s + (wb.units_slop?.target ?? 0), 0);
      const monthTarget_bal  = monthWeeks.reduce((s, wb) => s + (wb.units_bal?.target  ?? 0), 0);
      const monthTarget_dos  = monthWeeks.reduce((s, wb) => s + (wb.units_dos?.target  ?? 0), 0);

      const hasMonthTarget = monthWeeks.some(wb => wb.hasTarget === true);

      const monthActual = unitType === 'omzet'
        ? monthWeeks.reduce((s, wb) => s + (wb.actual ?? 0), 0)
        : unitType === 'units_bks'  ? monthActual_bks
        : unitType === 'units_slop' ? monthActual_slop
        : unitType === 'units_bal'  ? monthActual_bal
        : monthActual_dos;

      const monthTarget = unitType === 'omzet'       ? 0
                        : unitType === 'units_bks'  ? monthTarget_bks
                        : unitType === 'units_slop' ? monthTarget_slop
                        : unitType === 'units_bal'  ? monthTarget_bal
                        : monthTarget_dos;

      const monthVar    = monthActual - monthTarget;
      const monthVarPct = hasMonthTarget && monthTarget > 0 ? (monthVar    / monthTarget) * 100 : 0;
      const monthAch    = hasMonthTarget && monthTarget > 0 ? (monthActual / monthTarget) * 100 : 0;

      return {
        month,
        target:             parseFloat(monthTarget.toFixed(2)),
        actual:             parseFloat(monthActual.toFixed(2)),
        variance:           parseFloat(monthVar.toFixed(2)),
        variancePercentage: parseFloat(monthVarPct.toFixed(1)),
        achievement:        parseFloat(monthAch.toFixed(1)),
        units_bks:  { target: parseFloat(monthTarget_bks.toFixed(2)),  actual: parseFloat(monthActual_bks.toFixed(2))  },
        units_slop: { target: parseFloat(monthTarget_slop.toFixed(2)), actual: parseFloat(monthActual_slop.toFixed(2)) },
        units_bal:  { target: parseFloat(monthTarget_bal.toFixed(2)),  actual: parseFloat(monthActual_bal.toFixed(2))  },
        units_dos:  { target: parseFloat(monthTarget_dos.toFixed(2)),  actual: parseFloat(monthActual_dos.toFixed(2))  },
        hasTarget:  hasMonthTarget,
      } as MonthlyBreakdown & { hasTarget: boolean };
    });

    quarterlyData.push({
      quarter,
      target:             parseFloat(quarterTargetForUnit.toFixed(2)),
      actual:             parseFloat(quarterActual.toFixed(2)),
      variance:           parseFloat((quarterActual - quarterTargetForUnit).toFixed(2)),
      variancePercentage: quarterTargetForUnit > 0 ? parseFloat(((quarterActual - quarterTargetForUnit) / quarterTargetForUnit * 100).toFixed(1)) : 0,
      details,
      weeklyBreakdown,
      monthlyBreakdown,
    });
  }

  return quarterlyData;
}