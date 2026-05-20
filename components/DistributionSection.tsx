'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, ReferenceLine,
  PieChart, Pie, Legend,
} from 'recharts';
import {
  TrendingUp, TrendingDown, Users, Package, Store,
  Target, CheckCircle, Activity,
  Map as MapIcon, RefreshCw,
  ClipboardList, ClipboardCheck, Download,
  AlertCircle, Minus,
} from 'lucide-react';
import { AreaConfig } from '@/lib/areaConfig';

type Theme = 'dark' | 'light';

const tk = {
  dark: {
    cardBg:         '#0e1118',
    border:         'rgba(255,255,255,0.07)',
    borderCard:     'rgba(255,255,255,0.075)',
    text:           'rgba(255,255,255,0.92)',
    textSub:        'rgba(255,255,255,0.52)',
    textMuted:      'rgba(255,255,255,0.28)',
    textFaint:      'rgba(255,255,255,0.13)',
    inputBg:        'rgba(255,255,255,0.035)',
    inputBorder:    'rgba(255,255,255,0.09)',
    tableHeadBg:    'rgba(255,255,255,0.03)',
    tableHeadText:  'rgba(255,255,255,0.35)',
    rowHover:       'rgba(255,255,255,0.03)',
    rowAlt:         'rgba(255,255,255,0.01)',
    tooltipBg:      '#13161f',
    tooltipBorder:  'rgba(255,255,255,0.09)',
    gridStroke:     'rgba(255,255,255,0.04)',
    posBg:    'rgba(16,185,129,0.1)',  posText:  '#34d399', posBorder:  'rgba(16,185,129,0.2)',
    negBg:    'rgba(239,68,68,0.1)',   negText:  '#f87171', negBorder:  'rgba(239,68,68,0.2)',
    warnBg:   'rgba(245,158,11,0.09)', warnText: '#fbbf24', warnBorder: 'rgba(245,158,11,0.2)',
    tabActive:      'rgba(28,151,6,0.16)', tabActiveText: '#4ade80',
    tabBg:          'rgba(255,255,255,0.04)',
    selectBg:       '#0b0d13',
    accordionBg:    'rgba(255,255,255,0.02)',
    accordionHover: 'rgba(255,255,255,0.04)',
  },
  light: {
    cardBg:         '#ffffff',
    border:         'rgba(0,0,0,0.065)',
    borderCard:     'rgba(0,0,0,0.08)',
    text:           '#0f172a',
    textSub:        '#475569',
    textMuted:      '#94a3b8',
    textFaint:      '#cbd5e1',
    inputBg:        'rgba(0,0,0,0.03)',
    inputBorder:    'rgba(0,0,0,0.1)',
    tableHeadBg:    '#f1f5f9',
    tableHeadText:  '#475569',
    rowHover:       '#f8fafc',
    rowAlt:         '#fafbfc',
    tooltipBg:      '#ffffff',
    tooltipBorder:  'rgba(0,0,0,0.1)',
    gridStroke:     'rgba(0,0,0,0.045)',
    posBg:    '#f0fdf4', posText:  '#15803d', posBorder:  '#bbf7d0',
    negBg:    '#fef2f2', negText:  '#b91c1c', negBorder:  '#fecaca',
    warnBg:   '#fffbeb', warnText: '#92400e', warnBorder: '#fde68a',
    tabActive:      'rgba(28,151,6,0.1)', tabActiveText: '#15803d',
    tabBg:          '#f1f5f9',
    selectBg:       '#ffffff',
    accordionBg:    'rgba(0,0,0,0.015)',
    accordionHover: 'rgba(0,0,0,0.03)',
  },
} as const;

const CC = ['#3b82f6','#10b981','#f59e0b','#8b5cf6','#ef4444','#0d9488','#f97316','#ec4899'];

// ─── Types ────────────────────────────────────────────────────────────────────
interface AchRow {
  salesman?:       string;
  product?:        string;
  city?:           string;
  district?:       string;
  category?:       string;
  total_plan:      number;
  total_actual:    number;
  total_av_out:    number;
  achievement_pct: number;
  outlet_count?:   number;
}
interface TrendRow {
  week:          string;
  week_num:      number;
  product?:      string;
  total_plan:    number;
  total_actual:  number;
  total_av_in:   number;
  total_ec:      number;
  total_av_out:  number;
  outlet_count:  number;
}
interface CovRow {
  outlet_type:     string;
  product?:        string;
  total_plan:      number;
  total_actual:    number;
  total_av_in:     number;
  total_ec:        number;
  total_av_out:    number;
  outlet_count:    number;
  achievement_pct: number;
}
interface CovSalRow {
  salesman:        string;
  week_num:        number;
  week:            string;
  product?:        string;
  outlet_type?:    string;
  plan:            number;
  actual:          number;
  av_in:           number;
  ec:              number;
  av_out:          number;
  achievement_pct: number;
}
interface OutletCountByType {
  outlet_type:  string;
  outlet_count: number;
}
interface OutletCountByTypeSalesman {
  salesman:     string;
  outlet_type:  string;
  outlet_count: number;
}
interface AchAreaSalesmanRow {
  salesman:        string;
  city:            string;
  district:        string;
  total_plan:      number;
  total_actual:    number;
  total_av_out:    number;
  achievement_pct: number;
  outlet_count:    number;
}
interface Summary {
  total_plan:          number;
  total_actual:        number;
  total_av_in:         number;
  total_ec:            number;
  total_av_out:        number;
  total_outlets:       number;
  total_salesmen:      number;
  total_products:      number;
  total_customers:     number;
  overall_achievement: number;
}
interface AchAreaProductRow {
  product:         string;
  city:            string;
  district:        string;
  total_plan:      number;
  total_actual:    number;
  total_av_out:    number;
  achievement_pct: number;
  outlet_count:    number;
}

interface MissDistRow {
  outlet:       string;
  salesman:     string;
  city:         string;
  district:     string;
  outlet_type:  string;
  total_actual: number;
  total_ec:     number;
  total_av_in:  number;
  total_av_out: number;  
}

