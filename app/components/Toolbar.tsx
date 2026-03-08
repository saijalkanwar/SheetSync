'use client';
import { useState, useRef, useEffect } from 'react';

interface ToolbarProps {
  onBold: () => void;
  onItalic: () => void;
  onUnderline: () => void;
  onStrikethrough: () => void;
  onFontSize: (size: number) => void;
  onColor: (color: string) => void;
  onBgColor: (color: string) => void;
  onAlignLeft: () => void;
  onAlignCenter: () => void;
  onAlignRight: () => void;
  onExport: () => void;
  isBold?: boolean;
  isItalic?: boolean;
  isUnderline?: boolean;
  isStrikethrough?: boolean;
  fontSize?: number;
  currentTextColor?: string;
  currentBgColor?: string;
}

// ── Utility ───────────────────────────────────────────
function useOutsideClick(ref: React.RefObject<HTMLElement | null>, onClose: () => void) {
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [ref, onClose]);
}

// ── Tool button ────────────────────────────────────────
function ToolBtn({
  onClick, active, title, children, style,
}: {
  onClick?: () => void;
  active?: boolean;
  title?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <button
      onClick={onClick}
      data-tooltip={title}
      suppressHydrationWarning
      style={{
        width: 28, height: 28,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: active ? 'var(--primary-light)' : 'transparent',
        border: active ? '1.5px solid #b0cbf7' : '1.5px solid transparent',
        borderRadius: 'var(--radius-sm)',
        color: active ? 'var(--primary)' : 'var(--text-secondary)',
        cursor: 'pointer',
        transition: 'background 0.1s, color 0.1s, border-color 0.1s',
        flexShrink: 0,
        ...style,
      }}
      onMouseEnter={e => {
        if (!active) {
          (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-hover)';
          (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)';
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
          (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
        }
      }}
    >
      {children}
    </button>
  );
}

const Divider = () => (
  <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 4px', flexShrink: 0 }} />
);

// ── Color picker dropdown ──────────────────────────────
const TEXT_COLORS = [
  '#000000', '#434343', '#666666', '#999999',
  '#ea4335', '#f09300', '#fbbc04', '#34a853',
  '#1a73e8', '#4285f4', '#db2777', '#7c3aed',
  '#ffffff', '#fce8e6', '#fef9e0', '#e6f4ea',
];
const BG_COLORS = [
  '#ffffff', '#f8f9fc', '#f1f3f8', '#e2e6ef',
  '#fce8e6', '#fff4e5', '#fef9e0', '#e6f4ea',
  '#e8f0fe', '#f3e8ff', '#fce7f3', '#d1fae5',
  '#ffedd5', '#fef3c7', '#d1ecf1', '#cfe2ff',
];

function ColorDropdown({ colors, onPick, label, currentColor, icon }: {
  colors: string[];
  onPick: (c: string) => void;
  label: string;
  currentColor?: string;
  icon: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  useOutsideClick(wrapRef, () => setOpen(false));

  return (
    <div ref={wrapRef} style={{ position: 'relative', display: 'flex', flexShrink: 0 }}>
      {/* Main button */}
      <button
        onClick={() => setOpen(o => !o)}
        suppressHydrationWarning
        style={{
          width: 32, height: 28, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 2,
          background: open ? 'var(--primary-light)' : 'transparent',
          border: open ? '1.5px solid #b0cbf7' : '1.5px solid transparent',
          borderRadius: 'var(--radius-sm)', cursor: 'pointer',
          color: 'var(--text-secondary)', padding: '2px 4px',
          transition: 'background 0.1s, border-color 0.1s',
        }}
        title={label}
      >
        {icon}
        <div style={{ width: 14, height: 3, background: currentColor ?? '#ea4335', borderRadius: 1 }} />
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 400,
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-md)',
          padding: 10, animation: 'fadeIn 0.1s ease-out',
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {label}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 18px)', gap: 3 }}>
            {colors.map(c => (
              <button
                key={c}
                onClick={() => { onPick(c); setOpen(false); }}
                suppressHydrationWarning
                title={c}
                style={{
                  width: 18, height: 18, borderRadius: 3,
                  background: c,
                  border: c === currentColor
                    ? '2px solid var(--primary)'
                    : c === '#ffffff' ? '1px solid #ddd' : '1px solid rgba(0,0,0,0.1)',
                  cursor: 'pointer', transition: 'transform 0.1s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.3)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Font size selector ────────────────────────────────
const FONT_SIZES = [8, 9, 10, 11, 12, 13, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72];

// ── Main Toolbar ──────────────────────────────────────
export default function Toolbar({
  onBold, onItalic, onUnderline, onStrikethrough,
  onFontSize, onColor, onBgColor,
  onAlignLeft, onAlignCenter, onAlignRight,
  onExport,
  isBold, isItalic, isUnderline, isStrikethrough,
  fontSize = 13,
  currentTextColor,
  currentBgColor,
}: ToolbarProps) {
  return (
    <div style={{
      height: 'var(--toolbar-h)',
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      gap: 2,
      padding: '0 8px',
      overflowX: 'auto',
      flexShrink: 0,
      userSelect: 'none',
    }}>
      {/* Font family (display only) */}
      <select
        style={{
          height: 26, padding: '0 6px', minWidth: 80,
          border: '1.5px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          fontSize: 12, color: 'var(--text-primary)',
          background: 'var(--surface)', cursor: 'pointer', outline: 'none',
        }}
        defaultValue="Inter"
        suppressHydrationWarning
      >
        {['Inter', 'Arial', 'Georgia', 'Courier New', 'Times New Roman'].map(f => (
          <option key={f} value={f}>{f}</option>
        ))}
      </select>

      {/* Font size */}
      <select
        value={fontSize}
        onChange={e => onFontSize(Number(e.target.value))}
        suppressHydrationWarning
        style={{
          height: 26, padding: '0 4px', width: 52,
          border: '1.5px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          fontSize: 12, color: 'var(--text-primary)',
          background: 'var(--surface)', cursor: 'pointer', outline: 'none', marginLeft: 4,
        }}
      >
        {FONT_SIZES.map(s => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>

      <Divider />

      {/* Bold / Italic / Underline / Strikethrough */}
      <ToolBtn onClick={onBold} active={isBold} title="Bold (Ctrl+B)">
        <svg width="12" height="14" viewBox="0 0 12 14" fill="none">
          <path d="M2 2h5.5a3 3 0 010 6H2V2zM2 8h6a3 3 0 010 6H2V8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </ToolBtn>
      <ToolBtn onClick={onItalic} active={isItalic} title="Italic (Ctrl+I)">
        <svg width="10" height="14" viewBox="0 0 10 14" fill="none">
          <path d="M3 2h6M1 12h6M6 2L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </ToolBtn>
      <ToolBtn onClick={onUnderline} active={isUnderline} title="Underline (Ctrl+U)">
        <svg width="12" height="15" viewBox="0 0 12 15" fill="none">
          <path d="M2 2v5a4 4 0 008 0V2M1 14h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </ToolBtn>
      <ToolBtn onClick={onStrikethrough} active={isStrikethrough} title="Strikethrough">
        <svg width="14" height="12" viewBox="0 0 14 12" fill="none">
          <path d="M1 6h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          <path d="M4 2.5a2.5 2.5 0 015 0v2M9 9.5a2.5 2.5 0 01-5 0v-2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
      </ToolBtn>

      <Divider />

      {/* Text colour */}
      <ColorDropdown
        colors={TEXT_COLORS}
        onPick={onColor}
        label="Text colour"
        currentColor={currentTextColor}
        icon={
          <span style={{ fontSize: 12, fontWeight: 800, lineHeight: 1, color: 'var(--text-secondary)' }}>A</span>
        }
      />

      {/* Background colour */}
      <ColorDropdown
        colors={BG_COLORS}
        onPick={onBgColor}
        label="Fill colour"
        currentColor={currentBgColor}
        icon={
          <svg width="13" height="11" viewBox="0 0 13 11" fill="none">
            <path d="M2 9.5L6.5 2.5l4.5 7H2z" stroke="currentColor" strokeWidth="1.3"/>
          </svg>
        }
      />

      <Divider />

      {/* Alignment */}
      <ToolBtn onClick={onAlignLeft} title="Align left">
        <svg width="13" height="12" viewBox="0 0 13 12" fill="none">
          <path d="M1 2h11M1 6h7M1 10h11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
      </ToolBtn>
      <ToolBtn onClick={onAlignCenter} title="Center">
        <svg width="13" height="12" viewBox="0 0 13 12" fill="none">
          <path d="M1 2h11M3 6h7M1 10h11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
      </ToolBtn>
      <ToolBtn onClick={onAlignRight} title="Align right">
        <svg width="13" height="12" viewBox="0 0 13 12" fill="none">
          <path d="M1 2h11M5 6h7M1 10h11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
      </ToolBtn>

      <Divider />

      {/* Number format */}
      <ToolBtn title="Format as currency ($)">
        <span style={{ fontSize: 12, fontWeight: 700 }}>$</span>
      </ToolBtn>
      <ToolBtn title="Format as percentage (%)">
        <span style={{ fontSize: 12, fontWeight: 700 }}>%</span>
      </ToolBtn>
      <ToolBtn title="Increase decimal places">
        <svg width="14" height="11" viewBox="0 0 14 11" fill="none">
          <path d="M1 9h12M4 6l3-5 3 5M7 1v8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </ToolBtn>

      <div style={{ flex: 1 }} />

      {/* Export */}
      <button
        onClick={onExport}
        style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '5px 10px',
          background: 'var(--surface-hover)',
          border: '1.5px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          fontSize: 12, fontWeight: 500,
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          transition: 'background 0.1s, color 0.1s',
          whiteSpace: 'nowrap', flexShrink: 0,
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'var(--primary-light)';
          e.currentTarget.style.color = 'var(--primary)';
          e.currentTarget.style.borderColor = '#b0cbf7';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'var(--surface-hover)';
          e.currentTarget.style.color = 'var(--text-secondary)';
          e.currentTarget.style.borderColor = 'var(--border)';
        }}
        suppressHydrationWarning
      >
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
          <path d="M6.5 1v8M4 7l2.5 2.5L9 7M1.5 10.5v1a1 1 0 001 1h9a1 1 0 001-1v-1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Export CSV
      </button>
    </div>
  );
}
