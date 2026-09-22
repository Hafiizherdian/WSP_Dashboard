/**
 * Helper kecil untuk membaca nilai unit/omzet dari record mentah,
 * plus builder untuk struktur Map bertingkat year → week → product
 * yang dipakai generator quarterly/L4W-C4W.
 */

import { UnitAgg } from './types';

const OMZET_SCALE = 1;

export function getOmzetValue(record: any): number {
  if (!record) return 0;
  if (typeof record.omzetValue === 'number') return record.omzetValue;
  const raw = record.omzet;
  const numeric = typeof raw === 'number' ? raw : parseFloat(raw ?? '0');
  const normalized = Number.isFinite(numeric) ? numeric * OMZET_SCALE : 0;
  record.omzetValue = normalized;
  return normalized;
}

export function getUnitValue(record: any, unitType: string): number {
  switch (unitType) {
    case 'units_bks':  return Number(record.units_bks)  || 0;
    case 'units_slop': return Number(record.units_slop) || 0;
    case 'units_bal':  return Number(record.units_bal)  || 0;
    case 'units_dos':
    default:           return Number(record.units_dos)  || 0;
  }
}

// ─── OPTIMASI v7: Pre-grouped Map untuk akses O(1) ───────────────────────────
export function buildByWeekMap(
  weekProductMap: Map<string, UnitAgg>,
): Map<number, Map<number, Map<string, UnitAgg>>> {
  const byYear = new Map<number, Map<number, Map<string, UnitAgg>>>();

  for (const [key, agg] of weekProductMap) {
    const firstDash  = key.indexOf('-');
    const secondDash = key.indexOf('-', firstDash + 1);
    const year       = parseInt(key.slice(0, firstDash));
    const week       = parseInt(key.slice(firstDash + 1, secondDash));
    const product    = key.slice(secondDash + 1);

    if (!byYear.has(year)) byYear.set(year, new Map());
    const byWeek = byYear.get(year)!;
    if (!byWeek.has(week)) byWeek.set(week, new Map());
    byWeek.get(week)!.set(product, agg);
  }

  return byYear;
}