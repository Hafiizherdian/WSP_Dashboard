'use client';

import React, {
  useState, useEffect, useCallback,
  createContext, useContext, useRef,
} from 'react';
import {
  Upload, Database, Users, Settings, MapPin,
  Sun, Moon, X, ChevronLeft, ChevronRight,
  ShieldAlert, ShieldCheck, Shield, Menu,
  Layers, LogOut, BarChart3, TrendingUp,
} from 'lucide-react';
import { UploadedFile, DatabaseStats } from '@/types/database';
import AreaManagement from '@/components/AreaManagement';
import { AuthProvider, useAuth } from '@/lib/auth/AuthContext';
import UserManagement from '@/components/UserManagement';
import { ROLE_LABELS, UserRole } from '@/lib/auth/types';

// Komponen yang sudah dipisah
import UploadPenjualanTab  from '@/components/admin/UploadPenjualanTab';
import UploadDistribusiTab from '@/components/admin/UploadDistribusiTab';
import SettingsTab         from '@/components/admin/SettingsTab';
import { tk, Theme, Tokens, FONT_SANS, FONT_MONO } from '@/components/admin/shared';

// ─── Toast ────────────────────────────────────────────────────────────────────
type ToastType = 'success' | 'error' | 'warning' | 'info';
interface Toast { id: string; type: ToastType; title: string; message?: string }

const ToastCtx = createContext<{ addToast: (type: ToastType, title: string, msg?: string) => void }>({ addToast: () => {} });
const useToast = () => useContext(ToastCtx);

function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const { t } = useTheme();
  const rm = useCallback((id: string) => setToasts(p => p.filter(i => i.id !== id)), []);
  const addToast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(p => [...p, { id, type, title, message }]);
    setTimeout(() => rm(id), 4000);
  }, [rm]);

  const COLOR: Record<ToastType, keyof typeof t> = { success: 'green', error: 'red', warning: 'yellow', info: 'blue' };

  return (
    <ToastCtx.Provider value={{ addToast }}>
      {children}
      <div style={{ position: 'fixed', bottom: 20, right: 16, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none', maxWidth: 'calc(100vw - 32px)' }}>
        {toasts.map(toast => {
          const c = t[COLOR[toast.type]] as { bg: string; text: string; border: string };
          return (
            <div key={toast.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', borderRadius: 12, background: t.cardbg, border: `1px solid ${c.border}`, boxShadow: t.shadowElevated, minWidth: 260, maxWidth: 340, pointerEvents: 'all', animation: 'toastIn 0.25s ease' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: t.text }}>{toast.title}</div>
                {toast.message && <div style={{ fontSize: 12, color: t.textSub, marginTop: 2, lineHeight: 1.5 }}>{toast.message}</div>}
              </div>
              <button onClick={() => rm(toast.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.textMuted, padding: 2 }}><X size={11} /></button>
            </div>
          );
        })}
      </div>
    </ToastCtx.Provider>
  );
}

// ─── Theme ────────────────────────────────────────────────────────────────────
const ThemeCtx = createContext<{ theme: Theme; setTheme: (t: Theme) => void; t: Tokens }>({ theme: 'light', setTheme: () => {}, t: tk.light });
const useTheme = () => useContext(ThemeCtx);

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, set] = useState<Theme>('light');
  useEffect(() => { try { const s = localStorage.getItem('admin-theme') as Theme | null; if (s) set(s); } catch {} }, []);
  const setTheme = useCallback((v: Theme) => { set(v); try { localStorage.setItem('admin-theme', v); } catch {} }, []);
  return <ThemeCtx.Provider value={{ theme, setTheme, t: tk[theme] as Tokens }}>{children}</ThemeCtx.Provider>;
}

