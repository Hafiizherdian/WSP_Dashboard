'use client';

import React, { useState, useMemo } from 'react';
import { PiutangRecord, WeeklySales } from '@/types/sales';
import {
  Search, CalendarRange, ArrowUpDown, CreditCard,
  DollarSign, Calendar, BanknoteArrowDown, Percent,
  BanknoteX,
} from 'lucide-react';

type Theme = 'light' | 'dark';

const tk = {
  dark: {
    pagebg:      '#07090e',
    cardbg:      '#0e1118',
    card1bg:'#0d1a28', card1border:'#1a3a5c', card1text:'#7eb8f7', card1accent:'#3b82f6',
    card2bg:'#0a1d14', card2border:'#1a4530', card2text:'#5edba8', card2accent:'#10b981',
    card3bg:'#1a1108', card3border:'#3d2b08', card3text:'#f5d060', card3accent:'#f59e0b',
    card4bg:'#290f0f', card4border:'#5c1a1a', card4text:'#fca5a5', card4accent:'#ef4444',
    card5bg:'#170f24', card5border:'#3b225c', card5text:'#c084fc', card5accent:'#a855f7', // Card Purple
    card6bg:'#091c21', card6border:'#164652', card6text:'#67e8f9', card6accent:'#06b6d4', // Card Cyan
    border:      'rgba(255,255,255,0.055)',
    borderCard:  'rgba(255,255,255,0.075)',
    borderInput: 'rgba(255,255,255,0.09)',
    tableHead:   '#0b0d13',
    tableAlt:    'rgba(255,255,255,0.015)',
    rowHover:    'rgba(255,255,255,0.04)',
    text:        'rgba(255,255,255,0.92)',
    textSub:     'rgba(255,255,255,0.52)',
    textMuted:   'rgba(255,255,255,0.28)',
    textFaint:   'rgba(255,255,255,0.13)',
    inputBg:     'rgba(255,255,255,0.035)',
    shadow:      'none',
    green:  { bg:'rgba(16,185,129,0.09)',  text:'#34d399', border:'rgba(16,185,129,0.2)'  },
    yellow: { bg:'rgba(245,158,11,0.07)',  text:'#fbbf24', border:'rgba(245,158,11,0.18)' },
    red:    { bg:'rgba(239,68,68,0.08)',   text:'#fca5a5', border:'rgba(239,68,68,0.18)'  },
    blue:   { bg:'rgba(59,130,246,0.1)',   text:'#93c5fd', border:'rgba(59,130,246,0.22)' },
    pink:   { bg:'rgba(236,72,153,0.08)',  text:'#f9a8d4', border:'rgba(236,72,153,0.2)'  },
    purple: { bg:'rgba(168,85,247,0.08)',  text:'#c084fc', border:'rgba(168,85,247,0.2)'  }, // Baru
    cyan:   { bg:'rgba(6,182,212,0.08)',   text:'#67e8f9', border:'rgba(6,182,212,0.2)'   }, // Baru
  },
  light: {
    pagebg:      '#eef1f7',
    cardbg:      '#ffffff',
    card1bg:'#eff6ff', card1border:'#bfdbfe', card1text:'#1d4ed8', card1accent:'#3b82f6',
    card2bg:'#f0fdf4', card2border:'#bbf7d0', card2text:'#15803d', card2accent:'#10b981',
    card3bg:'#fefce8', card3border:'#fde68a', card3text:'#92400e', card3accent:'#f59e0b',
    card4bg:'#fef2f2', card4border:'#fecaca', card4text:'#b91c1c', card4accent:'#ef4444',
    card5bg:'#faf5ff', card5border:'#e9d5ff', card5text:'#6b21a8', card5accent:'#a855f7', // Card Purple
    card6bg:'#ecfeff', card6border:'#c5f6fa', card6text:'#0e7490', card6accent:'#06b6d4', // Card Cyan
    border:      'rgba(0,0,0,0.065)',
    borderCard:  'rgba(0,0,0,0.08)',
    borderInput: 'rgba(0,0,0,0.1)',
    tableHead:   '#f8fafc',
    tableAlt:    'rgba(0,0,0,0.018)',
    rowHover:    'rgba(0,0,0,0.035)',
    text:        '#0f172a',
    textSub:     '#475569',
    textMuted:   '#94a3b8',
    textFaint:   '#cbd5e1',
    inputBg:     'rgba(0,0,0,0.03)',
    shadow:      '0 1px 3px rgba(0,0,0,0.06)',
    green:  { bg:'rgba(28, 239, 91, 0.17)',  text:'#15803d', border:'#bbf7d0' },
    yellow: { bg:'rgba(244, 203, 38, 0.15)',  text:'#92400e', border:'#fde68a' },
    red:    { bg:'rgba(241, 42, 42, 0.11)',  text:'#b91c1c', border:'#fecaca' },
    blue:   { bg:'rgba(37,99,235,0.07)',  text:'#1d4ed8', border:'rgba(37,99,235,0.2)'   },
    pink:   { bg:'rgba(219,39,119,0.07)', text:'#9d174d', border:'rgba(219,39,119,0.18)' },
    purple: { bg:'rgba(168,85,247,0.06)', text:'#6b21a8', border:'rgba(168,85,247,0.15)' }, // Baru
    cyan:   { bg:'rgba(6, 181, 212, 0.1)',  text:'#0e7490', border:'rgba(6,182,212,0.18)' }, // Baru
  },
} as const;

