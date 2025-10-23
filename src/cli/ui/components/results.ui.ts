import {
  DECIMALS_SIZE,
  DEFAULT_CONFIG,
  MARGINS,
  OVERFLOW_CUT_FROM,
} from '../../../constants/main.constants.js';

import { InteractiveUi } from '../base.ui.js';
import { HeavyUi } from '../heavy.ui.js';

import { ConsoleService } from '../../services/console.service.js';
import { IConfig } from '../../interfaces/config.interface.js';
import { IKeyPress } from '../../interfaces/key-press.interface.js';
import { INFO_MSGS } from '../../../constants/messages.constants.js';
import { ResultsService } from '../../services/results.service.js';
import { Subject } from 'rxjs';
import pc from 'picocolors';
import { resolve } from 'node:path';
import { CliScanFoundFolder } from '../../../cli/interfaces/stats.interface.js';
import { formatSize } from '../../../utils/unit-conversions.js';

const CURSOR_ROW_COLOR = 'bgBlue';

export class ResultsUi extends HeavyUi implements InteractiveUi {
  resultIndex = 0;
  previousIndex = 0;
  scroll: number = 0;
  private haveResultsAfterCompleted = true;
  private selectMode = false;
  private selectedFolders: Map<string, CliScanFoundFolder> = new Map();
  private rangeSelectionStart: number | null = null;
  private isRangeSelectionMode: boolean = false;

  readonly delete$ = new Subject<CliScanFoundFolder>();
  readonly deleteMultiple$ = new Subject<CliScanFoundFolder[]>();
  readonly showErrors$ = new Subject<null>();
  readonly openFolder$ = new Subject<string>();
  readonly showDetails$ = new Subject<CliScanFoundFolder>();
  readonly goOptions$ = new Subject<null>();
  readonly endNpkill$ = new Subject<null>();

  private readonly config: IConfig = DEFAULT_CONFIG;
  private readonly KEYS = {
    up: () => this.cursorUp(),
    down: () => this.cursorDown(),
    space: () => this.handleSpacePress(),
    delete: () => this.handleSpacePress(),
    j: () => this.cursorDown(),
    k: () => this.cursorUp(),
    h: () => this.goOptions(),
    l: () => this.showDetails(),
    d: () => this.cursorPageDown(),
    u: () => this.cursorPageUp(),
    pageup: () => this.cursorPageUp(),
    pagedown: () => this.cursorPageDown(),
    home: () => this.cursorFirstResult(),
    end: () => this.cursorLastResult(),
    e: () => this.showErrorsPopup(),
    o: () => this.openFolder(),
    right: () => this.showDetails(),
    left: () => this.goOptions(),
    q: () => this.endNpkill(),
    t: () => this.toggleSelectMode(),
    return: () => this.deleteSelected(),
    enter: () => this.deleteSelected(),
    v: () => this.startRangeSelection(),
    a: () => this.toggleSelectAll(),
  };

  constructor(
    private readonly resultsService: ResultsService,
    private readonly consoleService: ConsoleService,
  ) {
    super();
  }

  private openFolder(): void {
    const folder = this.resultsService.results[this.resultIndex];
    const parentPath = resolve(folder.path, '..');
    this.openFolder$.next(parentPath);
  }

  private showDetails(): void {
    const result = this.resultsService.results[this.resultIndex];
    if (!result) {
      return;
    }
    this.showDetails$.next(result);
  }

  private goOptions(): void {
    this.goOptions$.next(null);
  }

  private endNpkill(): void {
    this.endNpkill$.next(null);
  }

  private toggleSelectMode(): void {
    this.selectMode = !this.selectMode;
    if (!this.selectMode) {
      this.selectedFolders.clear();
      this.rangeSelectionStart = null;
      this.isRangeSelectionMode = false;
    }
  }

