import {
  DECIMALS_SIZE,
  DEFAULT_CONFIG,
  MARGINS,
  OVERFLOW_CUT_FROM,
} from '../constants/main.constants.js';
import { INFO_MSGS } from '../constants/messages.constants.js';
import { IFolder } from '../interfaces/folder.interface.js';
import { ResultsService } from '../services/results.service.js';
import { InteractiveUi, Ui } from './ui.js';
import colors from 'colors';
import { ConsoleService } from '../services/console.service.js';
import { FileService } from '../services/index.js';
import { IConfig } from '../interfaces/config.interface.js';
import { Subject } from 'rxjs';
import { IKeyPress } from 'src/interfaces/key-press.interface.js';

export class ResultsUi extends Ui implements InteractiveUi {
  haveResultsAfterCompleted = true;
  cursorPosY = MARGINS.ROW_RESULTS_START;
  previusCursorPosY = MARGINS.ROW_RESULTS_START;
  scroll: number = 0;

  readonly delete$ = new Subject<IFolder>();
  readonly showErrors$ = new Subject<null>();

  private config: IConfig = DEFAULT_CONFIG;
  private KEYS = {
    up: () => this.moveCursorUp(),
    down: () => this.moveCursorDown(),
    space: () => this.delete(),
    j: () => this.moveCursorDown(),
    k: () => this.moveCursorUp(),
    h: () => this.moveCursorPageDown(),
    l: () => this.moveCursorPageUp(),
    d: () => this.moveCursorPageDown(),
    u: () => this.moveCursorPageUp(),
    pageup: () => this.moveCursorPageUp(),
    pagedown: () => this.moveCursorPageDown(),
    home: () => this.moveCursorFirstResult(),
    end: () => this.moveCursorLastResult(),
    e: () => this.showErrorsPopup(),
  };

  constructor(
    private resultsService: ResultsService,
    private consoleService: ConsoleService,
    private fileService: FileService,
  ) {
    super();
  }

  onKeyInput({ name }: IKeyPress): void {
    const action = this.KEYS[name];
    if (!action) {
      return;
    }
    action();
    this.render();
  }

  render() {
    if (!this.haveResultsAfterCompleted) {
      this.noResults();
      return;
    }

    this.printResults();
  }

  clear() {
    for (let row = MARGINS.ROW_RESULTS_START; row < this.stdout.rows; row++) {
      this.clearLine(row);
    }
  }

  completeSearch() {
    if (this.resultsService.results.length === 0) {
      this.haveResultsAfterCompleted = false;
      this.render();
    }
  }

  private printResults() {
    const visibleFolders = this.getVisibleScrollFolders();
    this.clearLine(this.previusCursorPosY);

    visibleFolders.map((folder: IFolder, index: number) => {
      const folderRow = MARGINS.ROW_RESULTS_START + index;
      this.printFolderRow(folder, folderRow);
    });
  }

  private noResults() {
    const message = `No ${colors[DEFAULT_CONFIG.warningColor](
      this.config.targetFolder,
    )} found!`;
    this.printAt(message, {
      x: Math.floor(this.stdout.columns / 2 - message.length / 2),
      y: MARGINS.ROW_RESULTS_START + 2,
    });
  }

  private printFolderRow(folder: IFolder, row: number) {
    let { path, lastModification, size } = this.getFolderTexts(folder);
    const isRowSelected = row === this.getRealCursorPosY();

    lastModification = colors.gray(lastModification);
    if (isRowSelected) {
      path = colors[this.config.backgroundColor](path);
      size = colors[this.config.backgroundColor](size);
      lastModification = colors[this.config.backgroundColor](lastModification);

      this.paintBgRow(row);
    }

    if (folder.isDangerous)
      path = colors[DEFAULT_CONFIG.warningColor](path + '⚠️');

    this.printAt(path, {
      x: MARGINS.FOLDER_COLUMN_START,
      y: row,
    });

    this.printAt(lastModification, {
      x: this.stdout.columns - MARGINS.FOLDER_SIZE_COLUMN - 6,
      y: row,
    });

    this.printAt(size, {
      x: this.stdout.columns - MARGINS.FOLDER_SIZE_COLUMN,
      y: row,
    });
  }

  private getFolderTexts(folder: IFolder): {
    path: string;
    size: string;
    lastModification: string;
  } {
    const folderText = this.getFolderPathText(folder);
    let folderSize = `${folder.size.toFixed(DECIMALS_SIZE)} GB`;
    let daysSinceLastModification =
      folder.modificationTime !== null && folder.modificationTime > 0
        ? Math.floor(
            (new Date().getTime() / 1000 - folder.modificationTime) / 86400,
          ) + 'd'
        : '--';

    if (folder.isDangerous) daysSinceLastModification = 'xxx';

    // Align to right
    const alignMargin = 4 - daysSinceLastModification.length;
    daysSinceLastModification =
      ' '.repeat(alignMargin > 0 ? alignMargin : 0) + daysSinceLastModification;

    if (!this.config.folderSizeInGB) {
      const size = this.fileService.convertGBToMB(folder.size);
      folderSize = `${size.toFixed(DECIMALS_SIZE)} MB`;
    }

    const folderSizeText = folder.size ? folderSize : '--';

    return {
      path: folderText,
      size: folderSizeText,
      lastModification: daysSinceLastModification,
    };
  }

  moveCursorUp(): void {
    if (this.isCursorInUpperTextLimit(this.cursorPosY)) {
      this.previusCursorPosY = this.getRealCursorPosY();
      this.cursorPosY--;
      this.fitScroll();
    }
  }