interface DistData {
  summary:                      Summary;
  achievementSalesman:          AchRow[];
  achievementProduct:           AchRow[];
  achievementArea:              AchRow[];
  trend:                        TrendRow[];
  coverage:                     CovRow[];
  coverageSalesman:             CovSalRow[];
  outletCountByType:            OutletCountByType[];
  outletCountByTypeSalesman:    OutletCountByTypeSalesman[];
  totalOutlets:                 number;
  achievementAreaSalesman:      AchAreaSalesmanRow[];
  achievementAreaProduct:       AchAreaProductRow[];
  achievementAreaOutletType:    any[];
  // BARU
  missDistribusi: MissDistRow[];
  // WoW: summary minggu sebelumnya untuk delta
  summaryPrevWeek?:             Partial<Summary>;
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface DistributionSectionProps {
  theme?:             Theme;
  areas?:             AreaConfig[];
  areaFilter?:        string;
  weekStart?:         number;
  weekEnd?:           number;
  onWeekStartChange?: (v: number) => void;
  onWeekEndChange?:   (v: number) => void;
  cachedData?:        DistData | null;
  onDataLoaded?:      (data: DistData) => void;
  loaded?:            boolean;
  loading?:           boolean;
  onLoadingChange?:   (v: boolean) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtN     = (v: number) => (v ?? 0).toLocaleString('id-ID', { maximumFractionDigits: 1 });
const achColor = (p: number) => p >= 100 ? '#10b981' : p >= 80 ? '#f59e0b' : '#ef4444';

function normRows(rows: any[]): any[] {
  return rows.map(r => ({
    ...r,
    total_plan:      parseFloat(r.total_plan      ?? 0),
    total_actual:    parseFloat(r.total_actual    ?? 0),
    total_av_in:     parseFloat(r.total_av_in     ?? 0),
    total_ec:        parseFloat(r.total_ec        ?? 0),
    total_av_out:    parseFloat(r.total_av_out    ?? 0),
    achievement_pct: parseFloat(r.achievement_pct ?? 0),
    outlet_count:    parseInt(r.outlet_count      ?? 0, 10),
  }));
}

// ─── Re-agregasi client-side ──────────────────────────────────────────────────
function reaggregate(
  base:       DistData,
  product:    string,
  outletType: string,
  salesman:   string,
): DistData {
  const matchProduct  = (p?: string) => !product    || (p ?? '').toLowerCase().includes(product.toLowerCase());
  const matchOutlet   = (o?: string) => !outletType || (o ?? '').toLowerCase() === outletType.toLowerCase();
  const matchSalesman = (s?: string) => !salesman   || (s ?? '').toLowerCase().includes(salesman.toLowerCase());

  const covFiltered = base.coverageSalesman.filter(r =>
    matchProduct(r.product) &&
    matchSalesman(r.salesman) &&
    matchOutlet(r.outlet_type)
  );

  const hasFilter   = !!(product || outletType || salesman);
  const needCovPath = !!(outletType || salesman);

  const outletCountSalTypeMap = new Map<string, number>();
  (base.outletCountByTypeSalesman ?? []).forEach(r => {
    const key = `${r.salesman}||${r.outlet_type}`;
    outletCountSalTypeMap.set(key, (outletCountSalTypeMap.get(key) ?? 0) + r.outlet_count);
  });

  const outletCountMap = new Map<string, number>(
    base.outletCountByType.map(r => [r.outlet_type, r.outlet_count])
  );

  // ── Achievement Salesman ──────────────────────────────────────────────────
  const salMap = new Map<string, AchRow>();

  if (needCovPath) {
    covFiltered.forEach(r => {
      const key = r.salesman ?? '';
      const ex  = salMap.get(key);
      if (!ex) {
        salMap.set(key, {
          salesman:        r.salesman,
          total_plan:      r.plan,
          total_actual:    r.actual,
          total_av_out:    r.av_out,
          achievement_pct: 0,
          outlet_count:    0,
        });
      } else {
        ex.total_plan   += r.plan;
        ex.total_actual += r.actual;
        ex.total_av_out += r.av_out;
      }
    });
    const covSalesmenSet = new Set(covFiltered.map(r => r.salesman));
    salMap.forEach((row, sal) => {
      if (!covSalesmenSet.has(sal)) return;
      let count = 0;
      (base.outletCountByTypeSalesman ?? []).forEach(r => {
        if (r.salesman !== sal) return;
        if (outletType && r.outlet_type.toLowerCase() !== outletType.toLowerCase()) return;
        count += r.outlet_count;
      });
      row.outlet_count = count;
    });
  } else {
    base.achievementSalesman
      .filter(r => matchProduct(r.product) && matchSalesman(r.salesman))
      .forEach(r => {
        const key = r.salesman ?? '';
        const ex  = salMap.get(key);
        if (!ex) {
          salMap.set(key, { ...r, outlet_count: r.outlet_count ?? 0 });
        } else {
          ex.total_plan   += r.total_plan;
          ex.total_actual += r.total_actual;
          ex.total_av_out += r.total_av_out;
          ex.outlet_count  = Math.max(ex.outlet_count ?? 0, r.outlet_count ?? 0);
        }
      });
  }

  const achievementSalesman = Array.from(salMap.values())
    .map(r => ({
      ...r,
      achievement_pct: r.total_plan > 0
        ? Math.round((r.total_av_out / r.total_plan) * 1000) / 10
        : 0,
    }))
    .sort((a, b) => b.achievement_pct - a.achievement_pct);

  // ── Achievement Product ───────────────────────────────────────────────────
  const prodMap = new Map<string, AchRow>();

  if (needCovPath) {
    covFiltered.forEach(r => {
      const key = r.product ?? '';
      const ex  = prodMap.get(key);
      if (!ex) {
        prodMap.set(key, {
          product:         r.product,
          category:        base.achievementProduct.find(p => p.product === r.product)?.category ?? '',
          total_plan:      r.plan,
          total_actual:    r.actual,
          total_av_out:    r.av_out,
          achievement_pct: 0,
        });
      } else {
        ex.total_plan   += r.plan;
        ex.total_actual += r.actual;
        ex.total_av_out += r.av_out;
      }
    });
  } else {
    base.achievementSalesman
      .filter(r => matchProduct(r.product) && matchSalesman(r.salesman))
      .forEach(r => {
        const key = r.product ?? '';
        const ex  = prodMap.get(key);
        if (!ex) {
          prodMap.set(key, {
            product:         r.product,
            category:        base.achievementProduct.find(p => p.product === r.product)?.category ?? '',
            total_plan:      r.total_plan,
            total_actual:    r.total_actual,
            total_av_out:    r.total_av_out,
            achievement_pct: 0,
          });
        } else {
          ex.total_plan   += r.total_plan;
          ex.total_actual += r.total_actual;
          ex.total_av_out += r.total_av_out;
        }
      });
  }

  const achievementProduct = Array.from(prodMap.values())
    .map(r => ({
      ...r,
      achievement_pct: r.total_plan > 0
        ? Math.round((r.total_av_out / r.total_plan) * 1000) / 10
        : 0,
    }))
    .sort((a, b) => b.total_av_out - a.total_av_out);

  // ── Achievement Area ──────────────────────────────────────────────────────
  const areaMap = new Map<string, AchRow>();

  if (!hasFilter) {
    base.achievementArea.forEach(r => {
      areaMap.set(`${r.city}||${r.district}`, { ...r });
    });
  } else if (outletType) {
    const covBySal = new Map<string, { plan: number; actual: number; av_out: number }>();
    covFiltered.forEach(r => {
      const ex = covBySal.get(r.salesman);
      if (!ex) {
        covBySal.set(r.salesman, { plan: r.plan, actual: r.actual, av_out: r.av_out });
      } else {
        ex.plan   += r.plan;
        ex.actual += r.actual;
        ex.av_out += r.av_out;
      }
    });

    const salAreaLookup = new Map<string, AchAreaSalesmanRow[]>();
    (base.achievementAreaSalesman ?? []).forEach(r => {
      if (!salAreaLookup.has(r.salesman)) salAreaLookup.set(r.salesman, []);
      salAreaLookup.get(r.salesman)!.push(r);
    });

    covBySal.forEach((totals, sal) => {
      const areaRows     = salAreaLookup.get(sal) ?? [];
      const totalPlanSal = areaRows.reduce((s, r) => s + r.total_plan, 0);
      if (totalPlanSal === 0) return;
      areaRows.forEach(ar => {
        const ratio = ar.total_plan / totalPlanSal;
        const key   = `${ar.city}||${ar.district}`;
        const ex    = areaMap.get(key);
        const add   = {
          plan:   totals.plan   * ratio,
          actual: totals.actual * ratio,
          av_out: totals.av_out * ratio,
        };
        if (!ex) {
          areaMap.set(key, {
            city:            ar.city,
            district:        ar.district,
            total_plan:      add.plan,
            total_actual:    add.actual,
            total_av_out:    add.av_out,
            achievement_pct: 0,
            outlet_count:    ar.outlet_count ?? 0,
          });
        } else {
          ex.total_plan   += add.plan;
          ex.total_actual += add.actual;
          ex.total_av_out += add.av_out;
        }
      });
    });

    if (areaMap.size === 0) {
      base.achievementArea.forEach(r => {
        areaMap.set(`${r.city}||${r.district}`, { ...r });
      });
    }
  } else if (salesman) {
    const areaRows = (base.achievementAreaSalesman ?? [])
      .filter(r => matchSalesman(r.salesman));
    if (areaRows.length > 0) {
      areaRows.forEach(r => {
        const key = `${r.city}||${r.district}`;
        const ex  = areaMap.get(key);
        if (!ex) {
          areaMap.set(key, {
            city:            r.city,
            district:        r.district,
            total_plan:      r.total_plan,
            total_actual:    r.total_actual,
            total_av_out:    r.total_av_out,
            achievement_pct: 0,
            outlet_count:    r.outlet_count ?? 0,
          });
        } else {
          ex.total_plan   += r.total_plan;
          ex.total_actual += r.total_actual;
          ex.total_av_out += r.total_av_out;
          ex.outlet_count  = (ex.outlet_count ?? 0) + (r.outlet_count ?? 0);
        }
      });
    } else {
      base.achievementArea.forEach(r => {
        areaMap.set(`${r.city}||${r.district}`, { ...r });
      });
    }
  } else {
    const areaProductData = base.achievementAreaProduct ?? [];
    if (areaProductData.length > 0) {
      areaProductData
        .filter(r => matchProduct(r.product))
        .forEach(r => {
          const key = `${r.city}||${r.district}`;
          const ex  = areaMap.get(key);
          if (!ex) {
            areaMap.set(key, {
              city:            r.city,
              district:        r.district,
              total_plan:      r.total_plan,
              total_actual:    r.total_actual,
              total_av_out:    r.total_av_out,
              achievement_pct: 0,
              outlet_count:    r.outlet_count ?? 0,
            });
          } else {
            ex.total_plan   += r.total_plan;
            ex.total_actual += r.total_actual;
            ex.total_av_out += r.total_av_out;
            ex.outlet_count  = Math.max(ex.outlet_count ?? 0, r.outlet_count ?? 0);
          }
        });
    } else {
      base.achievementArea.forEach(r => {
        areaMap.set(`${r.city}||${r.district}`, { ...r });
      });
    }
  }

  const achievementArea = Array.from(areaMap.values())
    .map(r => ({
      ...r,
      achievement_pct: r.total_plan > 0
        ? Math.round((r.total_av_out / r.total_plan) * 1000) / 10
        : 0,
    }))
    .sort((a, b) => b.total_av_out - a.total_av_out);

  // ── Trend ─────────────────────────────────────────────────────────────────
  let trend: TrendRow[];

  if (needCovPath) {
    const trendMap = new Map<number, TrendRow>();
    covFiltered.forEach(r => {
      const ex = trendMap.get(r.week_num);
      if (!ex) {
        trendMap.set(r.week_num, {
          week:         r.week,
          week_num:     r.week_num,
          total_plan:   r.plan,
          total_actual: r.actual,
          total_av_in:  r.av_in,
          total_ec:     r.ec,
          total_av_out: r.av_out,
          outlet_count: 0,
        });
      } else {
        ex.total_plan   += r.plan;
        ex.total_actual += r.actual;
        ex.total_av_in  += r.av_in;
        ex.total_ec     += r.ec;
        ex.total_av_out += r.av_out;
      }
    });
    trend = Array.from(trendMap.values()).sort((a, b) => a.week_num - b.week_num);
  } else {
    const trendMap = new Map<number, TrendRow>();
    base.trend
      .filter(r => matchProduct(r.product))
      .forEach(r => {
        const ex = trendMap.get(r.week_num);
        if (!ex) {
          trendMap.set(r.week_num, { ...r });
        } else {
          ex.total_plan   += r.total_plan;
          ex.total_actual += r.total_actual;
          ex.total_av_in  += r.total_av_in;
          ex.total_ec     += r.total_ec;
          ex.total_av_out += r.total_av_out;
          ex.outlet_count += r.outlet_count;
        }
      });
    trend = Array.from(trendMap.values()).sort((a, b) => a.week_num - b.week_num);
  }

  // ── Coverage ──────────────────────────────────────────────────────────────
  const covMap = new Map<string, CovRow>();

  if (needCovPath) {
    covFiltered.forEach(r => {
      const key = r.outlet_type ?? '';
      const ex  = covMap.get(key);
      if (!ex) {
        covMap.set(key, {
          outlet_type:     key,
          total_plan:      r.plan,
          total_actual:    r.actual,
          total_av_in:     r.av_in,
          total_ec:        r.ec,
          total_av_out:    r.av_out,
          outlet_count:    0,
          achievement_pct: 0,
        });
      } else {
        ex.total_plan   += r.plan;
        ex.total_actual += r.actual;
        ex.total_av_in  += r.av_in;
        ex.total_ec     += r.ec;
        ex.total_av_out += r.av_out;
      }
    });
  } else {
    base.coverage
      .filter(r => matchProduct(r.product))
      .forEach(r => {
        const key = r.outlet_type ?? '';
        const ex  = covMap.get(key);
        if (!ex) {
          covMap.set(key, { ...r, outlet_count: 0 });
        } else {
          ex.total_plan   += r.total_plan;
          ex.total_actual += r.total_actual;
          ex.total_av_in  += r.total_av_in;
          ex.total_ec     += r.total_ec;
          ex.total_av_out += r.total_av_out;
        }
      });
  }

  const coverage = Array.from(covMap.values())
    .map(r => {
      let outletCount = 0;
      if (salesman) {
        (base.outletCountByTypeSalesman ?? []).forEach(ocr => {
          if (ocr.outlet_type !== r.outlet_type) return;
          if (!matchSalesman(ocr.salesman)) return;
          outletCount += ocr.outlet_count;
        });
      } else {
        outletCount = outletCountMap.get(r.outlet_type) ?? 0;
      }
      return {
        ...r,
        outlet_count:    outletCount,
        achievement_pct: r.total_plan > 0
          ? Math.round((r.total_av_out / r.total_plan) * 1000) / 10
          : 0,
      };
    })
    .sort((a, b) => b.total_av_out - a.total_av_out);

  // ── Coverage Salesman heatmap ─────────────────────────────────────────────
  const covSalMap = new Map<string, CovSalRow>();
  covFiltered.forEach(r => {
    const key = `${r.salesman}||${r.week}`;
    const ex  = covSalMap.get(key);
    if (!ex) {
      covSalMap.set(key, { ...r });
    } else {
      ex.plan   += r.plan;
      ex.actual += r.actual;
      ex.av_in  += r.av_in;
      ex.ec     += r.ec;
      ex.av_out += r.av_out;
    }
  });
  const coverageSalesman = Array.from(covSalMap.values())
    .map(r => ({
      ...r,
      achievement_pct: r.plan > 0
        ? Math.round((r.av_out / r.plan) * 1000) / 10
        : 0,
    }));

  // ── Summary ───────────────────────────────────────────────────────────────
  const totalPlan   = trend.reduce((s, r) => s + r.total_plan,   0);
  const totalActual = trend.reduce((s, r) => s + r.total_actual, 0);
  const totalAvIn   = trend.reduce((s, r) => s + r.total_av_in,  0);
  const totalEc     = trend.reduce((s, r) => s + r.total_ec,     0);
  const totalAvOut  = trend.reduce((s, r) => s + r.total_av_out, 0);

  let totalOutlets: number;
  if (!hasFilter) {
    totalOutlets = base.totalOutlets;
  } else if (salesman && outletType) {
    totalOutlets = 0;
    (base.outletCountByTypeSalesman ?? []).forEach(r => {
      if (matchSalesman(r.salesman) && r.outlet_type.toLowerCase() === outletType.toLowerCase()) {
        totalOutlets += r.outlet_count;
      }
    });
  } else if (salesman) {
    totalOutlets = 0;
    (base.outletCountByTypeSalesman ?? []).forEach(r => {
      if (matchSalesman(r.salesman)) totalOutlets += r.outlet_count;
    });
  } else if (outletType) {
    totalOutlets = outletCountMap.get(outletType) ?? 0;
  } else {
    totalOutlets = base.totalOutlets;
  }

  const totalSalesmen = new Set(achievementSalesman.map(r => r.salesman)).size;
  const totalProducts = achievementProduct.length;

  const summary: Summary = {
    ...base.summary,
    total_plan:          totalPlan,
    total_actual:        totalActual,
    total_av_in:         totalAvIn,
    total_ec:            totalEc,
    total_av_out:        totalAvOut,
    total_outlets:       totalOutlets,
    total_salesmen:      totalSalesmen,
    total_products:      totalProducts,
    overall_achievement: totalPlan > 0
      ? Math.round((totalAvOut / totalPlan) * 1000) / 10
      : 0,
  };

  // ── Miss EC — filter sesuai filter aktif ──────────────────────────────────
  const missDistribusi = (base.missDistribusi ?? []).filter(r =>
    matchSalesman(r.salesman) &&
    matchOutlet(r.outlet_type)
  );

  return {
    summary,
    achievementSalesman,
    achievementProduct,
    achievementArea,
    trend,
    coverage,
    coverageSalesman,
    outletCountByType:            base.outletCountByType,
    outletCountByTypeSalesman:    base.outletCountByTypeSalesman,
    totalOutlets:                 base.totalOutlets,
    achievementAreaSalesman:      base.achievementAreaSalesman   ?? [],
    achievementAreaProduct:       base.achievementAreaProduct    ?? [],
    achievementAreaOutletType:    base.achievementAreaOutletType ?? [],
    missDistribusi,
    summaryPrevWeek:              base.summaryPrevWeek,
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function AchBadge({ pct, theme }: { pct: number; theme: Theme }) {
  const t = tk[theme];
  const n = parseFloat(String(pct ?? 0));
  const clr = achColor(n);
  const bg  = n >= 100 ? t.posBg  : n >= 80 ? t.warnBg  : t.negBg;
  const bdr = n >= 100 ? t.posBorder : n >= 80 ? t.warnBorder : t.negBorder;
  return (
    <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700, fontFamily: 'IBM Plex Mono,monospace', background: bg, color: clr, border: `1px solid ${bdr}`, whiteSpace: 'nowrap' }}>
      {n.toFixed(1)}%
    </span>
  );
}

// ─── BARU: WoW Delta badge ─────────────────────────────────────────────────────
// function WowDelta({ current, prev, theme }: { current: number; prev?: number; theme: Theme }) {
//   const t = tk[theme];
//   if (prev === undefined || prev === null) return null;
//   const delta = current - prev;
//   if (Math.abs(delta) < 0.05) {
//     return (
//       <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: 9, fontFamily: 'IBM Plex Mono,monospace', color: t.textMuted }}>
//         <Minus size={9} />0
//       </span>
//     );
//   }
//   const up  = delta > 0;
//   const clr = up ? t.posText : t.negText;
//   return (
//     <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: 9, fontFamily: 'IBM Plex Mono,monospace', color: clr }}>
//       {up ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
//       {up ? '+' : ''}{delta.toFixed(1)}
//     </span>
//   );
// }

function KpiCard({
  label, value, sub, icon: Icon, color, theme, wowCurrent, wowPrev,
}: {
  label: string; value: string; sub?: string; icon: any; color: string; theme: Theme;
  wowCurrent?: number; wowPrev?: number;
}) {
  const t = tk[theme];
  return (
    <div style={{ background: t.cardBg, border: `1px solid ${t.borderCard}`, borderRadius: 12, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 6, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 14, right: 14, height: 2, borderRadius: '0 0 2px 2px', background: `linear-gradient(90deg,${color}55,${color}22)` }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 22, height: 22, borderRadius: 6, background: `${color}18`, border: `1px solid ${color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={11} color={color} />
        </div>
        <span style={{ fontSize: 9, fontWeight: 700, fontFamily: 'IBM Plex Mono,monospace', textTransform: 'uppercase', letterSpacing: '0.08em', color: t.textMuted }}>{label}</span>
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'IBM Plex Mono,monospace', color: t.text, lineHeight: 1, letterSpacing: '-0.02em' }}>{value}</div>
      {/* <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
        {sub && <div style={{ fontSize: 9, color: t.textMuted, fontFamily: 'IBM Plex Mono,monospace' }}>{sub}</div>}
        {wowCurrent !== undefined && (
          <WowDelta current={wowCurrent} prev={wowPrev} theme={theme} />
        )}
      </div> */}
    </div>
  );
}

function PBar({ pct, theme }: { pct: number; theme: Theme }) {
  const t = tk[theme];
  const n = parseFloat(String(pct ?? 0));
  const clr = achColor(n);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ flex: 1, height: 5, borderRadius: 3, background: t.borderCard, overflow: 'hidden', minWidth: 60 }}>
        <div style={{ height: '100%', width: `${Math.min(100, n)}%`, background: clr, borderRadius: 3, transition: 'width 0.4s ease' }} />
      </div>
      <AchBadge pct={n} theme={theme} />
    </div>
  );
}

function CT({ active, payload, label, theme }: any) {
  const t = tk[theme as Theme];
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: t.tooltipBg, border: `1px solid ${t.tooltipBorder}`, borderRadius: 8, padding: '8px 12px', fontSize: 10, fontFamily: 'IBM Plex Mono,monospace', boxShadow: '0 6px 20px rgba(0,0,0,0.25)' }}>
      <div style={{ color: t.textMuted, marginBottom: 5, fontSize: 9 }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: p.color || p.fill, flexShrink: 0 }} />
          <span style={{ color: t.textSub, flex: 1 }}>{p.name}</span>
          <span style={{ fontWeight: 700, color: t.text }}>{fmtN(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

function FilterBadge({ label, value, onClear, theme }: { label: string; value: string; onClear: () => void; theme: Theme }) {
  const t = tk[theme];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '1px 4px 1px 7px', borderRadius: 4,
      background: 'rgba(28,151,6,0.12)', border: '1px solid rgba(28,151,6,0.25)',
      fontSize: 10, fontFamily: 'IBM Plex Mono,monospace', color: t.tabActiveText,
    }}>
      <b>{label}:</b> {value}
      <button onClick={onClear} style={{ background: 'none', border: 'none', color: t.textMuted, cursor: 'pointer', fontSize: 12, lineHeight: 1, padding: '0 2px', display: 'flex', alignItems: 'center' }}>×</button>
    </span>
  );
}

// ─── BARU: Funnel Component ───────────────────────────────────────────────────
function DistributionFunnel({ summary, theme }: { summary: Summary; theme: Theme }) {
  const t = tk[theme];

  const steps = [
    { label: 'Plan',   value: summary.total_plan,   color: '#3b82f6', desc: 'Target distribusi' },
    { label: 'Actual', value: summary.total_actual,  color: '#8b5cf6', desc: 'Realisasi kunjungan' },
    { label: 'Av-In',  value: summary.total_av_in,   color: '#0d9488', desc: 'Barang masuk outlet' },
    { label: 'EC',     value: summary.total_ec,      color: '#10b981', desc: 'Effective call (order)' },
    { label: 'Av-Out', value: summary.total_av_out,  color: achColor(summary.overall_achievement), desc: 'Tersedia di outlet' },
  ];

  const maxVal = steps[0].value || 1;

  return (
    <div style={{ background: t.cardBg, border: `1px solid ${t.borderCard}`, borderRadius: 12, padding: '14px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: t.text, fontFamily: 'IBM Plex Mono,monospace' }}>
          Funnel Distribusi
        </div>
        <div style={{ fontSize: 9, color: t.textMuted, fontFamily: 'IBM Plex Mono,monospace' }}>
          Plan → Av-Out
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {steps.map((step, i) => {
          const pct     = maxVal > 0 ? (step.value / maxVal) * 100 : 0;
          const dropPct = i > 0 && steps[i - 1].value > 0
            ? ((steps[i - 1].value - step.value) / steps[i - 1].value) * 100
            : null;
          return (
            <div key={step.label}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                <div style={{ width: 52, fontSize: 10, fontWeight: 700, fontFamily: 'IBM Plex Mono,monospace', color: step.color, flexShrink: 0 }}>
                  {step.label}
                </div>
                <div style={{ flex: 1, height: 20, borderRadius: 4, background: t.borderCard, overflow: 'hidden', position: 'relative' }}>
                  <div style={{
                    height: '100%',
                    width: `${Math.min(100, pct)}%`,
                    background: step.color,
                    opacity: 0.85,
                    borderRadius: 4,
                    transition: 'width 0.5s ease',
                    display: 'flex',
                    alignItems: 'center',
                    paddingLeft: 8,
                    minWidth: step.value > 0 ? 40 : 0,
                  }}>
                    {pct > 15 && (
                      <span style={{ fontSize: 9, fontWeight: 700, fontFamily: 'IBM Plex Mono,monospace', color: '#fff', whiteSpace: 'nowrap' }}>
                        {fmtN(step.value)}
                      </span>
                    )}
                  </div>
                  {pct <= 15 && step.value > 0 && (
                    <span style={{ position: 'absolute', left: `calc(${pct}% + 6px)`, top: '50%', transform: 'translateY(-50%)', fontSize: 9, fontWeight: 700, fontFamily: 'IBM Plex Mono,monospace', color: t.textSub, whiteSpace: 'nowrap' }}>
                      {fmtN(step.value)}
                    </span>
                  )}
                </div>
                <div style={{ width: 70, textAlign: 'right', flexShrink: 0 }}>
                  {dropPct !== null && dropPct > 0.5 ? (
                    <span style={{ fontSize: 9, fontFamily: 'IBM Plex Mono,monospace', color: t.negText, background: t.negBg, border: `1px solid ${t.negBorder}`, padding: '1px 5px', borderRadius: 4 }}>
                      ↓ {dropPct.toFixed(1)}%
                    </span>
                  ) : i === 0 ? (
                    <span style={{ fontSize: 9, fontFamily: 'IBM Plex Mono,monospace', color: t.textMuted }}>baseline</span>
                  ) : (
                    <span style={{ fontSize: 9, fontFamily: 'IBM Plex Mono,monospace', color: t.posText }}>≈ flat</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${t.border}`, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {steps.map((step, i) => {
          if (i === 0) return null;
          const convRate = steps[0].value > 0 ? (step.value / steps[0].value) * 100 : 0;
          return (
            <div key={step.label} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 8, color: t.textMuted, fontFamily: 'IBM Plex Mono,monospace', textTransform: 'uppercase' }}>{step.label} / Plan</span>
              <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'IBM Plex Mono,monospace', color: step.color }}>{convRate.toFixed(1)}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Distribution Tabs ────────────────────────────────────────────────────────
function DistributionTabs({
  data,
  theme,
  hasAreaFilterWarning,
  onReload,
}: {
  data: DistData;
  theme: Theme;
  hasAreaFilterWarning: boolean;
  onReload: () => void;
}) {
  const t = tk[theme];
  const [tabValue, setTabValue] = useState(0);

  const missDistCount = data.missDistribusi?.length ?? 0;

  const tabs = [
    { label: 'Achievement',    icon: Target,       color: '#10b981', content: <AchievementContent data={data} theme={theme} hasAreaFilterWarning={hasAreaFilterWarning} onReload={onReload} /> },
    { label: 'Trend Mingguan', icon: Activity,     color: '#3b82f6', content: <TrendContent       data={data} theme={theme} /> },
    { label: 'Outlet',         icon: Store,        color: '#f59e0b', content: <CoverageContent    data={data} theme={theme} /> },
    { label: 'Miss Distribusi',icon: AlertCircle,  color: '#ef4444', content: <MissDistContent    data={data} theme={theme} />, badge: missDistCount  },
  ];

  return (
    <div style={{ width: '100%', background: t.cardBg, border: `1px solid ${t.borderCard}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ display: 'flex', borderBottom: `1px solid ${t.border}`, background: t.tableHeadBg, overflowX: 'auto' }}>
        {tabs.map((tab, i) => {
          const Icon     = tab.icon;
          const isActive = tabValue === i;
          return (
            <button key={i} onClick={() => setTabValue(i)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '10px 18px', background: 'transparent', border: 'none',
                borderBottom: isActive ? `2px solid #1c9706` : '2px solid transparent',
                cursor: 'pointer', fontSize: 11,
                fontWeight: isActive ? 700 : 500,
                fontFamily: 'IBM Plex Mono, monospace',
                color: isActive ? t.tabActiveText : t.textMuted,
                whiteSpace: 'nowrap', transition: 'all 0.15s', marginBottom: -1,
              }}
            >
              <div style={{
                width: 18, height: 18, borderRadius: 5,
                background: isActive ? `${tab.color}22` : 'transparent',
                border: isActive ? `1px solid ${tab.color}33` : '1px solid transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s',
              }}>
                <Icon size={10} color={isActive ? tab.color : t.textMuted} />
              </div>
              {tab.label}
              {'badge' in tab && tab.badge! > 0 && (
                <span style={{
                  fontSize: 9, fontWeight: 700, padding: '0px 5px', borderRadius: 99,
                  background: isActive ? t.negBg : 'rgba(239,68,68,0.12)',
                  color: '#ef4444',
                  border: '1px solid rgba(239,68,68,0.25)',
                  fontFamily: 'IBM Plex Mono,monospace',
                  marginLeft: 2,
                }}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div style={{ padding: 16 }}>
        {tabs[tabValue].content}
      </div>
    </div>
  );
}

// ─── Achievement Content ──────────────────────────────────────────────────────
function AchievementContent({
  data,
  theme,
  hasAreaFilterWarning,
  onReload,
}: {
  data: DistData;
  theme: Theme;
  hasAreaFilterWarning: boolean;
  onReload: () => void;
}) {
  const t  = tk[theme];
  const ts = { fontSize: 8, fill: t.textMuted, fontFamily: 'IBM Plex Mono,monospace' };
  const [view, setView] = useState<'salesman' | 'product' | 'area'>('salesman');

  const rows = view === 'salesman' ? data.achievementSalesman
             : view === 'product'  ? data.achievementProduct
             : data.achievementArea;

  const chartData = rows.slice(0, 10).map(r => ({
    name: view === 'salesman' ? (r.salesman || '-')
         : view === 'product'  ? (r.product  || '-')
         : `${r.city || '-'} · ${r.district || '-'}`,
    plan:   r.total_plan,
    av_out: r.total_av_out,
    pct:    r.achievement_pct,
  }));

  const tabs = [
    { id: 'salesman', label: 'Per Salesman',  icon: Users },
    { id: 'product',  label: 'Per Produk',    icon: Package },
    { id: 'area',     label: 'Per Area/Kota', icon: MapIcon },
  ] as const;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', gap: 4, background: t.tabBg, borderRadius: 8, padding: 3, width: 'fit-content' }}>
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setView(id)}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, fontFamily: 'IBM Plex Mono,monospace', border: 'none', cursor: 'pointer', background: view === id ? t.tabActive : 'transparent', color: view === id ? t.tabActiveText : t.textMuted, transition: 'all 0.15s' }}>
            <Icon size={11} />{label}
          </button>
        ))}
      </div>

      {/* ── DIPERBAIKI: warning area dengan tombol reload ── */}
      {view === 'area' && hasAreaFilterWarning && (
        <div style={{
          padding: '8px 12px', borderRadius: 8,
          background: t.warnBg, border: `1px solid ${t.warnBorder}`,
          fontSize: 10, fontFamily: 'IBM Plex Mono,monospace', color: t.warnText,
          display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
        }}>
          <Activity size={12} />
          <span style={{ flex: 1 }}>
            Data area belum akurat untuk filter ini.
          </span>
          <button
            onClick={onReload}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '3px 10px', borderRadius: 4, border: `1px solid ${t.warnBorder}`,
              background: t.warnBg, color: t.warnText, cursor: 'pointer',
              fontSize: 10, fontWeight: 700, fontFamily: 'IBM Plex Mono,monospace',
            }}
          >
            <RefreshCw size={10} /> Reload Data Area
          </button>
        </div>
      )}

      <div style={{ background: t.accordionBg, border: `1px solid ${t.border}`, borderRadius: 10, padding: '12px 14px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: t.text, fontFamily: 'IBM Plex Mono,monospace', marginBottom: 10 }}>
          Plan vs Av-Out — Top {chartData.length}
        </div>
        {chartData.length === 0 ? (
          <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.textMuted, fontSize: 11, fontFamily: 'IBM Plex Mono,monospace' }}>Belum ada data.</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 60, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.gridStroke} horizontal={false} />
              <XAxis type="number" tick={ts} axisLine={false} tickLine={false} tickFormatter={fmtN} />
              <YAxis type="category" dataKey="name" tick={{ ...ts, fontSize: 9 }} axisLine={false} tickLine={false} width={120} />
              <Tooltip content={<CT theme={theme} />} />
              <Bar dataKey="plan"   name="Plan"   fill="#3b82f6" opacity={0.35} radius={[0,3,3,0]} maxBarSize={10} />
              <Bar dataKey="av_out" name="Av-Out" radius={[0,3,3,0]} maxBarSize={10}>
                {chartData.map((d, i) => <Cell key={i} fill={achColor(d.pct)} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div style={{ border: `1px solid ${t.border}`, borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'IBM Plex Mono,monospace' }}>
            <thead>
              <tr style={{ background: t.tableHeadBg }}>
                {(() => {
                  const headers =
                    view === 'salesman' ? ['#', 'Salesman', 'Plan', 'Av-Out', 'Achievement', 'Outlet'] :
                    view === 'product'  ? ['#', 'Produk', 'Kategori', 'Plan', 'Av-Out', 'Achievement'] :
                                         ['#', 'Kota · Kecamatan', 'Plan', 'Av-Out', 'Achievement', 'Outlet'];
                  return headers.map((h, i) => (
                    <th key={i} style={{ padding: '8px 12px', textAlign: i > 1 ? 'right' : 'left', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: t.tableHeadText, borderBottom: `1px solid ${t.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                  ));
                })()}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: '24px', textAlign: 'center', color: t.textMuted, fontSize: 11 }}>Belum ada data</td></tr>
              ) : rows.map((r, i) => (
                <tr key={i}
                  style={{ background: i % 2 === 1 ? t.rowAlt : 'transparent' }}
                  onMouseEnter={e => (e.currentTarget.style.background = t.rowHover)}
                  onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 1 ? t.rowAlt : 'transparent')}>
                  <td style={{ padding: '8px 12px', fontSize: 10, color: t.textMuted }}>{i + 1}</td>
                  <td style={{ padding: '8px 12px', fontSize: 11, fontWeight: 600, color: t.text, whiteSpace: 'nowrap' }}>
                    {view === 'salesman' ? r.salesman : view === 'product' ? r.product : `${r.city} · ${r.district}`}
                  </td>
                  {view === 'product' && (
                    <td style={{ padding: '8px 12px', fontSize: 10, color: t.textSub }}>{r.category || '—'}</td>
                  )}
                  <td style={{ padding: '8px 12px', fontSize: 11, color: t.textSub, textAlign: 'right' }}>{fmtN(r.total_plan)}</td>
                  <td style={{ padding: '8px 12px', fontSize: 11, fontWeight: 700, color: t.text, textAlign: 'right' }}>{fmtN(r.total_av_out)}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right' }}><PBar pct={r.achievement_pct} theme={theme} /></td>
                  {view !== 'product' && (
                    <td style={{ padding: '8px 12px', fontSize: 10, color: t.textSub, textAlign: 'right' }}>
                      {(r.outlet_count ?? 0) > 0 ? fmtN(r.outlet_count!) : '—'}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '8px 12px', borderTop: `1px solid ${t.border}`, display: 'flex', gap: 16, fontSize: 10, color: t.textMuted, fontFamily: 'IBM Plex Mono,monospace' }}>
          <span><b style={{ color: t.text }}>{rows.filter(r => r.achievement_pct >= 100).length}</b> hit target</span>
          <span><b style={{ color: t.text }}>{rows.filter(r => r.achievement_pct >= 80 && r.achievement_pct < 100).length}</b> mendekat</span>
          <span><b style={{ color: t.text }}>{rows.filter(r => r.achievement_pct < 80).length}</b> perlu perhatian</span>
        </div>
      </div>
    </div>
  );
}

// ─── Trend Content ────────────────────────────────────────────────────────────
function TrendContent({ data, theme }: { data: DistData; theme: Theme }) {
  const t     = tk[theme];
  const ts    = { fontSize: 8, fill: t.textMuted, fontFamily: 'IBM Plex Mono,monospace' };
  const trend = data.trend;

  const avgPlan  = trend.length ? trend.reduce((s, r) => s + r.total_plan,   0) / trend.length : 0;
  const avgAvOut = trend.length ? trend.reduce((s, r) => s + r.total_av_out, 0) / trend.length : 0;

  const chartData = trend.map(r => ({
    week:   r.week,
    plan:   r.total_plan,
    actual: r.total_actual,
    av_in:  r.total_av_in,
    ec:     r.total_ec,
    av_out: r.total_av_out,
    pct:    r.total_plan > 0 ? (r.total_av_out / r.total_plan) * 100 : 0,
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ background: t.accordionBg, border: `1px solid ${t.border}`, borderRadius: 10, padding: '12px 14px' }}>
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: t.text, fontFamily: 'IBM Plex Mono,monospace' }}>Plan vs Av-Out per Minggu</div>
          <div style={{ fontSize: 9, color: t.textMuted, fontFamily: 'IBM Plex Mono,monospace', marginTop: 2 }}>
            Avg Plan: {fmtN(avgPlan)} · Avg Av-Out: {fmtN(avgAvOut)}
          </div>
        </div>
        {chartData.length === 0 ? (
          <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.textMuted, fontSize: 11, fontFamily: 'IBM Plex Mono,monospace' }}>Belum ada data</div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.gridStroke} vertical={false} />
              <XAxis dataKey="week" tick={ts} axisLine={false} tickLine={false} />
              <YAxis tick={ts} axisLine={false} tickLine={false} width={36} tickFormatter={fmtN} />
              <Tooltip content={<CT theme={theme} />} />
              <ReferenceLine y={avgAvOut} stroke="#f59e0b" strokeDasharray="4 2" strokeWidth={1} />
              <Bar dataKey="plan"   name="Plan"   fill="#3b82f6" opacity={0.3} radius={[2,2,0,0]} maxBarSize={18} />
              <Bar dataKey="av_out" name="Av-Out" radius={[2,2,0,0]} maxBarSize={18}>
                {chartData.map((d, i) => <Cell key={i} fill={achColor(d.pct)} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div style={{ background: t.accordionBg, border: `1px solid ${t.border}`, borderRadius: 10, padding: '12px 14px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: t.text, fontFamily: 'IBM Plex Mono,monospace', marginBottom: 10 }}>Av-In · EC · Av-Out per Minggu</div>
        {chartData.length === 0 ? (
          <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.textMuted, fontSize: 11, fontFamily: 'IBM Plex Mono,monospace' }}>Belum ada data</div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.gridStroke} vertical={false} />
              <XAxis dataKey="week" tick={ts} axisLine={false} tickLine={false} />
              <YAxis tick={ts} axisLine={false} tickLine={false} width={36} tickFormatter={fmtN} />
              <Tooltip content={<CT theme={theme} />} />
              <Line type="monotone" dataKey="av_in"  name="Av-In"  stroke="#3b82f6" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="ec"     name="EC"     stroke="#10b981" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="av_out" name="Av-Out" stroke="#f59e0b" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div style={{ border: `1px solid ${t.border}`, borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'IBM Plex Mono,monospace' }}>
            <thead>
              <tr style={{ background: t.tableHeadBg }}>
                {['Minggu','Plan','Actual','Av-In','EC','Av-Out','Achievement','Outlet'].map((h, i) => (
                  <th key={i} style={{ padding: '8px 12px', textAlign: i === 0 ? 'left' : 'right', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: t.tableHeadText, borderBottom: `1px solid ${t.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {trend.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: '24px', textAlign: 'center', color: t.textMuted, fontSize: 11 }}>Belum ada data</td></tr>
              ) : trend.map((r, i) => {
                const pct = r.total_plan > 0 ? (r.total_av_out / r.total_plan) * 100 : 0;
                return (
                  <tr key={i}
                    style={{ background: i % 2 === 1 ? t.rowAlt : 'transparent' }}
                    onMouseEnter={e => (e.currentTarget.style.background = t.rowHover)}
                    onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 1 ? t.rowAlt : 'transparent')}>
                    <td style={{ padding: '7px 12px', fontSize: 11, fontWeight: 700, color: t.text }}>{r.week}</td>
                    <td style={{ padding: '7px 12px', fontSize: 11, color: t.textSub, textAlign: 'right' }}>{fmtN(r.total_plan)}</td>
                    <td style={{ padding: '7px 12px', fontSize: 11, color: t.textSub, textAlign: 'right' }}>{fmtN(r.total_actual)}</td>
                    <td style={{ padding: '7px 12px', fontSize: 11, color: '#3b82f6', textAlign: 'right' }}>{fmtN(r.total_av_in)}</td>
                    <td style={{ padding: '7px 12px', fontSize: 11, color: '#10b981', textAlign: 'right' }}>{fmtN(r.total_ec)}</td>
                    <td style={{ padding: '7px 12px', fontSize: 11, fontWeight: 700, color: t.text, textAlign: 'right' }}>{fmtN(r.total_av_out)}</td>
                    <td style={{ padding: '7px 12px', textAlign: 'right' }}><AchBadge pct={pct} theme={theme} /></td>
                    <td style={{ padding: '7px 12px', fontSize: 10, color: t.textSub, textAlign: 'right' }}>{(r.outlet_count ?? 0) > 0 ? fmtN(r.outlet_count!) : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Coverage Content ─────────────────────────────────────────────────────────
function CoverageContent({ data, theme }: { data: DistData; theme: Theme }) {
  const t   = tk[theme];
  const ts  = { fontSize: 8, fill: t.textMuted, fontFamily: 'IBM Plex Mono,monospace' };
  const cov = data.coverage;

  const salesmen = Array.from(new Set(data.coverageSalesman.map(r => r.salesman)));
  const weeks    = Array.from(new Set(data.coverageSalesman.map(r => r.week))).sort((a, b) =>
    parseInt(a.replace(/\D/g, '')) - parseInt(b.replace(/\D/g, ''))
  );

  const heatMap = useMemo(() => {
    const m = new Map<string, CovSalRow>();
    data.coverageSalesman.forEach(r => m.set(`${r.salesman}||${r.week}`, r));
    return m;
  }, [data.coverageSalesman]);

  const pieData = cov.map((r, i) => ({
    name:  r.outlet_type || 'Unknown',
    value: r.total_av_out,
    fill:  CC[i % CC.length],
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{ background: t.accordionBg, border: `1px solid ${t.border}`, borderRadius: 10, padding: '12px 14px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: t.text, fontFamily: 'IBM Plex Mono,monospace', marginBottom: 10 }}>Distribusi Av-Out per Tipe</div>
          {pieData.length === 0 ? (
            <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.textMuted, fontSize: 11 }}>Belum ada data</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius="35%" outerRadius="60%" dataKey="value" strokeWidth={0} paddingAngle={2}>
                  {pieData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Pie>
                <Tooltip content={<CT theme={theme} />} />
                <Legend iconSize={7} iconType="circle" wrapperStyle={{ fontSize: 9, fontFamily: 'IBM Plex Mono,monospace', color: t.textSub }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div style={{ background: t.accordionBg, border: `1px solid ${t.border}`, borderRadius: 10, padding: '12px 14px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: t.text, fontFamily: 'IBM Plex Mono,monospace', marginBottom: 10 }}>Av-In · EC · Av-Out per Tipe</div>
          {cov.length === 0 ? (
            <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.textMuted, fontSize: 11 }}>Belum ada data</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={cov.map(r => ({ name: r.outlet_type, av_in: r.total_av_in, ec: r.total_ec, av_out: r.total_av_out }))} margin={{ top: 4, right: 4, left: 0, bottom: 32 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={t.gridStroke} vertical={false} />
                <XAxis dataKey="name" tick={{ ...ts, fontSize: 8 }} axisLine={false} tickLine={false} angle={-25} textAnchor="end" height={40} />
                <YAxis tick={ts} axisLine={false} tickLine={false} width={30} />
                <Tooltip content={<CT theme={theme} />} />
                <Bar dataKey="av_in"  name="Av-In"  fill="#3b82f6" radius={[2,2,0,0]} maxBarSize={16} />
                <Bar dataKey="ec"     name="EC"     fill="#10b981" radius={[2,2,0,0]} maxBarSize={16} />
                <Bar dataKey="av_out" name="Av-Out" fill="#f59e0b" radius={[2,2,0,0]} maxBarSize={16} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div style={{ border: `1px solid ${t.border}`, borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '10px 14px', borderBottom: `1px solid ${t.border}`, fontSize: 11, fontWeight: 700, color: t.text, fontFamily: 'IBM Plex Mono,monospace' }}>Detail per Tipe Outlet</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'IBM Plex Mono,monospace' }}>
            <thead>
              <tr style={{ background: t.tableHeadBg }}>
                {['Tipe Outlet','Plan','Av-Out','Achievement','Av-In','EC','Actual','Outlet'].map((h, i) => (
                  <th key={i} style={{ padding: '7px 12px', textAlign: i === 0 ? 'left' : 'right', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: t.tableHeadText, borderBottom: `1px solid ${t.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cov.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: '24px', textAlign: 'center', color: t.textMuted, fontSize: 11 }}>Belum ada data</td></tr>
              ) : cov.map((r, i) => (
                <tr key={i}
                  style={{ background: i % 2 === 1 ? t.rowAlt : 'transparent' }}
                  onMouseEnter={e => (e.currentTarget.style.background = t.rowHover)}
                  onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 1 ? t.rowAlt : 'transparent')}>
                  <td style={{ padding: '7px 12px', fontSize: 11, fontWeight: 600, color: t.text }}>{r.outlet_type || '—'}</td>
                  <td style={{ padding: '7px 12px', fontSize: 11, color: t.textSub, textAlign: 'right' }}>{fmtN(r.total_plan)}</td>
                  <td style={{ padding: '7px 12px', fontSize: 11, fontWeight: 700, color: t.text, textAlign: 'right' }}>{fmtN(r.total_av_out)}</td>
                  <td style={{ padding: '7px 12px', textAlign: 'right' }}><AchBadge pct={r.achievement_pct} theme={theme} /></td>
                  <td style={{ padding: '7px 12px', fontSize: 11, color: '#3b82f6', textAlign: 'right' }}>{fmtN(r.total_av_in)}</td>
                  <td style={{ padding: '7px 12px', fontSize: 11, color: '#10b981', textAlign: 'right' }}>{fmtN(r.total_ec)}</td>
                  <td style={{ padding: '7px 12px', fontSize: 11, color: t.textSub, textAlign: 'right' }}>{fmtN(r.total_actual)}</td>
                  <td style={{ padding: '7px 12px', fontSize: 10, color: t.textSub, textAlign: 'right' }}>
                    {r.outlet_count > 0 ? fmtN(r.outlet_count) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {salesmen.length > 0 && weeks.length > 0 && (
        <div style={{ border: `1px solid ${t.border}`, borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ padding: '10px 14px', borderBottom: `1px solid ${t.border}`, fontSize: 11, fontWeight: 700, color: t.text, fontFamily: 'IBM Plex Mono,monospace' }}>
            Heatmap Achievement — Salesman × Minggu
          </div>
          <div style={{ overflowX: 'auto', padding: '12px 14px' }}>
            <table style={{ borderCollapse: 'collapse', fontFamily: 'IBM Plex Mono,monospace', fontSize: 9 }}>
              <thead>
                <tr>
                  <th style={{ padding: '4px 10px', textAlign: 'left', color: t.tableHeadText, fontWeight: 700, minWidth: 120, whiteSpace: 'nowrap' }}>Salesman</th>
                  {weeks.map(w => (
                    <th key={w} style={{ padding: '4px 6px', textAlign: 'center', color: t.tableHeadText, fontWeight: 700, minWidth: 44 }}>{w}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {salesmen.map(sal => (
                  <tr key={sal}>
                    <td style={{ padding: '4px 10px', color: t.text, fontWeight: 600, whiteSpace: 'nowrap' }}>{sal}</td>
                    {weeks.map(w => {
                      const cell = heatMap.get(`${sal}||${w}`);
                      const pct  = cell ? parseFloat(String(cell.achievement_pct ?? 0)) : null;
                      const bg   = pct === null ? t.inputBg
                                 : pct >= 100 ? 'rgba(16,185,129,0.22)'
                                 : pct >= 80  ? 'rgba(245,158,11,0.18)'
                                 :              'rgba(239,68,68,0.15)';
                      const clr  = pct === null ? t.textFaint : achColor(pct);
                      return (
                        <td key={w}
                          title={pct !== null ? `${sal} ${w}: ${pct.toFixed(1)}%` : `${sal} ${w}: —`}
                          style={{ padding: '4px 6px', textAlign: 'center', background: bg, borderRadius: 4 }}>
                          <span style={{ fontSize: 9, fontWeight: 700, color: clr }}>
                            {pct !== null ? `${Math.round(pct)}%` : '—'}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '6px 14px 10px', display: 'flex', gap: 12, fontSize: 9, fontFamily: 'IBM Plex Mono,monospace', color: t.textMuted }}>
            {[
              { clr: 'rgba(16,185,129,0.22)', txt: '≥100%' },
              { clr: 'rgba(245,158,11,0.18)', txt: '80–99%' },
              { clr: 'rgba(239,68,68,0.15)',  txt: '<80%'   },
            ].map(({ clr, txt }) => (
              <div key={txt} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 12, height: 12, borderRadius: 3, background: clr }} />
                <span>{txt}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── BARU: Miss EC Content ────────────────────────────────────────────────────
function MissDistContent({ data, theme }: { data: DistData; theme: Theme }) {
  const t    = tk[theme];
  const rows = data.missDistribusi ?? [];

  const bySalesman = useMemo(() => {
    const m = new Map<string, { salesman: string; count: number; total_actual: number }>();
    rows.forEach(r => {
      const ex = m.get(r.salesman);
      if (!ex) m.set(r.salesman, { salesman: r.salesman, count: 1, total_actual: r.total_actual });
      else { ex.count += 1; ex.total_actual += r.total_actual; }
    });
    return Array.from(m.values()).sort((a, b) => b.count - a.count);
  }, [rows]);

  const ts = { fontSize: 8, fill: t.textMuted, fontFamily: 'IBM Plex Mono,monospace' };

  if (rows.length === 0) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center', color: t.textMuted, fontSize: 12,
        fontFamily: 'IBM Plex Mono,monospace', display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 10 }}>
        <CheckCircle size={28} color={t.posText} />
        <div>
          <div style={{ fontWeight: 700, color: t.posText, marginBottom: 4 }}>Tidak ada Miss Distribusi</div>
          <div style={{ fontSize: 11 }}>Semua outlet yang dikunjungi sudah mendapat distribusi (Av-Out &gt; 0).</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Konteks */}
      <div style={{ padding: '10px 14px', borderRadius: 8, background: t.negBg,
        border: `1px solid ${t.negBorder}`, fontSize: 10,
        fontFamily: 'IBM Plex Mono,monospace', color: t.negText,
        display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <AlertCircle size={12} style={{ flexShrink: 0, marginTop: 1 }} />
        <span>
          <b>{rows.length} outlet</b> dikunjungi (Actual ≥ 1) tapi tidak ada distribusi (Av-Out = 0).
          Outlet sudah terjangkau namun produk tidak masuk outlet.
        </span>
      </div>

      {/* Bar chart per salesman */}
      {bySalesman.length > 0 && (
        <div style={{ background: t.accordionBg, border: `1px solid ${t.border}`,
          borderRadius: 10, padding: '12px 14px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: t.text,
            fontFamily: 'IBM Plex Mono,monospace', marginBottom: 10 }}>
            Jumlah Outlet Miss Distribusi per Salesman
          </div>
          <ResponsiveContainer width="100%" height={Math.min(220, bySalesman.length * 32 + 20)}>
            <BarChart data={bySalesman.slice(0, 10)} layout="vertical"
              margin={{ top: 0, right: 40, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.gridStroke} horizontal={false} />
              <XAxis type="number" tick={ts} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="salesman"
                tick={{ ...ts, fontSize: 9 }} axisLine={false} tickLine={false} width={110} />
              <Tooltip content={<CT theme={theme} />} />
              <Bar dataKey="count" name="Outlet Miss Distribusi"
                fill="#ef4444" opacity={0.8} radius={[0,3,3,0]} maxBarSize={12}>
                {bySalesman.map((_, i) => <Cell key={i} fill="#ef4444" />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Tabel detail */}
      <div style={{ border: `1px solid ${t.border}`, borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '10px 14px', borderBottom: `1px solid ${t.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: t.text,
            fontFamily: 'IBM Plex Mono,monospace' }}>
            Detail Outlet Miss Distribusi
          </span>
          <span style={{ fontSize: 10, color: t.textMuted, fontFamily: 'IBM Plex Mono,monospace' }}>
            {rows.length} outlet · diurutkan dari kunjungan terbanyak
          </span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse',
            fontFamily: 'IBM Plex Mono,monospace' }}>
            <thead>
              <tr style={{ background: t.tableHeadBg }}>
                {['#','Outlet','Salesman','Tipe','Kota · Kecamatan','Av-In','Actual','Av-Out'].map((h, i) => (
                  <th key={i} style={{
                    padding: '7px 12px', textAlign: i >= 5 ? 'right' : 'left',
                    fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
                    letterSpacing: '0.07em', color: t.tableHeadText,
                    borderBottom: `1px solid ${t.border}`, whiteSpace: 'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}
                  style={{ background: i % 2 === 1 ? t.rowAlt : 'transparent' }}
                  onMouseEnter={e => (e.currentTarget.style.background = t.rowHover)}
                  onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 1 ? t.rowAlt : 'transparent')}>
                  <td style={{ padding: '7px 12px', fontSize: 10, color: t.textMuted }}>{i + 1}</td>
                  <td style={{ padding: '7px 12px', fontSize: 11, fontWeight: 600,
                    color: t.text, whiteSpace: 'nowrap' }}>{r.outlet || '—'}</td>
                  <td style={{ padding: '7px 12px', fontSize: 11,
                    color: t.textSub, whiteSpace: 'nowrap' }}>{r.salesman || '—'}</td>
                  <td style={{ padding: '7px 12px', fontSize: 10,
                    color: t.textMuted, whiteSpace: 'nowrap' }}>
                    <span style={{ padding: '1px 6px', borderRadius: 4,
                      background: t.inputBg, border: `1px solid ${t.border}` }}>
                      {r.outlet_type || '—'}
                    </span>
                  </td>
                  <td style={{ padding: '7px 12px', fontSize: 10,
                    color: t.textSub, whiteSpace: 'nowrap' }}>
                    {r.city || '—'} · {r.district || '—'}
                  </td>
                  <td style={{ padding: '7px 12px', fontSize: 11,
                    color: '#3b82f6', textAlign: 'right' }}>{fmtN(r.total_av_in)}</td>
                  <td style={{ padding: '7px 12px', fontSize: 11,
                    color: t.textSub, textAlign: 'right' }}>{fmtN(r.total_actual)}</td>
                  <td style={{ padding: '7px 12px', textAlign: 'right' }}>
                    <span style={{ padding: '2px 7px', borderRadius: 4, fontSize: 10,
                      fontWeight: 700, fontFamily: 'IBM Plex Mono,monospace',
                      background: t.negBg, color: t.negText,
                      border: `1px solid ${t.negBorder}` }}>
                      0
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '8px 12px', borderTop: `1px solid ${t.border}`,
          fontSize: 10, color: t.textMuted, fontFamily: 'IBM Plex Mono,monospace' }}>
          Av-In &gt; 0 = barang sempat masuk tapi Av-Out 0, cek rotasi stok ·
          Av-In = 0 = barang tidak pernah masuk outlet ini
        </div>
      </div>
    </div>
  );
}

// ─── Constants ────────────────────────────────────────────────────────────────
const EMPTY_DATA: DistData = {
  summary: {
    total_plan: 0, total_actual: 0, total_av_in: 0, total_ec: 0,
    total_av_out: 0, total_outlets: 0, total_salesmen: 0,
    total_products: 0, total_customers: 0, overall_achievement: 0,
  },
  achievementSalesman:       [],
  achievementProduct:        [],
  achievementArea:           [],
  trend:                     [],
  coverage:                  [],
  coverageSalesman:          [],
  outletCountByType:         [],
  outletCountByTypeSalesman: [],
  totalOutlets:              0,
  achievementAreaSalesman:   [],
  achievementAreaProduct:    [],
  achievementAreaOutletType: [],
  missDistribusi:            [],
  summaryPrevWeek:           undefined,
};

const WEEKS_ARR = Array.from({ length: 52 }, (_, i) => i + 1);

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DistributionSection({
  theme = 'dark',
  areas = [],
  areaFilter: areaFromPage = '',
  weekStart: weekStartProp = 1,
  weekEnd:   weekEndProp   = 52,
  onWeekStartChange,
  onWeekEndChange,
  cachedData,
  onDataLoaded,
  loaded    = false,
  loading   = false,
  onLoadingChange,
}: DistributionSectionProps) {
  const t = tk[theme];

  const weekStart    = weekStartProp;
  const weekEnd      = weekEndProp;
  const setWeekStart = onWeekStartChange ?? (() => {});
  const setWeekEnd   = onWeekEndChange   ?? (() => {});
  const setLoading   = onLoadingChange   ?? (() => {});
  const areaFilter   = areaFromPage;

  const [productFilter,    setProductFilter]    = useState('');
  const [outletTypeFilter, setOutletTypeFilter] = useState('');
  const [salesmanFilter,   setSalesmanFilter]   = useState('');

  useEffect(() => {
    setProductFilter('');
    setOutletTypeFilter('');
    setSalesmanFilter('');
  }, [areaFilter]);

  const resetFilters = useCallback(() => {
    setProductFilter('');
    setOutletTypeFilter('');
    setSalesmanFilter('');
  }, []);

  const productOptions = useMemo(() => {
    if (!cachedData) return [];
    return Array.from(
      new Set(cachedData.achievementProduct.map(r => r.product).filter(Boolean))
    ).sort() as string[];
  }, [cachedData]);

  const outletTypeOptions = useMemo(() => {
    if (!cachedData) return [];
    return Array.from(
      new Set(cachedData.outletCountByType.map(r => r.outlet_type).filter(Boolean))
    ).sort() as string[];
  }, [cachedData]);

  const salesmanOptions = useMemo(() => {
    if (!cachedData) return [];
    return Array.from(
      new Set(cachedData.achievementSalesman.map(r => r.salesman).filter(Boolean))
    ).sort() as string[];
  }, [cachedData]);

  const data = useMemo((): DistData => {
    const base = cachedData ?? EMPTY_DATA;
    return reaggregate(base, productFilter, outletTypeFilter, salesmanFilter);
  }, [cachedData, productFilter, outletTypeFilter, salesmanFilter]);

  const hasAreaFilterWarning = useMemo(() => {
    const hasFilter  = !!(productFilter || salesmanFilter);
    const hasSalData = (cachedData?.achievementAreaSalesman?.length ?? 0) > 0;
    return hasFilter && !hasSalData;
  }, [productFilter, salesmanFilter, cachedData]);

  const hasActiveFilter = !!(productFilter || outletTypeFilter || salesmanFilter);

  const loadData = useCallback(async () => {
    if (!areaFilter) return;
    setLoading(true);
    try {
      const p = new URLSearchParams({ weekStart: String(weekStart), weekEnd: String(weekEnd) });
      if (areaFilter) p.append('area', areaFilter);
      const r = await fetch(`/api/distribution?${p}`);
      if (r.ok) {
        const j = await r.json();
        if (j.success) {
          const raw = j.data;
          raw.summary = {
            ...raw.summary,
            total_plan:          parseFloat(raw.summary.total_plan          ?? 0),
            total_actual:        parseFloat(raw.summary.total_actual        ?? 0),
            total_av_in:         parseFloat(raw.summary.total_av_in         ?? 0),
            total_ec:            parseFloat(raw.summary.total_ec            ?? 0),
            total_av_out:        parseFloat(raw.summary.total_av_out        ?? 0),
            total_outlets:       parseFloat(raw.summary.total_outlets       ?? 0),
            total_salesmen:      parseFloat(raw.summary.total_salesmen      ?? 0),
            total_products:      parseFloat(raw.summary.total_products      ?? 0),
            total_customers:     parseFloat(raw.summary.total_customers     ?? 0),
            overall_achievement: parseFloat(raw.summary.overall_achievement ?? 0),
          };
          raw.achievementSalesman = normRows(raw.achievementSalesman);
          raw.achievementProduct  = normRows(raw.achievementProduct);
          raw.achievementArea     = normRows(raw.achievementArea);
          raw.coverage            = normRows(raw.coverage);
          raw.coverageSalesman    = raw.coverageSalesman.map((r: any) => ({
            ...r,
            plan:            parseFloat(r.plan            ?? 0),
            actual:          parseFloat(r.actual          ?? 0),
            av_in:           parseFloat(r.av_in           ?? 0),
            ec:              parseFloat(r.ec              ?? 0),
            av_out:          parseFloat(r.av_out          ?? 0),
            achievement_pct: parseFloat(r.achievement_pct ?? 0),
          }));
          raw.achievementAreaProduct = (raw.achievementAreaProduct ?? []).map((r: any) => ({
            ...r,
            total_plan:      parseFloat(r.total_plan      ?? 0),
            total_actual:    parseFloat(r.total_actual    ?? 0),
            total_av_out:    parseFloat(r.total_av_out    ?? 0),
            achievement_pct: parseFloat(r.achievement_pct ?? 0),
            outlet_count:    parseInt(r.outlet_count      ?? 0),
          }));
          raw.achievementAreaOutletType = (raw.achievementAreaOutletType ?? []).map((r: any) => ({
            ...r,
            total_plan:      parseFloat(r.total_plan      ?? 0),
            total_actual:    parseFloat(r.total_actual    ?? 0),
            total_av_out:    parseFloat(r.total_av_out    ?? 0),
            achievement_pct: parseFloat(r.achievement_pct ?? 0),
            outlet_count:    parseInt(r.outlet_count      ?? 0),
          }));
          raw.trend = raw.trend.map((r: any) => ({
            ...r,
            total_plan:    parseFloat(r.total_plan    ?? 0),
            total_actual:  parseFloat(r.total_actual  ?? 0),
            total_av_in:   parseFloat(r.total_av_in   ?? 0),
            total_ec:      parseFloat(r.total_ec      ?? 0),
            total_av_out:  parseFloat(r.total_av_out  ?? 0),
            outlet_count:  parseFloat(r.outlet_count  ?? 0),
          }));
          raw.outletCountByType = (raw.outletCountByType ?? []).map((r: any) => ({
            outlet_type:  r.outlet_type,
            outlet_count: parseInt(r.outlet_count ?? 0),
          }));
          raw.totalOutlets = parseInt(raw.totalOutlets ?? 0);
          raw.achievementAreaSalesman = (raw.achievementAreaSalesman ?? []).map((r: any) => ({
            ...r,
            total_plan:      parseFloat(r.total_plan      ?? 0),
            total_actual:    parseFloat(r.total_actual    ?? 0),
            total_av_out:    parseFloat(r.total_av_out    ?? 0),
            achievement_pct: parseFloat(r.achievement_pct ?? 0),
            outlet_count:    parseInt(r.outlet_count      ?? 0),
          }));
          raw.outletCountByTypeSalesman = (raw.outletCountByTypeSalesman ?? []).map((r: any) => ({
            salesman:     r.salesman,
            outlet_type:  r.outlet_type,
            outlet_count: parseInt(r.outlet_count ?? 0),
          }));
          // ── Normalize missDistribusi ───────────────────────────────────────────────
          raw.missDistribusi = (raw.missDistribusi ?? []).map((r: any) => ({
            outlet:       r.outlet      ?? '',
            salesman:     r.salesman    ?? '',
            city:         r.city        ?? '',
            district:     r.district    ?? '',
            outlet_type:  r.outlet_type ?? '',
            total_actual: parseFloat(r.total_actual ?? 0),
            total_ec:     parseFloat(r.total_ec     ?? 0),
            total_av_in:  parseFloat(r.total_av_in  ?? 0),
            total_av_out: parseFloat(r.total_av_out ?? 0),
          }));
          // ── Normalize summaryPrevWeek (jika ada) ───────────────────────────
          if (raw.summaryPrevWeek) {
            raw.summaryPrevWeek = {
              total_plan:          parseFloat(raw.summaryPrevWeek.total_plan          ?? 0),
              total_actual:        parseFloat(raw.summaryPrevWeek.total_actual        ?? 0),
              total_av_in:         parseFloat(raw.summaryPrevWeek.total_av_in         ?? 0),
              total_ec:            parseFloat(raw.summaryPrevWeek.total_ec            ?? 0),
              total_av_out:        parseFloat(raw.summaryPrevWeek.total_av_out        ?? 0),
              total_outlets:       parseFloat(raw.summaryPrevWeek.total_outlets       ?? 0),
              overall_achievement: parseFloat(raw.summaryPrevWeek.overall_achievement ?? 0),
            };
          }

          resetFilters();
          onDataLoaded?.(raw);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [weekStart, weekEnd, areaFilter, resetFilters]);

  const s        = data.summary;
  const prev     = data.summaryPrevWeek;
  const areaName = areas.find(a => a.id === areaFilter)?.name;

  const selectStyle = (active: boolean) => ({
    height: 26, padding: '0 6px',
    background: active ? t.tabActive : t.inputBg,
    border: `1px solid ${active ? '#1c9706' : t.inputBorder}`,
    borderRadius: 5, color: active ? t.tabActiveText : t.text,
    fontSize: 10, fontFamily: 'IBM Plex Mono,monospace',
    outline: 'none', maxWidth: 160, transition: 'all 0.15s',
  });

  const clearBtnStyle = {
    height: 26, width: 26, borderRadius: 5,
    background: t.negBg, border: `1px solid ${t.negBorder}`,
    color: t.negText, fontSize: 14, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'IBM Plex Mono,monospace', flexShrink: 0,
  } as const;

  const divider    = <div style={{ width: 1, height: 16, background: t.border, margin: '0 2px' }} />;
  const labelStyle = { fontSize: 9, color: t.textMuted, fontFamily: 'IBM Plex Mono,monospace' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontFamily: 'IBM Plex Sans,sans-serif' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: t.text, fontFamily: 'IBM Plex Mono,monospace' }}>Distribusi</div>
          <div style={{ fontSize: 10, color: t.textMuted, fontFamily: 'IBM Plex Mono,monospace', marginTop: 2 }}>
            Achievement = Av-Out / Plan
            {areaName && (
              <span style={{ marginLeft: 8, padding: '1px 6px', borderRadius: 4, background: t.tabBg, color: t.textSub, fontSize: 9 }}>
                Area: {areaName}
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={labelStyle}>Minggu</span>
          <select value={weekStart} onChange={e => setWeekStart(+e.target.value)}
            style={{ height: 26, padding: '0 6px', background: t.inputBg, border: `1px solid ${t.inputBorder}`, borderRadius: 5, color: t.text, fontSize: 10, fontFamily: 'IBM Plex Mono,monospace', outline: 'none' }}>
            {WEEKS_ARR.map(w => <option key={w} value={w} style={{ background: t.selectBg }}>W{w}</option>)}
          </select>
          <span style={labelStyle}>—</span>
          <select value={weekEnd} onChange={e => setWeekEnd(+e.target.value)}
            style={{ height: 26, padding: '0 6px', background: t.inputBg, border: `1px solid ${t.inputBorder}`, borderRadius: 5, color: t.text, fontSize: 10, fontFamily: 'IBM Plex Mono,monospace', outline: 'none' }}>
            {WEEKS_ARR.map(w => <option key={w} value={w} style={{ background: t.selectBg }}>W{w}</option>)}
          </select>

          {loaded && productOptions.length > 0 && (
            <>
              {divider}
              <span style={labelStyle}>Produk</span>
              <select value={productFilter} onChange={e => setProductFilter(e.target.value)} style={selectStyle(!!productFilter)}>
                <option value="" style={{ background: t.selectBg }}>Semua Produk</option>
                {productOptions.map(p => <option key={p} value={p} style={{ background: t.selectBg }}>{p}</option>)}
              </select>
              {productFilter && (
                <button onClick={() => setProductFilter('')} title="Reset filter produk" style={clearBtnStyle}>×</button>
              )}
            </>
          )}

          {loaded && outletTypeOptions.length > 0 && (
            <>
              {divider}
              <span style={labelStyle}>Tipe Outlet</span>
              <select value={outletTypeFilter} onChange={e => setOutletTypeFilter(e.target.value)} style={selectStyle(!!outletTypeFilter)}>
                <option value="" style={{ background: t.selectBg }}>Semua Tipe</option>
                {outletTypeOptions.map(o => <option key={o} value={o} style={{ background: t.selectBg }}>{o}</option>)}
              </select>
              {outletTypeFilter && (
                <button onClick={() => setOutletTypeFilter('')} title="Reset filter tipe outlet" style={clearBtnStyle}>×</button>
              )}
            </>
          )}

          {loaded && salesmanOptions.length > 0 && (
            <>
              {divider}
              <span style={labelStyle}>Salesman</span>
              <select value={salesmanFilter} onChange={e => setSalesmanFilter(e.target.value)} style={selectStyle(!!salesmanFilter)}>
                <option value="" style={{ background: t.selectBg }}>Semua Salesman</option>
                {salesmanOptions.map(s => <option key={s} value={s} style={{ background: t.selectBg }}>{s}</option>)}
              </select>
              {salesmanFilter && (
                <button onClick={() => setSalesmanFilter('')} title="Reset filter salesman" style={clearBtnStyle}>×</button>
              )}
            </>
          )}

          <button onClick={loadData} disabled={loading}
            style={{ height: 26, padding: '0 12px', borderRadius: 5, background: '#1c9706', border: 'none', color: '#fff', fontSize: 10, fontWeight: 700, fontFamily: 'IBM Plex Mono,monospace', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: 5 }}>
            {loading && <RefreshCw size={11} style={{ animation: 'spin 1s linear infinite' }} />}
            {loading ? 'Memuat...' : 'Terapkan'}
          </button>
        </div>
      </div>

      {/* ── Filter aktif banner ── */}
      {loaded && hasActiveFilter && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap',
          padding: '6px 12px', borderRadius: 8,
          background: t.tabActive, border: `1px solid rgba(28,151,6,0.2)`,
          fontSize: 10, fontFamily: 'IBM Plex Mono,monospace', color: t.tabActiveText,
        }}>
          <Activity size={11} />
          <span style={{ color: t.textSub }}>Filter aktif:</span>
          {productFilter    && <FilterBadge label="Produk"      value={productFilter}    onClear={() => setProductFilter('')}    theme={theme} />}
          {outletTypeFilter && <FilterBadge label="Tipe Outlet" value={outletTypeFilter} onClear={() => setOutletTypeFilter('')} theme={theme} />}
          {salesmanFilter   && <FilterBadge label="Salesman"    value={salesmanFilter}   onClear={() => setSalesmanFilter('')}   theme={theme} />}
          <button onClick={resetFilters} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: t.textMuted, cursor: 'pointer', fontSize: 11, padding: '0 4px', fontFamily: 'IBM Plex Mono,monospace' }}>
            Reset Semua
          </button>
        </div>
      )}

      {/* ── Belum dimuat ── */}
      {!loaded && !loading && (
        <div style={{ padding: '32px', textAlign: 'center', background: t.cardBg, border: `1px solid ${t.borderCard}`, borderRadius: 12, color: t.textMuted, fontSize: 12, fontFamily: 'IBM Plex Mono,monospace', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <Target size={28} color={t.textFaint} />
          <div>
            <div style={{ fontWeight: 700, color: t.textSub, marginBottom: 4 }}>Data belum dimuat</div>
            <div style={{ fontSize: 11 }}>Atur filter minggu di atas lalu klik <b style={{ color: t.text }}>Terapkan</b> untuk memuat data distribusi.</div>
          </div>
        </div>
      )}

      {loaded && (
        <>
          {/* ── BARU: Funnel di atas KPI cards ── */}
          <DistributionFunnel summary={s} theme={theme} />

          {/* ── KPI Cards dengan WoW delta ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
            <KpiCard
              label="Total Plan" value={fmtN(s.total_plan)} sub="Plan distribusi"
              icon={ClipboardList} color="#3b82f6" theme={theme}
              wowCurrent={s.total_plan} wowPrev={prev?.total_plan}
            />
            <KpiCard
              label="Total Actual" value={fmtN(s.total_actual)} sub="Aktual distribusi"
              icon={ClipboardCheck} color="#10b981" theme={theme}
              wowCurrent={s.total_actual} wowPrev={prev?.total_actual}
            />
            <KpiCard
              label="Total Av-In" value={fmtN(s.total_av_in)} sub="Av-In"
              icon={Download} color="#3b82f6" theme={theme}
              wowCurrent={s.total_av_in} wowPrev={prev?.total_av_in}
            />
            <KpiCard
              label="EC" value={fmtN(s.total_ec)} sub="Effective Call"
              icon={TrendingUp} color="#0d9488" theme={theme}
              wowCurrent={s.total_ec} wowPrev={prev?.total_ec}
            />
            <KpiCard
              label="Total Av-Out" value={fmtN(s.total_av_out)} sub="Av-Out"
              icon={CheckCircle} color="#10b981" theme={theme}
              wowCurrent={s.total_av_out} wowPrev={prev?.total_av_out}
            />
            <KpiCard
              label="Total Outlet" value={fmtN(s.total_outlets)} sub="Outlet terjangkau"
              icon={Store} color="#3b82f6" theme={theme}
              wowCurrent={s.total_outlets} wowPrev={prev?.total_outlets}
            />
            <KpiCard
              label="Total Salesman" value={fmtN(s.total_salesmen)} sub="Salesman aktif"
              icon={Users} color="#8b5cf6" theme={theme}
            />
            <KpiCard
              label="Total Produk" value={fmtN(s.total_products)} sub="terdistribusi"
              icon={Package} color="#f59e0b" theme={theme}
            />
            <KpiCard
              label="Overall Achievement" value={`${s.overall_achievement.toFixed(1)}%`} sub="Av-Out / Plan"
              icon={Target} color={achColor(s.overall_achievement)} theme={theme}
              wowCurrent={s.overall_achievement} wowPrev={prev?.overall_achievement}
            />
          </div>

          {/* ── Tabs ── */}
          <DistributionTabs
            data={data}
            theme={theme}
            hasAreaFilterWarning={hasAreaFilterWarning}
            onReload={loadData}
          />
        </>
      )}
    </div>
  );
}