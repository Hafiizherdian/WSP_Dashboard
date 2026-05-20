'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Upload, FileSpreadsheet, CheckCircle, AlertCircle,
  Trash2, Eye, Database, TrendingUp, Search,
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight, X,
} from 'lucide-react';
import { UploadedFile, DatabaseStats } from '@/types/database';
import { AreaConfig } from '@/lib/areaConfig';
import { useAuth } from '@/lib/auth/AuthContext';
import {
  tk, Theme, Tokens, FONT_MONO, FONT_SANS,
  badge, iconBtn, Spinner, CardBox, FormGroup, ConfirmModal, StatCard,
} from './shared';

const PAGE_SIZE_OPTIONS = [10, 25, 50];
const BP_MD = 768;
const BP_LG = 1024;

const REQUIRED_COLUMNS = [
  'Minggu', 'Tanggal', 'Produk', 'Kategori', 'No.Customer', 'Customer',
  'Tipe Customer', 'Salesman', 'Desa', 'Kecamatan', 'Kota',
  'jual (Bks Net)', 'Jual (Slop Net)', 'Jual (Bal Net)', 'Jual (Dos Net)', 'Omzet (Nett)',
];

type SortKey = 'original_name' | 'created_at' | 'record_count' | 'total_omzet' | 'status';
type SortDir = 'asc' | 'desc';

