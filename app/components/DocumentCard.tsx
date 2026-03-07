'use client';
import Link from 'next/link';

export interface DocMeta {
  id: string;
  title: string;
  lastModified: Date;
  ownerName: string;
  ownerColor: string;
  ownerInitial: string;
  ownerId?: string;
}

const RELATIVE_TIME = (date: Date): string => {
  const diff = Date.now() - date.getTime();
  const min = Math.floor(diff / 60000);
  const hr = Math.floor(diff / 3600000);
  const day = Math.floor(diff / 86400000);
  if (min < 1) return 'Just now';
  if (min < 60) return `${min} min ago`;
  if (hr < 24) return `${hr} hr ago`;
  if (day < 7) return `${day} day${day > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export default function DocumentCard({ doc, onDelete }: { doc: DocMeta; onDelete?: (id: string) => void }) {
  return (
    <Link href={`/doc/${doc.id}`} style={{ textDecoration: 'none' }}>
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          cursor: 'pointer',
          transition: 'box-shadow 0.18s, transform 0.18s, border-color 0.18s',
          display: 'flex',
          flexDirection: 'column',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-md)';
          (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
          (e.currentTarget as HTMLElement).style.borderColor = '#b0bef3';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.boxShadow = 'none';
          (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
          (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
        }}
      >
        {/* Spreadsheet preview thumbnail */}
        <div style={{
          height: 140,
          background: '#fff',
          position: 'relative',
          overflow: 'hidden',
          borderBottom: '1px solid var(--border-light)',
        }}>
          {/* Mimic a tiny spreadsheet grid */}
          <div style={{
            position: 'absolute', inset: 0,
            display: 'grid',
            gridTemplateColumns: '40px repeat(5, 1fr)',
            gridTemplateRows: '22px repeat(5, 1fr)',
          }}>
            {Array.from({ length: 36 }).map((_, i) => (
              <div
                key={i}
                style={{
                  border: '0.5px solid #e8eaf2',
                  background: i < 6 || i % 6 === 0
                    ? '#f8f9fc'
                    : i === 1 ? '#e8f0fe'
                    : '#fff',
                  display: 'flex', alignItems: 'center',
                  justifyContent: i < 6 || i % 6 === 0 ? 'center' : 'flex-start',
                  padding: '0 4px',
                  fontSize: 9,
                  color: '#9aa0ab',
                  fontWeight: i < 6 || i % 6 === 0 ? 600 : 400,
                }}
              >
                {i < 6 && i > 0 ? String.fromCharCode(64 + i) : ''}
                {i % 6 === 0 && i > 0 ? Math.floor(i / 6) : ''}
              </div>
            ))}
          </div>
          {/* Overlay gradient */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 40,
            background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.9))',
          }} />
          {/* Options button */}
          {onDelete && (
            <button
              onClick={e => { e.preventDefault(); onDelete(doc.id); }}
              style={{
                position: 'absolute', top: 8, right: 8,
                width: 28, height: 28,
                background: 'rgba(255,255,255,0.9)',
                border: '1px solid var(--border)',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: 0,
                transition: 'opacity 0.15s',
              }}
              className="doc-card-opt"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="2.5" r="1" fill="#5f6368"/>
                <circle cx="7" cy="7" r="1" fill="#5f6368"/>
                <circle cx="7" cy="11.5" r="1" fill="#5f6368"/>
              </svg>
            </button>
          )}
        </div>

        {/* Card info */}
        <div style={{ padding: '12px 14px 14px' }}>
          <div style={{
            fontWeight: 600, fontSize: 14,
            color: 'var(--text-primary)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            marginBottom: 6,
          }}>
            {doc.title}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 20, height: 20, borderRadius: '50%',
              background: doc.ownerColor,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 700, color: '#fff',
              flexShrink: 0,
            }}>
              {doc.ownerInitial}
            </div>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              {RELATIVE_TIME(doc.lastModified)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
