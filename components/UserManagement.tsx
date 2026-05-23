'use client';
// components/UserManagement.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Users, Plus, Trash2, Edit2, X, CheckCircle,
  AlertCircle, Shield, ShieldCheck, ShieldAlert,
  ToggleLeft, ToggleRight, KeyRound, Eye, EyeOff,
  Copy, RefreshCw, Mail, Lock, UserCog, History,
  Monitor, Smartphone,
} from 'lucide-react';
import { UserRole, ROLE_LABELS, SessionUser } from '@/lib/auth/types';
import { useAuth } from '@/lib/auth/AuthContext';
import { AreaConfig, defaultAreas } from '@/lib/areaConfig';

// ─── Constants ─────────────────────────────────────────────────────────────────
const F_SANS  = '"IBM Plex Sans", sans-serif';
const F_MONO  = '"IBM Plex Mono", monospace';
const TOAST_MS = 3500;
const ROLE_ORDER: Record<UserRole, number> = { root: 0, admin: 1, user: 2 };

// ─── Types ──────────────────────────────────────────────────────────────────────
interface AppUser {
  id:              string;
  username:        string;
  email:           string;
  role:            UserRole;
  is_active:       boolean;
  created_at:      string;
  last_login:      string | null;
  created_by_name: string | null;
  allowed_areas?:  string[];
}
interface LoginEvent {
  id:         string;
  created_at: string;
  ip_address: string | null;
  user_agent: string | null;
  success:    boolean;
}
interface ToastItem { id: number; type: 'success' | 'error' | 'warning'; msg: string; }
type Theme = 'dark' | 'light';

// ─── Design Tokens ──────────────────────────────────────────────────────────────
interface Tok {
  page: string; card: string; cardAlt: string; modal: string;
  input: string; inputBd: string;
  line: string; lineStrong: string;
  tx1: string; tx2: string; tx3: string; tx4: string;
  thead: string; theadTx: string;
  rowAlt: string; rowHov: string;
  green: string; greenBg: string; greenBd: string;
  red: string; redBg: string; redBd: string;
  blue: string; blueBg: string; blueBd: string;
  amber: string; amberBg: string; amberBd: string;
  purple: string; purpleBg: string; purpleBd: string;
  shadow: string;
}

function tk(theme: Theme): Tok {
  const d = theme === 'dark';
  return {
    page:      d ? '#05060d'               : '#eef0f6',
    card:      d ? '#0c0d16'               : '#ffffff',
    cardAlt:   d ? '#10111e'               : '#f8f9fc',
    modal:     d ? '#0e0f1c'               : '#ffffff',
    input:     d ? 'rgba(255,255,255,0.04)': 'rgba(0,0,0,0.03)',
    inputBd:   d ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.13)',
    line:      d ? 'rgba(255,255,255,0.07)': 'rgba(0,0,0,0.08)',
    lineStrong:d ? 'rgba(255,255,255,0.12)': 'rgba(0,0,0,0.14)',
    tx1:       d ? 'rgba(255,255,255,0.93)': '#0f172a',
    tx2:       d ? 'rgba(255,255,255,0.62)': '#334155',
    tx3:       d ? 'rgba(255,255,255,0.36)': '#64748b',
    tx4:       d ? 'rgba(255,255,255,0.18)': '#94a3b8',
    thead:     d ? '#0a0b14'               : '#1e2035',
    theadTx:   d ? 'rgba(255,255,255,0.55)': 'rgba(255,255,255,0.82)',
    rowAlt:    d ? '#0e0f1c'               : '#f8f9fc',
    rowHov:    d ? '#131527'               : '#f0f1f8',
    green:     d ? '#34d399'  : '#15803d',
    greenBg:   d ? 'rgba(16,185,129,0.08)' : '#f0fdf4',
    greenBd:   d ? 'rgba(16,185,129,0.22)' : '#86efac',
    red:       d ? '#f87171'  : '#b91c1c',
    redBg:     d ? 'rgba(239,68,68,0.08)'  : '#fef2f2',
    redBd:     d ? 'rgba(239,68,68,0.22)'  : '#fecaca',
    blue:      d ? '#60a5fa'  : '#1d4ed8',
    blueBg:    d ? 'rgba(59,130,246,0.09)' : '#eff6ff',
    blueBd:    d ? 'rgba(59,130,246,0.25)' : '#bfdbfe',
    amber:     d ? '#fbbf24'  : '#92400e',
    amberBg:   d ? 'rgba(234,179,8,0.08)'  : '#fffbeb',
    amberBd:   d ? 'rgba(234,179,8,0.22)'  : '#fcd34d',
    purple:    d ? '#c084fc'  : '#6d28d9',
    purpleBg:  d ? 'rgba(168,85,247,0.09)' : '#f5f3ff',
    purpleBd:  d ? 'rgba(168,85,247,0.25)' : '#ddd6fe',
    shadow:    d ? 'none' : '0 1px 6px rgba(0,0,0,0.07)',
  };
}

// ─── Role Config ────────────────────────────────────────────────────────────────
const ROLE_CFG = {
  root:  { icon: ShieldAlert, label: 'Root',  desc: 'Akses penuh semua fitur & area' },
  admin: { icon: ShieldCheck, label: 'Admin', desc: 'Upload file & kelola data area' },
  user:  { icon: Shield,      label: 'User',  desc: 'Lihat data area yang ditugaskan' },
} as const;

function roleCss(role: UserRole, t: Tok) {
  if (role === 'root')  return { bg: t.purpleBg, tx: t.purple, bd: t.purpleBd };
  if (role === 'admin') return { bg: t.blueBg,   tx: t.blue,   bd: t.blueBd   };
  return                       { bg: t.greenBg,  tx: t.green,  bd: t.greenBd  };
}

// ─── CSS ────────────────────────────────────────────────────────────────────────
const CSS = `
  @keyframes slideUp   { from { opacity:0; transform:translateY(10px) }  to { opacity:1; transform:translateY(0) } }
  @keyframes fadeIn    { from { opacity:0 }                               to { opacity:1 } }
  @keyframes spin      { to   { transform:rotate(360deg) } }
  @keyframes toastIn   { from { opacity:0; transform:translateX(20px) }   to { opacity:1; transform:translateX(0) } }
  @keyframes progress  { from { width:100% } to { width:0% } }
  .um-row:hover td { background: var(--rh) !important; }
  .um-btn { transition: filter 0.12s, opacity 0.12s; }
  .um-btn:hover:not(:disabled) { filter: brightness(1.1); }
  .um-btn:active:not(:disabled) { filter: brightness(0.95); }
  .um-input:focus { outline: none; box-shadow: 0 0 0 2px rgba(99,102,241,0.25); }
  .um-ichk { cursor:pointer; }
`;

