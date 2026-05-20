'use client';

import { useState, useMemo } from 'react';
import { QuarterlyData } from '@/types/sales';
import { formatQuantity, formatPercentage } from '@/lib/utils';
import { getProductCategory } from '@/lib/productCategories';
import { Maximize2, X } from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  PieChart as RechartsPieChart,
  Line,
  Bar,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';

type Theme = 'dark' | 'light';

const TK = {
  dark: {
    cardBg:        '#111318',
    border:        'rgba(255,255,255,0.06)',
    borderCard:    'rgba(255,255,255,0.07)',
    tableHeadBg:   '#0c0e14',
    tableHeadText: 'rgba(255,255,255,0.3)',
    rowHover:      'rgba(255,255,255,0.03)',
    rowAlt:        'rgba(255,255,255,0.015)',
    text:          'rgba(255,255,255,0.9)',
    textSub:       'rgba(255,255,255,0.55)',
    textMuted:     'rgba(255,255,255,0.3)',
    textFaint:     'rgba(255,255,255,0.18)',
    inputBg:       'rgba(255,255,255,0.03)',
    inputBorder:   'rgba(255,255,255,0.08)',
    selectBg:      '#0c0e14',
    infoBg:        'rgba(16,185,129,0.07)',
    infoBorder:    'rgba(16,185,129,0.25)',
    infoText:      '#6ee7b7',
    btnBg:         'rgba(37,99,235,0.12)',
    btnBorder:     'rgba(59,130,246,0.3)',
    btnText:       '#93c5fd',
    modalBg:       '#0f1117',
    gridStroke:    'rgba(255,255,255,0.06)',
    axisColor:     'rgba(255,255,255,0.28)',
    tooltipBg:     '#1a1e2c',
    tooltipBorder: 'rgba(255,255,255,0.12)',
    qCardBg:       '#0d0f16',
    posBg:   'rgba(16,185,129,0.12)', posText: '#6ee7b7',
    negBg:   'rgba(239,68,68,0.12)',  negText: '#fca5a5',
    shadow:  'none',
  },
  light: {
    cardBg:        '#ffffff',
    border:        'rgba(0,0,0,0.07)',
    borderCard:    'rgba(0,0,0,0.08)',
    tableHeadBg:   '#f8fafc',
    tableHeadText: '#94a3b8',
    rowHover:      'rgba(0,0,0,0.03)',
    rowAlt:        'rgba(0,0,0,0.018)',
    text:          '#0f172a',
    textSub:       '#475569',
    textMuted:     '#94a3b8',
    textFaint:     '#cbd5e1',
    inputBg:       'rgba(0,0,0,0.03)',
    inputBorder:   'rgba(0,0,0,0.1)',
    selectBg:      '#ffffff',
    infoBg:        'rgba(22,163,74,0.07)',
    infoBorder:    'rgba(22,163,74,0.25)',
    infoText:      '#15803d',
    btnBg:         'rgba(37,99,235,0.08)',
    btnBorder:     'rgba(37,99,235,0.25)',
    btnText:       '#1d4ed8',
    modalBg:       '#ffffff',
    gridStroke:    'rgba(0,0,0,0.07)',
    axisColor:     '#94a3b8',
    tooltipBg:     '#ffffff',
    tooltipBorder: 'rgba(0,0,0,0.1)',
    qCardBg:       '#ffffff',
    posBg:   'rgba(16,185,129,0.1)', posText: '#15803d',
    negBg:   'rgba(239,68,68,0.1)',  negText: '#dc2626',
    shadow:  '0 1px 8px rgba(0,0,0,0.07)',
  },
} as const;

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
const QUARTER_COLORS: Record<string, string> = {
  Q1: '#3b82f6', Q2: '#10b981', Q3: '#f59e0b', Q4: '#a855f7',
};
const varColor = (v: number) => v >= 0 ? '#10b981' : '#ef4444';

const UNIT_OPTIONS = [
  { value: 'units_bks',  label: 'Jual (Bks Net)',  shortLabel: 'Bks'  },
  { value: 'units_slop', label: 'Jual (Slop Net)', shortLabel: 'Slop' },
  { value: 'units_bal',  label: 'Jual (Bal Net)',  shortLabel: 'Bal'  },
  { value: 'units_dos',  label: 'Jual (Dos Net)',  shortLabel: 'Dos'  },
];

const formatUnitValue = (value: number, _unit?: string) => formatQuantity(value);

const getUnitLabel = (unit: string) =>
  UNIT_OPTIONS.find(o => o.value === unit)?.label ?? UNIT_OPTIONS[0].label;

const getUnitShortLabel = (unit: string) =>
  UNIT_OPTIONS.find(o => o.value === unit)?.shortLabel ?? UNIT_OPTIONS[0].shortLabel;

