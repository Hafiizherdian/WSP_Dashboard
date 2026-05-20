'use client';

import React, { useState, useMemo } from 'react';
import { Lock, Database, Settings, KeyRound, CheckCircle, X } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import { ROLE_LABELS, UserRole } from '@/lib/auth/types';
import {
  tk, Theme, FONT_MONO, Spinner, CardBox, FormGroup,
} from './shared';

const ROLE_CFG: Record<UserRole, { Icon: React.ComponentType<any>; color: string; bg: string; border: string }> = {
  root:  { Icon: require('lucide-react').ShieldAlert, color: '#a78bfa', bg: 'rgba(167,139,250,0.1)',  border: 'rgba(167,139,250,0.25)' },
  admin: { Icon: require('lucide-react').ShieldCheck, color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',   border: 'rgba(96,165,250,0.25)'  },
  user:  { Icon: require('lucide-react').Shield,      color: '#34d399', bg: 'rgba(52,211,153,0.1)',   border: 'rgba(52,211,153,0.25)'  },
};

// ─── ResetPasswordForm ────────────────────────────────────────────────────────
function ResetPasswordForm({ theme, addToast }: {
  theme: Theme;
  addToast: (type: 'success' | 'error' | 'warning' | 'info', title: string, msg?: string) => void;
}) {
  const t = tk[theme];
  const { user } = useAuth();
  const [currentPw, setCurrentPw] = useState('');
  const [newPw,     setNewPw]     = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [loading,   setLoading]   = useState(false);
  const [showCur,   setShowCur]   = useState(false);
  const [showNew,   setShowNew]   = useState(false);
  const [showCon,   setShowCon]   = useState(false);

  const strength = useMemo(() => {
    if (!newPw) return 0; let s = 0;
    if (newPw.length >= 8) s++;
    if (/[A-Z]/.test(newPw)) s++;
    if (/[0-9]/.test(newPw)) s++;
    if (/[^A-Za-z0-9]/.test(newPw)) s++;
    return s;
  }, [newPw]);

  const strengthLabel = ['', 'Lemah', 'Cukup', 'Baik', 'Kuat'][strength];
  const strengthColor = ['', t.red.text, t.yellow.text, t.blue.text, t.green.text][strength];

  const inputStyle = (): React.CSSProperties => ({
    width: '100%', padding: '9px 38px 9px 12px', fontSize: 13, borderRadius: 9,
    background: t.inputbg, border: `1px solid ${t.borderInput}`, color: t.text,
    outline: 'none', fontFamily: FONT_MONO, transition: 'border-color 0.15s',
  });

  const EyeToggle = ({ show, onToggle }: { show: boolean; onToggle: () => void }) => (
    <button type="button" onClick={onToggle} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: t.textMuted, display: 'flex', padding: 2 }}>
      {show
        ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" /></svg>
        : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>}
    </button>
  );

  const handleSubmit = async () => {
    if (!currentPw || !newPw || !confirmPw) { addToast('warning', 'Semua field harus diisi'); return; }
    if (newPw !== confirmPw) { addToast('error', 'Password tidak cocok'); return; }
    if (newPw.length < 6) { addToast('error', 'Password terlalu pendek', 'Minimal 6 karakter'); return; }
    if (newPw === currentPw) { addToast('warning', 'Password sama', 'Password baru harus berbeda'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }) });
      const r = await res.json();
      if (res.ok && r.success) {
        addToast('success', 'Password berhasil diubah');
        setCurrentPw(''); setNewPw(''); setConfirmPw('');
      } else { addToast('error', 'Gagal mengubah password', r.error ?? 'Coba kembali'); }
    } catch { addToast('error', 'Koneksi gagal'); }
    finally { setLoading(false); }
  };

  const roleCfg = user ? ROLE_CFG[user.role] : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {user && roleCfg && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 10, background: roleCfg.bg, border: `1px solid ${roleCfg.border}`, marginBottom: 4 }}>
          <roleCfg.Icon size={16} color={roleCfg.color} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: t.text, fontFamily: FONT_MONO }}>{user.username}</div>
            <div style={{ fontSize: 11, color: roleCfg.color, fontFamily: FONT_MONO, fontWeight: 600 }}>{ROLE_LABELS[user.role]}</div>
          </div>
        </div>
      )}

      <FormGroup label="Password Saat Ini" theme={theme}>
        <div style={{ position: 'relative' }}>
          <input type={showCur ? 'text' : 'password'} value={currentPw} onChange={e => setCurrentPw(e.target.value)} placeholder="Masukkan password saat ini" style={inputStyle()} />
          <EyeToggle show={showCur} onToggle={() => setShowCur(p => !p)} />
        </div>
      </FormGroup>

      <FormGroup label="Password Baru" hint="Minimal 6 karakter" theme={theme}>
        <div style={{ position: 'relative' }}>
          <input type={showNew ? 'text' : 'password'} value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="Masukkan password baru" style={inputStyle()} />
          <EyeToggle show={showNew} onToggle={() => setShowNew(p => !p)} />
        </div>
        {newPw.length > 0 && (
          <div style={{ marginTop: 7 }}>
            <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
              {[1, 2, 3, 4].map(lvl => <div key={lvl} style={{ flex: 1, height: 3, borderRadius: 3, background: lvl <= strength ? strengthColor : t.border, transition: 'background 0.2s' }} />)}
            </div>
            <div style={{ fontSize: 10, fontFamily: FONT_MONO, color: strengthColor, fontWeight: 600 }}>{strengthLabel}</div>
          </div>
        )}
      </FormGroup>

      <FormGroup label="Konfirmasi Password Baru" theme={theme}>
        <div style={{ position: 'relative' }}>
          <input type={showCon ? 'text' : 'password'} value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="Ulangi password baru" style={inputStyle()} />
          <EyeToggle show={showCon} onToggle={() => setShowCon(p => !p)} />
        </div>
        {confirmPw && newPw && (
          <div style={{ marginTop: 5, fontSize: 11, fontFamily: FONT_MONO, display: 'flex', alignItems: 'center', gap: 4, color: confirmPw === newPw ? t.green.text : t.red.text }}>
            {confirmPw === newPw ? <CheckCircle size={10} /> : <X size={10} />}
            {confirmPw === newPw ? 'Password cocok' : 'Password tidak cocok'}
          </div>
        )}
      </FormGroup>

      <button onClick={handleSubmit} disabled={loading || !currentPw || !newPw || !confirmPw || newPw !== confirmPw}
        style={{ padding: '10px 20px', borderRadius: 9, fontSize: 13, fontWeight: 700, border: 'none', background: (loading || !currentPw || !newPw || !confirmPw || newPw !== confirmPw) ? t.btnDisabled.bg : '#6366f1', color: (loading || !currentPw || !newPw || !confirmPw || newPw !== confirmPw) ? t.btnDisabled.text : '#fff', cursor: (loading || !currentPw || !newPw || !confirmPw || newPw !== confirmPw) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8, alignSelf: 'flex-start', boxShadow: (loading || !currentPw || !newPw || !confirmPw) ? 'none' : '0 2px 10px rgba(99,102,241,0.3)', transition: 'all 0.15s' }}>
        {loading ? <><Spinner size={13} color="currentColor" /> Menyimpan…</> : <><KeyRound size={14} /> Ubah Password</>}
      </button>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
