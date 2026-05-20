/**
 * Komponen Analisis L4W vs C1W
 * Theme tokens diseragamkan dengan page.tsx.
 * Outer card wrapper dihapus — layout flat flex column dengan gap,
 * identik dengan OverviewTab dan WeekComparison yang sudah direfactor.
 * Logika & struktur data asli dipertahankan sepenuhnya.
 *
 * FIX: chartData & sortedDetails sekarang selalu baca dari nested unit object
 * (p.units_dos, p.units_bal, dst.) — tidak lagi dari p.l4wValue/p.c1wValue
 * yang berisi omzet.
 */

'use client';

import { useState, useMemo, useEffect } from 'react';
import { L4WC4WData } from '@/types/sales';
import { formatPercentage } from '@/lib/utils';
import { getProductCategory } from '@/lib/productCategories';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Cell,
} from 'recharts';
import { ChevronUp, ChevronDown, Maximize2, X } from 'lucide-react';

// ─── Theme — identik dengan tokens di page.tsx ────────────────────────────────
type Theme = 'dark' | 'light';

const TK = {
  dark: {
    cardBg:        '#111318',
    border:        'rgba(255,255,255,0.06)',
    borderCard:    'rgba(255,255,255,0.07)',
    headerBg:      '#0c0e14',
    text:          'rgba(255,255,255,0.9)',
    textSub:       'rgba(255,255,255,0.55)',
    textMuted:     'rgba(255,255,255,0.3)',
    textFaint:     'rgba(255,255,255,0.18)',
    inputBg:       'rgba(255,255,255,0.03)',
    inputBorder:   'rgba(255,255,255,0.08)',
    selectColor:   'rgba(255,255,255,0.7)',
    optionBg:      '#0c0e14',
    infoBg:        'rgba(37,99,235,0.07)',
    infoBorder:    'rgba(59,130,246,0.3)',
    infoText:      'rgba(147,197,253,0.85)',
    modalBg:       '#0f1117',
    btnBg:         'rgba(37,99,235,0.12)',
    btnBorder:     'rgba(59,130,246,0.3)',
    btnText:       '#93c5fd',
    gridStroke:    'rgba(255,255,255,0.06)',
    axisColor:     'rgba(255,255,255,0.28)',
    tooltipBg:     '#1a1e2c',
    tooltipBorder: 'rgba(255,255,255,0.12)',
    card1Bg:       '#0f1724', card1Border: '#1e3a5f', card1Text: '#93c5fd',
    card2Bg:       '#1a1208', card2Border: '#3d2b0a', card2Text: '#fcd34d',
    tableHeadBg:   '#0c0e14',
    tableHeadText: 'rgba(255,255,255,0.35)',
    rowHover:      'rgba(255,255,255,0.03)',
    rowAlt:        'rgba(255,255,255,0.015)',
    pillPosBg:     'rgba(16,185,129,0.14)', pillPosText: '#10b981',
    pillNegBg:     'rgba(239,68,68,0.14)',  pillNegText: '#ef4444',
    barL4W:        '#8b5cf6',
    barC1W:        '#f59e0b',
    emptyBg:       'rgba(255,255,255,0.02)',
    shadow:        'none',
  },
  light: {
    cardBg:        '#ffffff',
    border:        'rgba(0,0,0,0.07)',
    borderCard:    'rgba(0,0,0,0.08)',
    headerBg:      '#ffffff',
    text:          '#0f172a',
    textSub:       '#475569',
    textMuted:     '#94a3b8',
    textFaint:     '#cbd5e1',
    inputBg:       'rgba(0,0,0,0.03)',
    inputBorder:   'rgba(0,0,0,0.1)',
    selectColor:   '#1e293b',
    optionBg:      '#ffffff',
    infoBg:        'rgba(37,99,235,0.08)',
    infoBorder:    'rgba(37,99,235,0.25)',
    infoText:      '#1d4ed8',
    modalBg:       '#ffffff',
    btnBg:         'rgba(37,99,235,0.08)',
    btnBorder:     'rgba(37,99,235,0.25)',
    btnText:       '#1d4ed8',
    gridStroke:    'rgba(0,0,0,0.07)',
    axisColor:     '#94a3b8',
    tooltipBg:     '#ffffff',
    tooltipBorder: 'rgba(0,0,0,0.1)',
    card1Bg:       '#eff6ff', card1Border: '#bfdbfe', card1Text: '#1d4ed8',
    card2Bg:       '#fefce8', card2Border: '#fef08a', card2Text: '#a16207',
    tableHeadBg:   '#f8fafc',
    tableHeadText: '#94a3b8',
    rowHover:      'rgba(0,0,0,0.03)',
    rowAlt:        'rgba(0,0,0,0.018)',
    pillPosBg:     'rgba(16,185,129,0.14)', pillPosText: '#15803d',
    pillNegBg:     'rgba(239,68,68,0.14)',  pillNegText: '#dc2626',
    barL4W:        '#8b5cf6',
    barC1W:        '#f59e0b',
    emptyBg:       '#f8fafc',
    shadow:        '0 1px 8px rgba(0,0,0,0.07)',
  },
} as const;

