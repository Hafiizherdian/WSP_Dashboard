'use client';

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend, ReferenceLine,
} from 'recharts';
import {
  Store, TrendingUp, TrendingDown, Filter, Maximize2, X, ArrowUp, ArrowDown,
  Calendar, ChevronDown, ChevronUp, SlidersHorizontal, BarChart2,
  RefreshCw, ArrowUpRight, ArrowDownRight, Minus, Search,
} from 'lucide-react';
import { OutletSalesData } from '@/types/sales';

// ─── Theme tokens ─────────────────────────────────────────────────────────────
type Theme = 'dark' | 'light';

const TK = {
  dark: {
    cardBg: '#111318', contentBg: '#0d0f15', inputBg: 'rgba(255,255,255,0.03)',
    border: 'rgba(255,255,255,0.06)', borderCard: 'rgba(255,255,255,0.07)',
    borderInput: 'rgba(255,255,255,0.08)', text: 'rgba(255,255,255,0.9)',
    textSub: 'rgba(255,255,255,0.55)', textMuted: 'rgba(255,255,255,0.3)',
    textFaint: 'rgba(255,255,255,0.18)', selectBg: '#0c0e14',
    selectColor: 'rgba(255,255,255,0.7)',
    blue:   { bg: 'rgba(59,130,246,0.12)',  text: '#93c5fd', border: 'rgba(59,130,246,0.3)'  },
    green:  { bg: 'rgba(16,185,129,0.12)',  text: '#6ee7b7', border: 'rgba(16,185,129,0.3)'  },
    purple: { bg: 'rgba(139,92,246,0.12)',  text: '#c4b5fd', border: 'rgba(139,92,246,0.3)'  },
    orange: { bg: 'rgba(249,115,22,0.12)',  text: '#fb923c', border: 'rgba(249,115,22,0.3)'  },
    red:    { bg: 'rgba(239,68,68,0.12)',   text: '#fca5a5', border: 'rgba(239,68,68,0.25)'  },
    indigo: { bg: 'rgba(99,102,241,0.12)',  text: '#a5b4fc', border: 'rgba(99,102,241,0.3)'  },
    pink:   { bg: 'rgba(236,72,153,0.12)',  text: '#f9a8d4', border: 'rgba(236,72,153,0.3)'  },
    card1:  { bg: '#0f1724', border: '#1e3a5f', text: '#93c5fd', val: 'rgba(255,255,255,0.9)' },
    card2:  { bg: '#0f1f17', border: '#1a4731', text: '#6ee7b7', val: 'rgba(255,255,255,0.9)' },
    card3:  { bg: '#1a1208', border: '#3d2b0a', text: '#fcd34d', val: 'rgba(255,255,255,0.9)' },
    card4:  { bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.18)', text: '#fca5a5', val: 'rgba(255,255,255,0.9)' },
    gridStroke: 'rgba(255,255,255,0.06)', tooltipBg: '#0c0e14',
    tooltipBorder: 'rgba(255,255,255,0.12)', tooltipText: 'rgba(255,255,255,0.85)',
    tableHeadBg: '#0c0e14', tableHeadText: 'rgba(255,255,255,0.3)',
    tableAlt: 'rgba(255,255,255,0.02)', tableHover: 'rgba(255,255,255,0.04)',
    modalOverlay: 'rgba(0,0,0,0.8)', modalBg: '#111318', modalBorder: 'rgba(255,255,255,0.08)',
    yearA: { bg: '#0f1724', border: '#1e3a5f', label: '#93c5fd', accent: '#3b82f6' },
    yearB: { bg: '#0f1f17', border: '#1a4731', label: '#6ee7b7', accent: '#10b981' },
    scrollbar: 'rgba(255,255,255,0.1)', shadow: 'none',
    posGrowth: { bg: 'rgba(16,185,129,0.12)', text: '#6ee7b7', border: 'rgba(16,185,129,0.25)' },
    negGrowth: { bg: 'rgba(239,68,68,0.1)',   text: '#fca5a5', border: 'rgba(239,68,68,0.2)'  },
    neuGrowth: { bg: 'rgba(255,255,255,0.06)', text: 'rgba(255,255,255,0.4)', border: 'rgba(255,255,255,0.1)' },
    divider: 'rgba(255,255,255,0.04)', chartAreaBg: 'rgba(255,255,255,0.03)',
    chartAreaBorder: 'rgba(255,255,255,0.06)',
  },
  light: {
    cardBg: '#ffffff', contentBg: '#f8fafc', inputBg: 'rgba(0,0,0,0.03)',
    border: 'rgba(0,0,0,0.07)', borderCard: 'rgba(0,0,0,0.08)',
    borderInput: 'rgba(0,0,0,0.1)', text: '#0f172a', textSub: '#475569',
    textMuted: '#94a3b8', textFaint: '#cbd5e1', selectBg: '#ffffff',
    selectColor: '#1e293b',
    blue:   { bg: 'rgba(37,99,235,0.08)',  text: '#1d4ed8', border: 'rgba(37,99,235,0.25)'  },
    green:  { bg: 'rgba(22,163,74,0.08)',  text: '#15803d', border: 'rgba(22,163,74,0.2)'   },
    purple: { bg: 'rgba(109,40,217,0.08)', text: '#6d28d9', border: 'rgba(109,40,217,0.2)'  },
    orange: { bg: 'rgba(234,88,12,0.08)',  text: '#c2410c', border: 'rgba(234,88,12,0.2)'   },
    red:    { bg: 'rgba(220,38,38,0.08)',  text: '#b91c1c', border: 'rgba(220,38,38,0.18)'  },
    indigo: { bg: 'rgba(79,70,229,0.08)',  text: '#4338ca', border: 'rgba(79,70,229,0.2)'   },
    pink:   { bg: 'rgba(219,39,119,0.08)', text: '#be185d', border: 'rgba(219,39,119,0.2)'  },
    card1:  { bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8', val: '#0f172a' },
    card2:  { bg: '#f0fdf4', border: '#bbf7d0', text: '#15803d', val: '#0f172a' },
    card3:  { bg: '#fefce8', border: '#fef08a', text: '#a16207', val: '#0f172a' },
    card4:  { bg: '#fef2f2', border: '#fecaca', text: '#b91c1c', val: '#0f172a' },
    gridStroke: 'rgba(0,0,0,0.07)', tooltipBg: '#ffffff',
    tooltipBorder: 'rgba(0,0,0,0.1)', tooltipText: '#0f172a',
    tableHeadBg: '#f8fafc', tableHeadText: '#94a3b8',
    tableAlt: 'rgba(0,0,0,0.02)', tableHover: 'rgba(0,0,0,0.03)',
    modalOverlay: 'rgba(0,0,0,0.5)', modalBg: '#ffffff', modalBorder: 'rgba(0,0,0,0.08)',
    yearA: { bg: '#eff6ff', border: '#bfdbfe', label: '#1d4ed8', accent: '#2563eb' },
    yearB: { bg: '#f0fdf4', border: '#bbf7d0', label: '#15803d', accent: '#16a34a' },
    scrollbar: 'rgba(0,0,0,0.15)', shadow: '0 1px 8px rgba(0,0,0,0.07)',
    posGrowth: { bg: 'rgba(22,163,74,0.08)',  text: '#15803d', border: 'rgba(22,163,74,0.2)'  },
    negGrowth: { bg: 'rgba(220,38,38,0.08)',  text: '#b91c1c', border: 'rgba(220,38,38,0.15)' },
    neuGrowth: { bg: 'rgba(0,0,0,0.04)',      text: '#94a3b8', border: 'rgba(0,0,0,0.08)'     },
    divider: 'rgba(0,0,0,0.04)', chartAreaBg: 'rgba(0,0,0,0.02)',
    chartAreaBorder: 'rgba(0,0,0,0.06)',
  },
} as const;

const PALETTE_A   = ['#3b82f6','#8b5cf6','#06b6d4','#6366f1','#0ea5e9','#a78bfa','#2563eb'];
const PALETTE_B   = ['#10b981','#f59e0b','#14b8a6','#84cc16','#22d3ee','#a3e635','#059669'];
const PIE_PAL_A   = ['#3b82f6','#8b5cf6','#f59e0b','#ef4444','#06b6d4','#10b981','#f97316'];
const PIE_PAL_B   = ['#10b981','#3b82f6','#f59e0b','#a855f7','#ef4444','#14b8a6','#ec4899'];

type AccentKey = 'blue'|'green'|'purple'|'orange'|'red'|'indigo'|'pink';
type CardKey   = 'card1'|'card2'|'card3'|'card4';
type SortDir   = 'asc'|'desc'|null;

// ─── Responsive Hook ──────────────────────────────────────────────────────────
function useBreakpoint() {
  const [width, setWidth] = useState<number>(
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );
  useEffect(() => {
    const h = () => setWidth(window.innerWidth);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return { isMobile: width < 640, isTablet: width >= 640 && width < 1024, isDesktop: width >= 1024 };
}

// ─── FilterSelect ─────────────────────────────────────────────────────────────
function FilterSelect({ label, value, onChange, options, accentKey, theme }: {
  label: string; value: string; onChange: (v: string) => void;
  options: string[]; accentKey: AccentKey; theme: Theme;
}) {
  const t = TK[theme];
  const accent = t[accentKey];
  const active = value !== 'all';
  return (
    <div style={{ display: 'flex', alignItems: 'stretch', border: `1px solid ${active ? accent.border : t.borderInput}`, borderRadius: 8, overflow: 'hidden', transition: 'border-color 0.2s', boxShadow: active ? `0 0 0 2px ${accent.border}40` : 'none' }}>
      <span style={{ padding: '6px 9px', fontSize: 9, fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700, color: accent.text, background: active ? accent.bg : t.inputBg, borderRight: `1px solid ${active ? accent.border : t.borderInput}`, display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', flexShrink: 0, transition: 'background 0.2s' }}>
        {label}
      </span>
      <select value={value} onChange={e => onChange(e.target.value)} style={{ background: t.inputBg, border: 'none', outline: 'none', padding: '6px 24px 6px 8px', fontSize: 11, fontFamily: 'IBM Plex Mono, monospace', color: active ? t.text : t.textMuted, cursor: 'pointer', flex: 1, minWidth: 0, appearance: 'none', width: '100%', fontWeight: active ? 600 : 400 }}>
        <option value="all" style={{ background: t.selectBg }}>Semua</option>
        {options.map(o => <option key={o} value={o} style={{ background: t.selectBg }}>{o}</option>)}
      </select>
    </div>
  );
}

// ─── SearchInput ──────────────────────────────────────────────────────────────
// Searchable dropdown: ketik untuk filter opsi, lalu pilih
function SearchableSelect({ label, value, onChange, options, accentKey, theme, placeholder }: {
  label: string;
  // value adalah customer_no (atau '' untuk 'all')
  value: string;
  onChange: (customerNo: string, customerName: string) => void;
  // options: array { no, name } unik
  options: { no: string; name: string }[];
  accentKey: AccentKey;
  theme: Theme;
  placeholder?: string;
}) {
  const t       = TK[theme];
  const accent  = t[accentKey];
  const active  = value !== '';
  const [open,  setOpen]  = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  // Tutup dropdown kalau klik di luar
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Label yang ditampilkan di tombol
  const selectedOption = options.find(o => o.no === value);
  const displayValue   = selectedOption
    ? `${selectedOption.name}${selectedOption.no ? ` · ${selectedOption.no}` : ''}`
    : placeholder ?? 'Semua';

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    if (!q) return options.slice(0, 60); // batasi 60 opsi awal agar tidak lag
    return options.filter(o =>
      o.name.toLowerCase().includes(q) || o.no.toLowerCase().includes(q)
    ).slice(0, 60);
  }, [options, query]);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Trigger button */}
      <div
        onClick={() => setOpen(p => !p)}
        style={{
          display: 'flex', alignItems: 'stretch',
          border: `1px solid ${active ? accent.border : t.borderInput}`,
          borderRadius: 8, overflow: 'hidden', cursor: 'pointer',
          transition: 'border-color 0.2s',
          boxShadow: active ? `0 0 0 2px ${accent.border}40` : 'none',
        }}
      >
        <span style={{
          padding: '6px 9px', fontSize: 9, fontFamily: 'IBM Plex Mono, monospace',
          textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700,
          color: accent.text, background: active ? accent.bg : t.inputBg,
          borderRight: `1px solid ${active ? accent.border : t.borderInput}`,
          display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', flexShrink: 0,
        }}>
          {label}
        </span>
        <span style={{
          flex: 1, padding: '6px 10px', fontSize: 11,
          fontFamily: 'IBM Plex Mono, monospace',
          color: active ? t.text : t.textMuted,
          background: t.inputBg, display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: 4, fontWeight: active ? 600 : 400,
          minWidth: 0,
        }}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {displayValue}
          </span>
          <ChevronDown size={10} style={{ flexShrink: 0, color: t.textMuted }} />
        </span>
      </div>

      {/* Dropdown panel */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
          zIndex: 9999, background: t.cardBg,
          border: `1px solid ${t.borderCard}`, borderRadius: 10,
          boxShadow: '0 12px 32px rgba(0,0,0,0.25)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          minWidth: 220,
        }}>
          {/* Search box */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 10px', borderBottom: `1px solid ${t.border}`,
            background: t.tableHeadBg,
          }}>
            <Search size={11} color={t.textMuted} style={{ flexShrink: 0 }} />
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Cari nama / ID..."
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                fontSize: 11, fontFamily: 'IBM Plex Mono, monospace',
                color: t.text, caretColor: accent.text,
              }}
            />
            {query && (
              <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.textMuted, padding: 0, display: 'flex' }}>
                <X size={10} />
              </button>
            )}
          </div>

          {/* Option list */}
          <div style={{ overflowY: 'auto', maxHeight: 200 }}>
            {/* "Semua" option */}
            <div
              onClick={() => { onChange('', ''); setOpen(false); setQuery(''); }}
              style={{
                padding: '7px 12px', fontSize: 11, fontFamily: 'IBM Plex Mono, monospace',
                color: !active ? t.text : t.textMuted,
                background: !active ? t.divider : 'transparent',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = t.tableHover}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = !active ? t.divider : 'transparent'}
            >
              <span style={{ fontWeight: !active ? 700 : 400 }}>Semua Customer</span>
            </div>

            {filtered.length === 0 ? (
              <div style={{ padding: '10px 12px', fontSize: 10, color: t.textMuted, fontFamily: 'IBM Plex Mono, monospace', textAlign: 'center' }}>
                Tidak ditemukan
              </div>
            ) : filtered.map(opt => {
              const isSelected = opt.no === value;
              return (
                <div
                  key={`${opt.no}||${opt.name}`}
                  onClick={() => { onChange(opt.no, opt.name); setOpen(false); setQuery(''); }}
                  style={{
                    padding: '7px 12px', cursor: 'pointer',
                    background: isSelected ? accent.bg : 'transparent',
                    display: 'flex', flexDirection: 'column', gap: 1,
                  }}
                  onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = t.tableHover; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = isSelected ? accent.bg : 'transparent'; }}
                >
                  <span style={{ fontSize: 11, fontFamily: 'IBM Plex Mono, monospace', color: isSelected ? accent.text : t.text, fontWeight: isSelected ? 700 : 400 }}>
                    {opt.name}
                  </span>
                  {opt.no && (
                    <span style={{ fontSize: 9, fontFamily: 'IBM Plex Mono, monospace', color: isSelected ? accent.text : t.textFaint, opacity: 0.8 }}>
                      #{opt.no}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── FilterChip ───────────────────────────────────────────────────────────────
function FilterChip({ label, onRemove, accentKey, theme }: { label: string; onRemove: () => void; accentKey: AccentKey; theme: Theme }) {
  const accent = TK[theme][accentKey];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px 3px 7px', borderRadius: 20, fontSize: 10, fontWeight: 600, fontFamily: 'IBM Plex Mono, monospace', background: accent.bg, color: accent.text, border: `1px solid ${accent.border}`, whiteSpace: 'nowrap' }}>
      {label}
      <button onClick={onRemove} style={{ background: 'none', border: 'none', cursor: 'pointer', color: accent.text, padding: '0 1px', opacity: 0.6, lineHeight: 1, borderRadius: 3, fontSize: 13, display: 'flex', alignItems: 'center' }}>
        <X size={10} />
      </button>
    </span>
  );
}

// ─── SearchBox (global search di header filter) ────────────────────────────────
function SearchBox({ value, onChange, theme, placeholder }: {
  value: string; onChange: (v: string) => void; theme: Theme; placeholder?: string;
}) {
  const t = TK[theme];
  const active = value.length > 0;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      border: `1px solid ${active ? t.blue.border : t.borderInput}`,
      borderRadius: 8, padding: '6px 10px', background: t.inputBg,
      transition: 'border-color 0.2s',
      boxShadow: active ? `0 0 0 2px ${t.blue.border}40` : 'none',
    }}>
      <Search size={11} color={active ? t.blue.text : t.textMuted} style={{ flexShrink: 0 }} />
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder ?? 'Cari...'}
        style={{
          flex: 1, background: 'transparent', border: 'none', outline: 'none',
          fontSize: 11, fontFamily: 'IBM Plex Mono, monospace',
          color: t.text, caretColor: t.blue.text,
          minWidth: 0,
        }}
      />
      {active && (
        <button onClick={() => onChange('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.textMuted, padding: 0, display: 'flex' }}>
          <X size={10} />
        </button>
      )}
    </div>
  );
}

// ─── MetricCard ───────────────────────────────────────────────────────────────
function MetricCard({ label, value, sub, cardKey, icon: Icon, theme, compact, trend }: {
  label: string; value: string; sub: string; cardKey: CardKey;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  theme: Theme; compact?: boolean; trend?: { value: number; label: string };
}) {
  const c = TK[theme][cardKey];
  const t = TK[theme];
  const pos = trend && trend.value > 0;
  const neg = trend && trend.value < 0;
  const gs  = pos ? t.posGrowth : neg ? t.negGrowth : t.neuGrowth;
  return (
    <div style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 10, padding: compact ? '10px 12px' : '14px 16px', display: 'flex', flexDirection: 'column', gap: compact ? 3 : 5, transition: 'background 0.3s', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, right: 0, width: 60, height: 60, background: `radial-gradient(circle at top right, ${c.text}15, transparent 70%)`, pointerEvents: 'none' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Icon size={11} color={c.text} />
          <span style={{ fontSize: compact ? 8 : 10, fontWeight: 700, fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em', color: c.text }}>{label}</span>
        </div>
        {trend && (
          <span style={{ fontSize: 9, fontWeight: 700, fontFamily: 'IBM Plex Mono, monospace', padding: '1px 6px', borderRadius: 10, background: gs.bg, color: gs.text, border: `1px solid ${gs.border}`, display: 'flex', alignItems: 'center', gap: 2 }}>
            {pos ? <ArrowUpRight size={8} /> : neg ? <ArrowDownRight size={8} /> : <Minus size={8} />}
            {Math.abs(trend.value).toFixed(1)}%
          </span>
        )}
      </div>
      <div style={{ fontSize: compact ? 16 : 21, fontWeight: 800, fontFamily: 'IBM Plex Mono, monospace', letterSpacing: '-0.02em', color: c.val, wordBreak: 'break-all' }}>{value}</div>
      <div style={{ fontSize: compact ? 9 : 11, color: t.textMuted, fontFamily: 'IBM Plex Mono, monospace' }}>{sub}</div>
    </div>
  );
}

// ─── YoYSummaryBar ────────────────────────────────────────────────────────────
function YoYSummaryBar({ dataA, dataB, yearA, yearB, theme }: { dataA: OutletSalesData[]; dataB: OutletSalesData[]; yearA: number; yearB: number; theme: Theme }) {
  const t = TK[theme];
  const totalA  = useMemo(() => dataA.reduce((s, r) => s + (r.dozNet || 0), 0), [dataA]);
  const totalB  = useMemo(() => dataB.reduce((s, r) => s + (r.dozNet || 0), 0), [dataB]);
  const growth  = totalA > 0 ? ((totalB - totalA) / totalA) * 100 : 0;
  const isPos   = growth > 0;
  const isNeg   = growth < 0;
  const gs      = isPos ? t.posGrowth : isNeg ? t.negGrowth : t.neuGrowth;
  const GI      = isPos ? TrendingUp : isNeg ? TrendingDown : Minus;
  const maxVal  = Math.max(totalA, totalB);
  return (
    <div style={{ background: t.cardBg, border: `1px solid ${t.borderCard}`, borderRadius: 12, padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 12, boxShadow: t.shadow }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: t.textMuted, fontFamily: 'IBM Plex Mono, monospace' }}>Perbandingan YoY · DOZ Net</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 20, background: gs.bg, border: `1px solid ${gs.border}` }}>
          <GI size={12} color={gs.text} />
          <span style={{ fontSize: 12, fontWeight: 800, fontFamily: 'IBM Plex Mono, monospace', color: gs.text }}>{isPos ? '+' : ''}{growth.toFixed(1)}% YoY</span>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[
          { yr: yearA, val: totalA, palette: TK[theme].yearA },
          { yr: yearB, val: totalB, palette: TK[theme].yearB },
        ].map(({ yr, val, palette }) => (
          <div key={yr} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 44, fontSize: 11, fontWeight: 700, fontFamily: 'IBM Plex Mono, monospace', color: palette.label, flexShrink: 0, textAlign: 'right' }}>{yr}</span>
            <div style={{ flex: 1, height: 20, background: t.inputBg, borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${maxVal > 0 ? (val / maxVal) * 100 : 0}%`, background: palette.accent, borderRadius: 4, transition: 'width 0.6s ease' }} />
            </div>
            <span style={{ width: 80, fontSize: 11, fontWeight: 700, fontFamily: 'IBM Plex Mono, monospace', color: t.textSub, flexShrink: 0 }}>{val.toLocaleString('id-ID')}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── ChartTooltip — updated: terima customerData map untuk lookup customer_no ──
function ChartTooltip({ active, payload, label, theme, prefix = '', customerMap }: any) {
  if (!active || !payload?.length) return null;
  const t = TK[theme as Theme];

  // Cari customer_no dari map yang dikirim sebagai prop (khusus chart customer)
  const customerId: string = customerMap ? (customerMap.get(String(label)) ?? '') : '';

  return (
    <div style={{ background: t.tooltipBg, border: `1px solid ${t.tooltipBorder}`, borderRadius: 10, padding: '10px 14px', fontFamily: 'IBM Plex Mono, monospace', minWidth: 160, boxShadow: '0 8px 24px rgba(0,0,0,0.25)', maxWidth: 240 }}>
      <div style={{ fontSize: 10, color: t.textMuted, marginBottom: 8, fontWeight: 600, wordBreak: 'break-all' }}>
        {prefix && <span style={{ color: t.textFaint, marginRight: 3 }}>{prefix}</span>}
        <span style={{ color: t.text }}>{label}</span>
        {customerId && (
          <span style={{ display: 'block', color: t.textFaint, fontSize: 9, marginTop: 2 }}>
            ID: {customerId}
          </span>
        )}
      </div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, fontSize: 11, marginBottom: i < payload.length - 1 ? 4 : 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
            <span style={{ color: t.textSub }}>{p.name}</span>
          </div>
          <span style={{ fontWeight: 700, color: t.tooltipText }}>{Number(p.value).toLocaleString('id-ID')}</span>
        </div>
      ))}
      {payload.length > 1 && (
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
          <span style={{ color: t.textMuted }}>Total</span>
          <span style={{ fontWeight: 800, color: t.tooltipText }}>{payload.reduce((s: number, p: any) => s + Number(p.value), 0).toLocaleString('id-ID')}</span>
        </div>
      )}
    </div>
  );
}

// ─── ChartBox ─────────────────────────────────────────────────────────────────
function ChartBox({ title, chartKey, height = 260, onExpand, year, theme, compact, children, badge }: {
  title: string; chartKey: string; height?: number;
  onExpand: (chartKey: string, year: number) => void;
  year: number; theme: Theme; compact?: boolean; children: React.ReactNode; badge?: string;
}) {
  const t = TK[theme];
  const { isMobile } = useBreakpoint();
  return (
    <div style={{ background: t.cardBg, border: `1px solid ${t.borderCard}`, borderRadius: 10, padding: compact || isMobile ? '10px 10px' : '14px 16px', boxShadow: t.shadow, transition: 'background 0.3s' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: compact || isMobile ? 11 : 12, fontWeight: 600, fontFamily: 'IBM Plex Sans, sans-serif', color: t.text }}>{title}</span>
          {badge && <span style={{ fontSize: 9, fontWeight: 600, padding: '1px 6px', borderRadius: 8, background: t.inputBg, color: t.textMuted, border: `1px solid ${t.border}`, fontFamily: 'IBM Plex Mono, monospace' }}>{badge}</span>}
        </div>
        <button onClick={() => onExpand(chartKey, year)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6, fontSize: 10, fontWeight: 500, fontFamily: 'IBM Plex Mono, monospace', background: t.inputBg, color: t.textMuted, border: `1px solid ${t.borderInput}`, cursor: 'pointer', flexShrink: 0 }}>
          <Maximize2 size={9} /> Perbesar
        </button>
      </div>
      <div style={{ height, background: t.chartAreaBg, border: `1px solid ${t.chartAreaBorder}`, borderRadius: 8, padding: '8px 4px 4px' }}>
        {children}
      </div>
    </div>
  );
}

// ─── ExpandModal ──────────────────────────────────────────────────────────────
function ExpandModal({ title, onClose, children, theme }: { title: string; onClose: () => void; children: React.ReactNode; theme: Theme }) {
  const t = TK[theme];
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', fn);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', fn); document.body.style.overflow = ''; };
  }, [onClose]);
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 99999, backgroundColor: t.modalOverlay, backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: t.modalBg, border: `1px solid ${t.modalBorder}`, borderRadius: 16, width: '100%', maxWidth: '96vw', maxHeight: '92vh', display: 'flex', flexDirection: 'column', boxShadow: '0 32px 80px rgba(0,0,0,0.45)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: `1px solid ${t.border}`, background: t.tableHeadBg, flexShrink: 0, borderRadius: '16px 16px 0 0' }}>
          <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'IBM Plex Sans, sans-serif', color: t.text }}>{title}</span>
          <button onClick={onClose} style={{ background: t.inputBg, border: `1px solid ${t.borderInput}`, cursor: 'pointer', color: t.textMuted, padding: '5px 6px', borderRadius: 8, display: 'flex', alignItems: 'center' }}>
            <X size={16} />
          </button>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '16px 18px', background: t.cardBg, borderRadius: '0 0 16px 16px' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── SortTh ───────────────────────────────────────────────────────────────────
function SortTh({ label, sortKey, sortState, onSort, theme, align = 'left' }: { label: string; sortKey: string; sortState: { key: string; dir: SortDir }; onSort: (key: string) => void; theme: Theme; align?: 'left'|'right' }) {
  const t = TK[theme];
  const active = sortState.key === sortKey;
  return (
    <th onClick={() => onSort(sortKey)} style={{ padding: '8px 14px', textAlign: align, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: active ? t.textSub : t.tableHeadText, background: active ? t.divider : t.tableHeadBg, borderBottom: `1px solid ${t.border}`, cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap', transition: 'background 0.15s', fontFamily: 'IBM Plex Mono, monospace' }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        {label}
        <span style={{ opacity: active ? 1 : 0.3, fontSize: 8 }}>
          {active && sortState.dir === 'asc' ? '▲' : active && sortState.dir === 'desc' ? '▼' : '⇅'}
        </span>
      </span>
    </th>
  );
}

// ─── YearPanel ────────────────────────────────────────────────────────────────
function YearPanel({ year, isA, data: rows, theme, onExpand, compact, otherTotal, weekRange }: {
  year: number; isA: boolean; data: OutletSalesData[];
  theme: Theme; onExpand: (chartKey: string, year: number) => void;
  compact?: boolean; otherTotal?: number;
  weekRange: { min: number; max: number };
}) {
  const t = TK[theme];
  const { isMobile } = useBreakpoint();
  const palette    = isA ? PALETTE_A : PALETTE_B;
  const piePalette = isA ? PIE_PAL_A : PIE_PAL_B;
  const yc         = isA ? TK[theme].yearA : TK[theme].yearB;

  const [sortState,     setSortState]     = useState<{ key: string; dir: SortDir }>({ key: 'week', dir: 'asc' });
  const [expandedChart, setExpandedChart] = useState<string | null>(null);

  const handleSort = (key: string) => {
    setSortState(prev =>
      prev.key === key
        ? { key, dir: prev.dir === 'asc' ? 'desc' : prev.dir === 'desc' ? null : 'asc' }
        : { key, dir: 'desc' }
    );
  };

  const outletTypes = useMemo(() => {
    const s = new Set<string>();
    rows.forEach(r => { if (r.outletType) s.add(r.outletType); });
    return Array.from(s).sort();
  }, [rows]);

  const weeklyData = useMemo(() => {
  const m = new Map<number, number>();

  rows.forEach(r => {
    if (r.weeklyDozNet) {
      // ← Pakai per-week breakdown jika tersedia
      Object.entries(r.weeklyDozNet).forEach(([wkStr, val]) => {
        const wk = Number(wkStr);
        m.set(wk, (m.get(wk) ?? 0) + val);
      });
    } else {
      // fallback: data lama tanpa weeklyDozNet
      if (r.week != null) m.set(r.week, (m.get(r.week) ?? 0) + (r.dozNet ?? 0));
    }
  });

  const result: { week: string; wkNum: number; dozNet: number }[] = [];
  for (let wk = weekRange.min; wk <= weekRange.max; wk++) {
    result.push({ week: `W${wk}`, wkNum: wk, dozNet: m.get(wk) ?? 0 });
  }
  return result;
}, [rows, weekRange]);

  const totalDoz   = useMemo(() => rows.reduce((s, r) => s + (r.dozNet ?? 0), 0), [rows]);
  const weeklyChart = useMemo(() => weeklyData.map(w => ({ ...w, pct: totalDoz > 0 ? (w.dozNet / totalDoz) * 100 : 0 })), [weeklyData, totalDoz]);

  const pieOutlet = useMemo(() => {
    const m = new Map<string, number>();
    rows.forEach(r => { const k = r.outletType || 'Unknown'; m.set(k, (m.get(k) || 0) + (r.dozNet || 0)); });
    return Array.from(m.entries()).map(([name, value]) => ({ name, value, pct: totalDoz > 0 ? (value / totalDoz) * 100 : 0 }));
  }, [rows, totalDoz]);

  const pieCategory = useMemo(() => {
    const m = new Map<string, number>();
    rows.forEach(r => { const k = r.category || 'Unknown'; m.set(k, (m.get(k) || 0) + (r.dozNet || 0)); });
    return Array.from(m.entries()).map(([name, value]) => ({ name, value, pct: totalDoz > 0 ? (value / totalDoz) * 100 : 0 }));
  }, [rows, totalDoz]);

  // ─── makeBarDist umum (produk, kota, kecamatan) ───────────────────────────
  const makeBarDist = useCallback((keyFn: (r: OutletSalesData) => string, xKey: string) => {
    const outer = new Map<string, Map<string, number>>();
    rows.forEach(r => {
      const k  = keyFn(r) || 'Unknown';
      const ot = r.outletType || 'Unknown';
      if (!outer.has(k)) outer.set(k, new Map());
      const inner = outer.get(k)!;
      inner.set(ot, (inner.get(ot) || 0) + (r.dozNet || 0));
    });
    return Array.from(outer.entries())
      .map(([key, inner]) => {
        const row: Record<string, string | number> = { [xKey]: key };
        let total = 0;
        inner.forEach((v, ot) => { row[ot] = v; total += v; });
        row._total = total;
        return row;
      })
      .sort((a, b) => (b._total as number) - (a._total as number))
      .slice(0, 10);
  }, [rows]);

  // ─── barCustomer: aggregasi per customer unik (nama + customer_no) ─────────
  const barCustomer = useMemo(() => {
    const outer = new Map<string, { otMap: Map<string, number>; customerId: string }>();

    rows.forEach(r => {
      const id   = r.customer_no ?? '';
      const name = r.customer?.trim() || 'Unknown';
      // Key unik: gabung ID + nama
      const uniqueKey = id ? `${id}||${name}` : `||${name}`;
      const ot = r.outletType || 'Unknown';

      if (!outer.has(uniqueKey)) outer.set(uniqueKey, { otMap: new Map(), customerId: id });
      const entry = outer.get(uniqueKey)!;
      entry.otMap.set(ot, (entry.otMap.get(ot) || 0) + (r.dozNet || 0));
    });

    return Array.from(outer.entries())
      .map(([key, { otMap, customerId }]) => {
        const separatorIdx = key.indexOf('||');
        const name = key.slice(separatorIdx + 2);
        const row: Record<string, string | number> = {
          customer:    name,
          _customerId: customerId,
        };
        let total = 0;
        otMap.forEach((v, ot) => { row[ot] = v; total += v; });
        row._total = total;
        return row;
      })
      .sort((a, b) => (b._total as number) - (a._total as number))
      .slice(0, 10);
  }, [rows]);

  // ─── customerIdMap: nama → customer_no untuk tooltip lookup ───────────────
  // Key = customer name (nilai di XAxis), value = customer_no
  const customerIdMap = useMemo(() => {
    const m = new Map<string, string>();
    barCustomer.forEach(d => {
      m.set(String(d.customer), String(d._customerId ?? ''));
    });
    return m;
  }, [barCustomer]);

  const barProduct  = useMemo(() => makeBarDist(r => r.product  || 'Unknown', 'product'),  [makeBarDist]);
  const barCity     = useMemo(() => makeBarDist(r => r.city     || 'Unknown', 'city'),     [makeBarDist]);
  const barDistrict = useMemo(() => makeBarDist(r => r.district || 'Unknown', 'district'), [makeBarDist]);

  const metrics = useMemo(() => {
    const totalWeeksInRange = weeklyData.length;
    const avg   = totalWeeksInRange > 0 ? totalDoz / totalWeeksInRange : 0;
    const best  = weeklyData.length > 0 ? weeklyData.reduce((m, c) => c.dozNet > m.dozNet ? c : m, weeklyData[0]) : { dozNet: 0, week: '—', wkNum: 0 };
    const withData = weeklyData.filter(w => w.dozNet > 0);
    const worst = withData.length > 0 ? withData.reduce((m, c) => c.dozNet < m.dozNet ? c : m, withData[0]) : { dozNet: 0, week: '—', wkNum: 0 };
    const yoyTrend = otherTotal != null && otherTotal > 0 ? ((totalDoz - otherTotal) / otherTotal) * 100 : undefined;
    return { weeks: totalWeeksInRange, avg, best, worst, yoyTrend };
  }, [weeklyData, totalDoz, otherTotal]);

  const sortedTable = useMemo(() => {
    const arr = [...weeklyChart];
    if (!sortState.dir) return arr;
    return arr.sort((a, b) => {
      let va: any, vb: any;
      if (sortState.key === 'week')        { va = a.wkNum;  vb = b.wkNum;  }
      else if (sortState.key === 'dozNet') { va = a.dozNet; vb = b.dozNet; }
      else if (sortState.key === 'pct')    { va = a.pct;    vb = b.pct;    }
      else return 0;
      return sortState.dir === 'asc' ? va - vb : vb - va;
    });
  }, [weeklyChart, sortState]);

  const chartH   = isMobile ? 180 : compact ? 200 : 240;
  const pieH     = isMobile ? 160 : compact ? 175 : 210;
  const barDistH = isMobile ? 220 : compact ? 250 : 290;
  const axisFs   = isMobile || compact ? 9 : 10;
  const avgLine  = metrics.avg;

  // ─── Pie tooltip ──────────────────────────────────────────────────────────
  const PieTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const p = payload[0];
    const totalAll = (p.payload as any)._all ?? 0;
    const pctVal   = totalAll > 0 ? ((p.value / totalAll) * 100).toFixed(1) : '—';
    return (
      <div style={{ background: t.tooltipBg, border: `1px solid ${t.tooltipBorder}`, borderRadius: 10, padding: '10px 14px', fontFamily: 'IBM Plex Mono, monospace', minWidth: 160, boxShadow: '0 8px 24px rgba(0,0,0,0.25)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 7 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.payload.fill ?? p.fill, flexShrink: 0 }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: t.tooltipText }}>{p.name}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, fontSize: 11 }}>
          <span style={{ color: t.textMuted }}>DOZ Net</span>
          <span style={{ fontWeight: 700, color: t.tooltipText }}>{Number(p.value).toLocaleString('id-ID')}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, fontSize: 11, marginTop: 3 }}>
          <span style={{ color: t.textMuted }}>Kontribusi</span>
          <span style={{ fontWeight: 700, color: t.tooltipText }}>{pctVal}%</span>
        </div>
      </div>
    );
  };

  const withTotal = (data: { name: string; value: number; pct: number }[]) => {
    const total = data.reduce((s, d) => s + d.value, 0);
    return data.map((d, i) => ({ ...d, fill: piePalette[i % piePalette.length], _all: total }));
  };

  const renderPie = (rawData: { name: string; value: number; pct: number }[], expandedMode = false) => {
    const data = withTotal(rawData);
    return (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} cx="50%" cy={expandedMode ? '45%' : '43%'} outerRadius={expandedMode ? '55%' : '52%'} innerRadius={expandedMode ? '30%' : '28%'} dataKey="value" labelLine={false}
            label={({ cx: lx, cy: ly, midAngle, innerRadius: ir, outerRadius: or, percent }: any) => {
              if (!percent || percent < 0.05) return null;
              const r = ir + (or - ir) * 1.65;
              const x = lx + r * Math.cos(-midAngle * Math.PI / 180);
              const y = ly + r * Math.sin(-midAngle * Math.PI / 180);
              return <text x={x} y={y} fill={t.textSub} textAnchor="middle" dominantBaseline="central" fontSize={isMobile || (compact && !expandedMode) ? 8 : 10} fontFamily="IBM Plex Mono, monospace" fontWeight={600}>{(percent * 100).toFixed(0)}%</text>;
            }}>
            {data.map((entry, i) => <Cell key={i} fill={entry.fill} stroke="transparent" />)}
          </Pie>
          <Tooltip content={<PieTooltip />} />
          <Legend iconSize={7} iconType="circle" wrapperStyle={{ fontSize: isMobile || (compact && !expandedMode) ? 9 : 10, fontFamily: 'IBM Plex Mono, monospace', color: t.textSub }} />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  // ─── renderBar — untuk produk, kota, kecamatan ────────────────────────────
  const renderBar = (data: Record<string, string | number>[], xKey: string, prefix: string, modalMode = false) => {
    const axisF = modalMode ? 11 : axisFs;
    const mb    = isMobile || compact ? (modalMode ? 80 : 60) : (modalMode ? 90 : 70);
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: mb }}>
          <CartesianGrid strokeDasharray="3 3" stroke={t.gridStroke} vertical={false} />
          <XAxis dataKey={xKey} angle={-35} textAnchor="end" height={mb} tick={{ fontSize: axisF, fill: t.textMuted, fontFamily: 'IBM Plex Mono, monospace' }} interval={0} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: axisF, fill: t.textMuted, fontFamily: 'IBM Plex Mono, monospace' }} width={isMobile || compact ? 32 : 40} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
          <Tooltip content={<ChartTooltip theme={theme} prefix={prefix} />} cursor={{ fill: t.divider, radius: 4 }} />
          <Legend wrapperStyle={{ fontSize: axisF, fontFamily: 'IBM Plex Mono, monospace', color: t.textSub, paddingTop: 4 }} iconType="circle" iconSize={6} />
          {outletTypes.map((ot, i) => <Bar key={ot} dataKey={ot} name={ot} fill={palette[i % palette.length]} radius={[3, 3, 0, 0]} stackId="a" />)}
        </BarChart>
      </ResponsiveContainer>
    );
  };

  // ─── renderBarCustomer — custom tick + pass customerIdMap ke tooltip ───────
  const renderBarCustomer = (data: Record<string, string | number>[], modalMode = false) => {
    const axisF    = modalMode ? 11 : axisFs;
    const maxChars = modalMode ? 22 : 14;
    const mb       = isMobile || compact ? (modalMode ? 110 : 84) : (modalMode ? 120 : 96);

    // Custom tick: baris 1 = nama, baris 2 = customer_no
    const CustomerTick = ({ x, y, payload }: any) => {
      const name       = String(payload.value);
      const customerId = customerIdMap.get(name) ?? '';
      const displayName = name.length > maxChars ? name.slice(0, maxChars) + '…' : name;
      return (
        <g transform={`translate(${x},${y})`}>
          <title>{`${name}${customerId ? ` (#${customerId})` : ''}`}</title>
          <text x={0} y={0} dy={4} textAnchor="end" transform="rotate(-35)"
            fontSize={axisF} fontFamily="IBM Plex Mono, monospace" fill={t.textMuted}>
            {displayName}
          </text>
          {customerId && (
            <text x={0} y={0} dy={axisF + 9} textAnchor="end" transform="rotate(-35)"
              fontSize={Math.max(axisF - 1, 8)} fontFamily="IBM Plex Mono, monospace" fill={t.textFaint}>
              #{customerId}
            </text>
          )}
        </g>
      );
    };

    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: mb }}>
          <CartesianGrid strokeDasharray="3 3" stroke={t.gridStroke} vertical={false} />
          <XAxis
            dataKey="customer"
            height={mb}
            tick={<CustomerTick />}
            interval={0}
            axisLine={false}
            tickLine={false}
          />
          <YAxis tick={{ fontSize: axisF, fill: t.textMuted, fontFamily: 'IBM Plex Mono, monospace' }} width={isMobile || compact ? 32 : 40} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
          {/* ↓ Pass customerIdMap agar tooltip bisa lookup customer_no dari nama */}
          <Tooltip
            content={<ChartTooltip theme={theme} prefix="Customer: " customerMap={customerIdMap} />}
            cursor={{ fill: t.divider, radius: 4 }}
          />
          <Legend wrapperStyle={{ fontSize: axisF, fontFamily: 'IBM Plex Mono, monospace', color: t.textSub, paddingTop: 4 }} iconType="circle" iconSize={6} />
          {outletTypes.map((ot, i) => <Bar key={ot} dataKey={ot} name={ot} fill={palette[i % palette.length]} radius={[3, 3, 0, 0]} stackId="a" />)}
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const MODAL_H = 'calc(80vh - 120px)';
  const wrapModal = (el: React.ReactNode) => (
    <div style={{ height: MODAL_H, background: t.chartAreaBg, border: `1px solid ${t.chartAreaBorder}`, borderRadius: 8, padding: '8px 4px 4px' }}>{el}</div>
  );

  const renderChartContent = (chartKey: string, modalMode = false) => {
    const axisF = modalMode ? 11 : axisFs;

    const weeklyEl = (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={weeklyChart} margin={{ top: 8, right: 16, left: 0, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={t.gridStroke} vertical={false} />
          <XAxis dataKey="week" angle={-35} textAnchor="end" height={60} tick={{ fontSize: axisF, fill: t.textMuted, fontFamily: 'IBM Plex Mono, monospace' }} interval={0} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: axisF, fill: t.textMuted, fontFamily: 'IBM Plex Mono, monospace' }} width={44} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
          <Tooltip content={<ChartTooltip theme={theme} />} cursor={{ fill: t.divider, radius: 4 }} />
          <ReferenceLine y={avgLine} stroke={yc.accent} strokeDasharray="4 3" strokeOpacity={0.6} strokeWidth={1.5} />
          <Bar dataKey="dozNet" name="DOZ Net" radius={[3, 3, 0, 0]}>
            {weeklyChart.map((entry, index) => <Cell key={index} fill={entry.dozNet >= avgLine ? yc.accent : `${yc.accent}80`} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );

    if (!modalMode) return null;
    if (chartKey === 'weekly')   return wrapModal(weeklyEl);
    if (chartKey === 'category') return wrapModal(renderPie(pieCategory, true));
    if (chartKey === 'outlet')   return wrapModal(renderPie(pieOutlet,   true));
    if (chartKey === 'product')  return wrapModal(renderBar(barProduct,  'product',  'Produk: ', true));
    if (chartKey === 'city')     return wrapModal(renderBar(barCity,     'city',     'Kota: ',   true));
    if (chartKey === 'district') return wrapModal(renderBar(barDistrict, 'district', 'Kec: ',    true));
    if (chartKey === 'customer') return wrapModal(renderBarCustomer(barCustomer, true));
    return null;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* Metric cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: isMobile ? 8 : 10 }}>
        <MetricCard label="Total DOZ Net" value={totalDoz.toLocaleString('id-ID')} sub={`${metrics.weeks} minggu (W${weekRange.min}–W${weekRange.max})`}
          cardKey={isA ? 'card1' : 'card2'} icon={Store} theme={theme} compact={isMobile || compact}
          trend={metrics.yoyTrend !== undefined ? { value: metrics.yoyTrend, label: 'YoY' } : undefined} />
        <MetricCard label="Rata-rata/Minggu" value={Math.round(metrics.avg).toLocaleString('id-ID')} sub={`DOZ ÷ ${metrics.weeks} minggu`}
          cardKey={isA ? 'card1' : 'card2'} icon={TrendingUp} theme={theme} compact={isMobile || compact} />
        <MetricCard label="Minggu Terbaik" value={metrics.best.week} sub={`${metrics.best.dozNet.toLocaleString('id-ID')} DOZ`}
          cardKey="card3" icon={ArrowUp} theme={theme} compact={isMobile || compact} />
        <MetricCard label="Minggu Terendah" value={metrics.worst.week}
          sub={metrics.worst.dozNet === 0 && metrics.worst.week === '—' ? 'N/A' : `${metrics.worst.dozNet.toLocaleString('id-ID')} DOZ`}
          cardKey="card4" icon={ArrowDown} theme={theme} compact={isMobile || compact} />
      </div>

      {/* Weekly bar */}
      <ChartBox title="Kontribusi Per Minggu" chartKey="weekly" height={chartH} onExpand={ch => setExpandedChart(ch)} year={year} theme={theme} compact={isMobile || compact} badge={`avg ${Math.round(avgLine).toLocaleString('id-ID')}`}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={weeklyChart} margin={{ top: 8, right: 8, left: -8, bottom: isMobile || compact ? 44 : 55 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={t.gridStroke} vertical={false} />
            <XAxis dataKey="week" angle={-35} textAnchor="end" height={isMobile || compact ? 44 : 55} tick={{ fontSize: axisFs, fill: t.textMuted, fontFamily: 'IBM Plex Mono, monospace' }} interval={isMobile ? 'preserveStartEnd' : 0} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: axisFs, fill: t.textMuted, fontFamily: 'IBM Plex Mono, monospace' }} width={isMobile || compact ? 32 : 40} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
            <Tooltip content={<ChartTooltip theme={theme} />} cursor={{ fill: t.divider, radius: 4 }} />
            <ReferenceLine y={avgLine} stroke={yc.accent} strokeDasharray="4 3" strokeOpacity={0.6} strokeWidth={1.5} />
            <Bar dataKey="dozNet" name="DOZ Net" radius={[3, 3, 0, 0]}>
              {weeklyChart.map((entry, index) => <Cell key={index} fill={entry.dozNet >= avgLine ? yc.accent : `${yc.accent}80`} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartBox>

      {/* Pies */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10 }}>
        <ChartBox title="per Kategori Produk" chartKey="category" height={pieH} onExpand={ch => setExpandedChart(ch)} year={year} theme={theme} compact={isMobile || compact}>{renderPie(pieCategory)}</ChartBox>
        <ChartBox title="per Tipe Outlet"     chartKey="outlet"   height={pieH} onExpand={ch => setExpandedChart(ch)} year={year} theme={theme} compact={isMobile || compact}>{renderPie(pieOutlet)}</ChartBox>
      </div>

      {/* Bar distributions */}
      <ChartBox title="per Produk (Top 10)"     chartKey="product"  height={barDistH} onExpand={ch => setExpandedChart(ch)} year={year} theme={theme} compact={isMobile || compact}>{renderBar(barProduct,  'product',  'Produk: ')}</ChartBox>
      <ChartBox title="per Kota/Kab. (Top 10)"  chartKey="city"     height={barDistH} onExpand={ch => setExpandedChart(ch)} year={year} theme={theme} compact={isMobile || compact}>{renderBar(barCity,     'city',     'Kota: ')}</ChartBox>
      <ChartBox title="per Kecamatan (Top 10)"  chartKey="district" height={barDistH} onExpand={ch => setExpandedChart(ch)} year={year} theme={theme} compact={isMobile || compact}>{renderBar(barDistrict, 'district', 'Kec: ')}</ChartBox>

      {/* Customer */}
      <ChartBox title="per Customer (Top 10)" chartKey="customer" height={barDistH + 30} onExpand={ch => setExpandedChart(ch)} year={year} theme={theme} compact={isMobile || compact}>
        {renderBarCustomer(barCustomer)}
      </ChartBox>

      {/* Detail table */}
      <div style={{ background: t.cardBg, border: `1px solid ${t.borderCard}`, borderRadius: 10, overflow: 'hidden', boxShadow: t.shadow }}>
        <div style={{ padding: isMobile || compact ? '8px 12px' : '11px 16px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ fontSize: isMobile || compact ? 11 : 12, fontWeight: 700, fontFamily: 'IBM Plex Sans, sans-serif', color: t.text }}>Detail Mingguan</span>
          <span style={{ fontSize: 10, color: t.textMuted, fontFamily: 'IBM Plex Mono, monospace' }}>{weeklyChart.length} minggu · klik header untuk sort</span>
        </div>
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ minWidth: '100%', borderCollapse: 'collapse', fontSize: isMobile || compact ? 11 : 12, fontFamily: 'IBM Plex Mono, monospace' }}>
            <thead>
              <tr style={{ background: t.tableHeadBg }}>
                <SortTh label="Minggu"  sortKey="week"   sortState={sortState} onSort={handleSort} theme={theme} />
                <SortTh label="DOZ Net" sortKey="dozNet" sortState={sortState} onSort={handleSort} theme={theme} align="right" />
                <SortTh label="%"       sortKey="pct"    sortState={sortState} onSort={handleSort} theme={theme} align="right" />
                <th style={{ padding: '8px 14px', textAlign: 'left', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: t.tableHeadText, background: t.tableHeadBg, borderBottom: `1px solid ${t.border}`, fontFamily: 'IBM Plex Mono, monospace' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {sortedTable.length === 0 ? (
                <tr><td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: t.textMuted, background: t.cardBg }}>Tidak ada data</td></tr>
              ) : sortedTable.map((w, idx) => {
                const aboveAvg = w.dozNet >= avgLine;
                const st = w.dozNet === 0
                  ? { label: 'Kosong', ...TK[theme].neuGrowth }
                  : w.pct >= 5
                  ? { label: 'Tinggi',  ...TK[theme].green  }
                  : w.pct >= 2
                  ? { label: 'Sedang',  ...TK[theme].orange }
                  : { label: 'Rendah',  ...TK[theme].red    };
                const maxDoz = Math.max(...weeklyChart.map(w => w.dozNet), 1);
                return (
                  <tr key={w.week} style={{ background: idx % 2 === 1 ? t.tableAlt : t.cardBg, transition: 'background 0.1s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = t.tableHover}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = idx % 2 === 1 ? t.tableAlt : t.cardBg}>
                    <td style={{ padding: isMobile || compact ? '7px 10px' : '8px 14px', color: t.text, fontWeight: 600 }}>{w.week}</td>
                    <td style={{ padding: isMobile || compact ? '7px 10px' : '8px 14px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                        <div style={{ width: 40, height: 4, background: t.border, borderRadius: 2, flexShrink: 0, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${(w.dozNet / maxDoz) * 100}%`, background: aboveAvg ? yc.accent : `${yc.accent}60`, borderRadius: 2 }} />
                        </div>
                        <span style={{ color: w.dozNet === 0 ? t.textMuted : t.textSub }}>{w.dozNet.toLocaleString('id-ID')}</span>
                      </div>
                    </td>
                    <td style={{ padding: isMobile || compact ? '7px 10px' : '8px 14px', color: t.textMuted, textAlign: 'right' }}>{w.dozNet === 0 ? '—' : `${w.pct.toFixed(2)}%`}</td>
                    <td style={{ padding: isMobile || compact ? '7px 10px' : '8px 14px' }}>
                      <span style={{ display: 'inline-flex', padding: '2px 8px', borderRadius: 20, fontSize: 9, fontWeight: 700, background: st.bg, color: st.text, border: `1px solid ${st.border}` }}>{st.label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {sortedTable.length > 0 && (
              <tfoot>
                <tr style={{ background: t.tableHeadBg, borderTop: `1px solid ${t.border}` }}>
                  <td style={{ padding: '8px 14px', fontSize: 10, fontWeight: 700, color: t.textSub }}>Total</td>
                  <td style={{ padding: '8px 14px', textAlign: 'right', fontSize: 11, fontWeight: 800, color: t.text }}>{totalDoz.toLocaleString('id-ID')}</td>
                  <td style={{ padding: '8px 14px', textAlign: 'right', fontSize: 10, color: t.textMuted }}>100%</td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Internal modal */}
      {expandedChart && (
        <ExpandModal
          title={`Tahun ${year} — ${
            expandedChart === 'weekly'   ? 'Kontribusi Per Minggu'  :
            expandedChart === 'category' ? 'per Kategori Produk'    :
            expandedChart === 'outlet'   ? 'per Tipe Outlet'        :
            expandedChart === 'product'  ? 'per Produk (Top 10)'    :
            expandedChart === 'city'     ? 'per Kota/Kab. (Top 10)' :
            expandedChart === 'district' ? 'per Kecamatan (Top 10)' :
            expandedChart === 'customer' ? 'per Customer (Top 10)'  : ''
          }`}
          onClose={() => setExpandedChart(null)}
          theme={theme}
        >
          {renderChartContent(expandedChart, true)}
        </ExpandModal>
      )}
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface OutletContributionSectionProps {
  data?: { outletData?: OutletSalesData[] };
  theme?: Theme;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function OutletContributionSection({ data, theme: themeProp }: OutletContributionSectionProps) {
  const theme: Theme = themeProp ?? 'light';
  const t = TK[theme];
  const { isMobile, isTablet } = useBreakpoint();

  const [selOutlet,      setSelOutlet]      = useState('all');
  const [selCat,         setSelCat]         = useState('all');
  const [selProduct,     setSelProduct]     = useState('all');
  const [selCity,        setSelCity]        = useState('all');
  const [selDistrict,    setSelDistrict]    = useState('all');
  const [selCustomer,    setSelCustomer]    = useState('all');       // nama customer (lama)
  const [selCustomerNo,  setSelCustomerNo]  = useState('');          // customer_no (baru, '' = semua)
  const [selCustomerName, setSelCustomerName] = useState('');        // nama untuk chip display
  const [selSalesman,    setSelSalesman]    = useState('all');        // filter salesman
  const [globalSearch,   setGlobalSearch]  = useState('');           // global search box
  const [filterOpen,     setFilterOpen]    = useState(true);
  const [activeTab,      setActiveTab]     = useState<'A'|'B'>('A');

  const raw = data?.outletData ?? [];

  const availableYears = useMemo(() => {
    const s = new Set<number>();
    raw.forEach(r => { if (r.year) s.add(r.year); });
    return Array.from(s).sort();
  }, [raw]);

  const yearA = availableYears[0] ?? null;
  const yearB = availableYears[1] ?? null;

  const optOutlet   = useMemo(() => { const s = new Set<string>(); raw.forEach(r => { if (r.outletType) s.add(r.outletType); }); return Array.from(s).sort(); }, [raw]);
  const optCat      = useMemo(() => { const s = new Set<string>(); raw.forEach(r => { if (r.category) s.add(r.category); }); return Array.from(s).sort(); }, [raw]);
  const optProduct  = useMemo(() => { const s = new Set<string>(); raw.filter(r => selCat === 'all' || r.category === selCat).forEach(r => { if (r.product) s.add(r.product); }); return Array.from(s).sort(); }, [raw, selCat]);
  const optCity     = useMemo(() => { const s = new Set<string>(); raw.forEach(r => { if (r.city && r.city !== 'Unknown') s.add(r.city); }); return Array.from(s).sort(); }, [raw]);
  const optDistrict = useMemo(() => { const s = new Set<string>(); raw.filter(r => selCity === 'all' || r.city === selCity).forEach(r => { if (r.district && r.district !== 'Unknown') s.add(r.district); }); return Array.from(s).sort(); }, [raw, selCity]);
  const optSalesman = useMemo(() => { const s = new Set<string>(); raw.forEach(r => { if (r.salesman && r.salesman !== 'Unknown') s.add(r.salesman); }); return Array.from(s).sort(); }, [raw]);

  // ─── optCustomer: list unik { no, name } untuk SearchableSelect ──────────
  const optCustomer = useMemo(() => {
    const seen  = new Map<string, string>(); // no → name
    const noIds: string[] = [];              // nama tanpa ID (fallback)
    raw.filter(r => selCity === 'all' || r.city === selCity).forEach(r => {
      const name = r.customer?.trim();
      if (!name || name === 'Unknown') return;
      const no = r.customer_no ?? '';
      if (no) {
        if (!seen.has(no)) seen.set(no, name);
      } else {
        if (!noIds.includes(name)) noIds.push(name);
      }
    });
    const result: { no: string; name: string }[] = [];
    seen.forEach((name, no) => result.push({ no, name }));
    noIds.forEach(name => result.push({ no: '', name }));
    return result.sort((a, b) => a.name.localeCompare(b.name));
  }, [raw, selCity]);

  // ─── filterFn: terapkan semua filter termasuk customer_no & global search ─
  const filterFn = useCallback(
    (r: OutletSalesData) => {
      // Filter dropdown lama
      if (selOutlet   !== 'all' && r.outletType !== selOutlet)   return false;
      if (selCat      !== 'all' && r.category   !== selCat)      return false;
      if (selProduct  !== 'all' && r.product    !== selProduct)  return false;
      if (selCity     !== 'all' && r.city       !== selCity)     return false;
      if (selDistrict !== 'all' && r.district   !== selDistrict) return false;
      if (selSalesman !== 'all' && r.salesman   !== selSalesman) return false;

      // Filter customer: pakai customer_no jika ada, fallback ke nama
      if (selCustomerNo) {
        if (selCustomerNo === '__no-id__') {
          // filter by nama (untuk customer tanpa ID)
          if (r.customer !== selCustomerName) return false;
        } else {
          if ((r.customer_no ?? '') !== selCustomerNo) return false;
        }
      }

      // Global search: cocokkan ke customer name, customer_no, produk, kota
      if (globalSearch) {
        const q = globalSearch.toLowerCase();
        const haystack = [
          r.customer, r.customer_no, r.product, r.city, r.district, r.salesman
        ].filter(Boolean).join(' ').toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    },
    [selOutlet, selCat, selProduct, selCity, selDistrict, selSalesman, selCustomerNo, selCustomerName, globalSearch],
  );

  const dataA  = useMemo(() => yearA != null ? raw.filter(r => r.year === yearA && filterFn(r)) : [], [raw, yearA, filterFn]);
  const dataB  = useMemo(() => yearB != null ? raw.filter(r => r.year === yearB && filterFn(r)) : [], [raw, yearB, filterFn]);
  const totalA = useMemo(() => dataA.reduce((s, r) => s + (r.dozNet || 0), 0), [dataA]);
  const totalB = useMemo(() => dataB.reduce((s, r) => s + (r.dozNet || 0), 0), [dataB]);

  const sharedWeekRange = useMemo(() => {
  const allWeeks: number[] = [];
  
  // Mengumpulkan data secara aman
  dataA.forEach(r => { if (r.week != null) allWeeks.push(r.week); });
  dataB.forEach(r => { if (r.week != null) allWeeks.push(r.week); });

  if (allWeeks.length === 0) return { min: 1, max: 52 };

  // Mencari min dan max menggunakan reduce (Hanya satu properti min dan max)
  return {
    min: allWeeks.reduce((prev, curr) => (curr < prev ? curr : prev), allWeeks[0]),
    max: allWeeks.reduce((prev, curr) => (curr > prev ? curr : prev), allWeeks[0])
  };
}, [dataA, dataB]);

  const hasDropdownFilter = [selOutlet, selCat, selProduct, selCity, selDistrict, selSalesman].some(v => v !== 'all') || !!selCustomerNo;
  const hasFilter = hasDropdownFilter || !!globalSearch;
  const activeFilterCount = [selOutlet, selCat, selProduct, selCity, selDistrict, selSalesman].filter(v => v !== 'all').length
    + (selCustomerNo ? 1 : 0)
    + (globalSearch ? 1 : 0);

  const resetAll = () => {
    setSelOutlet('all'); setSelCat('all'); setSelProduct('all');
    setSelCity('all'); setSelDistrict('all'); setSelSalesman('all');
    setSelCustomerNo(''); setSelCustomerName(''); setSelCustomer('all');
    setGlobalSearch('');
  };

  if (!raw.length) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', textAlign: 'center', gap: 14 }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: t.inputBg, border: `1px solid ${t.borderCard}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Store size={24} color={t.textMuted} />
        </div>
        <div style={{ fontSize: 14, color: t.textMuted, fontFamily: 'IBM Plex Sans, sans-serif' }}>Tidak ada data outlet tersedia</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 12 : 18, fontFamily: 'IBM Plex Sans, sans-serif' }}>
      <style>{`::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:${t.scrollbar};border-radius:2px}::-webkit-scrollbar-thumb:hover{background:${t.textMuted}}`}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <p style={{ margin: 0, fontSize: 10, color: t.textMuted, fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          DOZ Net · {(dataA.length + dataB.length).toLocaleString()} records
          {hasFilter && ` · ${activeFilterCount} filter aktif`}
          {` · W${sharedWeekRange.min}–W${sharedWeekRange.max}`}
        </p>
        <div style={{ display: 'flex', gap: 6 }}>
          {yearA != null && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, background: TK[theme].yearA.bg, border: `1px solid ${TK[theme].yearA.border}` }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: TK[theme].yearA.accent }} />
              <span style={{ fontSize: 11, fontWeight: 700, fontFamily: 'IBM Plex Mono, monospace', color: TK[theme].yearA.label }}>{yearA}</span>
            </div>
          )}
          {yearB != null && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, background: TK[theme].yearB.bg, border: `1px solid ${TK[theme].yearB.border}` }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: TK[theme].yearB.accent }} />
              <span style={{ fontSize: 11, fontWeight: 700, fontFamily: 'IBM Plex Mono, monospace', color: TK[theme].yearB.label }}>{yearB}</span>
            </div>
          )}
        </div>
      </div>

      {/* YoY Summary */}
      {yearA != null && yearB != null && <YoYSummaryBar dataA={dataA} dataB={dataB} yearA={yearA} yearB={yearB} theme={theme} />}

      {/* Filter */}
      <div style={{ background: t.cardBg, border: `1px solid ${hasFilter ? t.blue.border : t.borderCard}`, borderRadius: isMobile ? 10 : 12, padding: isMobile ? '10px 12px' : '14px 16px', boxShadow: t.shadow, transition: 'border-color 0.2s' }}>

        {/* Header row: toggle + global search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: filterOpen ? 12 : 8 }}>
          {/* Toggle label */}
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', flex: 1 }}
            onClick={() => setFilterOpen(p => !p)}
          >
            <SlidersHorizontal size={12} color={hasFilter ? t.blue.text : t.textMuted} />
            <span style={{ fontSize: isMobile ? 10 : 11, fontWeight: 700, color: hasFilter ? t.blue.text : t.textMuted, fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Filter
            </span>
            {hasFilter && (
              <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 7px', borderRadius: 10, background: t.blue.bg, color: t.blue.text, border: `1px solid ${t.blue.border}`, fontFamily: 'IBM Plex Mono, monospace' }}>
                {activeFilterCount} aktif
              </span>
            )}
            {hasFilter && !filterOpen && (
              <button
                onClick={e => { e.stopPropagation(); resetAll(); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.red.text, fontSize: 10, fontFamily: 'IBM Plex Mono, monospace', fontWeight: 600, padding: '1px 6px', display: 'flex', alignItems: 'center', gap: 3 }}
              >
                <RefreshCw size={9} /> Reset
              </button>
            )}
            <span style={{ color: t.textMuted, marginLeft: 'auto' }}>{filterOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</span>
          </div>
        </div>

        {/* Global search — selalu tampil */}
        <SearchBox
          value={globalSearch}
          onChange={setGlobalSearch}
          theme={theme}
          placeholder="Cari customer, produk, kota, salesman..."
        />

        {/* Dropdown filters — hanya kalau filterOpen */}
        {filterOpen && (
          <>
            <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fill, minmax(148px, 1fr))', gap: isMobile ? 8 : 10 }}>
              <FilterSelect label="Tipe Outlet" value={selOutlet}   onChange={setSelOutlet}   options={optOutlet}   accentKey="blue"   theme={theme} />
              <FilterSelect label="Kategori"    value={selCat}      onChange={setSelCat}      options={optCat}      accentKey="green"  theme={theme} />
              <FilterSelect label="Produk"      value={selProduct}  onChange={setSelProduct}  options={optProduct}  accentKey="purple" theme={theme} />
              <FilterSelect label="Kota/Kab."   value={selCity}     onChange={setSelCity}     options={optCity}     accentKey="orange" theme={theme} />
              <FilterSelect label="Kecamatan"   value={selDistrict} onChange={setSelDistrict} options={optDistrict} accentKey="pink"   theme={theme} />
              <FilterSelect label="Salesman"    value={selSalesman} onChange={setSelSalesman} options={optSalesman} accentKey="orange" theme={theme} />
              {/* ↓ SearchableSelect khusus customer (bisa search nama/ID) */}
              <SearchableSelect
                label="Customer"
                value={selCustomerNo}
                onChange={(no, name) => {
                  setSelCustomerNo(no);
                  setSelCustomerName(name);
                }}
                options={optCustomer}
                accentKey="indigo"
                theme={theme}
                placeholder="Semua Customer"
              />
            </div>

            {/* Active filter chips */}
            {hasDropdownFilter && (
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${t.border}`, display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center' }}>
                <span style={{ fontSize: 10, color: t.textMuted, fontFamily: 'IBM Plex Mono, monospace', marginRight: 3 }}>Aktif:</span>
                {selOutlet   !== 'all' && <FilterChip label={selOutlet}   accentKey="blue"   onRemove={() => setSelOutlet('all')}   theme={theme} />}
                {selCat      !== 'all' && <FilterChip label={selCat}      accentKey="green"  onRemove={() => setSelCat('all')}      theme={theme} />}
                {selProduct  !== 'all' && <FilterChip label={selProduct}  accentKey="purple" onRemove={() => setSelProduct('all')}  theme={theme} />}
                {selCity     !== 'all' && <FilterChip label={selCity}     accentKey="orange" onRemove={() => setSelCity('all')}     theme={theme} />}
                {selDistrict !== 'all' && <FilterChip label={selDistrict} accentKey="pink"   onRemove={() => setSelDistrict('all')} theme={theme} />}
                {selSalesman !== 'all' && <FilterChip label={selSalesman} accentKey="orange" onRemove={() => setSelSalesman('all')} theme={theme} />}
                {selCustomerNo && (
                  <FilterChip
                    label={selCustomerName ? `${selCustomerName} · #${selCustomerNo}` : `#${selCustomerNo}`}
                    accentKey="indigo"
                    onRemove={() => { setSelCustomerNo(''); setSelCustomerName(''); }}
                    theme={theme}
                  />
                )}
                <button onClick={resetAll} style={{ marginLeft: 'auto', fontSize: 10, fontFamily: 'IBM Plex Mono, monospace', background: 'none', border: 'none', cursor: 'pointer', color: t.red.text, fontWeight: 600, padding: '2px 6px', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <RefreshCw size={9} /> Reset Semua
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Year panels */}
      {availableYears.length < 2 ? (
        <YearPanel year={yearA!} isA={true} data={dataA} theme={theme} onExpand={() => {}} otherTotal={undefined} weekRange={sharedWeekRange} />
      ) : isMobile ? (
        <div>
          <div style={{ display: 'flex', borderRadius: 10, overflow: 'hidden', border: `1px solid ${t.borderCard}`, marginBottom: 14, background: t.inputBg }}>
            {([{ tab: 'A' as const, year: yearA!, yc: TK[theme].yearA, rowData: dataA }, { tab: 'B' as const, year: yearB!, yc: TK[theme].yearB, rowData: dataB }]).map(({ tab, year, yc, rowData }) => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{ flex: 1, padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: activeTab === tab ? yc.bg : 'transparent', border: 'none', borderBottom: activeTab === tab ? `2px solid ${yc.accent}` : '2px solid transparent', cursor: 'pointer', transition: 'background 0.2s', fontFamily: 'IBM Plex Mono, monospace' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: yc.accent }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: activeTab === tab ? yc.label : t.textMuted }}>{year}</span>
                <span style={{ fontSize: 10, color: activeTab === tab ? yc.label : t.textMuted, opacity: 0.6 }}>{rowData.length.toLocaleString()}r</span>
              </button>
            ))}
          </div>
          {activeTab === 'A' && yearA != null && <YearPanel year={yearA} isA={true}  data={dataA} theme={theme} onExpand={() => {}} otherTotal={totalB} weekRange={sharedWeekRange} />}
          {activeTab === 'B' && yearB != null && <YearPanel year={yearB} isA={false} data={dataB} theme={theme} onExpand={() => {}} otherTotal={totalA} weekRange={sharedWeekRange} />}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: isTablet ? 14 : 20, alignItems: 'start' }}>
          {([
            { year: yearA!, isA: true,  rowData: dataA, yc: TK[theme].yearA, other: totalB },
            { year: yearB!, isA: false, rowData: dataB, yc: TK[theme].yearB, other: totalA },
          ] as const).map(({ year, isA, rowData, yc, other }) => (
            <div key={year}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, padding: '10px 16px', borderRadius: 10, background: yc.bg, border: `1px solid ${yc.border}`, position: 'sticky', top: 0, zIndex: 10 }}>
                <Calendar size={13} color={yc.label} />
                <span style={{ fontSize: 14, fontWeight: 700, fontFamily: 'IBM Plex Mono, monospace', color: yc.label }}>Tahun {year}</span>
                <span style={{ fontSize: 10, color: yc.label, opacity: 0.55, fontFamily: 'IBM Plex Mono, monospace', marginLeft: 'auto' }}>{rowData.length.toLocaleString()} records</span>
              </div>
              <YearPanel year={year} isA={isA} data={rowData} theme={theme} onExpand={() => {}} compact={isTablet} otherTotal={other} weekRange={sharedWeekRange} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}