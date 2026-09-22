/**
 *
 * PERUBAHAN v12 (fix omzet di ProductL4WC1WData — generateProductL4WC1WData):
 *   - Field nested `omzet: { l4w, c1w, l4wTotal }` per produk sebelumnya
 *     salah baca: `l4w` benar dari `l4wAvg.omzet`, tapi `c1w` & `l4wTotal`
 *     ke-tukar baca dari `c1wData.units_dos` / `l4wTotal.units_dos`
 *     (kemungkinan copy-paste dari baris units_dos di atasnya). Akibatnya
 *     saat filter Unit = Omzet dipilih di L4WC4WAnalysisComponent, nilai
 *     C1W & L4W-Total yang tampil adalah angka Dos, bukan Rupiah.
 *   - Fix: c1w & l4wTotal sekarang konsisten baca dari `.omzet`.
 *   - Bonus cleanup: field `units_omzet: number` di type `WeekEntry` dihapus
 *     karena tidak pernah diisi di object literal manapun (dead field, bisa
 *     memicu TS error "missing property" pada object literal yang strict).
 */

import { L4WC4WData, WeeklyTrendData, ProductL4WC1WData } from '@/types/sales';
import { UnitAgg, FetchFilters } from './types';

// ─── generateL4WC4WData ───────────────────────────────────────────────────────
export function generateL4WC4WData(
  byWeekMap:          Map<number, Map<number, Map<string, UnitAgg>>>,
  omzetByProductWeek: Map<string, number>,
  currentYear?:       number,
  filters?:           FetchFilters,
): L4WC4WData {
  const empty: L4WC4WData = { l4wAverage: 0, c4wAverage: 0, c1wValue: 0, variance: 0, variancePercentage: 0, weeklyTrendData: [] };
  const selectedUnit      = filters?.selectedUnit || 'units_dos';
  const effectiveYear     = filters?.year2 ?? currentYear;

  const yearWeekMap = effectiveYear !== undefined
    ? (byWeekMap.get(effectiveYear) ?? new Map<number, Map<string, UnitAgg>>())
    : (() => {
        const merged = new Map<number, Map<string, UnitAgg>>();
        byWeekMap.forEach(ywm => ywm.forEach((pm, w) => {
          if (!merged.has(w)) merged.set(w, new Map());
          pm.forEach((agg, p) => {
            const ex = merged.get(w)!.get(p);
            if (ex) { ex.bks += agg.bks; ex.slop += agg.slop; ex.bal += agg.bal; ex.dos += agg.dos; }
            else merged.get(w)!.set(p, { ...agg });
          });
        }));
        return merged;
      })();

  if (yearWeekMap.size === 0) return empty;

  const weeklyTotalsMap = new Map<number, number>();

  yearWeekMap.forEach((prodMap, week) => {
    let weekTotal = 0;
    prodMap.forEach((agg, product) => {
      if (selectedUnit === 'omzet') {
        weekTotal += omzetByProductWeek.get(`${effectiveYear}-${week}-${product}`) ?? 0;
      } else {
        weekTotal += selectedUnit === 'units_bks'  ? agg.bks
                   : selectedUnit === 'units_slop' ? agg.slop
                   : selectedUnit === 'units_bal'  ? agg.bal
                   : agg.dos;
      }
    });
    weeklyTotalsMap.set(week, (weeklyTotalsMap.get(week) ?? 0) + weekTotal);
  });

  const weeklyTotals: { week: number; total: number }[] = [];
  weeklyTotalsMap.forEach((total, week) => weeklyTotals.push({ week, total }));
  weeklyTotals.sort((a, b) => a.week - b.week);

  if (weeklyTotals.length < 2) {
    const c1wValue = weeklyTotals[weeklyTotals.length - 1]?.total ?? 0;
    return { ...empty, c4wAverage: Math.round(c1wValue), c1wValue: Math.round(c1wValue) };
  }

  const c1wEntry = weeklyTotals[weeklyTotals.length - 1];
  const c1wValue = c1wEntry.total;
  const l4wWeeks = weeklyTotals.slice(Math.max(0, weeklyTotals.length - 5), weeklyTotals.length - 1);

  if (l4wWeeks.length === 0) return { ...empty, c1wValue: Math.round(c1wValue) };

  const l4wAverageRaw = l4wWeeks.reduce((sum, e) => sum + e.total, 0) / l4wWeeks.length;

  let l4wMinWeek = Infinity;
  let l4wMaxWeek = -Infinity;
  l4wWeeks.forEach(w => {
    if (w.week < l4wMinWeek) l4wMinWeek = w.week;
    if (w.week > l4wMaxWeek) l4wMaxWeek = w.week;
  });
  const l4wWeekRange = l4wMinWeek === l4wMaxWeek
    ? `Week ${l4wMinWeek}`
    : `Week ${l4wMinWeek}-${l4wMaxWeek}`;

  const weeklyTrendData: WeeklyTrendData[] = [
    ...l4wWeeks.map((entry): WeeklyTrendData => ({
      week:   `W${entry.week.toString().padStart(2, '0')}`,
      value:  Math.round(entry.total),
      period: 'L4W',
    })),
    {
      week:   `W${c1wEntry.week.toString().padStart(2, '0')}`,
      value:  Math.round(c1wValue),
      period: 'C1W',
    },
  ];

  const l4wWeekNums = l4wWeeks.map(w => w.week);

  return {
    l4wAverage:      Math.round(l4wAverageRaw),
    c4wAverage:      0,
    c1wValue:        Math.round(c1wValue),
    variance:        0,
    variancePercentage: 0,
    weeklyTrendData,
    l4wWeekRange,
    c1wWeekNumber:   c1wEntry.week,
    productDetails:  generateProductL4WC1WData(
      yearWeekMap,
      omzetByProductWeek,
      effectiveYear,
      c1wEntry.week,
      l4wWeekNums,
    ),
  } as L4WC4WData;
}