// ─── Responsive Hook ──────────────────────────────────────────────────────────
function useBreakpoint() {
  const [width, setWidth] = useState<number>(
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return {
    isMobile:  width < 640,
    isTablet:  width >= 640 && width < 1024,
    isDesktop: width >= 1024,
  };
}

// ─── Unit key helper ─────────────────────────────────────────────────────────
type UnitKey = 'units_dos' | 'units_bal' | 'units_slop' | 'units_bks';

function getUnitData(p: any, unitKey: UnitKey): { l4w: number; c1w: number; l4wTotal?: number } {
  return p[unitKey] ?? { l4w: 0, c1w: 0, l4wTotal: undefined };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ExpandBtn({ onClick, theme }: { onClick: () => void; theme: Theme }) {
  const t = TK[theme];
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 5,
        padding: '4px 10px', borderRadius: 6,
        background: t.btnBg, border: `1px solid ${t.btnBorder}`,
        color: t.btnText, cursor: 'pointer',
        fontSize: 11, fontWeight: 500,
        fontFamily: 'IBM Plex Mono, monospace',
        flexShrink: 0,
      }}
    >
      <Maximize2 size={12} />
      Perbesar
    </button>
  );
}

function SortTh({ children, sortKey, current, onSort, right = false, hidden = false, theme }: {
  children: React.ReactNode;
  sortKey: string;
  current: { key: string; dir: 'asc' | 'desc' } | null;
  onSort: (k: string) => void;
  right?: boolean;
  hidden?: boolean;
  theme: Theme;
}) {
  const t = TK[theme];
  if (hidden) return null;
  const active = current?.key === sortKey;
  return (
    <th
      onClick={() => onSort(sortKey)}
      style={{
        padding: '9px 12px',
        textAlign: right ? 'right' : 'left',
        fontSize: 9, fontFamily: 'IBM Plex Mono, monospace',
        textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600,
        color: active ? (theme === 'dark' ? '#60a5fa' : '#2563eb') : t.tableHeadText,
        background: t.tableHeadBg,
        borderBottom: `1px solid ${t.border}`,
        cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap',
        transition: 'color 0.15s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: right ? 'flex-end' : 'flex-start' }}>
        {children}
        {active
          ? (current?.dir === 'asc'
              ? <ChevronUp size={11} color={theme === 'dark' ? '#60a5fa' : '#2563eb'} />
              : <ChevronDown size={11} color={theme === 'dark' ? '#60a5fa' : '#2563eb'} />)
          : <ChevronUp size={11} color={t.textFaint} />
        }
      </div>
    </th>
  );
}

function ChartTooltip({ active, payload, label, formatter, theme }: any) {
  const t = TK[theme as Theme];
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: t.tooltipBg, border: `1px solid ${t.tooltipBorder}`,
      borderRadius: 8, padding: '10px 14px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
    }}>
      <div style={{ fontSize: 11, color: t.textMuted, fontFamily: 'IBM Plex Mono, monospace', marginBottom: 7 }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: i < payload.length - 1 ? 4 : 0 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: p.fill ?? p.color, flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: t.textSub, fontFamily: 'IBM Plex Sans, sans-serif' }}>{p.name}:</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: t.text, fontFamily: 'IBM Plex Mono, monospace' }}>
            {formatter ? formatter(p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function Modal({ title, onClose, theme, children }: {
  title: string; onClose: () => void; theme: Theme; children: React.ReactNode;
}) {
  const t = TK[theme];
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', fn);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', fn);
      document.body.style.overflow = '';
    };
  }, [onClose]);
  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: t.modalBg, border: `1px solid ${t.border}`,
          borderRadius: 14, width: '100%', maxWidth: 1100,
          maxHeight: '92vh', display: 'flex', flexDirection: 'column',
          boxShadow: '0 32px 80px rgba(0,0,0,0.4)', overflow: 'hidden',
        }}
      >
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px', borderBottom: `1px solid ${t.border}`,
          background: t.headerBg, flexShrink: 0,
        }}>
          <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: t.text, fontFamily: 'IBM Plex Sans, sans-serif', paddingRight: 8 }}>
            {title}
          </h3>
          <button onClick={onClose} style={{
            background: t.inputBg, border: `1px solid ${t.inputBorder}`,
            cursor: 'pointer', color: t.textMuted,
            padding: 4, borderRadius: 6,
            display: 'flex', alignItems: 'center', flexShrink: 0,
          }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: 16, background: t.cardBg }}>{children}</div>
      </div>
    </div>
  );
}

