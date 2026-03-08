'use client';
import { useState, useCallback, useRef } from 'react';

// ── Types ────────────────────────────────────────────────
export interface CellFormat {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  fontSize?: number;
  textColor?: string;
  bgColor?: string;
  align?: 'left' | 'center' | 'right';
}

export interface CellData {
  raw: string;
  computed: string;
  format?: CellFormat;
}

export type GridData = Map<string, CellData>;

interface GridProps {
  data: GridData;
  onCellChange: (cellId: string, raw: string, computed: string) => void;
  onSelectionChange?: (cellId: string) => void;
  colWidths?: Map<number, number>;
  onColWidthChange?: (col: number, width: number) => void;
  remoteCursors?: Map<string, { cell: string; color: string; name: string }>;
}

// ── Constants ─────────────────────────────────────────────
const NUM_ROWS = 100;
const NUM_COLS = 26;
const DEFAULT_COL_W = 120;

function colLetter(idx: number) { return String.fromCharCode(65 + idx); }
function cellId(row: number, col: number) { return `${colLetter(col)}${row + 1}`; }

function parseCellRef(ref: string): { row: number; col: number } | null {
  const m = ref.toUpperCase().match(/^([A-Z]+)(\d+)$/);
  if (!m) return null;
  return { col: m[1].charCodeAt(0) - 65, row: parseInt(m[2]) - 1 };
}