  moveCursorDown(): void {
    if (this.isCursorInLowerTextLimit(this.cursorPosY)) {
      this.previusCursorPosY = this.getRealCursorPosY();
      this.cursorPosY++;
      this.fitScroll();
    }
  }

  moveCursorPageUp(): void {
    this.previusCursorPosY = this.getRealCursorPosY();
    const resultsInPage = this.stdout.rows - MARGINS.ROW_RESULTS_START;
    this.cursorPosY -= resultsInPage - 1;
    if (this.cursorPosY - MARGINS.ROW_RESULTS_START < 0)
      this.cursorPosY = MARGINS.ROW_RESULTS_START;
    this.fitScroll();
  }

  moveCursorPageDown(): void {
    this.previusCursorPosY = this.getRealCursorPosY();
    const resultsInPage = this.stdout.rows - MARGINS.ROW_RESULTS_START;
    const foldersAmmount = this.resultsService.results.length;
    this.cursorPosY += resultsInPage - 1;
    if (this.cursorPosY - MARGINS.ROW_RESULTS_START > foldersAmmount)
      this.cursorPosY = foldersAmmount + MARGINS.ROW_RESULTS_START - 1;
    this.fitScroll();
  }

  moveCursorFirstResult(): void {
    this.previusCursorPosY = this.getRealCursorPosY();
    this.cursorPosY = MARGINS.ROW_RESULTS_START;
    this.fitScroll();
  }

  moveCursorLastResult(): void {
    this.previusCursorPosY = this.getRealCursorPosY();
    this.cursorPosY =
      MARGINS.ROW_RESULTS_START + this.resultsService.results.length - 1;
    this.fitScroll();
  }

  fitScroll(): void {
    const shouldScrollUp =
      this.cursorPosY < MARGINS.ROW_RESULTS_START + this.scroll + 1;
    const shouldScrollDown =
      this.cursorPosY > this.stdout.rows + this.scroll - 2;
    let scrollRequired = 0;

    if (shouldScrollUp)
      scrollRequired =
        this.cursorPosY - MARGINS.ROW_RESULTS_START - this.scroll - 1;
    else if (shouldScrollDown) {
      scrollRequired = this.cursorPosY - this.stdout.rows - this.scroll + 2;
    }

    if (scrollRequired) this.scrollFolderResults(scrollRequired);
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

  private getFolderPathText(folder: IFolder): string {
    let cutFrom = OVERFLOW_CUT_FROM;
    let text = folder.path;
    const ACTIONS = {
      // tslint:disable-next-line: object-literal-key-quotes
      deleted: () => {
        cutFrom += INFO_MSGS.DELETED_FOLDER.length;
        text = INFO_MSGS.DELETED_FOLDER + text;
      },
      // tslint:disable-next-line: object-literal-key-quotes
      deleting: () => {
        cutFrom += INFO_MSGS.DELETING_FOLDER.length;
        text = INFO_MSGS.DELETING_FOLDER + text;
      },
      'error-deleting': () => {
        cutFrom += INFO_MSGS.ERROR_DELETING_FOLDER.length;
        text = INFO_MSGS.ERROR_DELETING_FOLDER + text;
      },
    };

    if (ACTIONS[folder.status]) ACTIONS[folder.status]();

    text = this.consoleService.shortenText(
      text,
      this.stdout.columns - MARGINS.FOLDER_COLUMN_END,
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
      // tslint:disable-next-line: object-literal-key-quotes
      deleted: (text) =>
        text.replace(
          INFO_MSGS.DELETED_FOLDER,
          colors.green(INFO_MSGS.DELETED_FOLDER),
        ),
      // tslint:disable-next-line: object-literal-key-quotes
      deleting: (text) =>
        text.replace(
          INFO_MSGS.DELETING_FOLDER,
          colors.yellow(INFO_MSGS.DELETING_FOLDER),
        ),
      'error-deleting': (text) =>
        text.replace(
          INFO_MSGS.ERROR_DELETING_FOLDER,
          colors.red(INFO_MSGS.ERROR_DELETING_FOLDER),
        ),
    };

    return TRANSFORMATIONS[action]
      ? TRANSFORMATIONS[action](folderString)
      : folderString;
  }

  private isCursorInLowerTextLimit(positionY: number): boolean {
    const foldersAmmount = this.resultsService.results.length;
    return positionY < foldersAmmount - 1 + MARGINS.ROW_RESULTS_START;
  }

  private isCursorInUpperTextLimit(positionY: number): boolean {
    return positionY > MARGINS.ROW_RESULTS_START;
  }

  private getRealCursorPosY(): number {
    return this.cursorPosY - this.scroll;
  }

  private getVisibleScrollFolders(): IFolder[] {
    return this.resultsService.results.slice(
      this.scroll,
      this.stdout.rows - MARGINS.ROW_RESULTS_START + this.scroll,
    );
  }

  private paintBgRow(row: number) {
    const startPaint = MARGINS.FOLDER_COLUMN_START;
    const endPaint = this.stdout.columns - MARGINS.FOLDER_SIZE_COLUMN;
    let paintSpaces = '';

    for (let i = startPaint; i < endPaint; ++i) {
      paintSpaces += ' ';
    }

    this.printAt(colors[this.config.backgroundColor](paintSpaces), {
      x: startPaint,
      y: row,
    });
  }

  private delete() {
    const folder =
      this.resultsService.results[this.cursorPosY - MARGINS.ROW_RESULTS_START];

    if (!folder) {
      return;
    }

    this.delete$.next(folder);
  }

  private showErrorsPopup() {
    this.showErrors$.next(null);
  }

  private clamp(num: number, min: number, max: number) {
    return Math.min(Math.max(num, min), max);
  }
}
