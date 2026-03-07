'use client';

export interface Collaborator {
  id: string;
  name: string;
  color: string;
  initial: string;
  cell?: string; // e.g., "B3" – where they are currently
}

export default function PresenceBar({ collaborators }: { collaborators: Collaborator[] }) {
  if (collaborators.length === 0) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <span style={{ fontSize: 11, color: 'var(--text-muted)', marginRight: 4, whiteSpace: 'nowrap' }}>
        {collaborators.length} online
      </span>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {collaborators.slice(0, 6).map((c, i) => (
          <div
            key={c.id}
            data-tooltip={`${c.name}${c.cell ? ` · ${c.cell}` : ''}`}
            style={{
              width: 28, height: 28,
              borderRadius: '50%',
              background: c.color,
              border: '2px solid #fff',
              marginLeft: i > 0 ? -8 : 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, color: '#fff',
              cursor: 'default',
              transition: 'transform 0.15s, z-index 0s',
              position: 'relative',
              zIndex: collaborators.length - i,
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.18)'; (e.currentTarget as HTMLElement).style.zIndex = '50'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; (e.currentTarget as HTMLElement).style.zIndex = String(collaborators.length - i); }}
          >
            {c.initial}
          </div>
        ))}
        {collaborators.length > 6 && (
          <div style={{
            width: 28, height: 28,
            borderRadius: '50%',
            background: '#e2e6ef',
            border: '2px solid #fff',
            marginLeft: -8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)',
          }}>
            +{collaborators.length - 6}
          </div>
        )}
      </div>
    </div>
  );
}