type TK = typeof tk[keyof typeof tk];

const fIDR = (n: number) =>
  n.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

function KpiCard({
  label, labelColor, value, sub, icon, iconBg, iconColor, t, cardbg,
}: {
  label: string; labelColor: string; value: string; sub?: string;
  icon: React.ReactNode; iconBg: string; iconColor: string; t: TK; cardbg: string;
}) {
  return (
    <div style={{
      background: cardbg, border: `1px solid ${t.borderCard}`, borderRadius: 13,
      padding: '14px 16px 12px', display: 'flex', flexDirection: 'column', gap: 6,
      boxShadow: t.shadow, position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 9, fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.1em', color: labelColor, fontWeight: 700 }}>
          {label}
        </span>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: iconColor }}>
          {icon}
        </div>
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color: t.text, fontFamily: 'IBM Plex Mono, monospace', letterSpacing: '-0.03em', lineHeight: 1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 10, color: t.textMuted, fontFamily: 'IBM Plex Mono, monospace' }}>{sub}</div>}
    </div>
  );
}

function FilterSelect({
  label, accentColor = '#3b82f6', value, onChange, children, t,
}: {
  label: string; accentColor?: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  children: React.ReactNode; t: TK;
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'stretch',
      border: `1px solid ${t.borderInput}`, borderRadius: 8, overflow: 'hidden',
    }}>
      <span style={{
        padding: '6px 10px', fontSize: 10, fontFamily: 'IBM Plex Mono, monospace',
        textTransform: 'uppercase' as const, letterSpacing: '.07em', fontWeight: 600,
        color: accentColor, background: `${accentColor}18`,
        borderRight: `1px solid ${t.borderInput}`,
        display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', flexShrink: 0,
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
          cursor: 'pointer', flex: 1, minWidth: 0,
          appearance: 'none', width: '100%',
        }}
      >
        {children}
      </select>
    </div>
  );
}

function SearchBar({ value, onChange, t }: {
  value: string; onChange: (v: string) => void; t: TK;
}) {
  const ACCENT = '#6366f1';
  return (
    <div style={{
      display: 'flex', alignItems: 'stretch',
      border: `1px solid ${value ? ACCENT + '66' : t.borderInput}`,
      borderRadius: 8, overflow: 'hidden', transition: 'border-color 0.15s',
    }}>
      <span style={{
        padding: '6px 10px', fontSize: 10, fontFamily: 'IBM Plex Mono, monospace',
        textTransform: 'uppercase' as const, letterSpacing: '.07em', fontWeight: 600,
        color: ACCENT, background: `${ACCENT}18`,
        borderRight: `1px solid ${value ? ACCENT + '44' : t.borderInput}`,
        display: 'flex', alignItems: 'center', flexShrink: 0, gap: 5,
        transition: 'border-color 0.15s',
      }}>
        <Search size={10} />
        Cari
      </span>
      <input
        type="text"
        placeholder="Faktur, kode, outlet..."
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          flex: 1, background: t.inputBg, border: 'none', outline: 'none',
          padding: '6px 10px', fontSize: 12,
          fontFamily: 'IBM Plex Mono, monospace', color: t.text,
          minWidth: 0,
        }}
      />
    </div>
  );
}