// ─── Admin Guard ──────────────────────────────────────────────────────────────
function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, can, loading } = useAuth();
  const [dots, setDots] = useState(0);

  useEffect(() => {
    const iv = setInterval(() => setDots(d => (d + 1) % 4), 500);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    if (!loading && !user) window.location.href = '/login?from=' + encodeURIComponent(window.location.pathname);
  }, [user, loading]);

  if (loading || !user) return (
    <div style={{ minHeight: '100vh', background: '#07090e', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 0, fontFamily: 'IBM Plex Mono, monospace' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&display=swap');
        @keyframes sgPulse { 0%,100%{opacity:0.7;transform:scale(1)} 50%{opacity:1;transform:scale(1.06)} }
        @keyframes sgRing  { to{transform:rotate(360deg)} }
        @keyframes sgFadeUp{ from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes sgBar   { 0%{width:0%} 40%{width:60%} 70%{width:82%} 100%{width:96%} }
      `}</style>
      <div style={{ animation: 'sgFadeUp 0.5s ease both', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
        <div style={{ position: 'relative', width: 64, height: 64 }}>
          <svg style={{ position: 'absolute', inset: 0, animation: 'sgRing 1.4s linear infinite' }} width="64" height="64" viewBox="0 0 64 64" fill="none">
            <circle cx="32" cy="32" r="28" stroke="rgba(28,151,6,0.15)" strokeWidth="2.5"/>
            <path d="M32 4 a28 28 0 0 1 24.2 14" stroke="#1c9706" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
          <div style={{ position: 'absolute', inset: 10, borderRadius: 12, background: 'rgba(28,151,6,0.12)', border: '1px solid rgba(28,151,6,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'sgPulse 2s ease-in-out infinite' }}>
            <img src="/logo-cgkn.png" alt="CGKN" style={{ width: 28, height: 28, objectFit: 'contain' }}/>
          </div>
        </div>
        <div style={{ textAlign: 'center', animation: 'sgFadeUp 0.5s 0.1s ease both', opacity: 0 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'rgba(255,255,255,0.9)', letterSpacing: '-0.03em', lineHeight: 1 }}>CGKN</div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.22)', letterSpacing: '0.22em', textTransform: 'uppercase', marginTop: 4 }}>Admin Panel</div>
        </div>
        <div style={{ animation: 'sgFadeUp 0.5s 0.2s ease both', opacity: 0, width: 160 }}>
          <div style={{ height: 2, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
            <div style={{ height: '100%', background: 'linear-gradient(90deg, #1c9706, #4ade80)', borderRadius: 2, animation: 'sgBar 2.5s cubic-bezier(0.4,0,0.2,1) forwards' }}/>
          </div>
        </div>
        <div style={{ animation: 'sgFadeUp 0.5s 0.3s ease both', opacity: 0, fontSize: 10, color: 'rgba(255,255,255,0.22)', letterSpacing: '0.06em' }}>
          Memverifikasi sesi{'.' .repeat(dots)}
        </div>
      </div>
    </div>
  );

  if (!can('access_admin_panel')) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080b12', color: '#fff', flexDirection: 'column', gap: 16 }}>
      <ShieldAlert size={48} color="#ef4444" />
      <span style={{ fontSize: 16, fontWeight: 600 }}>Akses Ditolak</span>
      <span style={{ fontSize: 14, opacity: 0.7, textAlign: 'center', maxWidth: 400 }}>Anda tidak memiliki akses ke panel admin.</span>
    </div>
  );

  return <>{children}</>;
}

// ─── Responsive ───────────────────────────────────────────────────────────────
const BP_MD = 768;
const SIDEBAR_W = 252;
const SIDEBAR_W_COLLAPSED = 64;

function useWindowWidth() {
  const [width, setWidth] = useState(() => typeof window !== 'undefined' ? window.innerWidth : 1280);
  useEffect(() => { const h = () => setWidth(window.innerWidth); window.addEventListener('resize', h); return () => window.removeEventListener('resize', h); }, []);
  return width;
}

// ─── Role config ──────────────────────────────────────────────────────────────
const ROLE_CFG: Record<UserRole, { Icon: React.ComponentType<any>; color: string; bg: string; border: string }> = {
  root:  { Icon: ShieldAlert, color: '#a78bfa', bg: 'rgba(167,139,250,0.1)',  border: 'rgba(167,139,250,0.25)' },
  admin: { Icon: ShieldCheck, color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',   border: 'rgba(96,165,250,0.25)'  },
  user:  { Icon: Shield,      color: '#34d399', bg: 'rgba(52,211,153,0.1)',   border: 'rgba(52,211,153,0.25)'  },
};

// ─── Nav sections ─────────────────────────────────────────────────────────────
const NAV_SECTIONS = [
  {
    section: 'DATA',
    items: [
      { id: 'upload-penjualan',  label: 'Upload Penjualan',  icon: Upload,      accent: '#6366f1' },
      { id: 'upload-distribusi', label: 'Upload Distribusi', icon: TrendingUp,  accent: '#10b981' },
      { id: 'areas',             label: 'Management Area',   icon: MapPin,      accent: '#0d9488' },
    ],
  },
  {
    section: 'ADMIN',
    items: [
      { id: 'users',    label: 'Manajemen User', icon: Users,    accent: '#a855f7' },
      { id: 'settings', label: 'Pengaturan',     icon: Settings, accent: '#f59e0b' },
    ],
  },
];

const PERM_MAP: Record<string, string> = {
  'upload-penjualan':  'view_files',
  'upload-distribusi': 'upload_file',
  areas:               'view_areas',
  users:               'manage_users',
  settings:            'view_files',
};

const PAGE_META: Record<string, { title: string; subtitle: string; icon: React.ComponentType<any>; color: string }> = {
  'upload-penjualan':  { title: 'Upload Penjualan',  subtitle: 'File data penjualan (.xlsx)',   icon: Upload,     color: '#6366f1' },
  'upload-distribusi': { title: 'Upload Distribusi', subtitle: 'File data distribusi (.xlsx)',  icon: TrendingUp, color: '#10b981' },
  areas:               { title: 'Management Area',   subtitle: 'Target DOS per area',           icon: MapPin,     color: '#0d9488' },
  users:               { title: 'Manajemen User',    subtitle: 'Kelola akun pengguna',          icon: Users,      color: '#a855f7' },
  settings:            { title: 'Pengaturan',        subtitle: 'Akun & konfigurasi',            icon: Settings,   color: '#f59e0b' },
};

// ─── NavItem ──────────────────────────────────────────────────────────────────
function NavItem({ label, icon: Icon, active, collapsed, badge: bdg, onClick, accent = '#6366f1' }: {
  label: string; icon: React.ComponentType<any>; active: boolean; collapsed: boolean;
  badge?: number; onClick: () => void; accent?: string;
}) {
  const { t } = useTheme();
  const [hovered, setHovered] = useState(false);
  const lit = active || hovered;
  return (
    <button onClick={onClick} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} title={collapsed ? label : undefined}
      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: collapsed ? 0 : 10, padding: collapsed ? '10px' : '9px 12px 9px 14px', justifyContent: collapsed ? 'center' : 'flex-start', background: active ? `linear-gradient(90deg, ${accent}22 0%, ${accent}08 100%)` : hovered ? 'rgba(255,255,255,0.04)' : 'transparent', border: 'none', borderLeft: active ? `2.5px solid ${accent}` : '2.5px solid transparent', borderRadius: collapsed ? 10 : '0 10px 10px 0', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s ease', marginBottom: 1, position: 'relative' }}>
      <div style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: active ? accent + '22' : lit ? 'rgba(255,255,255,0.06)' : 'transparent', transition: 'background 0.15s' }}>
        <Icon size={15} color={active ? accent : lit ? 'rgba(255,255,255,0.75)' : t.sidebarText} />
      </div>
      {!collapsed && (
        <>
          <span style={{ fontSize: 13, fontWeight: active ? 600 : 400, color: active ? '#fff' : lit ? 'rgba(255,255,255,0.8)' : t.sidebarText, flex: 1, letterSpacing: active ? '-0.01em' : 0 }}>{label}</span>
          {bdg !== undefined && bdg > 0 && <span style={{ fontSize: 10, fontWeight: 700, fontFamily: FONT_MONO, background: accent, color: '#fff', padding: '1px 7px', borderRadius: 12 }}>{bdg}</span>}
        </>
      )}
      {collapsed && hovered && (
        <div style={{ position: 'absolute', left: 'calc(100% + 12px)', top: '50%', transform: 'translateY(-50%)', background: '#1a1f35', color: '#fff', padding: '7px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: 200, boxShadow: '0 4px 16px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}>
          {label}
          <div style={{ position: 'absolute', right: '100%', top: '50%', transform: 'translateY(-50%)', border: '5px solid transparent', borderRightColor: '#1a1f35' }} />
        </div>
      )}
    </button>
  );
}

// ─── Sidebar content ──────────────────────────────────────────────────────────
function SidebarContent({ activeTab, setActiveTab, collapsed, setCollapsed, can, uploadedFiles, isMobile, onClose }: {
  activeTab: string; setActiveTab: (id: string) => void;
  collapsed: boolean; setCollapsed: (v: boolean) => void;
  can: (p: string) => boolean; uploadedFiles: UploadedFile[];
  isMobile: boolean; onClose: () => void;
}) {
  const { theme, setTheme, t } = useTheme();
  const { user, logout } = useAuth();

  return (
    <>
      {/* Logo */}
      <div style={{ padding: collapsed ? '14px 0' : '14px 16px', borderBottom: `1px solid ${t.sidebarBorder}`, display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between', gap: 10, height: 64, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: 'rgba(28,151,6,0.15)', border: '1px solid rgba(28,151,6,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
  <img src="/logo-cgkn.png" alt="CGKN" style={{ width: 24, height: 24, objectFit: 'contain' }} />
</div>
          {!collapsed && (
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', fontFamily: FONT_MONO, whiteSpace: 'nowrap', letterSpacing: '-0.02em' }}>Admin Panel</div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontFamily: FONT_MONO, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Sales Management</div>
            </div>
          )}
        </div>
        {!isMobile && (
          <button onClick={() => setCollapsed(!collapsed)} style={{ width: 28, height: 28, borderRadius: 7, flexShrink: 0, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        )}
        {isMobile && (
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 7, cursor: 'pointer', color: 'rgba(255,255,255,0.5)', padding: 6, display: 'flex', flexShrink: 0 }}><X size={14} /></button>
        )}
      </div>

      {/* User info */}
      {user && (
        <div style={{ padding: collapsed ? '12px 0' : '12px 14px', borderBottom: `1px solid ${t.sidebarBorder}`, display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start', gap: 10, flexShrink: 0 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0, background: ROLE_CFG[user.role].bg, border: `1.5px solid ${ROLE_CFG[user.role].border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {React.createElement(ROLE_CFG[user.role].Icon, { size: 15, color: ROLE_CFG[user.role].color })}
          </div>
          {!collapsed && (
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', fontFamily: FONT_MONO, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.username}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: ROLE_CFG[user.role].color, fontFamily: FONT_MONO, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{ROLE_LABELS[user.role]}</div>
            </div>
          )}
        </div>
      )}

      {/* Nav */}
      <nav style={{ flex: 1, padding: collapsed ? '12px 6px' : '12px 0 12px', overflowY: 'auto', overflowX: 'hidden' }}>
        {NAV_SECTIONS.map(({ section, items }) => {
          const visible = items.filter(item => can(PERM_MAP[item.id] ?? 'view_files'));
          if (!visible.length) return null;
          return (
            <div key={section} style={{ marginBottom: 18 }}>
              {!collapsed && <div style={{ fontSize: 9, fontWeight: 700, fontFamily: FONT_MONO, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.18)', padding: '0 16px', marginBottom: 6, textTransform: 'uppercase' }}>{section}</div>}
              {collapsed && <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '4px 10px 8px' }} />}
              {visible.map(item => (
                <NavItem key={item.id} label={item.label} icon={item.icon} active={activeTab === item.id} collapsed={collapsed}
                  badge={item.id === 'upload-penjualan' ? uploadedFiles.length : undefined}
                  accent={item.accent}
                  onClick={() => { setActiveTab(item.id); if (isMobile) onClose(); }} />
              ))}
            </div>
          );
        })}
      </nav>

      {/* Bottom */}
      <div style={{ borderTop: `1px solid ${t.sidebarBorder}`, padding: collapsed ? '10px 6px' : '10px 10px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {collapsed ? (
          <>
            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} style={{ width: '100%', height: 34, borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.5)' }}>
              {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            </button>
            <button onClick={logout} style={{ width: '100%', height: 34, borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <LogOut size={13} color="#f87171" />
            </button>
          </>
        ) : (
          <>
            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 500, fontFamily: FONT_SANS }}>
              {theme === 'dark' ? <Sun size={13} color="rgba(255,255,255,0.5)" /> : <Moon size={13} color="rgba(255,255,255,0.5)" />}
              <span style={{ color: 'rgba(255,255,255,0.4)', flex: 1, textAlign: 'left' }}>{theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}</span>
            </button>
            <button onClick={logout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: FONT_SANS }}>
              <LogOut size={13} color="#f87171" />
              <span style={{ color: '#f87171' }}>Logout</span>
            </button>
          </>
        )}
      </div>
    </>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({ activeTab, setActiveTab, collapsed, setCollapsed, can, uploadedFiles, isMobile, mobileOpen, onMobileClose }: {
  activeTab: string; setActiveTab: (id: string) => void;
  collapsed: boolean; setCollapsed: (v: boolean) => void;
  can: (p: string) => boolean; uploadedFiles: UploadedFile[];
  isMobile: boolean; mobileOpen: boolean; onMobileClose: () => void;
}) {
  const { t } = useTheme();
  if (isMobile) {
    return (
      <>
        {mobileOpen && <div onClick={onMobileClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 28, backdropFilter: 'blur(3px)' }} />}
        <aside style={{ position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 29, width: SIDEBAR_W, background: t.sidebarbg, borderRight: `1px solid ${t.sidebarBorder}`, display: 'flex', flexDirection: 'column', transform: mobileOpen ? 'translateX(0)' : `translateX(-${SIDEBAR_W}px)`, transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1)', overflowY: 'auto', overflowX: 'hidden' }}>
          <SidebarContent activeTab={activeTab} setActiveTab={setActiveTab} collapsed={false} setCollapsed={setCollapsed} can={can} uploadedFiles={uploadedFiles} isMobile={true} onClose={onMobileClose} />
        </aside>
      </>
    );
  }
  const W = collapsed ? SIDEBAR_W_COLLAPSED : SIDEBAR_W;
  return (
    <aside style={{ width: W, minHeight: '100vh', background: t.sidebarbg, borderRight: `1px solid ${t.sidebarBorder}`, display: 'flex', flexDirection: 'column', transition: 'width 0.22s cubic-bezier(0.4,0,0.2,1)', flexShrink: 0, position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 30, overflowX: 'hidden', overflowY: 'auto' }}>
      <SidebarContent activeTab={activeTab} setActiveTab={setActiveTab} collapsed={collapsed} setCollapsed={setCollapsed} can={can} uploadedFiles={uploadedFiles} isMobile={false} onClose={() => {}} />
    </aside>
  );
}

// ─── Topbar ───────────────────────────────────────────────────────────────────
function Topbar({ activeTab, onMobileMenuToggle }: { activeTab: string; onMobileMenuToggle: () => void }) {
  const { t } = useTheme();
  const w = useWindowWidth();
  const isMobile = w < BP_MD;
  const page = PAGE_META[activeTab] ?? { title: activeTab, subtitle: '', icon: Layers, color: '#6366f1' };
  const PageIcon = page.icon;

  return (
    <header style={{ height: 56, background: t.headerbg, borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', padding: `0 ${isMobile ? 12 : 20}px`, gap: isMobile ? 8 : 12, flexShrink: 0, boxShadow: t.shadow }}>
      {isMobile && (
        <button onClick={onMobileMenuToggle} style={{ width: 34, height: 34, background: t.inputbg, border: `1px solid ${t.border}`, borderRadius: 9, cursor: 'pointer', color: t.textSub, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Menu size={16} />
        </button>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: page.color + '15', border: `1px solid ${page.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <PageIcon size={15} color={page.color} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: isMobile ? 13 : 14, fontWeight: 700, color: t.text, lineHeight: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{page.title}</div>
          {!isMobile && <div style={{ fontSize: 11, color: t.textMuted, fontFamily: FONT_MONO, marginTop: 2 }}>{page.subtitle}</div>}
        </div>
      </div>
    </header>
  );
}

// ─── Dashboard Content ────────────────────────────────────────────────────────
function DashboardContent() {
  const { t, theme } = useTheme();
  const { addToast } = useToast();
  const { can } = useAuth();
  const w = useWindowWidth();
  const isMobile = w < BP_MD;

  const [uploadedFiles,     setUploadedFiles]     = useState<UploadedFile[]>([]);
  const [distFiles,         setDistFiles]         = useState<any[]>([]);
  const [dbStats,           setDbStats]           = useState<DatabaseStats | null>(null);
  const [isLoading,         setIsLoading]         = useState(true);
  const [activeTab,         setActiveTab]         = useState('upload-penjualan');
  const [sidebarCollapsed,  setSidebarCollapsed]  = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => { if (!isMobile) setMobileSidebarOpen(false); }, [isMobile]);

  const fetchData = useCallback(async () => {
    try {
      const [fRes, sRes, dRes] = await Promise.all([
        fetch('/api/files'),
        fetch('/api/stats'),
        fetch('/api/distribution?mode=files'),
      ]);
      if (fRes.ok) { const d = await fRes.json(); setUploadedFiles(d.data || []); }
      if (sRes.ok) { const d = await sRes.json(); setDbStats(d.data); }
      if (dRes.ok) { const d = await dRes.json(); setDistFiles(d.data?.files ?? []); }
    } catch { addToast('error', 'Gagal memuat data', 'Periksa koneksi.'); }
    finally { setIsLoading(false); }
  }, [addToast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const sidebarW = isMobile ? 0 : (sidebarCollapsed ? SIDEBAR_W_COLLAPSED : SIDEBAR_W);

  if (isLoading) return (
    <div style={{ minHeight: '100vh', background: '#07090e', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 0, fontFamily: 'IBM Plex Mono, monospace' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&display=swap');
        @keyframes sgPulse { 0%,100%{opacity:0.7;transform:scale(1)} 50%{opacity:1;transform:scale(1.06)} }
        @keyframes sgRing  { to{transform:rotate(360deg)} }
        @keyframes sgFadeUp{ from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes sgBar   { 0%{width:0%} 40%{width:60%} 70%{width:82%} 100%{width:96%} }
      `}</style>
      <div style={{ animation: 'sgFadeUp 0.5s ease both', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
        <div style={{ position: 'relative', width: 64, height: 64 }}>
          <svg style={{ position: 'absolute', inset: 0, animation: 'sgRing 1.4s linear infinite' }} width="64" height="64" viewBox="0 0 64 64" fill="none">
            <circle cx="32" cy="32" r="28" stroke="rgba(28,151,6,0.15)" strokeWidth="2.5"/>
            <path d="M32 4 a28 28 0 0 1 24.2 14" stroke="#1c9706" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
          <div style={{ position: 'absolute', inset: 10, borderRadius: 12, background: 'rgba(28,151,6,0.12)', border: '1px solid rgba(28,151,6,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'sgPulse 2s ease-in-out infinite' }}>
            <img src="/logo-cgkn.png" alt="CGKN" style={{ width: 28, height: 28, objectFit: 'contain' }}/>
          </div>
        </div>
        <div style={{ textAlign: 'center', animation: 'sgFadeUp 0.5s 0.1s ease both', opacity: 0 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'rgba(255,255,255,0.9)', letterSpacing: '-0.03em', lineHeight: 1 }}>CGKN</div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.22)', letterSpacing: '0.22em', textTransform: 'uppercase', marginTop: 4 }}>Admin Panel</div>
        </div>
        <div style={{ animation: 'sgFadeUp 0.5s 0.2s ease both', opacity: 0, width: 160 }}>
          <div style={{ height: 2, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
            <div style={{ height: '100%', background: 'linear-gradient(90deg, #1c9706, #4ade80)', borderRadius: 2, animation: 'sgBar 2.5s cubic-bezier(0.4,0,0.2,1) forwards' }}/>
          </div>
        </div>
        <div style={{ animation: 'sgFadeUp 0.5s 0.3s ease both', opacity: 0, fontSize: 10, color: 'rgba(255,255,255,0.22)', letterSpacing: '0.06em' }}>
          Memuat data…
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ height: '100vh', background: t.pagebg, fontFamily: FONT_SANS, display: 'flex', overflow: 'hidden' }}>
      <Sidebar
        activeTab={activeTab} setActiveTab={setActiveTab}
        collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed}
        can={can as (p: string) => boolean}
        uploadedFiles={uploadedFiles}
        isMobile={isMobile} mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginLeft: sidebarW, transition: 'margin-left 0.22s cubic-bezier(0.4,0,0.2,1)', minWidth: 0, height: '100vh', overflow: 'hidden' }}>
        <Topbar activeTab={activeTab} onMobileMenuToggle={() => setMobileSidebarOpen(p => !p)} />

        <main style={{
            flex: 1, minHeight: 0,
            overflow: activeTab === 'users' ? 'hidden' : 'auto',
            display: activeTab === 'users' ? 'flex' : 'block',
            flexDirection: 'column',
            padding: activeTab === 'users'
              ? (isMobile ? '12px' : '16px 20px')
              : (isMobile ? '14px 12px' : '20px 24px'),
          }}>
          {activeTab === 'upload-penjualan'  && can('view_files')   && <UploadPenjualanTab  dbStats={dbStats} uploadedFiles={uploadedFiles} onRefresh={fetchData} theme={theme} addToast={addToast} />}
          {activeTab === 'upload-distribusi' && can('upload_file')  && <UploadDistribusiTab theme={theme} addToast={addToast} distFiles={distFiles} onRefresh={fetchData} dbStats={dbStats} />}
          {activeTab === 'areas'             && can('view_areas')   && <AreaManagement theme={theme} />}
          {activeTab === 'users'             && can('manage_users') && <UserManagement theme={theme} />}
          {activeTab === 'settings'          && can('view_files')   && <SettingsTab theme={theme} addToast={addToast} />}
        </main>

        <footer style={{ padding: `8px ${isMobile ? 12 : 20}px`, borderTop: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <span style={{ fontSize: 11, color: t.textFaint, fontFamily: FONT_MONO }}>Admin · Sales Dashboard</span>
          <span style={{ fontSize: 11, color: t.textFaint, fontFamily: FONT_MONO }}>v1.0</span>
        </footer>
      </div>
    </div>
  );
}

// ─── Root export ──────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ToastProvider>
          <AdminGuard>
            <style>{`
              @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');
              *, *::before, *::after { box-sizing: border-box; }
              html, body { margin: 0; padding: 0; }
              @keyframes spin    { to { transform: rotate(360deg); } }
              @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
              @keyframes slideUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
              @keyframes toastIn { from { opacity: 0; transform: translateX(24px); } to { opacity: 1; transform: translateX(0); } }
              @keyframes sgRing  { to { transform: rotate(360deg); } }
              @keyframes sgPulse { 0%,100%{opacity:0.7;transform:scale(1)} 50%{opacity:1;transform:scale(1.06)} }
              ::-webkit-scrollbar       { width: 4px; height: 4px; }
              ::-webkit-scrollbar-track { background: transparent; }
              ::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.25); border-radius: 3px; }
            `}</style>
            <DashboardContent />
          </AdminGuard>
        </ToastProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}