  private startRangeSelection(): void {
    if (!this.selectMode) {
      return;
    }

    if (this.isRangeSelectionMode) {
      // Selection mode was started, so end the range.
      this.isRangeSelectionMode = false;
      this.rangeSelectionStart = null;
      return;
    }

    this.isRangeSelectionMode = true;
    this.rangeSelectionStart = this.resultIndex;

    const folder = this.resultsService.results[this.resultIndex];
    if (folder) {
      if (this.selectedFolders.has(folder.path)) {
        this.selectedFolders.delete(folder.path);
      } else {
        this.selectedFolders.set(folder.path, folder);
      }
    }
  }

  private toggleSelectAll(): void {
    if (!this.selectMode) {
      return;
    }

    const allFolders = this.resultsService.results;
    const totalFolders = allFolders.length;
    const selectedCount = this.selectedFolders.size;

    // If all folders are selected, deselect all
    // If some or none are selected, select all
    if (selectedCount === totalFolders) {
      this.selectedFolders.clear();
    } else {
      allFolders.forEach((folder) => {
        this.selectedFolders.set(folder.path, folder);
      });
    }
  }

  private handleSpacePress(): void {
    if (!this.selectMode) {
      this.delete();
      return;
    }

    this.toggleFolderSelection();
  }

  private toggleFolderSelection(): void {
    const folder = this.resultsService.results[this.resultIndex];
    if (!folder) {
      return;
    }

    if (this.selectedFolders.has(folder.path)) {
      this.selectedFolders.delete(folder.path);
    } else {
      this.selectedFolders.set(folder.path, folder);
    }
  }

  private applyRangeSelection(): void {
    if (
      !this.selectMode ||
      !this.isRangeSelectionMode ||
      this.rangeSelectionStart === null
    ) {
      return;
    }

    const start = Math.min(this.rangeSelectionStart, this.resultIndex);
    const end = Math.max(this.rangeSelectionStart, this.resultIndex);

    const firstFolder = this.resultsService.results[this.rangeSelectionStart];
    if (!firstFolder) {
      return;
    }

    const shouldSelect = this.selectedFolders.has(firstFolder.path);

    for (let i = start; i <= end; i++) {
      const folder = this.resultsService.results[i];
      if (!folder) {
        continue;
      }

      if (shouldSelect) {
        this.selectedFolders.set(folder.path, folder);
      } else {
        this.selectedFolders.delete(folder.path);
      }
    }
  }

  private deleteSelected(): void {
    if (!this.selectMode || this.selectedFolders.size === 0) {
      return;
    }

    const selectedFolders = this.selectedFolders.entries();
    for (const [, folder] of selectedFolders) {
      this.delete$.next(folder);
    }
    this.selectedFolders.clear();
  }

  onKeyInput({ name }: IKeyPress): void {
    const action: (() => void) | undefined = this.KEYS[name];
    if (action === undefined) {
      return;
    }
    action();

    if (this.visible) {
      this.render();
    }
  }

  render(): void {
    if (!this.visible) {
      return;
    }

    if (!this.haveResultsAfterCompleted) {
      this.noResults();
      return;
    }

    this.printResults();

    const tagStartXPosition = 16;
    // 14 for the selection counter, 56 for the instruction message
    const clearSelectionCounterText = ' '.repeat(14 + 56);
    this.printAt(clearSelectionCounterText, {
      x: tagStartXPosition,
      y: MARGINS.ROW_RESULTS_START - 2,
    });
    if (this.selectMode) {
      const selectedMessage = ` ${this.selectedFolders.size} selected `;
      this.printAt(pc.bgYellow(pc.black(selectedMessage)), {
        x: tagStartXPosition,
        y: MARGINS.ROW_RESULTS_START - 2,
      });

      const instructionMessage = pc.gray(
        pc.bold('SPACE') +
          ': toggle | ' +
          pc.bold('v') +
          ': range | ' +
          pc.bold('a') +
          ': select all | ' +
          pc.bold('ENTER') +
          ': delete',
      );
      this.printAt(instructionMessage, {
        x: tagStartXPosition + selectedMessage.length + 1,
        y: MARGINS.ROW_RESULTS_START - 2,
      });
    }

    this.printScrollBar();
    this.flush();
  }

