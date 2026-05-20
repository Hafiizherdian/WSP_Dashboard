'use client';

import { useState, useEffect, useMemo } from 'react';
import { YearOnYearGrowth, ComparisonYears } from '@/types/sales';
import { formatPercentage } from '@/lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  Maximize2, X, TrendingUp, TrendingDown, Minus,
  ArrowUpRight, ArrowDownRight, BarChart2, PieChart as PieIcon,
  ChevronDown, ChevronUp,
} from 'lucide-react';

// ─── Theme tokens ─────────────────────────────────────────────────────────────
type Theme = 'dark' | 'light';

const TK = {
  dark: {
    cardBg:        '#111318',
    border:        'rgba(255,255,255,0.06)',
    borderCard:    'rgba(255,255,255,0.07)',
    tableHeadBg:   '#0c0e14',
    tableHeadText: 'rgba(255,255,255,0.3)',
    rowHover:      'rgba(255,255,255,0.04)',
    rowAlt:        'rgba(255,255,255,0.015)',
    text:          'rgba(255,255,255,0.9)',
    textSub:       'rgba(255,255,255,0.55)',
    textMuted:     'rgba(255,255,255,0.3)',
    textFaint:     'rgba(255,255,255,0.18)',
    inputBg:       'rgba(255,255,255,0.03)',
    inputBorder:   'rgba(255,255,255,0.08)',
    btnBg:         'rgba(37,99,235,0.12)',
    btnBorder:     'rgba(59,130,246,0.3)',
    btnText:       '#93c5fd',
    modalBg:       '#0f1117',
    gridStroke:    'rgba(255,255,255,0.06)',
    axisColor:     'rgba(255,255,255,0.28)',
    tooltipBg:     '#1a1e2c',
    tooltipBorder: 'rgba(255,255,255,0.12)',
    card1Bg: '#0f1724', card1Border: '#1e3a5f', card1Text: '#93c5fd',
    card2Bg: '#0f1f17', card2Border: '#1a4731', card2Text: '#6ee7b7',
    posBg: 'rgba(16,185,129,0.1)', posBorder: 'rgba(16,185,129,0.25)', posText: '#6ee7b7',
    negBg: 'rgba(239,68,68,0.1)',  negBorder: 'rgba(239,68,68,0.22)',  negText: '#fca5a5',
    shadow:  'none',
    divider: 'rgba(255,255,255,0.04)',
    trackBg: 'rgba(255,255,255,0.06)',
  },
  light: {
    cardBg:        '#ffffff',
    border:        'rgba(0,0,0,0.07)',
    borderCard:    'rgba(0,0,0,0.08)',
    tableHeadBg:   '#f8fafc',
    tableHeadText: '#94a3b8',
    rowHover:      'rgba(0,0,0,0.035)',
    rowAlt:        'rgba(0,0,0,0.018)',
    text:          '#0f172a',
    textSub:       '#475569',
    textMuted:     '#94a3b8',
    textFaint:     '#cbd5e1',
    inputBg:       'rgba(0,0,0,0.03)',
    inputBorder:   'rgba(0,0,0,0.1)',
    btnBg:         'rgba(37,99,235,0.08)',
    btnBorder:     'rgba(37,99,235,0.25)',
    btnText:       '#1d4ed8',
    modalBg:       '#ffffff',
    gridStroke:    'rgba(0,0,0,0.07)',
    axisColor:     '#94a3b8',
    tooltipBg:     '#ffffff',
    tooltipBorder: 'rgba(0,0,0,0.1)',
    card1Bg: '#eff6ff', card1Border: '#bfdbfe', card1Text: '#1d4ed8',
    card2Bg: '#f0fdf4', card2Border: '#bbf7d0', card2Text: '#15803d',
    posBg: 'rgba(16,185,129,0.08)', posBorder: 'rgba(22,163,74,0.25)', posText: '#15803d',
    negBg: 'rgba(220,38,38,0.08)',  negBorder: 'rgba(220,38,38,0.2)',   negText: '#dc2626',
    shadow:  '0 1px 8px rgba(0,0,0,0.07)',
    divider: 'rgba(0,0,0,0.04)',
    trackBg: 'rgba(0,0,0,0.06)',
  },
} as const;

const COLOR_PREV = '#3b82f6';
const COLOR_CURR = '#10b981';

