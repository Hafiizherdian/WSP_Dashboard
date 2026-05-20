'use client';

// app/login/page.tsx
import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, AlertCircle, LogIn, User, BarChart2 } from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

const FONT_SANS = 'IBM Plex Sans, sans-serif';
const FONT_MONO = 'IBM Plex Mono, monospace';

const ERROR_MESSAGES: Record<string, string> = {
  forbidden: 'Akses ditolak untuk halaman tersebut.',
};

// ─── Style Builders ───────────────────────────────────────────────────────────

const styles = {
  page: {
    minHeight: '100vh',
    background: '#f0f2f5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    fontFamily: FONT_SANS,
  } as React.CSSProperties,

  card: (mounted: boolean): React.CSSProperties => ({
    width: '100%',
    maxWidth: 390,
    background: '#ffffff',
    border: '0.5px solid rgba(0,0,0,0.1)',
    borderRadius: 20,
    padding: '36px 32px 28px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
    position: 'relative',
    opacity: mounted ? 1 : 0,
    transform: mounted ? 'translateY(0)' : 'translateY(18px)',
    transition: 'opacity 0.4s ease, transform 0.4s ease',
  }),

  accentLine: {
    position: 'absolute',
    top: 0,
    left: 32,
    right: 32,
    height: 3,
    background: '#1c9706',
    borderRadius: '0 0 4px 4px',
  } as React.CSSProperties,

  input: {
    width: '100%',
    padding: '10px 14px',
    fontSize: 14,
    borderRadius: 10,
    background: '#f7f8fa',
    border: '1px solid rgba(0,0,0,0.1)',
    color: '#111827',
    outline: 'none',
    fontFamily: FONT_SANS,
    transition: 'border-color 0.15s',
    boxSizing: 'border-box' as const,
  } as React.CSSProperties,

  label: {
    display: 'block',
    fontSize: 10,
    fontWeight: 600,
    color: '#6b7280',
    marginBottom: 7,
    fontFamily: FONT_MONO,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
  } as React.CSSProperties,

  submitButton: (loading: boolean): React.CSSProperties => ({
    marginTop: 8,
    padding: '11px',
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
    fontFamily: FONT_SANS,
    letterSpacing: '0.01em',
    background: loading ? 'rgba(28,151,6,0.55)' : '#1c9706',
    color: loading ? 'rgba(255,255,255,0.6)' : '#fff',
    border: 'none',
    cursor: loading ? 'not-allowed' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    transition: 'background 0.2s, transform 0.1s',
    width: '100%',
  }),
};

// ─── Input focus/blur handlers ────────────────────────────────────────────────

const inputFocusHandlers = {
  onFocus: (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = 'rgba(28,151,6,0.5)';
    e.target.style.background = '#fff';
  },
  onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = 'rgba(0,0,0,0.1)';
    e.target.style.background = '#f7f8fa';
  },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function LoadingSpinner() {
  return (
    <svg
      style={{ animation: 'spin 1s linear infinite', width: 15, height: 15 }}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
      <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" fill="none" />
    </svg>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '10px 14px', borderRadius: 10,
      background: 'rgba(239,68,68,0.06)',
      border: '1px solid rgba(239,68,68,0.18)',
      color: '#dc2626', fontSize: 13, marginBottom: 20,
    }}>
      <AlertCircle size={14} style={{ flexShrink: 0 }} />
      {message}
    </div>
  );
}

function LiveBadge() {
  return (
    <div style={{
      position: 'absolute',
      top: 18, right: 18,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      background: '#edf8ea',
      color: '#1c9706',
      fontSize: 10,
      fontFamily: FONT_MONO,
      fontWeight: 700,
      padding: '3px 8px',
      borderRadius: 6,
      letterSpacing: '0.07em',
    }}>
      <span style={{
        width: 6, height: 6,
        borderRadius: '50%',
        background: '#1c9706',
        display: 'inline-block',
      }} />
      LIVE
    </div>
  );
}

