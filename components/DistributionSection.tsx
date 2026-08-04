'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, ReferenceLine,
  PieChart, Pie, Legend,
} from 'recharts';
import {
  TrendingUp, Users, Package, Store,
  Target, CheckCircle, Activity,
  Map as MapIcon, RefreshCw,
  ClipboardList, ClipboardCheck, Download,
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
interface AchSalesmanProductRow {
  salesman:        string;
  product:         string;
  total_plan:      number;
  total_actual:    number;
  total_av_in:     number;
  total_ec:        number;
  total_av_out:    number;
  achievement_pct: number;
  outlet_count:    number;
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
  achievementSalesmanProduct:  AchSalesmanProductRow[]; 
}

// ─── Props dari page.tsx ──────────────────────────────────────────────────────
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

// NOTE:
// Fungsi reaggregate() client-side SUDAH DIHAPUS.
// Dulu di sini ada agregasi ulang (SUM manual) yang membuat angka Plan/Actual/
// Av-In/EC/Av-Out di UI berbeda dari hasil query server (route.ts), karena server
// melakukan dedup per outlet lewat CTE outlet_agg (MAX(CASE WHEN metric>0...)),
// sedangkan reaggregate() SUM baris mentah — berpotensi double count outlet yang
// sama di beberapa baris (misal lintas minggu / lintas tipe outlet).
//
// Sekarang: fetch ke /api/distribution HANYA terjadi ketika tombol "Terapkan"
// ditekan (loadData) atau saat areaFilter berganti (reset). Filter dropdown
// (Produk / Tipe Outlet / Salesman) TIDAK auto-fetch lagi begitu dipilih —
// nilainya cuma disimpan di state lokal dan baru dikirim ke server saat
// "Terapkan" ditekan. Ini sengaja dihilangkan (dulu ada useEffect yang watch
// productFilter/outletTypeFilter/salesmanFilter dan langsung fetch) karena:
//   1) User experience: filter dropdown ikut nunggu tombol, konsisten dengan
//      filter minggu yang juga baru jalan pas "Terapkan" ditekan.
//   2) Bug infinite-loop: fetchData sempat dimasukkan ke dependency array
//      useEffect tsb. Karena fetchData (useCallback) bergantung pada
//      onDataLoaded/setLoading dari props, dan kalau parent tidak
//      me-memoize callback itu, fetchData dapat referensi BARU setiap kali
//      parent re-render -> useEffect ke-trigger lagi -> fetch lagi -> parent
//      re-render lagi -> ...berulang terus tanpa henti. Menghapus effect ini
//      menghilangkan sumber loop tersebut sekaligus.

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

function KpiCard({ label, value, sub, icon: Icon, color, theme }: { label: string; value: string; sub?: string; icon: any; color: string; theme: Theme }) {
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
      {sub && <div style={{ fontSize: 9, color: t.textMuted, fontFamily: 'IBM Plex Mono,monospace' }}>{sub}</div>}
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

// ─── Distribution Tabs ────────────────────────────────────────────────────────
function DistributionTabs({
  data,
  theme,
}: {
  data: DistData;
  theme: Theme;
}) {
  const t = tk[theme];
  const [tabValue, setTabValue] = useState(0);

  const tabs = [
    { label: 'Achievement',    icon: Target,   color: '#10b981', content: <AchievementContent data={data} theme={theme} /> },
    { label: 'Trend Mingguan', icon: Activity, color: '#3b82f6', content: <TrendContent       data={data} theme={theme} /> },
    { label: 'Outlet',         icon: Store,    color: '#f59e0b', content: <CoverageContent    data={data} theme={theme} /> },
  ];

  return (
    <div style={{ width: '100%', background: t.cardBg, border: `1px solid ${t.borderCard}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ display: 'flex', borderBottom: `1px solid ${t.border}`, background: t.tableHeadBg, overflowX: 'auto', position: 'sticky', top: 0, zIndex: 40 }}>
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
}: {
  data: DistData;
  theme: Theme;
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
      <div style={{ position: 'sticky', top: TAB_BAR_H, zIndex: 35, background: t.cardBg, paddingTop: 4, paddingBottom: 4 }}>
        <div style={{ display: 'flex', gap: 4, background: t.tabBg, borderRadius: 8, padding: 3, width: 'fit-content' }}>
          {tabs.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setView(id)}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, fontFamily: 'IBM Plex Mono,monospace', border: 'none', cursor: 'pointer', background: view === id ? t.tabActive : 'transparent', color: view === id ? t.tabActiveText : t.textMuted, transition: 'all 0.15s' }}>
              <Icon size={11} />{label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: t.accordionBg, border: `1px solid ${t.border}`, borderRadius: 10, padding: '12px 14px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: t.text, fontFamily: 'IBM Plex Mono,monospace', marginBottom: 10 }}>
          Achievement per Salesman × Produk
        </div>
        {data.achievementSalesmanProduct.length === 0 ? (
          <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.textMuted, fontSize: 11, fontFamily: 'IBM Plex Mono,monospace' }}>
            Belum ada data.
          </div>
        ) : (
          <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 480 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'IBM Plex Mono,monospace' }}>
              <thead>
                <tr>
                  {['Salesman', 'Produk', 'Plan', 'Aktual', 'Av-In', 'EC', 'Av-Out', 'Achievement', 'Outlet'].map((h, i) => (
                    <th key={i} style={{ padding: '6px 10px', textAlign: i > 1 ? 'right' : 'left', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: t.tableHeadText, borderBottom: `1px solid ${t.border}`, whiteSpace: 'nowrap', position: 'sticky', top: 0, zIndex: 20, background: t.tableHeadBg }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(() => {
                  // Data dari server sudah per (salesman, product) — tinggal
                  // dikelompokkan untuk tampilan bergaya pivot (nama salesman
                  // cuma muncul di baris pertama grup + baris Total di akhir).
                  const groups = new Map<string, AchSalesmanProductRow[]>();
                  data.achievementSalesmanProduct.forEach(r => {
                    const key = r.salesman || '-';
                    if (!groups.has(key)) groups.set(key, []);
                    groups.get(key)!.push(r);
                  });

                  const rendered: React.ReactNode[] = [];
                  const entries = Array.from(groups.entries());

                  entries.forEach(([salesman, rows], gi) => {
                    const totalPlan   = rows.reduce((s, r) => s + r.total_plan,   0);
                    const totalActual = rows.reduce((s, r) => s + r.total_actual, 0);
                    const totalAvIn   = rows.reduce((s, r) => s + r.total_av_in,  0);
                    const totalEc     = rows.reduce((s, r) => s + r.total_ec,     0);
                    const totalAvOut  = rows.reduce((s, r) => s + r.total_av_out, 0);
                    const totalPct    = totalPlan > 0 ? (totalAvOut / totalPlan) * 100 : 0;

                    rows.forEach((r, ri) => {
                      rendered.push(
                        <tr key={`${salesman}-${r.product}`}
                          style={{ background: ri % 2 === 1 ? t.rowAlt : 'transparent' }}
                          onMouseEnter={e => (e.currentTarget.style.background = t.rowHover)}
                          onMouseLeave={e => (e.currentTarget.style.background = ri % 2 === 1 ? t.rowAlt : 'transparent')}>
                          <td style={{ padding: '6px 10px', fontSize: 11, fontWeight: ri === 0 ? 700 : 400, color: ri === 0 ? t.text : t.textSub, whiteSpace: 'nowrap' }}>
                            {ri === 0 ? salesman : ''}
                          </td>
                          <td style={{ padding: '6px 10px', fontSize: 10, color: t.textSub, whiteSpace: 'nowrap' }}>{r.product || '—'}</td>
                          <td style={{ padding: '6px 10px', fontSize: 11, color: t.textSub, textAlign: 'right' }}>{fmtN(r.total_plan)}</td>
                          <td style={{ padding: '6px 10px', fontSize: 11, color: t.textSub, textAlign: 'right' }}>{fmtN(r.total_actual)}</td>
                          <td style={{ padding: '6px 10px', fontSize: 10, color: '#3b82f6', textAlign: 'right' }}>{fmtN(r.total_av_in)}</td>
                          <td style={{ padding: '6px 10px', fontSize: 10, color: '#10b981', textAlign: 'right' }}>{fmtN(r.total_ec)}</td>
                          <td style={{ padding: '6px 10px', fontSize: 11, fontWeight: 700, color: t.text, textAlign: 'right' }}>{fmtN(r.total_av_out)}</td>
                          <td style={{ padding: '6px 10px', textAlign: 'right' }}><PBar pct={r.achievement_pct} theme={theme} /></td>
                          <td style={{ padding: '6px 10px', fontSize: 10, color: t.textSub, textAlign: 'right' }}>
                            {(r.outlet_count ?? 0) > 0 ? fmtN(r.outlet_count) : '—'}
                          </td>
                        </tr>
                      );
                    });

                    rendered.push(
                      // <tr key={`${salesman}-total`} style={{ background: t.tableHeadBg, borderTop: `1px solid ${t.border}`, borderBottom: gi < entries.length - 1 ? `2px solid ${t.border}` : 'none' }}>
                      //   <td colSpan={2} style={{ padding: '6px 10px', fontSize: 11, fontWeight: 700, color: t.text }}>{salesman} Total</td>
                      //   <td style={{ padding: '6px 10px', fontSize: 11, fontWeight: 700, color: t.textSub, textAlign: 'right' }}>{fmtN(totalPlan)}</td>
                      //   <td style={{ padding: '6px 10px', fontSize: 11, fontWeight: 700, color: t.textSub, textAlign: 'right' }}>{fmtN(totalActual)}</td>
                      //   <td style={{ padding: '6px 10px', fontSize: 10, fontWeight: 700, color: '#3b82f6', textAlign: 'right' }}>{fmtN(totalAvIn)}</td>
                      //   <td style={{ padding: '6px 10px', fontSize: 10, fontWeight: 700, color: '#10b981', textAlign: 'right' }}>{fmtN(totalEc)}</td>
                      //   <td style={{ padding: '6px 10px', fontSize: 11, fontWeight: 700, color: t.text, textAlign: 'right' }}>{fmtN(totalAvOut)}</td>
                      //   <td style={{ padding: '6px 10px', textAlign: 'right' }}><AchBadge pct={totalPct} theme={theme} /></td>
                      //   <td style={{ padding: '6px 10px' }} />
                      // </tr>
                    );
                  });

                  return rendered;
                })()}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{ border: `1px solid ${t.border}`, borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 480 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'IBM Plex Mono,monospace' }}>
            <thead>
              <tr>
                {(() => {
                  const headers =
                    view === 'salesman' ? ['#', 'Salesman', 'Plan', 'Av-Out', 'Achievement', 'Outlet'] :
                    view === 'product'  ? ['#', 'Produk', 'Kategori', 'Plan', 'Av-Out', 'Achievement'] :
                                         ['#', 'Kota · Kecamatan', 'Plan', 'Av-Out', 'Achievement', 'Outlet'];
                  return headers.map((h, i) => (
                    <th key={i} style={{ padding: '8px 12px', textAlign: i > 1 ? 'right' : 'left', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: t.tableHeadText, borderBottom: `1px solid ${t.border}`, whiteSpace: 'nowrap', position: 'sticky', top: 0, zIndex: 20, background: t.tableHeadBg }}>{h}</th>
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
        <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 420 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'IBM Plex Mono,monospace' }}>
            <thead>
              <tr>
                {['Minggu','Plan','Actual','Av-In','EC','Av-Out','Achievement','Outlet'].map((h, i) => (
                  <th key={i} style={{ padding: '8px 12px', textAlign: i === 0 ? 'left' : 'right', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: t.tableHeadText, borderBottom: `1px solid ${t.border}`, whiteSpace: 'nowrap', position: 'sticky', top: 0, zIndex: 20, background: t.tableHeadBg }}>{h}</th>
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
                    <td style={{ padding: '7px 12px', fontSize: 10, color: t.textSub, textAlign: 'right' }}>{r.outlet_count || '—'}</td>
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
function CoverageContent({
  data,
  theme,
}: {
  data: DistData;
  theme: Theme;
}) {
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
        <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 360 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'IBM Plex Mono,monospace' }}>
            <thead>
              <tr>
                {['Tipe Outlet','Plan','Actual','Av-In','EC','Av-Out','Achievement','Outlet'].map((h, i) => (
                  <th key={i} style={{ padding: '7px 12px', textAlign: i === 0 ? 'left' : 'right', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: t.tableHeadText, borderBottom: `1px solid ${t.border}`, whiteSpace: 'nowrap', position: 'sticky', top: 0, zIndex: 20, background: t.tableHeadBg }}>{h}</th>
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
                  <td style={{ padding: '7px 12px', fontSize: 11, color: t.textSub, textAlign: 'right' }}>{fmtN(r.total_actual)}</td>
                  <td style={{ padding: '7px 12px', fontSize: 11, color: '#3b82f6', textAlign: 'right' }}>{fmtN(r.total_av_in)}</td>
                  <td style={{ padding: '7px 12px', fontSize: 11, color: '#10b981', textAlign: 'right' }}>{fmtN(r.total_ec)}</td>
                  <td style={{ padding: '7px 12px', fontSize: 11, fontWeight: 700, color: t.text, textAlign: 'right' }}>{fmtN(r.total_av_out)}</td>
                  <td style={{ padding: '7px 12px', textAlign: 'right' }}><AchBadge pct={r.achievement_pct} theme={theme} /></td>
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
  achievementSalesmanProduct: [],
};

const WEEKS_ARR = Array.from({ length: 52 }, (_, i) => i + 1);
const TAB_BAR_H = 42;
const SUB_TAB_H = 38;

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

  // ── Snapshot filter yang TERAKHIR SUKSES di-fetch (minggu + dropdown).
  //    Dipakai untuk menghitung "unapplied": filter di layar sudah diubah
  //    tapi belum ditekan "Terapkan", sehingga data yang tampil belum sesuai.
  const [appliedFilters, setAppliedFilters] = useState({
    weekStart: weekStartProp,
    weekEnd:   weekEndProp,
    product:   '',
    outletType:'',
    salesman:  '',
  });

  const unapplied = loaded && (
    weekStart         !== appliedFilters.weekStart  ||
    weekEnd           !== appliedFilters.weekEnd    ||
    productFilter      !== appliedFilters.product    ||
    outletTypeFilter   !== appliedFilters.outletType ||
    salesmanFilter      !== appliedFilters.salesman
  );

  // Dot animasi "mengambil data" saat loading (sinkron dengan filter bar utama)
  const [dotStep, setDotStep] = useState(0);
  useEffect(() => {
    if (loading) {
      const id = setInterval(() => setDotStep(s => (s + 1) % 3), 400);
      return () => clearInterval(id);
    }
  }, [loading]);

  // Dropdown filter (product/outletType/salesman/city) tidak dari cachedData
  // saja — kita simpan pilihan opsi dari load PERTAMA (tanpa filter) supaya
  // opsi dropdown tidak menyusut begitu salah satu filter lain aktif.
  const [productOptions,    setProductOptions]    = useState<string[]>([]);
  const [outletTypeOptions, setOutletTypeOptions] = useState<string[]>([]);
  const [salesmanOptions,   setSalesmanOptions]   = useState<string[]>([]);

  // FIX: dulu isInitialLoad dihitung dari `!loaded` (prop dari PARENT).
  // Masalahnya `loaded` itu state punya page.tsx, bukan state lokal komponen
  // ini — kalau parent sudah punya loaded=true duluan (misal karena pindah
  // tab lalu balik lagi, atau area yang sama sudah pernah dimuat di sesi
  // yang sama), klik "Terapkan" PERTAMA di komponen ini langsung dianggap
  // "bukan initial load", sehingga productOptions/outletTypeOptions/
  // salesmanOptions TIDAK PERNAH diisi sama sekali -> dropdown filter tidak
  // pernah muncul. Sekarang dipakai flag LOKAL (optionsReadyRef) yang murni
  // menandai "apakah komponen ini sendiri sudah pernah berhasil mengisi
  // opsi dropdown", lepas dari state `loaded` milik parent.
  const optionsReadyRef = useRef(false);

  // Ref untuk mencegah race condition: kalau user ganti filter dengan cepat,
  // hanya response fetch TERAKHIR yang boleh commit ke state.
  const requestSeq = useRef(0);

  useEffect(() => {
    setProductFilter('');
    setOutletTypeFilter('');
    setSalesmanFilter('');
    setProductOptions([]);
    setOutletTypeOptions([]);
    setSalesmanOptions([]);
    optionsReadyRef.current = false; // area ganti -> opsi dropdown harus di-fetch ulang
    // reset snapshot juga supaya indikator "Belum diterapkan" tidak salah nyala
    setAppliedFilters({ weekStart, weekEnd, product: '', outletType: '', salesman: '' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [areaFilter]);

  const resetFilters = useCallback(() => {
    setProductFilter('');
    setOutletTypeFilter('');
    setSalesmanFilter('');
  }, []);

  const normalizeResponse = (raw: any): DistData => {
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
    raw.achievementSalesmanProduct = (raw.achievementSalesmanProduct ?? []).map((r: any) => ({
      ...r,
      total_plan:      parseFloat(r.total_plan      ?? 0),
      total_actual:    parseFloat(r.total_actual    ?? 0),
      total_av_in:     parseFloat(r.total_av_in     ?? 0),
      total_ec:        parseFloat(r.total_ec        ?? 0),
      total_av_out:    parseFloat(r.total_av_out    ?? 0),
      achievement_pct: parseFloat(r.achievement_pct ?? 0),
      outlet_count:    parseInt(r.outlet_count      ?? 0),
    }));
    return raw as DistData;
  };

  // fetchData: satu-satunya jalur ambil data. Selalu request langsung ke
  // server dengan filter aktif sebagai query param — TIDAK ADA agregasi ulang
  // di client. `isInitialLoad` menandai fetch pertama (tanpa filter product/
  // outletType/salesman) supaya opsi dropdown diisi dari situ.
  const fetchData = useCallback(async (opts: {
    product?:    string;
    outletType?: string;
    salesman?:   string;
    isInitialLoad?: boolean;
  } = {}) => {
    if (!areaFilter) return;

    const mySeq = ++requestSeq.current;
    setLoading(true);
    try {
      const p = new URLSearchParams({ weekStart: String(weekStart), weekEnd: String(weekEnd) });
      p.append('area', areaFilter);
      if (opts.product)    p.append('product', opts.product);
      if (opts.outletType) p.append('outletType', opts.outletType);
      if (opts.salesman)   p.append('salesman', opts.salesman);

      const r = await fetch(`/api/distribution?${p}`);
      if (!r.ok) return;
      const j = await r.json();
      if (!j.success) return;

      // Kalau ada fetch lebih baru yang sudah jalan, buang hasil yang telat ini.
      if (mySeq !== requestSeq.current) return;

      const data = normalizeResponse(j.data);

      if (opts.isInitialLoad) {
        setProductOptions(
          Array.from(new Set(data.achievementProduct.map(r => r.product).filter(Boolean))).sort() as string[]
        );
        setOutletTypeOptions(
          Array.from(new Set(data.outletCountByType.map(r => r.outlet_type).filter(Boolean))).sort() as string[]
        );
        setSalesmanOptions(
          Array.from(new Set(data.achievementSalesman.map(r => r.salesman).filter(Boolean))).sort() as string[]
        );
        optionsReadyRef.current = true;
      }

      onDataLoaded?.(data);
      // Snapshot disimpan HANYA setelah fetch sukses → sumber kebenaran untuk
      // indikator "Belum diterapkan".
      setAppliedFilters({
        weekStart, weekEnd,
        product:    opts.product    ?? '',
        outletType: opts.outletType ?? '',
        salesman:   opts.salesman   ?? '',
      });
    } finally {
      if (mySeq === requestSeq.current) setLoading(false);
    }
  }, [weekStart, weekEnd, areaFilter, onDataLoaded, setLoading]);

  // Tombol "Terapkan" → SATU-SATUNYA pemicu fetch untuk minggu maupun filter
  // dropdown (Produk / Tipe Outlet / Salesman). Nilai filter dropdown yang
  // sedang dipilih langsung dikirim bersamaan di sini — tidak ada lagi
  // auto-fetch terpisah saat dropdown berubah.
  //
  // `isInitialLoad` cuma true di load PERTAMA (saat `loaded` masih false),
  // supaya opsi dropdown (productOptions dkk) diisi dari situ dan tidak
  // menyusut/reset tiap kali "Terapkan" ditekan ulang dengan filter aktif.
  const loadData = useCallback(() => {
    fetchData({
      product:       productFilter    || undefined,
      outletType:    outletTypeFilter || undefined,
      salesman:      salesmanFilter   || undefined,
      isInitialLoad: !optionsReadyRef.current,
    });
  }, [fetchData, productFilter, outletTypeFilter, salesmanFilter]);

  const data     = cachedData ?? EMPTY_DATA;
  const s        = data.summary;
  const areaName = areas.find(a => a.id === areaFilter)?.name;

  const hasActiveFilter = !!(productFilter || outletTypeFilter || salesmanFilter);

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
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fbPulseDot { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
      `}</style>

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

          {/* ── Indikator status: dot animasi saat loading, atau "Belum diterapkan" saat filter berubah ── */}
          {loading ? (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{
                    width: 4, height: 4, borderRadius: '50%', background: '#4ade80',
                    transition: 'opacity 0.2s', opacity: i === dotStep ? 1 : 0.25,
                  }} />
                ))}
              </div>
              <div style={{
                fontSize: 9, fontFamily: 'IBM Plex Mono,monospace', color: '#4ade80', letterSpacing: '0.06em',
                background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)',
                borderRadius: 3, padding: '0 6px', height: 16, display: 'flex', alignItems: 'center',
              }}>
                mengambil data
              </div>
            </div>
          ) : unapplied ? (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: t.warnBg, border: `1px solid ${t.warnBorder}`,
              borderRadius: 3, padding: '0 7px', height: 18,
            }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: t.warnText, animation: 'fbPulseDot 1.3s ease-in-out infinite' }} />
              <span style={{ fontSize: 9, fontFamily: 'monospace', color: t.warnText, fontWeight: 700, letterSpacing: '0.02em' }}>Belum diterapkan</span>
            </div>
          ) : null}

          <div style={{ position: 'relative' }}>
            <button onClick={loadData} disabled={loading}
              style={{ height: 26, padding: '0 12px', borderRadius: 5, background: '#1c9706', border: 'none', color: '#fff', fontSize: 10, fontWeight: 700, fontFamily: 'IBM Plex Mono,monospace', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: 5 }}>
              {loading && <RefreshCw size={11} style={{ animation: 'spin 1s linear infinite' }} />}
              {loading ? 'Memuat...' : 'Terapkan'}
            </button>
            {unapplied && !loading && (
              <span style={{ position: 'absolute', top: -3, right: -3, width: 7, height: 7, borderRadius: '50%', background: t.warnText, border: `1.5px solid ${t.cardBg}` }} />
            )}
          </div>
        </div>
      </div>

      {/* {loaded && hasActiveFilter && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap',
          padding: '6px 12px', borderRadius: 8,
          background: t.tabActive, border: `1px solid rgba(28,151,6,0.2)`,
          fontSize: 10, fontFamily: 'IBM Plex Mono,monospace', color: t.tabActiveText,
        }}>
          <Activity size={11} />
          <span style={{ color: t.textSub }}>Filter dipilih:</span>
          {productFilter    && <FilterBadge label="Produk"      value={productFilter}    onClear={() => setProductFilter('')}    theme={theme} />}
          {outletTypeFilter && <FilterBadge label="Tipe Outlet" value={outletTypeFilter} onClear={() => setOutletTypeFilter('')} theme={theme} />}
          {salesmanFilter   && <FilterBadge label="Salesman"    value={salesmanFilter}   onClear={() => setSalesmanFilter('')}   theme={theme} />}
          <button onClick={resetFilters} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: t.textMuted, cursor: 'pointer', fontSize: 11, padding: '0 4px', fontFamily: 'IBM Plex Mono,monospace' }}>
            Reset Semua
          </button>
          <span style={{ color: t.textMuted, fontSize: 9 }}>· klik Terapkan untuk memuat</span>
        </div>
      )} */}

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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
            <KpiCard label="Total Plan"          value={fmtN(s.total_plan)}                     sub="Plan distribusi"   icon={ClipboardList}  color="#3b82f6" theme={theme} />
            <KpiCard label="Total Actual"        value={fmtN(s.total_actual)}                   sub="Aktual distribusi" icon={ClipboardCheck} color="#10b981" theme={theme} />
            <KpiCard label="Total Av-In"         value={fmtN(s.total_av_in)}                    sub="Av-In"             icon={Download}       color="#3b82f6" theme={theme} />
            <KpiCard label="EC"                  value={fmtN(s.total_ec)}                       sub="Effective Call"    icon={TrendingUp}     color="#0d9488" theme={theme} />
            <KpiCard label="Total Av-Out"        value={fmtN(s.total_av_out)}                   sub="Av-Out"            icon={CheckCircle}    color="#10b981" theme={theme} />
            <KpiCard label="Total Outlet"        value={fmtN(s.total_outlets)}                  sub="Outlet terjangkau" icon={Store}          color="#3b82f6" theme={theme} />
            <KpiCard label="Total Salesman"      value={fmtN(s.total_salesmen)}                 sub="Salesman aktif"    icon={Users}          color="#8b5cf6" theme={theme} />
            <KpiCard label="Total Produk"        value={fmtN(s.total_products)}                 sub="terdistribusi"     icon={Package}        color="#f59e0b" theme={theme} />
            <KpiCard label="Overall Achievement" value={`${s.overall_achievement.toFixed(1)}%`} sub="Av-Out / Plan"     icon={Target}         color={achColor(s.overall_achievement)} theme={theme} />
          </div>

          <DistributionTabs
            data={data}
            theme={theme}
          />
        </>
      )}
    </div>
  );
}