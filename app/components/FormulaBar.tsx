'use client';

interface FormulaBarProps {
  cellAddress: string;      // e.g., "A1"
  value: string;            // raw value (could be formula)
  onValueChange: (v: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function FormulaBar({ cellAddress, value, onValueChange, onConfirm, onCancel }: FormulaBarProps) {
  const isFormula = value.startsWith('=');

  return (
    <div style={{
      height: 'var(--formula-bar-h)',
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      gap: 0,
      flexShrink: 0,
    }}>
      {/* Cell address box */}
      <div style={{
        minWidth: 72,
        height: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRight: '1px solid var(--border)',
        padding: '0 8px',
      }}>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 12, fontWeight: 600,
          color: 'var(--text-primary)',
          letterSpacing: 0.5,
        }}>
          {cellAddress || 'A1'}
        </span>
      </div>

      {/* Confirm / Cancel (only while editing) */}
      <div style={{
        display: 'flex', alignItems: 'center',
        borderRight: '1px solid var(--border)',
        height: '100%',
        padding: '0 4px',
        gap: 2,
      }}>
        <button
          onClick={onCancel}
          title="Cancel (Esc)"
          style={{
            width: 22, height: 22, border: 'none', background: 'none',
            borderRadius: 3, cursor: 'pointer', color: 'var(--danger)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.1s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#fce8e6'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none'; }}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M1.5 1.5l7 7M8.5 1.5l-7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        </button>
        <button
          onClick={onConfirm}
          title="Confirm (Enter)"
          style={{
            width: 22, height: 22, border: 'none', background: 'none',
            borderRadius: 3, cursor: 'pointer', color: 'var(--success)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.1s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#e6f4ea'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none'; }}
        >
          <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
            <path d="M1 4.5L4 7.5l6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Formula indicator */}
      <div style={{
        borderRight: '1px solid var(--border)',
        height: '100%', padding: '0 8px',
        display: 'flex', alignItems: 'center',
      }}>
        <span style={{
          fontSize: 12, fontWeight: 700, fontStyle: 'italic',
          color: isFormula ? 'var(--primary)' : 'var(--text-muted)',
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          ƒx
        </span>
      </div>

      {/* Value / formula input */}
      <input
        type="text"
        value={value}
        onChange={e => onValueChange(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') { e.preventDefault(); onConfirm(); }
          if (e.key === 'Escape') { e.preventDefault(); onCancel(); }
        }}
        placeholder="Enter value or formula (e.g. =SUM(A1:B3))"
        style={{
          flex: 1, height: '100%',
          border: 'none', outline: 'none',
          padding: '0 10px',
          fontSize: 13,
          fontFamily: isFormula ? "'JetBrains Mono', monospace" : 'inherit',
          color: isFormula ? 'var(--primary)' : 'var(--text-primary)',
          background: 'transparent',
        }}
      />
    </div>
  );
}
