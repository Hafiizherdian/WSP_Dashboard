'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Plus, Edit2, Trash2, Save, X, MapPin, CheckCircle2,
  AlertCircle, ChevronDown, ChevronRight, Package, Info, RefreshCw,
} from 'lucide-react';
import { AreaConfig } from '@/lib/areaConfig';
import { getProductCategory, defaultProductUnitMapping, ProductUnitConversion } from '@/lib/productCategories';

type Theme = 'dark' | 'light';

// ─────────────────────────────────────────────────────────────────
// Tokens
// ─────────────────────────────────────────────────────────────────
const tokens = {
  dark: {
    // Base surfaces
    pagebg: '#070810', cardbg: '#0d0f1a', sidebarbg: '#0a0c15',
    contentBg: '#080910', stickyBg: '#0d0f1a', modalBg: '#0c0e1b',
    inputBg: 'rgba(255,255,255,0.04)', optionBg: '#0c0e1b',
    // Borders
    border: 'rgba(255,255,255,0.055)', borderCard: 'rgba(255,255,255,0.07)',
    borderInput: 'rgba(255,255,255,0.09)', headerBorder: 'rgba(255,255,255,0.06)',
    // Text
    text: 'rgba(255,255,255,0.92)', textSub: 'rgba(255,255,255,0.52)',
    textMuted: 'rgba(255,255,255,0.28)', textFaint: 'rgba(255,255,255,0.14)',
    theadText: 'rgba(255,255,255,0.75)', theadBg: '#0b0d18',
    // Semantic
    shadow: 'none',
    red: { bg: 'rgba(239,68,68,0.07)', text: '#fca5a5', border: 'rgba(239,68,68,0.16)' },
    // Row states
    rowHover: 'rgba(99,102,241,0.04)', rowExpanded: 'rgba(255,255,255,0.02)',
    rowEditing: 'rgba(99,102,241,0.06)', rowSubhead: '#0b0d18',
    rowProduct: 'rgba(255,255,255,0.012)', rowSubtotal: '#0a0c18', areaRowBg: '#0d0f1a',
    areaRowHover: 'rgba(99,102,241,0.045)',
    // Quarter/Total colors — indigo family
    qBg: 'rgba(99,102,241,0.07)', qBorder: 'rgba(99,102,241,0.16)', qText: '#a5b4fc',
    qTotalBg: 'rgba(99,102,241,0.16)', qTotalText: '#c7d2fe',
    totalBg: '#312e81', totalText: '#eef2ff',
    grandBg: '#080a14', grandText: 'rgba(255,255,255,0.9)',
    grandQBg: 'rgba(99,102,241,0.13)', grandQText: '#a5b4fc', grandTotBg: '#1e1b6b',
    // Gradient header
    headerGrad: 'linear-gradient(135deg,#0b0d18 0%,#0f1120 100%)',
    // Derived unit color zones
    balBg: 'rgba(16,185,129,0.05)', balText: '#6ee7b7', balBorder: 'rgba(16,185,129,0.13)', balTotal: 'rgba(16,185,129,0.1)',
    slopBg: 'rgba(234,179,8,0.05)', slopText: '#fde047', slopBorder: 'rgba(234,179,8,0.13)', slopTotal: 'rgba(234,179,8,0.1)',
    bksBg: 'rgba(249,115,22,0.05)', bksText: '#fdba74', bksBorder: 'rgba(249,115,22,0.13)', bksTotal: 'rgba(249,115,22,0.1)',
    stickBg: 'rgba(217,70,239,0.05)', stickText: '#e879f9', stickBorder: 'rgba(217,70,239,0.15)', stickTotal: 'rgba(217,70,239,0.1)',
    // Button states
    editBg: 'rgba(99,102,241,0.08)', editText: '#a5b4fc', editBorder: 'rgba(99,102,241,0.22)',
    delBg: 'rgba(239,68,68,0.07)', delText: '#fca5a5', delBorder: 'rgba(239,68,68,0.16)',
    saveBg: '#16a34a', cancelBg: '#1f2937',
    addRowBg: 'rgba(16,185,129,0.04)', addRowBorder: 'rgba(16,185,129,0.18)',
    toastOk: '#16a34a', toastErr: '#dc2626', toastInfo: '#4338ca',
    monthBg: 'rgba(20,184,166,0.04)', monthBorder: 'rgba(20,184,166,0.13)', monthText: '#5eead4',
    weekBg: 'rgba(20,184,166,0.02)', weekBorder: 'rgba(20,184,166,0.08)',
  },
  light: {
    pagebg: '#f4f5f9', cardbg: '#ffffff', sidebarbg: '#ffffff',
    contentBg: '#f4f5f9', stickyBg: '#ffffff', modalBg: '#ffffff',
    inputBg: 'rgba(0,0,0,0.03)', optionBg: '#ffffff',
    border: 'rgba(0,0,0,0.065)', borderCard: 'rgba(0,0,0,0.075)',
    borderInput: 'rgba(0,0,0,0.1)', headerBorder: 'rgba(0,0,0,0.08)',
    text: '#0f172a', textSub: '#475569', textMuted: '#94a3b8', textFaint: '#cbd5e1',
    theadText: 'rgba(255,255,255,0.9)', theadBg: '#1e1b4b',
    shadow: '0 1px 4px rgba(0,0,0,0.05)',
    red: { bg: '#fef2f2', text: '#b91c1c', border: '#fecaca' },
    rowHover: 'rgba(99,102,241,0.025)', rowExpanded: '#f8f8ff',
    rowEditing: 'rgba(99,102,241,0.04)', rowSubhead: '#1e1b4b',
    rowProduct: '#fafafa', rowSubtotal: '#312e81', areaRowBg: '#ffffff',
    areaRowHover: 'rgba(99,102,241,0.025)',
    qBg: 'rgba(99,102,241,0.04)', qBorder: 'rgba(99,102,241,0.14)', qText: '#4338ca',
    qTotalBg: '#e0e7ff', qTotalText: '#3730a3',
    totalBg: '#4338ca', totalText: '#ffffff',
    grandBg: '#1e1b4b', grandText: '#ffffff',
    grandQBg: '#312e81', grandQText: '#c7d2fe', grandTotBg: '#3730a3',
    headerGrad: 'linear-gradient(135deg,#1e1b4b 0%,#312e81 100%)',
    balBg: '#f0fdf4', balText: '#166534', balBorder: '#bbf7d0', balTotal: '#dcfce7',
    slopBg: '#fefce8', slopText: '#854d0e', slopBorder: '#fef08a', slopTotal: '#fef9c3',
    bksBg: '#fff7ed', bksText: '#9a3412', bksBorder: '#fed7aa', bksTotal: '#ffedd5',
    stickBg: '#fdf4ff', stickText: '#86198f', stickBorder: '#f0abfc', stickTotal: '#fae8ff',
    editBg: 'rgba(99,102,241,0.07)', editText: '#4338ca', editBorder: 'rgba(99,102,241,0.22)',
    delBg: '#fef2f2', delText: '#b91c1c', delBorder: '#fecaca',
    saveBg: '#16a34a', cancelBg: '#64748b',
    addRowBg: '#f0fdf4', addRowBorder: '#bbf7d0',
    toastOk: '#16a34a', toastErr: '#dc2626', toastInfo: '#4338ca',
    monthBg: '#f0fdfa', monthBorder: '#99f6e4', monthText: '#0f766e',
    weekBg: '#f7fffe', weekBorder: '#ccfbf1',
  },
} as const;
type Tok = (typeof tokens)['dark'] | (typeof tokens)['light'];

// ─────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────
const QUARTERS   = ['Q1', 'Q2', 'Q3', 'Q4'] as const;
type Quarter     = typeof QUARTERS[number];
const Q_TO_NUM: Record<Quarter, number> = { Q1: 1, Q2: 2, Q3: 3, Q4: 4 };

type DerivedKey = 'bal' | 'slop' | 'bks' | 'stick';
const DERIVED = [
  { key: 'bal'   as DerivedKey, label: 'Bal',     labelFull: 'Bal' },
  { key: 'slop'  as DerivedKey, label: 'Slop',    labelFull: 'Slop' },
  { key: 'bks'   as DerivedKey, label: 'Bungkus', labelFull: 'Bungkus' },
  { key: 'stick' as DerivedKey, label: 'Stick',   labelFull: 'Stick' },
] as const;

// ─── Month/Week layout ─────────────────────────────────────────
// Weeks per month (52 weeks/year). Standard approximation:
// Jan=4, Feb=4, Mar=5, Apr=4, May=4, Jun=5, Jul=4, Aug=4, Sep=5, Oct=4, Nov=4, Dec=5
const MONTHS = [
  { idx: 0,  name: 'Januari',   short: 'Jan', q: 'Q1' as Quarter, weeks: 4 },
  { idx: 1,  name: 'Februari',  short: 'Feb', q: 'Q1' as Quarter, weeks: 4 },
  { idx: 2,  name: 'Maret',     short: 'Mar', q: 'Q1' as Quarter, weeks: 5 },
  { idx: 3,  name: 'April',     short: 'Apr', q: 'Q2' as Quarter, weeks: 4 },
  { idx: 4,  name: 'Mei',       short: 'Mei', q: 'Q2' as Quarter, weeks: 4 },
  { idx: 5,  name: 'Juni',      short: 'Jun', q: 'Q2' as Quarter, weeks: 5 },
  { idx: 6,  name: 'Juli',      short: 'Jul', q: 'Q3' as Quarter, weeks: 4 },
  { idx: 7,  name: 'Agustus',   short: 'Agu', q: 'Q3' as Quarter, weeks: 4 },
  { idx: 8,  name: 'September', short: 'Sep', q: 'Q3' as Quarter, weeks: 5 },
  { idx: 9,  name: 'Oktober',   short: 'Okt', q: 'Q4' as Quarter, weeks: 4 },
  { idx: 10, name: 'November',  short: 'Nov', q: 'Q4' as Quarter, weeks: 4 },
  { idx: 11, name: 'Desember',  short: 'Des', q: 'Q4' as Quarter, weeks: 5 },
] as const;