// ─── Formatter: 2 angka di belakang koma, format Indonesia ───────────────────
const fmt2 = (n: number) =>
  n.toLocaleString('id-ID', {
    minimumFractionDigits:  2,
    maximumFractionDigits:  2,
  });

// ─── Helpers ──────────────────────────────────────────────────────────────────
function useBreakpoint() {
  const [width, setWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  useEffect(() => {
    const h = () => setWidth(window.innerWidth);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return { isMobile: width < 640 };
}

// ─── ExpandBtn ────────────────────────────────────────────────────────────────
function ExpandBtn({ onClick, theme }: { onClick: () => void; theme: Theme }) {
  const t = TK[theme];
  return (
    <button
      onClick={onClick}
      title="Perbesar chart"
      style={{
        display: 'flex', alignItems: 'center', gap: 4,
        padding: '4px 10px', borderRadius: 6,
        background: t.inputBg, border: `1px solid ${t.inputBorder}`,
        color: t.textMuted, cursor: 'pointer',
        fontSize: 10, fontWeight: 500,
        fontFamily: 'IBM Plex Mono, monospace', flexShrink: 0,
        transition: 'background 0.15s, color 0.15s',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.background    = t.btnBg;
        (e.currentTarget as HTMLElement).style.color         = t.btnText;
        (e.currentTarget as HTMLElement).style.borderColor   = t.btnBorder;
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.background    = t.inputBg;
        (e.currentTarget as HTMLElement).style.color         = t.textMuted;
        (e.currentTarget as HTMLElement).style.borderColor   = t.inputBorder;
      }}
    >
      <Maximize2 size={10} /> Perbesar
    </button>
  );
}

// ─── ChartTooltip ─────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label, labelPrefix, theme }: any) {
  const t = TK[theme as Theme];
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: t.tooltipBg, border: `1px solid ${t.tooltipBorder}`,
      borderRadius: 10, padding: '10px 14px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.22)',
      fontFamily: 'IBM Plex Mono, monospace',
    }}>
      <div style={{ fontSize: 10, color: t.textMuted, marginBottom: 8, fontWeight: 600 }}>
        {labelPrefix ?? ''}{label}
      </div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: i < payload.length - 1 ? 5 : 0 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.fill ?? p.color, flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: t.textSub }}>{p.name}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: t.text, marginLeft: 'auto' }}>
            {fmt2(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function Modal({ title, onClose, theme, children }: {
  title: string; onClose: () => void; theme: Theme; children: React.ReactNode;
}) {
  const t = TK[theme];

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', fn);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', fn); document.body.style.overflow = ''; };
  }, [onClose]);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        animation: 'yoyFadeIn 0.15s ease',
      }}
      onClick={onClose}
    >
      <style>{`
        @keyframes yoyFadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes yoySlideUp { from { transform: translateY(14px); opacity: 0.6 } to { transform: translateY(0); opacity: 1 } }
      `}</style>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: t.modalBg, border: `1px solid ${t.borderCard}`,
          borderRadius: 16, width: '100%', maxWidth: 1100,
          height: '86vh', display: 'flex', flexDirection: 'column',
          boxShadow: '0 32px 80px rgba(0,0,0,0.45)',
          animation: 'yoySlideUp 0.2s ease',
        }}
      >
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 18px', borderBottom: `1px solid ${t.border}`,
          background: t.tableHeadBg, flexShrink: 0,
          borderRadius: '16px 16px 0 0',
        }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: t.text, fontFamily: 'IBM Plex Sans, sans-serif' }}>
            {title}
          </span>
          <button
            onClick={onClose}
            title="Tutup (Esc)"
            style={{
              background: t.inputBg, border: `1px solid ${t.inputBorder}`,
              cursor: 'pointer', color: t.textMuted,
              padding: '5px 6px', borderRadius: 8,
              display: 'flex', alignItems: 'center',
              transition: 'background 0.15s',
            }}
          >
            <X size={16} />
          </button>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px', background: t.cardBg, borderRadius: '0 0 16px 16px' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── GrowthBadge ─────────────────────────────────────────────────────────────