// ── Expanded formula engine ────────────────────────────────
function evaluate(formula: string, getValue: (id: string) => string): string {
  if (!formula.startsWith('=')) return formula;
  const raw = formula.slice(1).trim();

  try {
    // Resolve range to number array
    function rangeNumbers(a: string, b: string): number[] {
      const from = parseCellRef(a); const to = parseCellRef(b);
      if (!from || !to) return [];
      const nums: number[] = [];
      for (let r = Math.min(from.row, to.row); r <= Math.max(from.row, to.row); r++)
        for (let c = Math.min(from.col, to.col); c <= Math.max(from.col, to.col); c++) {
          const v = parseFloat(getValue(cellId(r, c)));
          if (!isNaN(v)) nums.push(v);
        }
      return nums;
    }
    function allCellsInRange(a: string, b: string): { val: string; id: string }[] {
      const from = parseCellRef(a); const to = parseCellRef(b);
      if (!from || !to) return [];
      const cells: { val: string; id: string }[] = [];
      for (let r = Math.min(from.row, to.row); r <= Math.max(from.row, to.row); r++)
        for (let c = Math.min(from.col, to.col); c <= Math.max(from.col, to.col); c++) {
          const id = cellId(r, c);
          cells.push({ val: getValue(id), id });
        }
      return cells;
    }

    const up = raw.toUpperCase();

    // SUM
    const rng2 = (fn: string): string | null => {
      const m = up.match(new RegExp(`^${fn}\\(([A-Z]+\\d+):([A-Z]+\\d+)\\)$`));
      return m ? `${m[1]}:${m[2]}` : null;
    };
    if (up.startsWith('SUM(')) {
      const m = up.match(/^SUM\(([A-Z]+\d+):([A-Z]+\d+)\)$/);
      if (m) return String(rangeNumbers(m[1], m[2]).reduce((a, b) => a + b, 0));
    }
    if (up.startsWith('AVERAGE(')) {
      const m = up.match(/^AVERAGE\(([A-Z]+\d+):([A-Z]+\d+)\)$/);
      if (m) { const ns = rangeNumbers(m[1], m[2]); return ns.length ? String(ns.reduce((a,b)=>a+b,0)/ns.length) : '#DIV/0!'; }
    }
    if (up.startsWith('MAX(')) {
      const m = up.match(/^MAX\(([A-Z]+\d+):([A-Z]+\d+)\)$/);
      if (m) { const ns = rangeNumbers(m[1], m[2]); return ns.length ? String(Math.max(...ns)) : '#N/A'; }
    }
    if (up.startsWith('MIN(')) {
      const m = up.match(/^MIN\(([A-Z]+\d+):([A-Z]+\d+)\)$/);
      if (m) { const ns = rangeNumbers(m[1], m[2]); return ns.length ? String(Math.min(...ns)) : '#N/A'; }
    }
    if (up.startsWith('COUNT(')) {
      const m = up.match(/^COUNT\(([A-Z]+\d+):([A-Z]+\d+)\)$/);
      if (m) return String(rangeNumbers(m[1], m[2]).length);
    }
    if (up.startsWith('COUNTA(')) {
      const m = up.match(/^COUNTA\(([A-Z]+\d+):([A-Z]+\d+)\)$/);
      if (m) return String(allCellsInRange(m[1], m[2]).filter(c => c.val !== '').length);
    }
    if (up.startsWith('ROUND(')) {
      const m = up.match(/^ROUND\(([A-Z]+\d+|\d+\.?\d*),\s*(\d+)\)$/);
      if (m) {
        const v = parseCellRef(m[1]) ? parseFloat(getValue(m[1])) : parseFloat(m[1]);
        const dp = parseInt(m[2]);
        return String(Math.round(v * 10**dp) / 10**dp);
      }
    }
    if (up.startsWith('ABS(')) {
      const m = up.match(/^ABS\(([A-Z]+\d+|\-?\d+\.?\d*)\)$/);
      if (m) {
        const v = parseCellRef(m[1]) ? parseFloat(getValue(m[1])) : parseFloat(m[1]);
        return String(Math.abs(v));
      }
    }
    if (up.startsWith('SQRT(')) {
      const m = up.match(/^SQRT\(([A-Z]+\d+|\d+\.?\d*)\)$/);
      if (m) {
        const v = parseCellRef(m[1]) ? parseFloat(getValue(m[1])) : parseFloat(m[1]);
        return v < 0 ? '#NUM!' : String(Math.sqrt(v));
      }
    }
    if (up.startsWith('TODAY(')) {
      return new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
    }
    if (up.startsWith('NOW(')) {
      return new Date().toLocaleString();
    }
    // COUNTIF(range, criterion)
    if (up.startsWith('COUNTIF(')) {
      const m = up.match(/^COUNTIF\(([A-Z]+\d+):([A-Z]+\d+),\s*"?([^"]+)"?\)$/);
      if (m) {
        const criterion = m[3].trim();
        const cells = allCellsInRange(m[1], m[2]);
        let count = 0;
        cells.forEach(({ val }) => {
          if (criterion.startsWith('>')) {
            const n = parseFloat(criterion.slice(1).trim());
            if (!isNaN(n) && parseFloat(val) > n) count++;
          } else if (criterion.startsWith('<')) {
            const n = parseFloat(criterion.slice(1).trim());
            if (!isNaN(n) && parseFloat(val) < n) count++;
          } else if (criterion.startsWith('>=')) {
            const n = parseFloat(criterion.slice(2).trim());
            if (!isNaN(n) && parseFloat(val) >= n) count++;
          } else {
            if (val === criterion) count++;
          }
        });
        return String(count);
      }
    }
    // IF(condition, true_val, false_val)
    if (up.startsWith('IF(')) {
      const inner = raw.slice(3, raw.length - 1); // strip IF( and )
      // Split on top-level commas
      const parts: string[] = [];
      let depth = 0, cur = '';
      for (const ch of inner) {
        if (ch === '(') { depth++; cur += ch; }
        else if (ch === ')') { depth--; cur += ch; }
        else if (ch === ',' && depth === 0) { parts.push(cur.trim()); cur = ''; }
        else cur += ch;
      }
      parts.push(cur.trim());
      if (parts.length >= 3) {
        // Evaluate condition  (supports A1>5, A1="foo", A1<>B2, etc.)
        const cond = parts[0].replace(/([A-Za-z]+\d+)/g, ref => {
          const v = getValue(ref.toUpperCase());
          return isNaN(Number(v)) ? `"${v}"` : v;
        });
        let condResult = false;
        try {
          // eslint-disable-next-line no-new-func
          condResult = !!Function('"use strict"; return (' + cond.replace(/<>/g, '!==') + ')')();
        } catch { condResult = false; }
        const branch = condResult ? parts[1] : parts[2];
        // If branch is a cell ref, resolve it; if quoted, strip quotes
        if (/^".*"$/.test(branch)) return branch.slice(1, -1);
        if (parseCellRef(branch)) return getValue(branch.toUpperCase());
        return branch;
      }
    }
    // CONCAT / & operator — simple concatenation
    if (up.startsWith('CONCAT(')) {
      const inner = raw.slice(7, raw.length - 1);
      const parts = inner.split(',').map(p => {
        p = p.trim();
        if (/^".*"$/.test(p)) return p.slice(1, -1);
        if (parseCellRef(p)) return getValue(p.toUpperCase());
        return p;
      });
      return parts.join('');
    }
    // LEN
    if (up.startsWith('LEN(')) {
      const m = up.match(/^LEN\(([A-Z]+\d+)\)$/);
      if (m) return String(getValue(m[1]).length);
    }
    // UPPER/LOWER
    if (up.startsWith('UPPER(')) {
      const m = up.match(/^UPPER\(([A-Z]+\d+)\)$/);
      if (m) return getValue(m[1]).toUpperCase();
    }
    if (up.startsWith('LOWER(')) {
      const m = up.match(/^LOWER\(([A-Z]+\d+)\)$/);
      if (m) return getValue(m[1]).toLowerCase();
    }

    // Arithmetic expression with optional cell refs
    const withValues = formula.slice(1).replace(/([A-Za-z]+\d+)/g, ref => {
      const v = parseFloat(getValue(ref.toUpperCase()));
      return isNaN(v) ? '0' : String(v);
    });
    // Try to evaluate as a JS arithmetic expression — no regex gate needed
    try {
      // eslint-disable-next-line no-new-func
      const result = Function('"use strict"; return (' + withValues + ')')();
      if (typeof result === 'number') {
        if (isNaN(result)) return '#VALUE!';
        if (!isFinite(result)) return '#DIV/0!';
        // Round floating point noise (e.g. 0.1+0.2 = 0.30000000000000004)
        return String(Math.round(result * 1e10) / 1e10);
      }
      return String(result);
    } catch {
      return '#ERR!';
    }
  } catch {
    return '#ERR!';
  }
}

