'use client';
import { useState, useCallback, useRef, use } from 'react';
import Navbar from '../../components/Navbar';
import Toolbar from '../../components/Toolbar';
import FormulaBar from '../../components/FormulaBar';
import Grid, { type GridData, type CellFormat } from '../../components/Grid';
import PresenceBar, { type Collaborator } from '../../components/PresenceBar';
import SaveIndicator from '../../components/SaveIndicator';
import NameModal from '../../components/NameModal';
import { useAuth } from '@/lib/auth-context';
import { useSpreadsheet } from '@/lib/useSpreadsheet';
import { usePresence } from '@/lib/usePresence';

// ── Sheet tab ─────────────────────────────────────────────
interface Sheet { id: string; name: string; }

// ── Editor ────────────────────────────────────────────────
export default function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: docId } = use(params);
  const { user, continueAsGuest } = useAuth();

  // Guest-name override (only used when not already authenticated)
  const [guestUser, setGuestUser] = useState<{ name: string; color: string; initial: string } | null>(null);
  const showNameModal = !user && !guestUser;

  const activeUser = user
    ? { uid: user.uid, name: user.name, color: user.color, initial: user.initial }
    : guestUser
    ? { uid: `guest-${guestUser.name}`, name: guestUser.name, color: guestUser.color, initial: guestUser.initial }
    : null;

  // ── Firestore real-time sync ───────────────────────────
  const { gridData, title, saveState, updateCell, renameDocument, setGridData } = useSpreadsheet(
    docId,
    activeUser?.uid ?? 'anonymous',
    activeUser?.name ?? 'Guest'
  );

  // ── Local UI state ─────────────────────────────────────
  const [selectedCell, setSelectedCell]  = useState<string>('A1');
  const [formulaValue, setFormulaValue]  = useState('');
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [sheets, setSheets]              = useState<Sheet[]>([{ id: 'sheet-1', name: 'Sheet1' }]);
  const [activeSheet, setActiveSheet]    = useState('sheet-1');
  const [colWidths, setColWidths]        = useState<Map<number, number>>(new Map());

  // Local formula editing tracker (prevents Firestore overwrites mid-edit)
  const formulaEditing = useRef(false);

  // ── Presence ───────────────────────────────────────────
  usePresence(docId, activeUser, selectedCell, setCollaborators);

  // ── Cell change ────────────────────────────────────────
  const handleCellChange = useCallback((cellId: string, raw: string, computed: string) => {
    const existingFormat = gridData.get(cellId)?.format;
    updateCell(cellId, raw, computed, existingFormat);
  }, [gridData, updateCell]);

  // ── Format operations ──────────────────────────────────
  const applyFormat = useCallback((patch: Partial<CellFormat>) => {
    const existing = gridData.get(selectedCell) ?? { raw: '', computed: '' };
    const newFormat = { ...existing.format, ...patch };
    updateCell(selectedCell, existing.raw, existing.computed, newFormat);
  }, [selectedCell, gridData, updateCell]);

  const handleSelectionChange = useCallback((cellId: string) => {
    setSelectedCell(cellId);
    if (!formulaEditing.current) {
      const cell = gridData.get(cellId);
      setFormulaValue(cell?.raw ?? '');
    }
  }, [gridData]);

  const handleFormulaConfirm = useCallback(() => {
    const raw = formulaValue;
    formulaEditing.current = false;
    handleCellChange(selectedCell, raw, raw.startsWith('=') ? raw : raw);
  }, [formulaValue, selectedCell, handleCellChange]);

  // ── Sheet tabs ─────────────────────────────────────────
  const addSheet = () => {
    const id = `sheet-${Date.now()}`;
    const n  = sheets.length + 1;
    setSheets(prev => [...prev, { id, name: `Sheet${n}` }]);
    setActiveSheet(id);
  };

  const handleColWidthChange = useCallback((col: number, width: number) => {
    setColWidths(prev => { const m = new Map(prev); m.set(col, width); return m; });
  }, []);

  // ── Export ─────────────────────────────────────────────
  const handleExport = () => {
    let csv = '';
    for (let r = 0; r < 100; r++) {
      const row: string[] = [];
      for (let c = 0; c < 26; c++) {
        const id   = `${String.fromCharCode(65 + c)}${r + 1}`;
        const cell = gridData.get(id);
        const v    = cell?.computed ?? '';
        row.push(v.includes(',') ? `"${v}"` : v);
      }
      if (row.some(v => v !== '')) csv += row.join(',') + '\n';
    }
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `${title.replace(/\s+/g, '_')}_${docId}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const existingCell = gridData.get(selectedCell);

  // Build remote cursors map for the Grid
  const remoteCursors = new Map<string, { cell: string; color: string; name: string }>();
  collaborators.forEach(c => {
    if (c.cell) remoteCursors.set(c.id, { cell: c.cell, color: c.color, name: c.name });
  });

  // All collaborators include self
  const allCollaborators: Collaborator[] = [
    ...(activeUser ? [{ id: 'me', name: `${activeUser.name} (you)`, color: activeUser.color, initial: activeUser.initial }] : []),
    ...collaborators,
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* Name modal — shown only when no authenticated user and no guest name yet */}
      {showNameModal && (
        <NameModal
          onConfirm={(name, color) => {
            setGuestUser({ name, color, initial: name[0].toUpperCase() });
            continueAsGuest(name);
          }}
        />
      )}

      {/* Top bar — title is editable and persists to Firestore */}
      <Navbar
        docTitle={title}
        onTitleChange={renameDocument}
      />

      {/* Doc action bar */}
      <div style={{
        height: 36,
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center',
        padding: '0 12px', gap: 8,
        flexShrink: 0,
      }}>
        {['File', 'Edit', 'View', 'Insert', 'Format', 'Data', 'Tools', 'Extensions', 'Help'].map(item => (
          <button
            key={item}
            style={{
              padding: '4px 8px', background: 'none', border: 'none',
              borderRadius: 'var(--radius-sm)',
              fontSize: 13, color: 'var(--text-secondary)',
              cursor: 'pointer', transition: 'background 0.1s, color 0.1s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            {item}
          </button>
        ))}

        <div style={{ flex: 1 }} />
        <PresenceBar collaborators={allCollaborators} />
        <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 6px' }} />
        <SaveIndicator state={saveState} />
      </div>

      {/* Toolbar */}
      <Toolbar
        onBold={()    => applyFormat({ bold:      !existingCell?.format?.bold })}
        onItalic={()  => applyFormat({ italic:    !existingCell?.format?.italic })}
        onColor={(c)  => applyFormat({ textColor: c })}
        onBgColor={(c)=> applyFormat({ bgColor:   c })}
        onAlignLeft={()   => applyFormat({ align: 'left' })}
        onAlignCenter={() => applyFormat({ align: 'center' })}
        onAlignRight={()  => applyFormat({ align: 'right' })}
        onExport={handleExport}
        isBold={existingCell?.format?.bold}
        isItalic={existingCell?.format?.italic}
      />

      {/* Formula bar */}
      <FormulaBar
        cellAddress={selectedCell}
        value={formulaValue}
        onValueChange={v => { formulaEditing.current = true; setFormulaValue(v); }}
        onConfirm={handleFormulaConfirm}
        onCancel={() => { formulaEditing.current = false; setFormulaValue(gridData.get(selectedCell)?.raw ?? ''); }}
      />

      {/* Grid */}
      <Grid
        data={gridData}
        onCellChange={handleCellChange}
        onSelectionChange={handleSelectionChange}
        colWidths={colWidths}
        onColWidthChange={handleColWidthChange}
        remoteCursors={remoteCursors}
      />

      {/* Sheet tabs */}
      <div style={{
        height: 'var(--sheet-tab-h)',
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        display: 'flex', alignItems: 'stretch',
        padding: '0 8px', gap: 2,
        flexShrink: 0, overflowX: 'auto',
      }}>
        {sheets.map(sheet => (
          <button
            key={sheet.id}
            onClick={() => setActiveSheet(sheet.id)}
            style={{
              padding: '0 16px',
              background: activeSheet === sheet.id ? 'var(--primary-light)' : 'none',
              border: 'none',
              borderBottom: activeSheet === sheet.id ? '2px solid var(--primary)' : '2px solid transparent',
              fontSize: 13, fontWeight: activeSheet === sheet.id ? 600 : 400,
              color: activeSheet === sheet.id ? 'var(--primary)' : 'var(--text-secondary)',
              cursor: 'pointer', borderRadius: '4px 4px 0 0',
              transition: 'all 0.1s', whiteSpace: 'nowrap', flexShrink: 0,
            }}
          >
            {sheet.name}
          </button>
        ))}
        <button
          onClick={addSheet}
          title="Add sheet"
          style={{
            padding: '0 10px', background: 'none', border: 'none',
            color: 'var(--text-muted)', cursor: 'pointer',
            borderRadius: '4px 4px 0 0', fontSize: 18, lineHeight: 1,
            transition: 'background 0.1s, color 0.1s',
            display: 'flex', alignItems: 'center', flexShrink: 0,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)'; }}
        >
          +
        </button>
      </div>
    </div>
  );
}
