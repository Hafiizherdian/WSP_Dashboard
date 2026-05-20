'use client';

import React, {
  useEffect, useMemo, useState, useRef, useCallback,
} from 'react';
import {
  WeekComparison, ComparisonYears, ComparisonWeeks, WeekComparisonProductDetail,
} from '@/types/sales';
import { getProductCategory } from '@/lib/productCategories';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar, Cell, ReferenceLine,
} from 'recharts';
import { ChevronUpIcon, ChevronDownIcon, Maximize2, X } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
type Theme   = 'dark' | 'light';
type UnitKey = 'units_dos' | 'units_bal' | 'units_slop' | 'units_bks';

// ─── Theme tokens ─────────────────────────────────────────────────────────────
const TK = {
  dark: {
    pageBg: '#080a0f', cardBg: '#111318', headerBg: '#0c0e14',
    filterBg: 'rgba(255,255,255,0.025)', modalBg: '#0f1117',
    infoBg: 'rgba(37,99,235,0.07)', border: 'rgba(255,255,255,0.06)',
    borderLight: 'rgba(255,255,255,0.05)', infoBorder: 'rgba(59,130,246,0.3)',
    text: 'rgba(255,255,255,0.9)', textSub: 'rgba(255,255,255,0.55)',
    textMuted: 'rgba(255,255,255,0.3)', textFaint: 'rgba(255,255,255,0.18)',
    infoText: 'rgba(147,197,253,0.85)', inputBg: 'rgba(255,255,255,0.03)',
    inputBorder: 'rgba(255,255,255,0.08)', selectBg: '#0c0e14',
    theadBg: '#0c0e14', theadText: 'rgba(255,255,255,0.35)',
    rowAlt: 'rgba(255,255,255,0.015)', rowHover: 'rgba(255,255,255,0.03)',
    gridStroke: 'rgba(255,255,255,0.05)', tooltipBg: '#1a1e2e',
    tooltipBorder: 'rgba(255,255,255,0.12)', btnBg: 'rgba(37,99,235,0.12)',
    btnBorder: 'rgba(59,130,246,0.3)', btnText: '#93c5fd',
    shadow: 'none', sortActive: '#3b82f6', sortInactive: 'rgba(148,163,184,0.4)',
    summaryBg: 'rgba(255,255,255,0.02)', summaryBorder: 'rgba(255,255,255,0.06)',
    dragHint: 'rgba(59,130,246,0.18)',
  },
  light: {
    pageBg: '#f0f2f7', cardBg: '#ffffff', headerBg: '#ffffff',
    filterBg: '#f8fafc', modalBg: '#ffffff', infoBg: 'rgba(37,99,235,0.08)',
    border: 'rgba(0,0,0,0.07)', borderLight: 'rgba(0,0,0,0.05)',
    infoBorder: 'rgba(37,99,235,0.25)', text: '#0f172a', textSub: '#475569',
    textMuted: '#94a3b8', textFaint: '#cbd5e1', infoText: '#1d4ed8',
    inputBg: 'rgba(0,0,0,0.03)', inputBorder: 'rgba(0,0,0,0.1)',
    selectBg: '#ffffff', theadBg: '#f8fafc', theadText: '#94a3b8',
    rowAlt: 'rgba(0,0,0,0.018)', rowHover: 'rgba(0,0,0,0.03)',
    gridStroke: 'rgba(0,0,0,0.06)', tooltipBg: '#ffffff',
    tooltipBorder: 'rgba(0,0,0,0.1)', btnBg: 'rgba(37,99,235,0.08)',
    btnBorder: 'rgba(37,99,235,0.25)', btnText: '#1d4ed8',
    shadow: '0 1px 8px rgba(0,0,0,0.07)', sortActive: '#2563eb',
    sortInactive: '#cbd5e1', summaryBg: '#f8fafc', summaryBorder: 'rgba(0,0,0,0.07)',
    dragHint: 'rgba(37,99,235,0.08)',
  },
} as const;

// ─── Chart palette ────────────────────────────────────────────────────────────
const PREV_COLOR = '#64748b';
const CURR_COLOR = '#3b82f6';
const POS_COLOR  = '#10b981';
const NEG_COLOR  = '#ef4444';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function resolveUnitValues(
  detail: WeekComparisonProductDetail,
  unit: string,
): { previous: number; current: number } {
  const key   = unit as UnitKey;
  const field = detail[key] as { previous: number; current: number } | undefined;
  if (field && typeof field.previous === 'number') return { previous: field.previous, current: field.current };
  const dos = detail.units_dos as { previous: number; current: number } | undefined;
  if (dos && typeof dos.previous === 'number') return { previous: dos.previous, current: dos.current };
  return { previous: 0, current: 0 };
}