interface Props {
  theme:    Theme;
  addToast: (type: 'success' | 'error' | 'warning' | 'info', title: string, msg?: string) => void;
}

export default function SettingsTab({ theme, addToast }: Props) {
  const t = tk[theme];
  const { user } = useAuth();
  const isRoot = user?.role === 'root';

  const handleMigrate = async () => {
    try {
      const res = await fetch('/api/migrate', { method: 'POST' });
      const r = await res.json();
      if (r.success) addToast('success', 'Migration selesai!');
      else addToast('error', 'Migration gagal', r.error);
    } catch { addToast('error', 'Gagal', 'Coba kembali.'); }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, alignItems: 'start' }}>
      <CardBox title="Ubah Password" icon={Lock} iconColor="#6366f1" accent="#6366f1" theme={theme}>
        <ResetPasswordForm theme={theme} addToast={addToast} />
      </CardBox>

      {isRoot && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <CardBox title="Database Migration" icon={Database} iconColor="#10b981" accent="#10b981" theme={theme}>
            <div style={{ fontSize: 13, color: t.textSub, marginBottom: 16, lineHeight: 1.7 }}>
              Jalankan migration untuk menambahkan kolom area dan update struktur database.
            </div>
            <button onClick={handleMigrate} style={{ padding: '9px 20px', borderRadius: 9, fontSize: 13, fontWeight: 600, background: '#10b981', color: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 2px 8px rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Database size={14} /> Run Migration
            </button>
          </CardBox>

          <CardBox title="Pengaturan Sistem" icon={Settings} iconColor="#a855f7" accent="#a855f7" theme={theme}>
            <div style={{ fontSize: 13, color: t.textMuted }}>Sek mumet…</div>
          </CardBox>
        </div>
      )}
    </div>
  );
}