// ─── Atoms ──────────────────────────────────────────────────────────────────────
function Spin({ sz = 14 }: { sz?: number }) {
  return (
    <svg style={{ animation: 'spin .65s linear infinite', width: sz, height: sz, flexShrink: 0 }} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" opacity=".2"/>
      <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  );
}

function RoleIcon({ role, size = 13 }: { role: UserRole; size?: number }) {
  const Icon = ROLE_CFG[role].icon;
  return <Icon size={size}/>;
}

function RolePill({ role, t }: { role: UserRole; t: Tok }) {
  const c = roleCss(role, t);
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 20, fontSize: 10.5, fontWeight: 700, fontFamily: F_MONO, background: c.bg, color: c.tx, border: `1px solid ${c.bd}`, whiteSpace: 'nowrap' }}>
      <RoleIcon role={role} size={9}/>
      {ROLE_LABELS[role]}
    </span>
  );
}

function StatusPill({ active, t }: { active: boolean; t: Tok }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 20, fontSize: 10.5, fontWeight: 700, fontFamily: F_MONO, background: active ? t.greenBg : t.redBg, color: active ? t.green : t.red, border: `1px solid ${active ? t.greenBd : t.redBd}`, whiteSpace: 'nowrap' }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: active ? t.green : t.red, display: 'inline-block', flexShrink: 0 }}/>
      {active ? 'Aktif' : 'Nonaktif'}
    </span>
  );
}

function IBtn({ icon: Icon, color, bg, bd, onClick, title, disabled }: {
  icon: React.ElementType; color: string; bg: string; bd: string;
  onClick: () => void; title: string; disabled?: boolean;
}) {
  return (
    <button onClick={onClick} title={title} disabled={disabled} className="um-btn"
      style={{ width: 28, height: 28, borderRadius: 5, background: bg, border: `1px solid ${bd}`, cursor: disabled ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: disabled ? .4 : 1, flexShrink: 0 }}>
      <Icon size={12} color={color}/>
    </button>
  );
}

// ─── Toast ──────────────────────────────────────────────────────────────────────
function Toasts({ items, theme, onRemove }: { items: ToastItem[]; theme: Theme; onRemove: (id: number) => void }) {
  const d = theme === 'dark';
  const accents: Record<ToastItem['type'], string> = {
    success: d ? '#34d399' : '#22c55e',
    warning: d ? '#fbbf24' : '#f97316',
    error:   d ? '#f87171' : '#ef4444',
  };
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column-reverse', gap: 7, pointerEvents: 'none' }}>
      {items.map(item => (
        <div key={item.id} style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 9,
          minWidth: 260, maxWidth: 340, pointerEvents: 'auto', overflow: 'hidden', position: 'relative',
          background: d ? '#15171f' : '#fff',
          border: `1px solid ${d ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)'}`,
          boxShadow: d ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.08)',
          animation: 'toastIn 0.2s ease',
        }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: accents[item.type], borderRadius: '9px 0 0 9px' }}/>
          <div style={{ width: 26, height: 26, borderRadius: 6, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: item.type === 'success' ? (d ? 'rgba(52,211,153,0.12)' : '#dcfce7') : item.type === 'warning' ? (d ? 'rgba(251,191,36,0.12)' : '#fed7aa') : (d ? 'rgba(248,113,113,0.12)' : '#fee2e2') }}>
            {item.type === 'success' ? <CheckCircle size={13} color={accents[item.type]}/> : <AlertCircle size={13} color={accents[item.type]}/>}
          </div>
          <div style={{ flex: 1, fontSize: 12.5, fontWeight: 500, color: d ? 'rgba(255,255,255,0.85)' : '#1e293b', fontFamily: F_SANS, lineHeight: 1.45 }}>{item.msg}</div>
          <button onClick={() => onRemove(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: d ? 'rgba(255,255,255,0.3)' : '#94a3b8', display: 'flex', padding: 0 }}><X size={11}/></button>
          <div style={{ position: 'absolute', bottom: 0, left: 0, height: 2, background: accents[item.type], opacity: .3, animation: 'progress 3.5s linear forwards' }}/>
        </div>
      ))}
    </div>
  );
}

// ─── Field Wrapper ──────────────────────────────────────────────────────────────
function Field({ label, error, children, hint }: { label: string; error?: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, fontFamily: F_MONO, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5, color: 'inherit' }}>{label}</label>
      {children}
      {error && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 3, display: 'flex', alignItems: 'center', gap: 4 }}><AlertCircle size={10}/> {error}</div>}
      {hint && !error && <div style={{ fontSize: 10.5, opacity: .6, marginTop: 3 }}>{hint}</div>}
    </div>
  );
}

// ─── Password Input ─────────────────────────────────────────────────────────────
function PwdInput({ value, onChange, placeholder, t, hasError }: {
  value: string; onChange: (v: string) => void; placeholder: string; t: Tok; hasError?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <input type={show ? 'text' : 'password'} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="um-input"
        style={{ width: '100%', padding: '8px 36px 8px 11px', borderRadius: 6, fontSize: 13, background: t.input, border: `1px solid ${hasError ? '#ef4444' : t.inputBd}`, color: t.tx1, fontFamily: F_SANS, boxSizing: 'border-box' }}/>
      <button type="button" onClick={() => setShow(s => !s)} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: t.tx3, display: 'flex', padding: 0 }}>
        {show ? <EyeOff size={13}/> : <Eye size={13}/>}
      </button>
    </div>
  );
}