const makeYFmt = (unit: string) => (v: number) => {
  const suffix = getUnitShortLabel(unit);
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M ${suffix}`;
  if (v >= 1_000)     return `${(v / 1_000).toFixed(1)}K ${suffix}`;
  return `${Math.round(v)} ${suffix}`;
};

// ─── Helpers: baca per-unit field, TIDAK fallback ke root target/actual ────────
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

// ─── Helper: nama bulan dari nomor minggu ────────────────────────────────────
function getMonthFromWeek(week: number, year: number): string {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const dayOfYear = (week - 1) * 7 + 4;
  const date = new Date(year, 0, dayOfYear);
  return months[date.getMonth()];
}

type WeekUnitData = {
  units_dos: number; units_bks: number; units_slop: number; units_bal: number;
};

function weekHasTarget(w: any): boolean {
  if (typeof w.hasTarget === 'boolean') return w.hasTarget;
  return w.target > 0;
}
function monthHasTarget(m: any): boolean {
  if (typeof m.hasTarget === 'boolean') return m.hasTarget;
  return m.target > 0;
}

// ─── AchieveBadge ─────────────────────────────────────────────────────────────
function AchieveBadge({ pct, theme, hasTarget }: { pct: number; theme: Theme; hasTarget: boolean }) {
  const t = TK[theme];
  if (!hasTarget) {
    return (
      <span style={{
        padding: '2px 8px', borderRadius: 5, fontSize: 10, fontWeight: 700,
        fontFamily: 'IBM Plex Mono, monospace',
        background: t.inputBg, color: t.textMuted, border: `1px solid ${t.inputBorder}`,
      }}>N/A</span>
    );
  }
  const hit = pct >= 100;
  return (
    <span style={{
      padding: '2px 8px', borderRadius: 5, fontSize: 10, fontWeight: 700,
      fontFamily: 'IBM Plex Mono, monospace',
      background: hit ? t.posBg : t.negBg,
      color: hit ? t.posText : t.negText,
    }}>
      {pct.toFixed(1)}%
    </span>
  );
}

// ─── ViewToggle ───────────────────────────────────────────────────────────────
function ViewToggle({ value, onChange, theme }: {
  value: 'chart' | 'table';
  onChange: (v: 'chart' | 'table') => void;
  theme: Theme;
}) {
  const t = TK[theme];
  return (
    <div style={{ display: 'flex', border: `1px solid ${t.inputBorder}`, borderRadius: 7, overflow: 'hidden' }}>
      {(['chart', 'table'] as const).map(mode => (
        <button key={mode} onClick={() => onChange(mode)}
          style={{
            padding: '4px 10px', border: 'none', cursor: 'pointer',
            fontSize: 11, fontFamily: 'IBM Plex Mono, monospace',
            background: value === mode ? t.btnBg : t.inputBg,
            color: value === mode ? t.btnText : t.textMuted,
            fontWeight: value === mode ? 700 : 400,
            borderRight: mode === 'chart' ? `1px solid ${t.inputBorder}` : 'none',
          }}>
          {mode === 'chart' ? 'Grafik' : 'Tabel'}
        </button>
      ))}
    </div>
  );
}

// ─── FilterSelect ─────────────────────────────────────────────────────────────
function FilterSelect({ label, accentColor = '#3b82f6', value, onChange, children, theme }: {
  label: string; accentColor?: string; value: string | number;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  children: React.ReactNode; theme: Theme;
}) {
  const t = TK[theme];
  return (
    <div style={{ display: 'flex', alignItems: 'stretch', border: `1px solid ${t.inputBorder}`, borderRadius: 8, overflow: 'hidden' }}>
      <span style={{ padding: '6px 10px', fontSize: 10, fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600, color: accentColor, background: `${accentColor}18`, borderRight: `1px solid ${t.inputBorder}`, display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', flexShrink: 0 }}>
        {label}
      </span>
      <select value={value} onChange={onChange} style={{ background: t.inputBg, border: 'none', outline: 'none', padding: '6px 10px', fontSize: 12, fontFamily: 'IBM Plex Mono, monospace', color: t.text, cursor: 'pointer', minWidth: 0, flex: 1, appearance: 'none' }}>
        {children}
      </select>
    </div>
  );
}

// ─── ExpandBtn ────────────────────────────────────────────────────────────────
function ExpandBtn({ onClick, theme }: { onClick: () => void; theme: Theme }) {
  const t = TK[theme];
  return (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 6, background: t.btnBg, border: `1px solid ${t.btnBorder}`, color: t.btnText, cursor: 'pointer', fontSize: 11, fontWeight: 500, fontFamily: 'IBM Plex Mono, monospace', flexShrink: 0 }}>
      <Maximize2 size={12} /> Perbesar
    </button>
  );
}

// ─── ChartTooltip ─────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label, labelPrefix, theme, unit }: any) {
  const t = TK[theme as Theme];
  if (!active || !payload?.length) return null;
  const visible = payload.filter((p: any) => p.value != null);
  if (!visible.length) return null;
  const short = unit ? getUnitShortLabel(unit) : '';
  return (
    <div style={{ background: t.tooltipBg, border: `1px solid ${t.tooltipBorder}`, borderRadius: 8, padding: '10px 14px', boxShadow: '0 8px 24px rgba(0,0,0,0.18)' }}>
      <div style={{ fontSize: 11, color: t.textMuted, fontFamily: 'IBM Plex Mono, monospace', marginBottom: 7 }}>{labelPrefix ?? ''}{label}</div>
      {visible.map((p: any, i: number) => {
        const isPct = p.name === 'Achievement %';
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: i < visible.length - 1 ? 4 : 0 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: p.fill ?? p.color, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: t.textSub, fontFamily: 'IBM Plex Sans, sans-serif' }}>
              {p.name}{!isPct && short ? ` (${short})` : ''}:
            </span>
            <span style={{ fontSize: 12, fontWeight: 700, color: t.text, fontFamily: 'IBM Plex Mono, monospace' }}>
              {isPct ? `${(p.value as number).toFixed(1)}%` : `${formatUnitValue(p.value, unit)} ${short}`}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── WeeklyDetailView ─────────────────────────────────────────────────────────
function WeeklyDetailView({ data, selectedUnit, theme, card, tdBase, expandModal }: {
  data: QuarterlyData[]; selectedUnit: string; theme: Theme;
  card: (extra?: React.CSSProperties) => React.CSSProperties;
  tdBase: React.CSSProperties;
  expandModal: (content: React.ReactNode, title: string) => void;
}) {
  const t = TK[theme];
  const [displayMode, setDisplayMode] = useState<'chart' | 'table'>('chart');
  const [selectedQ, setSelectedQ] = useState('all');

  const yFmt = makeYFmt(selectedUnit);

  const axisProps = {
    tick: { fill: t.axisColor, fontSize: 10, fontFamily: 'IBM Plex Mono, monospace' },
    axisLine: { stroke: t.border },
    tickLine: false as const,
  };

  const allWeekly = useMemo(() =>
    data.flatMap(q => (q.weeklyBreakdown ?? []).map(w => ({ ...w, quarter: q.quarter }))),
    [data]
  );
  const filteredWeekly = useMemo(() =>
    selectedQ === 'all' ? allWeekly : allWeekly.filter(w => (w as any).quarter === selectedQ),
    [allWeekly, selectedQ]
  );

  const weeksWithTarget = useMemo(() => filteredWeekly.filter(w => weekHasTarget(w)), [filteredWeekly]);
  const avgAch   = weeksWithTarget.length > 0 ? weeksWithTarget.reduce((s, w) => s + (w.achievement === -1 ? 0 : w.achievement), 0) / weeksWithTarget.length : 0;
  const onTarget = weeksWithTarget.filter(w => w.achievement >= 100).length;
  const belowTgt = weeksWithTarget.filter(w => w.achievement < 100 && w.achievement !== -1).length;

  const chartData = filteredWeekly
    .filter(w => weekHasTarget(w) || w.actual > 0)
    .map(w => {
      const unitData = (w as any)[selectedUnit] || { target: w.target, actual: w.actual };
      return {
        name:        `W${w.week}`,
        quarter:     (w as any).quarter,
        target:      weekHasTarget(w) ? unitData.target : null,
        actual:      unitData.actual > 0 ? unitData.actual : null,
        achievement: weekHasTarget(w) && w.achievement !== -1 ? w.achievement : null,
      };
    });

  const renderChart = (height: number | string) => (
    <ResponsiveContainer width="100%" height={height as number | `${number}%`}>
      <ComposedChart data={chartData} margin={{ top: 6, right: 16, bottom: 4, left: 8 }} barGap={2}>
        <CartesianGrid strokeDasharray="3 3" stroke={t.gridStroke} />
        <XAxis dataKey="name" {...axisProps} interval={selectedQ === 'all' ? 3 : 0} />
        <YAxis
          yAxisId="left"
          tickFormatter={yFmt}
          {...axisProps}
          axisLine={false}
          width={72}
          label={{
            value: getUnitShortLabel(selectedUnit),
            angle: -90,
            position: 'insideLeft',
            offset: 10,
            style: { fill: t.axisColor, fontSize: 9, fontFamily: 'IBM Plex Mono, monospace' },
          }}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          tickFormatter={v => `${v.toFixed(0)}%`}
          {...axisProps}
          axisLine={false}
        />
        <Tooltip content={<ChartTooltip labelPrefix="Minggu: " theme={theme} unit={selectedUnit} />} />
        <Bar yAxisId="left" dataKey="target" fill="#94a3b8" name="Target" radius={[3,3,0,0]} maxBarSize={28} opacity={0.6} />
        <Bar yAxisId="left" dataKey="actual" fill="#3b82f6" name="Actual" radius={[3,3,0,0]} maxBarSize={28}>
          {chartData.map((e, i) => (
            <Cell key={i} fill={(QUARTER_COLORS[(e as any).quarter] ?? '#3b82f6') + ((e.actual ?? 0) >= (e.target ?? 0) ? 'ff' : '99')} />
          ))}
        </Bar>
        <Line yAxisId="right" type="monotone" dataKey="achievement" fill="#f59e0b" connectNulls={false} stroke="#f59e0b" strokeWidth={2} dot={false} name="Achievement %" />
        <ReferenceLine yAxisId="right" y={100} stroke="#10b981" strokeDasharray="4 4" strokeWidth={1.5} />
      </ComposedChart>
    </ResponsiveContainer>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Stat pills */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
        {[
          { label: 'Total Minggu',                               value: filteredWeekly.length, color: t.textSub },
          { label: `Rata-rata Ach. (${weeksWithTarget.length}W)`, value: weeksWithTarget.length > 0 ? `${avgAch.toFixed(1)}%` : 'N/A', color: weeksWithTarget.length > 0 ? (avgAch >= 100 ? t.posText : t.negText) : t.textMuted },
          { label: 'On Target',    value: onTarget, color: t.posText },
          { label: 'Below Target', value: belowTgt, color: t.negText },
        ].map((s, i) => (
          <div key={i} style={{ padding: '10px 14px', borderRadius: 10, background: t.qCardBg, border: `1px solid ${t.borderCard}`, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 10, color: t.textMuted, fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{s.label}</span>
            <span style={{ fontSize: 18, fontWeight: 800, color: s.color, fontFamily: 'IBM Plex Mono, monospace' }}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Main card */}
      <div style={card()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: t.textMuted, fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Detail Mingguan · {getUnitLabel(selectedUnit)}
          </span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <FilterSelect label="Kuartal" accentColor="#3b82f6" value={selectedQ} onChange={e => setSelectedQ(e.target.value)} theme={theme}>
              <option value="all" style={{ background: t.selectBg }}>Semua</option>
              {data.map(q => <option key={q.quarter} value={q.quarter} style={{ background: t.selectBg }}>{q.quarter}</option>)}
            </FilterSelect>
            <ViewToggle value={displayMode} onChange={setDisplayMode} theme={theme} />
            {displayMode === 'chart' && (
              <ExpandBtn onClick={() => expandModal(<div style={{ height: '70vh' }}>{renderChart('100%')}</div>, `Trend Mingguan · ${getUnitLabel(selectedUnit)} — Diperbesar`)} theme={theme} />
            )}
          </div>
        </div>

        {/* Chart legend */}
        {displayMode === 'chart' && selectedQ === 'all' && (
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
            {data.map(q => (
              <span key={q.quarter} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: t.textSub, fontFamily: 'IBM Plex Sans, sans-serif' }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: QUARTER_COLORS[q.quarter] ?? '#3b82f6' }} />{q.quarter}
              </span>
            ))}
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#f59e0b', fontFamily: 'IBM Plex Sans, sans-serif' }}>
              <span style={{ width: 18, height: 2, background: '#f59e0b', borderRadius: 2 }} />Achievement %
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#10b981', fontFamily: 'IBM Plex Sans, sans-serif' }}>
              <span style={{ width: 18, height: 2, background: '#10b981', borderRadius: 2 }} />100% Line
            </span>
          </div>
        )}

        {displayMode === 'chart' ? (
          <div style={{ background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: 8, padding: '12px 6px 6px' }}>
            {renderChart(300)}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {data
              .filter(q => selectedQ === 'all' || q.quarter === selectedQ)
              .map(quarter => {
                if (!quarter.weeklyBreakdown?.length) return null;
                const wt    = quarter.weeklyBreakdown.filter(w => weekHasTarget(w));
                const best  = wt.length > 0 ? wt.reduce((m, w) => w.achievement > m.achievement ? w : m) : null;
                const worst = wt.length > 0 ? wt.reduce((m, w) => w.achievement < m.achievement ? w : m) : null;
                return (
                  <div key={quarter.quarter}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, paddingBottom: 8, borderBottom: `1px solid ${t.border}` }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: t.text }}>{quarter.quarter}</span>
                      <div style={{ display: 'flex', gap: 12, fontSize: 11, fontFamily: 'IBM Plex Mono, monospace' }}>
                        {best  && <span style={{ color: t.posText }}>Best: W{best.week} ({best.achievement.toFixed(1)}%)</span>}
                        {worst && <span style={{ color: t.negText }}>Worst: W{worst.week} ({worst.achievement.toFixed(1)}%)</span>}
                        {!best && <span style={{ color: t.textMuted }}>Belum ada target</span>}
                      </div>
                    </div>
                    <div style={{ border: `1px solid ${t.border}`, borderRadius: 8, overflow: 'hidden' }}>
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr>
                              {['Week', `Target (${getUnitShortLabel(selectedUnit)})`, `Actual (${getUnitShortLabel(selectedUnit)})`, 'Variance', 'Var %', 'Achievement'].map((h, i) => (
                                <th key={h} style={{ padding: '8px 12px', textAlign: i === 0 ? 'left' : 'right', fontSize: 9, fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, color: t.tableHeadText, background: t.tableHeadBg, borderBottom: `1px solid ${t.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {quarter.weeklyBreakdown.map((w, idx) => {
                              const ht = weekHasTarget(w);
                              const unitData = (w as any)[selectedUnit] || { target: w.target, actual: w.actual };
                              return (
                                <tr key={w.week} style={{ background: idx % 2 !== 0 ? t.rowAlt : 'transparent' }}
                                  onMouseEnter={e => (e.currentTarget.style.background = t.rowHover)}
                                  onMouseLeave={e => (e.currentTarget.style.background = idx % 2 !== 0 ? t.rowAlt : 'transparent')}>
                                  <td style={{ ...tdBase, color: t.text, fontWeight: 600, fontSize: 11 }}>W{w.week}</td>
                                  <td style={{ ...tdBase, textAlign: 'right', fontSize: 11, color: ht ? t.textSub : t.textFaint }}>
                                    {ht ? formatUnitValue(unitData.target, selectedUnit) : '—'}
                                  </td>
                                  <td style={{ ...tdBase, textAlign: 'right', color: t.text, fontWeight: 700, fontSize: 11 }}>
                                    {unitData.actual > 0 ? formatUnitValue(unitData.actual, selectedUnit) : <span style={{ color: t.textFaint }}>—</span>}
                                  </td>
                                  <td style={{ ...tdBase, textAlign: 'right', color: ht ? varColor(w.variance) : t.textFaint, fontWeight: 700, fontSize: 11 }}>
                                    {ht ? `${w.variance >= 0 ? '+' : ''}${formatUnitValue(w.variance, selectedUnit)}` : '—'}
                                  </td>
                                  <td style={{ ...tdBase, textAlign: 'right', color: ht ? varColor(w.variancePercentage) : t.textFaint, fontWeight: 700, fontSize: 11 }}>
                                    {ht ? formatPercentage(w.variancePercentage) : '—'}
                                  </td>
                                  <td style={{ ...tdBase, textAlign: 'right' }}>
                                    <AchieveBadge pct={w.achievement} theme={theme} hasTarget={ht} />
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MonthlyDetailView ────────────────────────────────────────────────────────
function MonthlyDetailView({ data, selectedUnit, theme, card, tdBase, expandModal }: {
  data: QuarterlyData[]; selectedUnit: string; theme: Theme;
  card: (extra?: React.CSSProperties) => React.CSSProperties;
  tdBase: React.CSSProperties;
  expandModal: (content: React.ReactNode, title: string) => void;
}) {
  const t = TK[theme];
  const [displayMode, setDisplayMode] = useState<'chart' | 'table'>('chart');

  const yFmt = makeYFmt(selectedUnit);

  const axisProps = {
    tick: { fill: t.axisColor, fontSize: 10, fontFamily: 'IBM Plex Mono, monospace' },
    axisLine: { stroke: t.border },
    tickLine: false as const,
  };

  const allMonthly = useMemo(() =>
    data.flatMap(q => (q.monthlyBreakdown ?? []).map(m => ({ ...m, quarter: q.quarter }))),
    [data]
  );

  const monthsWithTarget = useMemo(() => allMonthly.filter(m => monthHasTarget(m)), [allMonthly]);
  const avgAch   = monthsWithTarget.length > 0 ? monthsWithTarget.reduce((s, m) => s + m.achievement, 0) / monthsWithTarget.length : 0;
  const onTarget = monthsWithTarget.filter(m => m.achievement >= 100).length;

  const chartData = allMonthly.filter(m => monthHasTarget(m) || m.actual > 0).map(m => {
    const unitData = (m as any)[selectedUnit] || { target: m.target, actual: m.actual };
    return {
      name:        m.month,
      quarter:     (m as any).quarter,
      target:      monthHasTarget(m) ? unitData.target : null,
      actual:      unitData.actual > 0 ? unitData.actual : null,
      achievement: monthHasTarget(m) ? m.achievement : null,
    };
  });

  const renderBarLine = (height: number | string) => (
    <ResponsiveContainer width="100%" height={height as number | `${number}%`}>
      <ComposedChart data={chartData} margin={{ top: 6, right: 16, bottom: 4, left: 8 }} barGap={3}>
        <CartesianGrid strokeDasharray="3 3" stroke={t.gridStroke} />
        <XAxis dataKey="name" {...axisProps} />
        <YAxis
          yAxisId="left"
          tickFormatter={yFmt}
          {...axisProps}
          axisLine={false}
          width={72}
          label={{
            value: getUnitShortLabel(selectedUnit),
            angle: -90,
            position: 'insideLeft',
            offset: 10,
            style: { fill: t.axisColor, fontSize: 9, fontFamily: 'IBM Plex Mono, monospace' },
          }}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          tickFormatter={v => `${v.toFixed(0)}%`}
          {...axisProps}
          axisLine={false}
        />
        <Tooltip content={<ChartTooltip labelPrefix="Bulan: " theme={theme} unit={selectedUnit} />} />
        <Bar yAxisId="left" dataKey="target" fill="#94a3b8" name="Target" radius={[4,4,0,0]} maxBarSize={32} opacity={0.55} />
        <Bar yAxisId="left" dataKey="actual" name="Actual" radius={[4,4,0,0]} maxBarSize={32}>
          {chartData.map((e, i) => (
            <Cell key={i} fill={(QUARTER_COLORS[(e as any).quarter] ?? '#3b82f6') + ((e.actual ?? 0) >= (e.target ?? 0) ? 'ff' : '99')} />
          ))}
        </Bar>
        <Line yAxisId="right" type="monotone" dataKey="achievement" connectNulls={false} stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 4, fill: '#f59e0b', strokeWidth: 0 }} name="Achievement %" />
        <ReferenceLine yAxisId="right" y={100} stroke="#10b981" strokeDasharray="4 4" strokeWidth={1.5} />
      </ComposedChart>
    </ResponsiveContainer>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Stat pills */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
        {[
          { label: 'Total Bulan',                                value: allMonthly.length,     color: t.textSub },
          { label: `Rata-rata Ach. (${monthsWithTarget.length}B)`, value: monthsWithTarget.length > 0 ? `${avgAch.toFixed(1)}%` : 'N/A', color: monthsWithTarget.length > 0 ? (avgAch >= 100 ? t.posText : t.negText) : t.textMuted },
          { label: 'On Target',    value: onTarget,                           color: t.posText },
          { label: 'Below Target', value: monthsWithTarget.length - onTarget, color: t.negText },
        ].map((s, i) => (
          <div key={i} style={{ padding: '10px 14px', borderRadius: 10, background: t.qCardBg, border: `1px solid ${t.borderCard}`, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 10, color: t.textMuted, fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{s.label}</span>
            <span style={{ fontSize: 18, fontWeight: 800, color: s.color, fontFamily: 'IBM Plex Mono, monospace' }}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Achievement heatmap */}
      <div style={card()}>
        <span style={{ display: 'block', fontSize: 11, fontWeight: 700, color: t.textMuted, fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
          Achievement per Bulan · {getUnitLabel(selectedUnit)}
        </span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8 }}>
          {allMonthly.map((m, i) => {
            const ht  = monthHasTarget(m);
            const hit = ht && m.achievement >= 100;
            const pct = ht ? Math.min(100, m.achievement) : 0;
            return (
              <div key={i} style={{ padding: '10px 12px', borderRadius: 10, background: !ht ? t.inputBg : (hit ? t.posBg : t.negBg), border: `1px solid ${!ht ? t.inputBorder : (hit ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.2)')}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: t.text, fontFamily: 'IBM Plex Mono, monospace' }}>{m.month}</span>
                  <span style={{ fontSize: 9, color: QUARTER_COLORS[(m as any).quarter], fontFamily: 'IBM Plex Mono, monospace', fontWeight: 700 }}>{(m as any).quarter}</span>
                </div>
                {ht
                  ? <div style={{ fontSize: 16, fontWeight: 800, color: hit ? t.posText : t.negText, fontFamily: 'IBM Plex Mono, monospace', lineHeight: 1 }}>{m.achievement.toFixed(1)}%</div>
                  : <div style={{ fontSize: 13, fontWeight: 700, color: t.textMuted, fontFamily: 'IBM Plex Mono, monospace', lineHeight: 1 }}>N/A</div>
                }
                <div style={{ height: 4, background: 'rgba(0,0,0,0.1)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: hit ? '#10b981' : (ht ? '#ef4444' : t.textFaint), borderRadius: 2, transition: 'width 0.7s' }} />
                </div>
                <div style={{ fontSize: 10, color: t.textMuted, fontFamily: 'IBM Plex Mono, monospace' }}>
                  {m.actual > 0 ? `${formatUnitValue(m.actual, selectedUnit)} ${getUnitShortLabel(selectedUnit)}` : '—'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chart / Table */}
      <div style={card()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: t.textMuted, fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Target vs Actual Bulanan · {getUnitLabel(selectedUnit)}
          </span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <ViewToggle value={displayMode} onChange={setDisplayMode} theme={theme} />
            {displayMode === 'chart' && (
              <ExpandBtn onClick={() => expandModal(<div style={{ height: '70vh' }}>{renderBarLine('100%')}</div>, `Trend Bulanan · ${getUnitLabel(selectedUnit)} — Diperbesar`)} theme={theme} />
            )}
          </div>
        </div>

        {displayMode === 'chart' && (
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
            {data.map(q => (
              <span key={q.quarter} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: t.textSub, fontFamily: 'IBM Plex Sans, sans-serif' }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: QUARTER_COLORS[q.quarter] ?? '#3b82f6' }} />{q.quarter}
              </span>
            ))}
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#f59e0b', fontFamily: 'IBM Plex Sans, sans-serif' }}>
              <span style={{ width: 18, height: 2, background: '#f59e0b', borderRadius: 2 }} />Achievement %
            </span>
          </div>
        )}

        {displayMode === 'chart' ? (
          <div style={{ background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: 8, padding: '12px 6px 6px' }}>{renderBarLine(300)}</div>
        ) : (
          <div style={{ border: `1px solid ${t.border}`, borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Quarter', 'Month', `Target (${getUnitShortLabel(selectedUnit)})`, `Actual (${getUnitShortLabel(selectedUnit)})`, 'Variance', 'Var %', 'Achievement'].map((h, i) => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: i <= 1 ? 'left' : 'right', fontSize: 9, fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, color: t.tableHeadText, background: t.tableHeadBg, borderBottom: `1px solid ${t.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allMonthly.map((m, idx) => {
                    const ht = monthHasTarget(m);
                    const unitData = (m as any)[selectedUnit] || { target: m.target, actual: m.actual };
                    return (
                      <tr key={`${(m as any).quarter}-${m.month}`} style={{ background: idx % 2 !== 0 ? t.rowAlt : 'transparent' }}
                        onMouseEnter={e => (e.currentTarget.style.background = t.rowHover)}
                        onMouseLeave={e => (e.currentTarget.style.background = idx % 2 !== 0 ? t.rowAlt : 'transparent')}>
                        <td style={{ ...tdBase, fontWeight: 700, color: QUARTER_COLORS[(m as any).quarter] ?? t.text, fontSize: 11 }}>{(m as any).quarter}</td>
                        <td style={{ ...tdBase, color: t.text, fontWeight: 600, fontSize: 11 }}>{m.month}</td>
                        <td style={{ ...tdBase, textAlign: 'right', fontSize: 11, color: ht ? t.textSub : t.textFaint }}>{ht ? formatUnitValue(unitData.target, selectedUnit) : '—'}</td>
                        <td style={{ ...tdBase, textAlign: 'right', color: t.text, fontWeight: 700, fontSize: 11 }}>{unitData.actual > 0 ? formatUnitValue(unitData.actual, selectedUnit) : <span style={{ color: t.textFaint }}>—</span>}</td>
                        <td style={{ ...tdBase, textAlign: 'right', color: ht ? varColor(m.variance) : t.textFaint, fontWeight: 700, fontSize: 11 }}>{ht ? `${m.variance >= 0 ? '+' : ''}${formatUnitValue(m.variance, selectedUnit)}` : '—'}</td>
                        <td style={{ ...tdBase, textAlign: 'right', color: ht ? varColor(m.variancePercentage) : t.textFaint, fontWeight: 700, fontSize: 11 }}>{ht ? formatPercentage(m.variancePercentage) : '—'}</td>
                        <td style={{ ...tdBase, textAlign: 'right' }}><AchieveBadge pct={m.achievement} theme={theme} hasTarget={ht} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
interface QuarterlyAnalysisProps {
  data: QuarterlyData[];
  theme?: Theme;
  selectedUnit?: string;
  onUnitChange?: (unit: string) => void;
}

export default function QuarterlyAnalysisComponent({ data, theme: themeProp, selectedUnit: propSelectedUnit, onUnitChange }: QuarterlyAnalysisProps) {
  const theme: Theme = themeProp ?? 'light';
  const t = TK[theme];

  const [internalSelectedUnit, setInternalSelectedUnit] = useState('units_dos');
  const selectedUnit = propSelectedUnit ?? internalSelectedUnit;
  const setSelectedUnit = onUnitChange ?? setInternalSelectedUnit;

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedQuarter, setSelectedQuarter] = useState('all');
  const [expandedChart, setExpandedChart] = useState<'bar' | 'pie' | null>(null);
  const [viewMode, setViewMode] = useState<'overview' | 'weekly' | 'monthly'>('overview');
  const [modalContent, setModalContent] = useState<React.ReactNode>(null);
  const [modalTitle, setModalTitle] = useState('');

  const openModal = (content: React.ReactNode, title: string) => { setModalContent(content); setModalTitle(title); };
  const closeModal = () => { setModalContent(null); setModalTitle(''); };

  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    data.forEach(q => q.details?.forEach((d: any) => {
      const cat = d.productCategory ?? getProductCategory(d.product);
      if (cat) cats.add(cat);
    }));
    return Array.from(cats).sort();
  }, [data]);

  const quarterOptions = useMemo(() => Array.from(new Set(data.map(q => q.quarter))).sort(), [data]);

  const filteredData = useMemo(() => {
    return data
      .filter(q => selectedQuarter === 'all' || q.quarter === selectedQuarter)
      .map(q => {

        // ─── Semua kategori: recalculate target/actual dari details, breakdown tetap asli
        if (selectedCategory === 'all') {
          if (!q.details?.length) return q;
          let tv = 0, av = 0;
          q.details.forEach((d: any) => {
            tv += getDetailTarget(d, selectedUnit);
            av += getDetailActual(d, selectedUnit);
          });
          const vr = av - tv;
          return {
            ...q,
            target:             Math.round(tv * 100) / 100,
            actual:             Math.round(av * 100) / 100,
            variance:           Math.round(vr * 100) / 100,
            variancePercentage: Math.round(tv > 0 ? (vr / tv) * 100 * 10 : 0) / 10,
          };
        }

        // ─── Filter details berdasarkan kategori ─────────────────────────
        const filteredDetails = (q.details ?? []).filter((d: any) => {
          const cat = d.productCategory ?? getProductCategory(d.product);
          return cat === selectedCategory;
        });

        // ─── Tidak ada produk di kategori ini untuk quarter ini ────────────
        if (!filteredDetails.length) {
          return {
            ...q,
            details:          [],
            target:           0,
            actual:           0,
            variance:         0,
            variancePercentage: 0,
            weeklyBreakdown:  (q.weeklyBreakdown ?? []).map((wb: any) => ({
              ...wb,
              target: 0, actual: 0, variance: 0, variancePercentage: 0, achievement: 0,
              hasTarget: false,
              units_dos:  { target: 0, actual: 0 },
              units_bks:  { target: 0, actual: 0 },
              units_slop: { target: 0, actual: 0 },
              units_bal:  { target: 0, actual: 0 },
            })),
            monthlyBreakdown: (q.monthlyBreakdown ?? []).map((mb: any) => ({
              ...mb,
              target: 0, actual: 0, variance: 0, variancePercentage: 0, achievement: 0,
              hasTarget: false,
              units_dos:  { target: 0, actual: 0 },
              units_bks:  { target: 0, actual: 0 },
              units_slop: { target: 0, actual: 0 },
              units_bal:  { target: 0, actual: 0 },
            })),
          };
        }

        // ─── Recalculate quarter-level target/actual dari filteredDetails ──
        let tv = 0, av = 0;
        filteredDetails.forEach((d: any) => {
          tv += getDetailTarget(d, selectedUnit);
          av += getDetailActual(d, selectedUnit);
        });
        const vr = av - tv;

        // ─── Rebuild weeklyBreakdown ───────────────────────────────────────
        // Actual: dari weeklyActuals per produk (akurat)
        // Target: dari weeklyTargets per produk jika tersedia (akurat),
        //         fallback ke proporsi jika tidak ada (estimasi)
        const newWeeklyBreakdown = (q.weeklyBreakdown ?? []).map((wb: any) => {
          const week = wb.week;

          // Sum actual minggu ini dari produk yang lolos filter
          let dos = 0, bks = 0, slop = 0, bal = 0;
          filteredDetails.forEach((d: any) => {
            const wa = (d.weeklyActuals as Record<number, WeekUnitData> | undefined)?.[week];
            if (wa) {
              dos  += wa.units_dos  ?? 0;
              bks  += wa.units_bks  ?? 0;
              slop += wa.units_slop ?? 0;
              bal  += wa.units_bal  ?? 0;
            }
          });

          // ── Target: coba weeklyTargets per produk dulu (akurat dari DB) ──
          let tgtDos = 0, tgtBks = 0, tgtSlop = 0, tgtBal = 0;
          let hasWeeklyTargets = false;

          filteredDetails.forEach((d: any) => {
            const wt = (d.weeklyTargets as Record<number, WeekUnitData> | undefined)?.[week];
            if (wt) {
              tgtDos  += wt.units_dos  ?? 0;
              tgtBks  += wt.units_bks  ?? 0;
              tgtSlop += wt.units_slop ?? 0;
              tgtBal  += wt.units_bal  ?? 0;
              hasWeeklyTargets = true;
            }
          });

          // ── Fallback proporsi jika weeklyTargets belum ada di backend ─────
          if (!hasWeeklyTargets) {
            const totalActualDos = wb.units_dos?.actual ?? wb.actual ?? 0;
            const ratio = totalActualDos > 0 ? dos / totalActualDos : 0;
            tgtDos  = parseFloat(((wb.units_dos?.target  ?? wb.target ?? 0) * ratio).toFixed(2));
            tgtBks  = parseFloat(((wb.units_bks?.target  ?? 0) * ratio).toFixed(2));
            tgtSlop = parseFloat(((wb.units_slop?.target ?? 0) * ratio).toFixed(2));
            tgtBal  = parseFloat(((wb.units_bal?.target  ?? 0) * ratio).toFixed(2));
          } else {
            tgtDos  = parseFloat(tgtDos.toFixed(2));
            tgtBks  = parseFloat(tgtBks.toFixed(2));
            tgtSlop = parseFloat(tgtSlop.toFixed(2));
            tgtBal  = parseFloat(tgtBal.toFixed(2));
          }

          const selActual = selectedUnit === 'units_bks'  ? bks
                          : selectedUnit === 'units_slop' ? slop
                          : selectedUnit === 'units_bal'  ? bal
                          : dos;
          const selTarget = selectedUnit === 'units_bks'  ? tgtBks
                          : selectedUnit === 'units_slop' ? tgtSlop
                          : selectedUnit === 'units_bal'  ? tgtBal
                          : tgtDos;

          const hasRebuildTarget = selTarget > 0;
          const selVar    = selActual - selTarget;
          const selVarPct = hasRebuildTarget ? (selVar / selTarget) * 100 : 0;
          const selAch    = hasRebuildTarget
            ? (selActual / selTarget) * 100
            : selActual > 0 ? -1 : 0;

          return {
            ...wb,
            target:             parseFloat(selTarget.toFixed(2)),
            actual:             parseFloat(selActual.toFixed(2)),
            variance:           parseFloat(selVar.toFixed(2)),
            variancePercentage: parseFloat(selVarPct.toFixed(1)),
            achievement:        parseFloat(selAch.toFixed(1)),
            hasTarget:          hasRebuildTarget,
            units_dos:  { target: tgtDos,  actual: parseFloat(dos.toFixed(2))  },
            units_bks:  { target: tgtBks,  actual: parseFloat(bks.toFixed(2))  },
            units_slop: { target: tgtSlop, actual: parseFloat(slop.toFixed(2)) },
            units_bal:  { target: tgtBal,  actual: parseFloat(bal.toFixed(2))  },
          };
        });

        // ─── Rebuild monthlyBreakdown dari newWeeklyBreakdown ─────────────
        // Gunakan tahun saat ini hanya untuk mapping nama bulan — tidak mempengaruhi angka
        const yearForMonth = new Date().getFullYear();

        const newMonthlyBreakdown = (q.monthlyBreakdown ?? []).map((mb: any) => {
          const monthWeeks = newWeeklyBreakdown.filter(
            (wb: any) => getMonthFromWeek(wb.week, yearForMonth) === mb.month
          );

          const dos  = monthWeeks.reduce((s: number, wb: any) => s + (wb.units_dos?.actual  ?? 0), 0);
          const bks  = monthWeeks.reduce((s: number, wb: any) => s + (wb.units_bks?.actual  ?? 0), 0);
          const slop = monthWeeks.reduce((s: number, wb: any) => s + (wb.units_slop?.actual ?? 0), 0);
          const bal  = monthWeeks.reduce((s: number, wb: any) => s + (wb.units_bal?.actual  ?? 0), 0);
          const tDos  = monthWeeks.reduce((s: number, wb: any) => s + (wb.units_dos?.target  ?? 0), 0);
          const tBks  = monthWeeks.reduce((s: number, wb: any) => s + (wb.units_bks?.target  ?? 0), 0);
          const tSlop = monthWeeks.reduce((s: number, wb: any) => s + (wb.units_slop?.target ?? 0), 0);
          const tBal  = monthWeeks.reduce((s: number, wb: any) => s + (wb.units_bal?.target  ?? 0), 0);

          const selActual = selectedUnit === 'units_bks'  ? bks
                          : selectedUnit === 'units_slop' ? slop
                          : selectedUnit === 'units_bal'  ? bal
                          : dos;
          const selTarget = selectedUnit === 'units_bks'  ? tBks
                          : selectedUnit === 'units_slop' ? tSlop
                          : selectedUnit === 'units_bal'  ? tBal
                          : tDos;

          const hasRebuildTarget = selTarget > 0;
          const selVar    = selActual - selTarget;
          const selVarPct = hasRebuildTarget ? (selVar / selTarget) * 100 : 0;
          const selAch    = hasRebuildTarget ? (selActual / selTarget) * 100 : 0;

          return {
            ...mb,
            target:             parseFloat(selTarget.toFixed(2)),
            actual:             parseFloat(selActual.toFixed(2)),
            variance:           parseFloat(selVar.toFixed(2)),
            variancePercentage: parseFloat(selVarPct.toFixed(1)),
            achievement:        parseFloat(selAch.toFixed(1)),
            hasTarget:          hasRebuildTarget,
            units_dos:  { target: parseFloat(tDos.toFixed(2)),  actual: parseFloat(dos.toFixed(2))  },
            units_bks:  { target: parseFloat(tBks.toFixed(2)),  actual: parseFloat(bks.toFixed(2))  },
            units_slop: { target: parseFloat(tSlop.toFixed(2)), actual: parseFloat(slop.toFixed(2)) },
            units_bal:  { target: parseFloat(tBal.toFixed(2)),  actual: parseFloat(bal.toFixed(2))  },
          };
        });

        return {
          ...q,
          details:            filteredDetails,
          target:             Math.round(tv * 100) / 100,
          actual:             Math.round(av * 100) / 100,
          variance:           Math.round(vr * 100) / 100,
          variancePercentage: Math.round(tv > 0 ? (vr / tv) * 100 * 10 : 0) / 10,
          weeklyBreakdown:    newWeeklyBreakdown,
          monthlyBreakdown:   newMonthlyBreakdown,
        };
      });
  }, [data, selectedUnit, selectedCategory, selectedQuarter]);

  const performanceData = filteredData.map(q => ({ quarter: q.quarter, target: q.target, actual: q.actual, achievement: q.target > 0 ? (q.actual / q.target) * 100 : 0 }));
  const pieData         = filteredData.map(q => ({ name: q.quarter, value: q.actual }));
  const quartersWithTgt = filteredData.filter(q => q.target > 0);
  const avgAchievement  = quartersWithTgt.length > 0 ? quartersWithTgt.reduce((s, q) => s + (q.actual / q.target) * 100, 0) / quartersWithTgt.length : 0;
  const bestQ           = filteredData.length > 0 ? filteredData.reduce((m, q) => q.actual > m.actual ? q : m) : null;
  const yTickFmt        = makeYFmt(selectedUnit);

  const axisProps = {
    tick: { fill: t.axisColor, fontSize: 11, fontFamily: 'IBM Plex Mono, monospace' },
    axisLine: { stroke: t.border },
    tickLine: false as const,
  };

  const card = (extra: React.CSSProperties = {}): React.CSSProperties => ({
    background: t.cardBg, border: `1px solid ${t.borderCard}`, borderRadius: 12, padding: 20, boxShadow: t.shadow, transition: 'background 0.3s, border-color 0.3s', ...extra,
  });
  const tdBase: React.CSSProperties = {
    padding: '11px 18px', fontSize: 12, fontFamily: 'IBM Plex Mono, monospace', borderBottom: `1px solid ${t.border}`, color: t.textSub, whiteSpace: 'nowrap',
  };

  const renderBarChart = (height: number | string, withLegend = false) => (
    <div style={{ height, width: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={performanceData} margin={{ top: 4, right: 12, bottom: 4, left: 8 }} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" stroke={t.gridStroke} />
          <XAxis dataKey="quarter" {...axisProps} />
          <YAxis
            tickFormatter={yTickFmt}
            {...axisProps}
            axisLine={false}
            width={72}
            label={{
              value: getUnitShortLabel(selectedUnit),
              angle: -90,
              position: 'insideLeft',
              offset: 10,
              style: { fill: t.axisColor, fontSize: 9, fontFamily: 'IBM Plex Mono, monospace' },
            }}
          />
          <Tooltip content={<ChartTooltip labelPrefix="Quarter: " theme={theme} unit={selectedUnit} />} />
          {withLegend && <Legend wrapperStyle={{ fontSize: 12, color: t.textSub, paddingTop: 12 }} />}
          <Bar dataKey="target" fill="#94a3b8" name="Target" radius={[3,3,0,0]} maxBarSize={40} />
          <Bar dataKey="actual" fill="#3b82f6" name="Actual"  radius={[3,3,0,0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );

  const renderPieChart = (outerR: number, height: number | string, withLegend = false) => (
    <div style={{ height, width: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPieChart>
          <Pie
            data={pieData}
            cx="50%" cy="50%"
            labelLine={false}
            label={({ name, percent }: any) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
            outerRadius={outerR}
            dataKey="value"
          >
            {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
          </Pie>
          <Tooltip content={<ChartTooltip theme={theme} unit={selectedUnit} />} />
          {withLegend && (
            <Legend
              wrapperStyle={{ fontSize: 12, color: t.textSub, paddingTop: 12 }}
              formatter={(v: string) => <span style={{ color: t.textSub }}>{v}</span>}
            />
          )}
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, fontFamily: 'IBM Plex Sans, sans-serif' }}>

      {/* Info banner */}
      <div style={{ padding: '10px 14px', background: t.infoBg, border: `1px solid ${t.infoBorder}`, borderRadius: 10 }}>
        <p style={{ margin: 0, fontSize: 12, color: t.infoText, fontFamily: 'IBM Plex Mono, monospace', lineHeight: 1.6 }}>
          <strong>Periode:</strong> {selectedQuarter === 'all' ? 'Q1–Q4' : selectedQuarter}
          &nbsp;|&nbsp;<strong>Rata-rata Achievement:</strong> {quartersWithTgt.length > 0 ? `${avgAchievement.toFixed(1)}%` : 'N/A'}
          &nbsp;|&nbsp;<strong>Best Quarter:</strong> {bestQ?.quarter ?? '—'}
          {selectedCategory !== 'all' && <>&nbsp;|&nbsp;<strong>Kategori:</strong> {selectedCategory}</>}
          &nbsp;|&nbsp;<strong>Unit:</strong> {getUnitLabel(selectedUnit)}
        </p>
      </div>

      {/* Filter */}
      <div style={card()}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: t.textMuted, fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Filter Data</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <FilterSelect label="Unit" accentColor="#10b981" value={selectedUnit} onChange={e => setSelectedUnit(e.target.value)} theme={theme}>
              {UNIT_OPTIONS.map(o => <option key={o.value} value={o.value} style={{ background: t.selectBg }}>{o.label}</option>)}
            </FilterSelect>
            <FilterSelect label="Kategori" accentColor="#8b5cf6" value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} theme={theme}>
              <option value="all" style={{ background: t.selectBg }}>Semua</option>
              {availableCategories.map(c => <option key={c} value={c} style={{ background: t.selectBg }}>{c}</option>)}
            </FilterSelect>
            <FilterSelect label="Kuartal" accentColor="#3b82f6" value={selectedQuarter} onChange={e => setSelectedQuarter(e.target.value)} theme={theme}>
              <option value="all" style={{ background: t.selectBg }}>Semua Kuartal</option>
              {quarterOptions.map(q => <option key={q} value={q} style={{ background: t.selectBg }}>{q}</option>)}
            </FilterSelect>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              { value: 'overview', label: 'Overview',        color: '#3b82f6' },
              { value: 'weekly',   label: 'Detail Mingguan', color: '#10b981' },
              { value: 'monthly',  label: 'Detail Bulanan',  color: '#f59e0b' },
            ].map(mode => (
              <button key={mode.value} onClick={() => setViewMode(mode.value as any)}
                style={{ padding: '6px 14px', borderRadius: 7, fontSize: 12, fontWeight: 600, fontFamily: 'IBM Plex Mono, monospace', cursor: 'pointer', transition: 'all 0.15s', background: viewMode === mode.value ? `${mode.color}18` : t.inputBg, border: `1px solid ${viewMode === mode.value ? mode.color : t.inputBorder}`, color: viewMode === mode.value ? mode.color : t.textSub }}>
                {mode.label}
              </button>
            ))}
          </div>
          </div>
        </div>
      </div>

      {/* View Mode */}
      {/* <div style={card()}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: t.textMuted, fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Mode Tampilan</span>
          
        </div>
      </div> */}

      {/* ── Overview ── */}
      {viewMode === 'overview' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14 }}>
            <div style={card({ padding: '18px 16px' })}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: t.text }}>Target vs Actual · {getUnitLabel(selectedUnit)}</span>
                <ExpandBtn onClick={() => setExpandedChart('bar')} theme={theme} />
              </div>
              <div style={{ background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: 8, padding: '10px 6px 6px' }}>{renderBarChart(260)}</div>
            </div>
            <div style={card({ padding: '18px 16px' })}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: t.text }}>Distribusi Penjualan · {getUnitLabel(selectedUnit)}</span>
                <ExpandBtn onClick={() => setExpandedChart('pie')} theme={theme} />
              </div>
              <div style={{ background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: 8, padding: '10px 6px 6px' }}>{renderPieChart(80, 276)}</div>
            </div>
          </div>

          {/* Quarter cards */}
          <div style={card()}>
            <span style={{ display: 'block', fontSize: 11, fontWeight: 700, color: t.textMuted, fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
              Performa per Kuartal · {getUnitLabel(selectedUnit)}
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
              {filteredData.map(q => {
                const hasQTarget  = q.target > 0;
                const achievement = hasQTarget ? (q.actual / q.target) * 100 : 0;
                const hit         = q.variancePercentage >= 0;
                return (
                  <div key={q.quarter} style={{ background: t.qCardBg, border: `1px solid ${!hasQTarget ? t.borderCard : (hit ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.2)')}`, borderLeft: `3px solid ${!hasQTarget ? t.textFaint : (hit ? '#10b981' : '#ef4444')}`, borderRadius: 10, padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <span style={{ fontSize: 16, fontWeight: 800, color: t.text, fontFamily: 'IBM Plex Mono, monospace' }}>{q.quarter}</span>
                      {hasQTarget
                        ? <span style={{ padding: '2px 8px', borderRadius: 5, fontSize: 10, fontWeight: 700, fontFamily: 'IBM Plex Mono, monospace', background: hit ? t.posBg : t.negBg, color: hit ? t.posText : t.negText }}>{hit ? 'ON TARGET' : 'MISS'}</span>
                        : <span style={{ padding: '2px 8px', borderRadius: 5, fontSize: 10, fontWeight: 700, fontFamily: 'IBM Plex Mono, monospace', background: t.inputBg, color: t.textMuted, border: `1px solid ${t.inputBorder}` }}>NO TARGET</span>
                      }
                    </div>
                    {[
                      { label: 'Target',     value: hasQTarget ? formatUnitValue(q.target, selectedUnit) : '—',                                                      color: t.textSub,                                                bold: false },
                      { label: 'Actual',     value: q.actual > 0 ? formatUnitValue(q.actual, selectedUnit) : '—',                                                   color: t.text,                                                   bold: true  },
                      { label: 'Variance',   value: hasQTarget ? `${q.variance >= 0 ? '+' : ''}${formatUnitValue(q.variance, selectedUnit)}` : '—',                color: hasQTarget ? varColor(q.variance) : t.textFaint,          bold: true  },
                      { label: 'Variance %', value: hasQTarget ? formatPercentage(q.variancePercentage) : '—',                                                       color: hasQTarget ? varColor(q.variancePercentage) : t.textFaint, bold: true  },
                    ].map((row, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                        <span style={{ fontSize: 12, color: t.textMuted }}>{row.label}</span>
                        <span style={{ fontSize: 12, fontFamily: 'IBM Plex Mono, monospace', color: row.color, fontWeight: row.bold ? 700 : 400 }}>{row.value}</span>
                      </div>
                    ))}
                    <div style={{ borderTop: `1px solid ${t.border}`, marginTop: 10, paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: t.textMuted }}>Achievement</span>
                      <AchieveBadge pct={achievement} theme={theme} hasTarget={hasQTarget} />
                    </div>
                    <div style={{ marginTop: 10, height: 5, background: t.inputBg, borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.min(100, achievement)}%`, background: !hasQTarget ? t.textFaint : (hit ? '#10b981' : '#ef4444'), borderRadius: 3, transition: 'width 0.7s' }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <p style={{ margin: '12px 0 0', fontSize: 11, color: t.textMuted, fontFamily: 'IBM Plex Mono, monospace' }}>
              {filteredData.length} kuartal · {getUnitLabel(selectedUnit)}{selectedCategory !== 'all' ? ` · ${selectedCategory}` : ''}
            </p>
          </div>

          {/* Detail table */}
          <div style={card()}>
            <span style={{ display: 'block', fontSize: 11, fontWeight: 700, color: t.textMuted, fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
              Detail per Kuartal · {getUnitLabel(selectedUnit)}
            </span>
            <div style={{ border: `1px solid ${t.border}`, borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['Quarter', `Target (${getUnitShortLabel(selectedUnit)})`, `Actual (${getUnitShortLabel(selectedUnit)})`, 'Variance', 'Variance %', 'Achievement'].map((h, i) => (
                        <th key={h} style={{ padding: '9px 14px', textAlign: i === 0 ? 'left' : 'right', fontSize: 9, fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, color: t.tableHeadText, background: t.tableHeadBg, borderBottom: `1px solid ${t.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((q, idx) => {
                      const hasQTarget  = q.target > 0;
                      const achievement = hasQTarget ? (q.actual / q.target) * 100 : 0;
                      return (
                        <tr key={q.quarter} style={{ background: idx % 2 !== 0 ? t.rowAlt : 'transparent' }}
                          onMouseEnter={e => (e.currentTarget.style.background = t.rowHover)}
                          onMouseLeave={e => (e.currentTarget.style.background = idx % 2 !== 0 ? t.rowAlt : 'transparent')}>
                          <td style={{ ...tdBase, color: t.text, fontWeight: 700, fontSize: 13 }}>{q.quarter}</td>
                          <td style={{ ...tdBase, textAlign: 'right', color: hasQTarget ? t.textSub : t.textFaint }}>{hasQTarget ? formatUnitValue(q.target, selectedUnit) : '—'}</td>
                          <td style={{ ...tdBase, textAlign: 'right', color: t.text, fontWeight: 700 }}>{q.actual > 0 ? formatUnitValue(q.actual, selectedUnit) : '—'}</td>
                          <td style={{ ...tdBase, textAlign: 'right', color: hasQTarget ? varColor(q.variance) : t.textFaint, fontWeight: 700 }}>{hasQTarget ? `${q.variance >= 0 ? '+' : ''}${formatUnitValue(q.variance, selectedUnit)}` : '—'}</td>
                          <td style={{ ...tdBase, textAlign: 'right', color: hasQTarget ? varColor(q.variancePercentage) : t.textFaint, fontWeight: 700 }}>{hasQTarget ? formatPercentage(q.variancePercentage) : '—'}</td>
                          <td style={{ ...tdBase, textAlign: 'right' }}><AchieveBadge pct={achievement} theme={theme} hasTarget={hasQTarget} /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {viewMode === 'weekly'  && <WeeklyDetailView  data={filteredData} selectedUnit={selectedUnit} theme={theme} card={card} tdBase={tdBase} expandModal={openModal} />}
      {viewMode === 'monthly' && <MonthlyDetailView data={filteredData} selectedUnit={selectedUnit} theme={theme} card={card} tdBase={tdBase} expandModal={openModal} />}

      {/* Overview modal */}
      {expandedChart && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          onClick={() => setExpandedChart(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: t.modalBg,
              border: `1px solid ${t.borderCard}`,
              borderRadius: '16px 16px 0 0',
              width: '100%',
              maxWidth: 1100,
              height: '92dvh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 -8px 40px rgba(0,0,0,0.35)',
              overflow: 'hidden',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px', flexShrink: 0 }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: t.textFaint }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px 12px', borderBottom: `1px solid ${t.border}`, background: t.tableHeadBg, flexShrink: 0, gap: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: t.text, lineHeight: 1.3, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {expandedChart === 'bar' ? `Target vs Actual · ${getUnitLabel(selectedUnit)}` : `Distribusi · ${getUnitLabel(selectedUnit)}`}
              </span>
              <button
                onClick={() => setExpandedChart(null)}
                style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, cursor: 'pointer', color: t.textMuted, padding: '6px 10px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0, fontSize: 12, fontFamily: 'IBM Plex Mono, monospace', fontWeight: 600 }}
              >
                <X size={14} /> Tutup
              </button>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: '16px 12px', background: t.cardBg, WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
              {expandedChart === 'bar'
                ? renderBarChart('calc(92dvh - 120px)', true)
                : renderPieChart(120, 'calc(92dvh - 120px)', true)
              }
            </div>
          </div>
        </div>
      )}

      {/* Sub-view modal */}
      {modalContent && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          onClick={closeModal}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: t.modalBg,
              border: `1px solid ${t.borderCard}`,
              borderRadius: '16px 16px 0 0',
              width: '100%',
              maxWidth: 1200,
              height: '94dvh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 -8px 40px rgba(0,0,0,0.35)',
              overflow: 'hidden',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px', flexShrink: 0 }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: t.textFaint }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px 12px', borderBottom: `1px solid ${t.border}`, background: t.tableHeadBg, flexShrink: 0, gap: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: t.text, lineHeight: 1.3, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {modalTitle}
              </span>
              <button
                onClick={closeModal}
                style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, cursor: 'pointer', color: t.textMuted, padding: '6px 10px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0, fontSize: 12, fontFamily: 'IBM Plex Mono, monospace', fontWeight: 600 }}
              >
                <X size={14} /> Tutup
              </button>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: '16px 12px', background: t.cardBg, WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
              {modalContent}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}