const fmtK = (v: number) => {
  if (Math.abs(v) >= 1000) return (v / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return Math.round(v).toLocaleString('id-ID');
};

const fmtExact = (v: number) => v.toLocaleString('id-ID', { maximumFractionDigits: 2 });

const fmtPct = (v: number) => (v >= 0 ? '+' : '') + v.toFixed(1) + '%';

const formatWeekRange = (range?: { start: number; end: number } | null) => {
  if (!range) return 'Week 1–52';
  if (range.start === range.end) return `Week ${range.start}`;
  return `Week ${range.start}–${range.end}`;
};

// ─── Responsive hooks ─────────────────────────────────────────────────────────
function useBreakpoint() {
  const [width, setWidth] = useState<number>(
    typeof window !== 'undefined' ? window.innerWidth : 1024,
  );
  useEffect(() => {
    const h = () => setWidth(window.innerWidth);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return { isMobile: width < 640, isTablet: width >= 640 && width < 1024, width };
}

function useWindowSize() {
  const [size, setSize] = useState({
    w: typeof window !== 'undefined' ? window.innerWidth  : 1200,
    h: typeof window !== 'undefined' ? window.innerHeight : 800,
  });
  useEffect(() => {
    const h = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return size;
}

// ─── useViewport hook (zoom + pan, grafik selalu full-width) ──────────────────
// "Zoom" di sini artinya mengubah WINDOW — berapa week yang terlihat.
// Grafik selalu full-width, tidak menyusut/membesar. User hanya mengubah
// berapa week yang terlihat (window), lalu geser kiri/kanan untuk navigasi.
interface ViewportResult {
  visibleCount : number;                         // jumlah week terlihat saat ini
  startIndex   : number;                         // index awal slice
  canPanLeft   : boolean;
  canPanRight  : boolean;
  isWindowed   : boolean;                        // true jika window < total (bisa pan)
  windowPct    : number;                         // persentase data yg terlihat (100 = semua)
  zoomIn       : () => void;                     // perkecil window (lihat lebih sedikit week)
  zoomOut      : () => void;                     // perbesar window (lihat lebih banyak week)
  resetZoom    : () => void;                     // kembali ke semua week
  panLeft      : () => void;
  panRight     : () => void;
  panTo        : (fraction: number) => void;     // 0–1, tengah viewport
  ref          : React.RefObject<HTMLDivElement | null>;
  handlers: {
    onMouseDown  : (e: React.MouseEvent) => void;
    onMouseMove  : (e: React.MouseEvent) => void;
    onMouseUp    : () => void;
    onMouseLeave : () => void;
    onKeyDown    : (e: React.KeyboardEvent) => void;
  };
}

// Zoom step: tiap klik zoom in/out mengubah window sebesar 25%
const ZOOM_STEP = 0.25;
// Minimum week yang terlihat
const MIN_WINDOW = 4;
// Pan step: tiap klik panLeft/panRight menggeser 20% dari window saat ini
const PAN_STEP_PCT = 0.20;

function useViewport(totalCount: number): ViewportResult {
  const [visibleCount, setVisibleCount] = useState(totalCount);
  const [startIndex,   setStartIndex]   = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  // Sinkronisasi saat data berubah
  useEffect(() => {
    setVisibleCount(vc => {
      const next = Math.min(vc, totalCount);
      setStartIndex(si => Math.max(0, Math.min(totalCount - next, si)));
      return next;
    });
  }, [totalCount]);

  // ── Clamp helper ──────────────────────────────────────────────────────────
  const clamp = useCallback((si: number, vc: number) =>
    Math.max(0, Math.min(totalCount - vc, si)),
  [totalCount]);

  // ── Zoom ──────────────────────────────────────────────────────────────────
  // Zoom IN = window lebih kecil (lihat LEBIH SEDIKIT week, lebih detail)
  const zoomIn = useCallback(() => {
    setVisibleCount(vc => {
      const next = Math.max(MIN_WINDOW, Math.round(vc * (1 - ZOOM_STEP)));
      // Pertahankan pusat viewport
      setStartIndex(si => clamp(si + Math.round((vc - next) / 2), next));
      return next;
    });
  }, [clamp]);

  // Zoom OUT = window lebih besar (lihat LEBIH BANYAK week)
  const zoomOut = useCallback(() => {
    setVisibleCount(vc => {
      const next = Math.min(totalCount, Math.round(vc * (1 + ZOOM_STEP)));
      setStartIndex(si => clamp(si - Math.round((next - vc) / 2), next));
      return next;
    });
  }, [totalCount, clamp]);

  const resetZoom = useCallback(() => {
    setVisibleCount(totalCount);
    setStartIndex(0);
  }, [totalCount]);

  // ── Pan ───────────────────────────────────────────────────────────────────
  const panLeft = useCallback(() => {
    // Baca visibleCount via ref agar tidak perlu masuk ke dep array
    setVisibleCount(vc => {
      setStartIndex(si => clamp(si - Math.max(1, Math.round(vc * PAN_STEP_PCT)), vc));
      return vc;
    });
  }, [clamp]);

  const panRight = useCallback(() => {
    setVisibleCount(vc => {
      setStartIndex(si => clamp(si + Math.max(1, Math.round(vc * PAN_STEP_PCT)), vc));
      return vc;
    });
  }, [clamp]);

  const panTo = useCallback((fraction: number) => {
    setVisibleCount(vc => {
      const center = Math.round(fraction * totalCount);
      setStartIndex(clamp(center - Math.floor(vc / 2), vc));
      return vc;
    });
  }, [totalCount, clamp]);

  // ── Drag pan ──────────────────────────────────────────────────────────────
  const dragStartX   = useRef<number | null>(null);
  const dragStartIdx = useRef(0);
  const isDragging   = useRef(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    dragStartX.current   = e.clientX;
    dragStartIdx.current = startIndex;
    isDragging.current   = false;
  }, [startIndex]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (dragStartX.current === null) return;
    const dx = e.clientX - dragStartX.current;
    if (Math.abs(dx) > 4) isDragging.current = true;
    if (!isDragging.current) return;
    const el = ref.current; if (!el) return;
    const w = el.getBoundingClientRect().width || 1;
    setVisibleCount(vc => {
      setStartIndex(clamp(dragStartIdx.current + Math.round((-dx / w) * vc), vc));
      return vc;
    });
  }, [clamp]);

  const handleMouseUp = useCallback(() => {
    dragStartX.current = null;
    isDragging.current = false;
  }, []);

  const handleMouseLeave = useCallback(() => {
    dragStartX.current = null;
    isDragging.current = false;
  }, []);

  // ── Touch swipe pan ───────────────────────────────────────────────────────
  useEffect(() => {
    const el = ref.current; if (!el) return;
    let lastX = 0, touchStartIdx = 0;
    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      lastX = e.touches[0].clientX;
      touchStartIdx = startIndex;
    };
    const onMove = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - lastX;
      const w  = el.getBoundingClientRect().width || 1;
      setVisibleCount(vc => {
        setStartIndex(clamp(touchStartIdx + Math.round((-dx / w) * vc), vc));
        return vc;
      });
    };
    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchmove',  onMove,  { passive: true });
    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchmove',  onMove);
    };
  }, [startIndex, clamp]);

  // ── Keyboard ──────────────────────────────────────────────────────────────
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowLeft':  e.preventDefault(); panLeft();   break;
      case 'ArrowRight': e.preventDefault(); panRight();  break;
      case '+': case '=': e.preventDefault(); zoomIn();   break;
      case '-': case '_': e.preventDefault(); zoomOut();  break;
      case 'Escape':     e.preventDefault(); resetZoom(); break;
      case 'Home':       e.preventDefault(); setStartIndex(0); break;
      case 'End':
        e.preventDefault();
        setVisibleCount(vc => { setStartIndex(clamp(totalCount, vc)); return vc; });
        break;
    }
  }, [panLeft, panRight, zoomIn, zoomOut, resetZoom, clamp, totalCount]);

  return {
    visibleCount,
    startIndex,
    canPanLeft:  startIndex > 0,
    canPanRight: startIndex < totalCount - visibleCount,
    isWindowed:  visibleCount < totalCount,
    windowPct:   totalCount > 0 ? Math.round((visibleCount / totalCount) * 100) : 100,
    zoomIn,
    zoomOut,
    resetZoom,
    panLeft,
    panRight,
    panTo,
    ref,
    handlers: {
      onMouseDown:  handleMouseDown,
      onMouseMove:  handleMouseMove,
      onMouseUp:    handleMouseUp,
      onMouseLeave: handleMouseLeave,
      onKeyDown:    handleKeyDown,
    },
  };
}

// ─── ChartViewport ────────────────────────────────────────────────────────────
// Pendekatan BENAR: render SEMUA data dalam satu SVG lebar penuh,
// lalu geser kontainer dengan CSS translateX. Grafik TIDAK re-render saat pan.
//
// Cara kerja:
//  • Inner chart div lebarnya = (totalCount / visibleCount) * 100%
//    → jika visibleCount=13 dari 52 total, lebar = 400%
//  • translateX digunakan untuk menggeser ke posisi startIndex
//    → offset = -(startIndex / totalCount) * totalWidth
//  • Zoom = ubah visibleCount → otomatis lebar inner berubah, posisi disesuaikan
//  • Grafik di-pass SEMUA data (tidak di-slice), XAxis tick di-filter via interval
type ChartEntry = Record<string, unknown>;