function useWindowWidth() {
  const [width, setWidth] = useState(() => typeof window !== 'undefined' ? window.innerWidth : 1280);
  useEffect(() => {
    const h = () => setWidth(window.innerWidth);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return width;
}

// ─── PreviewPanel ─────────────────────────────────────────────────────────────
const PreviewPanel = React.memo(function PreviewPanel({ fileId, fileName, fileStatus, theme }: {
  fileId: string; fileName?: string; fileStatus?: UploadedFile['status']; theme: Theme;
}) {
  const t = tk[theme];
  const w = useWindowWidth();
  const isMobile = w < BP_MD;
  const [data,       setData]       = useState<Record<string, unknown>[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [activeCols, setActiveCols] = useState<Set<string>>(new Set());
  const [allCols,    setAllCols]    = useState<string[]>([]);

  useEffect(() => {
    setLoading(true); setError(''); setData([]); setAllCols([]); setActiveCols(new Set());
    fetch(`/api/files/${fileId}/preview`)
      .then(r => r.json())
      .then(r => {
        if (r.success && r.data?.length) {
          const cols = Object.keys(r.data[0]);
          setAllCols(cols);
          setActiveCols(new Set(isMobile ? cols.slice(0, 5) : cols));
          setData(r.data);
        } else { setError(r.error || 'Tidak ada data'); }
      })
      .catch(() => setError('Gagal memuat preview'))
      .finally(() => setLoading(false));
  }, [fileId]);

  const stats = useMemo(() => {
    if (!data.length || !allCols.length) return null;
    const numericCols = allCols.filter(c => data.every(row => {
      const v = row[c]; return v !== '' && v !== null && v !== undefined && !isNaN(Number(v));
    }));
    const omzetCol    = allCols.find(c => /omzet/i.test(c));
    const produkCol   = allCols.find(c => /produk/i.test(c));
    const kotaCol     = allCols.find(c => /kota|area/i.test(c));
    const totalOmzet   = omzetCol  ? data.reduce((s, r) => s + Number(r[omzetCol]  ?? 0), 0) : null;
    const uniqueProduk = produkCol ? new Set(data.map(r => r[produkCol])).size : null;
    const uniqueKota   = kotaCol   ? new Set(data.map(r => r[kotaCol])).size   : null;
    return { totalOmzet, uniqueProduk, uniqueKota, numericCols };
  }, [data, allCols]);

  const visibleCols = allCols.filter(c => activeCols.has(c));
  const toggleCol   = useCallback((col: string) => {
    setActiveCols(prev => {
      const next = new Set(prev);
      if (next.has(col)) { if (next.size > 2) next.delete(col); }
      else next.add(col);
      return next;
    });
  }, []);

  const isNumericCell = (col: string, val: unknown) =>
    stats?.numericCols.includes(col) && val !== '' && val !== null && !isNaN(Number(val));

  const fmtCell = (col: string, val: unknown): string => {
    if (val === null || val === undefined || val === '') return '—';
    if (isNumericCell(col, val)) {
      if (/omzet/i.test(col)) return `Rp ${Number(val).toLocaleString('id-ID')}`;
      return Number(val).toLocaleString('id-ID');
    }
    return String(val);
  };

  const sc = fileStatus ? ({ completed: t.green, processing: t.blue, error: t.red } as const)[fileStatus] : t.gray;

  if (loading) return (
    <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10, color: t.textMuted, fontSize: 12, fontFamily: FONT_MONO }}>
      <Spinner size={12} color={t.textMuted} /> Memuat preview…
    </div>
  );
  if (error) return (
    <div style={{ padding: '10px 13px', borderRadius: 8, background: t.red.bg, border: `1px solid ${t.red.border}`, color: t.red.text, fontSize: 12, display: 'flex', alignItems: 'center', gap: 7 }}>
      <AlertCircle size={12} style={{ flexShrink: 0 }} />{error}
    </div>
  );
  if (!data.length) return (
    <div style={{ padding: '28px', textAlign: 'center', color: t.textMuted, fontSize: 12, fontFamily: FONT_MONO }}>Tidak ada data.</div>
  );

  return (
    <div style={{ borderRadius: 12, overflow: 'hidden', border: `1px solid ${t.border}`, background: t.cardbg }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: t.tableHead, borderBottom: `1px solid ${t.border}`, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
          <div style={{ width: 26, height: 26, borderRadius: 6, background: t.green.bg, border: `1px solid ${t.green.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <FileSpreadsheet size={12} color={t.green.text} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: t.text, fontFamily: FONT_MONO, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: isMobile ? 160 : 480 }}>{fileName || fileId}</div>
            <div style={{ fontSize: 10, color: t.textMuted, fontFamily: FONT_MONO, marginTop: 1 }}>{data.length} baris · {allCols.length} kolom</div>
          </div>
        </div>
        <span style={{ fontSize: 10, color: t.textFaint, fontFamily: FONT_MONO, flexShrink: 0 }}>preview 10 baris</span>
      </div>

      {/* Mini stats */}
      {stats && (() => {
        const items = [
          { label: 'Total Baris', value: data.length.toLocaleString('id-ID'), sub: 'records' },
          ...(stats.totalOmzet   !== null ? [{ label: 'Total Omzet',  value: `Rp ${(stats.totalOmzet / 1e6).toFixed(1)}jt`, sub: `Rp ${stats.totalOmzet.toLocaleString('id-ID')}` }] : []),
          ...(stats.uniqueProduk !== null ? [{ label: 'Produk Unik',  value: String(stats.uniqueProduk), sub: 'SKU' }] : []),
          ...(stats.uniqueKota   !== null ? [{ label: 'Kota / Area',  value: String(stats.uniqueKota),   sub: 'wilayah' }] : []),
        ].slice(0, isMobile ? 2 : 4);
        return (
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${items.length}, 1fr)`, borderBottom: `1px solid ${t.border}` }}>
            {items.map((s, i) => (
              <div key={s.label} style={{ padding: '10px 14px', borderRight: i < items.length - 1 ? `1px solid ${t.border}` : 'none' }}>
                <div style={{ fontSize: 9, fontWeight: 700, fontFamily: FONT_MONO, textTransform: 'uppercase', letterSpacing: '0.1em', color: t.textMuted, marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: isMobile ? 15 : 18, fontWeight: 700, fontFamily: FONT_MONO, color: t.text, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 10, color: t.textMuted, marginTop: 2, fontFamily: FONT_MONO }}>{s.sub}</div>
              </div>
            ))}
          </div>
        );
      })()}

      {/* Column toggles */}
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', padding: '8px 12px', borderBottom: `1px solid ${t.border}`, background: t.tableHead }}>
        {allCols.map(col => {
          const on = activeCols.has(col);
          return (
            <button key={col} onClick={() => toggleCol(col)}
              style={{ fontSize: 10, fontFamily: FONT_MONO, padding: '2px 9px', borderRadius: 12, border: `1px solid ${on ? t.borderActive : t.border}`, background: on ? 'rgba(99,102,241,0.1)' : t.inputbg, color: on ? '#818cf8' : t.textMuted, cursor: 'pointer', outline: 'none', whiteSpace: 'nowrap' }}>
              {col}
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto', maxHeight: 360, overflowY: 'auto' }}>
        <table style={{ minWidth: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr>
              {visibleCols.map(col => (
                <th key={col} style={{ position: 'sticky', top: 0, zIndex: 2, padding: '7px 12px', textAlign: stats?.numericCols.includes(col) ? 'right' : 'left', fontSize: 9, fontWeight: 700, fontFamily: FONT_MONO, textTransform: 'uppercase', letterSpacing: '0.09em', color: t.textMuted, borderBottom: `1px solid ${t.border}`, background: t.tableHead, whiteSpace: 'nowrap' }}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i} style={{ background: i % 2 === 1 ? t.tableAlt : 'transparent' }}>
                {visibleCols.map(col => {
                  const numeric = isNumericCell(col, row[col]);
                  return (
                    <td key={col} style={{ padding: '6px 12px', color: numeric ? t.text : t.textSub, fontFamily: FONT_MONO, borderBottom: i < data.length - 1 ? `1px solid ${t.border}` : 'none', whiteSpace: 'nowrap', fontWeight: numeric ? 600 : 400, textAlign: numeric ? 'right' : 'left', fontSize: 12 }}>
                      {fmtCell(col, row[col])}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ padding: '7px 14px', borderTop: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: t.tableHead, flexWrap: 'wrap', gap: 6 }}>
        <span style={{ fontSize: 10, color: t.textMuted, fontFamily: FONT_MONO }}>{visibleCols.length} / {allCols.length} kolom</span>
        <span style={{ fontSize: 10, color: t.textFaint, fontFamily: FONT_MONO }}>klik label kolom untuk toggle</span>
      </div>
    </div>
  );
});

// ─── PreviewModal ─────────────────────────────────────────────────────────────
function PreviewModal({ file, onClose, theme }: { file: UploadedFile; onClose: () => void; theme: Theme }) {
  const t = tk[theme];
  const w = useWindowWidth();
  const isMobile = w < BP_MD;
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);
  useEffect(() => { document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = ''; }; }, []);

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, zIndex: 1100, background: t.modalOverlay, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? 10 : 24, backdropFilter: 'blur(4px)', animation: 'fadeIn 0.15s ease' }}>
      <div style={{ background: t.cardbg, border: `1px solid ${t.borderCard}`, borderRadius: 16, width: '100%', maxWidth: 1000, maxHeight: isMobile ? '92vh' : '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: t.shadowElevated, animation: 'slideUp 0.2s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: `1px solid ${t.border}`, background: t.tableHead, flexShrink: 0, gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: t.blue.bg, border: `1px solid ${t.blue.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Eye size={15} color={t.blue.text} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: t.text }}>Preview Data Penjualan</div>
              <div style={{ fontSize: 11, color: t.textMuted, fontFamily: FONT_MONO, marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: isMobile ? 180 : 560 }}>{file.original_name}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, background: t.red.bg, border: `1px solid ${t.red.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <X size={14} color={t.red.text} />
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '12px' : '16px 20px' }}>
          <PreviewPanel fileId={file.id} fileName={file.original_name} fileStatus={file.status} theme={theme} />
        </div>
        <div style={{ padding: '10px 18px', borderTop: `1px solid ${t.border}`, background: t.tableHead, display: 'flex', justifyContent: 'flex-end', flexShrink: 0 }}>
          <button onClick={onClose} style={{ padding: '7px 20px', borderRadius: 9, fontSize: 13, fontWeight: 600, background: t.gray.bg, color: t.gray.text, border: `1px solid ${t.gray.border}`, cursor: 'pointer' }}>Tutup</button>
        </div>
      </div>
    </div>
  );
}

// ─── FilesTable ───────────────────────────────────────────────────────────────
const TABLE_COLS: { label: string; key: SortKey }[] = [
  { label: 'Nama File', key: 'original_name' },
  { label: 'Tanggal',   key: 'created_at'    },
  { label: 'Records',   key: 'record_count'  },
  { label: 'Omzet',     key: 'total_omzet'   },
  { label: 'Status',    key: 'status'        },
];

function FilesTable({ files, onDelete, isRoot, theme }: {
  files: UploadedFile[]; onDelete: (id: string, name: string) => void; isRoot: boolean; theme: Theme;
}) {
  const t = tk[theme];
  const w = useWindowWidth();
  const isMobile = w < BP_MD;
  const [search,      setSearch]      = useState('');
  const [sortKey,     setSortKey]     = useState<SortKey>('created_at');
  const [sortDir,     setSortDir]     = useState<SortDir>('desc');
  const [page,        setPage]        = useState(1);
  const [pageSize,    setPageSize]    = useState(10);
  const [previewFile, setPreviewFile] = useState<UploadedFile | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return q ? files.filter(f => f.original_name.toLowerCase().includes(q) || f.status.toLowerCase().includes(q)) : files;
  }, [files, search]);

  const sorted = useMemo(() => [...filtered].sort((a, b) => {
    let av: string | number = a[sortKey] as string | number;
    let bv: string | number = b[sortKey] as string | number;
    if (sortKey === 'created_at') { av = new Date(av as string).getTime(); bv = new Date(bv as string).getTime(); }
    return av < bv ? (sortDir === 'asc' ? -1 : 1) : av > bv ? (sortDir === 'asc' ? 1 : -1) : 0;
  }), [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage   = Math.min(page, totalPages);
  const paginated  = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

  const handleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
    setPage(1);
  };

  const pageNums = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(n => n === 1 || n === totalPages || Math.abs(n - safePage) <= 1)
    .reduce<(number | 'ellipsis')[]>((acc, n, idx, arr) => {
      if (idx > 0 && n - (arr[idx - 1] as number) > 1) acc.push('ellipsis');
      acc.push(n);
      return acc;
    }, []);

  const visibleCols = isRoot ? TABLE_COLS : TABLE_COLS.filter(c => c.key !== 'record_count' && c.key !== 'total_omzet');
  const thS = (key: SortKey): React.CSSProperties => ({
    padding: '10px 13px', textAlign: 'left', fontSize: 10, fontWeight: 700,
    textTransform: 'uppercase', letterSpacing: '0.08em',
    color: key === sortKey ? '#6366f1' : t.textMuted,
    borderBottom: `1px solid ${t.border}`, fontFamily: FONT_MONO,
    whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none', background: t.tableHead,
  });

  const StatusBadge = ({ status }: { status: UploadedFile['status'] }) => {
    const cfg = {
      completed:  { label: 'Selesai', icon: <CheckCircle size={10} />, ...t.green },
      processing: { label: 'Proses',  icon: <span style={{ width: 8, height: 8, border: `2px solid ${t.blue.text}`, borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />, ...t.blue },
      error:      { label: 'Error',   icon: <AlertCircle size={10} />, ...t.red },
    }[status];
    return <span style={badge(cfg.bg, cfg.text, cfg.border)}>{cfg.icon} {cfg.label}</span>;
  };

  return (
    <>
      {previewFile && <PreviewModal file={previewFile} onClose={() => setPreviewFile(null)} theme={theme} />}
      <div style={{ background: t.cardbg, border: `1px solid ${t.borderCard}`, borderRadius: 14, overflow: 'visible', boxShadow: t.shadowCard }}>
        {/* Header */}
        <div style={{ padding: '14px 16px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: t.text, display: 'flex', alignItems: 'center', gap: 7 }}>
              <FileSpreadsheet size={14} color="#6366f1" /> File Penjualan Diupload
            </div>
            <div style={{ fontSize: 11, color: t.textMuted, marginTop: 2, fontFamily: FONT_MONO }}>
              {filtered.length !== files.length ? `${filtered.length} / ${files.length}` : `${files.length} total`}
            </div>
          </div>
          <div style={{ position: 'relative' }}>
            <Search size={12} color={t.textMuted} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <input type="text" placeholder="Cari file…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              style={{ paddingLeft: 27, paddingRight: search ? 26 : 10, paddingTop: 7, paddingBottom: 7, fontSize: 12, borderRadius: 9, background: t.inputbg, border: `1px solid ${search ? t.borderActive : t.borderInput}`, color: t.text, outline: 'none', width: isMobile ? 148 : 190, transition: 'border-color 0.15s' }} />
            {search && <button onClick={() => { setSearch(''); setPage(1); }} style={{ position: 'absolute', right: 7, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: t.textMuted, padding: 0, display: 'flex' }}><X size={11} /></button>}
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ minWidth: 480, width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                {visibleCols.map(({ label, key }) => (
                  <th key={key} style={thS(key)} onClick={() => handleSort(key)}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      {label}
                      {key === sortKey
                        ? (sortDir === 'asc' ? <ChevronUp size={11} color="#6366f1" /> : <ChevronDown size={11} color="#6366f1" />)
                        : <ChevronUp size={11} color={t.textFaint} />}
                    </span>
                  </th>
                ))}
                <th style={{ ...thS('status'), textAlign: 'center', cursor: 'default' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr><td colSpan={visibleCols.length + 1} style={{ padding: 40, textAlign: 'center', color: t.textMuted, fontSize: 12, fontFamily: FONT_MONO }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <FileSpreadsheet size={26} color={t.textFaint} />
                    {search ? `Tidak ada "${search}"` : 'Belum ada file penjualan'}
                  </div>
                </td></tr>
              ) : paginated.map((file, idx) => (
                <tr key={file.id} style={{ background: idx % 2 === 1 ? t.tableAlt : 'transparent' }}>
                  <td style={{ padding: '11px 13px', color: t.text, fontWeight: 500 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 26, height: 26, borderRadius: 6, background: t.green.bg, border: `1px solid ${t.green.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <FileSpreadsheet size={12} color={t.green.text} />
                      </div>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: isMobile ? 100 : 200 }}>{file.original_name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '11px 13px', color: t.textSub, whiteSpace: 'nowrap', fontFamily: FONT_MONO, fontSize: 12 }}>
                    {new Date(file.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: '2-digit' })}
                  </td>
                  {isRoot && (
                    <>
                      <td style={{ padding: '11px 13px', color: t.textSub, fontFamily: FONT_MONO, fontSize: 12 }}>{file.record_count.toLocaleString('id-ID')}</td>
                      <td style={{ padding: '11px 13px', fontFamily: FONT_MONO, fontSize: 12, whiteSpace: 'nowrap' }}>
                        <span style={{ fontWeight: 700, color: t.text }}>Rp </span>
                        <span style={{ color: t.textSub }}>{file.total_omzet.toLocaleString('id-ID')}</span>
                      </td>
                    </>
                  )}
                  <td style={{ padding: '11px 13px' }}><StatusBadge status={file.status} /></td>
                  <td style={{ padding: '11px 13px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 5 }}>
                      <button onClick={() => setPreviewFile(file)} style={iconBtn(t.blue.bg, t.blue.border, 28)} title="Preview"><Eye size={11} color={t.blue.text} /></button>
                      <button onClick={() => onDelete(file.id, file.original_name)} style={iconBtn(t.red.bg, t.red.border, 28)} title="Hapus"><Trash2 size={11} color={t.red.text} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {sorted.length > 0 && (
          <div style={{ padding: '11px 16px', borderTop: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 11, color: t.textMuted, fontFamily: FONT_MONO }}>Baris:</span>
              <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
                style={{ padding: '4px 7px', fontSize: 11, borderRadius: 7, background: t.inputbg, border: `1px solid ${t.borderInput}`, color: t.text, outline: 'none', fontFamily: FONT_MONO }}>
                {PAGE_SIZE_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: 11, color: t.textMuted, fontFamily: FONT_MONO }}>{(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, sorted.length)} / {sorted.length}</span>
              <div style={{ display: 'flex', gap: 3 }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1} style={{ ...iconBtn(t.gray.bg, t.gray.border, 26), cursor: safePage === 1 ? 'not-allowed' : 'pointer', opacity: safePage === 1 ? 0.4 : 1 }}><ChevronLeft size={11} color={t.textSub} /></button>
                {!isMobile && pageNums.map((item, idx) => item === 'ellipsis'
                  ? <span key={`e${idx}`} style={{ width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: t.textMuted }}>…</span>
                  : <button key={item} onClick={() => setPage(item as number)} style={{ width: 26, height: 26, borderRadius: 7, border: `1px solid ${safePage === item ? t.borderActive : t.gray.border}`, background: safePage === item ? 'rgba(99,102,241,0.12)' : t.gray.bg, color: safePage === item ? '#6366f1' : t.textSub, fontSize: 11, fontFamily: FONT_MONO, cursor: 'pointer', fontWeight: safePage === item ? 700 : 400 }}>{item}</button>
                )}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} style={{ ...iconBtn(t.gray.bg, t.gray.border, 26), cursor: safePage === totalPages ? 'not-allowed' : 'pointer', opacity: safePage === totalPages ? 0.4 : 1 }}><ChevronRight size={11} color={t.textSub} /></button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
interface Props {
  dbStats:       DatabaseStats | null;
  uploadedFiles: UploadedFile[];
  onRefresh:     () => Promise<void>;
  theme:         Theme;
  addToast:      (type: 'success' | 'error' | 'warning' | 'info', title: string, msg?: string) => void;
}

export default function UploadPenjualanTab({ dbStats, uploadedFiles, onRefresh, theme, addToast }: Props) {
  const t = tk[theme];
  const { user, getAccessibleAreas } = useAuth();
  const w = useWindowWidth();
  const isMobile = w < BP_MD;
  const isTablet = w < BP_LG;
  const isRoot   = user?.role === 'root';

  const [isDragging,   setIsDragging]   = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading,  setIsUploading]  = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [uploadMsg,    setUploadMsg]    = useState('');
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting,   setIsDeleting]   = useState(false);
  const [manualArea,   setManualArea]   = useState('');
  const [allAreas,     setAllAreas]     = useState<AreaConfig[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/areas').then(r => r.json()).then(j => { if (j.success) setAllAreas(j.data.areas ?? []); }).catch(() => {});
  }, []);

  const userAreaIds     = getAccessibleAreas();
  const accessibleAreas = user?.role === 'root' ? allAreas : allAreas.filter(a => userAreaIds.includes(a.id));
  const autoArea        = accessibleAreas.length === 1 ? accessibleAreas[0].id : '';
  const selectedAreaId  = autoArea || manualArea;
  const selectedAreaName = allAreas.find(a => a.id === selectedAreaId)?.name ?? selectedAreaId;

  const handleFileSelect = (file: File) => {
    setUploadStatus('idle'); setUploadMsg('');
    if (/\.(xlsx|xls|csv)$/i.test(file.name)) { setSelectedFile(file); }
    else { addToast('error', 'Format tidak didukung', 'Gunakan .xlsx, .xls, atau .csv'); setUploadStatus('error'); setUploadMsg('Format tidak didukung'); }
  };

  const handleUpload = async () => {
    if (!selectedFile || isUploading) return;
    if (!selectedAreaId) { addToast('error', 'Area belum dipilih', 'Pilih area tujuan terlebih dahulu'); return; }
    setIsUploading(true); setUploadStatus('idle'); setUploadMsg('');
    try {
      const fd = new FormData(); fd.append('file', selectedFile); fd.append('area', selectedAreaId);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      let r: any = {}; try { r = await res.json(); } catch { r = {}; }
      if (res.ok && r.success !== false) {
        const count = r.data?.record_count ?? r.record_count ?? 0;
        const msg   = count > 0 ? `${count.toLocaleString('id-ID')} records berhasil diimport` : 'File berhasil diupload';
        setUploadStatus('success'); setUploadMsg(msg); addToast('success', 'Upload berhasil!', msg);
        setSelectedFile(null); setManualArea('');
        if (fileInputRef.current) fileInputRef.current.value = '';
        await onRefresh().catch(() => {});
      } else {
        const errMsg = r.error ?? r.message ?? `Server error ${res.status}`;
        setUploadStatus('error'); setUploadMsg(errMsg); addToast('error', 'Upload gagal', errMsg);
      }
    } catch (err: any) {
      const msg = err?.message || 'Koneksi gagal';
      setUploadStatus('error'); setUploadMsg(msg); addToast('error', 'Upload gagal', msg);
    } finally { setIsUploading(false); }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/files?id=${encodeURIComponent(deleteTarget.id)}`, { method: 'DELETE' });
      let r: any = {}; try { r = await res.json(); } catch { r = {}; }
      if (res.ok) { addToast('success', 'File dihapus', deleteTarget.name); await onRefresh().catch(() => {}); }
      else addToast('error', 'Gagal menghapus', r.error ?? `Error ${res.status}`);
    } catch (err: any) { addToast('error', 'Gagal menghapus', err?.message ?? 'Koneksi gagal'); }
    finally { setIsDeleting(false); setDeleteTarget(null); }
  };

  const canUpload = !!selectedFile && !!selectedAreaId && !isUploading;

  return (
    <>
      <ConfirmModal open={!!deleteTarget} title="Hapus File Penjualan" message={`Yakin menghapus "${deleteTarget?.name}"? Data penjualan terkait akan hilang permanen.`} confirmLabel={isDeleting ? 'Menghapus…' : 'Hapus'} danger onConfirm={handleDeleteConfirm} onCancel={() => setDeleteTarget(null)} theme={theme} />

      {/* Stat cards */}
      {isRoot && dbStats && (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${isMobile ? 1 : 2}, 1fr)`, gap: 12, marginBottom: 18 }}>
          <StatCard label="Total Records Penjualan" value={dbStats.total_records.toLocaleString('id-ID')} cardKey="stat1" icon={Database} trend="up" theme={theme} />
          <StatCard label="Total Omzet" value={`Rp ${(dbStats.total_omzet / 1e6).toLocaleString('id-ID', { maximumFractionDigits: 1 })}jt`} cardKey="stat2" icon={TrendingUp} sub={`Rp ${dbStats.total_omzet.toLocaleString('id-ID')}`} trend="up" theme={theme} />
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: isTablet ? '1fr' : '1fr 290px', gap: 16, marginBottom: 18, alignItems: 'start' }}>
        {/* Upload card */}
        <CardBox title="Upload File Penjualan" icon={Upload} iconColor="#6366f1" accent="#6366f1" theme={theme}>
          {/* Status bar */}
          {uploadStatus !== 'idle' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 8, marginBottom: 12, background: uploadStatus === 'success' ? t.green.bg : t.red.bg, border: `1px solid ${uploadStatus === 'success' ? t.green.border : t.red.border}`, animation: 'fadeIn 0.2s ease' }}>
              {uploadStatus === 'success'
                ? <CheckCircle size={13} color={t.green.text} style={{ flexShrink: 0 }} />
                : <AlertCircle size={13} color={t.red.text} style={{ flexShrink: 0 }} />}
              <span style={{ fontSize: 12, fontWeight: 600, color: uploadStatus === 'success' ? t.green.text : t.red.text, flex: 1 }}>{uploadMsg}</span>
              <button onClick={() => { setUploadStatus('idle'); setUploadMsg(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: uploadStatus === 'success' ? t.green.text : t.red.text, padding: 0, display: 'flex', opacity: 0.6 }}><X size={11} /></button>
            </div>
          )}

          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={e => { e.preventDefault(); setIsDragging(false); }}
            onDrop={e => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFileSelect(f); }}
            onClick={() => !selectedFile && fileInputRef.current?.click()}
            style={{ border: `2px dashed ${isDragging ? '#6366f1' : selectedFile ? t.green.border : t.borderInput}`, borderRadius: 10, padding: selectedFile ? '14px' : isMobile ? '24px 14px' : '30px 14px', textAlign: 'center', background: isDragging ? t.dropzoneActive : selectedFile ? t.green.bg : t.inputbg, cursor: selectedFile ? 'default' : 'pointer', transition: 'all 0.2s', marginBottom: 14 }}>
            {!selectedFile ? (
              <>
                <div style={{ width: 44, height: 44, borderRadius: 11, background: isDragging ? 'rgba(99,102,241,0.15)' : t.inputbg, border: `1.5px dashed ${isDragging ? '#6366f1' : t.borderInput}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                  <Upload size={19} color={isDragging ? '#6366f1' : t.textMuted} />
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: t.text, marginBottom: 4 }}>{isDragging ? 'Lepaskan di sini' : 'Drag & drop atau klik'}</div>
                <div style={{ fontSize: 11, color: t.textMuted }}>xlsx · xls · csv · maks 50 MB</div>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left' }}>
                <div style={{ width: 38, height: 38, borderRadius: 9, background: t.green.bg, border: `1px solid ${t.green.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <FileSpreadsheet size={18} color={t.green.text} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: t.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedFile.name}</div>
                  <div style={{ fontSize: 11, color: t.textMuted, fontFamily: FONT_MONO, marginTop: 2 }}>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</div>
                </div>
                <button onClick={e => { e.stopPropagation(); setSelectedFile(null); setUploadStatus('idle'); setUploadMsg(''); }} style={{ width: 26, height: 26, borderRadius: 7, background: t.red.bg, border: `1px solid ${t.red.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                  <X size={11} color={t.red.text} />
                </button>
              </div>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={e => { if (e.target.files?.[0]) handleFileSelect(e.target.files[0]); e.target.value = ''; }} style={{ display: 'none' }} />

          {/* Area */}
          <FormGroup label="Area Tujuan" hint="Data penjualan akan dimasukkan ke area ini" theme={theme}>
            {allAreas.length === 0 ? (
              <div style={{ fontSize: 12, color: t.textMuted, padding: '8px 12px', background: t.inputbg, border: `1px solid ${t.borderInput}`, borderRadius: 9, fontFamily: FONT_MONO, display: 'flex', alignItems: 'center', gap: 6 }}><Spinner size={11} color={t.textMuted} /> Memuat area…</div>
            ) : accessibleAreas.length === 0 ? (
              <div style={{ fontSize: 12, color: t.yellow.text, padding: '8px 12px', background: t.yellow.bg, border: `1px solid ${t.yellow.border}`, borderRadius: 9, fontFamily: FONT_MONO }}>⚠ Tidak ada area yang dapat diakses.</div>
            ) : autoArea ? (
              <div style={{ fontSize: 12, color: t.green.text, padding: '8px 12px', background: t.green.bg, border: `1px solid ${t.green.border}`, borderRadius: 9, fontFamily: FONT_MONO, display: 'flex', alignItems: 'center', gap: 6 }}><CheckCircle size={11} color={t.green.text} />{selectedAreaName}</div>
            ) : (
              <select value={manualArea} onChange={e => setManualArea(e.target.value)} style={{ fontSize: 12, color: manualArea ? t.text : t.textMuted, background: t.inputbg, border: `1px solid ${manualArea ? t.borderActive : t.borderInput}`, borderRadius: 9, fontFamily: FONT_MONO, padding: '8px 12px', width: '100%', outline: 'none', cursor: 'pointer' }}>
                <option value="">— Pilih area tujuan —</option>
                {accessibleAreas.map(area => <option key={area.id} value={area.id}>{area.name || area.id}</option>)}
              </select>
            )}
          </FormGroup>

          {isUploading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, background: t.blue.bg, border: `1px solid ${t.blue.border}`, marginBottom: 10 }}>
              <Spinner size={12} color={t.blue.text} />
              <span style={{ fontSize: 12, color: t.blue.text, fontFamily: FONT_MONO }}>Mengupload {selectedFile?.name}…</span>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, paddingTop: 6, borderTop: `1px solid ${t.border}`, marginTop: 4 }}>
            <button onClick={() => fileInputRef.current?.click()} style={{ padding: '7px 13px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: t.gray.bg, color: t.gray.text, border: `1px solid ${t.gray.border}`, cursor: 'pointer' }}>{selectedFile ? 'Ganti File' : 'Pilih File'}</button>
            <button onClick={handleUpload} disabled={!canUpload}
              style={{ padding: '7px 18px', borderRadius: 8, fontSize: 13, fontWeight: 700, border: 'none', background: canUpload ? '#6366f1' : t.btnDisabled.bg, color: canUpload ? '#fff' : t.btnDisabled.text, cursor: canUpload ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 6, boxShadow: canUpload ? '0 2px 8px rgba(99,102,241,0.3)' : 'none', transition: 'all 0.15s' }}>
              {isUploading ? <><Spinner size={13} color="#fff" /> Mengupload…</> : <><Upload size={13} /> Upload</>}
            </button>
          </div>
        </CardBox>

        {/* Kolom yang diperlukan */}
        <CardBox title="Kolom yang Diperlukan" icon={AlertCircle} iconColor="#f59e0b" accent="#f59e0b" theme={theme}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {REQUIRED_COLUMNS.map((col, i) => (
              <div key={col} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 2px', borderBottom: i < REQUIRED_COLUMNS.length - 1 ? `1px solid ${t.border}` : 'none' }}>
                <CheckCircle size={10} color="#10b981" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 11, fontFamily: FONT_MONO, color: t.textSub }}>{col}</span>
              </div>
            ))}
          </div>
        </CardBox>
      </div>

      <FilesTable files={uploadedFiles} onDelete={(id, name) => setDeleteTarget({ id, name })} isRoot={isRoot} theme={theme} />
    </>
  );
}