function VarPill({ value, theme }: { value: number; theme: Theme }) {
  const t = TK[theme];
  const pos = value >= 0;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      padding: '2px 7px', borderRadius: 5,
      fontSize: 11, fontWeight: 700, fontFamily: 'IBM Plex Mono, monospace',
      background: pos ? t.pillPosBg : t.pillNegBg,
      color:      pos ? t.pillPosText : t.pillNegText,
      whiteSpace: 'nowrap',
    }}>
      {pos ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
      {pos ? '+' : ''}{formatPercentage(value)}
    </span>
  );
}

function FilterSelect({
  label, accentColor, value, onChange, theme, fullWidth = false, children,
}: {
  label: string; accentColor: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  theme: Theme; fullWidth?: boolean;
  children: React.ReactNode;
}) {
  const t = TK[theme];
  return (
    <div style={{
      display: 'flex', alignItems: 'stretch',
      border: `1px solid ${t.inputBorder}`,
      borderRadius: 8, overflow: 'hidden',
      flex: fullWidth ? '1 1 auto' : undefined,
      minWidth: 0,
    }}>
      <span style={{
        padding: '6px 10px',
        fontSize: 10, fontFamily: 'IBM Plex Mono, monospace',
        textTransform: 'uppercase', letterSpacing: '0.07em',
        fontWeight: 600, color: accentColor,
        background: `${accentColor}18`,
        borderRight: `1px solid ${t.inputBorder}`,
        display: 'flex', alignItems: 'center',
        whiteSpace: 'nowrap', flexShrink: 0,
      }}>
        {label}
      </span>
      <select
        value={value}
        onChange={onChange}
        style={{
          background: t.inputBg, border: 'none', outline: 'none',
          padding: '6px 10px', fontSize: 12,
          fontFamily: 'IBM Plex Mono, monospace', color: t.text,
          cursor: 'pointer', minWidth: 0, flex: 1,
          appearance: 'none', width: '100%',
        }}
      >
        {children}
      </select>
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface L4WC4WAnalysisProps {
  data: L4WC4WData;
  theme?: Theme;
}

type SortKey = 'product' | 'year' | 'l4wValue' | 'c1wValue' | 'variance' | 'variancePercentage';

// ─── Main Component ───────────────────────────────────────────────────────────
export default function L4WC4WAnalysisComponent({ data, theme: themeProp }: L4WC4WAnalysisProps) {
  const theme: Theme = themeProp ?? 'light';
  const t = TK[theme];
  const { isMobile } = useBreakpoint();

  const [expanded,     setExpanded]     = useState<'bar' | 'line' | null>(null);
  const [sort,         setSort]         = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'c1wValue', dir: 'desc' });
  const [selectedUnit, setSelectedUnit] = useState<UnitKey>('units_dos');
  const [selectedCat,  setSelectedCat]  = useState('all');

  const unitOptions: { value: UnitKey; label: string }[] = [
    { value: 'units_dos',  label: 'Jual (Dos Net)'  },
    { value: 'units_bal',  label: 'Jual (Bal Net)'  },
    { value: 'units_slop', label: 'Jual (Slop Net)' },
    { value: 'units_bks',  label: 'Jual (Bks Net)'  },
  ];

  const fmtUnit = (v: number) => v.toLocaleString('id-ID');

  const handleSort = (key: SortKey) => {
    setSort(prev =>
      prev.key === key && prev.dir === 'asc'
        ? { key, dir: 'desc' }
        : { key, dir: 'asc' }
    );
  };

  const availableCategories = useMemo(() => {
    if (!data.productDetails) return [];
    const s = new Set<string>();
    data.productDetails.forEach(p => s.add(getProductCategory(p.product)));
    return Array.from(s).sort();
  }, [data.productDetails]);

  // ── FIX: sortedDetails — semua unit key baca dari nested object ──────────
  const sortedDetails = useMemo(() => {
    if (!data.productDetails) return [];
    let arr = data.productDetails;
    if (selectedCat !== 'all') arr = arr.filter(p => getProductCategory(p.product) === selectedCat);

    return [...arr].map(p => {
      const ud = getUnitData(p, selectedUnit);
      const l4w = ud.l4w ?? 0;
      const c1w = ud.c1w ?? 0;
      const variance = c1w - l4w;
      const variancePercentage = l4w > 0 ? (variance / l4w) * 100 : 0;

      return {
        ...p,
        _l4w:    Math.round(l4w    * 100) / 100,
        _c1w:    Math.round(c1w    * 100) / 100,
        _var:    Math.round(variance * 100) / 100,
        _varPct: Math.round(variancePercentage * 10) / 10,
      };
    }).sort((a, b) => {
      const map: Record<SortKey, any> = {
        product:            [a.product,  b.product],
        year:               [a.year,     b.year],
        l4wValue:           [a._l4w,     b._l4w],
        c1wValue:           [a._c1w,     b._c1w],
        variance:           [a._var,     b._var],
        variancePercentage: [a._varPct,  b._varPct],
      };
      const [av, bv] = map[sort.key];
      if (typeof av === 'string') return sort.dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      return sort.dir === 'asc' ? av - bv : bv - av;
    });
  }, [data.productDetails, selectedUnit, selectedCat, sort]);

  // ── FIX: chartData — selalu agregat dari productDetails[].units_xxx ──────
  const chartData = useMemo(() => {
    let l4wTotal = 0;
    let c1wTotal = 0;

    data.productDetails?.forEach(p => {
      if (selectedCat !== 'all' && getProductCategory(p.product) !== selectedCat) return;
      const ud = getUnitData(p, selectedUnit);
      // l4wTotal: gunakan field l4wTotal jika tersedia, fallback ke l4w * 4
      l4wTotal += ud.l4wTotal ?? (ud.l4w * 4);
      c1wTotal += ud.c1w;
    });

    const l4wAvg = l4wTotal / 4;

    return [
      { period: 'L4W (Rata-rata)',  value: Math.round(l4wAvg   * 100) / 100, type: 'l4w' },
      { period: 'C1W (Minggu Ini)', value: Math.round(c1wTotal * 100) / 100, type: 'c1w' },
    ];
  }, [data.productDetails, selectedUnit, selectedCat]);

  // ── Summary values — derived dari chartData ───────────────────────────────
  const summaryValues = useMemo(() => ({
    l4wAvg: chartData[0].value,
    c1w:    chartData[1].value,
  }), [chartData]);

  // ── trendData ─────────────────────────────────────────────────────────────
  const trendData = useMemo(() => {
    if (!data.weeklyTrendData?.length) return [];
    // Untuk units_dos + semua kategori, weeklyTrendData dari backend sudah benar
    if (selectedUnit === 'units_dos' && selectedCat === 'all') return data.weeklyTrendData;

    const weekTotalMap = new Map<string, { l4wTotal: number; c1w: number }>();
    data.weeklyTrendData.forEach(tw => {
      if (!weekTotalMap.has(tw.week)) weekTotalMap.set(tw.week, { l4wTotal: 0, c1w: 0 });
    });

    data.productDetails?.forEach(p => {
      if (selectedCat !== 'all' && getProductCategory(p.product) !== selectedCat) return;
      data.weeklyTrendData?.forEach(tw => {
        const entry = weekTotalMap.get(tw.week);
        if (!entry) return;
        const ud = getUnitData(p, selectedUnit);
        if (tw.period === 'C1W') entry.c1w     += ud.c1w;
        else                     entry.l4wTotal += ud.l4wTotal ?? (ud.l4w * 4);
      });
    });

    return data.weeklyTrendData.map(tw => {
      const entry = weekTotalMap.get(tw.week);
      if (!entry) return { ...tw, value: 0 };
      const value = tw.period === 'C1W' ? entry.c1w : entry.l4wTotal / 4;
      return { ...tw, value: Math.round(value * 100) / 100 };
    });
  }, [data, selectedUnit, selectedCat]);

  // ── Card style ────────────────────────────────────────────────────────────
  const card = (extra: React.CSSProperties = {}): React.CSSProperties => ({
    background:   t.cardBg,
    border:       `1px solid ${t.borderCard}`,
    borderRadius: isMobile ? 10 : 12,
    padding:      isMobile ? 14 : 20,
    boxShadow:    t.shadow,
    transition:   'background 0.3s, border-color 0.3s',
    ...extra,
  });

  const inlineChartH = isMobile ? 200 : 260;

  const axisProps = {
    tick:     { fill: t.axisColor, fontSize: isMobile ? 9 : 11, fontFamily: 'IBM Plex Mono, monospace' },
    axisLine: { stroke: t.border },
    tickLine: false as const,
  };

  const tdBase: React.CSSProperties = {
    padding:      isMobile ? '8px 10px' : '11px 18px',
    fontSize:     isMobile ? 11 : 12,
    fontFamily:   'IBM Plex Mono, monospace',
    borderBottom: `1px solid ${t.border}`,
    color:        t.textSub,
  };

  const sortState = { key: sort.key as string, dir: sort.dir };

  const BarLegend = () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: isMobile ? 8 : 14 }}>
      {[
        { color: t.barL4W, label: `L4W${!isMobile && data.l4wWeekRange ? ` · ${data.l4wWeekRange}` : ''}` },
        { color: t.barC1W, label: `C1W${!isMobile && data.c1wWeekNumber ? ` · Week ${data.c1wWeekNumber}` : ''}` },
      ].map((item, i) => (
        <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: isMobile ? 11 : 12, color: t.textSub, fontFamily: 'IBM Plex Sans, sans-serif' }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: item.color, flexShrink: 0 }} />
          {item.label}
        </span>
      ))}
    </div>
  );

  const LineLegend = () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: isMobile ? 8 : 14 }}>
      {[
        { color: t.barL4W, label: 'L4W' },
        { color: t.barC1W, label: isMobile ? 'C1W' : 'C1W (dot besar)' },
      ].map((item, i) => (
        <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: isMobile ? 11 : 12, color: t.textSub, fontFamily: 'IBM Plex Sans, sans-serif' }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
          {item.label}
        </span>
      ))}
    </div>
  );

  const barChart = (h: number | string) => (
    <div style={{ height: h, width: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={isMobile ? { top: 4, right: 4, bottom: 4, left: -8 } : { top: 4, right: 12, bottom: 4, left: 8 }}
          barGap={16}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={t.gridStroke} />
          <XAxis
            dataKey="period" {...axisProps}
            tickFormatter={isMobile ? (v: string) => v.split(' ')[0] : undefined}
          />
          <YAxis
            tickFormatter={v => `${(v / 1000).toFixed(0)}K`}
            {...axisProps} axisLine={false} width={isMobile ? 36 : 48}
          />
          <Tooltip content={<ChartTooltip formatter={fmtUnit} theme={theme} />} />
          <Bar dataKey="value" name="Penjualan" radius={[4, 4, 0, 0]} maxBarSize={72}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.type === 'c1w' ? t.barC1W : t.barL4W} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );

  const lineChart = (h: number | string) => (
    <div style={{ height: h, width: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={trendData}
          margin={isMobile ? { top: 4, right: 4, bottom: 4, left: -8 } : { top: 4, right: 12, bottom: 4, left: 8 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={t.gridStroke} />
          <XAxis dataKey="week" {...axisProps} />
          <YAxis
            tickFormatter={v => `${(v / 1000).toFixed(0)}K`}
            {...axisProps} axisLine={false} width={isMobile ? 36 : 48}
          />
          <Tooltip content={<ChartTooltip formatter={fmtUnit} theme={theme} />} />
          <Line
            type="monotone" dataKey="value"
            stroke={t.barL4W} strokeWidth={isMobile ? 2 : 2.5}
            name="Penjualan"
            dot={(props: any) => {
              const { cx, cy, payload } = props;
              const isC1W = payload?.period === 'C1W';
              return (
                <circle
                  key={`dot-${cx}-${cy}`}
                  cx={cx} cy={cy}
                  r={isC1W ? 6 : 3}
                  fill={isC1W ? t.barC1W : t.barL4W}
                  stroke={isC1W ? '#fff' : 'none'}
                  strokeWidth={isC1W ? 2 : 0}
                />
              );
            }}
            activeDot={{ r: 5, fill: t.barL4W }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={{
      display:       'flex',
      flexDirection: 'column',
      gap:           isMobile ? 12 : 20,
      fontFamily:    'IBM Plex Sans, sans-serif',
    }}>

      {/* ── Info banner ── */}
      <div style={{
        padding:      isMobile ? '8px 10px' : '10px 14px',
        background:   t.infoBg,
        border:       `1px solid ${t.infoBorder}`,
        borderRadius: isMobile ? 8 : 10,
      }}>
        <p style={{ margin: 0, fontSize: isMobile ? 10 : 12, color: t.infoText, fontFamily: 'IBM Plex Mono, monospace', lineHeight: 1.6 }}>
          {isMobile ? (
            <>
              <strong>L4W:</strong> {fmtUnit(summaryValues.l4wAvg)}
              &nbsp;→&nbsp;
              <strong>C1W:</strong> {fmtUnit(summaryValues.c1w)}
            </>
          ) : (
            <>
              <strong>Periode:</strong> Last 4 Weeks vs Current 1 Week
              &nbsp;|&nbsp;
              <strong>Rata-rata L4W:</strong> {fmtUnit(summaryValues.l4wAvg)}
              &nbsp;|&nbsp;
              <strong>C1W:</strong> {fmtUnit(summaryValues.c1w)}
            </>
          )}
        </p>
      </div>

      {/* ── Filter card ── */}
      <div style={card()}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 8 : 10 }}>
          <span style={{
            fontSize: isMobile ? 10 : 11, fontWeight: 700,
            color: t.textMuted, fontFamily: 'IBM Plex Mono, monospace',
            textTransform: 'uppercase', letterSpacing: '0.08em',
          }}>
            Filter Data
          </span>
          <div style={{
            display:             'grid',
            gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(2, auto)',
            gap:                 8,
            justifyContent:      isMobile ? 'stretch' : 'flex-start',
            alignItems:          'center',
          }}>
            <FilterSelect label="Unit" accentColor="#10b981" value={selectedUnit}
              onChange={e => setSelectedUnit(e.target.value as UnitKey)} theme={theme} fullWidth={isMobile}>
              {unitOptions.map(o => (
                <option key={o.value} value={o.value} style={{ background: t.optionBg }}>{o.label}</option>
              ))}
            </FilterSelect>
            <FilterSelect label="Kategori" accentColor="#8b5cf6" value={selectedCat}
              onChange={e => setSelectedCat(e.target.value)} theme={theme} fullWidth={isMobile}>
              <option value="all" style={{ background: t.optionBg }}>Semua</option>
              {availableCategories.map(c => (
                <option key={c} value={c} style={{ background: t.optionBg }}>{c}</option>
              ))}
            </FilterSelect>
          </div>
        </div>
      </div>

      {/* ── Metric cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: isMobile ? 10 : 14 }}>
        {[
          {
            label: isMobile ? 'L4W (Rata-rata)' : '4 Minggu Sebelumnya (L4W)',
            value: fmtUnit(summaryValues.l4wAvg),
            sub:   'Rata-rata penjualan',
            bg: t.card1Bg, border: t.card1Border, color: t.card1Text,
          },
          {
            label: isMobile ? 'C1W (Sekarang)' : 'Minggu Terakhir (C1W)',
            value: fmtUnit(summaryValues.c1w),
            sub:   'Penjualan minggu ini',
            bg: t.card2Bg, border: t.card2Border, color: t.card2Text,
          },
        ].map((mc, i) => (
          <div key={i} style={{
            background: mc.bg, border: `1px solid ${mc.border}`,
            borderRadius: isMobile ? 10 : 12,
            padding: isMobile ? '12px 12px' : 20,
          }}>
            <div style={{
              fontSize: isMobile ? 10 : 11, fontWeight: 700, color: mc.color,
              marginBottom: isMobile ? 6 : 8,
              fontFamily: 'IBM Plex Mono, monospace',
              textTransform: 'uppercase', letterSpacing: '0.06em', lineHeight: 1.3,
            }}>
              {mc.label}
            </div>
            <div style={{
              fontSize: isMobile ? 16 : 24, fontWeight: 800, color: t.text,
              fontFamily: 'IBM Plex Mono, monospace',
              letterSpacing: '-0.02em', wordBreak: 'break-all',
            }}>
              {mc.value}
            </div>
            {!isMobile && (
              <div style={{ fontSize: 10, color: t.textMuted, marginTop: 4, fontFamily: 'IBM Plex Mono, monospace' }}>
                {mc.sub}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Charts ── */}
      <div style={{
        display:             'grid',
        gridTemplateColumns: isMobile ? '1fr' : trendData.length > 0 ? '1fr 1fr' : '1fr',
        gap:                 isMobile ? 12 : 14,
      }}>
        {/* Bar chart */}
        <div style={card({ padding: isMobile ? '14px 12px' : '18px 16px' })}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, gap: 8 }}>
            <span style={{ fontSize: isMobile ? 12 : 13, fontWeight: 700, color: t.text, fontFamily: 'IBM Plex Sans, sans-serif' }}>
              Perbandingan L4W vs C1W
            </span>
            <ExpandBtn onClick={() => setExpanded('bar')} theme={theme} />
          </div>
          <BarLegend />
          <div style={{
            marginTop: isMobile ? 8 : 12,
            background: t.inputBg, border: `1px solid ${t.border}`,
            borderRadius: 8, padding: isMobile ? '8px 4px 4px' : '10px 6px 6px',
          }}>
            {barChart(inlineChartH)}
          </div>
        </div>

        {/* Line chart */}
        {trendData.length > 0 && (
          <div style={card({ padding: isMobile ? '14px 12px' : '18px 16px' })}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, gap: 8 }}>
              <span style={{ fontSize: isMobile ? 12 : 13, fontWeight: 700, color: t.text, fontFamily: 'IBM Plex Sans, sans-serif' }}>
                Tren 5 Minggu
              </span>
              <ExpandBtn onClick={() => setExpanded('line')} theme={theme} />
            </div>
            <LineLegend />
            <div style={{
              marginTop: isMobile ? 8 : 12,
              background: t.inputBg, border: `1px solid ${t.border}`,
              borderRadius: 8, padding: isMobile ? '8px 4px 4px' : '10px 6px 6px',
            }}>
              {lineChart(inlineChartH)}
            </div>
          </div>
        )}
      </div>

      {/* ── Detail Table ── */}
      <div style={card()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontSize: isMobile ? 12 : 13, fontWeight: 700, color: t.text, fontFamily: 'IBM Plex Sans, sans-serif' }}>
            Analisis Detail Produk
          </span>
          <span style={{ fontSize: 10, color: t.textMuted, fontFamily: 'IBM Plex Mono, monospace' }}>
            {sortedDetails.length > 0 ? `${sortedDetails.length} produk` : 'Kosong'}
          </span>
        </div>

        <div style={{ border: `1px solid ${t.border}`, borderRadius: isMobile ? 8 : 10, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: isMobile ? 260 : 600 }}>
              <thead>
                <tr>
                  <SortTh sortKey="product"            current={sortState} onSort={k => handleSort(k as SortKey)} theme={theme}>Produk</SortTh>
                  <SortTh sortKey="year"               current={sortState} onSort={k => handleSort(k as SortKey)} theme={theme}>Tahun</SortTh>
                  <SortTh sortKey="l4wValue"           current={sortState} onSort={k => handleSort(k as SortKey)} right theme={theme}>L4W</SortTh>
                  <SortTh sortKey="c1wValue"           current={sortState} onSort={k => handleSort(k as SortKey)} right theme={theme}>C1W</SortTh>
                  <SortTh sortKey="variance"           current={sortState} onSort={k => handleSort(k as SortKey)} right theme={theme}>Variance</SortTh>
                  <SortTh sortKey="variancePercentage" current={sortState} onSort={k => handleSort(k as SortKey)} right theme={theme}>Var %</SortTh>
                </tr>
              </thead>
              <tbody>
                {sortedDetails.length > 0 ? (
                  sortedDetails.map((row, idx) => (
                    <tr
                      key={idx}
                      style={{ background: idx % 2 !== 0 ? t.rowAlt : 'transparent', transition: 'background 0.12s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = t.rowHover)}
                      onMouseLeave={e => (e.currentTarget.style.background = idx % 2 !== 0 ? t.rowAlt : 'transparent')}
                    >
                      <td style={{
                        ...tdBase, color: t.text, fontWeight: 500,
                        fontFamily: 'IBM Plex Sans, sans-serif',
                        fontSize: isMobile ? 11 : 13,
                        maxWidth: isMobile ? 110 : 220,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {row.product}
                        {!isMobile && (
                          <span style={{ marginLeft: 6, fontSize: 10, color: t.textMuted, fontFamily: 'IBM Plex Mono, monospace' }}>
                            {getProductCategory(row.product)}
                          </span>
                        )}
                      </td>
                      <td style={tdBase}>{row.year}</td>
                      <td style={{ ...tdBase, textAlign: 'right' }}>{fmtUnit(row._l4w)}</td>
                      <td style={{ ...tdBase, textAlign: 'right', color: t.text, fontWeight: 700 }}>
                        {fmtUnit(row._c1w)}
                      </td>
                      
                        <td style={{ ...tdBase, textAlign: 'right', fontWeight: 700, color: row._var >= 0 ? '#10b981' : '#ef4444' }}>
                          {row._var >= 0 ? '+' : ''}{fmtUnit(row._var)}
                        </td>
                      
                      <td style={{ ...tdBase, textAlign: 'right' }}>
                        <VarPill value={row._varPct} theme={theme} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={isMobile ? 3 : 6}>
                      <div style={{ padding: isMobile ? '24px 12px' : '40px 24px', textAlign: 'center', background: t.emptyBg }}>
                        <div style={{ fontSize: 13, color: t.textMuted, fontFamily: 'IBM Plex Sans, sans-serif', marginBottom: 4 }}>
                          Data produk tidak tersedia
                        </div>
                        <div style={{ fontSize: 12, color: t.textFaint, fontFamily: 'IBM Plex Mono, monospace' }}>
                          Pilih area dan filter untuk melihat data produk
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {isMobile && sortedDetails.length > 0 && (
          <p style={{ margin: '8px 0 0', fontSize: 10, color: t.textFaint, fontFamily: 'IBM Plex Mono, monospace' }}>
            * Kolom Tahun, L4W &amp; Variance nilai disembunyikan di mobile.
          </p>
        )}
      </div>

      {/* ── Modals ── */}
      {expanded === 'bar' && (
        <Modal title="Perbandingan L4W vs C1W — Tampilan Diperbesar" onClose={() => setExpanded(null)} theme={theme}>
          <div style={{ marginBottom: 14 }}><BarLegend /></div>
          {barChart('calc(92vh - 200px)')}
        </Modal>
      )}
      {expanded === 'line' && (
        <Modal title="Tren 5 Minggu — Tampilan Diperbesar" onClose={() => setExpanded(null)} theme={theme}>
          <div style={{ marginBottom: 14 }}><LineLegend /></div>
          {lineChart('calc(92vh - 200px)')}
        </Modal>
      )}
    </div>
  );
}