function ChartViewport<T extends ChartEntry>({
  theme, height, data, children,
}: {
  theme: Theme;
  height: number;
  data: T[];
  /** children menerima data LENGKAP (tidak di-slice) + info viewport */
  children: (allData: T[], visibleCount: number, startIndex: number) => React.ReactNode;
}) {
  const t = TK[theme];
  const {
    visibleCount, startIndex, canPanLeft, canPanRight, isWindowed, windowPct,
    zoomIn, zoomOut, resetZoom, panLeft, panRight, panTo, ref, handlers,
  } = useViewport(data.length);

  const [dragging, setDragging] = useState(false);
  const [hasMoved, setHasMoved] = useState(false);
  const [hovered,  setHovered]  = useState(false);
  const [focused,  setFocused]  = useState(false);
  const mmRef      = useRef<HTMLDivElement>(null);
  const mmDragging = useRef(false);

  // Lebar inner = rasio total/visible → jika visible=13 dari 52, lebar = 400%
  const innerWidthPct = data.length > 0 ? (data.length / visibleCount) * 100 : 100;

  // Offset translateX: geser sejauh (startIndex/totalCount) * innerWidth
  // Karena innerWidth dalam %, dan kita dalam konteks outer 100%:
  // translateX dalam px terlalu rumit — gunakan left offset trick:
  // Bungkus inner dalam overflow:hidden div (outer), inner absolute dengan left = -offsetPct%
  const offsetPct = data.length > 0 ? (startIndex / data.length) * innerWidthPct : 0;

  // ── Minimap ───────────────────────────────────────────────────────────────
  const mmPanFromEvent = useCallback((clientX: number) => {
    const el = mmRef.current; if (!el) return;
    const r  = el.getBoundingClientRect();
    panTo(Math.max(0, Math.min(1, (clientX - r.left) / r.width)));
  }, [panTo]);

  const onMmDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isWindowed) return;
    mmDragging.current = true;
    mmPanFromEvent(e.clientX);
    e.preventDefault(); e.stopPropagation();
  }, [isWindowed, mmPanFromEvent]);

  useEffect(() => {
    const up   = () => { mmDragging.current = false; };
    const move = (e: MouseEvent) => { if (mmDragging.current) mmPanFromEvent(e.clientX); };
    window.addEventListener('mouseup',   up);
    window.addEventListener('mousemove', move);
    return () => { window.removeEventListener('mouseup', up); window.removeEventListener('mousemove', move); };
  }, [mmPanFromEvent]);

  // ── Zoom buttons ──────────────────────────────────────────────────────────
  const ZBtn = ({ label, action, disabled, title: ttl }: {
    label: string; action: () => void; disabled: boolean; title: string;
  }) => (
    <button
      onClick={action} disabled={disabled} title={ttl} aria-label={ttl}
      style={{
        width: 26, height: 26, borderRadius: 6,
        border: `1px solid ${disabled ? 'transparent' : t.inputBorder}`,
        background: disabled ? 'transparent' : t.inputBg,
        color: disabled ? t.textFaint : t.textSub,
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 15, lineHeight: 1, flexShrink: 0,
        fontFamily: 'IBM Plex Mono,monospace', transition: 'background .12s',
      }}
      onMouseEnter={e => { if (!disabled) (e.currentTarget as HTMLButtonElement).style.background = t.dragHint; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = disabled ? 'transparent' : t.inputBg; }}
    >
      {label}
    </button>
  );

  // ── Pan buttons ───────────────────────────────────────────────────────────
  const PBtn = ({ dir }: { dir: 'left' | 'right' }) => {
    const disabled = dir === 'left' ? !canPanLeft : !canPanRight;
    return (
      <button
        onClick={dir === 'left' ? panLeft : panRight}
        disabled={disabled}
        title={dir === 'left' ? 'Geser kiri (←)' : 'Geser kanan (→)'}
        style={{
          width: 26, height: 26, borderRadius: 6,
          border: `1px solid ${disabled ? 'transparent' : t.inputBorder}`,
          background: disabled ? 'transparent' : t.inputBg,
          color: disabled ? t.textFaint : t.textSub,
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, flexShrink: 0, fontFamily: 'IBM Plex Mono,monospace',
          transition: 'background .12s',
        }}
        onMouseEnter={e => { if (!disabled) (e.currentTarget as HTMLButtonElement).style.background = t.dragHint; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = disabled ? 'transparent' : t.inputBg; }}
      >
        {dir === 'left' ? '‹' : '›'}
      </button>
    );
  };

  const getCursor = () => {
    if (!isWindowed) return 'default';
    return dragging && hasMoved ? 'grabbing' : 'grab';
  };

  const hintText = focused && isWindowed
    ? '← → geser  ·  +/− zoom  ·  Esc reset'
    : isWindowed && hovered
    ? 'drag untuk geser  ·  +/− zoom  ·  ← → keyboard'
    : '';

  return (
    <div style={{ userSelect: 'none' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6, padding: '0 2px' }}>
        <span style={{
          fontSize: 10, fontFamily: 'IBM Plex Mono,monospace', marginRight: 'auto',
          color: isWindowed ? t.btnText : t.textMuted,
          fontWeight: isWindowed ? 600 : 400, letterSpacing: '.02em',
        }}>
          {isWindowed
            ? `W${startIndex + 1}–W${startIndex + visibleCount} dari ${data.length} minggu`
            : `${data.length} minggu`}
        </span>
        {isWindowed && <PBtn dir="left" />}
        {isWindowed && <PBtn dir="right" />}
        <ZBtn label="−" action={zoomOut}   disabled={visibleCount >= data.length} title="Tampilkan lebih banyak week" />
        <ZBtn label="+" action={zoomIn}    disabled={visibleCount <= MIN_WINDOW}   title="Tampilkan lebih sedikit week" />
        <ZBtn label="↺" action={resetZoom} disabled={!isWindowed}                  title="Tampilkan semua week (Esc)" />
      </div>

      {/* Minimap */}
      {isWindowed && (
        <div style={{ marginBottom: 8, padding: '0 2px' }}>
          <div
            ref={mmRef}
            onMouseDown={onMmDown}
            onMouseMove={e => { if (mmDragging.current) mmPanFromEvent(e.clientX); }}
            onMouseUp={() => { mmDragging.current = false; }}
            onMouseLeave={() => { mmDragging.current = false; }}
            title="Klik atau drag untuk navigasi"
            style={{
              height: 8, borderRadius: 4, background: t.inputBorder,
              position: 'relative', overflow: 'hidden',
              cursor: 'ew-resize', userSelect: 'none',
            }}
          >
            {Array.from({ length: Math.min(data.length, 52) }).map((_, i) => (
              <div key={i} style={{
                position: 'absolute', top: 0, bottom: 0, width: 1,
                left: `${(i / data.length) * 100}%`,
                background: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                pointerEvents: 'none',
              }} />
            ))}
            <div style={{
              position: 'absolute', height: '100%', borderRadius: 4,
              background: t.btnText,
              left:  `${(startIndex / Math.max(data.length, 1)) * 100}%`,
              width: `${windowPct}%`,
              opacity: 0.85,
              boxShadow: `0 0 0 1px ${t.btnText}60`,
            }} />
          </div>
        </div>
      )}

      {/* ── Chart container ──────────────────────────────────────────────────
           OUTER: overflow:hidden + border, tinggi fixed
           INNER: lebar = innerWidthPct%, digeser dengan marginLeft / translateX
           Chart di-render sekali dengan SEMUA data, tidak pernah di-slice. ── */}
      <div
        style={{
          borderRadius: 10,
          border: `1.5px solid ${focused ? t.btnBorder : hovered && isWindowed ? t.inputBorder : t.border}`,
          boxShadow: focused ? `0 0 0 3px ${t.btnBorder}30` : 'none',
          transition: 'border-color .18s, box-shadow .18s',
          overflow: 'hidden',
          height,
          position: 'relative',
          cursor: getCursor(),
        }}
        ref={ref}
        tabIndex={0}
        onMouseDown={e => { setDragging(true); setHasMoved(false); handlers.onMouseDown(e); }}
        onMouseMove={e => { if (dragging) setHasMoved(true); handlers.onMouseMove(e); }}
        onMouseUp={() => { setDragging(false); handlers.onMouseUp(); }}
        onMouseLeave={() => { setDragging(false); setHasMoved(false); setHovered(false); handlers.onMouseLeave(); }}
        onMouseEnter={() => setHovered(true)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={handlers.onKeyDown}
      >
        {/* Inner — lebar penuh × rasio, digeser ke kiri sesuai startIndex */}
        <div style={{
          position: 'absolute',
          top: 0, bottom: 0,
          width: `${innerWidthPct}%`,
          // Geser: offset negatif sesuai posisi startIndex
          // translateX(-offsetPct%) tapi offsetPct relatif terhadap innerWidth
          // jadi: left = -(startIndex/totalCount)*100% dalam konteks outer
          left: `${-offsetPct}%`,
          // Animasi halus saat pan dengan tombol/keyboard, tidak saat drag
          transition: dragging ? 'none' : 'left .15s ease-out',
        }}>
          {children(data, visibleCount, startIndex)}
        </div>
      </div>

      {/* Hint */}
      <div style={{
        marginTop: 4, height: 13,
        fontSize: 9, fontFamily: 'IBM Plex Mono,monospace',
        color: focused ? t.btnText : t.textFaint,
        textAlign: 'center', letterSpacing: '.03em',
        opacity: hintText ? 1 : 0,
        transition: 'opacity .2s, color .2s',
      }}>
        {hintText}
      </div>
    </div>
  );
}

// ─── Custom Tooltips ──────────────────────────────────────────────────────────
type LinePayload = { dataKey?: string; value?: number, name?: string};

function TooltipLine({ active, payload, label, theme }: {
  active?: boolean; payload?: LinePayload[]; label?: string; theme: Theme;
}) {
  if (!active || !payload?.length) return null;
  const t  = TK[theme];
  const pv = payload.find(x => x.dataKey === 'previousYear')?.value ?? 0;
  const cv = payload.find(x => x.dataKey === 'currentYear')?.value  ?? 0;
  const vr = cv - pv;
  const pc = pv > 0 ? (vr / pv) * 100 : 0;
  const row = (lbl: string, val: string, color?: string) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 3 }}>
      <span style={{ color: t.textSub, fontSize: 11 }}>{lbl}</span>
      <span style={{ fontWeight: 600, fontSize: 11, color: color ?? t.text }}>{val}</span>
    </div>
  );
  return (
    <div style={{ background: t.tooltipBg, border: `1px solid ${t.tooltipBorder}`, borderRadius: 8, padding: '8px 12px', fontFamily: 'IBM Plex Mono,monospace', minWidth: 160, boxShadow: '0 4px 16px rgba(0,0,0,.12)' }}>
      <div style={{ fontWeight: 700, fontSize: 12, color: t.text, marginBottom: 6 }}>{label}</div>
      {row(payload.find(x => x.dataKey === 'previousYear')?.name ?? 'Tahun Lalu', fmtK(pv))}
      {row(payload.find(x => x.dataKey === 'currentYear')?.name  ?? 'Tahun Ini',  fmtK(cv))}
      {row('Selisih', `${vr >= 0 ? '+' : ''}${fmtK(vr)} (${fmtPct(pc)})`, vr >= 0 ? POS_COLOR : NEG_COLOR)}
    </div>
  );
}