const Q_MONTHS: Record<Quarter, typeof MONTHS[number][]> = {
  Q1: MONTHS.filter(m => m.q === 'Q1'),
  Q2: MONTHS.filter(m => m.q === 'Q2'),
  Q3: MONTHS.filter(m => m.q === 'Q3'),
  Q4: MONTHS.filter(m => m.q === 'Q4'),
};

// Compute monthly weight within a quarter (based on week count)
function monthWeight(monthIdx: number): number {
  const m = MONTHS[monthIdx];
  const totalWeeks = Q_MONTHS[m.q].reduce((s, x) => s + x.weeks, 0);
  return m.weeks / totalWeeks;
}

type InputMode = 'quarterly' | 'monthly';

// Weekly data per product per month: Record<product, Record<monthIdx, Record<weekNum(1-5), number>>>
type WeeklyData = Record<string, Record<number, Record<number, number>>>;
// Monthly DOS: Record<product, Record<monthIdx, number>>
type MonthlyDos = Record<string, Record<number, number>>;

interface ProductTarget {
  product: string;
  q1_dos: number; q2_dos: number; q3_dos: number; q4_dos: number;
  q1_bal: number; q2_bal: number; q3_bal: number; q4_bal: number;
  q1_slop: number; q2_slop: number; q3_slop: number; q4_slop: number;
  q1_bks: number; q2_bks: number; q3_bks: number; q4_bks: number;
}
interface AreaQuarterlyData { Q1: number; Q2: number; Q3: number; Q4: number; }

// ─────────────────────────────────────────────────────────────────
// Conversion helpers
// ─────────────────────────────────────────────────────────────────
// ProductUnitConversion: stickPerPack, packPerSlop, slopPerBal, balPerDos
// Chain: DOS → Bal → Slop → Bungkus → Stick
//   bal   = dos  * balPerDos
//   slop  = bal  * slopPerBal
//   bks   = slop * packPerSlop
//   stick = bks  * stickPerPack

function getConv(product: string): ProductUnitConversion | null {
  return defaultProductUnitMapping?.[product] ?? null;
}

function calcDerived(product: string, dos: number): Record<DerivedKey, number> {
  const conv = getConv(product);
  if (!conv) return { bal: 0, slop: 0, bks: 0, stick: 0 };
  const bal   = r2(dos  * conv.balPerDos);
  const slop  = r2(bal  * conv.slopPerBal);
  const bks   = r2(slop * conv.packPerSlop);
  const stick = Math.round(bks * conv.stickPerPack);
  return { bal, slop, bks, stick };
}

function calcStick(product: string, bks: number): number {
  const conv = getConv(product);
  if (!conv) return 0;
  return Math.round(bks * conv.stickPerPack);
}

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────
const r2   = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const fmtN = (n: number) => (n || 0).toLocaleString('id-ID');
const fmtD = (n: number) => (n || 0).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

function derivedCellStyle(dk: DerivedKey, t: Tok, total = false): React.CSSProperties {
  const m: Record<DerivedKey, { bg: string; color: string; bl: string }> = {
    bal:   { bg: total ? t.balTotal   : t.balBg,   color: t.balText,   bl: t.balBorder   },
    slop:  { bg: total ? t.slopTotal  : t.slopBg,  color: t.slopText,  bl: t.slopBorder  },
    bks:   { bg: total ? t.bksTotal   : t.bksBg,   color: t.bksText,   bl: t.bksBorder   },
    stick: { bg: total ? t.stickTotal : t.stickBg, color: t.stickText, bl: t.stickBorder },
  };
  return { background: m[dk].bg, color: m[dk].color, borderLeft: `1px solid ${m[dk].bl}` };
}

function dkBorder(dk: DerivedKey, t: Tok) {
  return dk === 'bal' ? t.balBorder : dk === 'slop' ? t.slopBorder : dk === 'bks' ? t.bksBorder : t.stickBorder;
}

function CatBadge({ cat }: { cat: string }) {
  const map: Record<string, [string, string, string]> = {
    SKMR: ['rgba(99,102,241,0.12)', '#a5b4fc', 'rgba(99,102,241,0.25)'],
    SKMM: ['rgba(16,185,129,0.1)',  '#6ee7b7', 'rgba(16,185,129,0.2)'],
    SKT:  ['rgba(234,179,8,0.1)',   '#fde047', 'rgba(234,179,8,0.2)'],
    SPM:  ['rgba(217,70,239,0.1)',  '#e879f9', 'rgba(217,70,239,0.2)'],
  };
  const [bg, clr, bdr] = map[cat] ?? ['rgba(100,116,139,0.1)', '#94a3b8', 'rgba(100,116,139,0.2)'];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '1px 6px', borderRadius: 3,
      fontSize: 8, fontWeight: 700, fontFamily: '"IBM Plex Mono", monospace',
      letterSpacing: '0.07em', textTransform: 'uppercase',
      background: bg, color: clr, border: `1px solid ${bdr}`,
      flexShrink: 0, whiteSpace: 'nowrap',
    }}>{cat}</span>
  );
}

