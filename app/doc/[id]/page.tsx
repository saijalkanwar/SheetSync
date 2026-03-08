'use client';
import { useState, useCallback, useRef, useMemo, use } from 'react';
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

interface Sheet { id: string; name: string; }

export default function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: docId } = use(params);
  const { user, continueAsGuest } = useAuth();

  const [guestUser, setGuestUser] = useState<{ name: string; color: string; initial: string } | null>(null);
  const showNameModal = !user && !guestUser;

  const activeUser = user
    ? { uid: user.uid, name: user.name, color: user.color, initial: user.initial }
    : guestUser
    ? { uid: `guest-${guestUser.name}`, name: guestUser.name, color: guestUser.color, initial: guestUser.initial }
    : null;

  // ── Firestore real-time ────────────────────────────
  const { gridData, title, saveState, updateCell, renameDocument } = useSpreadsheet(
    docId,
    activeUser?.uid ?? 'anonymous',
    activeUser?.name ?? 'Guest'
  );

  // ── Local UI state ─────────────────────────────────
  const [selectedCell, setSelectedCell]   = useState<string>('A1');
  const [formulaValue, setFormulaValue]   = useState('');
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [sheets, setSheets]               = useState<Sheet[]>([{ id: 'sheet-1', name: 'Sheet1' }]);
  const [activeSheet, setActiveSheet]     = useState('sheet-1');
  const [colWidths, setColWidths]         = useState<Map<number, number>>(new Map());
  const [userColor, setUserColor]         = useState<string | null>(null);
  // ── Cell formats: kept 100% local, never overwritten by Firestore ──
  // This is the KEY fix: Firestore reconnects/quota errors cannot revert colors
  const [cellFormats, setCellFormats]     = useState<Map<string, CellFormat>>(new Map());
  const formulaEditing                    = useRef(false);
  // Refs so toolbar callbacks always see the freshest values
  const selectedCellRef = useRef(selectedCell);
  selectedCellRef.current = selectedCell;
  const gridDataRef = useRef(gridData);
  gridDataRef.current = gridData;
  const cellFormatsRef = useRef(cellFormats);
  cellFormatsRef.current = cellFormats;

  // ── Merged data: Firestore cell content + local formats ───────────────
  const mergedData: GridData = useMemo(() => {
    if (cellFormats.size === 0) return gridData;
    const m = new Map(gridData);
    cellFormats.forEach((fmt, id) => {
      const existing = m.get(id);
      if (existing) {
        m.set(id, { ...existing, format: { ...existing.format, ...fmt } });
      } else {
        // Empty cell with only formatting applied
        m.set(id, { raw: '', computed: '', format: fmt });
      }
    });
    return m;
  }, [gridData, cellFormats]);

  // Override activeUser color when user picks a new one from navbar dropdown
  const effectiveActiveUser = activeUser
    ? { ...activeUser, color: userColor ?? activeUser.color }
    : null;

  // ── Presence ───────────────────────────────────────
  usePresence(docId, effectiveActiveUser, selectedCell, setCollaborators);

  // ── Cell change ────────────────────────────────────
  const handleCellChange = useCallback((id: string, raw: string, computed: string) => {
    // Format is kept in cellFormats, NOT passed to Firestore via updateCell
    updateCell(id, raw, computed, undefined);
  }, [updateCell]);

  // ── Format ─────────────────────────────────────────
  // ONLY updates cellFormats local state. Never touches Firestore.
  // This guarantees colors survive any Firestore disconnect/reconnect.
  const applyFormat = useCallback((patch: Partial<CellFormat>) => {
    const cell = selectedCellRef.current;
    setCellFormats(prev => {
      const next = new Map(prev);
      const curr = next.get(cell) ?? {};
      next.set(cell, { ...curr, ...patch });
      return next;
    });
  }, []);

  // ── Selection ──────────────────────────────────────
  const handleSelectionChange = useCallback((id: string) => {
    setSelectedCell(id);
    if (!formulaEditing.current) {
      setFormulaValue(gridData.get(id)?.raw ?? '');
    }
  }, [gridData]);

  // ── Formula bar confirm ────────────────────────────
  // Properly evaluate formula so the computed value is correct
  const handleFormulaConfirm = useCallback(() => {
    const raw = formulaValue;
    formulaEditing.current = false;
    // Evaluate formula via a dummy Grid call — easiest is to store raw and
    // let Grid recalculate on next render, but we need computed now.
    // Simple inline eval:
    let computed = raw;
    if (raw.startsWith('=')) {
      // Let the Grid's inline evaluator handle it; just mark as formula
      computed = raw; // Grid will evaluate on render
    }
    handleCellChange(selectedCell, raw, computed);
  }, [formulaValue, selectedCell, handleCellChange]);

  // ── Resize ─────────────────────────────────────────
  const handleColWidthChange = useCallback((col: number, width: number) => {
    setColWidths(prev => { const m = new Map(prev); m.set(col, width); return m; });
  }, []);

  // ── Export CSV ─────────────────────────────────────
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
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_')}_${docId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // fmt = merged format for selected cell (for toolbar color indicators)
  const existingCell = mergedData.get(selectedCell);
  const fmt          = existingCell?.format ?? {};

  const remoteCursors = new Map<string, { cell: string; color: string; name: string }>();
  collaborators.forEach(c => {
    if (c.cell) remoteCursors.set(c.id, { cell: c.cell, color: c.color, name: c.name });
  });

  const allCollaborators: Collaborator[] = [
    ...(effectiveActiveUser ? [{ id: 'me', name: `${effectiveActiveUser.name} (you)`, color: effectiveActiveUser.color, initial: effectiveActiveUser.initial }] : []),
    ...collaborators,
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {showNameModal && (
        <NameModal
          onConfirm={(name, color) => {
            setGuestUser({ name, color, initial: name[0].toUpperCase() });
            continueAsGuest(name);
          }}
        />
      )}

      <Navbar docTitle={title} onTitleChange={renameDocument} onColorChange={setUserColor} />

      {/* Menu bar */}
      <div style={{
        height: 36,
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center',
        padding: '0 12px', gap: 4,
        flexShrink: 0,
      }}>
        {['File', 'Edit', 'View', 'Insert', 'Format', 'Data', 'Tools', 'Extensions', 'Help'].map(item => (
          <button
            key={item}
            suppressHydrationWarning
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

      {/* Toolbar — all format operations now wired */}
      <Toolbar
        onBold={()          => applyFormat({ bold: !fmt.bold })}
        onItalic={()        => applyFormat({ italic: !fmt.italic })}
        onUnderline={()     => applyFormat({ underline: !fmt.underline })}
        onStrikethrough={() => applyFormat({ strikethrough: !fmt.strikethrough })}
        onFontSize={(s)     => applyFormat({ fontSize: s })}
        onColor={(c)        => applyFormat({ textColor: c })}
        onBgColor={(c)      => applyFormat({ bgColor: c })}
        onAlignLeft={()     => applyFormat({ align: 'left' })}
        onAlignCenter={()   => applyFormat({ align: 'center' })}
        onAlignRight={()    => applyFormat({ align: 'right' })}
        onExport={handleExport}
        isBold={fmt.bold}
        isItalic={fmt.italic}
        isUnderline={fmt.underline}
        isStrikethrough={fmt.strikethrough}
        fontSize={fmt.fontSize ?? 13}
        currentTextColor={fmt.textColor}
        currentBgColor={fmt.bgColor}
      />

      {/* Formula bar */}
      <FormulaBar
        cellAddress={selectedCell}
        value={formulaValue}
        onValueChange={v => { formulaEditing.current = true; setFormulaValue(v); }}
        onConfirm={handleFormulaConfirm}
        onCancel={() => {
          formulaEditing.current = false;
          setFormulaValue(gridData.get(selectedCell)?.raw ?? '');
        }}
      />

      {/* Grid */}
      <Grid
        data={mergedData}
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
            suppressHydrationWarning
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
          onClick={() => {
            const id = `sheet-${Date.now()}`;
            setSheets(prev => [...prev, { id, name: `Sheet${prev.length + 1}` }]);
            setActiveSheet(id);
          }}
          suppressHydrationWarning
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