function TooltipBar({ active, payload, label, theme }: {
  active?: boolean; payload?: { value?: number }[]; label?: string; theme: Theme;
}) {
  if (!active || !payload?.length) return null;
  const t = TK[theme];
  const v = payload[0]?.value ?? 0;
  return (
    <div style={{ background: t.tooltipBg, border: `1px solid ${t.tooltipBorder}`, borderRadius: 8, padding: '8px 12px', fontFamily: 'IBM Plex Mono,monospace', boxShadow: '0 4px 16px rgba(0,0,0,.12)' }}>
      <div style={{ fontWeight: 700, fontSize: 12, color: t.text, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 11, fontWeight: 600, color: v >= 0 ? POS_COLOR : NEG_COLOR }}>Varians: {fmtPct(v)}</div>
    </div>
  );
}

// ─── Summary bar ──────────────────────────────────────────────────────────────
function ChartSummary({ cells, theme }: {
  cells: { label: string; value: string; color?: string }[];
  theme: Theme;
}) {
  const t = TK[theme];
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: `repeat(${cells.length}, 1fr)`,
      borderTop: `1px solid ${t.summaryBorder}`, background: t.summaryBg,
    }}>
      {cells.map((c, i) => (
        <div key={i} style={{ padding: '10px 14px', borderRight: i < cells.length - 1 ? `1px solid ${t.summaryBorder}` : 'none' }}>
          <div style={{ fontSize: 9, fontFamily: 'IBM Plex Mono,monospace', color: t.textMuted, textTransform: 'uppercase' as const, letterSpacing: '.06em' }}>{c.label}</div>
          <div style={{ fontSize: 14, fontWeight: 600, fontFamily: 'IBM Plex Mono,monospace', color: c.color ?? t.text, marginTop: 2 }}>{c.value}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Legend components ────────────────────────────────────────────────────────
function LegendPill({ color, label, dash, theme }: { color: string; label: string; dash?: boolean; theme: Theme }) {
  const t = TK[theme];
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontFamily: 'IBM Plex Mono,monospace', color: t.textSub }}>
      {dash
        ? <span style={{ width: 18, height: 0, borderTop: `2px dashed ${color}`, display: 'inline-block' }} />
        : <span style={{ width: 18, height: 3, borderRadius: 2, background: color, display: 'inline-block' }} />
      }
      {label}
    </span>
  );
}

function DotLegend({ color, label, theme }: { color: string; label: string; theme: Theme }) {
  const t = TK[theme];
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontFamily: 'IBM Plex Mono,monospace', color: t.textSub }}>
      <span style={{ width: 10, height: 10, borderRadius: 2, background: color, display: 'inline-block', flexShrink: 0 }} />
      {label}
    </span>
  );
}

// ─── GrowthPill ───────────────────────────────────────────────────────────────
function GrowthPill({ value }: { value: number | undefined }) {
  const v = value ?? 0; const pos = v >= 0;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 2,
      padding: '2px 7px', borderRadius: 5, fontSize: 11, fontWeight: 700,
      fontFamily: 'IBM Plex Mono,monospace', whiteSpace: 'nowrap',
      background: pos ? 'rgba(16,185,129,0.14)' : 'rgba(239,68,68,0.14)',
      color: pos ? POS_COLOR : NEG_COLOR,
    }}>
      {pos ? <ChevronUpIcon width={10} height={10} /> : <ChevronDownIcon width={10} height={10} />}
      {pos ? '+' : ''}{v.toFixed(1)}%
    </span>
  );
}

// ─── SortIcon ─────────────────────────────────────────────────────────────────
function SortIcon({ colKey, sortConfig, theme }: {
  colKey: string;
  sortConfig: { key: string; direction: 'asc' | 'desc' } | null;
  theme: Theme;
}) {
  const t = TK[theme]; const isActive = sortConfig?.key === colKey;
  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', marginLeft: 4 }}>
      <ChevronUpIcon   width={12} height={12} color={isActive && sortConfig?.direction === 'asc'  ? t.sortActive : t.sortInactive} />
      <ChevronDownIcon width={12} height={12} color={isActive && sortConfig?.direction === 'desc' ? t.sortActive : t.sortInactive} style={{ marginTop: -2 }} />
    </span>
  );
}

// ─── FilterSelect ─────────────────────────────────────────────────────────────
function FilterSelect({ label, accentColor = '#3b82f6', value, onChange, children, theme, fullWidth }: {
  label: string; accentColor?: string; value: string | number;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  children: React.ReactNode; theme: Theme; fullWidth?: boolean;
}) {
  const t = TK[theme];
  return (
    <div style={{ display: 'flex', alignItems: 'stretch', border: `1px solid ${t.inputBorder}`, borderRadius: 8, overflow: 'hidden', flex: fullWidth ? '1 1 auto' : undefined, minWidth: 0 }}>
      <span style={{ padding: '6px 10px', fontSize: 10, fontFamily: 'IBM Plex Mono,monospace', textTransform: 'uppercase', letterSpacing: '.07em', fontWeight: 600, color: accentColor, background: `${accentColor}18`, borderRight: `1px solid ${t.inputBorder}`, display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', flexShrink: 0 }}>{label}</span>
      <select value={value} onChange={onChange} style={{ background: t.inputBg, border: 'none', outline: 'none', padding: '6px 10px', fontSize: 12, fontFamily: 'IBM Plex Mono,monospace', color: t.text, cursor: 'pointer', flex: 1, minWidth: 0, appearance: 'none', width: '100%' }}>
        {children}
      </select>
    </div>
  );
}

// ─── Buttons ──────────────────────────────────────────────────────────────────
function ExpandBtn({ onClick, theme, isTable }: { onClick: () => void; theme: Theme; isTable?: boolean }) {
  const t = TK[theme];
  return (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 6, background: t.btnBg, border: `1px solid ${t.btnBorder}`, color: t.btnText, cursor: 'pointer', fontSize: 11, fontWeight: 500, fontFamily: 'IBM Plex Mono,monospace', flexShrink: 0 }}>
      <Maximize2 width={12} height={12} />
      {isTable ? 'Perbesar Tabel' : 'Perbesar'}
    </button>
  );
}

function TableBtn({ onClick, theme, active }: { onClick: () => void; theme: Theme; active?: boolean }) {
  const t = TK[theme];
  return (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 6, background: active ? `${t.btnText}22` : t.btnBg, border: `1px solid ${active ? t.btnText : t.btnBorder}`, color: t.btnText, cursor: 'pointer', fontSize: 11, fontWeight: 500, fontFamily: 'IBM Plex Mono,monospace', flexShrink: 0, transition: 'all .15s' }}>
      {active
        ? <svg width={12} height={12} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}><polyline points="1,12 5,7 8,9 11,4 15,2" /></svg>
        : <svg width={12} height={12} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}><rect x="1" y="1" width="14" height="14" rx="2" /><line x1="1" y1="5.5" x2="15" y2="5.5" /><line x1="1" y1="10.5" x2="15" y2="10.5" /><line x1="5.5" y1="5.5" x2="5.5" y2="15" /></svg>
      }
      {active ? 'Chart' : 'Tabel'}
    </button>
  );
}

// ─── ChartTableView ───────────────────────────────────────────────────────────
type ChartRowData = {
  week: string; previousYear: number; currentYear: number;
  variance: number; variancePercentage: number;
};