function CardLogo() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28, textAlign: 'center' }}>
      {/* Logo box */}
      <div style={{
        width: 52, height: 52,
        background: '#1c9706',
        borderRadius: 14,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 14,
      }}>
        <img
          src="/logo-cgkn.png"
          alt="CGKN"
          style={{ width: 34, height: 34, objectFit: 'contain' }}
          onError={(e) => {
            // fallback: render bar chart icon if image not found
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      </div>
      <div style={{
        fontSize: 17,
        fontWeight: 700,
        color: '#111827',
        fontFamily: FONT_MONO,
        letterSpacing: '-0.02em',
        marginBottom: 4,
      }}>
        CGKN Dashboard
      </div>
      <div style={{
        fontSize: 10,
        color: '#9ca3af',
        fontFamily: FONT_MONO,
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
      }}>
        Sales Data Management
      </div>
    </div>
  );
}

// ─── Login Form ───────────────────────────────────────────────────────────────

function LoginForm() {
  const router   = useRouter();
  const params   = useSearchParams();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [mounted,  setMounted]  = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const errorParam = params.get('error');
    if (errorParam && ERROR_MESSAGES[errorParam]) {
      setError(ERROR_MESSAGES[errorParam]);
    }
  }, [params]);

  const clearError = () => setError('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) { setError('Isi semua field'); return; }

    setLoading(true);
    clearError();

    try {
      const res  = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json();

      if (res.ok) {
        router.replace(params.get('from') || '/admin');
      } else {
        setError(data.error || 'Login gagal');
      }
    } catch {
      setError('Tidak bisa terhubung ke server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.card(mounted)}>

      {/* Green accent top line */}
      <div style={styles.accentLine} />

      {/* Live badge */}
      {/* <LiveBadge /> */}

      {/* Logo + title */}
      <CardLogo />

      {/* Error */}
      {error && <ErrorBanner message={error} />}

      {/* Form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Username */}
        <div>
          <label style={styles.label}>Username</label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={username}
              onChange={e => { setUsername(e.target.value); clearError(); }}
              placeholder="Masukkan username"
              autoComplete="username"
              autoFocus
              style={{ ...styles.input, paddingRight: 38 }}
              {...inputFocusHandlers}
            />
            <span style={{
              position: 'absolute', right: 12, top: '50%',
              transform: 'translateY(-50%)',
              color: '#9ca3af', display: 'flex', pointerEvents: 'none',
            }}>
              <User size={14} />
            </span>
          </div>
        </div>

        {/* Password */}
        <div>
          <label style={styles.label}>Password</label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={e => { setPassword(e.target.value); clearError(); }}
              placeholder="Masukkan password"
              autoComplete="current-password"
              style={{ ...styles.input, paddingRight: 38 }}
              {...inputFocusHandlers}
            />
            <button
              type="button"
              onClick={() => setShowPass(v => !v)}
              aria-label={showPass ? 'Sembunyikan password' : 'Tampilkan password'}
              style={{
                position: 'absolute', right: 12, top: '50%',
                transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#9ca3af', display: 'flex', padding: 0,
              }}
            >
              {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          style={styles.submitButton(loading)}
          onMouseEnter={e => { if (!loading) (e.currentTarget.style.background = '#189205'); }}
          onMouseLeave={e => { if (!loading) (e.currentTarget.style.background = '#1c9706'); }}
        >
          {loading ? (
            <><LoadingSpinner /> Masuk…</>
          ) : (
            <><LogIn size={14} /> Masuk</>
          )}
        </button>

      </form>

      {/* Footer */}
      <div style={{
        marginTop: 22,
        paddingTop: 18,
        borderTop: '0.5px solid rgba(0,0,0,0.07)',
        textAlign: 'center',
        fontSize: 10,
        color: '#c4c8d0',
        fontFamily: FONT_MONO,
        letterSpacing: '0.04em',
      }}>
        Hubungi Pak Nanang jika lupa password
      </div>

    </div>
  );
}

// ─── Login Page ───────────────────────────────────────────────────────────────

export default function LoginPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes spin { to { transform: rotate(360deg); } }
        input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 100px #f7f8fa inset !important;
          -webkit-text-fill-color: #111827 !important;
        }
      `}</style>

      <div style={styles.page}>
        <Suspense fallback={<div style={styles.card(true)} />}>
          <LoginForm />
        </Suspense>
      </div>
    </>
  );
}