import { IConfig } from '../../interfaces/config.interface.js';

export type ResultColumnId = 'age' | 'size';

export interface ResultColumn {
  id: ResultColumnId;
  width: number;
  label: string;
}

export interface ResultColumnPosition {
  column: ResultColumn;
  x: number;
}

export interface ResultColumnLayout {
  columns: ResultColumn[];
  positions: ResultColumnPosition[];
  firstColumnX: number;
  headerText: string;
  pathReservedWidth: number;
}

const RIGHT_MARGIN = 1;
const SCROLLBAR_MARGIN = 1;
const COLUMN_GAP = 0;
const PATH_TO_COLUMN_GAP = 2;

const ALL_COLUMNS: ResultColumn[] = [
  { id: 'age', width: 4, label: 'Age' },
  { id: 'size', width: 9, label: 'Size' },
];

export function getResultColumns(config: IConfig): ResultColumn[] {
  return ALL_COLUMNS.filter((column) => isColumnEnabled(column.id, config));
}

function isColumnEnabled(id: ResultColumnId, config: IConfig): boolean {
  switch (id) {
    case 'size':
      return !config.disableSize;
    case 'age':
      return !config.disableAge;
  }
}

function getHeaderCellText(column: ResultColumn): string {
  if (column.id === 'size') {
    return column.label.padStart(column.width - 1).padEnd(column.width);
  }

  return column.label.padStart(column.width);
}

export function getColumnLayout(
  columns: ResultColumn[],
  terminalColumns: number,
): ResultColumnLayout {
  const positions: ResultColumnPosition[] = [];
  let cursorX = terminalColumns - RIGHT_MARGIN;

  for (let i = columns.length - 1; i >= 0; i--) {
    const column = columns[i];
    cursorX -= column.width;
    positions.unshift({ column, x: cursorX });
    cursorX -= COLUMN_GAP;
  }

  const firstColumnX =
    positions.length > 0 ? positions[0].x : terminalColumns - RIGHT_MARGIN;

  const headerText = columns
    .map(getHeaderCellText)
    .join(' '.repeat(COLUMN_GAP));

  const pathReservedWidth =
    columns.length === 0
      ? RIGHT_MARGIN + SCROLLBAR_MARGIN
      : columns.reduce((acc, c) => acc + c.width, 0) +
        Math.max(0, columns.length - 1) * COLUMN_GAP +
        PATH_TO_COLUMN_GAP +
        RIGHT_MARGIN;

  return {
    columns,
    positions,
    firstColumnX,
    headerText,
    pathReservedWidth,
  };
}
