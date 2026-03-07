'use client';
import Link from 'next/link';
import { useState } from 'react';

export default function Navbar({ docTitle }: { docTitle?: string }) {
  const [menuOpen, setMenuOpen] = useState(false);

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

      {/* Document title (only on editor) */}
      {docTitle !== undefined && (
        <>
          <span style={{ color: 'var(--border)', fontSize: 20 }}>/</span>
          <input
            defaultValue={docTitle}
            placeholder="Untitled spreadsheet"
            style={{
              border: 'none',
              outline: 'none',
              fontSize: 14,
              fontWeight: 500,
              color: 'var(--text-primary)',
              background: 'transparent',
              maxWidth: 260,
              padding: '4px 6px',
              borderRadius: 4,
              transition: 'background 0.15s',
            }}
            onFocus={e => (e.target.style.background = 'var(--surface-hover)')}
            onBlur={e => (e.target.style.background = 'transparent')}
          />
        </>
      )}

      <div style={{ flex: 1 }} />

      {/* Right side actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Share button */}
        {docTitle !== undefined && (
          <button
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px',
              background: 'var(--primary)',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--radius-full)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.15s, transform 0.1s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--primary-hover)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--primary)')}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M11 5a2 2 0 100-4 2 2 0 000 4zM3 9a2 2 0 100-4 2 2 0 000 4zM11 13a2 2 0 100-4 2 2 0 000 4z" stroke="white" strokeWidth="1.4"/>
              <path d="M4.9 8.2l4.2 2.1M9.1 3.7L4.9 5.8" stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            Share
          </button>
        )}

        {/* User avatar */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              width: 34, height: 34,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
              border: '2px solid var(--border)',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff',
              fontSize: 13,
              fontWeight: 700,
              transition: 'transform 0.15s',
            }}
          >
            U
          </button>
          {menuOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)', right: 0,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-md)',
              minWidth: 180,
              padding: '8px',
              animation: 'fadeIn 0.12s ease-out',
              zIndex: 200,
            }}>
              <div style={{ padding: '8px 10px 12px', borderBottom: '1px solid var(--border-light)' }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>Guest User</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Not signed in</div>
              </div>
              <button
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 10px', background: 'none', border: 'none',
                  borderRadius: 'var(--radius-sm)', fontSize: 13,
                  color: 'var(--text-primary)', cursor: 'pointer',
                  marginTop: 4,
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-hover)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1a3 3 0 110 6 3 3 0 010-6zM1.5 13c0-3.038 2.462-5.5 5.5-5.5s5.5 2.462 5.5 5.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
                Set display name
              </button>
              <button
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 10px', background: 'none', border: 'none',
                  borderRadius: 'var(--radius-sm)', fontSize: 13,
                  color: 'var(--primary)', cursor: 'pointer',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--primary-light)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M5.5 2.5H2a1 1 0 00-1 1v8.5a1 1 0 001 1h9.5a1 1 0 001-1v-3.5M8.5 1.5l4 4M8.5 1.5H12m0 0v3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Sign in with Google
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
