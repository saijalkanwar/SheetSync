'use client';
import { useState } from 'react';

interface NameModalProps {
  onConfirm: (name: string, color: string) => void;
}

const PRESET_COLORS = [
  '#7c3aed', '#4f46e5', '#0891b2', '#059669',
  '#d97706', '#dc2626', '#db2777', '#0d9488',
];

export default function NameModal({ onConfirm }: NameModalProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [error, setError] = useState('');

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) { setError('Please enter a display name'); return; }
    if (trimmed.length > 24) { setError('Name must be 24 characters or less'); return; }
    onConfirm(trimmed, color);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal" onClick={e => e.stopPropagation()}>
        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            width: 52, height: 52,
            background: 'linear-gradient(135deg, #1a73e8 0%, #0d47a1 100%)',
            borderRadius: 14,
            margin: '0 auto 14px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="2" width="9" height="9" rx="2" fill="white" opacity="0.9"/>
              <rect x="13" y="2" width="9" height="9" rx="2" fill="white" opacity="0.7"/>
              <rect x="2" y="13" width="9" height="9" rx="2" fill="white" opacity="0.7"/>
              <rect x="13" y="13" width="9" height="9" rx="2" fill="white" opacity="0.5"/>
            </svg>
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
            Welcome to SheetSync
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Set your display name so collaborators know who you are.
          </p>
        </div>

        {/* Name input */}
        <label style={{ display: 'block', marginBottom: 16 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
            Display Name
          </span>
          <input
            type="text"
            value={name}
            onChange={e => { setName(e.target.value); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            placeholder="e.g. Alex Johnson"
            autoFocus
            maxLength={24}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: `1.5px solid ${error ? 'var(--danger)' : 'var(--border)'}`,
              borderRadius: 'var(--radius-md)',
              fontSize: 14,
              color: 'var(--text-primary)',
              background: 'var(--background)',
              outline: 'none',
              transition: 'border-color 0.15s',
              fontFamily: 'inherit',
            }}
            onFocus={e => !error && (e.target.style.borderColor = 'var(--primary)')}
            onBlur={e => !error && (e.target.style.borderColor = 'var(--border)')}
            suppressHydrationWarning
          />
          {error && (
            <span style={{ fontSize: 12, color: 'var(--danger)', marginTop: 4, display: 'block' }}>
              {error}
            </span>
          )}
        </label>

        {/* Color picker */}
        <label style={{ display: 'block', marginBottom: 24 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>
            Your Color
          </span>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {PRESET_COLORS.map(c => (
              <button
                key={c}
                onClick={() => setColor(c)}
                style={{
                  width: 28, height: 28,
                  borderRadius: '50%',
                  background: c,
                  border: color === c ? `3px solid ${c}` : '3px solid transparent',
                  outline: color === c ? `2px solid ${c}` : '2px solid transparent',
                  outlineOffset: 2,
                  cursor: 'pointer',
                  transition: 'transform 0.1s',
                  transform: color === c ? 'scale(1.2)' : 'scale(1)',
                }}
              />
            ))}
          </div>
        </label>

        {/* Preview */}
        {name.trim() && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 12px', background: 'var(--background)',
            borderRadius: 'var(--radius-md)', marginBottom: 20,
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: color, color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700,
            }}>
              {name.trim()[0].toUpperCase()}
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
              {name.trim()}
            </span>
            <span style={{
              marginLeft: 'auto', fontSize: 11, fontWeight: 500,
              padding: '2px 8px', background: color + '22',
              color: color, borderRadius: 'var(--radius-full)',
            }}>
              You
            </span>
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            onClick={handleSubmit}
            style={{
              width: '100%', padding: '11px',
              background: name.trim() ? 'var(--primary)' : '#c5d5f5',
              color: '#fff',
              border: 'none', borderRadius: 'var(--radius-md)',
              fontSize: 14, fontWeight: 600,
              cursor: name.trim() ? 'pointer' : 'not-allowed',
              transition: 'background 0.15s',
              fontFamily: 'inherit',
            }}
          >
            Continue
          </button>
          <button
            onClick={() => onConfirm('Guest', PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)])}
            style={{
              width: '100%', padding: '11px',
              background: 'none', color: 'var(--text-secondary)',
              border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)',
              fontSize: 14, fontWeight: 500, cursor: 'pointer',
              transition: 'background 0.15s, border-color 0.15s',
              fontFamily: 'inherit',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-hover)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
          >
            Continue as Guest
          </button>
          <button
            style={{
              width: '100%', padding: '11px',
              background: '#fff3f3', color: 'var(--danger)',
              border: '1.5px solid #fecaca', borderRadius: 'var(--radius-md)',
              fontSize: 14, fontWeight: 500, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'background 0.15s',
              fontFamily: 'inherit',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#ffe4e4'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#fff3f3'; }}
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <path d="M17.5 10.5c0 4.142-3.358 7.5-7.5 7.5s-7.5-3.358-7.5-7.5S5.858 3 10 3a7.5 7.5 0 015.303 2.197" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M17.5 3l-7.5 7.5M17.5 3h-4m4 0v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Sign in with Google
          </button>
        </div>
      </div>
    </div>
  );
}