// ─── generateProductL4WC1WData ────────────────────────────────────────────────
function generateProductL4WC1WData(
  yearWeekMap:        Map<number, Map<string, UnitAgg>>,
  omzetByProductWeek: Map<string, number>,
  effectiveYear:      number | undefined,
  c1wWeek:            number,
  l4wWeeks:           number[],
): ProductL4WC1WData[] {
  type WeekEntry = { omzet: number; units_bks: number; units_slop: number; units_bal: number; units_dos: number };

  const productMap = new Map<string, Map<number, WeekEntry>>();

  const relevantWeeks = new Set([...l4wWeeks, c1wWeek]);

  relevantWeeks.forEach(week => {
    const prodMap = yearWeekMap.get(week);
    if (!prodMap) return;

    prodMap.forEach((agg, product) => {
      const omzetKey = `${effectiveYear}-${week}-${product}`;
      const omzet    = omzetByProductWeek.get(omzetKey) ?? 0;

      if (!productMap.has(product)) productMap.set(product, new Map());
      const weekMap  = productMap.get(product)!;
      const existing = weekMap.get(week) ?? { omzet: 0, units_bks: 0, units_slop: 0, units_bal: 0, units_dos: 0 };
      weekMap.set(week, {
        omzet:      existing.omzet      + omzet,
        units_bks:  existing.units_bks  + agg.bks,
        units_slop: existing.units_slop + agg.slop,
        units_bal:  existing.units_bal  + agg.bal,
        units_dos:  existing.units_dos  + agg.dos,
      });
    });
  });

  const fallbackEntry: WeekEntry = { omzet: 0, units_bks: 0, units_slop: 0, units_bal: 0, units_dos: 0 };
  const year = effectiveYear ?? new Date().getFullYear();

  const productData: ProductL4WC1WData[] = [];

  for (const [product, weekMap] of productMap.entries()) {
    const c1wData    = weekMap.get(c1wWeek) ?? fallbackEntry;
    const l4wEntries = l4wWeeks
      .map(w => weekMap.get(w))
      .filter((d): d is WeekEntry => d !== undefined && d.omzet > 0);

    const avg = (arr: WeekEntry[], key: keyof WeekEntry): number =>
      l4wEntries.length > 0 ? arr.reduce((s, d) => s + (d[key] as number), 0) / arr.length : 0;
    const sum = (arr: WeekEntry[], key: keyof WeekEntry): number =>
      arr.reduce((s, d) => s + (d[key] as number), 0);

    const l4wAvg: WeekEntry = {
      omzet:      avg(l4wEntries, 'omzet'),
      units_bks:  avg(l4wEntries, 'units_bks'),
      units_slop: avg(l4wEntries, 'units_slop'),
      units_bal:  avg(l4wEntries, 'units_bal'),
      units_dos:  avg(l4wEntries, 'units_dos'),
    };
    const l4wTotal: WeekEntry = {
      omzet:      sum(l4wEntries, 'omzet'),
      units_bks:  sum(l4wEntries, 'units_bks'),
      units_slop: sum(l4wEntries, 'units_slop'),
      units_bal:  sum(l4wEntries, 'units_bal'),
      units_dos:  sum(l4wEntries, 'units_dos'),
    };

    const variance           = c1wData.omzet - l4wAvg.omzet;
    const variancePercentage = l4wAvg.omzet > 0 ? (variance / l4wAvg.omzet) * 100 : 0;

    productData.push({
      product,
      year,
      l4wValue:  Math.round(l4wAvg.omzet),
      c1wValue:  Math.round(c1wData.omzet),
      variance:  Math.round(variance),
      variancePercentage: Math.round(variancePercentage * 10) / 10,
      units_bks:  { l4w: Math.round(l4wAvg.units_bks   * 100) / 100, c1w: Math.round(c1wData.units_bks   * 100) / 100, l4wTotal: Math.round(l4wTotal.units_bks  * 100) / 100 },
      units_slop: { l4w: Math.round(l4wAvg.units_slop  * 100) / 100, c1w: Math.round(c1wData.units_slop  * 100) / 100, l4wTotal: Math.round(l4wTotal.units_slop * 100) / 100 },
      units_bal:  { l4w: Math.round(l4wAvg.units_bal   * 100) / 100, c1w: Math.round(c1wData.units_bal   * 100) / 100, l4wTotal: Math.round(l4wTotal.units_bal  * 100) / 100 },
      units_dos:  { l4w: Math.round(l4wAvg.units_dos   * 100) / 100, c1w: Math.round(c1wData.units_dos   * 100) / 100, l4wTotal: Math.round(l4wTotal.units_dos  * 100) / 100 },
      // ── FIX v12: c1w & l4wTotal sebelumnya salah baca dari `.units_dos`
      //    (kemungkinan copy-paste). Sekarang konsisten baca dari `.omzet`,
      //    sama seperti `l4w` yang sudah benar dari awal.
      omzet:      { l4w: Math.round(l4wAvg.omzet * 100) / 100, c1w: Math.round(c1wData.omzet * 100) / 100, l4wTotal: Math.round(l4wTotal.omzet * 100) / 100 },
    });
  }
  return productData.sort((a, b) => b.c1wValue - a.c1wValue);
}