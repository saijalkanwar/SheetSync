'use client';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

interface NavbarProps {
  docTitle?: string;
  onTitleChange?: (newTitle: string) => void;
  onColorChange?: (color: string) => void;
}

export default function Navbar({ docTitle, onTitleChange, onColorChange }: NavbarProps) {
  const { user, signInWithGoogle, signOut } = useAuth();
  const [menuOpen, setMenuOpen]     = useState(false);
  const [customColor, setCustomColor] = useState<string | null>(null);
  const [localTitle, setLocalTitle] = useState(docTitle ?? '');
  const router = useRouter();
  const titleRef = useRef<HTMLInputElement>(null);

  // Keep local title in sync when Firestore loads the real title
  const prevDocTitle = useRef(docTitle);
  if (docTitle !== prevDocTitle.current) {
    prevDocTitle.current = docTitle;
    setLocalTitle(docTitle ?? '');
  }

  const handleSignOut = async () => {
    setMenuOpen(false);
    await signOut();
    router.push('/login');
  };

  // ── Theme ──────────────────────────────────────────
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const saved = localStorage.getItem('theme');
    const dark = saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setIsDark(dark);
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  }, []);
  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  const avatar = {
    initial: user?.initial ?? 'G',
    color:   customColor ?? user?.color ?? '#9aa0ab',
    name:    user?.name    ?? 'Guest',
    sub:     user?.isGuest ? 'Guest session' : (user ? 'Signed in' : 'Not signed in'),
  };

  return (
    <header
      style={{
        height: 'var(--navbar-h)',
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '0 16px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: 'var(--shadow-xs)',
      }}
    >
      {/* Logo */}
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flexShrink: 0 }}>
        <div style={{
          width: 32, height: 32,
          background: 'linear-gradient(135deg, #1a73e8 0%, #0d47a1 100%)',
          borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <rect x="1" y="1" width="7" height="7" rx="1.5" fill="white" opacity="0.9"/>
            <rect x="10" y="1" width="7" height="7" rx="1.5" fill="white" opacity="0.7"/>
            <rect x="1" y="10" width="7" height="7" rx="1.5" fill="white" opacity="0.7"/>
            <rect x="10" y="10" width="7" height="7" rx="1.5" fill="white" opacity="0.5"/>
          </svg>
        </div>
        <span style={{ fontWeight: 700, fontSize: 16, color: '#1a73e8', letterSpacing: '-0.3px' }}>
          SheetSync
        </span>
      </Link>

      {/* Editable Document title (only on editor) */}
      {docTitle !== undefined && (
        <>
          <span style={{ color: 'var(--border)', fontSize: 20 }}>/</span>
          <input
            ref={titleRef}
            value={localTitle}
            onChange={e => setLocalTitle(e.target.value)}
            onBlur={() => {
              const trimmed = localTitle.trim() || 'Untitled spreadsheet';
              setLocalTitle(trimmed);
              onTitleChange?.(trimmed);
            }}
            onKeyDown={e => {
              if (e.key === 'Enter') titleRef.current?.blur();
              if (e.key === 'Escape') {
                setLocalTitle(docTitle);
                titleRef.current?.blur();
              }
            }}
            placeholder="Untitled spreadsheet"
            style={{
              border: 'none', outline: 'none',
              fontSize: 14, fontWeight: 500,
              color: 'var(--text-primary)',
              background: 'transparent',
              maxWidth: 280,
              padding: '4px 6px',
              borderRadius: 4,
              transition: 'background 0.15s',
            }}
            onFocus={e => (e.target.style.background = 'var(--surface-hover)')}
            onBlurCapture={e => (e.target.style.background = 'transparent')}
            suppressHydrationWarning
          />
        </>
      )}

      <div style={{ flex: 1 }} />

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

        {/* Dark / Light toggle */}
        <button
          onClick={toggleTheme}
          suppressHydrationWarning
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          style={{
            width: 34, height: 34, borderRadius: '50%',
            background: 'var(--surface-hover)',
            border: '1.5px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'background 0.15s, transform 0.15s',
            color: 'var(--text-secondary)',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.08)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
        >
          {isDark ? (
            /* Sun icon */
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          ) : (
            /* Moon icon */
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </button>

        {/* User dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setMenuOpen(o => !o)}
            style={{
              width: 34, height: 34,
              borderRadius: '50%',
              background: avatar.color,
              border: '2px solid var(--border)',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 13, fontWeight: 700,
              transition: 'transform 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
            title={avatar.name}
            suppressHydrationWarning
          >
            {avatar.initial}
          </button>

          {menuOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)', right: 0,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-md)',
              minWidth: 200, padding: 8,
              animation: 'fadeIn 0.12s ease-out',
              zIndex: 200,
            }}>
              {/* User info */}
              <div style={{ padding: '8px 10px 12px', borderBottom: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: avatar.color, color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700, flexShrink: 0,
                  }}>
                    {avatar.initial}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{avatar.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{avatar.sub}</div>
                  </div>
                </div>
              </div>

              {/* Colour picker */}
              <div style={{ padding: '10px 10px 6px', borderBottom: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Your colour</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {['#7c3aed','#4f46e5','#0891b2','#059669','#d97706','#dc2626','#db2777','#0d9488','#1a73e8','#f59e0b','#10b981','#ef4444'].map(c => (
                    <button
                      key={c}
                      suppressHydrationWarning
                      onClick={() => {
                        setCustomColor(c);
                        onColorChange?.(c);
                      }}
                      title={c}
                      style={{
                        width: 20, height: 20, borderRadius: '50%', background: c,
                        border: (customColor ?? user?.color) === c ? '3px solid var(--text-primary)' : '2px solid transparent',
                        cursor: 'pointer', transition: 'transform 0.1s',
                        outline: (customColor ?? user?.color) === c ? `2px solid ${c}` : 'none',
                        outlineOffset: 1,
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.25)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
                    />
                  ))}
                </div>
              </div>

              {(!user || user.isGuest) && (
                <button
                  onClick={async () => { setMenuOpen(false); await signInWithGoogle(); }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 10px', background: 'none', border: 'none',
                    borderRadius: 'var(--radius-sm)', fontSize: 13,
                    color: 'var(--primary)', cursor: 'pointer',
                    marginTop: 4, transition: 'background 0.1s', fontFamily: 'inherit',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--primary-light)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >
                  <svg width="14" height="14" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.36-8.16 2.36-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  </svg>
                  Sign in with Google
                </button>
              )}

              {user && (
                <button
                  onClick={handleSignOut}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 10px', background: 'none', border: 'none',
                    borderRadius: 'var(--radius-sm)', fontSize: 13,
                    color: 'var(--danger)', cursor: 'pointer',
                    marginTop: 4, transition: 'background 0.1s', fontFamily: 'inherit',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#fff3f3')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M5.5 2H2a1 1 0 00-1 1v8a1 1 0 001 1h3.5M9.5 10l3-3-3-3M12.5 7H5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Sign out
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
