'use client';

import React, { useRef, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export const FONT_SANS = '"IBM Plex Sans", sans-serif';
export const FONT_MONO = '"IBM Plex Mono", monospace';

export type Theme = 'dark' | 'light';

export const tk = {
  dark: {
    pagebg: '#070a10', cardbg: '#0e1120',
    inputbg: 'rgba(255,255,255,0.04)',
    dropzoneActive: 'rgba(99,102,241,0.08)',
    border: 'rgba(255,255,255,0.06)', borderCard: 'rgba(255,255,255,0.08)',
    borderInput: 'rgba(255,255,255,0.1)', borderActive: 'rgba(99,102,241,0.6)',
    text: 'rgba(255,255,255,0.92)', textSub: 'rgba(255,255,255,0.58)',
    textMuted: 'rgba(255,255,255,0.32)', textFaint: 'rgba(255,255,255,0.15)',
    tableHead: 'rgba(255,255,255,0.02)', tableAlt: 'rgba(255,255,255,0.015)',
    sidebarbg: '#07120a',
    sidebarBorder: 'rgba(255,255,255,0.06)',
    sidebarText: 'rgba(255,255,255,0.4)',
    shadow: '0 1px 3px rgba(0,0,0,0.3)',
    headerbg: '#0a0d14',
    blue:   { bg: 'rgba(99,102,241,0.12)',  text: '#a5b4fc', border: 'rgba(99,102,241,0.3)'  },
    green:  { bg: 'rgba(16,185,129,0.1)',   text: '#6ee7b7', border: 'rgba(16,185,129,0.25)' },
    red:    { bg: 'rgba(239,68,68,0.1)',    text: '#fca5a5', border: 'rgba(239,68,68,0.22)'  },
    yellow: { bg: 'rgba(245,158,11,0.1)',   text: '#fcd34d', border: 'rgba(245,158,11,0.28)' },
    gray:   { bg: 'rgba(255,255,255,0.05)', text: 'rgba(255,255,255,0.42)', border: 'rgba(255,255,255,0.08)' },
    btnDisabled: { bg: 'rgba(255,255,255,0.06)', text: 'rgba(255,255,255,0.2)' },
    shadowCard: '0 4px 20px rgba(0,0,0,0.4)',
    shadowElevated: '0 8px 32px rgba(0,0,0,0.5)',
    modalOverlay: 'rgba(0,0,0,0.75)',
    stat1: { accent: '#6366f1', iconBg: 'rgba(99,102,241,0.15)', glow: 'rgba(99,102,241,0.2)' },
    stat2: { accent: '#10b981', iconBg: 'rgba(16,185,129,0.15)', glow: 'rgba(16,185,129,0.2)' },
    stat3: { accent: '#a855f7', iconBg: 'rgba(168,85,247,0.15)', glow: 'rgba(168,85,247,0.2)' },
    stat4: { accent: '#f59e0b', iconBg: 'rgba(245,158,11,0.15)', glow: 'rgba(245,158,11,0.2)' },
  },
  light: {
    pagebg: '#f0f3f9', cardbg: '#ffffff',
    inputbg: '#f8fafc',
    dropzoneActive: 'rgba(99,102,241,0.05)',
    border: 'rgba(0,0,0,0.07)', borderCard: 'rgba(0,0,0,0.09)',
    borderInput: 'rgba(0,0,0,0.12)', borderActive: '#6366f1',
    text: '#0f172a', textSub: '#475569', textMuted: '#94a3b8', textFaint: '#cbd5e1',
    tableHead: '#f8fafc', tableAlt: 'rgba(0,0,0,0.012)',
    sidebarbg: '#0a1a0d', 
    sidebarBorder: 'rgba(255,255,255,0.1)',
    sidebarText: 'rgba(255,255,255,0.5)',
    shadow: '0 1px 2px rgba(0,0,0,0.05)',
    headerbg: '#ffffff',
    blue:   { bg: 'rgba(99,102,241,0.08)', text: '#4f46e5', border: 'rgba(99,102,241,0.2)' },
    green:  { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0' },
    red:    { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' },
    yellow: { bg: '#fffbeb', text: '#d97706', border: '#fde68a' },
    gray:   { bg: '#f1f5f9', text: '#64748b', border: 'rgba(0,0,0,0.09)' },
    btnDisabled: { bg: '#e2e8f0', text: '#94a3b8' },
    shadowCard: '0 2px 10px rgba(0,0,0,0.07)',
    shadowElevated: '0 8px 32px rgba(0,0,0,0.12)',
    modalOverlay: 'rgba(15,23,42,0.45)',
    stat1: { accent: '#6366f1', iconBg: '#e0e7ff', glow: 'rgba(99,102,241,0.12)' },
    stat2: { accent: '#10b981', iconBg: '#d1fae5', glow: 'rgba(16,185,129,0.12)' },
    stat3: { accent: '#a855f7', iconBg: '#ede9fe', glow: 'rgba(168,85,247,0.12)' },
    stat4: { accent: '#f59e0b', iconBg: '#fef3c7', glow: 'rgba(245,158,11,0.12)' },
  },
} as const;

export type Tokens = typeof tk['light'];

export const badge = (bg: string, text: string, border: string): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', gap: 5,
  padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
  fontFamily: FONT_MONO, background: bg, color: text, border: `1px solid ${border}`,
});

export const iconBtn = (bg: string, border: string, size = 32): React.CSSProperties => ({
  width: size, height: size, borderRadius: 8, background: bg,
  border: `1px solid ${border}`, cursor: 'pointer', display: 'flex',
  alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s', flexShrink: 0,
});

export function Spinner({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg style={{ animation: 'spin 0.8s linear infinite', width: size, height: size }} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="3" opacity="0.2" />
      <path d="M4 12a8 8 0 018-8" stroke={color} strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function CardBox({ title, icon: Icon, iconColor = '#6366f1', children, noPad, accent, theme }: {
  title: string;
  icon?: React.ComponentType<{ size?: number; color?: string }>;
  iconColor?: string;
  children: React.ReactNode;
  noPad?: boolean;
  accent?: string;
  theme: Theme;
}) {
  const t = tk[theme];
  return (
    <div style={{ background: t.cardbg, border: `1px solid ${t.borderCard}`, borderRadius: 12, overflow: 'hidden', boxShadow: t.shadowCard }}>
      <div style={{ padding: '12px 15px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: 8, background: accent ? `linear-gradient(90deg, ${accent}0a 0%, transparent 60%)` : undefined }}>
        {Icon && (
          <div style={{ width: 26, height: 26, borderRadius: 7, background: iconColor + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={13} color={iconColor} />
          </div>
        )}
        <span style={{ fontSize: 13, fontWeight: 700, color: t.text }}>{title}</span>
      </div>
      <div style={noPad ? {} : { padding: '15px' }}>{children}</div>
    </div>
  );
}

export function FormGroup({ label, children, hint, theme }: {
  label: string; children: React.ReactNode; hint?: string; theme: Theme;
}) {
  const t = tk[theme];
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: t.textSub, marginBottom: 5 }}>{label}</label>
      {children}
      {hint && <div style={{ fontSize: 11, color: t.textMuted, marginTop: 4, fontFamily: FONT_MONO }}>{hint}</div>}
    </div>
  );
}

export function ConfirmModal({ open, title, message, confirmLabel = 'Konfirmasi', danger = false, onConfirm, onCancel, theme }: {
  open: boolean; title: string; message: string; confirmLabel?: string;
  danger?: boolean; onConfirm: () => void; onCancel: () => void; theme: Theme;
}) {
  const t = tk[theme];
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
      if (e.key === 'Enter') onConfirm();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onCancel, onConfirm]);
  if (!open) return null;
  const ac = danger ? t.red : t.yellow;
  return (
    <div ref={ref} onClick={e => { if (e.target === ref.current) onCancel(); }}
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: t.modalOverlay, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(4px)' }}>
      <div style={{ background: t.cardbg, border: `1px solid ${t.borderCard}`, borderRadius: 16, padding: 24, width: '100%', maxWidth: 420, boxShadow: t.shadowElevated, animation: 'slideUp 0.2s ease' }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: ac.bg, border: `1px solid ${ac.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <AlertTriangle size={18} color={ac.text} />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: t.text, marginBottom: 5 }}>{title}</div>
            <div style={{ fontSize: 13, color: t.textSub, lineHeight: 1.65 }}>{message}</div>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onCancel} style={{ padding: '8px 18px', borderRadius: 9, fontSize: 13, fontWeight: 600, background: t.gray.bg, color: t.gray.text, border: `1px solid ${t.gray.border}`, cursor: 'pointer' }}>Batal</button>
          <button onClick={onConfirm} style={{ padding: '8px 18px', borderRadius: 9, fontSize: 13, fontWeight: 600, background: danger ? '#dc2626' : '#6366f1', color: '#fff', border: 'none', cursor: 'pointer' }}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

export function StatCard({ label, value, cardKey, icon: Icon, sub, trend, theme }: {
  label: string; value: string; cardKey: 'stat1' | 'stat2' | 'stat3' | 'stat4';
  icon: React.ComponentType<{ size?: number; color?: string }>;
  sub?: string; trend?: 'up' | 'down' | 'neutral'; theme: Theme;
}) {
  const t = tk[theme];
  const s = t[cardKey];
  const [hovered, setHovered] = React.useState(false);
  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ background: t.cardbg, border: `1px solid ${hovered ? s.accent + '40' : t.borderCard}`, borderRadius: 14, padding: '18px 16px 14px', display: 'flex', flexDirection: 'column', gap: 10, boxShadow: hovered ? `0 6px 24px ${s.glow}` : t.shadowCard, transition: 'all 0.2s ease', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: s.accent, borderRadius: '14px 14px 0 0', opacity: hovered ? 1 : 0.6, transition: 'opacity 0.2s' }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 700, fontFamily: FONT_MONO, textTransform: 'uppercase', letterSpacing: '0.1em', color: t.textMuted, marginBottom: 8 }}>{label}</div>
          <div style={{ fontSize: 22, fontWeight: 800, fontFamily: FONT_MONO, color: t.text, lineHeight: 1, letterSpacing: '-0.03em', wordBreak: 'break-word' }}>{value}</div>
          {sub && <div style={{ fontSize: 10, color: t.textMuted, marginTop: 4, fontFamily: FONT_MONO }}>{sub}</div>}
        </div>
        <div style={{ width: 42, height: 42, borderRadius: 11, background: s.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={19} color={s.accent} />
        </div>
      </div>
      {trend && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, paddingTop: 6, borderTop: `1px solid ${t.border}` }}>
          {trend === 'up'      && <span style={{ fontSize: 10, color: t.green.text, fontFamily: FONT_MONO, fontWeight: 600 }}>↑ Naik dari bulan lalu</span>}
          {trend === 'down'    && <span style={{ fontSize: 10, color: t.red.text,   fontFamily: FONT_MONO, fontWeight: 600 }}>↓ Turun dari bulan lalu</span>}
          {trend === 'neutral' && <span style={{ fontSize: 10, color: t.textMuted,  fontFamily: FONT_MONO }}>Tidak ada perubahan</span>}
        </div>
      )}
    </div>
  );
}