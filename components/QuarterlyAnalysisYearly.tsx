'use client';

import { useState, useMemo, useEffect } from 'react';
import { Maximize2, X, ChevronUp, ChevronDown } from 'lucide-react';
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

// Types
// Data-nya sekarang murni Actual vs Actual (dua tahun/periode berbeda), BUKAN
// Target vs Actual. `previous` = periode/tahun pertama, `current` = periode/
// tahun kedua. Semua unit (termasuk Omzet) selalu punya dua-duanya.
export interface YoYWeekUnitData {
  units_dos: number; units_bks: number; units_slop: number; units_bal: number;
  omzet?: number;
}

export interface YoYProductDetail {
  product: string;
  productCategory?: string;
  units_dos?: { previous: number; current: number };
  units_bks?:  { previous: number; current: number };
  units_slop?: { previous: number; current: number };
  units_bal?:  { previous: number; current: number };
  omzet?:      { previous: number; current: number };
  weeklyPrevious?: Record<number, YoYWeekUnitData>;
  weeklyCurrent?:  Record<number, YoYWeekUnitData>;
}

export interface YoYWeekBreakdown {
  week: number;
  previous: number; current: number; variance: number; variancePercentage: number;
  units_dos?: { previous: number; current: number };
  units_bks?:  { previous: number; current: number };
  units_slop?: { previous: number; current: number };
  units_bal?:  { previous: number; current: number };
}

export interface YoYMonthBreakdown {
  month: string;
  previous: number; current: number; variance: number; variancePercentage: number;
  units_dos?: { previous: number; current: number };
  units_bks?:  { previous: number; current: number };
  units_slop?: { previous: number; current: number };
  units_bal?:  { previous: number; current: number };
}

export interface QuarterlyYoYData {
  quarter: string;
  previous: number; current: number; variance: number; variancePercentage: number;
  details?: YoYProductDetail[];
  weeklyBreakdown?: YoYWeekBreakdown[];
  monthlyBreakdown?: YoYMonthBreakdown[];
}

type Theme = 'dark' | 'light';

const TK = {
  dark: {
    cardBg:        '#111318',
    border:        'rgba(255,255,255,0.06)',
    borderCard:    'rgba(255,255,255,0.07)',
    tableHeadBg:   '#fef08a',
    tableHeadText: 'rgb(0, 0, 0)',
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
    neuBg:   'rgba(255,255,255,0.06)', neuText: 'rgba(255,255,255,0.4)',
    shadow:  'none',
  },
  light: {
    cardBg:        '#ffffff',
    border:        'rgba(0,0,0,0.07)',
    borderCard:    'rgba(0,0,0,0.08)',
    tableHeadBg:   '#fef08a',
    tableHeadText: 'rgb(0, 0, 0)',
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
    neuBg:   'rgba(0,0,0,0.04)',     neuText: '#94a3b8',
    shadow:  '0 1px 8px rgba(0,0,0,0.07)',
  },
} as const;

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
const QUARTER_COLORS: Record<string, string> = {
  Q1: '#3b82f6', Q2: '#10b981', Q3: '#f59e0b', Q4: '#a855f7',
};
const PREV_COLOR = '#94a3b8'; // periode/tahun pertama — abu netral
const CURR_COLOR = '#3b82f6'; // periode/tahun kedua — biru, jadi fokus utama
const varColor = (v: number) => v >= 0 ? '#10b981' : '#ef4444';

const UNIT_OPTIONS = [
  { value: 'units_bks',  label: 'Jual (Bks Net)',  shortLabel: 'Bks'  },
  { value: 'units_slop', label: 'Jual (Slop Net)', shortLabel: 'Slop' },
  { value: 'units_bal',  label: 'Jual (Bal Net)',  shortLabel: 'Bal'  },
  { value: 'units_dos',  label: 'Jual (Dos Net)',  shortLabel: 'Dos'  },
  { value: 'omzet',      label: 'Omzet (Rp)',      shortLabel: 'Rp'   },
];

const formatUnitValue = (value: number, unit?: string) => {
  if (unit === 'omzet') {
    const av = Math.abs(value);
    if (av >= 1e12) return `Rp ${(value / 1e9).toFixed(1)}M`;
    return `Rp ${Math.round(value).toLocaleString('id-ID')}`;
  }
  return value.toLocaleString('id-ID', { maximumFractionDigits: 2 });
};