  clear(): void {
    this.resetBufferState();
    for (let row = MARGINS.ROW_RESULTS_START; row < this.terminal.rows; row++) {
      this.clearLine(row);
    }
  }

  completeSearch(): void {
    if (this.resultsService.results.length === 0) {
      this.haveResultsAfterCompleted = false;
      this.render();
    }
  }

  private printResults(): void {
    const visibleFolders = this.getVisibleScrollFolders();

    visibleFolders.forEach((folder: CliScanFoundFolder, index: number) => {
      const row = MARGINS.ROW_RESULTS_START + index;
      this.printFolderRow(folder, row);
    });
  }

  private noResults(): void {
    const targetFolderColored: string = pc[DEFAULT_CONFIG.warningColor](
      this.config.targets.join(', '),
    );
    const message = `No ${targetFolderColored} found!`;
    this.printAt(message, {
      x: Math.floor(this.terminal.columns / 2 - message.length / 2),
      y: MARGINS.ROW_RESULTS_START + 2,
    });
  }

  private printFolderRow(folder: CliScanFoundFolder, row: number): void {
    this.clearLine(row);
    let { path, lastModification, size } = this.getFolderTexts(folder);
    const isRowSelected = row === this.getRealCursorPosY();

    lastModification = pc.gray(lastModification);

    // Adjust column start based on select mode
    const pathColumnStart = this.selectMode
      ? MARGINS.FOLDER_COLUMN_START + 1
      : MARGINS.FOLDER_COLUMN_START;

    if (isRowSelected) {
      path = pc[CURSOR_ROW_COLOR](path);
      size = pc[CURSOR_ROW_COLOR](size);
      lastModification = pc[CURSOR_ROW_COLOR](lastModification);

      this.paintBgRow(row);
    } else if (isRowSelected && this.selectMode) {
      this.paintCursorCell(row);
    }

    if (folder.riskAnalysis?.isSensitive) {
      path += '⚠️';
    }

    const isFolderSelected = this.selectedFolders.has(folder.path);
    if (folder.riskAnalysis?.isSensitive) {
      path = pc[isFolderSelected ? 'blue' : DEFAULT_CONFIG.warningColor](path);
    } else if (!isRowSelected && isFolderSelected) {
      path = pc.blue(path);
    }

    if (this.selectMode && this.selectedFolders.has(folder.path)) {
      this.rangeSelectedCursor(row);
    }

    if (this.selectMode && this.isRangeSelectionMode && isRowSelected) {
      this.selectionCursor(row);
    }

    this.printAt(path, {
      x: pathColumnStart,
      y: row,
    });
    this.printAt(lastModification, {
      x: this.terminal.columns - MARGINS.FOLDER_SIZE_COLUMN - 4,
      y: row,
    });
    this.printAt(size, {
      x: this.terminal.columns - MARGINS.FOLDER_SIZE_COLUMN,
      y: row,
    });
  }

  private paintCursorCell(row: number): void {
    this.printAt(pc[CURSOR_ROW_COLOR](' '), {
      x: MARGINS.FOLDER_COLUMN_START - 1,
      y: row,
    });
  }

  private rangeSelectedCursor(row: number): void {
    this.printAt('●', {
      x: MARGINS.FOLDER_COLUMN_START,
      y: row,
    });
  }

  private selectionCursor(row: number): void {
    const indicator = this.isRangeSelectionMode ? '●' : ' ';
    this.printAt(pc.yellow(indicator), {
      x: MARGINS.FOLDER_COLUMN_START - 1,
      y: row,
    });
  }

