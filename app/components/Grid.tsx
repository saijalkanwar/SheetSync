'use client';
import { useState, useCallback, useRef, useEffect } from 'react';

// ── Types ────────────────────────────────────────────────
export interface CellFormat {
  bold?: boolean;
  italic?: boolean;
  textColor?: string;
  bgColor?: string;
  align?: 'left' | 'center' | 'right';
}

export interface CellData {
  raw: string;        // what the user typed (may be a formula)
  computed: string;   // displayed value after formula evaluation
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

// ── Helpers ──────────────────────────────────────────────
const NUM_ROWS = 100;
const NUM_COLS = 26;

function colLetter(index: number): string {
  return String.fromCharCode(65 + index);
}

function cellId(row: number, col: number): string {
  return `${colLetter(col)}${row + 1}`;
}

function parseCellId(id: string): { row: number; col: number } | null {
  const match = id.match(/^([A-Z]+)(\d+)$/);
  if (!match) return null;
  const col = match[1].charCodeAt(0) - 65;
  const row = parseInt(match[2]) - 1;
  return { row, col };
}

// ── Formula evaluator ─────────────────────────────────────
function evaluateFormula(formula: string, getData: (id: string) => string): string {
  if (!formula.startsWith('=')) return formula;
  const expr = formula.slice(1).trim().toUpperCase();

  try {
    // SUM(range)
    const sumMatch = expr.match(/^SUM\(([A-Z]+\d+):([A-Z]+\d+)\)$/);
    if (sumMatch) {
      const from = parseCellId(sumMatch[1]);
      const to   = parseCellId(sumMatch[2]);
      if (!from || !to) return '#REF!';
      let sum = 0;
      for (let r = Math.min(from.row, to.row); r <= Math.max(from.row, to.row); r++) {
        for (let c = Math.min(from.col, to.col); c <= Math.max(from.col, to.col); c++) {
          const v = parseFloat(getData(cellId(r, c)));
          if (!isNaN(v)) sum += v;
        }
      }
      return String(sum);
    }

    // AVERAGE(range)
    const avgMatch = expr.match(/^AVERAGE\(([A-Z]+\d+):([A-Z]+\d+)\)$/);
    if (avgMatch) {
      const from = parseCellId(avgMatch[1]);
      const to   = parseCellId(avgMatch[2]);
      if (!from || !to) return '#REF!';
      const vals: number[] = [];
      for (let r = Math.min(from.row, to.row); r <= Math.max(from.row, to.row); r++) {
        for (let c = Math.min(from.col, to.col); c <= Math.max(from.col, to.col); c++) {
          const v = parseFloat(getData(cellId(r, c)));
          if (!isNaN(v)) vals.push(v);
        }
      }
      return vals.length ? String(vals.reduce((a, b) => a + b, 0) / vals.length) : '#DIV/0!';
    }

    // MAX / MIN
    const minMaxMatch = expr.match(/^(MAX|MIN)\(([A-Z]+\d+):([A-Z]+\d+)\)$/);
    if (minMaxMatch) {
      const fn   = minMaxMatch[1];
      const from = parseCellId(minMaxMatch[2]);
      const to   = parseCellId(minMaxMatch[3]);
      if (!from || !to) return '#REF!';
      const vals: number[] = [];
      for (let r = Math.min(from.row, to.row); r <= Math.max(from.row, to.row); r++) {
        for (let c = Math.min(from.col, to.col); c <= Math.max(from.col, to.col); c++) {
          const v = parseFloat(getData(cellId(r, c)));
          if (!isNaN(v)) vals.push(v);
        }
      }
      return vals.length ? String(fn === 'MAX' ? Math.max(...vals) : Math.min(...vals)) : '#N/A';
    }

    // COUNT
    const countMatch = expr.match(/^COUNT\(([A-Z]+\d+):([A-Z]+\d+)\)$/);
    if (countMatch) {
      const from = parseCellId(countMatch[1]);
      const to   = parseCellId(countMatch[2]);
      if (!from || !to) return '#REF!';
      let count = 0;
      for (let r = Math.min(from.row, to.row); r <= Math.max(from.row, to.row); r++) {
        for (let c = Math.min(from.col, to.col); c <= Math.max(from.col, to.col); c++) {
          const v = getData(cellId(r, c));
          if (v !== '' && !isNaN(parseFloat(v))) count++;
        }
      }
      return String(count);
    }

    // Basic arithmetic with cell references: replace A1, B2 etc.
    const withValues = formula.slice(1).replace(/([A-Z]\d+)/g, (ref) => {
      const v = parseFloat(getData(ref.toUpperCase()));
      return isNaN(v) ? '0' : String(v);
    });
    // Only eval if it looks safe (only numbers and operators)
    if (/^[\d\s\+\-\*\/\.\(\)]+$/.test(withValues)) {
      // eslint-disable-next-line no-new-func
      const result = Function('"use strict"; return (' + withValues + ')')();
      return isNaN(result) ? '#VALUE!' : String(result);
    }

    return '#ERR!';
  } catch {
    return '#ERR!';
  }
}

// ── Component ─────────────────────────────────────────────
export default function Grid({
  data,
  onCellChange,
  onSelectionChange,
  colWidths = new Map(),
  onColWidthChange,
  remoteCursors = new Map(),
}: GridProps) {
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>({ row: 0, col: 0 });
  const [editingCell, setEditingCell]   = useState<{ row: number; col: number } | null>(null);
  const [editValue, setEditValue]       = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Resize state
  const resizingCol = useRef<number | null>(null);
  const resizeStartX = useRef(0);
  const resizeStartW = useRef(0);
  const [, forceUpdate] = useState(0);

  const getColWidth = useCallback((col: number) => colWidths.get(col) ?? 120, [colWidths]);

  const getData = useCallback((id: string): string => {
    const cell = data.get(id.toUpperCase());
    return cell?.computed ?? '';
  }, [data]);

  const getRaw = useCallback((id: string): string => {
    return data.get(id.toUpperCase())?.raw ?? '';
  }, [data]);

  const getFormat = useCallback((id: string): CellFormat => {
    return data.get(id.toUpperCase())?.format ?? {};
  }, [data]);

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
    const computed = evaluateFormula(raw, getData);
    onCellChange(id, raw, computed);
    setEditingCell(null);
    setEditValue('');
  }, [editingCell, editValue, getData, onCellChange]);

  const cancelEdit = useCallback(() => {
    setEditingCell(null);
    setEditValue('');
  }, []);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!selectedCell) return;
    const { row, col } = selectedCell;
    if (editingCell) return; // handled inside cell input

    const move = (dr: number, dc: number) => {
      const nr = Math.max(0, Math.min(NUM_ROWS - 1, row + dr));
      const nc = Math.max(0, Math.min(NUM_COLS - 1, col + dc));
      setSelectedCell({ row: nr, col: nc });
      onSelectionChange?.(cellId(nr, nc));
    };

    switch (e.key) {
      case 'ArrowUp':    e.preventDefault(); move(-1, 0); break;
      case 'ArrowDown':  e.preventDefault(); move(1, 0);  break;
      case 'ArrowLeft':  e.preventDefault(); move(0, -1); break;
      case 'ArrowRight': e.preventDefault(); move(0, 1);  break;
      case 'Tab':
        e.preventDefault();
        move(0, e.shiftKey ? -1 : 1); break;
      case 'Enter':
        if (!editingCell) { startEdit(row, col); }
        else { commitEdit(); move(1, 0); }
        break;
      case 'Delete':
      case 'Backspace':
        onCellChange(cellId(row, col), '', '');
        break;
      case 'Escape': cancelEdit(); break;
      default:
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
          setEditingCell({ row, col });
          setEditValue(e.key);
          setTimeout(() => inputRef.current?.focus(), 0);
        }
    }
  }, [selectedCell, editingCell, startEdit, commitEdit, cancelEdit, onCellChange, onSelectionChange]);

  // Column resize
  const startColResize = (colIndex: number, e: React.MouseEvent) => {
    e.preventDefault();
    resizingCol.current = colIndex;
    resizeStartX.current = e.clientX;
    resizeStartW.current = getColWidth(colIndex);

    const onMove = (me: MouseEvent) => {
      if (resizingCol.current === null) return;
      const delta = me.clientX - resizeStartX.current;
      const newW = Math.max(48, resizeStartW.current + delta);
      onColWidthChange?.(resizingCol.current, newW);
      forceUpdate(n => n + 1);
    };
    const onUp = () => {
      resizingCol.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  // ── Render ─────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', outline: 'none' }}
    >
      <div className="grid-scroll-container">
        {/* Column header row */}
        <div className="col-header-row" style={{ width: 'max-content' }}>
          {/* Corner */}
          <div className="col-header-corner" style={{ minWidth: 'var(--row-header-w)' }}>
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <path d="M2 9L9 2M5 2H9V6" stroke="#9aa0ab" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          {Array.from({ length: NUM_COLS }).map((_, c) => (
            <div
              key={c}
              className={`col-header${selectedCell?.col === c ? ' selected' : ''}`}
              style={{ minWidth: getColWidth(c) }}
            >
              {colLetter(c)}
              {/* Resize handle */}
              <div
                className="col-resize-handle"
                onMouseDown={ev => startColResize(c, ev)}
              />
            </div>
          ))}
        </div>

        {/* Rows */}
        {Array.from({ length: NUM_ROWS }).map((_, r) => (
          <div key={r} style={{ display: 'flex', width: 'max-content' }}>
            {/* Row header */}
            <div className={`row-header${selectedCell?.row === r ? ' selected' : ''}`}>
              {r + 1}
            </div>

            {/* Cells */}
            {Array.from({ length: NUM_COLS }).map((_, c) => {
              const id   = cellId(r, c);
              const fmt  = getFormat(id);
              const isSelected = selectedCell?.row === r && selectedCell?.col === c;
              const isEditing  = editingCell?.row === r && editingCell?.col === c;

              // Check for remote cursor
              let remoteCursor: { color: string; name: string } | undefined;
              remoteCursors.forEach((cursor) => {
                if (cursor.cell === id) remoteCursor = cursor;
              });

              return (
                <div
                  key={c}
                  className={`cell${isSelected ? ' selected' : ''}${isEditing ? ' editing' : ''}`}
                  style={{
                    minWidth: getColWidth(c),
                    fontWeight: fmt.bold ? 700 : 400,
                    fontStyle: fmt.italic ? 'italic' : 'normal',
                    color: fmt.textColor ?? 'var(--text-primary)',
                    background: fmt.bgColor ?? (isSelected ? '#fff' : '#fff'),
                    justifyContent:
                      fmt.align === 'center' ? 'center'
                      : fmt.align === 'right' ? 'flex-end'
                      : 'flex-start',
                    outline: remoteCursor
                      ? `2px solid ${remoteCursor.color}`
                      : isSelected
                      ? '2px solid var(--primary)'
                      : 'none',
                    outlineOffset: '-2px',
                    position: 'relative',
                  }}
                  onClick={() => {
                    setSelectedCell({ row: r, col: c });
                    onSelectionChange?.(id);
                    if (editingCell && !(editingCell.row === r && editingCell.col === c)) {
                      commitEdit();
                    }
                  }}
                  onDoubleClick={() => startEdit(r, c)}
                >
                  {/* Remote cursor label */}
                  {remoteCursor && (
                    <div style={{
                      position: 'absolute', top: -18, left: -1, zIndex: 30,
                      background: remoteCursor.color, color: '#fff',
                      fontSize: 10, fontWeight: 600, padding: '1px 5px',
                      borderRadius: '3px 3px 3px 0',
                      whiteSpace: 'nowrap',
                      pointerEvents: 'none',
                    }}>
                      {remoteCursor.name}
                    </div>
                  )}

                  {isEditing ? (
                    <input
                      ref={inputRef}
                      className="cell-input"
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') { e.preventDefault(); commitEdit(); setSelectedCell({ row: r + 1, col: c }); }
                        if (e.key === 'Escape') { e.preventDefault(); cancelEdit(); }
                        if (e.key === 'Tab') { e.preventDefault(); commitEdit(); setSelectedCell({ row: r, col: c + (e.shiftKey ? -1 : 1) }); }
                      }}
                      onBlur={commitEdit}
                      style={{
                        fontWeight: fmt.bold ? 700 : 400,
                        fontStyle: fmt.italic ? 'italic' : 'normal',
                        color: fmt.textColor ?? 'var(--text-primary)',
                        minWidth: getColWidth(c),
                      }}
                    />
                  ) : (
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>
                      {getData(id)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