function Spinner({ size = 12, color = '#3b82f6' }: { size?: number; color?: string }) {
  return (
    <svg style={{ animation: 'spin .7s linear infinite', width: size, height: size, flexShrink: 0 }} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="3" opacity=".2"/>
      <path d="M4 12a8 8 0 018-8" stroke={color} strokeWidth="3" fill="none"/>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────
// EditableCell
// ─────────────────────────────────────────────────────────────────
const EditableCell = React.memo(function EditableCell({
  id, initialValue, onChange, t, compact,
}: { id: string; initialValue: number; onChange: (id: string, v: number) => void; t: Tok; compact?: boolean }) {
  const [val, setVal] = useState(initialValue);
  const ref           = useRef<HTMLInputElement>(null);
  const prev          = useRef(initialValue);

  useEffect(() => {
    if (prev.current !== initialValue && document.activeElement !== ref.current) {
      setVal(initialValue); prev.current = initialValue;
    }
  }, [initialValue]);

  const nav = useCallback((dir: 'up'|'down'|'left'|'right', cur: HTMLInputElement) => {
    const all = Array.from(document.querySelectorAll('input[data-areacell]')) as HTMLInputElement[];
    const idx = all.indexOf(cur);
    let nxt: HTMLInputElement | null = null;
    if (dir === 'up' || dir === 'down') {
      const row = cur.closest('tr');
      const sib = dir === 'down' ? row?.nextElementSibling : row?.previousElementSibling;
      if (sib) {
        const cols = all.filter(x => row?.contains(x));
        const col  = cols.indexOf(cur);
        nxt = (sib.querySelectorAll('input[data-areacell]') as NodeListOf<HTMLInputElement>)[col] ?? null;
      }
    } else if (dir === 'left'  && idx > 0)              nxt = all[idx - 1];
    else if   (dir === 'right' && idx < all.length - 1) nxt = all[idx + 1];
    if (nxt) { nxt.focus(); nxt.select(); }
  }, []);

  const hasVal = val > 0;
  return (
    <input
      ref={ref} data-areacell type="number" min={0} value={val}
      onChange={e => { const v = Number(e.target.value); setVal(v); onChange(id, v); }}
      onFocus={e => e.target.select()}
      onKeyDown={e => {
        const c = e.currentTarget;
        switch (e.key) {
          case 'Enter': case 'ArrowDown': e.preventDefault(); nav('down', c); break;
          case 'ArrowUp':    e.preventDefault(); nav('up', c); break;
          case 'ArrowLeft':  if (c.selectionStart === 0)              { e.preventDefault(); nav('left',  c); } break;
          case 'ArrowRight': if (c.selectionStart === c.value.length) { e.preventDefault(); nav('right', c); } break;
        }
      }}
      style={{
        width: '100%', minWidth: compact ? 52 : 68,
        padding: compact ? '3px 5px' : '5px 9px',
        borderRadius: 5, textAlign: 'right',
        fontSize: compact ? 10 : 11,
        fontFamily: 'IBM Plex Mono, monospace', fontWeight: 600,
        background: hasVal ? 'rgba(99,102,241,0.07)' : t.inputBg,
        border: `1px solid ${hasVal ? 'rgba(99,102,241,0.5)' : t.borderInput}`,
        color: hasVal ? '#a5b4fc' : t.textMuted,
        outline: 'none', transition: 'border-color 0.12s, background 0.12s, box-shadow 0.12s',
        boxShadow: hasVal ? '0 0 0 2px rgba(99,102,241,0.1)' : 'none',
      }}
    />
  );
}, (p, n) => p.initialValue === n.initialValue && p.id === n.id);

type BtnVariant = 'save' | 'cancel' | 'edit' | 'delete' | 'ghost' | 'green' | 'teal';
function Btn({
  variant, onClick, disabled, children, size = 'sm', fullWidth, t,
}: {
  variant: BtnVariant; onClick?: () => void; disabled?: boolean;
  children: React.ReactNode; size?: 'xs' | 'sm' | 'md'; fullWidth?: boolean; t: Tok;
}) {
  const px = size === 'xs' ? '7px' : size === 'sm' ? '10px' : '14px';
  const py = size === 'xs' ? '4px' : size === 'sm' ? '6px' : '8px';
  const fs = size === 'xs' ? 10 : size === 'sm' ? 11 : 12;

  const styles: Record<BtnVariant, React.CSSProperties> = {
    save:   { background: t.saveBg,   color: '#fff',        border: 'none' },
    cancel: { background: t.cancelBg, color: '#fff',        border: 'none' },
    edit:   { background: t.editBg,   color: t.editText,    border: `1px solid ${t.editBorder}` },
    delete: { background: t.delBg,    color: t.delText,     border: `1px solid ${t.delBorder}` },
    green:  { background: 'rgba(16,185,129,0.1)', color: '#4ade80', border: '1px solid rgba(16,185,129,0.3)' },
    ghost:  { background: 'transparent', color: t.textSub,  border: `1px solid ${t.borderInput}` },
    teal:   { background: 'rgba(20,184,166,0.1)', color: '#5eead4', border: '1px solid rgba(20,184,166,0.3)' },
  };

  return (
    <button onClick={onClick} disabled={disabled} style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4,
      padding: `${py} ${px}`, borderRadius: 6,
      fontSize: fs, fontWeight: 600, fontFamily: '"IBM Plex Sans", "DM Sans", sans-serif',
      letterSpacing: '0.01em',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
      width: fullWidth ? '100%' : undefined,
      transition: 'opacity 0.12s, filter 0.12s',
      filter: disabled ? 'none' : 'brightness(1)',
      ...styles[variant],
    }}
    onMouseEnter={e => { if (!disabled) (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.15)'; }}
    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1)'; }}
    >
      {children}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────
// Weekly layout constants — 4-4-5 per quarter (matches referensi)
// Q1: W1-W13, Q2: W14-W26, Q3: W27-W39, Q4: W40-W52
// ─────────────────────────────────────────────────────────────────
interface MonthWeekGroup { monthLabel: string; monthShort: string; weekOffsets: number[]; }

const MONTH_WEEK_GROUPS: Record<Quarter, MonthWeekGroup[]> = {
  Q1: [
    { monthLabel: 'Januari',   monthShort: 'Jan', weekOffsets: [0,1,2,3] },
    { monthLabel: 'Februari',  monthShort: 'Feb', weekOffsets: [4,5,6,7] },
    { monthLabel: 'Maret',     monthShort: 'Mar', weekOffsets: [8,9,10,11,12] },
  ],
  Q2: [
    { monthLabel: 'April',     monthShort: 'Apr', weekOffsets: [0,1,2,3] },
    { monthLabel: 'Mei',       monthShort: 'Mei', weekOffsets: [4,5,6,7] },
    { monthLabel: 'Juni',      monthShort: 'Jun', weekOffsets: [8,9,10,11,12] },
  ],
  Q3: [
    { monthLabel: 'Juli',      monthShort: 'Jul', weekOffsets: [0,1,2,3] },
    { monthLabel: 'Agustus',   monthShort: 'Agu', weekOffsets: [4,5,6,7] },
    { monthLabel: 'September', monthShort: 'Sep', weekOffsets: [8,9,10,11,12] },
  ],
  Q4: [
    { monthLabel: 'Oktober',   monthShort: 'Okt', weekOffsets: [0,1,2,3] },
    { monthLabel: 'November',  monthShort: 'Nov', weekOffsets: [4,5,6,7] },
    { monthLabel: 'Desember',  monthShort: 'Des', weekOffsets: [8,9,10,11,12] },
  ],
};

function getMonthWeekGroups(q: Quarter): MonthWeekGroup[] {
  return MONTH_WEEK_GROUPS[q];
}

function globalWeek(quarterNum: number, localOffset: number): number {
  return (quarterNum - 1) * 13 + localOffset + 1;
}

// WeekValues keyed by "Q1_W0".."Q4_W12"
type WeekValues = Record<string, number>;
// Per-product weekly overrides: { productName: WeekValues }
type WeekOverrides = Record<string, WeekValues>;

// ─────────────────────────────────────────────────────────────────
// ExpandedProductRows — weekly inline input (like referensi)
// ─────────────────────────────────────────────────────────────────
function ExpandedProductRows({
  areaId, year, t, onAreaTotalsLoaded,
}: {
  areaId: string; year: string; t: Tok;
  onAreaTotalsLoaded?: (areaId: string, totals: AreaQuarterlyData) => void;
}) {
  const [products,    setProducts]    = useState<ProductTarget[]>([]);
  const [availProds,  setAvailProds]  = useState<string[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [err,         setErr]         = useState<string | null>(null);
  const [saving,      setSaving]      = useState<string | null>(null);
  const [deleting,    setDeleting]    = useState<string | null>(null);
  const [editingProds,setEditingProds]= useState<Set<string>>(new Set());
  const [showAddProd, setShowAddProd] = useState(false);
  const [newProd,     setNewProd]     = useState('');
  const [localToast,  setLocalToast]  = useState<{ msg: string; type: 'ok'|'err' } | null>(null);
  const [confirmDel,  setConfirmDel]  = useState<string | null>(null);

  // Week overrides: user edits live here, keyed product → "Q1_W0" → value
  const overridesRef = useRef<WeekOverrides>({});
  const [calcVer,     setCalcVer]     = useState(0);

  // New product weekly values
  const [newWeekVals, setNewWeekVals] = useState<WeekValues>({});

  const showLocalToast = (msg: string, type: 'ok'|'err') => {
    setLocalToast({ msg, type });
    setTimeout(() => setLocalToast(null), 2500);
  };

  const cell: React.CSSProperties = {
    padding: '6px 7px', fontSize: 10,
    borderBottom: `1px solid ${t.border}`, whiteSpace: 'nowrap', color: t.text,
  };

  const loadData = useCallback(async () => {
    setLoading(true); setErr(null);
    try {
      const [targetsRes, prodsRes] = await Promise.all([
        fetch(`/api/area-targets?area=${areaId}&year=${year}`),
        fetch(`/api/products?area=${areaId}&year=${year}`),
      ]);
      if (!prodsRes.ok) throw new Error(`Products HTTP ${prodsRes.status}`);
      const prodsJson = await prodsRes.json();
      if (!prodsJson.success) throw new Error(prodsJson.error || 'Gagal memuat produk');
      const prodNames: string[] = (prodsJson.data.products as string[]).sort((a, b) => a.localeCompare(b));
      setAvailProds(prodNames);

      let dosMap: Record<string, ProductTarget> = {};
      if (targetsRes.ok) {
        const targetsJson = await targetsRes.json();
        if (targetsJson.success && targetsJson.data.products?.length) {
          for (const p of targetsJson.data.products as ProductTarget[]) dosMap[p.product] = p;
        }
        if (onAreaTotalsLoaded && targetsJson?.data?.quarterlyTargets) {
          onAreaTotalsLoaded(areaId, targetsJson.data.quarterlyTargets);
        }
      }

      const merged: ProductTarget[] = prodNames.map(name => dosMap[name] ?? {
        product: name,
        q1_dos: 0, q2_dos: 0, q3_dos: 0, q4_dos: 0,
        q1_bal: 0, q2_bal: 0, q3_bal: 0, q4_bal: 0,
        q1_slop: 0, q2_slop: 0, q3_slop: 0, q4_slop: 0,
        q1_bks: 0, q2_bks: 0, q3_bks: 0, q4_bks: 0,
      });
      setProducts(merged);
      // Reset overrides when data reloads
      overridesRef.current = {};
      setCalcVer(0);
    } catch (e: any) {
      setErr(e.message || 'Error memuat data');
    } finally {
      setLoading(false);
    }
  }, [areaId, year]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Cell value helpers ──
  const makeCellKey = (product: string, q: Quarter, offset: number) => `${product}||${q}_W${offset}`;

  const getWeekVal = useCallback((product: string, q: Quarter, offset: number): number => {
    const ov = overridesRef.current[product]?.[`${q}_W${offset}`];
    if (ov !== undefined) return ov;
    // Distribute stored quarterly DOS evenly over 13 weeks
    const p = products.find(x => x.product === product);
    const qDos = p ? (p[`${q.toLowerCase()}_dos` as keyof ProductTarget] as number || 0) : 0;
    return r2(qDos / 13);
  }, [products]);

  const handleCellChange = useCallback((cellKey: string, val: number) => {
    // cellKey = "product||Q1_W3"
    const [product, wk] = cellKey.split('||');
    if (!overridesRef.current[product]) overridesRef.current[product] = {};
    overridesRef.current[product][wk] = val;
    setCalcVer(v => v + 1);
  }, []);

  // ── Compute quarterly totals from weekly values ──
  const getQDos = useCallback((product: string, q: Quarter): number => {
    return r2(getMonthWeekGroups(q).flatMap(g => g.weekOffsets).reduce((s, wo) => s + getWeekVal(product, q, wo), 0));
  }, [getWeekVal]);

  // ── Edit / Save / Delete ──
  const startEdit = (product: string) => {
    setEditingProds(prev => new Set([...prev, product]));
  };

  const cancelEdit = (product: string) => {
    setEditingProds(prev => { const n = new Set(prev); n.delete(product); return n; });
    // Remove overrides for this product
    delete overridesRef.current[product];
    setCalcVer(v => v + 1);
  };

  const saveProduct = async (product: string) => {
    setSaving(product);
    try {
      // Build quarterly DOS from weekly sums
      const payloads = QUARTERS.map(q => ({
        q, dos: getQDos(product, q),
      }));
      await Promise.all(payloads.map(async ({ q, dos }) => {
        const res = await fetch('/api/area-targets', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ area: areaId, product, year: Number(year), quarter: Q_TO_NUM[q], dos_value: dos }),
        });
        const json = await res.json();
        if (!json.success) throw new Error(`${q}: ${json.error}`);
      }));
      showLocalToast(`${product} — target disimpan`, 'ok');
      cancelEdit(product);
      await loadData();
    } catch (e: any) {
      showLocalToast(`Gagal: ${e.message}`, 'err');
    } finally { setSaving(null); }
  };

  const deleteProduct = async (product: string) => {
    setDeleting(product); setConfirmDel(null);
    try {
      const res = await fetch(`/api/area-targets?area=${areaId}&product=${encodeURIComponent(product)}&year=${year}`, { method: 'DELETE' });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      showLocalToast(`${product} — target dihapus`, 'ok');
      await loadData();
    } catch (e: any) { showLocalToast(`Gagal: ${e.message}`, 'err'); }
    finally { setDeleting(null); }
  };

  const addProduct = async () => {
    if (!newProd) { showLocalToast('Pilih produk terlebih dahulu', 'err'); return; }
    setSaving('__new__');
    try {
      // Sum weekly vals for each quarter
      const qDos: Record<Quarter, number> = { Q1: 0, Q2: 0, Q3: 0, Q4: 0 };
      QUARTERS.forEach(q => {
        qDos[q] = r2(getMonthWeekGroups(q).flatMap(g => g.weekOffsets).reduce((s, wo) => s + (newWeekVals[`${q}_W${wo}`] ?? 0), 0));
      });
      await Promise.all(QUARTERS.map(q =>
        fetch('/api/area-targets', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ area: areaId, product: newProd, year: Number(year), quarter: Q_TO_NUM[q], dos_value: qDos[q] }),
        }).then(r => r.json()).then(j => { if (!j.success) throw new Error(j.error); })
      ));
      showLocalToast(`${newProd} — ditambahkan`, 'ok');
      setShowAddProd(false); setNewProd(''); setNewWeekVals({});
      await loadData();
    } catch (e: any) { showLocalToast(`Gagal: ${e.message}`, 'err'); }
    finally { setSaving(null); }
  };

  // ── Column count: 1(product) + 13*4 weeks + 4 Q-totals + 1 total DOS + 4 derived*(4Q+1) + 1 actions
  const WEEK_COLS = 52; // 13 per quarter × 4
  const Q_TOT_COLS = 4;
  const TOTAL_DOS_COLS = 1;
  const DERIVED_COLS = DERIVED.length * 5; // 4Q + Σ each
  const ACTION_COLS = 1;
  const totalCols = 1 + WEEK_COLS + Q_TOT_COLS + TOTAL_DOS_COLS + DERIVED_COLS + ACTION_COLS;

  if (loading) return (
    <tr>
      <td colSpan={totalCols} style={{ padding: '14px 24px', background: t.rowSubhead, borderBottom: `1px solid ${t.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: t.textMuted, fontSize: 12 }}>
          <Spinner size={14}/>
          <span>Memuat produk <strong style={{ color: t.textSub }}>{areaId}</strong> — {year}…</span>
        </div>
      </td>
    </tr>
  );

  if (err) return (
    <tr>
      <td colSpan={totalCols} style={{ padding: '10px 24px', background: 'rgba(239,68,68,0.05)', borderBottom: '1px solid rgba(239,68,68,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#fca5a5', fontSize: 12 }}>
          <AlertCircle size={13}/>
          <span>{err}</span>
          <Btn variant="delete" size="xs" onClick={loadData} t={t}><RefreshCw size={10}/> Coba lagi</Btn>
        </div>
      </td>
    </tr>
  );

  const thWeek: React.CSSProperties = {
    padding: '4px 3px', fontSize: 8, fontWeight: 600,
    color: t.theadText, background: t.theadBg,
    borderBottom: `1px solid ${t.border}`,
    fontFamily: '"IBM Plex Mono",monospace', textAlign: 'center', minWidth: 50,
    letterSpacing: '0.02em',
  };

  return (
    <>
      {/* Local toast */}
      {localToast && (
        <tr>
          <td colSpan={totalCols} style={{ padding: 0 }}>
            <div style={{ padding: '8px 20px', background: localToast.type==='ok' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', borderBottom: `1px solid ${localToast.type==='ok' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`, display: 'flex', alignItems: 'center', gap: 7 }}>
              {localToast.type==='ok' ? <CheckCircle2 size={13} color="#4ade80"/> : <AlertCircle size={13} color="#fca5a5"/>}
              <span style={{ fontSize: 11, fontWeight: 600, color: localToast.type==='ok' ? '#4ade80' : '#fca5a5' }}>{localToast.msg}</span>
            </div>
          </td>
        </tr>
      )}

      {/* Delete confirm */}
      {confirmDel && (
        <tr>
          <td colSpan={totalCols} style={{ padding: 0 }}>
            <div style={{ padding: '8px 20px', background: 'rgba(239,68,68,0.08)', borderBottom: '1px solid rgba(239,68,68,0.18)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <AlertCircle size={13} color="#fca5a5"/>
              <span style={{ fontSize: 11, color: '#fca5a5', fontWeight: 600, flex: 1 }}>Hapus semua target <strong>{confirmDel}</strong> untuk tahun {year}?</span>
              <Btn variant="delete" size="xs" onClick={() => deleteProduct(confirmDel)} t={t}>Ya, Hapus</Btn>
              <Btn variant="ghost" size="xs" onClick={() => setConfirmDel(null)} t={t}>Batal</Btn>
            </div>
          </td>
        </tr>
      )}

      {/* ── Sub-header with 3-level column headers ── */}
      {/* Level 1: Quarter groups */}
      <tr style={{ background: t.theadBg }}>
        <th rowSpan={3} style={{ ...thWeek, textAlign: 'left', minWidth: 210, position: 'sticky', left: 0, zIndex: 40, background: t.theadBg, borderRight: `2px solid ${t.border}`, padding: '7px 10px 7px 28px', fontFamily: 'IBM Plex Sans, sans-serif', fontSize: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Package size={11} color={t.textMuted}/>
              <span style={{ fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em', color: t.textMuted }}>{products.length} Produk</span>
            </div>
            <Btn variant={showAddProd ? 'ghost' : 'green'} size="xs" onClick={() => { setShowAddProd(p => !p); setNewProd(''); setNewWeekVals({}); }} t={t}>
              {showAddProd ? <><X size={9}/> Batal</> : <><Plus size={9}/> Tambah</>}
            </Btn>
          </div>
        </th>
        {QUARTERS.map((q, qi) => (
          <th key={q} colSpan={14} style={{ ...thWeek, background: 'rgba(99,102,241,0.16)', color: '#a5b4fc', borderLeft: '2px solid rgba(99,102,241,0.25)', borderRight: '2px solid rgba(99,102,241,0.25)', fontSize: 10, fontWeight: 800, letterSpacing: '0.05em' }}>
            {q} — {['Jan/Feb/Mar','Apr/Mei/Jun','Jul/Agu/Sep','Okt/Nov/Des'][qi]}
          </th>
        ))}
        <th rowSpan={3} style={{ ...thWeek, background: 'rgba(99,102,241,0.24)', color: '#c7d2fe', borderLeft: '2px solid rgba(99,102,241,0.38)', borderRight: '2px solid rgba(99,102,241,0.38)', minWidth: 80, verticalAlign: 'middle' }}>
          Total<br/>DOS
        </th>
        {DERIVED.map(d => (
          <th key={d.key} colSpan={5} style={{ ...thWeek, textAlign: 'center', ...derivedCellStyle(d.key, t), borderLeft: `2px solid ${dkBorder(d.key, t)}` }}>
            {d.labelFull}
          </th>
        ))}
        <th rowSpan={3} style={{ ...thWeek, minWidth: 80, verticalAlign: 'middle' }}>Aksi</th>
      </tr>

      {/* Level 2: Month labels + Q-total */}
      <tr style={{ background: t.theadBg }}>
        {QUARTERS.map(q => (
          <React.Fragment key={q}>
            {getMonthWeekGroups(q).map(({ monthShort, weekOffsets }) => (
              <th key={monthShort} colSpan={weekOffsets.length} style={{ ...thWeek, background: 'rgba(17,19,32,0.8)', color: 'rgba(255,255,255,0.35)', borderLeft: '1px solid rgba(99,102,241,0.12)', fontWeight: 600 }}>
                {monthShort}
                <span style={{ marginLeft: 3, fontSize: 8, opacity: 0.6 }}>({weekOffsets.length}W)</span>
              </th>
            ))}
            <th style={{ ...thWeek, background: 'rgba(99,102,241,0.2)', color: '#c7d2fe', borderLeft: '2px solid rgba(99,102,241,0.28)', minWidth: 72 }}>
              {q} Σ
            </th>
          </React.Fragment>
        ))}
        {DERIVED.map(d => (
          <React.Fragment key={d.key}>
            {QUARTERS.map(q => <th key={q} style={{ ...thWeek, minWidth: 68, ...derivedCellStyle(d.key, t), borderLeft: `1px solid ${dkBorder(d.key, t)}` }}>{q}</th>)}
            <th style={{ ...thWeek, minWidth: 74, ...derivedCellStyle(d.key, t, true), borderLeft: `2px solid ${dkBorder(d.key, t)}` }}>Σ</th>
          </React.Fragment>
        ))}
      </tr>

      {/* Level 3: Week numbers (global W1-W52) */}
      <tr style={{ background: t.theadBg }}>
        {QUARTERS.map((q, qi) => (
          <React.Fragment key={q}>
            {getMonthWeekGroups(q).flatMap(({ weekOffsets }) =>
              weekOffsets.map(wo => (
                <th key={`${q}_W${wo}`} style={{ ...thWeek, background: '#0b0c14', color: 'rgba(255,255,255,0.3)', borderLeft: '1px solid rgba(255,255,255,0.03)', fontSize: 7, fontWeight: 500, letterSpacing: '0.03em' }}>
                  W{globalWeek(qi + 1, wo)}
                </th>
              ))
            )}
            <th style={{ ...thWeek, background: 'rgba(99,102,241,0.18)', color: '#a5b4fc', borderLeft: '2px solid rgba(99,102,241,0.28)' }}>Σ</th>
          </React.Fragment>
        ))}
        {DERIVED.map(d => (
          <React.Fragment key={d.key}>
            {QUARTERS.map(q => <th key={q} style={{ ...thWeek, ...derivedCellStyle(d.key, t), borderLeft: `1px solid ${dkBorder(d.key, t)}` }}/>)}
            <th style={{ ...thWeek, ...derivedCellStyle(d.key, t, true), borderLeft: `2px solid ${dkBorder(d.key, t)}` }}/>
          </React.Fragment>
        ))}
      </tr>

      {/* Add product row */}
      {showAddProd && (
        <tr style={{ background: t.addRowBg, borderBottom: `1px solid ${t.addRowBorder}` }}>
          <td style={{ padding: '7px 10px 7px 16px', position: 'sticky', left: 0, background: t.addRowBg, zIndex: 15, borderRight: `2px solid ${t.addRowBorder}` }}>
            <select value={newProd} onChange={e => setNewProd(e.target.value)}
              style={{ width: '100%', padding: '5px 8px', borderRadius: 7, fontSize: 11, fontWeight: 600, background: t.inputBg, border: `1px solid ${t.borderInput}`, color: newProd ? t.text : t.textMuted, outline: 'none', fontFamily: 'IBM Plex Sans, sans-serif', cursor: 'pointer' }}>
              <option value="">— Pilih produk —</option>
              {availProds.filter(ap => !products.find(p => p.product === ap)).map(ap => (
                <option key={ap} value={ap}>{ap}</option>
              ))}
            </select>
          </td>
          {QUARTERS.map(q => (
            <React.Fragment key={q}>
              {getMonthWeekGroups(q).flatMap(({ weekOffsets }) =>
                weekOffsets.map(wo => {
                  const wk = `${q}_W${wo}`;
                  return (
                    <td key={wk} style={{ padding: '3px 2px', background: t.qBg, borderLeft: '1px solid rgba(99,102,241,0.08)' }}>
                      <EditableCell id={`__new__||${wk}`} initialValue={newWeekVals[wk] ?? 0}
                        onChange={(_, v) => setNewWeekVals(p => ({...p, [wk]: v}))} t={t} compact/>
                    </td>
                  );
                })
              )}
              <td style={{ ...cell, textAlign: 'right', fontWeight: 700, background: t.qTotalBg, color: t.qTotalText, borderLeft: '2px solid rgba(37,99,235,0.3)', fontSize: 10 }}>
                {fmtD(r2(getMonthWeekGroups(q).flatMap(g => g.weekOffsets).reduce((s, wo) => s + (newWeekVals[`${q}_W${wo}`] ?? 0), 0)))}
              </td>
            </React.Fragment>
          ))}
          <td style={{ ...cell, textAlign: 'right', fontWeight: 700, background: t.qTotalBg, color: t.qTotalText, borderLeft: '2px solid rgba(37,99,235,0.4)' }}>
            {fmtD(r2(QUARTERS.reduce((s, q) => s + getMonthWeekGroups(q).flatMap(g => g.weekOffsets).reduce((ss, wo) => ss + (newWeekVals[`${q}_W${wo}`] ?? 0), 0), 0)))}
          </td>
          {DERIVED.map(d => (
            <React.Fragment key={d.key}>
              {QUARTERS.map(q => <td key={q} style={{ ...cell, ...derivedCellStyle(d.key, t) }}/>)}
              <td style={{ ...cell, ...derivedCellStyle(d.key, t, true), borderLeft: `2px solid ${dkBorder(d.key, t)}` }}/>
            </React.Fragment>
          ))}
          <td style={{ padding: '7px 8px', background: t.addRowBg }}>
            <div style={{ display: 'flex', gap: 5, justifyContent: 'flex-end' }}>
              <Btn variant="save" size="xs" onClick={addProduct} disabled={saving==='__new__'} t={t}>
                {saving==='__new__' ? <><Spinner size={9} color="#fff"/> Simpan…</> : <><Save size={10}/> Simpan</>}
              </Btn>
              <Btn variant="ghost" size="xs" onClick={() => { setShowAddProd(false); setNewProd(''); }} t={t}><X size={10}/></Btn>
            </div>
          </td>
        </tr>
      )}

      {/* Empty state */}
      {!products.length && !showAddProd && (
        <tr>
          <td colSpan={totalCols} style={{ padding: '24px', background: t.rowSubhead, borderBottom: `1px solid ${t.border}`, textAlign: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <Package size={20} color={t.textFaint}/>
              <span style={{ fontSize: 12, color: t.textMuted }}>Belum ada target produk untuk tahun {year}</span>
            </div>
          </td>
        </tr>
      )}

      {/* Product rows */}
      {products.map((p, rowIdx) => {
        const isEditing  = editingProds.has(p.product);
        const isSaving   = saving === p.product;
        const isDeleting = deleting === p.product;

        // Compute quarterly DOS from weekly (overrides + server fallback)
        const qDosVals = QUARTERS.reduce((acc, q) => {
          acc[q] = isEditing ? getQDos(p.product, q) : (p[`${q.toLowerCase()}_dos` as keyof ProductTarget] as number || 0);
          return acc;
        }, {} as Record<Quarter, number>);

        const totalDos = r2(Object.values(qDosVals).reduce((s, v) => s + v, 0));

        // Derived per quarter
        const qDerived = QUARTERS.reduce((acc, q) => {
          acc[q] = calcDerived(p.product, qDosVals[q]);
          return acc;
        }, {} as Record<Quarter, Record<DerivedKey, number>>);

        const totalDerived = calcDerived(p.product, totalDos);

        const hasTargets = totalDos > 0;
        const rowBg = isEditing ? t.rowEditing : rowIdx % 2 === 0 ? t.rowProduct : 'transparent';

        return (
          <tr key={p.product} style={{ background: rowBg, borderBottom: `1px solid ${t.border}`, transition: 'background 0.12s' }}>

            {/* Product name — sticky */}
            <td style={{ padding: '8px 10px 8px 0', borderRight: `1px solid ${t.border}`, position: 'sticky', left: 0, background: rowBg, zIndex: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ width: 3, alignSelf: 'stretch', flexShrink: 0, background: isEditing ? '#3b82f6' : 'transparent', borderRadius: '0 2px 2px 0', marginRight: 8, transition: 'background 0.15s' }}/>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 10, fontWeight: 600, color: t.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 185, fontFamily: '"IBM Plex Sans","DM Sans",sans-serif', letterSpacing: '-0.01em' }}>
                      {p.product}
                    </span>
                    <CatBadge cat={getProductCategory(p.product)}/>
                  </div>
                  {!hasTargets && !isEditing && (
                    <span style={{ fontSize: 9, color: t.textFaint, fontStyle: 'italic' }}>belum ada target</span>
                  )}
                </div>
              </div>
            </td>

            {/* Weekly input cells */}
            {QUARTERS.map((q, qi) => (
              <React.Fragment key={q}>
                {getMonthWeekGroups(q).flatMap(({ weekOffsets }) =>
                  weekOffsets.map(wo => {
                    const cellKey = makeCellKey(p.product, q, wo);
                    const initVal = isEditing
                      ? (overridesRef.current[p.product]?.[`${q}_W${wo}`] ?? r2((p[`${q.toLowerCase()}_dos` as keyof ProductTarget] as number || 0) / 13))
                      : r2((p[`${q.toLowerCase()}_dos` as keyof ProductTarget] as number || 0) / 13);
                    return (
                      <td key={cellKey} style={{ padding: '4px 3px', background: t.qBg, borderLeft: '1px solid rgba(37,99,235,0.1)' }}>
                        {isEditing ? (
                          <EditableCell id={cellKey} initialValue={initVal} onChange={handleCellChange} t={t} compact/>
                        ) : (
                          <span style={{ display: 'block', textAlign: 'right', fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: initVal > 0 ? t.qText : t.textFaint, padding: '3px 4px' }}>
                            {initVal > 0 ? fmtD(initVal) : '—'}
                          </span>
                        )}
                      </td>
                    );
                  })
                )}
                {/* Q total */}
                <td style={{ ...cell, textAlign: 'right', fontWeight: 700, background: t.qTotalBg, color: t.qTotalText, borderLeft: '2px solid rgba(99,102,241,0.28)', minWidth: 72, fontSize: 10 }}>
                  {qDosVals[q] > 0 ? fmtD(qDosVals[q]) : <span style={{ color: t.textFaint, fontSize: 10 }}>—</span>}
                </td>
              </React.Fragment>
            ))}

            {/* Total DOS */}
            <td style={{ ...cell, textAlign: 'right', fontWeight: 800, background: 'rgba(99,102,241,0.2)', color: '#c7d2fe', borderLeft: '2px solid rgba(99,102,241,0.38)', borderRight: '2px solid rgba(99,102,241,0.38)', minWidth: 80 }}>
              {totalDos > 0 ? fmtD(totalDos) : <span style={{ color: t.textFaint, fontSize: 10 }}>—</span>}
            </td>

            {/* Derived per Q + total */}
            {DERIVED.map(d => (
              <React.Fragment key={d.key}>
                {QUARTERS.map(q => {
                  const val = qDerived[q][d.key];
                  return (
                    <td key={q} style={{ ...cell, textAlign: 'right', ...derivedCellStyle(d.key, t), minWidth: 68 }}>
                      <span style={{ color: val > 0 ? undefined : t.textFaint }}>
                        {val > 0 ? fmtD(val) : <span style={{ fontSize: 10 }}>—</span>}
                      </span>
                    </td>
                  );
                })}
                <td style={{ ...cell, textAlign: 'right', fontWeight: 700, ...derivedCellStyle(d.key, t, true), borderLeft: `2px solid ${dkBorder(d.key, t)}`, minWidth: 74 }}>
                  {totalDerived[d.key] > 0 ? fmtD(totalDerived[d.key]) : <span style={{ fontSize: 10, fontWeight: 400, color: t.textFaint }}>—</span>}
                </td>
              </React.Fragment>
            ))}

            {/* Action */}
            <td style={{ padding: '7px 8px', background: rowBg }}>
              <div style={{ display: 'flex', gap: 5, justifyContent: 'flex-end', alignItems: 'center' }}>
                {isEditing ? (
                  <>
                    <Btn variant="save" size="xs" onClick={() => saveProduct(p.product)} disabled={isSaving} t={t}>
                      {isSaving ? <><Spinner size={9} color="#fff"/> Simpan…</> : <><Save size={10}/> Simpan</>}
                    </Btn>
                    <Btn variant="cancel" size="xs" onClick={() => cancelEdit(p.product)} disabled={isSaving} t={t}><X size={10}/></Btn>
                  </>
                ) : (
                  <>
                    <Btn variant="edit" size="xs" onClick={() => startEdit(p.product)} t={t}><Edit2 size={10}/> Edit</Btn>
                    <Btn variant="delete" size="xs" onClick={() => setConfirmDel(p.product)} disabled={isDeleting} t={t}>
                      {isDeleting ? <Spinner size={9} color="#fca5a5"/> : <Trash2 size={10}/>}
                    </Btn>
                  </>
                )}
              </div>
            </td>
          </tr>
        );
      })}

      {/* Grand subtotal */}
      {!!products.length && (() => {
        const subDos = QUARTERS.reduce((acc, q) => {
          acc[q] = r2(products.reduce((s, p) => s + (p[`${q.toLowerCase()}_dos` as keyof ProductTarget] as number || 0), 0));
          return acc;
        }, {} as Record<Quarter, number>);
        const subTotal = r2(Object.values(subDos).reduce((s, v) => s + v, 0));
        return (
          <tr style={{ background: t.rowSubtotal, borderBottom: `2px solid ${t.border}` }}>
            <td style={{ padding: '7px 10px 7px 14px', borderRight: `1px solid ${t.border}`, position: 'sticky', left: 0, background: t.rowSubtotal, zIndex: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 3 }}>
                <div style={{ width: 3, height: 16, background: 'rgba(255,255,255,0.2)', borderRadius: 2 }}/>
                <span style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.4)', fontFamily: '"IBM Plex Mono",monospace', textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>
                  Subtotal · {products.length} produk
                </span>
              </div>
            </td>
            {/* 52 week cells + 4 Q totals */}
            {QUARTERS.map(q => (
              <React.Fragment key={q}>
                {getMonthWeekGroups(q).flatMap(({ weekOffsets }) =>
                  weekOffsets.map(wo => (
                    <td key={wo} style={{ ...cell, textAlign: 'right', background: 'rgba(37,99,235,0.07)', color: t.grandQText, fontSize: 10 }}>
                      {fmtD(r2(products.reduce((s, p) => s + r2((p[`${q.toLowerCase()}_dos` as keyof ProductTarget] as number || 0) / 13), 0)))}
                    </td>
                  ))
                )}
                <td style={{ ...cell, textAlign: 'right', fontWeight: 800, background: t.grandQBg, color: t.grandQText, borderLeft: '2px solid rgba(37,99,235,0.3)' }}>
                  {fmtD(subDos[q])}
                </td>
              </React.Fragment>
            ))}
            <td style={{ ...cell, textAlign: 'right', fontWeight: 800, background: t.grandTotBg, color: '#fff', borderLeft: '2px solid rgba(37,99,235,0.4)' }}>
              {fmtD(subTotal)}
            </td>
            {DERIVED.map(d => {
              const qTots = QUARTERS.map(q => r2(products.reduce((s, p) => {
                const dos = p[`${q.toLowerCase()}_dos` as keyof ProductTarget] as number || 0;
                return s + calcDerived(p.product, dos)[d.key];
              }, 0)));
              const grand = r2(qTots.reduce((s, v) => s + v, 0));
              return (
                <React.Fragment key={d.key}>
                  {qTots.map((val, i) => (
                    <td key={i} style={{ ...cell, textAlign: 'right', fontWeight: 700, ...derivedCellStyle(d.key, t, true) }}>{fmtD(val)}</td>
                  ))}
                  <td style={{ ...cell, textAlign: 'right', fontWeight: 800, ...derivedCellStyle(d.key, t, true), borderLeft: `2px solid ${dkBorder(d.key, t)}` }}>{fmtD(grand)}</td>
                </React.Fragment>
              );
            })}
            <td style={{ background: t.rowSubtotal }}/>
          </tr>
        );
      })()}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────
interface AreaManagementProps {
  onAreasChange?: (areas: AreaConfig[]) => void;
  theme?: Theme;
}

export default function AreaManagement({ onAreasChange, theme: propTheme }: AreaManagementProps) {
  const theme = propTheme ?? 'light';
  const t     = tokens[theme];

  const [areas,        setAreas]        = useState<AreaConfig[]>([]);
  const [expanded,     setExpanded]     = useState<Set<string>>(new Set());
  const [selYear,      setSelYear]      = useState(String(new Date().getFullYear()));
  const [showYearDrop, setShowYearDrop] = useState(false);
  const [showAdd,      setShowAdd]      = useState(false);
  const [newA,         setNewA]         = useState<Partial<AreaConfig>>({ id: '', name: '', description: '' });
  const [delId,        setDelId]        = useState<string | null>(null);
  const [toast,        setToast]        = useState<{ show: boolean; msg: string; type: 'ok'|'err'|'info' }>({ show: false, msg: '', type: 'info' });
  const [areaDbTotals, setAreaDbTotals] = useState<Record<string, AreaQuarterlyData>>({});

  const years = ['2023','2024','2025','2026','2027','2028'];

  const showToast = (msg: string, type: 'ok'|'err'|'info' = 'info') => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: '', type: 'info' }), 3000);
  };

  useEffect(() => { loadAreas(); }, []);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (!(e.target as HTMLElement).closest('.am-year-drop')) setShowYearDrop(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const loadAreas = async () => {
    try {
      const r = await fetch('/api/areas');
      if (!r.ok) throw new Error();
      const j = await r.json();
      const a = j.data?.areas ?? [];
      setAreas(a); onAreasChange?.(a);
    } catch { setAreas([]); }
  };

  const toggle = (id: string) => setExpanded(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const apiCall = async (action: string, area: Partial<AreaConfig>) => {
    const r = await fetch('/api/areas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, area }) });
    const j = await r.json();
    if (j.success) { const a = j.data?.areas ?? []; setAreas(a); onAreasChange?.(a); }
    return j;
  };

  const handleAdd = async () => {
    if (!newA.id) { showToast('Lengkapi ID area', 'err'); return; }
    const j = await apiCall('add', { ...newA, name: newA.name || newA.id }).catch(() => ({ success: false, error: 'Network' }));
    if (j.success) { setNewA({ id:'', name:'', description:'' }); setShowAdd(false); showToast('Area ditambahkan', 'ok'); }
    else showToast(`Gagal: ${j.error}`, 'err');
  };

  const handleDel = async () => {
    if (!delId) return;
    const j = await apiCall('delete', { id: delId }).catch(() => ({ success: false, error: 'Network' }));
    if (j.success) showToast('Area dihapus', 'ok'); else showToast(`Gagal: ${j.error}`, 'err');
    setDelId(null);
  };

  const handleAreaTotalsLoaded = useCallback((areaId: string, totals: AreaQuarterlyData) => {
    setAreaDbTotals(prev => ({ ...prev, [areaId]: totals }));
  }, []);

  const gTotal = QUARTERS.reduce((acc, q) => {
    acc[q] = areas.reduce((s, ar) => s + (areaDbTotals[ar.id]?.[q] ?? 0), 0);
    return acc;
  }, {} as Record<Quarter, number>);
  const gAll = Object.values(gTotal).reduce((s, v) => s + v, 0);

  const thS: React.CSSProperties   = { padding: '9px 11px', fontSize: 9, fontFamily: '"IBM Plex Mono",monospace', fontWeight: 700, color: t.theadText, whiteSpace: 'nowrap', letterSpacing: '0.06em', textTransform: 'uppercase' as const };
  const cellS: React.CSSProperties = { padding: '9px 11px', fontSize: 11, fontFamily: '"IBM Plex Mono",monospace', whiteSpace: 'nowrap' };

  // Derived headers — now includes Stick with per-Q columns
  return (
    <div style={{ minHeight: '100vh', background: t.pagebg, padding: '16px 20px', fontFamily: '"IBM Plex Sans","DM Sans",sans-serif', transition: 'background 0.3s' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes fadeIn { from { opacity:0; transform:translateY(-3px) } to { opacity:1; transform:translateY(0) } }
        @keyframes slideIn { from { opacity:0; transform:translateX(8px) } to { opacity:1; transform:translateX(0) } }
        * { box-sizing: border-box; }
        input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
        .area-row:hover td { background: ${t.areaRowHover} !important; }
        .area-row:hover td.sticky-col { background: ${t.areaRowHover} !important; }
      `}</style>

      {toast.show && (
        <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 70, animation: 'slideIn 0.18s ease' }}>
          <div style={{ padding: '9px 14px', borderRadius: 8, boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 600, fontFamily: '"IBM Plex Sans",sans-serif', background: toast.type==='ok' ? t.toastOk : toast.type==='err' ? t.toastErr : t.toastInfo, color: '#fff', minWidth: 200, letterSpacing: '-0.01em' }}>
            {toast.type==='ok'  && <CheckCircle2 size={13}/>}
            {toast.type==='err' && <AlertCircle  size={13}/>}
            {toast.type==='info'&& <Info         size={13}/>}
            {toast.msg}
          </div>
        </div>
      )}

      {delId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16, backdropFilter: 'blur(4px)', animation: 'fadeIn 0.15s ease' }}>
          <div style={{ background: t.modalBg, borderRadius: 12, border: `1px solid ${t.borderCard}`, maxWidth: 340, width: '100%', boxShadow: '0 32px 80px rgba(0,0,0,0.55)', overflow: 'hidden' }}>
            {/* Red top accent */}
            <div style={{ height: 3, background: 'linear-gradient(to right,#ef4444,#dc2626)' }}/>
            <div style={{ padding: '18px 20px', borderBottom: `1px solid ${t.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Trash2 size={14} color="#fca5a5"/>
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: t.text, fontFamily: '"IBM Plex Sans",sans-serif' }}>Hapus Area</span>
              </div>
              <p style={{ fontSize: 12, color: t.textSub, margin: 0, lineHeight: 1.6 }}>
                Area <code style={{ fontSize: 11, fontFamily: '"IBM Plex Mono",monospace', background: 'rgba(239,68,68,0.08)', color: '#fca5a5', padding: '1px 5px', borderRadius: 3 }}>{delId}</code> akan dihapus permanen.
              </p>
            </div>
            <div style={{ padding: '12px 20px', display: 'flex', gap: 7 }}>
              <Btn variant="ghost"  size="sm" onClick={() => setDelId(null)} fullWidth t={t}>Batal</Btn>
              <Btn variant="delete" size="sm" onClick={handleDel}            fullWidth t={t}><Trash2 size={12}/> Hapus</Btn>
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: '100%' }}>
        {/* ── Page header — refined enterprise ── */}
        <div style={{ background: t.cardbg, borderRadius: 10, padding: '16px 20px', marginBottom: 12, border: `1px solid ${t.borderCard}`, boxShadow: t.shadow, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          {/* Left: title + stats */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {/* Icon mark */}
            <div style={{ width: 38, height: 38, borderRadius: 9, background: 'linear-gradient(135deg,rgba(99,102,241,0.2),rgba(99,102,241,0.08))', border: '1px solid rgba(99,102,241,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <MapPin size={16} color="#818cf8"/>
            </div>
            <div>
              <h1 style={{ fontSize: 16, fontWeight: 800, color: t.text, margin: '0 0 2px', fontFamily: '"IBM Plex Sans","DM Sans",sans-serif', letterSpacing: '-0.025em', lineHeight: 1 }}>
                Area Management
              </h1>
              <p style={{ fontSize: 10, color: t.textMuted, margin: 0, letterSpacing: '0.01em' }}>
                Target DOS · per produk · kuartal · minggu
              </p>
            </div>
            {/* Stat chips */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 8 }}>
              {[
                { label: 'Area',  val: String(areas.length), accent: '#818cf8', bg: 'rgba(99,102,241,0.09)', bdr: 'rgba(99,102,241,0.2)' },
                { label: 'DOS',   val: fmtN(gAll),           accent: '#34d399', bg: 'rgba(16,185,129,0.08)', bdr: 'rgba(16,185,129,0.18)' },
                { label: 'Tahun', val: selYear,              accent: '#c084fc', bg: 'rgba(168,85,247,0.08)', bdr: 'rgba(168,85,247,0.18)' },
              ].map(c => (
                <div key={c.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px 3px 7px', borderRadius: 5, background: c.bg, border: `1px solid ${c.bdr}` }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: c.accent, display: 'block', flexShrink: 0 }}/>
                  <span style={{ fontSize: 9, color: t.textMuted, fontFamily: '"IBM Plex Mono",monospace', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{c.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: c.accent, fontFamily: '"IBM Plex Mono",monospace' }}>{c.val}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Right: controls */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
            <div className="am-year-drop" style={{ position: 'relative' }}>
              <button onClick={() => setShowYearDrop(p => !p)} style={{ display: 'flex', alignItems: 'center', gap: 6, height: 32, padding: '0 11px', borderRadius: 7, background: t.inputBg, border: `1px solid ${t.borderInput}`, color: t.textSub, fontSize: 11, fontFamily: '"IBM Plex Mono",monospace', cursor: 'pointer', fontWeight: 600, letterSpacing: '0.02em' }}>
                <span style={{ fontSize: 9, opacity: 0.5 }}>FY</span> {selYear} <ChevronDown size={10} style={{ opacity: 0.5 }}/>
              </button>
              {showYearDrop && (
                <div style={{ position: 'absolute', top: 'calc(100% + 5px)', right: 0, background: t.modalBg, border: `1px solid ${t.borderCard}`, borderRadius: 8, boxShadow: '0 12px 36px rgba(0,0,0,0.3)', zIndex: 50, overflow: 'hidden', minWidth: 100, animation: 'fadeIn 0.12s ease' }}>
                  {years.map(y => (
                    <button key={y} onClick={() => { setSelYear(y); setShowYearDrop(false); setExpanded(new Set()); setAreaDbTotals({}); }}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 14px', textAlign: 'left', background: y===selYear ? 'rgba(99,102,241,0.1)' : 'transparent', border: 'none', cursor: 'pointer', fontSize: 12, fontFamily: '"IBM Plex Mono",monospace', color: y===selYear ? '#818cf8' : t.textSub, fontWeight: y===selYear ? 700 : 400 }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: y===selYear ? '#818cf8' : 'transparent', border: y===selYear ? 'none' : `1px solid ${t.borderInput}`, display: 'block', flexShrink: 0 }}/>
                      {y}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Btn variant={showAdd ? 'ghost' : 'save'} size="sm" onClick={() => { setShowAdd(p => !p); setNewA({ id:'', name:'', description:'' }); }} t={t}>
              {showAdd ? <><X size={11}/> Batal</> : <><Plus size={11}/> Tambah Area</>}
            </Btn>
          </div>
        </div>

        {/* Table card */}
        <div style={{ background: t.cardbg, borderRadius: 10, overflow: 'hidden', border: `1px solid ${t.borderCard}`, boxShadow: t.shadow }}>
          <div style={{ background: t.headerGrad, padding: '10px 18px', borderBottom: `1px solid ${t.headerBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* Colored accent bar */}
              <div style={{ width: 3, height: 22, borderRadius: 2, background: 'linear-gradient(to bottom,#818cf8,#6366f1)', flexShrink: 0 }}/>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.88)', letterSpacing: '-0.01em', fontFamily: '"IBM Plex Sans",sans-serif' }}>Daftar Area & Target</div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 1, fontFamily: '"IBM Plex Mono",monospace', letterSpacing: '0.02em' }}>4-4-5 WEEKLY · Q1–Q4 · DOS INPUT</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', fontFamily: '"IBM Plex Mono",monospace', letterSpacing: '0.04em' }}>
                {areas.filter(a => expanded.has(a.id)).length} / {areas.length} EXPANDED
              </div>
            </div>
          </div>

          <div style={{ overflowX: 'auto', maxHeight: '78vh', overflowY: 'auto' }}>
            <table style={{ minWidth: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 30 }}>
                <tr style={{ background: t.theadBg }}>
                  <th style={{ ...thS, textAlign: 'left', minWidth: 230, position: 'sticky', left: 0, zIndex: 40, background: t.theadBg, borderRight: `2px solid ${t.border}`, paddingLeft: 16 }}>
                    Area
                  </th>
                  {QUARTERS.map((q, i) => (
                    <th key={q} style={{ ...thS, textAlign: 'center', minWidth: 85, background: 'rgba(99,102,241,0.12)', color: '#a5b4fc', borderLeft: `${i===0?'2px':'1px'} solid rgba(99,102,241,0.2)`, borderRight: i===3?'2px solid rgba(99,102,241,0.2)':'none' }}>{q}</th>
                  ))}
                  <th style={{ ...thS, textAlign: 'center', minWidth: 88, background: 'rgba(99,102,241,0.22)', color: '#c7d2fe', borderLeft: '2px solid rgba(99,102,241,0.35)', borderRight: '2px solid rgba(99,102,241,0.35)' }}>
                    TOTAL
                  </th>
                  <th style={{ ...thS, textAlign: 'center', minWidth: 72 }}>AKSI</th>
                </tr>
              </thead>
              <tbody>
                {showAdd && (
                  <tr style={{ background: t.addRowBg, borderBottom: `2px solid ${t.addRowBorder}` }}>
                    <td style={{ padding: '8px 10px', position: 'sticky', left: 0, background: t.addRowBg, zIndex: 20, borderRight: `2px solid ${t.addRowBorder}`, minWidth: 230 }}>
                      <input
                        value={newA.id||''} placeholder="id_area_baru"
                        onChange={e => setNewA(p => ({ ...p, id: e.target.value.toLowerCase().replace(/\s+/g,'_'), name: e.target.value }))}
                        style={{ width:'100%', padding:'6px 10px', borderRadius:7, fontSize:12, fontWeight:600, fontFamily:'IBM Plex Mono, monospace', background:t.inputBg, border:`1px solid ${t.borderInput}`, color:t.text, outline:'none' }}
                      />
                    </td>
                    {QUARTERS.map((q, i) => (
                      <td key={q} style={{ padding:'6px', background:t.qBg, borderLeft:`${i===0?'2px':'1px'} solid ${t.qBorder}` }}>
                        <span style={{ display:'block', textAlign:'center', fontSize:10, color:t.textFaint }}>—</span>
                      </td>
                    ))}
                    <td style={{ ...cellS, textAlign:'center', background:t.qTotalBg, color:t.textFaint, borderLeft:'2px solid rgba(37,99,235,0.35)', borderRight:'2px solid rgba(37,99,235,0.35)', fontSize:10 }}>—</td>
                    {DERIVED.map(d => (
                      <React.Fragment key={d.key}>
                        {QUARTERS.map(q => <td key={q} style={{ padding:'6px', ...derivedCellStyle(d.key,t) }}/>)}
                        <td style={{ padding:'6px', ...derivedCellStyle(d.key,t,true), borderLeft:`2px solid ${dkBorder(d.key,t)}` }}/>
                      </React.Fragment>
                    ))}
                    <td style={{ padding:'8px 10px' }}>
                      <div style={{ display:'flex', gap:5, justifyContent:'center' }}>
                        <Btn variant="save" size="xs" onClick={handleAdd} t={t}><Save size={10}/> Simpan</Btn>
                        <Btn variant="ghost" size="xs" onClick={() => setShowAdd(false)} t={t}><X size={10}/></Btn>
                      </div>
                    </td>
                  </tr>
                )}

                {!areas.length && !showAdd && (
                  <tr>
                    <td colSpan={30} style={{ padding:'60px 20px', textAlign:'center', background:t.pagebg }}>
                      <div style={{ maxWidth:240, margin:'0 auto', display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
                        <div style={{ width:48, height:48, borderRadius:12, background:t.inputBg, border:`1px solid ${t.borderCard}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                          <MapPin size={20} color={t.textFaint}/>
                        </div>
                        <div style={{ fontSize:14, fontWeight:700, color:t.textSub }}>Belum ada area</div>
                        <div style={{ fontSize:12, color:t.textMuted }}>Klik Tambah Area untuk memulai</div>
                      </div>
                    </td>
                  </tr>
                )}

                {areas.map(area => {
                  const isExp    = expanded.has(area.id);
                  const dbTotals = areaDbTotals[area.id];
                  const rowTot   = QUARTERS.reduce((s, q) => s + (dbTotals?.[q] ?? 0), 0);
                  const rowBg    = isExp ? t.rowExpanded : t.areaRowBg;
                  const stBg     = isExp ? t.rowExpanded : t.stickyBg;

                  return (
                    <React.Fragment key={area.id}>
                      <tr className="area-row" style={{ background: rowBg, borderBottom: `1px solid ${t.border}`, transition: 'background 0.12s' }}>
                        <td className="sticky-col" style={{ padding: '9px 11px', position: 'sticky', left: 0, zIndex: 20, background: stBg, borderRight: `1px solid ${t.border}`, minWidth: 225 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                            <button onClick={() => toggle(area.id)} style={{ width: 22, height: 22, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: `1px solid ${isExp ? 'rgba(99,102,241,0.5)' : t.borderInput}`, flexShrink: 0, transition: 'all 0.14s', background: isExp ? 'rgba(99,102,241,0.18)' : t.inputBg, color: isExp ? '#a5b4fc' : t.textMuted, boxShadow: isExp ? '0 0 0 2px rgba(99,102,241,0.12)' : 'none' }}>
                              {isExp ? <ChevronDown size={11}/> : <ChevronRight size={11}/>}
                            </button>
                            <div style={{ overflow: 'hidden' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                <span style={{ fontSize: 11, fontWeight: 700, fontFamily: '"IBM Plex Mono",monospace', color: t.text, letterSpacing: '0.01em' }}>{area.id}</span>
                                {isExp && !dbTotals && <Spinner size={10}/>}
                                {isExp && <span style={{ fontSize: 7, color: '#818cf8', fontWeight: 700, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', padding: '1px 4px', borderRadius: 3, letterSpacing: '0.06em', textTransform: 'uppercase' }}>live</span>}
                              </div>
                              {area.name && area.name !== area.id && (
                                <div style={{ fontSize: 10, color: t.textMuted, marginTop: 1 }}>{area.name}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        {QUARTERS.map((q, i) => {
                          const val = dbTotals?.[q] ?? 0;
                          return (
                            <td key={q} style={{ padding: '9px 11px', background: t.qBg, borderLeft: `${i===0?'2px':'1px'} solid ${t.qBorder}`, borderRight: i===3?`2px solid ${t.qBorder}`:'none' }}>
                              <span style={{ display: 'block', textAlign: 'right', fontFamily: 'IBM Plex Mono, monospace', fontWeight: 700, fontSize: 12, color: !dbTotals ? t.textFaint : val>0 ? t.qText : t.textFaint }}>
                                {!dbTotals ? '—' : val>0 ? fmtN(val) : <span style={{ fontSize:10 }}>0</span>}
                              </span>
                            </td>
                          );
                        })}
                        <td style={{ ...cellS, textAlign: 'right', fontWeight: 800, background: t.qTotalBg, color: dbTotals ? t.qTotalText : t.textFaint, borderLeft: '2px solid rgba(37,99,235,0.35)', borderRight: '2px solid rgba(37,99,235,0.35)' }}>
                          {dbTotals ? fmtN(rowTot) : '—'}
                        </td>
                        <td style={{ padding: '8px 10px', background: rowBg }}>
                          <div style={{ display: 'flex', gap: 5, justifyContent: 'center' }}>
                            <Btn variant="delete" size="xs" onClick={() => setDelId(area.id)} t={t}><Trash2 size={10}/></Btn>
                          </div>
                        </td>
                      </tr>
                      {isExp && (
                        <ExpandedProductRows
                          areaId={area.id} year={selYear}
                          t={t}
                          onAreaTotalsLoaded={handleAreaTotalsLoaded}
                        />
                      )}
                    </React.Fragment>
                  );
                })}

                {!!areas.length && (
                  <tr style={{ background: t.grandBg, position: 'sticky', bottom: 0, zIndex: 20, borderTop: `2px solid ${t.border}` }}>
                    <td style={{ ...cellS, position: 'sticky', left: 0, zIndex: 30, background: t.grandBg, borderRight: `2px solid ${t.border}` }}>
                      <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                        <span style={{ fontSize:10, fontWeight:800, letterSpacing:'0.08em', textTransform:'uppercase' as const, color:t.grandText, fontFamily:'"IBM Plex Mono",monospace' }}>TOTAL</span>
                        <span style={{ fontSize:8, color:t.textFaint, fontWeight:400, fontFamily:'"IBM Plex Mono",monospace', letterSpacing:'0.04em' }}>EXPANDED</span>
                      </div>
                    </td>
                    {QUARTERS.map((q, i) => (
                      <td key={q} style={{ ...cellS, textAlign:'right', fontWeight:700, background:t.grandQBg, color:t.grandQText, borderLeft:`${i===0?'2px':'1px'} solid ${t.qBorder}`, borderRight:i===3?`2px solid ${t.qBorder}`:'none' }}>
                        {fmtN(gTotal[q])}
                      </td>
                    ))}
                    <td style={{ ...cellS, textAlign:'right', fontWeight:800, background:t.grandTotBg, color:'#fff', borderLeft:'2px solid rgba(37,99,235,0.4)', borderRight:'2px solid rgba(37,99,235,0.4)' }}>
                      {fmtN(gAll)}
                    </td>
                    <td style={{ background:t.grandBg }}/>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}