  private getFolderTexts(folder: CliScanFoundFolder): {
    path: string;
    size: string;
    lastModification: string;
  } {
    const folderText = this.getFolderPathText(folder);
    const formattedSize = formatSize(
      folder.size,
      this.config.sizeUnit,
      DECIMALS_SIZE,
    );
    let daysSinceLastModification: string;

    if (folder.modificationTime !== null && folder.modificationTime > 0) {
      daysSinceLastModification = `${Math.floor(
        (new Date().getTime() / 1000 - folder.modificationTime) / 86400,
      )}d`;
    } else {
      daysSinceLastModification = pc.bgBlack('calc');
    }

    if (folder.riskAnalysis?.isSensitive) {
      daysSinceLastModification = '';
    }

    // Align to right
    const alignMargin = 4 - daysSinceLastModification.length;
    daysSinceLastModification =
      ' '.repeat(alignMargin > 0 ? alignMargin : 0) + daysSinceLastModification;

    const OFFSET_COLUMN = 9;
    let folderSize = formattedSize.text;

    // Right-align size text
    const sizeLength = folderSize.length;
    const spacePadding = ' '.repeat(Math.max(0, OFFSET_COLUMN - sizeLength));
    folderSize = `${spacePadding}${folderSize}`;

    const folderSizeText =
      folder.size > 0 ? folderSize : pc.bgBlack(pc.gray(' calc... '));

    return {
      path: folderText,
      size: folderSizeText,
      lastModification: daysSinceLastModification,
    };
  }

  cursorUp(): void {
    this.moveCursor(-1);
  }

  cursorDown(): void {
    this.moveCursor(1);
  }

  cursorPageUp(): void {
    const resultsInPage = this.getRowsAvailable();
    this.moveCursor(-(resultsInPage - 2));
  }

  cursorPageDown(): void {
    const resultsInPage = this.getRowsAvailable();
    this.moveCursor(resultsInPage - 2);
  }

  cursorFirstResult(): void {
    this.moveCursor(-this.resultIndex);
  }

  cursorLastResult(): void {
    this.moveCursor(this.resultsService.results.length - 1);
  }

  fitScroll(): void {
    const shouldScrollUp =
      this.getRow(this.resultIndex) <
      MARGINS.ROW_RESULTS_START + this.scroll + 1;

    const shouldScrollDown =
      this.getRow(this.resultIndex) > this.terminal.rows + this.scroll - 2;

    const isOnBotton =
      this.resultIndex === this.resultsService.results.length - 1;

    let scrollRequired = 0;

    if (shouldScrollUp) {
      scrollRequired =
        this.getRow(this.resultIndex) -
        MARGINS.ROW_RESULTS_START -
        this.scroll -
        1;
    } else if (shouldScrollDown) {
      scrollRequired =
        this.getRow(this.resultIndex) - this.terminal.rows - this.scroll + 2;

      if (isOnBotton) {
        scrollRequired -= 1;
      }
    }

    if (scrollRequired !== 0) {
      this.scrollFolderResults(scrollRequired);
    }
  }

  scrollFolderResults(scrollAmount: number): void {
    const virtualFinalScroll = this.scroll + scrollAmount;
    this.scroll = this.clamp(
      virtualFinalScroll,
      0,
      this.resultsService.results.length,
    );
    this.clear();
  }

  private moveCursor(index: number): void {
    this.previousIndex = this.resultIndex;
    this.resultIndex += index;

    // Upper limit
    if (this.isCursorInLowerLimit()) {
      this.resultIndex = 0;
    }

    // Lower limit
    if (this.isCursorInUpperLimit()) {
      this.resultIndex = this.resultsService.results.length - 1;
    }

    this.fitScroll();

    if (this.isRangeSelectionMode) {
      this.applyRangeSelection();
    }
  }

  private getFolderPathText(folder: CliScanFoundFolder): string {
    let cutFrom = OVERFLOW_CUT_FROM;
    let text = folder.path;
    const ACTIONS = {
      deleted: () => {
        cutFrom += INFO_MSGS.DELETED_FOLDER.length;
        text = INFO_MSGS.DELETED_FOLDER + text;
      },
      deleting: () => {
        cutFrom += INFO_MSGS.DELETING_FOLDER.length;
        text = INFO_MSGS.DELETING_FOLDER + text;
      },
      'error-deleting': () => {
        cutFrom += INFO_MSGS.ERROR_DELETING_FOLDER.length;
        text = INFO_MSGS.ERROR_DELETING_FOLDER + text;
      },
    };

    if (ACTIONS[folder.status] !== undefined) {
      ACTIONS[folder.status]();
    }

    // Adjust text width based if select mode is enabled
    const columnEnd = this.selectMode
      ? MARGINS.FOLDER_COLUMN_END + 1
      : MARGINS.FOLDER_COLUMN_END;

    text = this.consoleService.shortenText(
      text,
      this.terminal.columns - columnEnd,
      cutFrom,
    );

    // This is necessary for the coloring of the text, since
    // the shortener takes into ansi-scape codes invisible
    // characters and can cause an error in the cli.
    text = this.paintStatusFolderPath(text, folder.status);

    return text;
  }

