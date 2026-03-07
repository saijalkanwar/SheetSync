'use client';

interface ToolbarProps {
  onBold: () => void;
  onItalic: () => void;
  onColor: (color: string) => void;
  onBgColor: (color: string) => void;
  onAlignLeft: () => void;
  onAlignCenter: () => void;
  onAlignRight: () => void;
  onExport: () => void;
  isBold?: boolean;
  isItalic?: boolean;
}

const ToolBtn = ({
  onClick, active, title, children,
}: {
  onClick?: () => void;
  active?: boolean;
  title?: string;
  children: React.ReactNode;
}) => (
  <button
    onClick={onClick}
    data-tooltip={title}
    style={{
      width: 28, height: 28,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: active ? 'var(--primary-light)' : 'transparent',
      border: active ? '1.5px solid #b0cbf7' : '1.5px solid transparent',
      borderRadius: 'var(--radius-sm)',
      color: active ? 'var(--primary)' : 'var(--text-secondary)',
      cursor: 'pointer',
      transition: 'background 0.1s, color 0.1s',
      flexShrink: 0,
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

const Divider = () => (
  <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 4px', flexShrink: 0 }} />
);

const TEXT_COLORS = ['#000000', '#ea4335', '#fbbc04', '#34a853', '#1a73e8', '#db2777', '#7c3aed', '#ffffff'];
const BG_COLORS   = ['#ffffff', '#fce8e6', '#fef9e0', '#e6f4ea', '#e8f0fe', '#fce7f3', '#f3e8ff', '#f0f9ff'];

function ColorPicker({ colors, onPick, label }: { colors: string[]; onPick: (c: string) => void; label: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 8 }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</span>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8,18px)', gap: 3 }}>
        {colors.map(c => (
          <button
            key={c}
            onClick={() => onPick(c)}
            style={{
              width: 18, height: 18, borderRadius: 3,
              background: c,
              border: c === '#ffffff' ? '1px solid #ddd' : '1px solid transparent',
              cursor: 'pointer',
              transition: 'transform 0.1s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.25)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
          />
        ))}
      </div>
    </div>
  );
}

export default function Toolbar({
  onBold, onItalic, onColor, onBgColor,
  onAlignLeft, onAlignCenter, onAlignRight,
  onExport, isBold, isItalic,
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
    }}>
      {/* Undo / Redo */}
      <ToolBtn title="Undo (Ctrl+Z)">
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
          <path d="M4.5 2.5L2 5l2.5 2.5M2 5h7a4 4 0 010 8H4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </ToolBtn>
      <ToolBtn title="Redo (Ctrl+Y)">
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
          <path d="M10.5 2.5L13 5l-2.5 2.5M13 5H6a4 4 0 000 8h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </ToolBtn>

      <Divider />

      {/* Font size */}
      <select
        style={{
          height: 26, padding: '0 6px',
          border: '1.5px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          fontSize: 12, color: 'var(--text-primary)',
          background: 'var(--surface)',
          cursor: 'pointer', outline: 'none',
        }}
        defaultValue="13"
      >
        {[10, 11, 12, 13, 14, 16, 18, 20, 24, 28, 32].map(s => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>

      <Divider />

      {/* Bold / Italic */}
      <ToolBtn onClick={onBold} active={isBold} title="Bold (Ctrl+B)">
        <svg width="12" height="14" viewBox="0 0 12 14" fill="none">
          <path d="M2 2h5.5a3 3 0 010 6H2V2zM2 8h6a3 3 0 010 6H2V8z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </ToolBtn>
      <ToolBtn onClick={onItalic} active={isItalic} title="Italic (Ctrl+I)">
        <svg width="10" height="14" viewBox="0 0 10 14" fill="none">
          <path d="M3 2h6M1 12h6M6 2L4 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </ToolBtn>
      <ToolBtn title="Underline (Ctrl+U)">
        <svg width="12" height="15" viewBox="0 0 12 15" fill="none">
          <path d="M2 2v5a4 4 0 008 0V2M1 14h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
      </ToolBtn>
      <ToolBtn title="Strikethrough">
        <svg width="14" height="12" viewBox="0 0 14 12" fill="none">
          <path d="M1 6h12M4 3a3 3 0 016 0v6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
      </ToolBtn>

      <Divider />

      {/* Text color */}
      <div style={{ position: 'relative' }} className="color-btn-wrap">
        <ToolBtn title="Text color">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', lineHeight: 1 }}>A</span>
            <div style={{ width: 12, height: 3, background: '#ea4335', borderRadius: 1 }} />
          </div>
        </ToolBtn>
        <div className="color-popup" style={{
          position: 'absolute', top: '100%', left: 0, zIndex: 300,
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-md)',
          display: 'none',
        }}>
          <ColorPicker colors={TEXT_COLORS} onPick={onColor} label="Text" />
        </div>
      </div>

      {/* Background color */}
      <div style={{ position: 'relative' }} className="color-btn-wrap">
        <ToolBtn title="Fill color">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
            <svg width="13" height="12" viewBox="0 0 13 12" fill="none">
              <path d="M2 10L6.5 3l4.5 7H2z" stroke="currentColor" strokeWidth="1.3"/>
            </svg>
            <div style={{ width: 12, height: 3, background: '#fbbc04', borderRadius: 1 }} />
          </div>
        </ToolBtn>
        <div className="color-popup" style={{
          position: 'absolute', top: '100%', left: 0, zIndex: 300,
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-md)',
          display: 'none',
        }}>
          <ColorPicker colors={BG_COLORS} onPick={onBgColor} label="Fill" />
        </div>
      </div>

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

      {/* Wrap text */}
      <ToolBtn title="Wrap text">
        <svg width="14" height="12" viewBox="0 0 14 12" fill="none">
          <path d="M1 2h12M1 6h8a2 2 0 010 4H7M1 10h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          <path d="M9 8l2 2-2 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </ToolBtn>

      {/* Merge cells */}
      <ToolBtn title="Merge cells">
        <svg width="14" height="12" viewBox="0 0 14 12" fill="none">
          <rect x="1" y="1" width="5" height="10" rx="1" stroke="currentColor" strokeWidth="1.3"/>
          <rect x="8" y="1" width="5" height="10" rx="1" stroke="currentColor" strokeWidth="1.3"/>
          <path d="M6 6h2M4 4l-2 2 2 2M10 4l2 2-2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
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
          whiteSpace: 'nowrap',
          flexShrink: 0,
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
      >
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
          <path d="M6.5 1v8M4 7l2.5 2.5L9 7M1.5 10.5v1a1 1 0 001 1h9a1 1 0 001-1v-1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Export
      </button>
    </div>
  );
}
