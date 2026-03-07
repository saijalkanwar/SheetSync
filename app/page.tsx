'use client';
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from './components/Navbar';
import DocumentCard, { type DocMeta } from './components/DocumentCard';

export default function DashboardPage() {
  // Seed data inside lazy useState so Date.now() only runs on the client,
  // avoiding SSR/hydration mismatch. Will be replaced by Firestore in Phase 2.
  const [docs, setDocs] = useState<DocMeta[]>(() => {
    const now = Date.now();
    return [
      { id: 'doc-1', title: 'Q1 2025 Budget',       lastModified: new Date(now - 5 * 60000),    ownerName: 'Saijal Kanwar', ownerColor: '#7c3aed', ownerInitial: 'S' },
      { id: 'doc-2', title: 'Marketing Campaign',    lastModified: new Date(now - 2 * 3600000), ownerName: 'Alex Johnson',  ownerColor: '#1a73e8', ownerInitial: 'A' },
      { id: 'doc-3', title: 'Sales Tracker',         lastModified: new Date(now - 86400000),    ownerName: 'Maria Lopez',   ownerColor: '#059669', ownerInitial: 'M' },
      { id: 'doc-4', title: 'Product Roadmap 2025',  lastModified: new Date(now - 3 * 86400000),ownerName: 'Saijal Kanwar', ownerColor: '#7c3aed', ownerInitial: 'S' },
      { id: 'doc-5', title: 'Inventory Sheet',        lastModified: new Date(now - 7 * 86400000),ownerName: 'Jordan Kim',   ownerColor: '#d97706', ownerInitial: 'J' },
    ];
  });
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const filteredDocs = docs.filter(d =>
    d.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const createNewDoc = useCallback(() => {
    const id = `doc-${Date.now()}`;
    const newDoc: DocMeta = {
      id,
      title: 'Untitled spreadsheet',
      lastModified: new Date(),
      ownerName: 'You',
      ownerColor: '#7c3aed',
      ownerInitial: 'Y',
    };
    setDocs(prev => [newDoc, ...prev]);
    router.push(`/doc/${id}`);
  }, [router]);

  const deleteDoc = useCallback((id: string) => {
    setDocs(prev => prev.filter(d => d.id !== id));
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <Navbar />

      {/* Hero strip */}
      <div style={{
        background: 'linear-gradient(135deg, #1a73e8 0%, #0d47a1 100%)',
        padding: '32px 0 64px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background decorative dots */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.08,
          backgroundImage: 'radial-gradient(circle, white 1.5px, transparent 1.5px)',
          backgroundSize: '28px 28px',
        }} />
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', position: 'relative' }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#fff', marginBottom: 8 }}>
            Your Spreadsheets
          </h1>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', marginBottom: 28 }}>
            Create, edit, and collaborate in real-time.
          </p>

          {/* New spreadsheet CTA */}
          <button
            onClick={createNewDoc}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 20px',
              background: '#fff',
              color: 'var(--primary)',
              border: 'none',
              borderRadius: 'var(--radius-full)',
              fontSize: 14, fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'scale(1.03)';
              e.currentTarget.style.boxShadow = '0 6px 18px rgba(0,0,0,0.2)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
            </svg>
            New Spreadsheet
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: 1100, margin: '-32px auto 0', padding: '0 24px 48px', position: 'relative', zIndex: 2 }}>
        {/* Search + controls */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          marginBottom: 20,
          background: 'var(--surface)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 16px',
          boxShadow: 'var(--shadow-sm)',
          border: '1px solid var(--border)',
        }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
            <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search spreadsheets…"
            style={{
              flex: 1, border: 'none', outline: 'none',
              fontSize: 14, color: 'var(--text-primary)', background: 'none',
              fontFamily: 'inherit',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
            </button>
          )}
          <span style={{ fontSize: 12, color: 'var(--text-muted)', borderLeft: '1px solid var(--border-light)', paddingLeft: 12 }}>
            {filteredDocs.length} doc{filteredDocs.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Grid */}
        {filteredDocs.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '64px 24px',
            background: 'var(--surface)', borderRadius: 'var(--radius-xl)',
            border: '1px dashed var(--border)',
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: 14,
              background: 'var(--primary-light)', margin: '0 auto 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14M5 12h14" stroke="#1a73e8" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
              {searchQuery ? 'No results found' : 'No spreadsheets yet'}
            </h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20 }}>
              {searchQuery ? 'Try a different search term.' : 'Create your first spreadsheet to get started.'}
            </p>
            {!searchQuery && (
              <button
                onClick={createNewDoc}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '9px 18px',
                  background: 'var(--primary)', color: '#fff',
                  border: 'none', borderRadius: 'var(--radius-full)',
                  fontSize: 14, fontWeight: 600, cursor: 'pointer',
                }}
              >
                Create Spreadsheet
              </button>
            )}
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 16,
          }}>
            {/* New doc card */}
            <button
              onClick={createNewDoc}
              style={{
                background: 'var(--surface)',
                border: '1.5px dashed var(--border)',
                borderRadius: 'var(--radius-lg)',
                cursor: 'pointer',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: 10, padding: '32px 16px',
                minHeight: 196,
                transition: 'border-color 0.15s, background 0.15s',
                color: 'var(--text-secondary)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--primary)';
                e.currentTarget.style.background = 'var(--primary-light)';
                e.currentTarget.style.color = 'var(--primary)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.background = 'var(--surface)';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'currentColor', opacity: 0.12,
                position: 'relative',
              }}>
                <svg width="36" height="36" viewBox="0 0 36 36" fill="none" style={{ position: 'absolute', top: 0, left: 0, opacity: 1 / 0.12 }}>
                  <path d="M18 10v16M10 18h16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
              </div>
              <span style={{ fontSize: 13, fontWeight: 600 }}>New Spreadsheet</span>
            </button>

            {filteredDocs.map(doc => (
              <DocumentCard key={doc.id} doc={doc} onDelete={deleteDoc} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