function ChartTableView({ type, data, previousYearLabel, currentYearLabel, theme, maxHeight = 340 }: {
  type: 'line' | 'bar'; data: ChartRowData[];
  previousYearLabel: string | number; currentYearLabel: string | number;
  theme: Theme; maxHeight?: number;
}) {
  const t = TK[theme];
  const [sort, setSort] = useState<{ key: keyof ChartRowData; dir: 'asc' | 'desc' }>({ key: 'week', dir: 'asc' });

  // FIX: Gunakan useCallback untuk toggle sort agar tidak membuat closure baru tiap render
  const handleSort = useCallback((key: keyof ChartRowData) => {
    setSort(p => ({ key, dir: p.key === key && p.dir === 'asc' ? 'desc' : 'asc' }));
  }, []);

  const sorted = useMemo(() => [...data].sort((a, b) => {
    const av = a[sort.key], bv = b[sort.key];
    const cmp = sort.key === 'week'
      ? parseInt((av as string).replace('W', ''), 10) - parseInt((bv as string).replace('W', ''), 10)
      : (av as number) - (bv as number);
    return sort.dir === 'asc' ? cmp : -cmp;
  }), [data, sort]);

  const cols: { key: keyof ChartRowData; label: string; right: boolean }[] = type === 'line'
    ? [
        { key: 'week',               label: 'Minggu',              right: false },
        { key: 'previousYear',       label: String(previousYearLabel), right: true },
        { key: 'currentYear',        label: String(currentYearLabel),  right: true },
        { key: 'variance',           label: 'Variance',            right: true },
        { key: 'variancePercentage', label: 'Var %',               right: true },
      ]
    : [
        { key: 'week',               label: 'Minggu',  right: false },
        { key: 'variance',           label: 'Selisih', right: true },
        { key: 'variancePercentage', label: 'Var %',   right: true },
      ];

  const totals = useMemo(() => {
    if (type !== 'line') return null;
    const p = data.reduce((s, r) => s + r.previousYear, 0);
    const c = data.reduce((s, r) => s + r.currentYear, 0);
    const v = c - p;
    return { p, c, v, pct: p > 0 ? (v / p) * 100 : 0 };
  }, [data, type]);

  const SortBtn = ({ col }: { col: typeof cols[number] }) => (
    <span style={{ display: 'inline-flex', flexDirection: 'column', marginLeft: 3 }}>
      <ChevronUpIcon   width={10} height={10} color={sort.key === col.key && sort.dir === 'asc'  ? t.sortActive : t.sortInactive} />
      <ChevronDownIcon width={10} height={10} color={sort.key === col.key && sort.dir === 'desc' ? t.sortActive : t.sortInactive} style={{ marginTop: -2 }} />
    </span>
  );

  return (
    <div style={{ border: `1px solid ${t.border}`, borderRadius: 10, overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto', maxHeight, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 340 }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
            <tr>
              {cols.map(col => (
                <th key={col.key}
                  onClick={() => handleSort(col.key)}
                  style={{ padding: '8px 14px', textAlign: col.right ? 'right' : 'left', fontSize: 9, fontFamily: 'IBM Plex Mono,monospace', textTransform: 'uppercase', letterSpacing: '.07em', fontWeight: 600, color: t.theadText, background: t.theadBg, borderBottom: `1px solid ${t.border}`, cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: col.right ? 'flex-end' : 'flex-start', gap: 2, width: '100%' }}>
                    {col.label}<SortBtn col={col} />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, i) => {
              const pos = row.variancePercentage >= 0;
              return (
                <tr key={row.week}
                  style={{ background: i % 2 === 0 ? 'transparent' : t.rowAlt, transition: 'background .12s' }}
                  onMouseEnter={e => ((e.currentTarget as HTMLTableRowElement).style.background = t.rowHover)}
                  onMouseLeave={e => ((e.currentTarget as HTMLTableRowElement).style.background = i % 2 === 0 ? 'transparent' : t.rowAlt)}>
                  <td style={{ padding: '8px 14px', fontSize: 12, color: t.text, fontWeight: 600, fontFamily: 'IBM Plex Mono,monospace', borderBottom: `1px solid ${t.borderLight}` }}>{row.week}</td>
                  {type === 'line' && <>
                    <td style={{ padding: '8px 14px', fontSize: 12, color: t.textMuted, fontFamily: 'IBM Plex Mono,monospace', textAlign: 'right', borderBottom: `1px solid ${t.borderLight}` }}>{fmtExact(row.previousYear)}</td>
                    <td style={{ padding: '8px 14px', fontSize: 12, color: t.text, fontWeight: 600, fontFamily: 'IBM Plex Mono,monospace', textAlign: 'right', borderBottom: `1px solid ${t.borderLight}` }}>{fmtExact(row.currentYear)}</td>
                    <td style={{ padding: '8px 14px', fontSize: 12, fontFamily: 'IBM Plex Mono,monospace', fontWeight: 600, textAlign: 'right', borderBottom: `1px solid ${t.borderLight}`, color: pos ? POS_COLOR : NEG_COLOR }}>{pos ? '+' : ''}{fmtExact(row.variance)}</td>
                  </>}
                  {type === 'bar' && (
                    <td style={{ padding: '8px 14px', fontSize: 12, fontFamily: 'IBM Plex Mono,monospace', fontWeight: 600, textAlign: 'right', borderBottom: `1px solid ${t.borderLight}`, color: pos ? POS_COLOR : NEG_COLOR }}>{pos ? '+' : ''}{fmtExact(row.variance)}</td>
                  )}
                  <td style={{ padding: '8px 14px', textAlign: 'right', borderBottom: `1px solid ${t.borderLight}` }}><GrowthPill value={row.variancePercentage} /></td>
                </tr>
              );
            })}
          </tbody>
          {totals && (
            <tfoot>
              <tr style={{ background: t.theadBg, borderTop: `2px solid ${t.border}` }}>
                <td style={{ padding: '8px 14px', fontSize: 11, fontWeight: 700, color: t.text, fontFamily: 'IBM Plex Mono,monospace' }}>Total</td>
                <td style={{ padding: '8px 14px', fontSize: 11, fontWeight: 700, color: t.textMuted, fontFamily: 'IBM Plex Mono,monospace', textAlign: 'right' }}>{fmtExact(totals.p)}</td>
                <td style={{ padding: '8px 14px', fontSize: 11, fontWeight: 700, color: t.text, fontFamily: 'IBM Plex Mono,monospace', textAlign: 'right' }}>{fmtExact(totals.c)}</td>
                <td style={{ padding: '8px 14px', fontSize: 11, fontWeight: 700, fontFamily: 'IBM Plex Mono,monospace', textAlign: 'right', color: totals.v >= 0 ? POS_COLOR : NEG_COLOR }}>{totals.v >= 0 ? '+' : ''}{fmtExact(totals.v)}</td>
                <td style={{ padding: '8px 14px', textAlign: 'right' }}><GrowthPill value={totals.pct} /></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function ChartModal({ onClose, title, theme, children }: {
  onClose: () => void; title: string; theme: Theme; children: React.ReactNode;
}) {
  const t = TK[theme];
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', fn);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', fn); document.body.style.overflow = ''; };
  }, [onClose]);
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: t.modalBg, border: `1px solid ${t.border}`, borderRadius: 14, width: '100%', maxWidth: 1080, maxHeight: '92vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,.4)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: `1px solid ${t.border}`, flexShrink: 0, background: t.headerBg }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: t.text, fontFamily: 'IBM Plex Sans,sans-serif' }}>{title}</span>
          <button onClick={onClose} style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, cursor: 'pointer', color: t.textMuted, padding: 4, borderRadius: 6, display: 'flex', alignItems: 'center' }}>
            <X width={18} height={18} />
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 16, background: t.cardBg }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── Expand target type ───────────────────────────────────────────────────────
type ExpandTarget = { chart: 'line' | 'bar'; mode: 'chart' | 'table' } | null;

interface ResolvedProductRow {
  product: string; previousYear: number; currentYear: number;
  variance: number; variancePercentage: number;
}

interface WeekComparisonProps {
  data: WeekComparison[];
  comparisonYears?: ComparisonYears;
  comparisonWeeks?: ComparisonWeeks;
  theme?: Theme;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════════════════
export default function WeekComparisonComponent({
  data, comparisonYears, comparisonWeeks, theme: themeProp,
}: WeekComparisonProps) {
  const theme: Theme = themeProp ?? 'light';
  const t = TK[theme];
  const { isMobile, isTablet } = useBreakpoint();
  const winSize = useWindowSize();

  const previousYearLabel      = comparisonYears?.previousYear ?? 'Tahun 1';
  const currentYearLabel       = comparisonYears?.currentYear  ?? 'Tahun 2';
  const previousWeekRangeLabel = formatWeekRange(comparisonWeeks?.previousYear ?? undefined);
  const currentWeekRangeLabel  = formatWeekRange(comparisonWeeks?.currentYear  ?? undefined);

  // FIX: Memoize weekOptions agar tidak recompute tiap render
  const weekOptions = useMemo(
    () => Array.from(new Set(data.map(d => d.week))).sort((a, b) => a - b),
    [data],
  );

  const [selectedWeek,     setSelectedWeek]     = useState<number | null>(null);
  const [selectedUnit,     setSelectedUnit]     = useState('units_dos');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandTarget,     setExpandTarget]     = useState<ExpandTarget>(null);
  const [tableView,        setTableView]        = useState<'line' | 'bar' | null>(null);
  const [sortConfig,       setSortConfig]       = useState<{
    key: 'product' | 'previousYear' | 'currentYear' | 'variance' | 'variancePercentage';
    direction: 'asc' | 'desc';
  } | null>(null);

