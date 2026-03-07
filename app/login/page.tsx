'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

const PRESET_COLORS = [
  '#7c3aed', '#4f46e5', '#0891b2', '#059669',
  '#d97706', '#dc2626', '#db2777', '#0d9488',
];

function LoginContent() {
  const { user, loading, signInWithGoogle, continueAsGuest } = useAuth();
  const router        = useRouter();
  const searchParams  = useSearchParams();
  const redirect      = searchParams.get('redirect') ?? '/';

  const [guestName,  setGuestName]  = useState('');
  const [guestColor, setGuestColor] = useState(PRESET_COLORS[0]);
  const [showGuest,  setShowGuest]  = useState(false);
  const [nameError,  setNameError]  = useState('');
  const [signing,    setSigning]    = useState(false);

  // Already logged in → go home
  useEffect(() => {
    if (!loading && user) router.replace(redirect);
  }, [user, loading, redirect, router]);

  const handleGoogle = async () => {
    setSigning(true);
    try { await signInWithGoogle(); } finally { setSigning(false); }
  };

  const handleGuest = () => {
    const name = guestName.trim();
    if (!name) { setNameError('Please enter a display name'); return; }
    if (name.length > 24) { setNameError('Max 24 characters'); return; }
    continueAsGuest(name);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--background)' }}>
        <div style={{ width: 36, height: 36, border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0d47a1 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, position: 'relative', overflow: 'hidden',
    }}>
      {/* Background decoration */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.06,
        backgroundImage: 'radial-gradient(circle, white 1.5px, transparent 1.5px)',
        backgroundSize: '32px 32px',
      }} />
      <div style={{
        position: 'absolute', top: '-30%', right: '-10%',
        width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(26,115,232,0.3) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-20%', left: '-10%',
        width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(124,58,237,0.2) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Card */}
      <div style={{
        background: 'rgba(255,255,255,0.97)',
        backdropFilter: 'blur(20px)',
        borderRadius: 24,
        boxShadow: '0 24px 64px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.1)',
        padding: '48px 40px',
        width: '100%', maxWidth: 440,
        position: 'relative', zIndex: 1,
        animation: 'fadeIn 0.3s ease-out',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 64, height: 64,
            background: 'linear-gradient(135deg, #1a73e8 0%, #0d47a1 100%)',
            borderRadius: 18, margin: '0 auto 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(26,115,232,0.35)',
          }}>
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
              <rect x="2"  y="2"  width="9" height="9" rx="2" fill="white" opacity="0.95"/>
              <rect x="13" y="2"  width="9" height="9" rx="2" fill="white" opacity="0.75"/>
              <rect x="2"  y="13" width="9" height="9" rx="2" fill="white" opacity="0.75"/>
              <rect x="13" y="13" width="9" height="9" rx="2" fill="white" opacity="0.5"/>
            </svg>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#1a1d23', letterSpacing: '-0.5px', marginBottom: 8 }}>
            SheetSync
          </h1>
          <p style={{ fontSize: 15, color: '#5f6368', lineHeight: 1.5 }}>
            Real-time collaborative spreadsheets.<br/>Sign in to get started.
          </p>
        </div>

        {!showGuest ? (
          <>
            {/* Google Sign-In */}
            <button
              onClick={handleGoogle}
              disabled={signing}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
                padding: '13px 20px',
                background: signing ? '#f5f5f5' : '#fff',
                border: '1.5px solid #dadce0',
                borderRadius: 12,
                fontSize: 15, fontWeight: 600, color: '#3c4043',
                cursor: signing ? 'wait' : 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                transition: 'box-shadow 0.15s, background 0.15s',
                marginBottom: 12,
                fontFamily: 'inherit',
              }}
              onMouseEnter={e => !signing && (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)')}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)')}
            >
              {/* Google G */}
              <svg width="20" height="20" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.36-8.16 2.36-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              {signing ? 'Signing in…' : 'Continue with Google'}
            </button>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
              <div style={{ flex: 1, height: 1, background: '#e2e6ef' }} />
              <span style={{ fontSize: 13, color: '#9aa0ab', fontWeight: 500 }}>or</span>
              <div style={{ flex: 1, height: 1, background: '#e2e6ef' }} />
            </div>

            {/* Guest */}
            <button
              onClick={() => setShowGuest(true)}
              style={{
                width: '100%', padding: '12px 20px',
                background: 'none', border: '1.5px solid #e2e6ef',
                borderRadius: 12,
                fontSize: 15, fontWeight: 500, color: '#5f6368',
                cursor: 'pointer', transition: 'background 0.15s, border-color 0.15s',
                fontFamily: 'inherit',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f1f3f8'; e.currentTarget.style.borderColor = '#c5cdd8'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.borderColor = '#e2e6ef'; }}
            >
              Continue as Guest
            </button>

            <p style={{ textAlign: 'center', fontSize: 12, color: '#9aa0ab', marginTop: 24, lineHeight: 1.6 }}>
              By signing in you agree to our Terms of Service.<br/>
              Your data is synced in real-time with Firebase.
            </p>
          </>
        ) : (
          <>
            {/* Back arrow */}
            <button
              onClick={() => setShowGuest(false)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#5f6368', fontSize: 13, fontWeight: 500,
                marginBottom: 20, padding: 0, fontFamily: 'inherit',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Back
            </button>

            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a1d23', marginBottom: 4 }}>
              Set your display name
            </h2>
            <p style={{ fontSize: 13, color: '#5f6368', marginBottom: 20 }}>
              Collaborators will see this name while you&apos;re editing.
            </p>

            {/* Name input */}
            <label style={{ display: 'block', marginBottom: 16 }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#5f6368', display: 'block', marginBottom: 6 }}>
                Display Name
              </span>
              <input
                type="text"
                value={guestName}
                onChange={e => { setGuestName(e.target.value); setNameError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleGuest()}
                placeholder="e.g. Alex Johnson"
                autoFocus
                maxLength={24}
                style={{
                  width: '100%', padding: '11px 13px',
                  border: `1.5px solid ${nameError ? '#ea4335' : '#dadce0'}`,
                  borderRadius: 10, fontSize: 14,
                  color: '#1a1d23', background: '#fff',
                  outline: 'none', fontFamily: 'inherit',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => !nameError && (e.target.style.borderColor = '#1a73e8')}
                onBlur={e => !nameError && (e.target.style.borderColor = '#dadce0')}
                suppressHydrationWarning
              />
              {nameError && (
                <span style={{ fontSize: 12, color: '#ea4335', marginTop: 4, display: 'block' }}>{nameError}</span>
              )}
            </label>

            {/* Color picker */}
            <label style={{ display: 'block', marginBottom: 24 }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#5f6368', display: 'block', marginBottom: 8 }}>
                Your Colour
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                {PRESET_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setGuestColor(c)}
                    style={{
                      width: 30, height: 30, borderRadius: '50%', background: c, border: 'none',
                      outline: guestColor === c ? `3px solid ${c}` : '3px solid transparent',
                      outlineOffset: 2, cursor: 'pointer',
                      transform: guestColor === c ? 'scale(1.2)' : 'scale(1)',
                      transition: 'transform 0.1s, outline 0.1s',
                    }}
                  />
                ))}
              </div>
            </label>

            {/* Preview */}
            {guestName.trim() && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 13px', background: '#f8f9fc',
                borderRadius: 10, marginBottom: 16,
                border: '1px solid #e2e6ef',
              }}>
                <div style={{
                  width: 30, height: 30, borderRadius: '50%',
                  background: guestColor, color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700,
                }}>
                  {guestName.trim()[0].toUpperCase()}
                </div>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#1a1d23' }}>{guestName.trim()}</span>
                <span style={{
                  marginLeft: 'auto', fontSize: 11, fontWeight: 600,
                  padding: '2px 8px', background: guestColor + '22',
                  color: guestColor, borderRadius: 99,
                }}>
                  Guest
                </span>
              </div>
            )}

            <button
              onClick={handleGuest}
              style={{
                width: '100%', padding: '13px',
                background: guestName.trim() ? '#1a73e8' : '#c5d5f5',
                color: '#fff', border: 'none', borderRadius: 12,
                fontSize: 15, fontWeight: 600,
                cursor: guestName.trim() ? 'pointer' : 'not-allowed',
                transition: 'background 0.15s', fontFamily: 'inherit',
              }}
              onMouseEnter={e => guestName.trim() && (e.currentTarget.style.background = '#1557b0')}
              onMouseLeave={e => (e.currentTarget.style.background = guestName.trim() ? '#1a73e8' : '#c5d5f5')}
            >
              Enter as Guest
            </button>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