const formatPercentage = (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`;

const getUnitLabel = (unit: string) =>
  UNIT_OPTIONS.find(o => o.value === unit)?.label ?? UNIT_OPTIONS[0].label;

const getUnitShortLabel = (unit: string) =>
  UNIT_OPTIONS.find(o => o.value === unit)?.shortLabel ?? UNIT_OPTIONS[0].shortLabel;

const makeYFmt = (unit: string) => (v: number) => {
  if (unit === 'omzet') {
    const av = Math.abs(v);
    if (av >= 1e9) return `Rp ${(v / 1e9).toFixed(1)}M`;
    if (av >= 1e6) return `Rp ${(v / 1e6).toFixed(1)}jt`;
    if (av >= 1e3) return `Rp ${(v / 1e3).toFixed(0)}rb`;
    return `Rp ${Math.round(v)}`;
  }
  const suffix = getUnitShortLabel(unit);
  return `${Math.round(v)} ${suffix}`;
};

// Helpers
function getDetailValue(d: any, unit: string, side: 'previous' | 'current'): number {
  const ud = d[unit] as { previous?: number; current?: number } | undefined;
  if (ud?.[side] !== undefined && ud[side] !== null) return ud[side] as number;
  return 0;
}

function getMonthFromWeek(week: number, year: number): string {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const dayOfYear = (week - 1) * 7 + 4;
  const date = new Date(year, 0, dayOfYear);
  return months[date.getMonth()];
}

function comparisonState(previous: number, current: number) {
  const hasComparison = previous > 0 || current > 0;
  const isNew  = previous === 0 && current > 0;
  const pct    = previous > 0 ? ((current - previous) / previous) * 100 : (isNew ? null : 0);
  return { hasComparison, isNew, pct };
}

// GrowthBadge
// Ganti AchieveBadge: dulu "achievement vs target", sekarang "growth YoY".
function GrowthBadge({ previous, current, theme }: { previous: number; current: number; theme: Theme }) {
  const t = TK[theme];
  const { hasComparison, isNew, pct } = comparisonState(previous, current);
  if (!hasComparison) {
    return <span style={{ padding: '2px 8px', borderRadius: 5, fontSize: 10, fontWeight: 700, fontFamily: 'IBM Plex Mono, monospace', background: t.inputBg, color: t.textMuted, border: `1px solid ${t.inputBorder}` }}>N/A</span>;
  }
  if (isNew || pct === null) {
    return <span style={{ padding: '2px 8px', borderRadius: 5, fontSize: 10, fontWeight: 700, fontFamily: 'IBM Plex Mono, monospace', background: t.neuBg, color: t.neuText, border: `1px solid ${t.inputBorder}` }}>BARU</span>;
  }
  const pos = pct >= 0;
  return (
    <span style={{ padding: '2px 8px', borderRadius: 5, fontSize: 10, fontWeight: 700, fontFamily: 'IBM Plex Mono, monospace', background: pos ? t.posBg : t.negBg, color: pos ? t.posText : t.negText }}>
      {formatPercentage(pct)}
    </span>
  );
}

// ViewToggle
function ViewToggle({ value, onChange, theme }: { value: 'chart' | 'table'; onChange: (v: 'chart' | 'table') => void; theme: Theme }) {
  const t = TK[theme];
  return (
    <div style={{ display: 'flex', border: `1px solid ${t.inputBorder}`, borderRadius: 7, overflow: 'hidden' }}>
      {(['chart', 'table'] as const).map(mode => (
        <button key={mode} onClick={() => onChange(mode)}
          style={{ padding: '4px 10px', border: 'none', cursor: 'pointer', fontSize: 11, fontFamily: 'IBM Plex Mono, monospace', background: value === mode ? t.btnBg : t.inputBg, color: value === mode ? t.btnText : t.textMuted, fontWeight: value === mode ? 700 : 400, borderRight: mode === 'chart' ? `1px solid ${t.inputBorder}` : 'none' }}>
          {mode === 'chart' ? 'Grafik' : 'Tabel'}
        </button>
      ))}
    </div>
  );
}

// FilterSelect
function FilterSelect({ label, accentColor = '#3b82f6', value, onChange, children, theme }: {
  label: string; accentColor?: string; value: string | number;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  children: React.ReactNode; theme: Theme;
}) {
  const t = TK[theme];
  return (
    <div style={{ display: 'flex', alignItems: 'stretch', border: `1px solid ${t.inputBorder}`, borderRadius: 8, overflow: 'hidden' }}>
      <span style={{ padding: '6px 10px', fontSize: 10, fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600, color: accentColor, background: `${accentColor}18`, borderRight: `1px solid ${t.inputBorder}`, display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', flexShrink: 0 }}>{label}</span>
      <select value={value} onChange={onChange} style={{ background: t.inputBg, border: 'none', outline: 'none', padding: '6px 10px', fontSize: 12, fontFamily: 'IBM Plex Mono, monospace', color: t.text, cursor: 'pointer', minWidth: 0, flex: 1, appearance: 'none' }}>
        {children}
      </select>
    </div>
  );
}

// ExpandBtn
function ExpandBtn({ onClick, theme }: { onClick: () => void; theme: Theme }) {
  const t = TK[theme];
  return (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 6, background: t.btnBg, border: `1px solid ${t.btnBorder}`, color: t.btnText, cursor: 'pointer', fontSize: 11, fontWeight: 500, fontFamily: 'IBM Plex Mono, monospace', flexShrink: 0 }}>
      <Maximize2 size={12} /> Perbesar
    </button>
  );
}

// TableBtn
function TableBtn({ onClick, theme, active }: { onClick: () => void; theme: Theme; active?: boolean }) {
  const t = TK[theme];
  return (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 6, background: active ? `${t.btnText}22` : t.btnBg, border: `1px solid ${active ? t.btnText : t.btnBorder}`, color: t.btnText, cursor: 'pointer', fontSize: 11, fontWeight: 500, fontFamily: 'IBM Plex Mono, monospace', flexShrink: 0, transition: 'all 0.15s' }}>
      {active
        ? <svg width={12} height={12} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}><polyline points="1,12 5,7 8,9 11,4 15,2" /></svg>
        : <svg width={12} height={12} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}><rect x="1" y="1" width="14" height="14" rx="2" /><line x1="1" y1="5.5" x2="15" y2="5.5" /><line x1="1" y1="10.5" x2="15" y2="10.5" /><line x1="5.5" y1="5.5" x2="5.5" y2="15" /></svg>
      }
      {active ? 'Chart' : 'Tabel'}
    </button>
  );
}

// ChartTooltip
function ChartTooltip({ active, payload, label, labelPrefix, theme, unit, previousLabel, currentLabel }: any) {
  const t = TK[theme as Theme];
  if (!active || !payload?.length) return null;
  const visible = payload.filter((p: any) => p.value != null);
  if (!visible.length) return null;
  const isOmzet = unit === 'omzet';
  const short   = !isOmzet && unit ? getUnitShortLabel(unit) : '';
  return (
    <div style={{ background: t.tooltipBg, border: `1px solid ${t.tooltipBorder}`, borderRadius: 8, padding: '10px 14px', boxShadow: '0 8px 24px rgba(0,0,0,0.18)' }}>
      <div style={{ fontSize: 11, color: t.textMuted, fontFamily: 'IBM Plex Mono, monospace', marginBottom: 7 }}>{labelPrefix ?? ''}{label}</div>
      {visible.map((p: any, i: number) => {
        const isPct     = p.name === 'Growth %';
        const formatted = isPct
          ? formatPercentage(p.value as number)
          : isOmzet
            ? formatUnitValue(p.value as number, 'omzet')
            : `${formatUnitValue(p.value, unit)} ${short}`;
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: i < visible.length - 1 ? 4 : 0 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: p.fill ?? p.color, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: t.textSub, fontFamily: 'IBM Plex Sans, sans-serif' }}>
              {p.name}{!isPct && !isOmzet && short ? ` (${short})` : ''}:
            </span>
            <span style={{ fontSize: 12, fontWeight: 700, color: t.text, fontFamily: 'IBM Plex Mono, monospace' }}>{formatted}</span>
          </div>
        );
      })}
    </div>
  );
}

// WeeklyYoYDetailView
function WeeklyYoYDetailView({ data, selectedUnit, theme, card, tdBase, expandModal, previousLabel, currentLabel }: {
  data: QuarterlyYoYData[]; selectedUnit: string; theme: Theme;
  card: (extra?: React.CSSProperties) => React.CSSProperties;
  tdBase: React.CSSProperties;
  expandModal: (content: React.ReactNode, title: string) => void;
  previousLabel: string; currentLabel: string;
}) {
  const t    = TK[theme];
  const yFmt = makeYFmt(selectedUnit);

  const [displayMode, setDisplayMode] = useState<'chart' | 'table'>('chart');
  const [selectedQ, setSelectedQ]     = useState('all');

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

  const weeksWithData = useMemo(() => filteredWeekly.filter(w => w.previous > 0 || w.current > 0), [filteredWeekly]);
  const growthPcts     = weeksWithData.filter(w => w.previous > 0).map(w => w.variancePercentage);
  const avgGrowth      = growthPcts.length > 0 ? growthPcts.reduce((s, v) => s + v, 0) / growthPcts.length : 0;
  const weeksUp   = weeksWithData.filter(w => w.previous > 0 && w.current >= w.previous).length;
  const weeksDown = weeksWithData.filter(w => w.previous > 0 && w.current <  w.previous).length;

  const chartData = filteredWeekly
    .filter(w => w.previous > 0 || w.current > 0)
    .map(w => {
      const ud = (w as any)[selectedUnit] || { previous: w.previous, current: w.current };
      return {
        name:        `W${w.week}`,
        quarter:     (w as any).quarter,
        previous:    ud.previous > 0 ? ud.previous : null,
        current:     ud.current  > 0 ? ud.current  : null,
        growth:      ud.previous > 0 ? ((ud.current - ud.previous) / ud.previous) * 100 : null,
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
          width={selectedUnit === 'omzet' ? 84 : 72}
          label={{ value: getUnitShortLabel(selectedUnit), angle: -90, position: 'insideLeft', offset: 10, style: { fill: t.axisColor, fontSize: 9, fontFamily: 'IBM Plex Mono, monospace' } }}
        />
        <YAxis yAxisId="right" orientation="right" tickFormatter={v => `${v.toFixed(0)}%`} {...axisProps} axisLine={false} />
        <Tooltip content={<ChartTooltip labelPrefix="Minggu: " theme={theme} unit={selectedUnit} previousLabel={previousLabel} currentLabel={currentLabel} />} />
        <Bar yAxisId="left" dataKey="previous" fill={PREV_COLOR} name={previousLabel} radius={[3,3,0,0]} maxBarSize={22} opacity={0.75} />
        <Bar yAxisId="left" dataKey="current" fill={CURR_COLOR} name={currentLabel} radius={[3,3,0,0]} maxBarSize={22} />
        <Line yAxisId="right" type="monotone" dataKey="growth" connectNulls={false} stroke="#f87171" strokeWidth={2} dot={{ r: 4, fill: '#f87171', strokeWidth: 0 }} name="Growth %" />
        <ReferenceLine yAxisId="right" y={0} stroke={t.textMuted} strokeDasharray="4 4" strokeWidth={1.5} />
      </ComposedChart>
    </ResponsiveContainer>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
        {[
          { label: 'Total Minggu', value: filteredWeekly.length, color: t.text },
          { label: `Rata-rata Growth (${growthPcts.length}W)`, value: growthPcts.length > 0 ? formatPercentage(avgGrowth) : 'N/A', color: growthPcts.length > 0 ? (avgGrowth >= 0 ? t.posText : t.negText) : t.textMuted },
          { label: 'Minggu Naik',  value: weeksUp,   color: t.posText },
          { label: 'Minggu Turun', value: weeksDown, color: t.negText },
        ].map((s, i) => (
          <div key={i} style={{ padding: '10px 14px', borderRadius: 10, background: t.qCardBg, border: `1px solid ${t.borderCard}`, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 10, color: t.text, fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{s.label}</span>
            <span style={{ fontSize: 18, fontWeight: 800, color: s.color, fontFamily: 'IBM Plex Mono, monospace' }}>{s.value}</span>
          </div>
        ))}
      </div>

      <div style={card()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: t.text, fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
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

        {displayMode === 'chart' && (
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: t.textSub, fontFamily: 'IBM Plex Sans, sans-serif' }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: PREV_COLOR }} />{previousLabel}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: t.textSub, fontFamily: 'IBM Plex Sans, sans-serif' }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: CURR_COLOR }} />{currentLabel}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#f87171', fontFamily: 'IBM Plex Sans, sans-serif' }}>
              <span style={{ width: 18, height: 2, background: '#f87171', borderRadius: 2 }} />Growth %
            </span>
          </div>
        )}

        {displayMode === 'chart' ? (
          <div style={{ background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: 8, padding: '12px 6px 6px' }}>
            {renderChart(300)}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {data.filter(q => selectedQ === 'all' || q.quarter === selectedQ).map(quarter => {
              const wd = quarter.weeklyBreakdown?.filter(w => w.previous > 0) ?? [];
              const best  = wd.length > 0 ? wd.reduce((m, w) => w.variancePercentage > m.variancePercentage ? w : m) : null;
              const worst = wd.length > 0 ? wd.reduce((m, w) => w.variancePercentage < m.variancePercentage ? w : m) : null;
              if (!quarter.weeklyBreakdown?.length) return null;
              return (
                <div key={quarter.quarter}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, paddingBottom: 8, borderBottom: `1px solid ${t.border}` }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: t.text }}>{quarter.quarter}</span>
                    <div style={{ display: 'flex', gap: 12, fontSize: 11, fontFamily: 'IBM Plex Mono, monospace' }}>
                      {best
                        ? <><span style={{ color: t.posText }}>Week Tertinggi: W{best.week} ({formatPercentage(best.variancePercentage)})</span>{worst && <span style={{ color: t.negText }}>Week Terendah: W{worst.week} ({formatPercentage(worst.variancePercentage)})</span>}</>
                        : <span style={{ color: t.textMuted }}>Belum ada pembanding</span>
                      }
                    </div>
                  </div>
                  <div style={{ border: `1px solid ${t.border}`, borderRadius: 8, overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr>
                            {['Week', `${previousLabel} (${getUnitShortLabel(selectedUnit)})`, `${currentLabel} (${getUnitShortLabel(selectedUnit)})`, 'Variance',  'Growth'].map((h, i) => (
                              <th key={h} style={{ padding: '8px 12px', textAlign: i === 0 ? 'left' : 'right', fontSize: 9, fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, color: t.tableHeadText, background: t.tableHeadBg, borderBottom: `1px solid ${t.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {quarter.weeklyBreakdown.map((w, idx) => {
                            const ud = (w as any)[selectedUnit] || { previous: w.previous, current: w.current };
                            const hasCmp = ud.previous > 0;
                            return (
                              <tr key={w.week} style={{ background: idx % 2 !== 0 ? t.rowAlt : 'transparent' }}
                                onMouseEnter={e => (e.currentTarget.style.background = t.rowHover)}
                                onMouseLeave={e => (e.currentTarget.style.background = idx % 2 !== 0 ? t.rowAlt : 'transparent')}>
                                <td style={{ ...tdBase, color: t.text, fontWeight: 600, fontSize: 11 }}>W{w.week}</td>
                                <td style={{ ...tdBase, textAlign: 'right', fontSize: 11, color: ud.previous > 0 ? t.text : t.textFaint }}>{ud.previous > 0 ? formatUnitValue(ud.previous, selectedUnit) : '—'}</td>
                                <td style={{ ...tdBase, textAlign: 'right', color: t.text, fontWeight: 700, fontSize: 11 }}>{ud.current > 0 ? formatUnitValue(ud.current, selectedUnit) : <span style={{ color: t.textFaint }}>—</span>}</td>
                                <td style={{ ...tdBase, textAlign: 'right', color: hasCmp ? varColor(ud.current - ud.previous) : t.textFaint, fontWeight: 700, fontSize: 11 }}>{hasCmp ? `${ud.current - ud.previous >= 0 ? '+' : ''}${formatUnitValue(ud.current - ud.previous, selectedUnit)}` : '—'}</td>
                                {/* <td style={{ ...tdBase, textAlign: 'right', color: hasCmp ? varColor(((ud.current - ud.previous) / ud.previous) * 100) : t.textFaint, fontWeight: 700, fontSize: 11 }}>{hasCmp ? formatPercentage(((ud.current - ud.previous) / ud.previous) * 100) : '—'}</td> */}
                                <td style={{ ...tdBase, textAlign: 'right' }}><GrowthBadge previous={ud.previous} current={ud.current} theme={theme} /></td>
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

// MonthlyYoYDetailView
function MonthlyYoYDetailView({ data, selectedUnit, theme, card, tdBase, expandModal, previousLabel, currentLabel }: {
  data: QuarterlyYoYData[]; selectedUnit: string; theme: Theme;
  card: (extra?: React.CSSProperties) => React.CSSProperties;
  tdBase: React.CSSProperties;
  expandModal: (content: React.ReactNode, title: string) => void;
  previousLabel: string; currentLabel: string;
}) {
  const t    = TK[theme];
  const yFmt = makeYFmt(selectedUnit);

  const [displayMode, setDisplayMode] = useState<'chart' | 'table'>('chart');
  const [selectedQ, setSelectedQ]     = useState('all');

  const axisProps = {
    tick: { fill: t.axisColor, fontSize: 10, fontFamily: 'IBM Plex Mono, monospace' },
    axisLine: { stroke: t.border },
    tickLine: false as const,
  };

  const allMonthly = useMemo(() =>
    data.flatMap(q => (q.monthlyBreakdown ?? []).map(m => ({ ...m, quarter: q.quarter }))),
    [data]
  );
  const filteredMonthly = useMemo(() =>
    selectedQ === 'all' ? allMonthly : allMonthly.filter(m => (m as any).quarter === selectedQ),
    [allMonthly, selectedQ]
  );

  const monthsWithData = useMemo(() => filteredMonthly.filter(m => m.previous > 0 && m.current >= 0), [filteredMonthly]);
  const avgGrowth = monthsWithData.length > 0 ? monthsWithData.reduce((s, m) => s + m.variancePercentage, 0) / monthsWithData.length : 0;
  const monthsUp  = monthsWithData.filter(m => m.current >= m.previous).length;

  const chartData = filteredMonthly.filter(m => m.previous > 0 || m.current > 0).map(m => {
    const ud = (m as any)[selectedUnit] || { previous: m.previous, current: m.current };
    return {
      name:     m.month,
      quarter:  (m as any).quarter,
      previous: ud.previous > 0 ? ud.previous : null,
      current:  ud.current  > 0 ? ud.current  : null,
      growth:   ud.previous > 0 ? ((ud.current - ud.previous) / ud.previous) * 100 : null,
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
          width={selectedUnit === 'omzet' ? 84 : 72}
          label={{ value: getUnitShortLabel(selectedUnit), angle: -90, position: 'insideLeft', offset: 10, style: { fill: t.axisColor, fontSize: 9, fontFamily: 'IBM Plex Mono, monospace' } }}
        />
        <YAxis yAxisId="right" orientation="right" tickFormatter={v => `${v.toFixed(0)}%`} {...axisProps} axisLine={false} />
        <Tooltip content={<ChartTooltip labelPrefix="Bulan: " theme={theme} unit={selectedUnit} previousLabel={previousLabel} currentLabel={currentLabel} />} />
        <Bar yAxisId="left" dataKey="previous" fill={PREV_COLOR} name={previousLabel} radius={[4,4,0,0]} maxBarSize={26} opacity={0.75} />
        <Bar yAxisId="left" dataKey="current" fill={CURR_COLOR} name={currentLabel} radius={[4,4,0,0]} maxBarSize={26} />
        <Line yAxisId="right" type="monotone" dataKey="growth" connectNulls={false} stroke="#f87171" strokeWidth={2.5} dot={{ r: 4, fill: '#f87171', strokeWidth: 0 }} name="Growth %" />
        <ReferenceLine yAxisId="right" y={0} stroke={t.text} strokeDasharray="4 4" strokeWidth={1.5} />
      </ComposedChart>
    </ResponsiveContainer>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
        {[
          { label: 'Total Bulan', value: filteredMonthly.length, color: t.text },
          { label: `Rata-rata Growth (${monthsWithData.length}B)`, value: monthsWithData.length > 0 ? formatPercentage(avgGrowth) : 'N/A', color: monthsWithData.length > 0 ? (avgGrowth >= 0 ? t.posText : t.negText) : t.textMuted },
          { label: 'Bulan Naik',  value: monthsUp, color: t.posText },
          { label: 'Bulan Turun', value: monthsWithData.length - monthsUp, color: t.negText },
        ].map((s, i) => (
          <div key={i} style={{ padding: '10px 14px', borderRadius: 10, background: t.qCardBg, border: `1px solid ${t.borderCard}`, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 10, color: t.text, fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{s.label}</span>
            <span style={{ fontSize: 18, fontWeight: 800, color: s.color, fontFamily: 'IBM Plex Mono, monospace' }}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Growth heatmap */}
      <div style={card()}>
        <span style={{ display: 'block', fontSize: 11, fontWeight: 700, color: t.text, fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
          Growth per Bulan · {getUnitLabel(selectedUnit)}
        </span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8 }}>
          {filteredMonthly.map((m, i) => {
            const hasCmp = m.previous > 0;
            const hit    = hasCmp && m.current >= m.previous;
            const pct    = hasCmp ? Math.min(100, Math.max(0, 50 + m.variancePercentage / 2)) : 0;
            return (
              <div key={i} style={{ padding: '10px 12px', borderRadius: 10, background: !hasCmp ? t.inputBg : (hit ? t.posBg : t.negBg), border: `1px solid ${!hasCmp ? t.inputBorder : (hit ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.2)')}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: t.text, fontFamily: 'IBM Plex Mono, monospace' }}>{m.month}</span>
                  <span style={{ fontSize: 9, color: QUARTER_COLORS[(m as any).quarter], fontFamily: 'IBM Plex Mono, monospace', fontWeight: 700 }}>{(m as any).quarter}</span>
                </div>
                {hasCmp
                  ? <div style={{ fontSize: 16, fontWeight: 800, color: hit ? t.posText : t.negText, fontFamily: 'IBM Plex Mono, monospace', lineHeight: 1 }}>{formatPercentage(m.variancePercentage)}</div>
                  : <div style={{ fontSize: 13, fontWeight: 700, color: t.textMuted, fontFamily: 'IBM Plex Mono, monospace', lineHeight: 1 }}>{m.current > 0 ? 'BARU' : 'N/A'}</div>
                }
                {hasCmp && (
                  <div style={{ height: 4, background: 'rgba(0,0,0,0.1)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: hit ? '#10b981' : '#ef4444', borderRadius: 2, transition: 'width 0.7s' }} />
                  </div>
                )}
                <div style={{ fontSize: 10, color: t.text, fontFamily: 'IBM Plex Mono, monospace' }}>
                  {m.current > 0 ? `${formatUnitValue(m.current, selectedUnit)} ${getUnitShortLabel(selectedUnit)}` : '—'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chart / Table */}
      <div style={card()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: t.text, fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {previousLabel} vs {currentLabel} Bulanan · {getUnitLabel(selectedUnit)}
          </span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <FilterSelect label="Kuartal" accentColor="#3b82f6" value={selectedQ} onChange={e => setSelectedQ(e.target.value)} theme={theme}>
              <option value="all" style={{ background: t.selectBg }}>Semua</option>
              {data.map(q => <option key={q.quarter} value={q.quarter} style={{ background: t.selectBg }}>{q.quarter}</option>)}
            </FilterSelect>
            <ViewToggle value={displayMode} onChange={setDisplayMode} theme={theme} />
            {displayMode === 'chart' && (
              <ExpandBtn onClick={() => expandModal(<div style={{ height: '70vh' }}>{renderBarLine('100%')}</div>, `Trend Bulanan · ${getUnitLabel(selectedUnit)} — Diperbesar`)} theme={theme} />
            )}
          </div>
        </div>

        {displayMode === 'chart' && (
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: t.text, fontFamily: 'IBM Plex Sans, sans-serif' }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: PREV_COLOR }} />{previousLabel}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: t.text, fontFamily: 'IBM Plex Sans, sans-serif' }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: CURR_COLOR }} />{currentLabel}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#f87171', fontFamily: 'IBM Plex Sans, sans-serif' }}>
              <span style={{ width: 18, height: 2, background: '#f87171', borderRadius: 2 }} />Growth %
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
                    {['Quarter', 'Month', `${previousLabel} (${getUnitShortLabel(selectedUnit)})`, `${currentLabel} (${getUnitShortLabel(selectedUnit)})`, 'Variance',  'Growth'].map((h, i) => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: i <= 1 ? 'left' : 'right', fontSize: 9, fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, color: t.tableHeadText, background: t.tableHeadBg, borderBottom: `1px solid ${t.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredMonthly.map((m, idx) => {
                    const ud = (m as any)[selectedUnit] || { previous: m.previous, current: m.current };
                    const hasCmp = ud.previous > 0;
                    return (
                      <tr key={`${(m as any).quarter}-${m.month}`} style={{ background: idx % 2 !== 0 ? t.rowAlt : 'transparent' }}
                        onMouseEnter={e => (e.currentTarget.style.background = t.rowHover)}
                        onMouseLeave={e => (e.currentTarget.style.background = idx % 2 !== 0 ? t.rowAlt : 'transparent')}>
                        <td style={{ padding: '11px 18px', fontSize: 11, fontWeight: 700, color: QUARTER_COLORS[(m as any).quarter] ?? t.text, borderBottom: `1px solid ${t.border}` }}>{(m as any).quarter}</td>
                        <td style={{ padding: '11px 18px', fontSize: 11, color: t.text, fontWeight: 600, borderBottom: `1px solid ${t.border}` }}>{m.month}</td>
                        <td style={{ ...tdBase, textAlign: 'right', fontSize: 11, color: ud.previous > 0 ? t.text : t.textFaint }}>{ud.previous > 0 ? formatUnitValue(ud.previous, selectedUnit) : '—'}</td>
                        <td style={{ ...tdBase, textAlign: 'right', color: t.text, fontWeight: 700, fontSize: 11 }}>{ud.current > 0 ? formatUnitValue(ud.current, selectedUnit) : <span style={{ color: t.textFaint }}>—</span>}</td>
                        <td style={{ ...tdBase, textAlign: 'right', color: hasCmp ? varColor(ud.current - ud.previous) : t.textFaint, fontWeight: 700, fontSize: 11 }}>{hasCmp ? `${ud.current - ud.previous >= 0 ? '+' : ''}${formatUnitValue(ud.current - ud.previous, selectedUnit)}` : '—'}</td>
                        {/* <td style={{ ...tdBase, textAlign: 'right', color: hasCmp ? varColor(((ud.current - ud.previous) / ud.previous) * 100) : t.textFaint, fontWeight: 700, fontSize: 11 }}>{hasCmp ? formatPercentage(((ud.current - ud.previous) / ud.previous) * 100) : '—'}</td> */}
                        <td style={{ ...tdBase, textAlign: 'right' }}><GrowthBadge previous={ud.previous} current={ud.current} theme={theme} /></td>
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

// OverviewYoYTableView
type OverviewSortKey = 'quarter' | 'previous' | 'current' | 'variance' | 'variancePercentage' | 'percentOfTotal';

function OverviewYoYTableView({ type, data, selectedUnit, theme, previousLabel, currentLabel }: {
  type: 'bar' | 'pie';
  data: QuarterlyYoYData[];
  selectedUnit: string;
  theme: Theme;
  previousLabel: string; currentLabel: string;
}) {
  const t = TK[theme];
  const [sort, setSort] = useState<{ key: OverviewSortKey; dir: 'asc' | 'desc' }>({ key: 'quarter', dir: 'asc' });

  const totalCurrent = useMemo(() => data.reduce((s, q) => s + (q.current ?? 0), 0), [data]);

  const rows = useMemo(() => data.map(q => ({
    quarter: q.quarter,
    previous: q.previous ?? 0,
    current: q.current ?? 0,
    variance: q.variance ?? 0,
    variancePercentage: q.variancePercentage ?? 0,
    hasComparison: (q.previous ?? 0) > 0,
    percentOfTotal: totalCurrent > 0 ? (q.current / totalCurrent) * 100 : 0,
  })), [data, totalCurrent]);

  const sorted = useMemo(() => [...rows].sort((a, b) => {
    const av = a[sort.key as keyof typeof a];
    const bv = b[sort.key as keyof typeof b];
    const cmp = typeof av === 'string' ? (av as string).localeCompare(bv as string) : (av as number) - (bv as number);
    return sort.dir === 'asc' ? cmp : -cmp;
  }), [rows, sort]);

  const handleSort = (key: OverviewSortKey) =>
    setSort(p => ({ key, dir: p.key === key && p.dir === 'asc' ? 'desc' : 'asc' }));

  const SortArrows = ({ colKey }: { colKey: OverviewSortKey }) => (
    <span style={{ display: 'inline-flex', flexDirection: 'column', marginLeft: 4 }}>
      <ChevronUp width={11} height={11} color={sort.key === colKey && sort.dir === 'asc' ? '#3b82f6' : (theme === 'dark' ? 'rgba(148,163,184,0.4)' : '#cbd5e1')} />
      <ChevronDown width={11} height={11} color={sort.key === colKey && sort.dir === 'desc' ? '#3b82f6' : (theme === 'dark' ? 'rgba(148,163,184,0.4)' : '#cbd5e1')} style={{ marginTop: -3 }} />
    </span>
  );

  const cols: { key: OverviewSortKey; label: string }[] = type === 'bar'
    ? [
        { key: 'quarter', label: 'Quarter' },
        { key: 'previous', label: `${previousLabel} (${getUnitShortLabel(selectedUnit)})` },
        { key: 'current', label: `${currentLabel} (${getUnitShortLabel(selectedUnit)})` },
        { key: 'variance', label: 'Variance' },
        { key: 'variancePercentage', label: 'Growth %' },
      ]
    : [
        { key: 'quarter', label: 'Quarter' },
        { key: 'current', label: `${currentLabel} (${getUnitShortLabel(selectedUnit)})` },
        { key: 'percentOfTotal', label: '% Total' },
      ];

  return (
    <div style={{ border: `1px solid ${t.border}`, borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {cols.map((c, i) => (
                <th key={c.key} onClick={() => handleSort(c.key)}
                  style={{ padding: '9px 14px', textAlign: i === 0 ? 'left' : 'right', fontSize: 9, fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, color: t.tableHeadText, background: t.tableHeadBg, borderBottom: `1px solid ${t.border}`, whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: i === 0 ? 'flex-start' : 'flex-end', gap: 2, width: '100%' }}>
                    {c.label}<SortArrows colKey={c.key} />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((r, idx) => (
              <tr key={r.quarter} style={{ background: idx % 2 !== 0 ? t.rowAlt : 'transparent' }}
                onMouseEnter={e => (e.currentTarget.style.background = t.rowHover)}
                onMouseLeave={e => (e.currentTarget.style.background = idx % 2 !== 0 ? t.rowAlt : 'transparent')}>
                <td style={{ padding: '10px 14px', fontSize: 12, fontFamily: 'IBM Plex Mono, monospace', color: QUARTER_COLORS[r.quarter] ?? t.text, fontWeight: 700, borderBottom: `1px solid ${t.border}` }}>{r.quarter}</td>
                {type === 'bar' ? (
                  <>
                    <td style={{ padding: '10px 14px', textAlign: 'right', fontSize: 12, fontFamily: 'IBM Plex Mono, monospace', color: r.previous > 0 ? t.text : t.textFaint, borderBottom: `1px solid ${t.border}` }}>{r.previous > 0 ? formatUnitValue(r.previous, selectedUnit) : '—'}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', fontSize: 12, fontFamily: 'IBM Plex Mono, monospace', color: t.text, fontWeight: 700, borderBottom: `1px solid ${t.border}` }}>{r.current > 0 ? formatUnitValue(r.current, selectedUnit) : '—'}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', fontSize: 12, fontFamily: 'IBM Plex Mono, monospace', fontWeight: 700, color: r.hasComparison ? varColor(r.variance) : t.textFaint, borderBottom: `1px solid ${t.border}` }}>{r.hasComparison ? `${r.variance >= 0 ? '+' : ''}${formatUnitValue(r.variance, selectedUnit)}` : '—'}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', borderBottom: `1px solid ${t.border}` }}><GrowthBadge previous={r.previous} current={r.current} theme={theme} /></td>
                  </>
                ) : (
                  <>
                    <td style={{ padding: '10px 14px', textAlign: 'right', fontSize: 12, fontFamily: 'IBM Plex Mono, monospace', color: t.text, fontWeight: 700, borderBottom: `1px solid ${t.border}` }}>{r.current > 0 ? formatUnitValue(r.current, selectedUnit) : '—'}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', fontSize: 12, fontFamily: 'IBM Plex Mono, monospace', color: t.textSub, fontWeight: 600, borderBottom: `1px solid ${t.border}` }}>{r.percentOfTotal.toFixed(1)}%</td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Main Component
interface QuarterlyYoYProps {
  data: QuarterlyYoYData[];
  theme?: Theme;
  selectedUnit?: string;
  onUnitChange?: (unit: string) => void;
  previousYearLabel?: string | number; // default: 'Tahun Lalu'
  currentYearLabel?: string | number;  // default: 'Tahun Ini'
}

export default function QuarterlyYoYComponent({
  data, theme: themeProp, selectedUnit: propSelectedUnit, onUnitChange,
  previousYearLabel = 'Tahun Lalu', currentYearLabel = 'Tahun Ini',
}: QuarterlyYoYProps) {
  const theme: Theme = themeProp ?? 'light';
  const t = TK[theme];
  const previousLabel = String(previousYearLabel);
  const currentLabel  = String(currentYearLabel);

  const [internalSelectedUnit, setInternalSelectedUnit] = useState('units_dos');
  const selectedUnit    = propSelectedUnit ?? internalSelectedUnit;
  const setSelectedUnit = onUnitChange ?? setInternalSelectedUnit;

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedProduct, setSelectedProduct]   = useState('all');
  const [selectedQuarter, setSelectedQuarter]   = useState('all');
  const [expandedChart, setExpandedChart]       = useState<'bar' | 'pie' | null>(null);
  const [viewMode, setViewMode]                 = useState<'overview' | 'weekly' | 'monthly'>('overview');
  const [modalContent, setModalContent]         = useState<React.ReactNode>(null);
  const [modalTitle, setModalTitle]             = useState('');
  const [overviewTableView, setOverviewTableView] = useState({ bar: false, pie: false });

  const openModal  = (content: React.ReactNode, title: string) => { setModalContent(content); setModalTitle(title); };
  const closeModal = () => { setModalContent(null); setModalTitle(''); };

  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    data.forEach(q => q.details?.forEach((d: any) => {
      const cat = d.productCategory;
      if (cat) cats.add(cat);
    }));
    return Array.from(cats).sort();
  }, [data]);

  const availableProducts = useMemo(() => {
    const prods = new Set<string>();
    data.forEach(q => q.details?.forEach((d: any) => {
      if (selectedCategory !== 'all' && d.productCategory !== selectedCategory) return;
      if (d.product) prods.add(d.product);
    }));
    return Array.from(prods).sort();
  }, [data, selectedCategory]);

  // reset produk kalau kategori berubah dan produk lama sudah tidak ada di daftar
  useEffect(() => {
    if (selectedProduct !== 'all' && !availableProducts.includes(selectedProduct)) {
      setSelectedProduct('all');
    }
  }, [availableProducts, selectedProduct]);

  const quarterOptions = useMemo(() => Array.from(new Set(data.map(q => q.quarter))).sort(), [data]);

  // Rebuild quarter/weekly/monthly berdasar Unit + Kategori + Kuartal terpilih.
  // Karena dua-duanya "actual" (previous & current), tidak perlu ratio-hack
  // seperti versi Target vs Actual — tinggal jumlahkan langsung dari
  // weeklyPrevious/weeklyCurrent per detail produk.
  const filteredData = useMemo(() => {
    return data
      .filter(q => selectedQuarter === 'all' || q.quarter === selectedQuarter)
      .map(q => {
        const filteredDetails = (q.details ?? []).filter((d: any) => {
          if (selectedCategory !== 'all' && d.productCategory !== selectedCategory) return false;
          if (selectedProduct  !== 'all' && d.product !== selectedProduct) return false;
          return true;
        });

        if (!filteredDetails.length) {
          return {
            ...q,
            details: [], previous: 0, current: 0, variance: 0, variancePercentage: 0,
            weeklyBreakdown:  (q.weeklyBreakdown ?? []).map((wb: any) => ({ ...wb, previous:0, current:0, variance:0, variancePercentage:0, units_dos:{previous:0,current:0}, units_bks:{previous:0,current:0}, units_slop:{previous:0,current:0}, units_bal:{previous:0,current:0} })),
            monthlyBreakdown: (q.monthlyBreakdown ?? []).map((mb: any) => ({ ...mb, previous:0, current:0, variance:0, variancePercentage:0, units_dos:{previous:0,current:0}, units_bks:{previous:0,current:0}, units_slop:{previous:0,current:0}, units_bal:{previous:0,current:0} })),
          };
        }

        let pv = 0, cv = 0;
        filteredDetails.forEach((d: any) => {
          pv += getDetailValue(d, selectedUnit, 'previous');
          cv += getDetailValue(d, selectedUnit, 'current');
        });
        const vr = cv - pv;

        const newWeeklyBreakdown = (q.weeklyBreakdown ?? []).map((wb: any) => {
          const week = wb.week;
          let dosP = 0, bksP = 0, slopP = 0, balP = 0, omzP = 0;
          let dosC = 0, bksC = 0, slopC = 0, balC = 0, omzC = 0;
          filteredDetails.forEach((d: any) => {
            const wp = d.weeklyPrevious?.[week];
            if (wp) { dosP += wp.units_dos ?? 0; bksP += wp.units_bks ?? 0; slopP += wp.units_slop ?? 0; balP += wp.units_bal ?? 0; omzP += wp.omzet ?? 0; }
            const wc = d.weeklyCurrent?.[week];
            if (wc) { dosC += wc.units_dos ?? 0; bksC += wc.units_bks ?? 0; slopC += wc.units_slop ?? 0; balC += wc.units_bal ?? 0; omzC += wc.omzet ?? 0; }
          });

          const selP = selectedUnit === 'omzet' ? omzP : selectedUnit === 'units_bks' ? bksP : selectedUnit === 'units_slop' ? slopP : selectedUnit === 'units_bal' ? balP : dosP;
          const selC = selectedUnit === 'omzet' ? omzC : selectedUnit === 'units_bks' ? bksC : selectedUnit === 'units_slop' ? slopC : selectedUnit === 'units_bal' ? balC : dosC;
          const selVar    = selC - selP;
          const selVarPct = selP > 0 ? (selVar / selP) * 100 : 0;
          return {
            ...wb,
            previous: parseFloat(selP.toFixed(2)), current: parseFloat(selC.toFixed(2)),
            variance: parseFloat(selVar.toFixed(2)), variancePercentage: parseFloat(selVarPct.toFixed(1)),
            units_dos: { previous: dosP, current: dosC }, units_bks: { previous: bksP, current: bksC },
            units_slop: { previous: slopP, current: slopC }, units_bal: { previous: balP, current: balC },
          };
        });

        const yearForMonth = new Date().getFullYear();
        const newMonthlyBreakdown = (q.monthlyBreakdown ?? []).map((mb: any) => {
          const monthWeeks = newWeeklyBreakdown.filter((wb: any) => getMonthFromWeek(wb.week, yearForMonth) === mb.month);
          const dosP  = monthWeeks.reduce((s: number, wb: any) => s + (wb.units_dos?.previous  ?? 0), 0);
          const bksP  = monthWeeks.reduce((s: number, wb: any) => s + (wb.units_bks?.previous  ?? 0), 0);
          const slopP = monthWeeks.reduce((s: number, wb: any) => s + (wb.units_slop?.previous ?? 0), 0);
          const balP  = monthWeeks.reduce((s: number, wb: any) => s + (wb.units_bal?.previous  ?? 0), 0);
          const dosC  = monthWeeks.reduce((s: number, wb: any) => s + (wb.units_dos?.current  ?? 0), 0);
          const bksC  = monthWeeks.reduce((s: number, wb: any) => s + (wb.units_bks?.current  ?? 0), 0);
          const slopC = monthWeeks.reduce((s: number, wb: any) => s + (wb.units_slop?.current ?? 0), 0);
          const balC  = monthWeeks.reduce((s: number, wb: any) => s + (wb.units_bal?.current  ?? 0), 0);
          const omzP  = monthWeeks.reduce((s: number, wb: any) => s + (wb.previous ?? 0), 0);
          const omzC  = monthWeeks.reduce((s: number, wb: any) => s + (wb.current ?? 0), 0);

          const selP = selectedUnit === 'omzet' ? omzP : selectedUnit === 'units_bks' ? bksP : selectedUnit === 'units_slop' ? slopP : selectedUnit === 'units_bal' ? balP : dosP;
          const selC = selectedUnit === 'omzet' ? omzC : selectedUnit === 'units_bks' ? bksC : selectedUnit === 'units_slop' ? slopC : selectedUnit === 'units_bal' ? balC : dosC;
          const selVar    = selC - selP;
          const selVarPct = selP > 0 ? (selVar / selP) * 100 : 0;
          return {
            ...mb,
            previous: parseFloat(selP.toFixed(2)), current: parseFloat(selC.toFixed(2)),
            variance: parseFloat(selVar.toFixed(2)), variancePercentage: parseFloat(selVarPct.toFixed(1)),
            units_dos: { previous: parseFloat(dosP.toFixed(2)), current: parseFloat(dosC.toFixed(2)) },
            units_bks: { previous: parseFloat(bksP.toFixed(2)), current: parseFloat(bksC.toFixed(2)) },
            units_slop: { previous: parseFloat(slopP.toFixed(2)), current: parseFloat(slopC.toFixed(2)) },
            units_bal: { previous: parseFloat(balP.toFixed(2)), current: parseFloat(balC.toFixed(2)) },
          };
        });

        return {
          ...q, details: filteredDetails,
          previous: Math.round(pv * 100) / 100, current: Math.round(cv * 100) / 100,
          variance: Math.round(vr * 100) / 100,
          variancePercentage: Math.round(pv > 0 ? (vr / pv) * 100 * 10 : 0) / 10,
          weeklyBreakdown: newWeeklyBreakdown, monthlyBreakdown: newMonthlyBreakdown,
        };
      });
  }, [data, selectedUnit, selectedCategory, selectedProduct, selectedQuarter]);

  const performanceData = filteredData.map(q => ({ quarter: q.quarter, previous: q.previous, current: q.current, growth: q.previous > 0 ? ((q.current - q.previous) / q.previous) * 100 : null }));
  const pieData         = filteredData.map(q => ({ name: q.quarter, value: q.current }));
  const quartersWithCmp = filteredData.filter(q => q.previous > 0);
  const avgGrowth        = quartersWithCmp.length > 0 ? quartersWithCmp.reduce((s, q) => s + ((q.current - q.previous) / q.previous) * 100, 0) / quartersWithCmp.length : 0;
  const bestQ            = filteredData.length > 0 ? filteredData.reduce((m, q) => q.current > m.current ? q : m) : null;
  const yTickFmt          = makeYFmt(selectedUnit);

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
          <YAxis tickFormatter={yTickFmt} {...axisProps} axisLine={false} width={selectedUnit === 'omzet' ? 84 : 72} label={{ value: getUnitShortLabel(selectedUnit), angle: -90, position: 'insideLeft', offset: 10, style: { fill: t.axisColor, fontSize: 9, fontFamily: 'IBM Plex Mono, monospace' } }} />
          <Tooltip content={<ChartTooltip labelPrefix="Quarter: " theme={theme} unit={selectedUnit} previousLabel={previousLabel} currentLabel={currentLabel} />} />
          {withLegend && <Legend wrapperStyle={{ fontSize: 12, color: t.textSub, paddingTop: 12 }} />}
          <Bar dataKey="previous" fill={PREV_COLOR} name={previousLabel} radius={[3,3,0,0]} maxBarSize={40} opacity={0.75} />
          <Bar dataKey="current" fill={CURR_COLOR} name={currentLabel} radius={[3,3,0,0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );

  const renderPieChart = (outerR: number, height: number | string, withLegend = false) => (
    <div style={{ height, width: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPieChart>
          <Pie data={pieData} cx="50%" cy="50%" labelLine={false} label={({ name, percent }: any) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} outerRadius={outerR} dataKey="value">
            {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
          </Pie>
          <Tooltip content={<ChartTooltip theme={theme} unit={selectedUnit} previousLabel={previousLabel} currentLabel={currentLabel} />} />
          {withLegend && <Legend wrapperStyle={{ fontSize: 12, color: t.textSub, paddingTop: 12 }} formatter={(v: string) => <span style={{ color: t.textSub }}>{v}</span>} />}
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, fontFamily: 'IBM Plex Sans, sans-serif' }}>

      {/* Filter */}
      <div style={card()}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: t.textMuted, fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Filter Data</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <FilterSelect label="Unit" accentColor="#10b981" value={selectedUnit} onChange={e => setSelectedUnit(e.target.value)} theme={theme}>
              {UNIT_OPTIONS.map(o => <option key={o.value} value={o.value} style={{ background: t.selectBg }}>{o.label}</option>)}
            </FilterSelect>
            <FilterSelect label="Kuartal" accentColor="#3b82f6" value={selectedQuarter} onChange={e => setSelectedQuarter(e.target.value)} theme={theme}>
              <option value="all" style={{ background: t.selectBg }}>Semua Kuartal</option>
              {quarterOptions.map(q => <option key={q} value={q} style={{ background: t.selectBg }}>{q}</option>)}
            </FilterSelect>
            <FilterSelect label="Kategori" accentColor="#8b5cf6" value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} theme={theme}>
              <option value="all" style={{ background: t.selectBg }}>Semua Kategori</option>
              {availableCategories.map(c => <option key={c} value={c} style={{ background: t.selectBg }}>{c}</option>)}
            </FilterSelect>
            <FilterSelect label="Brand" accentColor="#ec4899" value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)} theme={theme}>
              <option value="all" style={{ background: t.selectBg }}>Semua Brand</option>
              {availableProducts.map(p => <option key={p} value={p} style={{ background: t.selectBg }}>{p}</option>)}
            </FilterSelect>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                { value: 'overview', label: 'Overview',        color: '#3b82f6' },
                { value: 'weekly',   label: 'Detail Mingguan', color: '#10b981' },
                { value: 'monthly',  label: 'Detail Bulanan',  color: '#f59e0b' },
              ].map(mode => (
                <button key={mode.value} onClick={() => setViewMode(mode.value as any)}
                  style={{ padding: '6px 14px', borderRadius: 7, fontSize: 12, fontWeight: 600, fontFamily: 'IBM Plex Mono, monospace', cursor: 'pointer', transition: 'all 0.15s', background: viewMode === mode.value ? `${mode.color}18` : t.inputBg, border: `1px solid ${viewMode === mode.value ? mode.color : t.text}`, color: viewMode === mode.value ? mode.color : t.text }}>
                  {mode.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Overview */}
      {viewMode === 'overview' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14 }}>
            <div style={card({ padding: '18px 16px' })}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: t.text }}>{previousLabel} vs {currentLabel} · {getUnitLabel(selectedUnit)}</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <TableBtn onClick={() => setOverviewTableView(prev => ({ ...prev, bar: !prev.bar }))} theme={theme} active={overviewTableView.bar} />
                  <ExpandBtn
                    onClick={() => overviewTableView.bar
                      ? openModal(
                          <OverviewYoYTableView type="bar" data={filteredData} selectedUnit={selectedUnit} theme={theme} previousLabel={previousLabel} currentLabel={currentLabel} />,
                          `${previousLabel} vs ${currentLabel} · ${getUnitLabel(selectedUnit)} — Tabel Data`,
                        )
                      : setExpandedChart('bar')}
                    theme={theme}
                  />
                </div>
              </div>
              {overviewTableView.bar ? (
                <OverviewYoYTableView type="bar" data={filteredData} selectedUnit={selectedUnit} theme={theme} previousLabel={previousLabel} currentLabel={currentLabel} />
              ) : (
                <div style={{ background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: 8, padding: '10px 6px 6px' }}>{renderBarChart(260)}</div>
              )}
            </div>
            <div style={card({ padding: '18px 16px' })}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: t.text }}>Distribusi {currentLabel} · {getUnitLabel(selectedUnit)}</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <TableBtn onClick={() => setOverviewTableView(prev => ({ ...prev, pie: !prev.pie }))} theme={theme} active={overviewTableView.pie} />
                  <ExpandBtn
                    onClick={() => overviewTableView.pie
                      ? openModal(
                          <OverviewYoYTableView type="pie" data={filteredData} selectedUnit={selectedUnit} theme={theme} previousLabel={previousLabel} currentLabel={currentLabel} />,
                          `Distribusi ${currentLabel} · ${getUnitLabel(selectedUnit)} — Tabel Data`,
                        )
                      : setExpandedChart('pie')}
                    theme={theme}
                  />
                </div>
              </div>
              {overviewTableView.pie ? (
                <OverviewYoYTableView type="pie" data={filteredData} selectedUnit={selectedUnit} theme={theme} previousLabel={previousLabel} currentLabel={currentLabel} />
              ) : (
                <div style={{ background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: 8, padding: '10px 6px 6px' }}>{renderPieChart(80, 276)}</div>
              )}
            </div>
          </div>

          {/* Quarter cards */}
          <div style={card()}>
            <span style={{ display: 'block', fontSize: 11, fontWeight: 700, color: t.text, fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
              Performa per Kuartal · {getUnitLabel(selectedUnit)}
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
              {filteredData.map(q => {
                const hasCmp = q.previous > 0;
                const hit    = q.current >= q.previous;
                return (
                  <div key={q.quarter} style={{ background: t.qCardBg, border: `1px solid ${!hasCmp ? t.borderCard : (hit ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.2)')}`, borderLeft: `3px solid ${!hasCmp ? t.textFaint : (hit ? '#10b981' : '#ef4444')}`, borderRadius: 10, padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <span style={{ fontSize: 16, fontWeight: 800, color: t.text, fontFamily: 'IBM Plex Mono, monospace' }}>{q.quarter}</span>
                      {!hasCmp
                        ? <span style={{ padding: '2px 8px', borderRadius: 5, fontSize: 10, fontWeight: 700, fontFamily: 'IBM Plex Mono, monospace', background: t.inputBg, color: t.text, border: `1px solid ${t.inputBorder}` }}>{q.current > 0 ? 'BARU' : 'N/A'}</span>
                        : <span style={{ padding: '2px 8px', borderRadius: 5, fontSize: 10, fontWeight: 700, fontFamily: 'IBM Plex Mono, monospace', background: hit ? t.posBg : t.negBg, color: hit ? t.posText : t.negText }}>{hit ? 'NAIK' : 'TURUN'}</span>
                      }
                    </div>
                    {[
                      { label: previousLabel, value: q.previous > 0 ? formatUnitValue(q.previous, selectedUnit) : '—', color: t.text, bold: false },
                      { label: currentLabel,  value: q.current  > 0 ? formatUnitValue(q.current,  selectedUnit) : '—', color: t.text,    bold: true  },
                      { label: 'Variance',    value: hasCmp ? `${q.variance >= 0 ? '+' : ''}${formatUnitValue(q.variance, selectedUnit)}` : '—', color: hasCmp ? varColor(q.variance) : t.textFaint, bold: true },
                      { label: 'Growth %',    value: hasCmp ? formatPercentage(q.variancePercentage) : '—', color: hasCmp ? varColor(q.variancePercentage) : t.textFaint, bold: true },
                    ].map((row, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                        <span style={{ fontSize: 12, color: t.text }}>{row.label}</span>
                        <span style={{ fontSize: 12, fontFamily: 'IBM Plex Mono, monospace', color: row.color, fontWeight: row.bold ? 700 : 400 }}>{row.value}</span>
                      </div>
                    ))}
                    <div style={{ borderTop: `1px solid ${t.border}`, marginTop: 10, paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: t.text }}>Growth</span>
                      <GrowthBadge previous={q.previous} current={q.current} theme={theme} />
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
                      {['Quarter', `${previousLabel} (${getUnitShortLabel(selectedUnit)})`, `${currentLabel} (${getUnitShortLabel(selectedUnit)})`, 'Variance', 'Growth %'].map((h, i) => (
                        <th key={h} style={{ padding: '9px 14px', textAlign: i === 0 ? 'left' : 'right', fontSize: 9, fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, color: t.tableHeadText, background: t.tableHeadBg, borderBottom: `1px solid ${t.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((q, idx) => {
                      const hasCmp = q.previous > 0;
                      return (
                        <tr key={q.quarter} style={{ background: idx % 2 !== 0 ? t.rowAlt : 'transparent' }}
                          onMouseEnter={e => (e.currentTarget.style.background = t.rowHover)}
                          onMouseLeave={e => (e.currentTarget.style.background = idx % 2 !== 0 ? t.rowAlt : 'transparent')}>
                          <td style={{ ...tdBase, color: t.text, fontWeight: 700, fontSize: 13 }}>{q.quarter}</td>
                          <td style={{ ...tdBase, textAlign: 'right', color: q.previous > 0 ? t.text : t.textFaint }}>{q.previous > 0 ? formatUnitValue(q.previous, selectedUnit) : '—'}</td>
                          <td style={{ ...tdBase, textAlign: 'right', color: t.text, fontWeight: 700 }}>{q.current > 0 ? formatUnitValue(q.current, selectedUnit) : '—'}</td>
                          <td style={{ ...tdBase, textAlign: 'right', color: hasCmp ? varColor(q.variance) : t.textFaint, fontWeight: 700 }}>{hasCmp ? `${q.variance >= 0 ? '+' : ''}${formatUnitValue(q.variance, selectedUnit)}` : '—'}</td>
                          <td style={{ ...tdBase, textAlign: 'right' }}><GrowthBadge previous={q.previous} current={q.current} theme={theme} /></td>
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

      {viewMode === 'weekly'  && <WeeklyYoYDetailView  data={filteredData} selectedUnit={selectedUnit} theme={theme} card={card} tdBase={tdBase} expandModal={openModal} previousLabel={previousLabel} currentLabel={currentLabel} />}
      {viewMode === 'monthly' && <MonthlyYoYDetailView data={filteredData} selectedUnit={selectedUnit} theme={theme} card={card} tdBase={tdBase} expandModal={openModal} previousLabel={previousLabel} currentLabel={currentLabel} />}

      {/* Overview modal (chart) */}
      {expandedChart && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setExpandedChart(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: t.modalBg, border: `1px solid ${t.borderCard}`, borderRadius: '16px 16px 0 0', width: '100%', maxWidth: 1100, height: '92dvh', display: 'flex', flexDirection: 'column', boxShadow: '0 -8px 40px rgba(0,0,0,0.35)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px', flexShrink: 0 }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: t.textFaint }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px 12px', borderBottom: `1px solid ${t.border}`, background: t.tableHeadBg, flexShrink: 0, gap: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: t.text, lineHeight: 1.3, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {expandedChart === 'bar' ? `${previousLabel} vs ${currentLabel} · ${getUnitLabel(selectedUnit)}` : `Distribusi ${currentLabel} · ${getUnitLabel(selectedUnit)}`}
              </span>
              <button onClick={() => setExpandedChart(null)} style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, cursor: 'pointer', color: t.textMuted, padding: '6px 10px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0, fontSize: 12, fontFamily: 'IBM Plex Mono, monospace', fontWeight: 600 }}>
                <X size={14} /> Tutup
              </button>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: '16px 12px', background: t.cardBg, WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
              {expandedChart === 'bar' ? renderBarChart('calc(92dvh - 120px)', true) : renderPieChart(120, 'calc(92dvh - 120px)', true)}
            </div>
          </div>
        </div>
      )}

      {/* Sub-view modal (juga dipakai untuk tabel overview) */}
      {modalContent && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={closeModal}>
          <div onClick={e => e.stopPropagation()} style={{ background: t.modalBg, border: `1px solid ${t.borderCard}`, borderRadius: '16px 16px 0 0', width: '100%', maxWidth: 1200, height: '94dvh', display: 'flex', flexDirection: 'column', boxShadow: '0 -8px 40px rgba(0,0,0,0.35)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px', flexShrink: 0 }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: t.textFaint }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px 12px', borderBottom: `1px solid ${t.border}`, background: t.tableHeadBg, flexShrink: 0, gap: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: t.text, lineHeight: 1.3, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{modalTitle}</span>
              <button onClick={closeModal} style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, cursor: 'pointer', color: t.textMuted, padding: '6px 10px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0, fontSize: 12, fontFamily: 'IBM Plex Mono, monospace', fontWeight: 600 }}>
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