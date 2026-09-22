/**
 * Versi "Actual vs Actual" dari generateQuarterlyData: previous = actual tahun
 * sebelumnya, current = actual tahun berjalan. Tidak perlu query target sama
 * sekali karena dua-duanya actual — cukup jumlahkan dari byWeekMap dua tahun.
 */

import { QuarterlyYoYData } from '@/types/sales';
import { getProductCategory } from '../productCategories';
import { UnitAgg } from './types';

export async function generateQuarterlyYoYData(
  byWeekMap:          Map<number, Map<number, Map<string, UnitAgg>>>,
  omzetByProductWeek: Map<string, number>,
  currentYear:        number,
  previousYear:       number,
  selectedUnit?:      string,
): Promise<QuarterlyYoYData[]> {
  const quarters = ['Q1', 'Q2', 'Q3', 'Q4'] as const;
  const unitType = selectedUnit || 'units_dos';

  const prevYearWeekMap = byWeekMap.get(previousYear) ?? new Map<number, Map<string, UnitAgg>>();
  const currYearWeekMap = byWeekMap.get(currentYear)  ?? new Map<number, Map<string, UnitAgg>>();

  const pickUnit = (agg: UnitAgg, year: number, week: number, product: string): number => {
    if (unitType === 'omzet') return omzetByProductWeek.get(`${year}-${week}-${product}`) ?? 0;
    if (unitType === 'units_bks')  return agg.bks;
    if (unitType === 'units_slop') return agg.slop;
    if (unitType === 'units_bal')  return agg.bal;
    return agg.dos;
  };

  const getMonthFromWeek = (week: number, year: number): string => {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const jan4    = new Date(year, 0, 4);
    const jan4Day = jan4.getDay() || 7;
    const startOfWeek1 = new Date(jan4);
    startOfWeek1.setDate(jan4.getDate() - (jan4Day - 1));
    const targetDate = new Date(startOfWeek1);
    targetDate.setDate(startOfWeek1.getDate() + (week - 1) * 7);
    return months[targetDate.getMonth()];
  };

  const emptyUnit = { previous: 0, current: 0 };

  const result: QuarterlyYoYData[] = [];

  for (let qIndex = 0; qIndex < quarters.length; qIndex++) {
    const quarter   = quarters[qIndex];
    const startWeek = qIndex * 13 + 1;
    const endWeek   = Math.min((qIndex + 1) * 13, 52);

    // ── Agregasi per-produk untuk kuartal ini, dua tahun sekaligus ──────────
    const productMap = new Map<string, {
      units_dos:  { previous: number; current: number };
      units_bks:  { previous: number; current: number };
      units_slop: { previous: number; current: number };
      units_bal:  { previous: number; current: number };
      omzet:      { previous: number; current: number };
      weeklyPrevious: Record<number, { units_dos:number; units_bks:number; units_slop:number; units_bal:number; omzet:number }>;
      weeklyCurrent:  Record<number, { units_dos:number; units_bks:number; units_slop:number; units_bal:number; omzet:number }>;
    }>();

    const ensureProduct = (product: string) => {
      if (!productMap.has(product)) {
        productMap.set(product, {
          units_dos: { ...emptyUnit }, units_bks: { ...emptyUnit },
          units_slop: { ...emptyUnit }, units_bal: { ...emptyUnit },
          omzet: { ...emptyUnit },
          weeklyPrevious: {}, weeklyCurrent: {},
        });
      }
      return productMap.get(product)!;
    };

    for (let week = startWeek; week <= endWeek; week++) {
      const prevProdMap = prevYearWeekMap.get(week);
      if (prevProdMap) {
        prevProdMap.forEach((agg, product) => {
          const p    = ensureProduct(product);
          const omz  = omzetByProductWeek.get(`${previousYear}-${week}-${product}`) ?? 0;
          p.units_dos.previous  += agg.dos;
          p.units_bks.previous  += agg.bks;
          p.units_slop.previous += agg.slop;
          p.units_bal.previous  += agg.bal;
          p.omzet.previous      += omz;
          p.weeklyPrevious[week] = {
            units_dos: agg.dos, units_bks: agg.bks, units_slop: agg.slop, units_bal: agg.bal, omzet: omz,
          };
        });
      }

      const currProdMap = currYearWeekMap.get(week);
      if (currProdMap) {
        currProdMap.forEach((agg, product) => {
          const p   = ensureProduct(product);
          const omz = omzetByProductWeek.get(`${currentYear}-${week}-${product}`) ?? 0;
          p.units_dos.current  += agg.dos;
          p.units_bks.current  += agg.bks;
          p.units_slop.current += agg.slop;
          p.units_bal.current  += agg.bal;
          p.omzet.current      += omz;
          p.weeklyCurrent[week] = {
            units_dos: agg.dos, units_bks: agg.bks, units_slop: agg.slop, units_bal: agg.bal, omzet: omz,
          };
        });
      }
    }

    const details = Array.from(productMap.entries()).map(([product, p]) => ({
      product,
      productCategory: getProductCategory(product),
      units_dos:  { previous: parseFloat(p.units_dos.previous.toFixed(2)),  current: parseFloat(p.units_dos.current.toFixed(2))  },
      units_bks:  { previous: parseFloat(p.units_bks.previous.toFixed(2)),  current: parseFloat(p.units_bks.current.toFixed(2))  },
      units_slop: { previous: parseFloat(p.units_slop.previous.toFixed(2)), current: parseFloat(p.units_slop.current.toFixed(2)) },
      units_bal:  { previous: parseFloat(p.units_bal.previous.toFixed(2)),  current: parseFloat(p.units_bal.current.toFixed(2))  },
      omzet:      { previous: parseFloat(p.omzet.previous.toFixed(2)),      current: parseFloat(p.omzet.current.toFixed(2))      },
      weeklyPrevious: p.weeklyPrevious,
      weeklyCurrent:  p.weeklyCurrent,
    })) as any;

    // ── Weekly breakdown per kuartal (previous vs current) ──────────────────
    const weeklyBreakdown = [];
    for (let week = startWeek; week <= endWeek; week++) {
      let prevDos = 0, prevBks = 0, prevSlop = 0, prevBal = 0, prevOmz = 0;
      let currDos = 0, currBks = 0, currSlop = 0, currBal = 0, currOmz = 0;

      const prevProdMap = prevYearWeekMap.get(week);
      if (prevProdMap) {
        prevProdMap.forEach((agg, product) => {
          prevDos += agg.dos; prevBks += agg.bks; prevSlop += agg.slop; prevBal += agg.bal;
          prevOmz += omzetByProductWeek.get(`${previousYear}-${week}-${product}`) ?? 0;
        });
      }
      const currProdMap = currYearWeekMap.get(week);
      if (currProdMap) {
        currProdMap.forEach((agg, product) => {
          currDos += agg.dos; currBks += agg.bks; currSlop += agg.slop; currBal += agg.bal;
          currOmz += omzetByProductWeek.get(`${currentYear}-${week}-${product}`) ?? 0;
        });
      }

      const selPrev = unitType === 'omzet' ? prevOmz : unitType === 'units_bks' ? prevBks : unitType === 'units_slop' ? prevSlop : unitType === 'units_bal' ? prevBal : prevDos;
      const selCurr = unitType === 'omzet' ? currOmz : unitType === 'units_bks' ? currBks : unitType === 'units_slop' ? currSlop : unitType === 'units_bal' ? currBal : currDos;
      const variance    = selCurr - selPrev;
      const variancePct = selPrev > 0 ? (variance / selPrev) * 100 : 0;

      weeklyBreakdown.push({
        week,
        previous: parseFloat(selPrev.toFixed(2)),
        current:  parseFloat(selCurr.toFixed(2)),
        variance: parseFloat(variance.toFixed(2)),
        variancePercentage: parseFloat(variancePct.toFixed(1)),
        units_dos:  { previous: parseFloat(prevDos.toFixed(2)),  current: parseFloat(currDos.toFixed(2))  },
        units_bks:  { previous: parseFloat(prevBks.toFixed(2)),  current: parseFloat(currBks.toFixed(2))  },
        units_slop: { previous: parseFloat(prevSlop.toFixed(2)), current: parseFloat(currSlop.toFixed(2)) },
        units_bal:  { previous: parseFloat(prevBal.toFixed(2)),  current: parseFloat(currBal.toFixed(2))  },
      } as any);
    }

    // ── Monthly breakdown, di-derive dari weeklyBreakdown ────────────────────
    const monthsInQuarter =
      qIndex === 0 ? ['Jan', 'Feb', 'Mar'] :
      qIndex === 1 ? ['Apr', 'May', 'Jun'] :
      qIndex === 2 ? ['Jul', 'Aug', 'Sep'] :
                     ['Oct', 'Nov', 'Dec'];

    const wbByMonth = new Map<string, any[]>();
    monthsInQuarter.forEach(m => wbByMonth.set(m, []));
    for (const wb of weeklyBreakdown as any[]) {
      const m = getMonthFromWeek(wb.week, currentYear);
      wbByMonth.get(m)?.push(wb);
    }

    const monthlyBreakdown = monthsInQuarter.map(month => {
      const mw = wbByMonth.get(month) ?? [];
      const mPrevDos  = mw.reduce((s, wb) => s + (wb.units_dos?.previous  ?? 0), 0);
      const mCurrDos  = mw.reduce((s, wb) => s + (wb.units_dos?.current   ?? 0), 0);
      const mPrevBks  = mw.reduce((s, wb) => s + (wb.units_bks?.previous  ?? 0), 0);
      const mCurrBks  = mw.reduce((s, wb) => s + (wb.units_bks?.current   ?? 0), 0);
      const mPrevSlop = mw.reduce((s, wb) => s + (wb.units_slop?.previous ?? 0), 0);
      const mCurrSlop = mw.reduce((s, wb) => s + (wb.units_slop?.current  ?? 0), 0);
      const mPrevBal  = mw.reduce((s, wb) => s + (wb.units_bal?.previous  ?? 0), 0);
      const mCurrBal  = mw.reduce((s, wb) => s + (wb.units_bal?.current   ?? 0), 0);
      const mPrev     = mw.reduce((s, wb) => s + (wb.previous ?? 0), 0);
      const mCurr     = mw.reduce((s, wb) => s + (wb.current  ?? 0), 0);
      const mVar       = mCurr - mPrev;
      const mVarPct     = mPrev > 0 ? (mVar / mPrev) * 100 : 0;

      return {
        month,
        previous: parseFloat(mPrev.toFixed(2)),
        current:  parseFloat(mCurr.toFixed(2)),
        variance: parseFloat(mVar.toFixed(2)),
        variancePercentage: parseFloat(mVarPct.toFixed(1)),
        units_dos:  { previous: parseFloat(mPrevDos.toFixed(2)),  current: parseFloat(mCurrDos.toFixed(2))  },
        units_bks:  { previous: parseFloat(mPrevBks.toFixed(2)),  current: parseFloat(mCurrBks.toFixed(2))  },
        units_slop: { previous: parseFloat(mPrevSlop.toFixed(2)), current: parseFloat(mCurrSlop.toFixed(2)) },
        units_bal:  { previous: parseFloat(mPrevBal.toFixed(2)),  current: parseFloat(mCurrBal.toFixed(2))  },
      } as any;
    });

    // ── Total kuartal ─────────────────────────────────────────────────────
    let quarterPrev = 0, quarterCurr = 0;
    details.forEach((d: any) => {
      const unitField = d[unitType] ?? d.units_dos;
      quarterPrev += unitField.previous;
      quarterCurr += unitField.current;
    });
    const quarterVar    = quarterCurr - quarterPrev;
    const quarterVarPct = quarterPrev > 0 ? (quarterVar / quarterPrev) * 100 : 0;

    result.push({
      quarter,
      previous: parseFloat(quarterPrev.toFixed(2)),
      current:  parseFloat(quarterCurr.toFixed(2)),
      variance: parseFloat(quarterVar.toFixed(2)),
      variancePercentage: parseFloat(quarterVarPct.toFixed(1)),
      details,
      weeklyBreakdown,
      monthlyBreakdown,
    } as any);
  }

  return result;
}