// ── Drag reorder helpers ───────────────────────────────────
function reorder<T>(arr: T[], from: number, to: number): T[] {
  const next = [...arr];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

// ── Grid ──────────────────────────────────────────────────
export default function Grid({
  data,
  onCellChange,
  onSelectionChange,
  colWidths: colWidthsProp = new Map(),
  onColWidthChange,
  remoteCursors = new Map(),
}: GridProps) {
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number }>({ row: 0, col: 0 });
  const [editingCell, setEditingCell]   = useState<{ row: number; col: number } | null>(null);
  const [editValue, setEditValue]       = useState('');
  const inputRef     = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // ── Column / row order ─────────────────────────────
  const [colOrder, setColOrder] = useState<number[]>(() => Array.from({ length: NUM_COLS }, (_, i) => i));
  const [rowOrder, setRowOrder] = useState<number[]>(() => Array.from({ length: NUM_ROWS }, (_, i) => i));

  // ── Drag state ─────────────────────────────────────
  const [draggingCol, setDraggingCol] = useState<number | null>(null);
  const [dragOverCol, setDragOverCol] = useState<number | null>(null);
  const [draggingRow, setDraggingRow] = useState<number | null>(null);
  const [dragOverRow, setDragOverRow] = useState<number | null>(null);

  // ── Context menu ───────────────────────────────────
  interface CtxMenu { x: number; y: number; vr: number; vc: number; }
  const [ctxMenu, setCtxMenu] = useState<CtxMenu | null>(null);
  const closeCtx = useCallback(() => setCtxMenu(null), []);

  // ── Column resize — local ref so resize is instant ─
  // localWidths mirrors colWidthsProp but can be updated immediately during drag
  const localWidths = useRef<Map<number, number>>(new Map(colWidthsProp));
  const [, forceUpdate] = useState(0);

  // Sync prop changes into ref (e.g. initial load)
  if (colWidthsProp !== localWidths.current) {
    colWidthsProp.forEach((w, k) => localWidths.current.set(k, w));
  }

  const getColWidth = (actualCol: number) => localWidths.current.get(actualCol) ?? DEFAULT_COL_W;

  const actualCol = (vc: number) => colOrder[vc] ?? vc;
  const actualRow = (vr: number) => rowOrder[vr] ?? vr;

  // ── Context menu row/col operations ───────────────
  const insertRowAbove = useCallback((vr: number) => {
    const ar = rowOrder[vr] ?? vr;
    for (let r = NUM_ROWS - 2; r >= ar; r--)
      for (let c = 0; c < NUM_COLS; c++) {
        const cell = data.get(cellId(r, c));
        onCellChange(cellId(r + 1, c), cell?.raw ?? '', cell?.computed ?? '');
      }
    for (let c = 0; c < NUM_COLS; c++) onCellChange(cellId(ar, c), '', '');
    closeCtx();
  }, [rowOrder, data, onCellChange, closeCtx]);

  const deleteRow = useCallback((vr: number) => {
    const ar = rowOrder[vr] ?? vr;
    for (let r = ar; r < NUM_ROWS - 1; r++)
      for (let c = 0; c < NUM_COLS; c++) {
        const next = data.get(cellId(r + 1, c));
        onCellChange(cellId(r, c), next?.raw ?? '', next?.computed ?? '');
      }
    for (let c = 0; c < NUM_COLS; c++) onCellChange(cellId(NUM_ROWS - 1, c), '', '');
    closeCtx();
  }, [rowOrder, data, onCellChange, closeCtx]);

  const insertColLeft = useCallback((vc: number) => {
    const ac = colOrder[vc] ?? vc;
    for (let c = NUM_COLS - 2; c >= ac; c--)
      for (let r = 0; r < NUM_ROWS; r++) {
        const cell = data.get(cellId(r, c));
        onCellChange(cellId(r, c + 1), cell?.raw ?? '', cell?.computed ?? '');
      }
    for (let r = 0; r < NUM_ROWS; r++) onCellChange(cellId(r, ac), '', '');
    closeCtx();
  }, [colOrder, data, onCellChange, closeCtx]);

  const deleteCol = useCallback((vc: number) => {
    const ac = colOrder[vc] ?? vc;
    for (let c = ac; c < NUM_COLS - 1; c++)
      for (let r = 0; r < NUM_ROWS; r++) {
        const next = data.get(cellId(r, c + 1));
        onCellChange(cellId(r, c), next?.raw ?? '', next?.computed ?? '');
      }
    for (let r = 0; r < NUM_ROWS; r++) onCellChange(cellId(r, NUM_COLS - 1), '', '');
    closeCtx();
  }, [colOrder, data, onCellChange, closeCtx]);

  const getValue = useCallback((id: string) => data.get(id.toUpperCase())?.computed ?? '', [data]);
  const getRaw   = useCallback((id: string) => data.get(id.toUpperCase())?.raw ?? '', [data]);
  const getFormat = useCallback((id: string): CellFormat => data.get(id.toUpperCase())?.format ?? {}, [data]);

  const startEdit = useCallback((row: number, col: number) => {
    const id = cellId(row, col);
    setEditingCell({ row, col });
    setEditValue(getRaw(id));
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [getRaw]);

  const commitEdit = useCallback(() => {
    if (!editingCell) return;
    const id = cellId(editingCell.row, editingCell.col);
    const raw = editValue;
    const computed = evaluate(raw, getValue);
    onCellChange(id, raw, computed);
    setEditingCell(null);
    setEditValue('');
  }, [editingCell, editValue, getValue, onCellChange]);

  const cancelEdit = useCallback(() => {
    setEditingCell(null);
    setEditValue('');
  }, []);

  // ── Keyboard nav ───────────────────────────────────
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const { row: vr, col: vc } = selectedCell;

    if (editingCell) {
      if (e.key === 'Escape') { e.preventDefault(); cancelEdit(); }
      return;
    }

    const move = (dr: number, dc: number) => {
      const nr = Math.max(0, Math.min(NUM_ROWS - 1, vr + dr));
      const nc = Math.max(0, Math.min(NUM_COLS - 1, vc + dc));
      setSelectedCell({ row: nr, col: nc });
      onSelectionChange?.(cellId(actualRow(nr), actualCol(nc)));
    };

    // Ctrl+B/I/U shortcuts — bubble up to parent via keyboard events
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
      if (e.key === 'b' || e.key === 'B') { /* handled by parent */ return; }
      if (e.key === 'i' || e.key === 'I') { /* handled by parent */ return; }
    }

    switch (e.key) {
      case 'ArrowUp':    e.preventDefault(); move(-1, 0);  break;
      case 'ArrowDown':  e.preventDefault(); move(1, 0);   break;
      case 'ArrowLeft':  e.preventDefault(); move(0, -1);  break;
      case 'ArrowRight': e.preventDefault(); move(0, 1);   break;
      case 'Tab':
        e.preventDefault();
        move(0, e.shiftKey ? -1 : 1);
        break;
      case 'Enter':
        startEdit(actualRow(vr), actualCol(vc));
        break;
      case 'Delete':
      case 'Backspace':
        onCellChange(cellId(actualRow(vr), actualCol(vc)), '', '');
        break;
      case 'Escape': cancelEdit(); break;
      default:
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
          setEditingCell({ row: actualRow(vr), col: actualCol(vc) });
          setEditValue(e.key);
          setTimeout(() => inputRef.current?.focus(), 0);
        }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCell, editingCell, actualRow, actualCol, startEdit, commitEdit, cancelEdit, onCellChange, onSelectionChange]);

  // ── Column resize ──────────────────────────────────
  const startColResize = (actualColIdx: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startW = getColWidth(actualColIdx);

    const onMove = (me: MouseEvent) => {
      const newW = Math.max(48, startW + (me.clientX - startX));
      localWidths.current.set(actualColIdx, newW);
      onColWidthChange?.(actualColIdx, newW);
      forceUpdate(n => n + 1); // instant visual update from local ref
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  // ── Col drag handlers ──────────────────────────────
  const onColDragStart = (e: React.DragEvent, vc: number) => { setDraggingCol(vc); e.dataTransfer.effectAllowed = 'move'; };
  const onColDragOver  = (e: React.DragEvent, vc: number) => { e.preventDefault(); setDragOverCol(vc); };
  const onColDrop      = (e: React.DragEvent, vc: number) => {
    e.preventDefault();
    if (draggingCol !== null && draggingCol !== vc) setColOrder(prev => reorder(prev, draggingCol, vc));
    setDraggingCol(null); setDragOverCol(null);
  };
  const onColDragEnd   = () => { setDraggingCol(null); setDragOverCol(null); };

  // ── Row drag handlers ──────────────────────────────
  const onRowDragStart = (e: React.DragEvent, vr: number) => { setDraggingRow(vr); e.dataTransfer.effectAllowed = 'move'; };
  const onRowDragOver  = (e: React.DragEvent, vr: number) => { e.preventDefault(); setDragOverRow(vr); };
  const onRowDrop      = (e: React.DragEvent, vr: number) => {
    e.preventDefault();
    if (draggingRow !== null && draggingRow !== vr) setRowOrder(prev => reorder(prev, draggingRow, vr));
    setDraggingRow(null); setDragOverRow(null);
  };
  const onRowDragEnd   = () => { setDraggingRow(null); setDragOverRow(null); };

  // ── Render ─────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', outline: 'none' }}
    >
      <style>{`
        .col-hdr.drag-over { border-left: 3px solid #1a73e8 !important; background: #dbeafe !important; }
        .col-hdr.dragging  { opacity: 0.4; }
        .row-hdr.drag-over { border-top: 3px solid #1a73e8 !important; background: #dbeafe !important; }
        .row-hdr.dragging  { opacity: 0.4; }
        .grip { color: #c5c9d4; font-size: 12px; margin-right: 4px; cursor: grab; user-select: none; }
        .grip:hover { color: #1a73e8; }
      `}</style>

      <div className="grid-scroll-container">
        {/* Column header row */}
        <div className="col-header-row" style={{ width: 'max-content' }}>
          {/* Corner cell */}
          <div className="col-header-corner" style={{ minWidth: 'var(--row-header-w)' }}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M2 8L8 2M5 2H8V5" stroke="#9aa0ab" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
          </div>

          {Array.from({ length: NUM_COLS }).map((_, vc) => {
            const ac = actualCol(vc);
            return (
              <div
                key={vc}
                className={`col-header col-hdr${selectedCell.col === vc ? ' selected' : ''}${draggingCol === vc ? ' dragging' : ''}${dragOverCol === vc && draggingCol !== null && draggingCol !== vc ? ' drag-over' : ''}`}
                style={{ minWidth: getColWidth(ac), position: 'relative', gap: 2 }}
                draggable
                onDragStart={e => onColDragStart(e, vc)}
                onDragOver={e  => onColDragOver(e, vc)}
                onDrop={e      => onColDrop(e, vc)}
                onDragEnd={onColDragEnd}
              >
                <span className="grip" title="Drag to reorder">⠿</span>
                {colLetter(ac)}
                <div className="col-resize-handle" onMouseDown={ev => startColResize(ac, ev)} />
              </div>
            );
          })}
        </div>

        {/* Data rows */}
        {Array.from({ length: NUM_ROWS }).map((_, vr) => {
          const ar = actualRow(vr);
          return (
            <div key={vr} style={{ display: 'flex', width: 'max-content' }}>
              {/* Row header */}
              <div
                className={`row-header row-hdr${selectedCell.row === vr ? ' selected' : ''}${draggingRow === vr ? ' dragging' : ''}${dragOverRow === vr && draggingRow !== null && draggingRow !== vr ? ' drag-over' : ''}`}
                draggable
                onDragStart={e => onRowDragStart(e, vr)}
                onDragOver={e  => onRowDragOver(e, vr)}
                onDrop={e      => onRowDrop(e, vr)}
                onDragEnd={onRowDragEnd}
                title={`Row ${ar + 1} — drag to reorder`}
                style={{ cursor: 'grab' }}
              >
                {ar + 1}
              </div>

              {/* Cells */}
              {Array.from({ length: NUM_COLS }).map((_, vc) => {
                const ac  = actualCol(vc);
                const id  = cellId(ar, ac);
                const fmt = getFormat(id);
                const isSelected = selectedCell.row === vr && selectedCell.col === vc;
                const isEditing  = editingCell?.row === ar && editingCell?.col === ac;

                let remoteCursor: { color: string; name: string } | undefined;
                remoteCursors.forEach(cur => { if (cur.cell === id) remoteCursor = cur; });

                const alignStyle: React.CSSProperties['justifyContent'] =
                  fmt.align === 'center' ? 'center'
                  : fmt.align === 'right' ? 'flex-end'
                  : 'flex-start';

                return (
                  <div
                    key={vc}
                    className={`cell${isSelected ? ' selected' : ''}${isEditing ? ' editing' : ''}`}
                    style={{
                      minWidth: getColWidth(ac),
                      fontWeight:      fmt.bold   ? 700 : 400,
                      fontStyle:       fmt.italic ? 'italic' : 'normal',
                      fontSize:        fmt.fontSize ?? 13,
                      textDecoration:  [fmt.underline ? 'underline' : '', fmt.strikethrough ? 'line-through' : ''].filter(Boolean).join(' ') || undefined,
                      color:           fmt.textColor ?? 'var(--text-primary)',
                      background:      fmt.bgColor   ?? '#fff',
                      justifyContent:  alignStyle,
                      outline: remoteCursor
                        ? `2px solid ${remoteCursor.color}`
                        : isSelected ? '2px solid var(--primary)' : 'none',
                      outlineOffset: '-2px',
                      position: 'relative',
                      opacity: (draggingCol === vc || draggingRow === vr) ? 0.45 : 1,
                    }}
                    onClick={() => {
                      setSelectedCell({ row: vr, col: vc });
                      onSelectionChange?.(id);
                      if (editingCell && !(editingCell.row === ar && editingCell.col === ac)) commitEdit();
                    }}
                    onDoubleClick={() => startEdit(ar, ac)}
                    onContextMenu={e => {
                      e.preventDefault();
                      setCtxMenu({ x: e.clientX, y: e.clientY, vr, vc });
                      setSelectedCell({ row: vr, col: vc });
                    }}
                  >
                    {/* Remote cursor name badge */}
                    {remoteCursor && (
                      <div style={{
                        position: 'absolute', top: -18, left: -1, zIndex: 30,
                        background: remoteCursor.color, color: '#fff',
                        fontSize: 10, fontWeight: 600, padding: '1px 5px',
                        borderRadius: '3px 3px 3px 0', whiteSpace: 'nowrap', pointerEvents: 'none',
                      }}>
                        {remoteCursor.name}
                      </div>
                    )}

                    {isEditing ? (
                      <input
                        ref={inputRef}
                        className="cell-input"
                        value={editValue}
                        suppressHydrationWarning
                        onChange={e => setEditValue(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault(); commitEdit();
                            setSelectedCell(prev => ({ row: prev.row + 1, col: prev.col }));
                          }
                          if (e.key === 'Escape')  { e.preventDefault(); cancelEdit(); }
                          if (e.key === 'Tab') {
                            e.preventDefault(); commitEdit();
                            setSelectedCell(prev => ({ row: prev.row, col: Math.min(NUM_COLS - 1, prev.col + (e.shiftKey ? -1 : 1)) }));
                          }
                        }}
                        onBlur={commitEdit}
                        style={{
                          fontWeight: fmt.bold   ? 700 : 400,
                          fontStyle:  fmt.italic ? 'italic' : 'normal',
                          fontSize:   fmt.fontSize ?? 13,
                          color:      fmt.textColor ?? 'var(--text-primary)',
                          textAlign:  fmt.align ?? 'left',
                          minWidth:   getColWidth(ac),
                        }}
                      />
                    ) : (
                      <span style={{
                        overflow: 'hidden', textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap', width: '100%', padding: '0 2px',
                        textAlign: fmt.align ?? 'left',
                      }}>
                        {/* Always show evaluated value; raw stored but computed shown */}
                        {(() => {
                          const cell = data.get(id);
                          if (!cell) return '';
                          if (cell.raw.startsWith('=')) return evaluate(cell.raw, getValue);
                          return cell.computed || cell.raw;
                        })()}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Context menu */}
      {ctxMenu && (
        <div
          style={{
            position: 'fixed', top: ctxMenu.y, left: ctxMenu.x, zIndex: 9999,
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)',
            minWidth: 200, padding: 4,
            animation: 'fadeIn 0.1s ease-out',
          }}
          onMouseLeave={closeCtx}
        >
          {([
            { label: 'Insert row above', action: () => insertRowAbove(ctxMenu.vr) },
            { label: 'Insert row below', action: () => insertRowAbove(ctxMenu.vr + 1) },
            { label: 'Delete row',       action: () => deleteRow(ctxMenu.vr) },
            null,
            { label: 'Insert column left',  action: () => insertColLeft(ctxMenu.vc) },
            { label: 'Insert column right', action: () => insertColLeft(ctxMenu.vc + 1) },
            { label: 'Delete column',       action: () => deleteCol(ctxMenu.vc) },
          ] as (null | { label: string; action: () => void })[]).map((item, i) =>
            item === null ? (
              <div key={`div-${i}`} className="context-menu-divider" />
            ) : (
              <button
                key={item.label}
                className="context-menu-item"
                suppressHydrationWarning
                onClick={item.action}
                style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                {item.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}