interface PiutangComponentProps {
  data: PiutangRecord[];
  weeklyData?: WeeklySales[];
  theme: Theme;
}

export default function PiutangComponent({ data, weeklyData = [], theme = 'light' }: PiutangComponentProps) {
  const t = tk[theme];

  const [searchTerm,       setSearchTerm]       = useState('');
  const [selectedOutlet,   setSelectedOutlet]   = useState('all');
  const [selectedCity,     setSelectedCity]     = useState('all');
  const [selectedSalesman, setSelectedSalesman] = useState('all');
  const [selectedAgeRange, setSelectedAgeRange] = useState('all');
  const [sortBy,           setSortBy]           = useState<keyof PiutangRecord>('hari');
  const [sortOrder,        setSortOrder]        = useState<'asc' | 'desc'>('desc');

  const outlet = useMemo(() => {
    const s = new Set<string>();
    data.forEach(r => { if (r.outlet) s.add(r.outlet.trim()); });
    return Array.from(s).sort();
  }, [data]);

  const cities = useMemo(() => {
    const s = new Set<string>();
    data.forEach(r => { if (r.kota) s.add(r.kota.trim()); });
    return Array.from(s).sort();
  }, [data]);

  const salesmen = useMemo(() => {
    const s = new Set<string>();
    data.forEach(r => s.add(r.salesman?.trim() || '-'));
    return Array.from(s).sort();
  }, [data]);

  const handleSort = (field: keyof PiutangRecord) => {
    if (sortBy === field) {
      setSortOrder(o => o === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const filteredData = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return data
      .filter(item => {
        const matchSearch =
          !term ||
          item.faktur.toLowerCase().includes(term) ||
          item.kode.toLowerCase().includes(term) ||
          item.outlet.toLowerCase().includes(term) ||
          item.kecamatan.toLowerCase().includes(term) ||
          item.kelDesa.toLowerCase().includes(term);

        const matchOutlet = selectedOutlet === 'all' || item.outlet.trim() === selectedOutlet;
        const matchCity = selectedCity === 'all' || item.kota.trim() === selectedCity;
        const salesmanVal = item.salesman?.trim() || '-';
        const matchSalesman = selectedSalesman === 'all' || salesmanVal === selectedSalesman;

        let matchAge = true;
        if (selectedAgeRange !== 'all') {
          const h = item.hari ?? 0;
          if      (selectedAgeRange === 'long')   matchAge = h >= 45;
          else if (selectedAgeRange === 'medium') matchAge = h >= 30 && h < 45;
          else if (selectedAgeRange === 'short')  matchAge = h < 30;
          else if (selectedAgeRange === 'giro')   matchAge = item.hari === null;
        }

        return matchSearch && matchOutlet && matchCity && matchSalesman && matchAge;
      })
      .sort((a, b) => {
        let va = a[sortBy] as any;
        let vb = b[sortBy] as any;
        if (va === null) va = sortOrder === 'asc' ? Infinity : -Infinity;
        if (vb === null) vb = sortOrder === 'asc' ? Infinity : -Infinity;
        if (typeof va === 'string') return sortOrder === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
        return sortOrder === 'asc' ? va - vb : vb - va;
      });
  }, [data, searchTerm,selectedOutlet, selectedCity, selectedSalesman, selectedAgeRange, sortBy, sortOrder]);

  const metrics = useMemo(() => {
    let totalPiutang = 0, totalGiro = 0, hariSum = 0, hariCount = 0;
    filteredData.forEach(r => {
      totalPiutang += r.piutang;
      totalGiro    += r.giro;
      if (r.hari !== null && r.hari < 90) { hariSum += r.hari; hariCount++; }
    });
    return {
      totalPiutang,
      totalGiro,
      totalOutstanding: totalPiutang + totalGiro,
      avgAging: hariCount > 0 ? Math.round(hariSum / hariCount) : 0,
      count: filteredData.length,
    };
  }, [filteredData]);

  // ── Omzet 1 Bulan (4 minggu terakhir) — selalu Rupiah, independen dari unit filter dashboard utama
  const omzet1Bulan = useMemo(() => {
    if (!weeklyData || weeklyData.length === 0) return 0;
    const latestYear = Math.max(...weeklyData.map(w => w.year));
    const weeksInLatestYear = weeklyData
      .filter(w => w.year === latestYear)
      .sort((a, b) => a.week - b.week);
    const last4Weeks = weeksInLatestYear.slice(-2);
    return last4Weeks.reduce((sum, w) => sum + (w.omzetTotal ?? 0), 0);
  }, [weeklyData]);

  const persentasePiutang = omzet1Bulan > 0 
  ? (metrics.totalOutstanding / omzet1Bulan) * 100 
  : 0;

  const SortIcon = ({ field }: { field: keyof PiutangRecord }) => {
    if (sortBy !== field) return <ArrowUpDown size={10} style={{ opacity: 0.3 }} />;
    return (
      <ArrowUpDown size={11} color={sortOrder === 'asc' ? t.blue.text : t.green.text} />
    );
  };

  const clearFilters = () => {
    setSearchTerm(''); setSelectedOutlet('all'); setSelectedCity('all');
    setSelectedSalesman('all'); setSelectedAgeRange('all');
    setSortBy('hari'); setSortOrder('desc');
  };

  const hasFilters = searchTerm || selectedOutlet !== 'all' || selectedCity !== 'all' || selectedSalesman !== 'all' || selectedAgeRange !== 'all';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontFamily: 'IBM Plex Sans, sans-serif' }}>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
        <KpiCard
          label="Omzet 2 minggu" labelColor={t.green.text}
          value={`Rp ${fIDR(omzet1Bulan)}`} sub="2 Minggu Terakhir"
          icon={<CalendarRange size={14} />} iconBg={t.green.bg} iconColor={t.green.text} t={t}
          cardbg={t.card2bg}
        />
        <KpiCard
          label="Total Piutang" labelColor={t.blue.text}
          value={`Rp ${fIDR(metrics.totalOutstanding)}`}
          sub={`Piutang + Giro · ${metrics.count} Transaksi`}
          icon={<BanknoteX size={14} />} iconBg={t.blue.bg} iconColor={t.blue.text} t={t}
          cardbg={t.card1bg}
        />
        <KpiCard
          label="Persentase Omzet/Piutang" labelColor={t.cyan.text}
          value={`${persentasePiutang.toFixed(1)}%`}
          icon={<Percent size={14} />} iconBg={t.cyan.bg} iconColor={t.cyan.text} t={t}
          cardbg={t.card6bg}
        />
        <KpiCard
          label="Piutang" labelColor={t.red.text}
          value={`Rp ${fIDR(metrics.totalPiutang)}`}
          icon={<CreditCard size={14} />} iconBg={t.red.bg} iconColor={t.red.text} t={t}
          cardbg={t.card4bg}
        />
        <KpiCard
          label="Giro" labelColor={t.yellow.text}
          value={`Rp ${fIDR(metrics.totalGiro)}`}
          icon={<BanknoteArrowDown size={14} />} iconBg={t.yellow.bg} iconColor={t.yellow.text} t={t}
          cardbg={t.card3bg}
        />
        <KpiCard
          label="Rata-Rata Umur Piutang" labelColor={t.purple.text}
          value={`${metrics.avgAging} Hari`} sub=""
          icon={<Calendar size={14} />} iconBg={t.purple.bg} iconColor={t.purple.text} t={t}
          cardbg={t.card5bg}
        />
      </div>

      <div style={{
        background: t.cardbg, border: `1px solid ${t.borderCard}`, borderRadius: 13,
        padding: '14px 16px', boxShadow: t.shadow,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: t.textMuted, fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '.08em' }}>
            Filter Data
          </span>
          {hasFilters && (
            <button onClick={clearFilters} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '4px 10px', borderRadius: 6,
              background: t.blue.bg, border: `1px solid ${t.blue.border}`,
              color: t.blue.text, cursor: 'pointer',
              fontSize: 11, fontWeight: 500, fontFamily: 'IBM Plex Mono, monospace',
            }}>
              Reset Filter
            </button>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 8 }}>
          <SearchBar value={searchTerm} onChange={setSearchTerm} t={t} />

          <FilterSelect label="Outlet" accentColor="#ef4444" value={selectedOutlet} onChange={e => setSelectedOutlet(e.target.value)} t={t}>
            <option value="all">Semua Outlet</option>
            {outlet.map(o => <option key={o} value={o}>{o}</option>)}
          </FilterSelect>

          <FilterSelect label="Kota" accentColor="#0d9488" value={selectedCity} onChange={e => setSelectedCity(e.target.value)} t={t}>
            <option value="all">Semua Kota</option>
            {cities.map(c => <option key={c} value={c}>{c}</option>)}
          </FilterSelect>

          <FilterSelect label="Salesman" accentColor="#8b5cf6" value={selectedSalesman} onChange={e => setSelectedSalesman(e.target.value)} t={t}>
            <option value="all">Semua Salesman</option>
            {salesmen.map(s => <option key={s} value={s}>{s === '-' ? 'Tanpa Salesman' : s}</option>)}
          </FilterSelect>

          <FilterSelect label="Hari" accentColor="#f59e0b" value={selectedAgeRange} onChange={e => setSelectedAgeRange(e.target.value)} t={t}>
            <option value="all">Semua</option>
            <option value="long">Sangat Lama (≥ 45 Hari)</option>
            <option value="medium">Sedang (30–44 Hari)</option>
            <option value="short">Baru (&lt; 30 Hari)</option>
            <option value="giro">Giro (Null)</option>
          </FilterSelect>
        </div>
      </div>

      <div style={{
        background: t.cardbg, border: `1px solid ${t.borderCard}`, borderRadius: 13,
        boxShadow: t.shadow, overflow: 'hidden',
      }}>
        <div style={{
          padding: '10px 16px', borderBottom: `1px solid ${t.border}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: t.tableHead,
        }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: t.textMuted, fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Daftar Piutang 
          </span>
          <span style={{
            fontSize: 10, fontFamily: 'IBM Plex Mono, monospace',
            background: t.inputBg, color: t.textSub,
            padding: '2px 9px', borderRadius: 12, border: `1px solid ${t.border}`,
          }}>
            Outstanding: Rp {fIDR(metrics.totalOutstanding)}
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 12 }}>
            <thead>
              <tr style={{ background: t.tableHead, borderBottom: `1px solid ${t.border}` }}>
                {([
                  { label: 'Faktur',      key: 'faktur'     },
                  { label: 'Kode',        key: 'kode'       },
                  { label: 'Outlet',      key: 'outlet'     },
                  { label: 'Kota',        key: 'kota'       },
                  { label: 'Kecamatan',   key: 'kecamatan'  },
                  { label: 'Kel/Desa',    key: 'kelDesa'    },
                  { label: 'Salesman',    key: 'salesman'   },
                  { label: 'Tanggal',     key: 'tanggal'    },
                  { label: 'Jatuh Tempo', key: 'jatuhTempo' },
                  { label: 'Hari',        key: 'hari',    numeric: true },
                  { label: 'Piutang',     key: 'piutang', numeric: true },
                  { label: 'Giro',        key: 'giro',    numeric: true },
                ] as { label: string; key: keyof PiutangRecord; numeric?: boolean }[]).map(col => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    style={{
                      padding: '10px 14px', fontSize: 9,
                      fontFamily: 'IBM Plex Mono, monospace',
                      textTransform: 'uppercase', letterSpacing: '0.07em',
                      color: sortBy === col.key ? t.text : t.textMuted,
                      fontWeight: 700, whiteSpace: 'nowrap', cursor: 'pointer',
                      textAlign: col.numeric ? 'right' : 'left', userSelect: 'none',
                    }}
                  >
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, justifyContent: col.numeric ? 'flex-end' : 'flex-start', width: '100%' }}>
                      {col.label}
                      <SortIcon field={col.key} />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={12} style={{ padding: '48px 10px', textAlign: 'center', fontSize: 12, color: t.textMuted, fontFamily: 'IBM Plex Mono, monospace' }}>
                    Tidak ada transaksi piutang yang cocok.
                  </td>
                </tr>
              ) : filteredData.map((row, idx) => {
                const isAlt = idx % 2 === 1;
                const rowBg = isAlt ? t.tableAlt : 'transparent';

                const agingColor =
                  row.hari === null ? t.textFaint
                  : row.hari > 40  ? '#ef4444'
                  : row.hari >= 30 ? '#f59e0b'
                  : row.hari <= 30   ? t.text
                  : t.textSub;

                return (
                  <tr
                    key={`${row.faktur}-${idx}`}
                    style={{ background: rowBg, transition: 'background 0.1s', borderBottom: `1px solid ${t.border}` }}
                    onMouseEnter={e => (e.currentTarget.style.background = t.rowHover)}
                    onMouseLeave={e => (e.currentTarget.style.background = rowBg)}
                  >
                    <td style={{ padding: '10px 14px', fontFamily: 'IBM Plex Mono, monospace', color: t.text, fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {row.faktur}
                    </td>
                    <td style={{ padding: '10px 14px', fontFamily: 'IBM Plex Mono, monospace', color: t.textSub, fontSize: 11, whiteSpace: 'nowrap' }}>
                      {row.kode}
                    </td>
                    <td style={{ padding: '10px 14px', color: t.text, fontWeight: 600 }}>
                      {row.outlet}
                    </td>
                    <td style={{ padding: '10px 14px', color: t.textSub }}>
                      {row.kota}
                    </td>
                    <td style={{ padding: '10px 14px', color: t.textSub }}>
                      {row.kecamatan}
                    </td>
                    <td style={{ padding: '10px 14px', color: t.textSub }}>
                      {row.kelDesa}
                    </td>
                    <td style={{ padding: '10px 14px', color: t.textSub, whiteSpace: 'nowrap' }}>
                      {row.salesman || <span style={{ color: t.textFaint }}>—</span>}
                    </td>
                    <td style={{ padding: '10px 14px', fontFamily: 'IBM Plex Mono, monospace', color: t.textSub, whiteSpace: 'nowrap', fontSize: 11 }}>
                      {row.tanggal || '—'}
                    </td>
                    <td style={{ padding: '10px 14px', fontFamily: 'IBM Plex Mono, monospace', color: t.textSub, whiteSpace: 'nowrap', fontSize: 11 }}>
                      {row.jatuhTempo || '—'}
                    </td>
                    <td style={{ padding: '10px 14px', fontFamily: 'IBM Plex Mono, monospace', textAlign: 'right', fontWeight: 600, color: agingColor }}>
                      {row.hari !== null ? fIDR(row.hari) : <span style={{ color: t.textFaint }}>—</span>}
                    </td>
                    <td style={{ padding: '10px 14px', fontFamily: 'IBM Plex Mono, monospace', textAlign: 'right', fontWeight: 700, color: row.piutang > 10_000_000 ? t.yellow.text : t.text }}>
                      {row.piutang > 0 ? fIDR(row.piutang) : <span style={{ color: t.textFaint }}>0</span>}
                    </td>
                    <td style={{ padding: '10px 14px', fontFamily: 'IBM Plex Mono, monospace', textAlign: 'right', fontWeight: 700, color: row.giro > 0 ? t.green.text : t.textSub }}>
                      {row.giro > 0 ? fIDR(row.giro) : <span style={{ color: t.textFaint }}>0</span>}
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
}