// ─── Reset Password Modal ────────────────────────────────────────────────────────
function ResetPasswordModal({ user, theme, onClose, onReset }: {
  user: AppUser; theme: Theme; onClose: () => void;
  onReset: (userId: string, newPassword: string) => Promise<void>;
}) {
  const t   = tk(theme);
  const d   = theme === 'dark';
  const [step,    setStep]    = useState<'choose' | 'manual' | 'done'>('choose');
  const [manualPw,setManualPw]= useState('');
  const [confirm, setConfirm] = useState('');
  const [genPw,   setGenPw]   = useState('');
  const [saving,  setSaving]  = useState(false);
  const [copied,  setCopied]  = useState(false);
  const [error,   setError]   = useState('');

  function generatePassword() {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
    let pw = '';
    for (let i = 0; i < 12; i++) pw += chars[Math.floor(Math.random() * chars.length)];
    return pw;
  }

  async function handleGenerate() {
    const pw = generatePassword();
    setGenPw(pw);
    setSaving(true);
    try { await onReset(user.id, pw); setStep('done'); }
    catch { setError('Gagal mereset password.'); }
    finally { setSaving(false); }
  }

  async function handleManual() {
    setError('');
    if (manualPw.length < 8) { setError('Minimal 8 karakter'); return; }
    if (manualPw !== confirm) { setError('Password tidak cocok'); return; }
    setSaving(true);
    try { await onReset(user.id, manualPw); setGenPw(manualPw); setStep('done'); }
    catch { setError('Gagal mereset password.'); }
    finally { setSaving(false); }
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(genPw).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }} style={{ position: 'fixed', inset: 0, zIndex: 1001, background: d ? 'rgba(0,0,0,0.75)' : 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, backdropFilter: 'blur(3px)', animation: 'fadeIn 0.15s ease' }}>
      <div style={{ background: t.modal, border: `1px solid ${t.lineStrong}`, borderRadius: 12, width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.35)', overflow: 'hidden', animation: 'slideUp 0.18s ease' }}>
        <div style={{ height: 3, background: 'linear-gradient(90deg,#8b5cf6,#6366f1)' }}/>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px 14px', borderBottom: `1px solid ${t.line}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: t.purpleBg, border: `1px solid ${t.purpleBd}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <KeyRound size={15} color={t.purple}/>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: t.tx1, lineHeight: 1 }}>Reset Password</div>
              <div style={{ fontSize: 11, color: t.tx3, marginTop: 2, fontFamily: F_MONO }}>@{user.username}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.tx3, display: 'flex' }}><X size={16}/></button>
        </div>
        <div style={{ padding: '18px' }}>
          {step === 'choose' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 12, color: t.tx2, lineHeight: 1.6, marginBottom: 4 }}>
                Pilih metode reset password untuk <strong style={{ color: t.tx1 }}>@{user.username}</strong>:
              </div>
              <button onClick={handleGenerate} disabled={saving} className="um-btn" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 8, border: `1px solid ${t.purpleBd}`, background: t.purpleBg, cursor: saving ? 'wait' : 'pointer', textAlign: 'left', width: '100%' }}>
                <div style={{ width: 34, height: 34, borderRadius: 7, background: d ? 'rgba(168,85,247,0.15)' : '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {saving ? <Spin sz={14}/> : <RefreshCw size={14} color={t.purple}/>}
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: t.purple, fontFamily: F_MONO }}>Generate Otomatis</div>
                  <div style={{ fontSize: 11, color: t.tx3, marginTop: 1 }}>Buat password acak 12 karakter yang aman</div>
                </div>
              </button>
              <button onClick={() => setStep('manual')} className="um-btn" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 8, border: `1px solid ${t.blueBd}`, background: t.blueBg, cursor: 'pointer', textAlign: 'left', width: '100%' }}>
                <div style={{ width: 34, height: 34, borderRadius: 7, background: d ? 'rgba(59,130,246,0.15)' : '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Lock size={14} color={t.blue}/>
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: t.blue, fontFamily: F_MONO }}>Set Manual</div>
                  <div style={{ fontSize: 11, color: t.tx3, marginTop: 1 }}>Tentukan password baru secara manual</div>
                </div>
              </button>
            </div>
          )}
          {step === 'manual' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, color: t.tx3 }}>
              <Field label="Password Baru" error={error}>
                <PwdInput value={manualPw} onChange={setManualPw} placeholder="Minimal 8 karakter" t={t} hasError={!!error}/>
              </Field>
              <Field label="Konfirmasi Password">
                <PwdInput value={confirm} onChange={setConfirm} placeholder="Ulangi password baru" t={t} hasError={!!error && manualPw !== confirm}/>
              </Field>
              <div style={{ display: 'flex', gap: 7, marginTop: 4 }}>
                <button onClick={() => { setStep('choose'); setError(''); }} className="um-btn" style={{ flex: 1, padding: '8px', borderRadius: 7, fontSize: 12, fontWeight: 600, background: t.input, border: `1px solid ${t.inputBd}`, color: t.tx2, cursor: 'pointer', fontFamily: F_SANS }}>Kembali</button>
                <button onClick={handleManual} disabled={saving} className="um-btn" style={{ flex: 2, padding: '8px', borderRadius: 7, fontSize: 12, fontWeight: 600, background: '#6366f1', color: '#fff', border: 'none', cursor: saving ? 'wait' : 'pointer', fontFamily: F_SANS, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  {saving ? <><Spin sz={12}/> Menyimpan…</> : <><KeyRound size={12}/> Set Password</>}
                </button>
              </div>
            </div>
          )}
          {step === 'done' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 8, background: t.greenBg, border: `1px solid ${t.greenBd}` }}>
                <CheckCircle size={14} color={t.green} style={{ flexShrink: 0 }}/>
                <span style={{ fontSize: 12, fontWeight: 600, color: t.green }}>Password berhasil direset!</span>
              </div>
              <div>
                <div style={{ fontSize: 10.5, fontWeight: 700, fontFamily: F_MONO, textTransform: 'uppercase', letterSpacing: '0.07em', color: t.tx3, marginBottom: 6 }}>Password Baru</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ flex: 1, padding: '9px 12px', borderRadius: 6, background: t.cardAlt, border: `1px solid ${t.lineStrong}`, fontFamily: F_MONO, fontSize: 14, fontWeight: 700, letterSpacing: '0.05em', color: t.tx1, wordBreak: 'break-all' }}>{genPw}</div>
                  <button onClick={copyToClipboard} className="um-btn" style={{ padding: '9px 10px', borderRadius: 6, background: copied ? t.greenBg : t.blueBg, border: `1px solid ${copied ? t.greenBd : t.blueBd}`, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: copied ? t.green : t.blue, whiteSpace: 'nowrap', fontFamily: F_MONO }}>
                    {copied ? <><CheckCircle size={11}/> Disalin!</> : <><Copy size={11}/> Salin</>}
                  </button>
                </div>
              </div>
              <div style={{ padding: '10px 12px', borderRadius: 7, background: t.amberBg, border: `1px solid ${t.amberBd}`, fontSize: 11, color: t.amber, lineHeight: 1.6 }}>
                <strong>⚠️ Penting:</strong> Catat atau salin password ini sekarang. Password tidak akan ditampilkan lagi setelah modal ditutup.
              </div>
              <button onClick={onClose} className="um-btn" style={{ padding: '9px', borderRadius: 7, fontSize: 13, fontWeight: 600, background: '#6366f1', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: F_SANS }}>
                Selesai &amp; Tutup
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Login History Modal ─────────────────────────────────────────────────────────
function LoginHistoryModal({ user, theme, onClose }: {
  user: AppUser; theme: Theme; onClose: () => void;
}) {
  const t = tk(theme);
  const d = theme === 'dark';
  const [logs,    setLogs]    = useState<LoginEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`/api/users/login-history?userId=${user.id}`);
        const j = await r.json();
        if (r.ok && j.success) setLogs(j.data);
        else setError(j.error || 'Gagal memuat riwayat login');
      } catch {
        setError('Terjadi kesalahan jaringan');
      } finally {
        setLoading(false);
      }
    })();
  }, [user.id]);

  function parseDevice(ua: string | null): { label: string; mobile: boolean } {
    if (!ua) return { label: '—', mobile: false };
    const mobile = /mobile|android|iphone|ipad/i.test(ua);
    const browser =
      ua.includes('Edg')     ? 'Edge'    :
      ua.includes('Chrome')  ? 'Chrome'  :
      ua.includes('Firefox') ? 'Firefox' :
      ua.includes('Safari')  ? 'Safari'  : 'Browser';
    const os =
      ua.includes('Windows') ? 'Windows' :
      ua.includes('Mac')     ? 'macOS'   :
      ua.includes('Linux')   ? 'Linux'   :
      ua.includes('Android') ? 'Android' :
      ua.includes('iPhone')  ? 'iOS'     :
      ua.includes('iPad')    ? 'iPadOS'  : '';
    return { label: os ? `${browser} · ${os}` : browser, mobile };
  }

  const successCount = logs.filter(l => l.success).length;
  const failCount    = logs.filter(l => !l.success).length;

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, zIndex: 1001, background: d ? 'rgba(0,0,0,0.75)' : 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, backdropFilter: 'blur(3px)', animation: 'fadeIn 0.15s ease' }}
    >
      <div style={{ background: t.modal, border: `1px solid ${t.lineStrong}`, borderRadius: 12, width: '100%', maxWidth: 620, maxHeight: '82vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.35)', overflow: 'hidden', animation: 'slideUp 0.18s ease' }}>

        {/* accent bar */}
        <div style={{ height: 3, background: 'linear-gradient(90deg,#0ea5e9,#6366f1)', flexShrink: 0 }}/>

        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px 14px', borderBottom: `1px solid ${t.line}`, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: t.blueBg, border: `1px solid ${t.blueBd}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <History size={15} color={t.blue}/>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: t.tx1 }}>Riwayat Login</div>
              <div style={{ fontSize: 11, color: t.tx3, marginTop: 2, fontFamily: F_MONO }}>@{user.username}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.tx3, display: 'flex' }}>
            <X size={16}/>
          </button>
        </div>

        {/* stats bar — hanya tampil jika data tersedia */}
        {!loading && !error && logs.length > 0 && (
          <div style={{ display: 'flex', gap: 10, padding: '10px 18px', borderBottom: `1px solid ${t.line}`, flexShrink: 0, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 6, background: t.cardAlt, border: `1px solid ${t.line}`, fontSize: 11, fontFamily: F_MONO, color: t.tx2 }}>
              <History size={10} color={t.tx3}/>
              <span><strong style={{ color: t.tx1 }}>{logs.length}</strong> entri total</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 6, background: t.greenBg, border: `1px solid ${t.greenBd}`, fontSize: 11, fontFamily: F_MONO, color: t.green }}>
              <CheckCircle size={10}/>
              <span><strong>{successCount}</strong> berhasil</span>
            </div>
            {failCount > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 6, background: t.redBg, border: `1px solid ${t.redBd}`, fontSize: 11, fontFamily: F_MONO, color: t.red }}>
                <AlertCircle size={10}/>
                <span><strong>{failCount}</strong> gagal</span>
              </div>
            )}
          </div>
        )}

        {/* body */}
        <div style={{ overflowY: 'auto', flex: 1, minHeight: 0 }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 48, color: t.tx3, fontSize: 12 }}>
              <Spin sz={14}/> Memuat riwayat…
            </div>
          ) : error ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 16, padding: '10px 14px', borderRadius: 8, background: t.redBg, border: `1px solid ${t.redBd}`, fontSize: 12, color: t.red }}>
              <AlertCircle size={13} style={{ flexShrink: 0 }}/> {error}
            </div>
          ) : logs.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: 48, color: t.tx3, fontSize: 12 }}>
              <History size={24} color={t.tx4}/>
              <span>Belum ada riwayat login untuk user ini</span>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5, fontFamily: F_SANS }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
                <tr style={{ background: t.thead }}>
                  {['#', 'Waktu', 'IP Address', 'Browser / Perangkat', 'Status'].map((h, i) => (
                    <th key={h} style={{
                      padding: '8px 14px',
                      textAlign: i === 0 ? 'center' : i === 4 ? 'center' : 'left',
                      fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase',
                      letterSpacing: '0.07em', color: t.theadTx,
                      borderBottom: `1px solid rgba(255,255,255,0.06)`,
                      fontFamily: F_MONO, whiteSpace: 'nowrap',
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log, idx) => {
                  const dev    = parseDevice(log.user_agent);
                  const rowBg  = idx % 2 === 1 ? t.rowAlt : 'transparent';
                  return (
                    <tr key={log.id} className="um-row" style={{ borderBottom: `1px solid ${t.line}`, transition: 'background 0.08s' }}>
                      {/* nomor urut */}
                      <td style={{ padding: '9px 14px', background: rowBg, textAlign: 'center' }}>
                        <span style={{ fontSize: 10, color: t.tx4, fontFamily: F_MONO }}>{idx + 1}</span>
                      </td>
                      {/* waktu */}
                      <td style={{ padding: '9px 14px', background: rowBg, whiteSpace: 'nowrap' }}>
                        <div style={{ fontSize: 11.5, color: t.tx1, fontFamily: F_MONO }}>
                          {new Date(log.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                        <div style={{ fontSize: 10, color: t.tx4, fontFamily: F_MONO, marginTop: 1 }}>
                          {new Date(log.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </div>
                      </td>
                      {/* IP */}
                      <td style={{ padding: '9px 14px', background: rowBg, fontFamily: F_MONO, fontSize: 11.5, color: t.tx2, whiteSpace: 'nowrap' }}>
                        {log.ip_address
                          ? log.ip_address
                          : <span style={{ color: t.tx4 }}>—</span>
                        }
                      </td>
                      {/* device */}
                      <td style={{ padding: '9px 14px', background: rowBg }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: t.tx2 }}>
                          {dev.mobile
                            ? <Smartphone size={11} color={t.tx4} style={{ flexShrink: 0 }}/>
                            : <Monitor    size={11} color={t.tx4} style={{ flexShrink: 0 }}/>
                          }
                          <span style={{ fontFamily: F_SANS }}>{dev.label}</span>
                        </div>
                      </td>
                      {/* status */}
                      <td style={{ padding: '9px 14px', background: rowBg, textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          padding: '2px 8px', borderRadius: 20, fontSize: 10.5, fontWeight: 700,
                          fontFamily: F_MONO,
                          background: log.success ? t.greenBg : t.redBg,
                          color:      log.success ? t.green   : t.red,
                          border: `1px solid ${log.success ? t.greenBd : t.redBd}`,
                          whiteSpace: 'nowrap',
                        }}>
                          <span style={{ width: 5, height: 5, borderRadius: '50%', background: log.success ? t.green : t.red, display: 'inline-block', flexShrink: 0 }}/>
                          {log.success ? 'Berhasil' : 'Gagal'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* footer */}
        <div style={{ padding: '10px 18px', borderTop: `1px solid ${t.line}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, flexWrap: 'wrap', gap: 8 }}>
          <span style={{ fontSize: 10.5, color: t.tx4, fontFamily: F_MONO, display: 'flex', alignItems: 'center', gap: 5 }}>
            <AlertCircle size={10}/>
            Menampilkan hingga 100 entri terbaru
          </span>
          <button onClick={onClose} className="um-btn" style={{ padding: '6px 16px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: t.input, color: t.tx2, border: `1px solid ${t.inputBd}`, cursor: 'pointer', fontFamily: F_SANS }}>
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── User Form Modal ─────────────────────────────────────────────────────────────
interface UserFormProps {
  editing:  AppUser | null;
  theme:    Theme;
  me:       SessionUser | null;
  areas:    AreaConfig[];
  onSave:   (data: Partial<AppUser> & { password?: string; allowed_areas?: string[] }) => Promise<void>;
  onCancel: () => void;
}
interface FormState {
  username:      string;
  email:         string;
  role:          UserRole;
  password:      string;
  password2:     string;
  allowed_areas: string[];
}

function validateForm(form: FormState, isEditing: boolean): Record<string, string> {
  const e: Record<string, string> = {};
  if (!isEditing && !form.username.trim()) e.username = 'Wajib diisi';
  if (!form.email.trim())                  e.email    = 'Wajib diisi';
  if (!isEditing && !form.password)        e.password = 'Wajib diisi';
  if (form.password && form.password.length < 8) e.password = 'Minimal 8 karakter';
  if (form.password && form.password !== form.password2) e.password2 = 'Password tidak cocok';
  if (form.role !== 'root' && form.allowed_areas.length === 0)
    e.allowed_areas = 'Pilih minimal satu area';
  return e;
}

function UserFormModal({ editing, theme, me, areas, onSave, onCancel }: UserFormProps) {
  const t      = tk(theme);
  const d      = theme === 'dark';
  const isEdit = !!editing;

  const [form, setForm] = useState<FormState>({
    username:      editing?.username      ?? '',
    email:         editing?.email         ?? '',
    role:          editing?.role          ?? 'user',
    password:      '',
    password2:     '',
    allowed_areas: editing?.allowed_areas ?? [],
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const setF = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateForm(form, isEdit);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      const payload: Partial<AppUser> & { password?: string; allowed_areas?: string[] } = {
        email: form.email.trim(), role: form.role,
        allowed_areas: form.role === 'root' ? [] : form.allowed_areas,
      };
      payload.username = form.username.trim().toLowerCase();
      if (form.password) payload.password = form.password;
      await onSave(payload);
    } finally { setSaving(false); }
  };

  const INP: React.CSSProperties = {
    width: '100%', padding: '8px 11px', borderRadius: 6, fontSize: 13,
    background: t.input, border: `1px solid ${t.inputBd}`,
    color: t.tx1, fontFamily: F_SANS, boxSizing: 'border-box',
  };
  const allSelected = form.allowed_areas.length === areas.length && areas.every(a => form.allowed_areas.includes(a.id));

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onCancel(); }} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: d ? 'rgba(0,0,0,0.75)' : 'rgba(0,0,0,0.38)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, backdropFilter: 'blur(3px)', animation: 'fadeIn 0.15s ease' }}>
      <style>{CSS}</style>
      <div style={{ background: t.modal, border: `1px solid ${t.lineStrong}`, borderRadius: 12, width: '100%', maxWidth: 480, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.35)', overflow: 'hidden', animation: 'slideUp 0.18s ease' }}>
        <div style={{ height: 3, background: isEdit ? 'linear-gradient(90deg,#3b82f6,#6366f1)' : 'linear-gradient(90deg,#22c55e,#16a34a)', flexShrink: 0 }}/>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px 14px', borderBottom: `1px solid ${t.line}`, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: isEdit ? t.blueBg : t.greenBg, border: `1px solid ${isEdit ? t.blueBd : t.greenBd}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <UserCog size={15} color={isEdit ? t.blue : t.green}/>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: t.tx1 }}>{isEdit ? 'Edit User' : 'Tambah User Baru'}</div>
              <div style={{ fontSize: 11, color: t.tx3, marginTop: 1, fontFamily: F_MONO }}>{isEdit ? `@${editing!.username}` : 'Buat akun baru'}</div>
            </div>
          </div>
          <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.tx3, display: 'flex' }}><X size={16}/></button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '18px', overflowY: 'auto', color: t.tx3 }}>
          <Field label="Username" error={errors.username}>
            <input className="um-input" type="text" value={form.username} onChange={e => setF('username', e.target.value)} placeholder="username_baru"
              style={{ ...INP, borderColor: errors.username ? '#ef4444' : t.inputBd }}/>
          </Field>
          <Field label="Email" error={errors.email}>
            <input className="um-input" type="email" value={form.email} onChange={e => setF('email', e.target.value)} placeholder="user@example.com"
              style={{ ...INP, borderColor: errors.email ? '#ef4444' : t.inputBd }}/>
          </Field>
          <Field label="Role" hint={ROLE_CFG[form.role].desc}>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['user', 'admin', ...(me?.role === 'root' ? ['root'] : [])] as UserRole[]).map(r => {
                const Icon = ROLE_CFG[r].icon;
                const c    = roleCss(r, t);
                const sel  = form.role === r;
                return (
                  <button key={r} type="button" onClick={() => setF('role', r)} style={{ flex: 1, padding: '7px 6px', borderRadius: 7, border: `2px solid ${sel ? c.bd : t.line}`, background: sel ? c.bg : t.input, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, transition: 'all 0.12s' }}>
                    <Icon size={13} color={sel ? c.tx : t.tx3}/>
                    <span style={{ fontSize: 10, fontWeight: 700, fontFamily: F_MONO, color: sel ? c.tx : t.tx3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{ROLE_LABELS[r]}</span>
                  </button>
                );
              })}
            </div>
          </Field>
          <Field label={isEdit ? 'Password Baru (kosong = tidak diubah)' : 'Password'} error={errors.password}>
            <PwdInput value={form.password} onChange={v => setF('password', v)} placeholder={isEdit ? 'Kosongkan jika tidak diubah' : 'Min. 8 karakter'} t={t} hasError={!!errors.password}/>
          </Field>
          {form.password && (
            <Field label="Konfirmasi Password" error={errors.password2}>
              <PwdInput value={form.password2} onChange={v => setF('password2', v)} placeholder="Ulangi password" t={t} hasError={!!errors.password2}/>
            </Field>
          )}
          <Field label="Area yang Dapat Diakses" error={errors.allowed_areas}>
            {form.role === 'root' ? (
              <div style={{ padding: '9px 11px', borderRadius: 6, background: t.purpleBg, border: `1px solid ${t.purpleBd}`, fontSize: 12, color: t.purple, display: 'flex', alignItems: 'center', gap: 7 }}>
                <ShieldAlert size={12}/> Root memiliki akses ke semua area
              </div>
            ) : (
              <div style={{ border: `1px solid ${errors.allowed_areas ? '#ef4444' : t.inputBd}`, borderRadius: 7, overflow: 'hidden' }}>
                <div onClick={() => setF('allowed_areas', allSelected ? [] : areas.map(a => a.id))} className="um-ichk"
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: t.cardAlt, borderBottom: `1px solid ${t.line}`, cursor: 'pointer' }}>
                  <div style={{ width: 13, height: 13, borderRadius: 3, border: `1.5px solid ${allSelected ? '#6366f1' : t.inputBd}`, background: allSelected ? '#6366f1' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {allSelected && <svg width="8" height="8" viewBox="0 0 8 8"><path d="M1.5 4L3.2 5.7L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>}
                  </div>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: t.tx2 }}>Semua Area ({areas.length})</span>
                </div>
                <div style={{ maxHeight: 130, overflowY: 'auto' }}>
                  {areas.map((area, i) => {
                    const sel = form.allowed_areas.includes(area.id);
                    return (
                      <div key={area.id} onClick={() => {
                        const n = sel ? form.allowed_areas.filter(id => id !== area.id) : [...form.allowed_areas, area.id];
                        setF('allowed_areas', n);
                      }} className="um-ichk"
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', background: sel ? (d ? 'rgba(99,102,241,0.08)' : '#eef2ff') : 'transparent', borderTop: i > 0 ? `1px solid ${t.line}` : 'none', cursor: 'pointer' }}>
                        <div style={{ width: 13, height: 13, borderRadius: 3, border: `1.5px solid ${sel ? '#6366f1' : t.inputBd}`, background: sel ? '#6366f1' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {sel && <svg width="8" height="8" viewBox="0 0 8 8"><path d="M1.5 4L3.2 5.7L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>}
                        </div>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: sel ? 600 : 400, color: t.tx1 }}>{area.name || area.id}</div>
                          {area.description && <div style={{ fontSize: 10, color: t.tx4 }}>{area.description}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </Field>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 7, marginTop: 4 }}>
            <button type="button" onClick={onCancel} className="um-btn" style={{ padding: '8px 16px', borderRadius: 7, fontSize: 12, fontWeight: 600, background: t.input, color: t.tx2, border: `1px solid ${t.inputBd}`, cursor: 'pointer', fontFamily: F_SANS }}>Batal</button>
            <button type="submit" disabled={saving} className="um-btn" style={{ padding: '8px 18px', borderRadius: 7, fontSize: 12, fontWeight: 600, background: saving ? 'rgba(99,102,241,0.5)' : '#6366f1', color: '#fff', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: F_SANS, display: 'flex', alignItems: 'center', gap: 6 }}>
              {saving ? <><Spin sz={11}/> Menyimpan…</> : isEdit ? 'Simpan Perubahan' : 'Buat User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Delete Modal ────────────────────────────────────────────────────────────────
function DeleteModal({ userId, username, theme, onConfirm, onCancel }: {
  userId: string; username: string; theme: Theme;
  onConfirm: (id: string) => void; onCancel: () => void;
}) {
  const t = tk(theme);
  const d = theme === 'dark';
  return (
    <div onClick={e => { if (e.target === e.currentTarget) onCancel(); }} style={{ position: 'fixed', inset: 0, zIndex: 1001, background: d ? 'rgba(0,0,0,0.75)' : 'rgba(0,0,0,0.38)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, backdropFilter: 'blur(3px)', animation: 'fadeIn 0.15s ease' }}>
      <div style={{ background: t.modal, border: `1px solid ${t.lineStrong}`, borderRadius: 12, width: '100%', maxWidth: 380, boxShadow: '0 20px 60px rgba(0,0,0,0.35)', overflow: 'hidden', animation: 'slideUp 0.18s ease' }}>
        <div style={{ height: 3, background: '#dc2626' }}/>
        <div style={{ padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: t.redBg, border: `1px solid ${t.redBd}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Trash2 size={15} color={t.red}/>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: t.tx1 }}>Hapus User</div>
              <div style={{ fontSize: 11, color: t.tx3, marginTop: 1 }}>Tindakan ini tidak dapat dibatalkan</div>
            </div>
          </div>
          <div style={{ padding: '10px 12px', borderRadius: 7, background: t.redBg, border: `1px solid ${t.redBd}`, fontSize: 12, color: t.tx2, marginBottom: 16 }}>
            User <code style={{ fontSize: 11, fontFamily: F_MONO, background: d ? 'rgba(239,68,68,0.12)' : '#fee2e2', color: t.red, padding: '1px 5px', borderRadius: 3 }}>{username}</code> akan dihapus permanen beserta semua data terkait.
          </div>
          <div style={{ display: 'flex', gap: 7, justifyContent: 'flex-end' }}>
            <button onClick={onCancel} className="um-btn" style={{ padding: '8px 16px', borderRadius: 7, fontSize: 12, fontWeight: 600, background: t.input, color: t.tx2, border: `1px solid ${t.inputBd}`, cursor: 'pointer', fontFamily: F_SANS }}>Batal</button>
            <button onClick={() => onConfirm(userId)} className="um-btn" style={{ padding: '8px 18px', borderRadius: 7, fontSize: 12, fontWeight: 600, background: '#dc2626', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: F_SANS, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Trash2 size={11}/> Hapus
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────────
export default function UserManagement({ theme }: { theme: Theme }) {
  const { user: me }                  = useAuth();
  const t                             = tk(theme);
  const d                             = theme === 'dark';
  const [users,       setUsers]       = useState<AppUser[]>([]);
  const [areas,       setAreas]       = useState<AreaConfig[]>(defaultAreas);
  const [loading,     setLoading]     = useState(true);
  const [showForm,    setShowForm]    = useState(false);
  const [editing,     setEditing]     = useState<AppUser | null>(null);
  const [deleteId,    setDeleteId]    = useState<string | null>(null);
  const [resetUser,   setResetUser]   = useState<AppUser | null>(null);
  const [historyUser, setHistoryUser] = useState<AppUser | null>(null);
  const [toasts,      setToasts]      = useState<ToastItem[]>([]);
  const counter                       = useRef(0);

  const rmToast  = useCallback((id: number) => setToasts(p => p.filter(x => x.id !== id)), []);
  const addToast = useCallback((type: ToastItem['type'], msg: string) => {
    const id = ++counter.current;
    setToasts(p => [...p, { id, type, msg }]);
    setTimeout(() => rmToast(id), TOAST_MS);
  }, [rmToast]);

  const fetchAreas = useCallback(async () => {
    try {
      const r = await fetch('/api/areas'); const j = await r.json();
      if (r.ok && j.success) setAreas(j.data.areas);
      else setAreas(defaultAreas);
    } catch { setAreas(defaultAreas); }
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/users'); const j = await r.json();
      if (r.ok) setUsers(j.data);
      else addToast('error', j.error || 'Gagal memuat users');
    } catch { addToast('error', 'Gagal memuat users'); }
    finally { setLoading(false); }
  }, [addToast]);

  useEffect(() => { fetchUsers(); fetchAreas(); }, [fetchUsers, fetchAreas]);

  const apiCall = useCallback(async (fn: () => Promise<Response>, okMsg: string, onOk?: () => void) => {
    try {
      const r = await fn(); const j = await r.json();
      if (r.ok) { await fetchUsers(); addToast('success', okMsg); onOk?.(); }
      else addToast('error', j.error || 'Gagal');
    } catch { addToast('error', 'Terjadi kesalahan'); }
  }, [fetchUsers, addToast]);

  const handleSave = async (payload: Partial<AppUser> & { password?: string; allowed_areas?: string[] }) => {
    const url    = editing ? `/api/users?id=${editing.id}` : '/api/users';
    const method = editing ? 'PATCH' : 'POST';
    await apiCall(
      () => fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }),
      editing ? 'User berhasil diupdate' : 'User baru berhasil dibuat',
      () => { setShowForm(false); setEditing(null); },
    );
  };

  const handleToggleActive = (user: AppUser) =>
    apiCall(
      () => fetch(`/api/users?id=${user.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_active: !user.is_active }) }),
      `User ${user.is_active ? 'dinonaktifkan' : 'diaktifkan'}`,
    );

  const handleDelete = (id: string) =>
    apiCall(() => fetch(`/api/users?id=${id}`, { method: 'DELETE' }), 'User berhasil dihapus', () => setDeleteId(null));

  const handleResetPassword = async (userId: string, newPassword: string) => {
    const r = await fetch(`/api/users?id=${userId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: newPassword }),
    });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error || 'Gagal');
    await fetchUsers();
  };

  const sorted = [...users].sort((a, b) => {
    const roleDiff = ROLE_ORDER[a.role] - ROLE_ORDER[b.role];
    if (roleDiff !== 0) return roleDiff;
    return a.username.localeCompare(b.username, 'id-ID');
  });

  const canEdit        = (u: AppUser) => me?.role === 'root' || (me?.role === 'admin' && u.role === 'user');
  const canDel         = (u: AppUser) => !!me && me.id !== u.id && canEdit(u);
  const canToggle      = (u: AppUser) => !!me && me.id !== u.id && me.role !== 'admin' && canEdit(u);
  const canReset       = (u: AppUser) => canEdit(u);
  const canViewHistory = (u: AppUser) => canEdit(u) || u.id === me?.id;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, height: '100%', overflow: 'hidden' }}>
      <style>{CSS}</style>
      <Toasts items={toasts} theme={theme} onRemove={rmToast}/>

      {(showForm || editing) && (
        <UserFormModal editing={editing} theme={theme} me={me} areas={areas}
          onSave={handleSave} onCancel={() => { setShowForm(false); setEditing(null); }}/>
      )}
      {deleteId && (
        <DeleteModal
          userId={deleteId}
          username={users.find(u => u.id === deleteId)?.username ?? ''}
          theme={theme}
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
      {resetUser && (
        <ResetPasswordModal
          user={resetUser} theme={theme}
          onClose={() => setResetUser(null)}
          onReset={handleResetPassword}
        />
      )}
      {historyUser && (
        <LoginHistoryModal
          user={historyUser} theme={theme}
          onClose={() => setHistoryUser(null)}
        />
      )}

      {/* ── TOOLBAR BAR ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 12, flexWrap: 'wrap', marginBottom: 0, paddingBottom: 12,
        borderBottom: `1px solid ${t.line}`, flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: t.tx3, fontFamily: F_MONO }}>
            {users.length} user terdaftar
          </span>
          {(['root', 'admin', 'user'] as UserRole[]).map(role => {
            const count = users.filter(u => u.role === role).length;
            if (!count) return null;
            const c = roleCss(role, t);
            return (
              <span key={role} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 7px', borderRadius: 12, fontSize: 10, fontWeight: 700, fontFamily: F_MONO, background: c.bg, color: c.tx, border: `1px solid ${c.bd}` }}>
                <RoleIcon role={role} size={9}/>{count}
              </span>
            );
          })}
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true); }} className="um-btn"
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: '#6366f1', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: F_SANS }}>
          <Plus size={13}/> Tambah User
        </button>
      </div>

      {/* ── TABLE ── */}
      <div style={{ overflowX: 'auto', overflowY: 'auto', flex: 1, minHeight: 0 }}>
        <style>{`.um-row:hover td { background: ${t.rowHov} !important; }`}</style>
        <table style={{ minWidth: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: F_SANS }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
            <tr style={{ background: t.thead }}>
              {['User', 'Email', 'Role', 'Area', 'Status', 'Login Terakhir', 'Dibuat Oleh', 'Aksi'].map((h, i) => (
                <th key={h} style={{ padding: '9px 14px', textAlign: i === 7 ? 'center' : 'left', fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: t.theadTx, borderBottom: `1px solid rgba(255,255,255,0.06)`, fontFamily: F_MONO, whiteSpace: 'nowrap' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ padding: 40, textAlign: 'center', color: t.tx3, fontSize: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <Spin sz={14}/> Memuat…
                </div>
              </td></tr>
            ) : sorted.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: 40, textAlign: 'center', color: t.tx3, fontSize: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <Users size={20} color={t.tx4}/>
                  <span>Belum ada user terdaftar</span>
                </div>
              </td></tr>
            ) : sorted.map((user, idx) => {
              const c      = roleCss(user.role, t);
              const isSelf = user.id === me?.id;
              const rowBg  = idx % 2 === 1 ? t.rowAlt : 'transparent';
              return (
                <tr key={user.id} className="um-row" style={{ borderBottom: `1px solid ${t.line}`, transition: 'background 0.08s' }}>
                  {/* User */}
                  <td style={{ padding: '10px 14px', background: rowBg }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <div style={{ width: 30, height: 30, borderRadius: 7, background: c.bg, border: `1px solid ${c.bd}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <RoleIcon role={user.role} size={13}/>
                      </div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: t.tx1, fontFamily: F_MONO, display: 'flex', alignItems: 'center', gap: 5 }}>
                          {user.username}
                          {isSelf && <span style={{ fontSize: 9, background: t.blueBg, color: t.blue, border: `1px solid ${t.blueBd}`, padding: '0 4px', borderRadius: 3, fontWeight: 700 }}>YA</span>}
                        </div>
                        <div style={{ fontSize: 10, color: t.tx4, marginTop: 1 }}>{user.created_at ? new Date(user.created_at).getFullYear() : ''}</div>
                      </div>
                    </div>
                  </td>
                  {/* Email */}
                  <td style={{ padding: '10px 14px', background: rowBg, color: t.tx2, fontFamily: F_MONO, fontSize: 11 }}>{user.email}</td>
                  {/* Role */}
                  <td style={{ padding: '10px 14px', background: rowBg }}><RolePill role={user.role} t={t}/></td>
                  {/* Area */}
                  <td style={{ padding: '10px 14px', background: rowBg }}>
                    {user.role === 'root' ? (
                      <span style={{ fontSize: 10.5, color: t.purple, fontFamily: F_MONO, fontWeight: 600, padding: '2px 6px', borderRadius: 4, background: t.purpleBg, border: `1px solid ${t.purpleBd}` }}>Semua</span>
                    ) : user.allowed_areas?.length ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                        {user.allowed_areas.slice(0, 3).map(id => {
                          const a = areas.find(x => x.id === id);
                          return a ? (
                            <span key={id} style={{ fontSize: 9.5, padding: '2px 5px', borderRadius: 3, background: t.blueBg, color: t.blue, border: `1px solid ${t.blueBd}`, fontFamily: F_MONO }}>{a.name || id}</span>
                          ) : null;
                        })}
                        {user.allowed_areas.length > 3 && (
                          <span style={{ fontSize: 9.5, padding: '2px 5px', borderRadius: 3, background: t.cardAlt, color: t.tx3, border: `1px solid ${t.line}`, fontFamily: F_MONO }}>+{user.allowed_areas.length - 3}</span>
                        )}
                      </div>
                    ) : (
                      <span style={{ fontSize: 11, color: t.tx4, fontFamily: F_MONO }}>—</span>
                    )}
                  </td>
                  {/* Status */}
                  <td style={{ padding: '10px 14px', background: rowBg }}><StatusPill active={user.is_active} t={t}/></td>
                  {/* Login Terakhir */}
                  <td style={{ padding: '10px 14px', background: rowBg, whiteSpace: 'nowrap' }}>
                    {user.last_login ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <span style={{ fontSize: 11, color: t.tx2, fontFamily: F_MONO }}>
                          {new Date(user.last_login).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                        <span style={{ fontSize: 10, color: t.tx4, fontFamily: F_MONO }}>
                          {new Date(user.last_login).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                    ) : (
                      <span style={{ fontSize: 11, color: t.tx4, fontFamily: F_MONO }}>—</span>
                    )}
                  </td>
                  {/* Dibuat Oleh */}
                  <td style={{ padding: '10px 14px', background: rowBg, color: t.tx4, fontFamily: F_MONO, fontSize: 11 }}>{user.created_by_name ?? '—'}</td>
                  {/* Aksi */}
                  <td style={{ padding: '10px 14px', background: rowBg }}>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 4, flexWrap: 'nowrap' }}>
                      {canToggle(user) && (
                        <IBtn icon={user.is_active ? ToggleRight : ToggleLeft} color={user.is_active ? t.red : t.green} bg={user.is_active ? t.redBg : t.greenBg} bd={user.is_active ? t.redBd : t.greenBd} onClick={() => handleToggleActive(user)} title={user.is_active ? 'Nonaktifkan' : 'Aktifkan'}/>
                      )}
                      {canEdit(user) && (
                        <IBtn icon={Edit2} color={t.blue} bg={t.blueBg} bd={t.blueBd} onClick={() => { setEditing(user); setShowForm(false); }} title="Edit"/>
                      )}
                      {canReset(user) && (
                        <IBtn icon={KeyRound} color={t.purple} bg={t.purpleBg} bd={t.purpleBd} onClick={() => setResetUser(user)} title="Reset Password"/>
                      )}
                      {canViewHistory(user) && (
                        <IBtn icon={History} color={t.blue} bg={t.blueBg} bd={t.blueBd} onClick={() => setHistoryUser(user)} title="Riwayat Login"/>
                      )}
                      {canDel(user) && (
                        <IBtn icon={Trash2} color={t.red} bg={t.redBg} bd={t.redBd} onClick={() => setDeleteId(user.id)} title="Hapus"/>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── FOOTER ── */}
      <div style={{ paddingTop: 10, marginTop: 'auto', borderTop: `1px solid ${t.line}`, display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'center', flexShrink: 0 }}>
        {(['root', 'admin', 'user'] as UserRole[]).map(role => {
          const Icon = ROLE_CFG[role].icon;
          const c    = roleCss(role, t);
          return (
            <div key={role} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10.5, color: t.tx3, fontFamily: F_MONO }}>
              <Icon size={11} color={c.tx}/>
              <strong style={{ color: c.tx }}>{ROLE_LABELS[role]}</strong>:
              <span>{ROLE_CFG[role].desc}</span>
            </div>
          );
        })}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10, fontSize: 10, color: t.tx4, fontFamily: F_MONO }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <KeyRound size={10}/> Reset password
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <History size={10}/> Riwayat login
          </span>
        </div>
      </div>
    </div>
  );
}