  // FIX: Gunakan data.length sebagai dep, bukan data (objek baru tiap render dari parent)
  useEffect(() => { setSelectedWeek(null); }, [data.length]);

  const unitOptions = useMemo(() => [
    { value: 'units_dos',  label: 'Jual (Dos Net)' },
    { value: 'units_bal',  label: 'Jual (Bal Net)' },
    { value: 'units_slop', label: 'Jual (Slop Net)' },
    { value: 'units_bks',  label: 'Jual (Bks Net)' },
  ], []);

  const getUnitLabel = useCallback(
    (u: string) => unitOptions.find(o => o.value === u)?.label ?? u,
    [unitOptions],
  );

  const allProductsInData = useMemo((): ResolvedProductRow[] => {
    const m = new Map<string, Record<UnitKey, { previous: number; current: number }>>();
    data.forEach(wd => {
      wd.details?.forEach(d => {
        if (!m.has(d.product)) m.set(d.product, {
          units_dos: { previous: 0, current: 0 }, units_bal: { previous: 0, current: 0 },
          units_slop: { previous: 0, current: 0 }, units_bks: { previous: 0, current: 0 },
        });
        const acc = m.get(d.product)!;
        (['units_dos', 'units_bal', 'units_slop', 'units_bks'] as UnitKey[]).forEach(k => {
          const v = resolveUnitValues(d, k);
          acc[k].previous += v.previous; acc[k].current += v.current;
        });
      });
    });
    return Array.from(m.entries()).map(([product, acc]) => {
      const u    = acc[selectedUnit as UnitKey] ?? acc.units_dos;
      const prev = Math.round(u.previous * 100) / 100;
      const curr = Math.round(u.current  * 100) / 100;
      const vari = Math.round((curr - prev) * 100) / 100;
      return {
        product, previousYear: prev, currentYear: curr, variance: vari,
        variancePercentage: prev > 0 ? Math.round(((curr - prev) / prev) * 1000) / 10 : 0,
      };
    }).sort((a, b) => b.currentYear - a.currentYear);
  }, [data, selectedUnit]);

  const availableCategories = useMemo(() => {
    const s = new Set<string>();
    allProductsInData.forEach(p => s.add(getProductCategory(p.product)));
    return Array.from(s).sort();
  }, [allProductsInData]);

  const productDetails = useMemo((): ResolvedProductRow[] => {
    if (selectedWeek === null) return allProductsInData;
    const wd = data.find(d => d.week === selectedWeek);
    if (!wd?.details) return [];
    return wd.details.map(d => {
      const { previous: p, current: c } = resolveUnitValues(d, selectedUnit);
      const prev = Math.round(p * 100) / 100, curr = Math.round(c * 100) / 100;
      const vari = Math.round((curr - prev) * 100) / 100;
      return {
        product: d.product, previousYear: prev, currentYear: curr, variance: vari,
        variancePercentage: prev > 0 ? Math.round(((curr - prev) / prev) * 1000) / 10 : 0,
      };
    });
  }, [data, selectedWeek, selectedUnit, allProductsInData]);

  // FIX: Pisahkan callback sort agar stabil referensinya
  const handleTableSort = useCallback((key: typeof sortConfig extends { key: infer K } | null ? K : never) => {
    setSortConfig(p => p?.key === key
      ? { key, direction: p.direction === 'asc' ? 'desc' : 'asc' }
      : { key, direction: 'asc' });
  }, []);

  const sortedProductDetails = useMemo(() => {
    const rows = selectedCategory !== 'all'
      ? productDetails.filter(d => getProductCategory(d.product) === selectedCategory)
      : productDetails;
    if (!sortConfig) return rows;
    return [...rows].sort((a, b) => {
      const av = a[sortConfig.key], bv = b[sortConfig.key];
      const cmp = typeof av === 'string' ? av.localeCompare(bv as string) : (av as number) - (bv as number);
      return sortConfig.direction === 'asc' ? cmp : -cmp;
    });
  }, [productDetails, sortConfig, selectedCategory]);

  const chartData = useMemo(() => {
    const rows = selectedWeek !== null
      ? data.filter(d => d.week === selectedWeek)
      : [...data].sort((a, b) => a.week - b.week);
    return rows.map(item => {
      let prevVal = 0, currVal = 0;
      if (item.details?.length) {
        item.details.forEach(d => {
          if (selectedCategory !== 'all' && getProductCategory(d.product) !== selectedCategory) return;
          const { previous, current } = resolveUnitValues(d, selectedUnit);
          prevVal += previous; currVal += current;
        });
      } else {
        // FIX: Hindari cast yang tidak aman — gunakan fallback langsung ke angka
        prevVal = (item as unknown as { previousYear: number }).previousYear ?? 0;
        currVal = (item as unknown as { currentYear:  number }).currentYear  ?? 0;
      }
      const variance = currVal - prevVal;
      return {
        week: `W${item.week}`, previousYear: prevVal, currentYear: currVal,
        variance, variancePercentage: prevVal > 0 ? (variance / prevVal) * 100 : 0,
      };
    });
  }, [data, selectedUnit, selectedCategory, selectedWeek]);

  // Heights
  const inlineChartH = isMobile ? 180 : isTablet ? 220 : 250;
  const modalChartH  = Math.max(280, winSize.h * 0.5);
  const modalTableH  = Math.max(320, winSize.h * 0.62);