  private paintStatusFolderPath(folderString: string, action: string): string {
    const TRANSFORMATIONS = {
      deleted: (text) =>
        text.replace(
          INFO_MSGS.DELETED_FOLDER,
          pc.green(INFO_MSGS.DELETED_FOLDER),
        ),
      deleting: (text) =>
        text.replace(
          INFO_MSGS.DELETING_FOLDER,
          pc.yellow(INFO_MSGS.DELETING_FOLDER),
        ),
      'error-deleting': (text) =>
        text.replace(
          INFO_MSGS.ERROR_DELETING_FOLDER,
          pc.red(INFO_MSGS.ERROR_DELETING_FOLDER),
        ),
    };

    return TRANSFORMATIONS[action] !== undefined
      ? TRANSFORMATIONS[action](folderString)
      : folderString;
  }

  private printScrollBar(): void {
    const SCROLLBAR_ACTIVE = pc.gray('█');
    const SCROLLBAR_BG = pc.gray('░');

    const totalResults = this.resultsService.results.length;
    const visibleRows = this.getRowsAvailable();

    if (totalResults <= visibleRows) {
      return;
    }

    const scrollPercentage = this.scroll / (totalResults - visibleRows);
    const start = MARGINS.ROW_RESULTS_START;
    const end = this.terminal.rows - 1;
    const scrollBarPosition = Math.round(
      scrollPercentage * (end - start) + start,
    );

    for (let i = start; i <= end; i++) {
      this.printAt(SCROLLBAR_BG, {
        x: this.terminal.columns - 1,
        y: i,
      });
    }

    this.printAt(SCROLLBAR_ACTIVE, {
      x: this.terminal.columns - 1,
      y: scrollBarPosition,
    });
  }

  private isCursorInLowerLimit(): boolean {
    return this.resultIndex < 0;
  }

  private isCursorInUpperLimit(): boolean {
    return this.resultIndex >= this.resultsService.results.length;
  }

  private getRealCursorPosY(): number {
    return this.getRow(this.resultIndex) - this.scroll;
  }

  private getVisibleScrollFolders(): CliScanFoundFolder[] {
    return this.resultsService.results.slice(
      this.scroll,
      this.getRowsAvailable() + this.scroll,
    );
  }

  private paintBgRow(row: number): void {
    const startPaint = MARGINS.FOLDER_COLUMN_START;
    const endPaint = this.terminal.columns - MARGINS.FOLDER_SIZE_COLUMN;
    let paintSpaces = '';

    for (let i = startPaint; i < endPaint; ++i) {
      paintSpaces += ' ';
    }

    this.printAt(pc[CURSOR_ROW_COLOR](paintSpaces), {
      x: startPaint,
      y: row,
    });
  }

  private delete(): void {
    const folder = this.resultsService.results[this.resultIndex];
    this.delete$.next(folder);
  }

  /** Returns the number of results that can be displayed. */
  private getRowsAvailable(): number {
    return this.terminal.rows - MARGINS.ROW_RESULTS_START;
  }

  /** Returns the row to which the index corresponds. */
  private getRow(index: number): number {
    return index + MARGINS.ROW_RESULTS_START;
  }

  private showErrorsPopup(): void {
    this.showErrors$.next(null);
  }

  private clamp(num: number, min: number, max: number): number {
    return Math.min(Math.max(num, min), max);
  }
}
