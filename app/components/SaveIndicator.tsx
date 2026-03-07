'use client';

export type SaveState = 'saved' | 'saving' | 'unsaved' | 'error';

export default function SaveIndicator({ state }: { state: SaveState }) {
  const config: Record<SaveState, { label: string; color: string; bg: string; dotColor: string }> = {
    saved:   { label: 'All changes saved', color: '#1e7e34', bg: '#e6f4ea', dotColor: '#34a853' },
    saving:  { label: 'Saving…',           color: '#1557b0', bg: '#e8f0fe', dotColor: '#1a73e8' },
    unsaved: { label: 'Unsaved changes',   color: '#7d5e00', bg: '#fef9e0', dotColor: '#fbbc04' },
    error:   { label: 'Save failed',       color: '#b93327', bg: '#fce8e6', dotColor: '#ea4335' },
  };

  const { label, color, bg, dotColor } = config[state];

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '4px 10px',
      background: bg,
      borderRadius: 'var(--radius-full)',
      fontSize: 12, fontWeight: 500,
      color,
      transition: 'all 0.3s ease',
      userSelect: 'none',
    }}>
      <span
        style={{
          width: 7, height: 7, borderRadius: '50%',
          background: dotColor,
          display: 'inline-block',
          flexShrink: 0,
        }}
        className={state === 'saving' ? 'saving-pulse' : undefined}
      />
      {label}
    </div>
  );
}