function GrowthBadge({ value, theme, size = 'md' }: { value: number; theme: Theme; size?: 'sm' | 'md' | 'lg' }) {
  const t = TK[theme];
  const isPos  = value > 0;
  const isNeg  = value < 0;
  const bgCol  = isPos ? t.posBg  : isNeg ? t.negBg  : t.inputBg;
  const border = isPos ? t.posBorder : isNeg ? t.negBorder : t.inputBorder;
  const color  = isPos ? t.posText : isNeg ? t.negText : t.textMuted;
  const Icon   = isPos ? ArrowUpRight : isNeg ? ArrowDownRight : Minus;
  const fs     = size === 'lg' ? 15 : size === 'md' ? 12 : 10;
  const pad    = size === 'lg' ? '5px 12px' : size === 'md' ? '3px 9px' : '2px 7px';

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      padding: pad, borderRadius: 20,
      fontSize: fs, fontWeight: 700, fontFamily: 'IBM Plex Mono, monospace',
      background: bgCol, color, border: `1px solid ${border}`,
    }}>
      <Icon size={fs - 2} />
      {isPos ? '+' : ''}{formatPercentage(value)}
    </span>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface YearOnYearGrowthProps {
  data: YearOnYearGrowth;
  comparisonYears?: ComparisonYears;
  theme?: Theme;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function YearOnYearGrowthComponent({ data, comparisonYears, theme: themeProp }: YearOnYearGrowthProps) {
  const theme: Theme = themeProp ?? 'light';
  const t = TK[theme];
  const { isMobile } = useBreakpoint();

  const [expanded,   setExpanded]   = useState<'bar' | 'pie' | null>(null);
  const [detailOpen, setDetailOpen] = useState(true);

  const prevLabel = comparisonYears?.previousYear ?? 'Tahun Sebelumnya';
  const currLabel = comparisonYears?.currentYear  ?? 'Tahun Sekarang';
  const isPos     = data.variancePercentage >= 0;
  const isNeg     = data.variancePercentage < 0;
  const deltaColor = isPos ? '#10b981' : '#ef4444';

  // ── Chart data ─────────────────────────────────────────────────────────────
  const barData = useMemo(() => [
    { year: String(prevLabel), sales: data.previousYearTotal },
    { year: String(currLabel), sales: data.currentYearTotal  },
  ], [data, prevLabel, currLabel]);

  const pieData = useMemo(() => [
    { name: String(prevLabel), value: data.previousYearTotal },
    { name: String(currLabel), value: data.currentYearTotal  },
  ], [data, prevLabel, currLabel]);

  const totalBoth = data.previousYearTotal + data.currentYearTotal;
  const pctPrev   = totalBoth > 0 ? (data.previousYearTotal / totalBoth) * 100 : 0;
  const pctCurr   = totalBoth > 0 ? (data.currentYearTotal  / totalBoth) * 100 : 0;

  // ── Axis props ─────────────────────────────────────────────────────────────
  const axisProps = {
    tick:     { fill: t.axisColor, fontSize: 11, fontFamily: 'IBM Plex Mono, monospace' },
    axisLine: false as const,
    tickLine: false as const,
  };

  const card = (extra: React.CSSProperties = {}): React.CSSProperties => ({
    background:   t.cardBg,
    border:       `1px solid ${t.borderCard}`,
    borderRadius: 12,
    boxShadow:    t.shadow,
    transition:   'background 0.3s, border-color 0.3s',
    ...extra,
  });

  // ── Chart renderers ────────────────────────────────────────────────────────
  const barChart = (h: number | string) => (
    <div style={{ height: h, width: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={barData} margin={{ top: 8, right: 12, bottom: 4, left: 8 }} barGap={20}>
          <CartesianGrid strokeDasharray="3 3" stroke={t.gridStroke} vertical={false} />
          <XAxis dataKey="year" {...axisProps} />
          <YAxis
            tickFormatter={v => fmt2(v)}
            {...axisProps}
            width={80}
          />
          <Tooltip
            content={<ChartTooltip labelPrefix="Tahun: " theme={theme} />}
            cursor={{ fill: t.divider, radius: 4 }}
          />
          <Bar dataKey="sales" name="Total Penjualan" radius={[5, 5, 0, 0]} maxBarSize={90}>
            {barData.map((_, i) => (
              <Cell key={i} fill={i === 0 ? COLOR_PREV : COLOR_CURR} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );

  const pieChart = (h: number | string) => (
    <div style={{ height: h, width: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={pieData} cx="50%" cy="46%"
            innerRadius="30%" outerRadius="58%"
            labelLine={false}
            label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
              if (!percent || percent < 0.05) return null;
              const r = innerRadius + (outerRadius - innerRadius) * 1.55;
              const x = cx + r * Math.cos(-midAngle * Math.PI / 180);
              const y = cy + r * Math.sin(-midAngle * Math.PI / 180);
              return (
                <text x={x} y={y} fill={t.textSub} textAnchor="middle" dominantBaseline="central"
                  fontSize={10} fontFamily="IBM Plex Mono, monospace" fontWeight={600}>
                  {`${(percent * 100).toFixed(2)}%`}
                </text>
              );
            }}
            dataKey="value"
          >
            {pieData.map((_, i) => (
              <Cell key={i} fill={i === 0 ? COLOR_PREV : COLOR_CURR} stroke="transparent" />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltip theme={theme} />} />
          <Legend
            iconSize={8} iconType="circle"
            wrapperStyle={{ fontSize: 11, fontFamily: 'IBM Plex Mono, monospace', color: t.textSub, paddingTop: 10 }}
            formatter={(v: string) => <span style={{ color: t.textSub }}>{v}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );

  const tdBase: React.CSSProperties = {
    padding: '11px 16px', fontSize: 12,
    fontFamily: 'IBM Plex Mono, monospace',
    borderBottom: `1px solid ${t.border}`,
    color: t.textSub,
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, fontFamily: 'IBM Plex Sans, sans-serif' }}>

      {/* ── KPI Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>

        {/* Prev year */}
        <div style={{
          background: t.card1Bg, border: `1px solid ${t.card1Border}`,
          borderRadius: 12, padding: 18, position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: 50, height: 50, background: `radial-gradient(circle at top right, ${COLOR_PREV}20, transparent 70%)`, pointerEvents: 'none' }} />
          <div style={{ fontSize: 9, fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.07em', color: t.card1Text, marginBottom: 6 }}>
            Total {String(prevLabel)}
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: t.text, fontFamily: 'IBM Plex Mono, monospace', letterSpacing: '-0.02em', marginBottom: 4 }}>
            {fmt2(data.previousYearTotal)}
          </div>
          <div style={{ fontSize: 10, color: t.textMuted, fontFamily: 'IBM Plex Mono, monospace' }}>Penjualan omzet</div>
        </div>

        {/* Curr year */}
        <div style={{
          background: t.card2Bg, border: `1px solid ${t.card2Border}`,
          borderRadius: 12, padding: 18, position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: 50, height: 50, background: `radial-gradient(circle at top right, ${COLOR_CURR}20, transparent 70%)`, pointerEvents: 'none' }} />
          <div style={{ fontSize: 9, fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.07em', color: t.card2Text, marginBottom: 6 }}>
            Total {String(currLabel)}
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: t.text, fontFamily: 'IBM Plex Mono, monospace', letterSpacing: '-0.02em', marginBottom: 4 }}>
            {fmt2(data.currentYearTotal)}
          </div>
          <div style={{ fontSize: 10, color: t.textMuted, fontFamily: 'IBM Plex Mono, monospace' }}>Penjualan omzet</div>
        </div>

        {/* Variance */}
        <div style={{
          background: isPos ? t.posBg : t.negBg,
          border: `1px solid ${isPos ? t.posBorder : t.negBorder}`,
          borderRadius: 12, padding: 18,
        }}>
          <div style={{ fontSize: 9, fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.07em', color: isPos ? t.posText : t.negText, marginBottom: 6 }}>
            Selisih
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: deltaColor, fontFamily: 'IBM Plex Mono, monospace', letterSpacing: '-0.02em', marginBottom: 4 }}>
            {isPos ? '+' : ''}{fmt2(data.variance)}
          </div>
          <div style={{ fontSize: 10, color: t.textMuted, fontFamily: 'IBM Plex Mono, monospace' }}>Selisih absolut</div>
        </div>

        {/* Growth % */}
        <div style={{
          background: isPos ? t.posBg : t.negBg,
          border: `1px solid ${isPos ? t.posBorder : t.negBorder}`,
          borderLeft: `3px solid ${deltaColor}`,
          borderRadius: 12, padding: 18,
        }}>
          <div style={{ fontSize: 9, fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.07em', color: isPos ? t.posText : t.negText, marginBottom: 6 }}>
            Laju Pertumbuhan
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: deltaColor, fontFamily: 'IBM Plex Mono, monospace', letterSpacing: '-0.02em', marginBottom: 6 }}>
            {isPos ? '+' : ''}{formatPercentage(data.variancePercentage)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            {isPos ? <TrendingUp size={12} color="#10b981" /> : <TrendingDown size={12} color="#ef4444" />}
            <span style={{ fontSize: 10, color: t.textMuted, fontFamily: 'IBM Plex Mono, monospace' }}>YoY growth</span>
          </div>
        </div>
      </div>

      {/* ── Charts ── */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: 12 }}>

        {/* Bar chart */}
        <div style={card({ padding: '16px 16px 14px' })}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <BarChart2 size={13} color={t.textMuted} />
              <span style={{ fontSize: 13, fontWeight: 700, color: t.text, fontFamily: 'IBM Plex Sans, sans-serif' }}>
                Perbandingan Tahunan
              </span>
            </div>
            <ExpandBtn onClick={() => setExpanded('bar')} theme={theme} />
          </div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
            {[{ color: COLOR_PREV, label: String(prevLabel) }, { color: COLOR_CURR, label: String(currLabel) }].map((item, i) => (
              <span key={i} style={{
                display: 'flex', alignItems: 'center', gap: 5,
                fontSize: 11, color: t.textSub, fontFamily: 'IBM Plex Mono, monospace',
                padding: '3px 8px', borderRadius: 6,
                background: t.inputBg, border: `1px solid ${t.border}`,
              }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                {item.label}
              </span>
            ))}
          </div>
          <div style={{ background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: 8, padding: '10px 4px 4px' }}>
            {barChart(240)}
          </div>
        </div>

        {/* Donut chart */}
        <div style={card({ padding: '16px 16px 14px' })}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <PieIcon size={13} color={t.textMuted} />
              <span style={{ fontSize: 13, fontWeight: 700, color: t.text, fontFamily: 'IBM Plex Sans, sans-serif' }}>
                Distribusi Penjualan
              </span>
            </div>
            <ExpandBtn onClick={() => setExpanded('pie')} theme={theme} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
            {[
              { label: String(prevLabel), pct: pctPrev, color: COLOR_PREV },
              { label: String(currLabel), pct: pctCurr, color: COLOR_CURR },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                <span style={{ fontSize: 10, color: t.textMuted, fontFamily: 'IBM Plex Mono, monospace', width: 80, flexShrink: 0 }}>{item.label}</span>
                <div style={{ flex: 1, height: 5, background: t.trackBg, borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${item.pct}%`, background: item.color, borderRadius: 3, transition: 'width 0.6s ease' }} />
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, color: t.textSub, fontFamily: 'IBM Plex Mono, monospace', width: 44, textAlign: 'right', flexShrink: 0 }}>
                  {item.pct.toFixed(2)}%
                </span>
              </div>
            ))}
          </div>
          <div style={{ background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: 8, padding: '6px 4px 4px' }}>
            {pieChart(220)}
          </div>
        </div>
      </div>

      {/* ── Detail Table ── */}
      <div style={card()}>
        <div
          onClick={() => setDetailOpen(p => !p)}
          style={{
            padding: '14px 18px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            cursor: 'pointer',
            borderBottom: detailOpen ? `1px solid ${t.border}` : 'none',
          }}
        >
          <span style={{
            fontSize: 11, fontWeight: 700, color: t.textMuted,
            fontFamily: 'IBM Plex Mono, monospace',
            textTransform: 'uppercase', letterSpacing: '0.08em',
          }}>
            Perbandingan Detail
          </span>
          {detailOpen ? <ChevronUp size={14} color={t.textMuted} /> : <ChevronDown size={14} color={t.textMuted} />}
        </div>

        {detailOpen && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Metrik', String(prevLabel), String(currLabel), 'Varians', 'Growth %'].map((h, i) => (
                    <th key={h} style={{
                      padding: '9px 16px',
                      textAlign: i === 0 ? 'left' : 'right',
                      fontSize: 9, fontFamily: 'IBM Plex Mono, monospace',
                      textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700,
                      color: t.tableHeadText, background: t.tableHeadBg,
                      borderBottom: `1px solid ${t.border}`, whiteSpace: 'nowrap',
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>

                {/* Row 1 — Total */}
                <tr
                  style={{ background: t.rowAlt, transition: 'background 0.12s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = t.rowHover)}
                  onMouseLeave={e => (e.currentTarget.style.background = t.rowAlt)}
                >
                  <td style={{ ...tdBase, color: t.text, fontWeight: 600, fontFamily: 'IBM Plex Sans, sans-serif', fontSize: 13 }}>
                    Total Penjualan
                  </td>
                  <td style={{ ...tdBase, textAlign: 'right' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
                      {fmt2(data.previousYearTotal)}
                      <div style={{ width: 48, height: 3, background: t.trackBg, borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pctPrev}%`, background: COLOR_PREV, borderRadius: 2 }} />
                      </div>
                    </div>
                  </td>
                  <td style={{ ...tdBase, textAlign: 'right', color: t.text, fontWeight: 700 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
                      {fmt2(data.currentYearTotal)}
                      <div style={{ width: 48, height: 3, background: t.trackBg, borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pctCurr}%`, background: COLOR_CURR, borderRadius: 2 }} />
                      </div>
                    </div>
                  </td>
                  <td style={{ ...tdBase, textAlign: 'right', color: deltaColor, fontWeight: 700 }}>
                    {isPos ? '+' : ''}{fmt2(data.variance)}
                  </td>
                  <td style={{ ...tdBase, textAlign: 'right' }}>
                    <GrowthBadge value={data.variancePercentage} theme={theme} size="sm" />
                  </td>
                </tr>

                {/* Row 2 — Rata-rata */}
                <tr
                  style={{ transition: 'background 0.12s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = t.rowHover)}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ ...tdBase, color: t.text, fontWeight: 600, fontFamily: 'IBM Plex Sans, sans-serif', fontSize: 13 }}>
                    Rata-rata Tahunan
                  </td>
                  <td colSpan={2} style={{ ...tdBase, textAlign: 'right' }}>
                    {fmt2((data.previousYearTotal + data.currentYearTotal) / 2)}
                  </td>
                  <td colSpan={2} style={{ ...tdBase, textAlign: 'right', color: t.textFaint }}>—</td>
                </tr>

                {/* Row 3 — Kontribusi */}
                <tr
                  style={{ background: t.rowAlt, transition: 'background 0.12s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = t.rowHover)}
                  onMouseLeave={e => (e.currentTarget.style.background = t.rowAlt)}
                >
                  <td style={{ ...tdBase, color: t.text, fontWeight: 600, fontFamily: 'IBM Plex Sans, sans-serif', fontSize: 13, borderBottom: 'none' }}>
                    Kontribusi
                  </td>
                  <td style={{ ...tdBase, textAlign: 'right', borderBottom: 'none' }}>
                    {pctPrev.toFixed(2)}%
                  </td>
                  <td style={{ ...tdBase, textAlign: 'right', borderBottom: 'none', color: t.text, fontWeight: 700 }}>
                    {pctCurr.toFixed(2)}%
                  </td>
                  <td colSpan={2} style={{ ...tdBase, textAlign: 'right', color: t.textFaint, borderBottom: 'none' }}>—</td>
                </tr>

              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {expanded === 'bar' && (
        <Modal title={`Perbandingan Penjualan — ${String(prevLabel)} vs ${String(currLabel)}`} onClose={() => setExpanded(null)} theme={theme}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
            {[{ color: COLOR_PREV, label: String(prevLabel) }, { color: COLOR_CURR, label: String(currLabel) }].map((item, i) => (
              <span key={i} style={{
                display: 'flex', alignItems: 'center', gap: 5, fontSize: 12,
                color: t.textSub, fontFamily: 'IBM Plex Mono, monospace',
                padding: '4px 10px', borderRadius: 6,
                background: t.inputBg, border: `1px solid ${t.border}`,
              }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.color }} />
                {item.label}
              </span>
            ))}
          </div>
          {barChart('calc(86vh - 180px)')}
        </Modal>
      )}

      {expanded === 'pie' && (
        <Modal title={`Distribusi Penjualan — ${String(prevLabel)} vs ${String(currLabel)}`} onClose={() => setExpanded(null)} theme={theme}>
          {pieChart('calc(86vh - 160px)')}
        </Modal>
      )}
    </div>
  );
}