  // Axis tick style — font sedikit lebih kecil agar semua week label muat
  const axisTickStyle = { fill: t.textMuted, fontSize: isMobile ? 8 : 9, fontFamily: 'IBM Plex Mono,monospace' };
  const tooltipContentStyle = { background: 'transparent', border: 'none', padding: 0, boxShadow: 'none' };
  // Warna grid: horizontal sedikit lebih terang, vertikal lebih samar
  const gridH = theme === 'dark' ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';
  const gridV = theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)';

  // Hitung interval tick XAxis:
  // Tampilkan semua label jika ≤ 26 item, otherwise skip agar tidak tumpang tindih.
  const tickInterval = useCallback(
    (count: number) => {
      if (count <= 26) return 0;          // semua week tampil
      return Math.max(1, Math.ceil(count / 24) - 1);
    },
    [],
  );

  const lineSummary = useMemo(() => {
    const totP = chartData.reduce((s, r) => s + r.previousYear, 0);
    const totC = chartData.reduce((s, r) => s + r.currentYear, 0);
    const vari = totC - totP;
    return { totP, totC, vari, pct: totP > 0 ? (vari / totP) * 100 : 0 };
  }, [chartData]);

  const barSummary = useMemo(() => {
    const posRows = chartData.filter(r => r.variancePercentage >= 0);
    const negRows = chartData.filter(r => r.variancePercentage <  0);
    const avg     = chartData.length ? chartData.reduce((s, r) => s + r.variancePercentage, 0) / chartData.length : 0;
    const avgP    = posRows.length ? posRows.reduce((s, r) => s + r.variancePercentage, 0) / posRows.length : 0;
    const avgN    = negRows.length ? negRows.reduce((s, r) => s + r.variancePercentage, 0) / negRows.length : 0;
    return { avg, avgP, avgN, pos: posRows.length, neg: negRows.length };
  }, [chartData]);

  // ── Render charts ──────────────────────────────────────────────────────────
  type CD = typeof chartData;

  const renderLineChart = useCallback((h: number, d: CD = chartData) => (
    <ResponsiveContainer width="100%" height={h}>
      <LineChart data={d} margin={isMobile ? { left: -8, right: 6, top: 6, bottom: 2 } : { left: 2, right: 10, top: 8, bottom: 2 }}>
        {/* Garis bantu horizontal — putus-putus halus */}
        <CartesianGrid
          strokeDasharray="3 5"
          horizontal={true}
          vertical={false}
          stroke={gridH}
        />
        {/* Garis bantu vertikal — solid, lebih samar dari horizontal */}
        <CartesianGrid
          strokeDasharray="0"
          horizontal={false}
          vertical={true}
          stroke={gridV}
          strokeWidth={1}
        />
        <XAxis
          dataKey="week"
          tick={axisTickStyle}
          axisLine={false}
          tickLine={false}
          interval={tickInterval(d.length)}
          // Sedikit padding agar label W1 & Wlast tidak terpotong
          padding={{ left: 8, right: 8 }}
        />
        <YAxis tickFormatter={fmtK} tick={axisTickStyle} axisLine={false} tickLine={false} width={isMobile ? 34 : 44} />
        <Tooltip
          content={(props: unknown) => {
            const p = props as { active?: boolean; payload?: LinePayload[]; label?: string };
            return <TooltipLine active={p.active} payload={p.payload} label={p.label} theme={theme} />;
          }}
          cursor={{ stroke: t.textMuted, strokeWidth: 1, strokeDasharray: '3 3' }}
          contentStyle={tooltipContentStyle}
        />
        <Line type="monotone" dataKey="previousYear" stroke={PREV_COLOR} strokeWidth={1.5} strokeDasharray="4 3" dot={false} activeDot={false} name={String(previousYearLabel)} />
        <Line type="monotone" dataKey="currentYear"  stroke={CURR_COLOR} strokeWidth={isMobile ? 2 : 2.5} dot={false} activeDot={{ r: 4, fill: CURR_COLOR, stroke: '#fff', strokeWidth: 2 }} name={String(currentYearLabel)} />
      </LineChart>
    </ResponsiveContainer>
  ), [isMobile, t, axisTickStyle, tickInterval, theme, previousYearLabel, currentYearLabel, tooltipContentStyle, chartData, gridH, gridV]);

  const renderBarChart = useCallback((h: number, d: CD = chartData) => (
    <ResponsiveContainer width="100%" height={h}>
      <BarChart data={d} margin={isMobile ? { left: -8, right: 6, top: 6, bottom: 2 } : { left: 2, right: 10, top: 8, bottom: 2 }} barCategoryGap={d.length > 20 ? '5%' : '20%'}>
        {/* Horizontal grid */}
        <CartesianGrid strokeDasharray="3 5" horizontal={true} vertical={false} stroke={gridH} />
        {/* Vertical grid — lebih samar dari horizontal */}
        <CartesianGrid strokeDasharray="0" horizontal={false} vertical={true} stroke={gridV} strokeWidth={1} />
        <XAxis
          dataKey="week"
          tick={axisTickStyle}
          axisLine={false}
          tickLine={false}
          interval={tickInterval(d.length)}
          padding={{ left: 8, right: 8 }}
        />
        <YAxis tickFormatter={v => `${v.toFixed(0)}%`} tick={axisTickStyle} axisLine={false} tickLine={false} width={isMobile ? 34 : 44} />
        <ReferenceLine y={0} stroke={t.textMuted} strokeWidth={1} />
        <Tooltip
          content={(props: unknown) => {
            const p = props as { active?: boolean; payload?: { value?: number }[]; label?: string };
            return <TooltipBar active={p.active} payload={p.payload} label={p.label} theme={theme} />;
          }}
          cursor={{ fill: t.inputBorder, opacity: 0.5 }}
          contentStyle={tooltipContentStyle}
        />
        <Bar dataKey="variancePercentage" radius={[3, 3, 0, 0]} maxBarSize={32}>
          {d.map((entry, i) => (
            <Cell key={`cell-${i}`} fill={entry.variancePercentage >= 0 ? POS_COLOR : NEG_COLOR}
              fillOpacity={Math.min(1, 0.45 + Math.abs(entry.variancePercentage) / 30)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  ), [isMobile, t, axisTickStyle, tickInterval, theme, tooltipContentStyle, chartData, gridH, gridV]);

  // Table columns
  type ColKey = 'product' | 'previousYear' | 'currentYear' | 'variance' | 'variancePercentage';
  const allCols: { key: ColKey; label: string; right?: boolean; mobileHide?: boolean }[] = useMemo(() => [
    { key: 'product',            label: 'Produk',                  right: false },
    { key: 'previousYear',       label: String(previousYearLabel), right: true, mobileHide: true },
    { key: 'currentYear',        label: String(currentYearLabel),  right: true },
    { key: 'variance',           label: 'Variance',                right: true, mobileHide: true },
    { key: 'variancePercentage', label: 'Var %',                   right: true },
  ], [previousYearLabel, currentYearLabel]);

    const tableCols = useMemo(
    () => allCols,
    [allCols],
  );

  const card = useCallback((extra: React.CSSProperties = {}): React.CSSProperties => ({
    background: t.cardBg, border: `1px solid ${t.border}`,
    borderRadius: isMobile ? 10 : 12, overflow: 'hidden', boxShadow: t.shadow, ...extra,
  }), [t, isMobile]);

  const modalTitle = expandTarget
    ? `${expandTarget.chart === 'line' ? 'Tren Penjualan' : 'Varians Mingguan'} — ${expandTarget.mode === 'table' ? 'Tabel Data' : 'Diperbesar'}`
    : '';

  // ── Memoized summary cells ─────────────────────────────────────────────────
  const lineCells = useMemo(() => [
    { label: String(previousYearLabel), value: fmtExact(lineSummary.totP) },
    { label: String(currentYearLabel),  value: fmtExact(lineSummary.totC) },
    {
      label: 'Selisih',
      value: `${lineSummary.vari >= 0 ? '+' : ''}${fmtExact(lineSummary.vari)} (${fmtPct(lineSummary.pct)})`,
      color: lineSummary.vari >= 0 ? POS_COLOR : NEG_COLOR,
    },
  ], [lineSummary]);

  const barCells = useMemo(() => [
    { label: 'Rata-rata',           value: fmtPct(barSummary.avg),  color: barSummary.avg  >= 0 ? POS_COLOR : NEG_COLOR },
    { label: `Positif (${barSummary.pos}wk)`, value: fmtPct(barSummary.avgP), color: POS_COLOR },
    { label: `Negatif (${barSummary.neg}wk)`, value: fmtPct(barSummary.avgN), color: NEG_COLOR },
  ], [barSummary]);

  // ── JSX ────────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 12 : 20, fontFamily: 'IBM Plex Sans,sans-serif' }}>

      {/* Info banner */}
      <div style={{ padding: isMobile ? '8px 10px' : '10px 14px', background: t.infoBg, border: `1px solid ${t.infoBorder}`, borderRadius: isMobile ? 8 : 10 }}>
        <p style={{ margin: 0, fontSize: isMobile ? 10 : 12, color: t.infoText, fontFamily: 'IBM Plex Mono,monospace', lineHeight: 1.6 }}>
          {isMobile
            ? <><strong>{String(previousYearLabel)}</strong> vs <strong>{String(currentYearLabel)}</strong><br />{previousWeekRangeLabel} — {data.length} minggu</>
            : <><strong>Periode:</strong> {previousWeekRangeLabel} vs {currentWeekRangeLabel}&nbsp;|&nbsp;<strong>Tahun:</strong> {String(previousYearLabel)} vs {String(currentYearLabel)}&nbsp;|&nbsp;<strong>Total Minggu:</strong> {data.length}</>
          }
        </p>
      </div>

      {/* Filter */}
      <div style={{ ...card(), padding: isMobile ? 14 : 20 }}>
        <span style={{ fontSize: isMobile ? 10 : 11, fontWeight: 700, color: t.textMuted, fontFamily: 'IBM Plex Mono,monospace', textTransform: 'uppercase', letterSpacing: '.08em', display: 'block', marginBottom: isMobile ? 8 : 10 }}>
          Filter Data
        </span>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, auto)', gap: 8, alignItems: 'center', justifyContent: isMobile ? 'stretch' : 'flex-start' }}>
          <FilterSelect label="Unit" accentColor="#10b981" value={selectedUnit} onChange={e => setSelectedUnit(e.target.value)} theme={theme} fullWidth={isMobile}>
            {unitOptions.map(o => <option key={o.value} value={o.value} style={{ background: t.selectBg }}>{o.label}</option>)}
          </FilterSelect>
          <FilterSelect label="Kategori" accentColor="#8b5cf6" value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} theme={theme} fullWidth={isMobile}>
            <option value="all" style={{ background: t.selectBg }}>Semua</option>
            {availableCategories.map(c => <option key={c} value={c} style={{ background: t.selectBg }}>{c}</option>)}
          </FilterSelect>
          <div style={{ gridColumn: isMobile ? '1 / -1' : undefined }}>
            <FilterSelect label="Minggu" accentColor="#3b82f6" value={selectedWeek ?? 'all'} onChange={e => setSelectedWeek(e.target.value === 'all' ? null : Number(e.target.value))} theme={theme} fullWidth={isMobile}>
              <option value="all" style={{ background: t.selectBg }}>Semua Minggu</option>
              {weekOptions.map(w => <option key={w} value={w} style={{ background: t.selectBg }}>Week {w}</option>)}
            </FilterSelect>
          </div>
        </div>
      </div>

      {/* Charts grid */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 12 : 14 }}>
        {(['line', 'bar'] as const).map(chartType => {
          const isLine  = chartType === 'line';
          const inTable = tableView === chartType;

          return (
            <div key={chartType} style={card()}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: isMobile ? '12px 12px 10px' : '14px 16px 10px', gap: 6, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: isMobile ? 11 : 12, fontWeight: 600, color: t.text, fontFamily: 'IBM Plex Mono,monospace', textTransform: 'uppercase', letterSpacing: '.05em' }}>
                    {isLine ? 'Tren Penjualan' : 'Varians Mingguan'}
                  </div>
                  <div style={{ fontSize: 10, color: t.textMuted, fontFamily: 'IBM Plex Mono,monospace', marginTop: 2 }}>
                    {isLine
                      ? `${String(previousYearLabel)} vs ${String(currentYearLabel)}`
                      : `${barSummary.pos} positif · ${barSummary.neg} negatif`
                    }
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  {!inTable && !isMobile && (
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      {isLine
                        ? <>
                            <LegendPill color={PREV_COLOR} label={String(previousYearLabel)} dash theme={theme} />
                            <LegendPill color={CURR_COLOR} label={String(currentYearLabel)}  theme={theme} />
                          </>
                        : <>
                            <DotLegend color={POS_COLOR} label="Positif" theme={theme} />
                            <DotLegend color={NEG_COLOR} label="Negatif" theme={theme} />
                          </>
                      }
                    </div>
                  )}
                  <TableBtn onClick={() => setTableView(v => v === chartType ? null : chartType)} theme={theme} active={inTable} />
                  <ExpandBtn onClick={() => setExpandTarget({ chart: chartType, mode: inTable ? 'table' : 'chart' })} theme={theme} isTable={inTable} />
                </div>
              </div>

              {/* Content */}
              {inTable ? (
                <div style={{ padding: '0 12px 12px' }}>
                  <ChartTableView type={chartType} data={chartData} previousYearLabel={previousYearLabel} currentYearLabel={currentYearLabel} theme={theme} maxHeight={isMobile ? 260 : 320} />
                </div>
              ) : (
                <>
                  <div style={{ padding: isMobile ? '0 8px' : '0 12px' }}>
                    <ChartViewport theme={theme} height={inlineChartH} data={chartData}>
                      {sliced => isLine ? renderLineChart(inlineChartH, sliced) : renderBarChart(inlineChartH, sliced)}
                    </ChartViewport>
                  </div>
                  <ChartSummary cells={isLine ? lineCells : barCells} theme={theme} />
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Detail product table */}
      <div style={{ ...card(), padding: isMobile ? 14 : 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontSize: isMobile ? 12 : 13, fontWeight: 700, color: t.text, fontFamily: 'IBM Plex Sans,sans-serif' }}>Perbandingan Detail</span>
          <span style={{ fontSize: 10, color: t.textMuted, fontFamily: 'IBM Plex Mono,monospace' }}>
            {sortedProductDetails.length > 0
              ? (selectedWeek === null ? `${sortedProductDetails.length} produk` : `${sortedProductDetails.length} · W${selectedWeek}`)
              : 'Kosong'}
          </span>
        </div>
        <div style={{ border: `1px solid ${t.border}`, borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' as React.CSSProperties['WebkitOverflowScrolling'] }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: isMobile ? 460 : 560 }}>
              <thead>
                <tr>
                  {tableCols.map(col => (
                    <th key={col.key}
                      onClick={() => handleTableSort(col.key as ColKey)}
                      style={{ padding: isMobile ? '8px 10px' : '10px 16px', textAlign: col.right ? 'right' : 'left', fontSize: isMobile ? 9 : 10, fontFamily: 'IBM Plex Mono,monospace', textTransform: 'uppercase', letterSpacing: '.07em', fontWeight: 600, color: t.theadText, background: t.theadBg, borderBottom: `1px solid ${t.border}`, cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: col.right ? 'flex-end' : 'flex-start', gap: 2, width: '100%' }}>
                        {col.label}<SortIcon colKey={col.key} sortConfig={sortConfig} theme={theme} />
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedProductDetails.length > 0 ? sortedProductDetails.map((detail, i) => {
                  const pos = detail.variance >= 0;
                  return (
                    <tr key={detail.product}
                      style={{ background: i % 2 === 0 ? 'transparent' : t.rowAlt, transition: 'background .12s' }}
                      onMouseEnter={e => ((e.currentTarget as HTMLTableRowElement).style.background = t.rowHover)}
                      onMouseLeave={e => ((e.currentTarget as HTMLTableRowElement).style.background = i % 2 === 0 ? 'transparent' : t.rowAlt)}>
                      <td style={{ padding: isMobile ? '8px 10px' : '10px 16px', fontSize: isMobile ? 11 : 12, color: t.text, fontWeight: 500, fontFamily: 'IBM Plex Sans,sans-serif', borderBottom: `1px solid ${t.borderLight}`, maxWidth: isMobile ? 110 : 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{detail.product}</td>
                      <td style={{ padding: '10px 16px', fontSize: 12, color: t.textMuted, fontFamily: 'IBM Plex Mono,monospace', textAlign: 'right', borderBottom: `1px solid ${t.borderLight}`, whiteSpace: 'nowrap' }}>{fmtExact(detail.previousYear)}</td>
                      <td style={{ padding: isMobile ? '8px 10px' : '10px 16px', fontSize: isMobile ? 11 : 12, color: t.text, fontFamily: 'IBM Plex Mono,monospace', fontWeight: 600, textAlign: 'right', borderBottom: `1px solid ${t.borderLight}`, whiteSpace: 'nowrap' }}>{fmtExact(detail.currentYear)}</td>
                      <td style={{ padding: '10px 16px', fontSize: 12, fontFamily: 'IBM Plex Mono,monospace', fontWeight: 600, textAlign: 'right', borderBottom: `1px solid ${t.borderLight}`, whiteSpace: 'nowrap', color: pos ? POS_COLOR : NEG_COLOR }}>{pos ? '+' : ''}{fmtExact(detail.variance)}</td>
                      <td style={{ padding: isMobile ? '8px 10px' : '10px 16px', textAlign: 'right', borderBottom: `1px solid ${t.borderLight}`, whiteSpace: 'nowrap' }}>
                        <GrowthPill value={detail.variancePercentage} />
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={tableCols.length} style={{ padding: '24px 16px', textAlign: 'center', fontSize: 12, color: t.textMuted, fontFamily: 'IBM Plex Mono,monospace' }}>
                      {selectedWeek !== null ? `Tidak ada data untuk ${getUnitLabel(selectedUnit)} di Week ${selectedWeek}.` : 'Tidak ada data produk.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        <p style={{ margin: '8px 0 0', fontSize: isMobile ? 10 : 11, color: t.textMuted, fontFamily: 'IBM Plex Mono,monospace' }}>
          {selectedWeek === null
            ? `${sortedProductDetails.length} produk · ${getUnitLabel(selectedUnit)} · semua minggu`
            : `${sortedProductDetails.length} produk · ${getUnitLabel(selectedUnit)} · Week ${selectedWeek}`
          }
        </p>
      </div>

      {/* Modal */}
      {expandTarget && (
        <ChartModal onClose={() => setExpandTarget(null)} title={modalTitle} theme={theme}>
          {expandTarget.mode === 'table' ? (
            <ChartTableView type={expandTarget.chart} data={chartData} previousYearLabel={previousYearLabel} currentYearLabel={currentYearLabel} theme={theme} maxHeight={modalTableH} />
          ) : (
            <>
              <div style={{ display: 'flex', gap: 14, marginBottom: 12, flexWrap: 'wrap' }}>
                {expandTarget.chart === 'line'
                  ? <>
                      <LegendPill color={PREV_COLOR} label={String(previousYearLabel)} dash theme={theme} />
                      <LegendPill color={CURR_COLOR} label={String(currentYearLabel)} theme={theme} />
                    </>
                  : <>
                      <DotLegend color={POS_COLOR} label="Positif (+)" theme={theme} />
                      <DotLegend color={NEG_COLOR} label="Negatif (−)" theme={theme} />
                    </>
                }
              </div>
              <ChartViewport theme={theme} height={modalChartH} data={chartData}>
                {sliced => expandTarget.chart === 'line' ? renderLineChart(modalChartH, sliced) : renderBarChart(modalChartH, sliced)}
              </ChartViewport>
              <div style={{ marginTop: 12 }}>
                <ChartSummary
                  cells={expandTarget.chart === 'line' ? lineCells : barCells}
                  theme={theme}
                />
              </div>
            </>
          )}
        </ChartModal>
      )}
    </div>
  );
}