'use client';

import { useMemo, useState } from 'react';
import {
  LineChart, Line, BarChart, Bar,
  ResponsiveContainer, Cell, Tooltip,
  XAxis, YAxis,
  PieChart as RechartsPieChart, Pie,
} from 'recharts';

type Theme = 'dark' | 'light';

const tk = {
  dark: {
    bg:            '#0e1118',
    bgSub:         '#07090e',
    bgRow:         '#0e1118',
    border:        'rgba(255,255,255,0.07)',
    text:          'rgba(255,255,255,0.92)',
    textSub:       'rgba(255,255,255,0.52)',
    textMuted:     'rgba(255,255,255,0.28)',
    headerBg:      'rgba(255,255,255,0.03)',
    headerText:    'rgba(255,255,255,0.35)',
    rowHover:      'rgba(255,255,255,0.03)',
    rowAlt:        'rgba(255,255,255,0.01)',
    tooltipBg:     '#13161f',
    tooltipBorder: 'rgba(255,255,255,0.09)',
    posBg: 'rgba(16,185,129,0.1)',  posText: '#34d399', posBorder: 'rgba(16,185,129,0.2)',
    negBg: 'rgba(239,68,68,0.1)',   negText: '#f87171', negBorder: 'rgba(239,68,68,0.2)',
    pill1bg: 'rgba(59,130,246,0.14)', pill1text: '#93c5fd',
    pill2bg: 'rgba(16,185,129,0.12)', pill2text: '#6ee7b7',
    divider: 'rgba(255,255,255,0.04)',
    tabBg: 'rgba(255,255,255,0.04)', tabActive: 'rgba(28,151,6,0.16)', tabActiveText: '#4ade80',
    footerBg: 'rgba(255,255,255,0.02)',
    inputBg: 'rgba(255,255,255,0.05)',
  },
  light: {
    bg:            '#ffffff',
    bgSub:         '#f8fafc',
    bgRow:         '#ffffff',
    border:        'rgba(0,0,0,0.09)',
    text:          '#0f172a',
    textSub:       '#475569',
    textMuted:     '#94a3b8',
    headerBg:      '#f1f5f9',
    headerText:    '#475569',
    rowHover:      '#f8fafc',
    rowAlt:        '#fafbfc',
    tooltipBg:     '#ffffff',
    tooltipBorder: 'rgba(0,0,0,0.12)',
    posBg: '#f0fdf4', posText: '#15803d', posBorder: '#bbf7d0',
    negBg: '#fef2f2', negText: '#b91c1c', negBorder: '#fecaca',
    pill1bg: 'rgba(37,99,235,0.08)',  pill1text: '#1d4ed8',
    pill2bg: 'rgba(22,163,74,0.08)',  pill2text: '#15803d',
    divider: 'rgba(0,0,0,0.07)',
    tabBg: '#f1f5f9', tabActive: 'rgba(28,151,6,0.1)', tabActiveText: '#15803d',
    footerBg: '#f8fafc',
    inputBg: '#f1f5f9',
  },
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtFull = (v: number) => v.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
const fmtU    = (v: number) => v.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const fmtPct  = (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`;
const achClr  = (p: number) => p >= 100 ? '#10b981' : p >= 80 ? '#f59e0b' : '#ef4444';
const COLORS  = ['#3b82f6','#10b981','#f59e0b','#8b5cf6','#ef4444','#0d9488','#f97316','#ec4899','#06b6d4','#84cc16','#a78bfa','#fb923c'];

function getDetailActual(d: any, unit: string): number {
  const ud = d[unit] as { target?: number; actual?: number } | undefined;
  if (ud?.actual !== undefined && ud.actual !== null) return ud.actual;
  return 0;
}
function getDetailTarget(d: any, unit: string): number {
  const ud = d[unit] as { target?: number; actual?: number } | undefined;
  if (ud?.target !== undefined && ud.target !== null) return ud.target;
  return 0;
}

interface ProductRow {
  product: string; color: string;
  trendData: { w: number; v: number; p: number }[];
  volPrev: number; volCurr: number; volGrowth: number;
  target: number; actual: number; achPct: number;
  qData: { q: string; prev: number; curr: number }[];
  l4wAvg: number; c1wVal: number; l4wGrowth: number;
}

// ─── Sparkline ────────────────────────────────────────────────────────────────
function Sparkline({ data, color, theme }: { data: { w: number; v: number; p: number }[]; color: string; theme: Theme }) {
  const t = tk[theme];
  if (!data.length) return (
    <div style={{ width: 273, height: 104, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.textMuted, fontSize: 9, fontFamily: 'IBM Plex Mono,monospace' }}>—</div>
  );
  return (
    <div style={{ width: 273, height: 104 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
          <XAxis dataKey="w" hide />
          <YAxis hide />
          <Tooltip
            cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: '3 3', opacity: 0.4 }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const curr = payload.find((p: any) => p.dataKey === 'v');
              const prev = payload.find((p: any) => p.dataKey === 'p');
              return (
                <div style={{ background: t.tooltipBg, border: `1px solid ${t.tooltipBorder}`, borderRadius: 7, padding: '6px 10px', fontSize: 9, fontFamily: 'IBM Plex Mono,monospace', boxShadow: '0 4px 16px rgba(0,0,0,0.18)', zIndex: 99 }}>
                  <div style={{ color: t.textMuted, marginBottom: 5, fontSize: 8 }}>Minggu {label}</div>
                  {curr && <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0 }} />
                    <span style={{ color: t.textSub, minWidth: 28 }}>Curr</span>
                    <span style={{ fontWeight: 800, color: t.text }}>{fmtU(curr.value as number)}</span>
                  </div>}
                  {prev && prev.value !== 0 && <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: `${color}55`, flexShrink: 0 }} />
                    <span style={{ color: t.textSub, minWidth: 28 }}>Prev</span>
                    <span style={{ fontWeight: 800, color: t.text }}>{fmtU(prev.value as number)}</span>
                  </div>}
                </div>
              );
            }}
          />
          <Line type="monotone" dataKey="p" stroke={`${color}40`} strokeWidth={1.2} dot={false} isAnimationActive={false} strokeDasharray="3 2" />
          <Line type="monotone" dataKey="v" stroke={color}        strokeWidth={2}   dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Donut Achievement ────────────────────────────────────────────────────────
function AchDonut({ pct, actual, target, theme, size = 99 }: { pct: number; actual: number; target: number; theme: Theme; size?: number }) {
  const t   = tk[theme];
  const clr = achClr(pct);
  const pie = [
    { name: 'Actual', value: Math.min(pct, 100),    fill: clr },
    { name: 'Gap',    value: Math.max(0, 100 - pct), fill: 'rgba(128,128,128,0.1)' },
  ];
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPieChart>
          <Pie data={pie} cx="50%" cy="50%" innerRadius="46%" outerRadius="84%"
            dataKey="value" paddingAngle={1} strokeWidth={0} startAngle={90} endAngle={-270}>
            {pie.map((d, i) => <Cell key={i} fill={d.fill} />)}
          </Pie>
          <Tooltip content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            return (
              <div style={{ background: t.tooltipBg, border: `1px solid ${t.tooltipBorder}`, borderRadius: 7, padding: '6px 10px', fontSize: 9, fontFamily: 'IBM Plex Mono,monospace' }}>
                <div style={{ color: clr, fontWeight: 800, marginBottom: 3 }}>{pct.toFixed(1)}% ach.</div>
                <div style={{ color: t.textSub, marginBottom: 1 }}>Actual : <span style={{ fontWeight: 700, color: t.text }}>{fmtFull(actual)}</span></div>
                <div style={{ color: t.textSub }}>Target : <span style={{ fontWeight: 700, color: t.textMuted }}>{fmtFull(target)}</span></div>
              </div>
            );
          }} />
        </RechartsPieChart>
      </ResponsiveContainer>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
        <span style={{ fontSize: 15, fontWeight: 800, fontFamily: 'IBM Plex Mono,monospace', color: clr, lineHeight: 1 }}>{Math.round(pct)}%</span>
      </div>
    </div>
  );
}

// ─── Kuartal Grouped Bar ──────────────────────────────────────────────────────
function QBarGroup({ qData, color, pL, cL, theme }: { qData: { q: string; prev: number; curr: number }[]; color: string; pL: string | number; cL: string | number; theme: Theme }) {
  const t = tk[theme];
  if (!qData.length) return <span style={{ fontSize: 9, color: t.textMuted, fontFamily: 'IBM Plex Mono,monospace' }}>—</span>;
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>
      {qData.map(q => {
        const growth  = q.prev > 0 ? ((q.curr - q.prev) / q.prev) * 100 : q.curr > 0 ? 100 : 0;
        const gClr    = growth >= 0 ? t.posText : t.negText;
        const hasPrev = q.prev > 0;
        const hasCurr = q.curr > 0;
        const hasAny  = hasPrev || hasCurr;
        const barData = [{ name: q.q, p1: q.prev, p2: q.curr }];
        return (
          <div key={q.q} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, minWidth: 91 }}>
            <span style={{ fontSize: 8, fontWeight: 700, fontFamily: 'IBM Plex Mono,monospace', color: hasAny ? gClr : t.textMuted }}>
              {hasAny ? fmtPct(growth) : '—'}
            </span>
            <div style={{ width: 91, height: 83 }}>
              {hasAny ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }} barGap={2} barCategoryGap="20%">
                    <Tooltip
                      cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        return (
                          <div style={{ background: t.tooltipBg, border: `1px solid ${t.tooltipBorder}`, borderRadius: 7, padding: '6px 10px', fontSize: 9, fontFamily: 'IBM Plex Mono,monospace' }}>
                            <div style={{ color: t.textMuted, marginBottom: 4, fontWeight: 700 }}>{q.q}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                              <span style={{ width: 7, height: 7, borderRadius: '50%', background: `${color}50`, flexShrink: 0 }} />
                              <span style={{ color: t.textSub }}>{pL}</span>
                              <span style={{ fontWeight: 800, color: t.text, marginLeft: 4 }}>{fmtFull(q.prev)}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0 }} />
                              <span style={{ color: t.textSub }}>{cL}</span>
                              <span style={{ fontWeight: 800, color: t.text, marginLeft: 4 }}>{fmtFull(q.curr)}</span>
                            </div>
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="p1" name={String(pL)} fill={`${color}40`} radius={[2,2,0,0]} maxBarSize={18} isAnimationActive={false} />
                    <Bar dataKey="p2" name={String(cL)} fill={color}        radius={[2,2,0,0]} maxBarSize={18} isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 4, paddingBottom: 2 }}>
                  <div style={{ width: 14, height: 4, background: `${color}20`, borderRadius: '2px 2px 0 0' }} />
                  <div style={{ width: 14, height: 4, background: `${color}20`, borderRadius: '2px 2px 0 0' }} />
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
              <span style={{ fontSize: 7, fontFamily: 'IBM Plex Mono,monospace', color: hasPrev ? t.textSub : t.textMuted }}>{fmtFull(q.prev)}</span>
              <span style={{ fontSize: 7, color: t.textMuted }}>·</span>
              <span style={{ fontSize: 7, fontFamily: 'IBM Plex Mono,monospace', color: hasCurr ? color : t.textMuted }}>{fmtFull(q.curr)}</span>
            </div>
            <span style={{ fontSize: 7.5, fontWeight: 700, fontFamily: 'IBM Plex Mono,monospace', color: t.textMuted }}>{q.q}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── L4W vs C1W Cell ─────────────────────────────────────────────────────────
function L4WCell({ l4w, c1w, color, theme }: { l4w: number; c1w: number; color: string; theme: Theme }) {
  const t      = tk[theme];
  const growth = l4w > 0 ? ((c1w - l4w) / l4w) * 100 : 0;
  const gClr   = growth >= 0 ? t.posText : t.negText;
  const maxV   = Math.max(l4w, c1w, 1);
  const BAR_H  = 78;

  if (l4w === 0 && c1w === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', paddingLeft: 4 }}>
        <span style={{ fontSize: 10, color: t.textMuted, fontFamily: 'IBM Plex Mono,monospace' }}>—</span>
      </div>
    );
  }

  const bars = [{ label: 'L4W', val: l4w, c: `${color}44` }, { label: 'C1W', val: c1w, c: color }];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 3, paddingLeft: 4 }}>
      <span style={{ fontSize: 8, fontWeight: 700, fontFamily: 'IBM Plex Mono,monospace', color: gClr }}>{fmtPct(growth)}</span>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
        {bars.map((b, i) => {
          const h = Math.max(4, Math.round((b.val / maxV) * BAR_H));
          return (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <span style={{ fontSize: 8, fontWeight: 700, fontFamily: 'IBM Plex Mono,monospace', color: i === 1 ? color : t.textMuted }}>{fmtFull(b.val)}</span>
              <div style={{ width: 36, height: h, background: b.c, borderRadius: '3px 3px 0 0' }} />
              <span style={{ fontSize: 7.5, fontFamily: 'IBM Plex Mono,monospace', color: t.textMuted }}>{b.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Vol Badge ────────────────────────────────────────────────────────────────
function VolBadge({ label, val, color, theme }: { label: string; val: number; color: string; theme: Theme }) {
  const t = tk[theme];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 8px', borderRadius: 5, background: `${color}10`, border: `1px solid ${color}25` }}>
      <div style={{ width: 5, height: 5, borderRadius: 1, background: color, flexShrink: 0 }} />
      <span style={{ fontSize: 8, fontWeight: 700, fontFamily: 'IBM Plex Mono,monospace', color, letterSpacing: '0.04em' }}>{label}</span>
      <span style={{ fontSize: 10.5, fontWeight: 800, fontFamily: 'IBM Plex Mono,monospace', color }}>{fmtFull(val)}</span>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
interface AnalysisSectionProps { data?: any; theme?: Theme }

export default function AnalysisSection({ data, theme = 'dark' }: AnalysisSectionProps) {
  const t = tk[theme];
  const [sortBy, setSortBy] = useState<'vol' | 'growth' | 'ach'>('vol');
  const [search,  setSearch]  = useState('');

  const rows: ProductRow[] = useMemo(() => {
    const wc: any[]         = data?.weekComparisons            ?? [];
    const qd: any[]         = data?.quarterlyData              ?? [];
    const l4wDetails: any[] = data?.l4wc4wData?.productDetails ?? [];

    const l4wMap = new Map<string, { l4w: number; c1w: number }>();
    l4wDetails.forEach((pd: any) => {
      if (!pd.product) return;
      l4wMap.set(pd.product, { l4w: pd.units_dos?.l4w ?? 0, c1w: pd.units_dos?.c1w ?? 0 });
    });

    if (!wc.length) return [];

    const weekMap = new Map<string, Map<number, { prev: number; curr: number }>>();
    wc.forEach((w: any) => {
      const week = w.week as number;
      (w.details ?? []).forEach((d: any) => {
        const prod = d.product as string | undefined;
        if (!prod) return;
        if (!weekMap.has(prod)) weekMap.set(prod, new Map());
        const wm = weekMap.get(prod)!;
        const ex = wm.get(week) ?? { prev: 0, curr: 0 };
        wm.set(week, {
          prev: ex.prev + (d.units_dos?.previous ?? d.previousYear ?? 0),
          curr: ex.curr + (d.units_dos?.current  ?? d.currentYear  ?? 0),
        });
      });
    });
    if (!weekMap.size) return [];

    const productYTD = new Map<string, { target: number; actual: number }>();
    const qActualMap = new Map<string, Map<string, number>>();

    qd.forEach((q: any) => {
      const qName      = q.quarter as string;
      const qHasTarget = (q.target ?? 0) > 0;
      (q.details ?? []).forEach((d: any) => {
        const prod = d.product as string | undefined;
        if (!prod) return;
        if (!productYTD.has(prod)) productYTD.set(prod, { target: 0, actual: 0 });
        const ytd = productYTD.get(prod)!;
        const act = getDetailActual(d, 'units_dos');
        ytd.actual += act;
        if (qHasTarget) ytd.target += getDetailTarget(d, 'units_dos');
        if (!qActualMap.has(prod)) qActualMap.set(prod, new Map());
        qActualMap.get(prod)!.set(qName, (qActualMap.get(prod)!.get(qName) ?? 0) + act);
      });
    });

    const qPrevMap = new Map<string, Map<string, number>>();
    wc.forEach((w: any) => {
      const qName = `Q${Math.min(4, Math.ceil((w.week as number) / 13))}`;
      (w.details ?? []).forEach((d: any) => {
        const prod = d.product as string | undefined;
        if (!prod) return;
        const prev = d.units_dos?.previous ?? d.previousYear ?? 0;
        if (!qPrevMap.has(prod)) qPrevMap.set(prod, new Map());
        qPrevMap.get(prod)!.set(qName, (qPrevMap.get(prod)!.get(qName) ?? 0) + prev);
      });
    });

    const allQNames = Array.from(new Set([
      ...Array.from(qActualMap.values()).flatMap(m => Array.from(m.keys())),
      ...Array.from(qPrevMap.values()).flatMap(m => Array.from(m.keys())),
    ])).sort();

    const result: ProductRow[] = [];
    let ci = 0;

    weekMap.forEach((wm, product) => {
      const color     = COLORS[ci % COLORS.length]; ci++;
      const sorted    = Array.from(wm.entries()).sort((a, b) => a[0] - b[0]);
      const trendData = sorted.map(([w, v]) => ({ w, v: v.curr, p: v.prev }));
      const volPrev   = sorted.reduce((s, [, v]) => s + v.prev, 0);
      const volCurr   = sorted.reduce((s, [, v]) => s + v.curr, 0);
      const volGrowth = volPrev > 0 ? ((volCurr - volPrev) / volPrev) * 100 : 0;

      const ytd    = productYTD.get(product);
      const target = ytd?.target ?? 0;
      const actual = ytd?.actual ?? volCurr;
      const achPct = target > 0 ? (actual / target) * 100 : 0;

      const qData = allQNames
        .map(qName => ({ q: qName, prev: qPrevMap.get(product)?.get(qName) ?? 0, curr: qActualMap.get(product)?.get(qName) ?? 0 }))
        .filter(q => q.prev > 0 || q.curr > 0);

      const l4wEntry  = l4wMap.get(product);
      const l4wAvg    = l4wEntry?.l4w ?? 0;
      const c1wVal    = l4wEntry?.c1w ?? 0;
      const l4wGrowth = l4wAvg > 0 ? ((c1wVal - l4wAvg) / l4wAvg) * 100 : 0;

      result.push({ product, color, trendData, volPrev, volCurr, volGrowth, target, actual, achPct, qData, l4wAvg, c1wVal, l4wGrowth });
    });

    return result;
  }, [data]);

  const displayed = useMemo(() => {
    let list = rows.filter(r => r.product.toLowerCase().includes(search.toLowerCase()));
    if (sortBy === 'vol')    list = [...list].sort((a, b) => b.volCurr - a.volCurr);
    if (sortBy === 'growth') list = [...list].sort((a, b) => b.volGrowth - a.volGrowth);
    if (sortBy === 'ach')    list = [...list].sort((a, b) => b.achPct - a.achPct);
    return list;
  }, [rows, sortBy, search]);

  const cy = data?.comparisonYears;
  const pL = cy?.previousYear ?? 'P1';
  const cL = cy?.currentYear  ?? 'P2';

  if (!rows.length) return (
    <div style={{ padding: 48, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: t.text, fontFamily: 'IBM Plex Mono,monospace' }}>Belum ada data produk</div>
      <div style={{ fontSize: 11, color: t.textMuted, fontFamily: 'IBM Plex Mono,monospace' }}>Terapkan filter dan klik Terapkan untuk memuat data</div>
    </div>
  );

  // FIX: ganti max-content → fixed px untuk dua kolom terakhir
  // agar grid row selalu stretch full width dan background ter-cover
  // Kuartal: 4 Q × 91px + gap = ~400px cukup untuk 4 kuartal
  // L4W: 104px cukup untuk dua bar
  const GRID = '28px 162px 273px 128px 107px 86px 400px 120px';

  const colH = (label: string, sub?: string) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <span style={{ fontSize: 8, fontWeight: 700, fontFamily: 'IBM Plex Mono,monospace', textTransform: 'uppercase', letterSpacing: '0.1em', color: t.headerText }}>{label}</span>
      {sub && <span style={{ fontSize: 7, color: t.textMuted, fontFamily: 'IBM Plex Mono,monospace' }}>{sub}</span>}
    </div>
  );

  // Row & header style — pakai style object agar background benar-benar full width
  const rowStyle = (idx: number): React.CSSProperties => ({
    display:               'grid',
    gridTemplateColumns:   GRID,
    columnGap:             10,
    padding:               '14px 16px',
    borderBottom:          `1px solid ${t.divider}`,
    // FIX: width 100% + minWidth memastikan background stretch full
    width:                 '100%',
    minWidth:              'fit-content',
    boxSizing:             'border-box' as const,
    background:            idx % 2 === 1 ? t.rowAlt : t.bgRow,
    alignItems:            'center',
    transition:            'background 0.1s',
  });

  const headerStyle: React.CSSProperties = {
    display:             'grid',
    gridTemplateColumns: GRID,
    columnGap:           10,
    padding:             '7px 16px',
    width:               '100%',
    minWidth:            'fit-content',
    boxSizing:           'border-box' as const,
    background:          t.headerBg,
    borderBottom:        `1px solid ${t.border}`,
    alignItems:          'center',
    flexShrink:          0,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, fontFamily: 'IBM Plex Sans,sans-serif' }}>

      {/* ── Toolbar ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0 10px', gap: 10, flexWrap: 'wrap', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: t.text, fontFamily: 'IBM Plex Mono,monospace' }}>Brand Performance</span>
          <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 10, fontFamily: 'IBM Plex Mono,monospace', fontWeight: 700, background: t.pill1bg, color: t.pill1text }}>{displayed.length} produk</span>
          <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 10, fontFamily: 'IBM Plex Mono,monospace', fontWeight: 700, background: t.pill2bg, color: t.pill2text }}>{pL} vs {cL}</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari produk…"
            style={{ height: 28, padding: '0 10px', borderRadius: 6, fontSize: 10, fontFamily: 'IBM Plex Mono,monospace', background: t.inputBg, border: `1px solid ${t.border}`, color: t.text, outline: 'none', width: 130 }}
          />
          <div style={{ display: 'flex', gap: 2, background: t.tabBg, borderRadius: 8, padding: 2 }}>
            {(['vol', 'growth', 'ach'] as const).map(k => (
              <button key={k} onClick={() => setSortBy(k)} style={{ padding: '4px 10px', borderRadius: 6, fontSize: 9, fontWeight: 600, fontFamily: 'IBM Plex Mono,monospace', border: 'none', cursor: 'pointer', background: sortBy === k ? t.tabActive : 'transparent', color: sortBy === k ? t.tabActiveText : t.textMuted, transition: 'all 0.12s' }}>
                {k === 'vol' ? 'Volume' : k === 'growth' ? 'Growth' : 'Achievement'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tabel ── */}
      {/*
        FIX: struktur scroll
        - outer div: border + borderRadius, overflow hidden
        - inner scroll div: overflowX auto
        - konten: display flex flex-col, width fit-content min-width 100%
        Ini memastikan background row selalu full width dari tepi kiri ke kanan
      */}
      <div style={{ borderRadius: 10, border: `1px solid ${t.border}`, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', overflowY: 'hidden', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', width: 'fit-content', minWidth: '100%' }}>

            {/* Header */}
            <div style={headerStyle}>
              {colH('No')}
              {colH('Produk')}
              {colH('Sales Trend', `${pL}(putus) vs ${cL}(solid)`)}
              {colH('Vol. P1 vs P2', `${pL} → ${cL} + growth`)}
              {colH('Achievement', `Actual vs Target ${cL}`)}
              {colH('YoY Growth', `${pL} → ${cL}`)}
              {colH('Kuartal', `${pL} vs ${cL} per Q`)}
              {colH('L4W vs C1W', `Rata² 4 minggu vs minggu terakhir`)}
            </div>

            {/* Rows — scroll vertikal di sini */}
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {displayed.map((row, idx) => (
                <div key={row.product}
                  style={rowStyle(idx)}
                  onMouseEnter={e => (e.currentTarget.style.background = t.rowHover)}
                  onMouseLeave={e => (e.currentTarget.style.background = idx % 2 === 1 ? t.rowAlt : t.bgRow)}
                >
                  {/* No */}
                  <div style={{ fontSize: 10, fontWeight: 600, color: t.textMuted, fontFamily: 'IBM Plex Mono,monospace' }}>{idx + 1}</div>

                  {/* Produk */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0, overflow: 'hidden' }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: row.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 10, fontWeight: 700, color: t.text, fontFamily: 'IBM Plex Mono,monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.product}</span>
                  </div>

                  {/* Sparkline */}
                  <Sparkline data={row.trendData} color={row.color} theme={theme} />

                  {/* Vol */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <VolBadge label={String(pL)} val={row.volPrev} color="#3bf6b5ae" theme={theme} />
                    <VolBadge label={String(cL)} val={row.volCurr} color={row.color} theme={theme} />
                  </div>

                  {/* Achievement */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                    <AchDonut pct={row.achPct} actual={row.actual} target={row.target} theme={theme} />
                    <span style={{ fontSize: 7, color: t.textMuted, fontFamily: 'IBM Plex Mono,monospace', textAlign: 'center' }}>
                      {row.target > 0 ? `T:${fmtFull(row.target)}` : 'no target'}
                    </span>
                  </div>

                  {/* YoY Growth */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 16, fontWeight: 800, fontFamily: 'IBM Plex Mono,monospace', lineHeight: 1, color: row.volGrowth >= 0 ? t.posText : t.negText }}>{fmtPct(row.volGrowth)}</span>
                    <span style={{ fontSize: 8, fontFamily: 'IBM Plex Mono,monospace', color: t.textMuted }}>
                      Δ {row.volGrowth >= 0 ? '+' : ''}{fmtFull(row.volCurr - row.volPrev)}
                    </span>
                    <span style={{ fontSize: 7.5, fontFamily: 'IBM Plex Mono,monospace', padding: '2px 6px', borderRadius: 8, fontWeight: 600, background: row.volGrowth >= 0 ? t.posBg : t.negBg, color: row.volGrowth >= 0 ? t.posText : t.negText, border: `1px solid ${row.volGrowth >= 0 ? t.posBorder : t.negBorder}` }}>
                      {row.volGrowth >= 0 ? '↑ Naik' : '↓ Turun'}
                    </span>
                  </div>

                  {/* Kuartal */}
                  <QBarGroup qData={row.qData} color={row.color} pL={pL} cL={cL} theme={theme} />

                  {/* L4W vs C1W */}
                  <L4WCell l4w={row.l4wAvg} c1w={row.c1wVal} color={row.color} theme={theme} />
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '9px 14px', borderTop: `1px solid ${t.border}`, display: 'flex', gap: 0, alignItems: 'center', background: t.footerBg, flexWrap: 'wrap', flexShrink: 0 }}>
          {(() => {
            const totPrev  = rows.reduce((s, r) => s + r.volPrev, 0);
            const totCurr  = rows.reduce((s, r) => s + r.volCurr, 0);
            const totGrow  = totPrev > 0 ? ((totCurr - totPrev) / totPrev) * 100 : 0;
            const achRows  = rows.filter(r => r.target > 0);
            const avgAch   = achRows.length ? achRows.reduce((s, r) => s + r.achPct, 0) / achRows.length : 0;
            const posCount = rows.filter(r => r.volGrowth >= 0).length;
            const items = [
              { label: `Total ${cL}`,     val: fmtFull(totCurr),           clr: t.text },
              { label: 'Total Growth',    val: fmtPct(totGrow),             clr: totGrow >= 0 ? t.posText : t.negText },
              { label: 'Avg Achievement', val: `${avgAch.toFixed(1)}%`,     clr: achClr(avgAch) },
              { label: 'Produk Positif',  val: `${posCount}/${rows.length}`, clr: t.posText },
            ];
            return items.map((item, i, arr) => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, paddingLeft: i === 0 ? 0 : 18, paddingRight: 18 }}>
                  <span style={{ fontSize: 8, color: t.textMuted, fontFamily: 'IBM Plex Mono,monospace', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{item.label}</span>
                  <span style={{ fontSize: 14, fontWeight: 800, fontFamily: 'IBM Plex Mono,monospace', color: item.clr }}>{item.val}</span>
                </div>
                {i < arr.length - 1 && <div style={{ width: 1, height: 28, background: t.border }} />}
              </div>
            ));
          })()}
        </div>
      </div>
    </div>
  );
}