import {
  BANNER,
  DECIMALS_SIZE,
  DEFAULT_CONFIG,
  DEFAULT_SIZE,
  MARGINS,
  MIN_CLI_COLUMNS_SIZE,
  OVERFLOW_CUT_FROM,
  UI_HELP,
  UI_POSITIONS,
  VALID_KEYS,
} from './constants/index.js';
import { COLORS, HELP_WARNING, OPTIONS } from './constants/cli.constants.js';
import {
  ConsoleService,
  FileService,
  ResultsService,
  SpinnerService,
  UpdateService,
} from './services/index.js';
import {
  ERROR_MSG,
  HELP_MSGS,
  INFO_MSGS,
} from './constants/messages.constants.js';
import {
  IConfig,
  IFolder,
  IKeyPress,
  IKeysCommand,
  IListDirParams,
  IPosition,
} from './interfaces/index.js';
import { Observable, Subject, from, interval } from 'rxjs';
import { SPINNERS, SPINNER_INTERVAL } from './constants/spinner.constants.js';
import {
  catchError,
  filter,
  map,
  mergeMap,
  takeUntil,
  tap,
} from 'rxjs/operators';

import { FOLDER_SORT } from './constants/sort.result.js';
import ansiEscapes from 'ansi-escapes';
import { bufferUntil } from './libs/buffer-until.js';
import colors from 'colors';
import keypress from 'keypress';
import __dirname from './dirname.js';

export class Controller {
  private folderRoot = '';
  private stdin: NodeJS.ReadStream = process.stdin;
  private stdout: NodeJS.WriteStream = process.stdout;
  private config: IConfig = DEFAULT_CONFIG;

  private cursorPosY = MARGINS.ROW_RESULTS_START;
  private previusCursorPosY = MARGINS.ROW_RESULTS_START;

  private scroll: number = 0;

  private finishSearching$: Subject<boolean> = new Subject<boolean>();

  private KEYS: IKeysCommand = {
    up: this.moveCursorUp.bind(this),
    // tslint:disable-next-line: object-literal-sort-keys
    down: this.moveCursorDown.bind(this),
    space: this.delete.bind(this),
    j: this.moveCursorDown.bind(this),
    k: this.moveCursorUp.bind(this),

    execute(command: string, params: string[]) {
      return this[command](params);
    },
  };

  constructor(
    private fileService: FileService,
    private spinnerService: SpinnerService,
    private consoleService: ConsoleService,
    private updateService: UpdateService,
    private resultsService: ResultsService,
  ) {}

  init(): void {
    keypress(process.stdin);
    this.setErrorEvents();
    this.getArguments();
    this.prepareScreen();
    this.setupEventsListener();
    this.initializeLoadingStatus();
    if (this.config.checkUpdates) this.checkVersion();

    this.scan();
  }

  private getArguments(): void {
    const options = this.consoleService.getParameters(process.argv);
    if (options['help']) {
      this.showHelp();
      process.exit();
    }
    if (options['version']) {
      this.showProgramVersion();
      process.exit();
    }
    if (options['delete-all']) {
      this.showObsoleteMessage();
      process.exit();
    }
    if (options['sort-by']) {
      if (!this.isValidSortParam(options['sort-by'])) {
        this.print(INFO_MSGS.NO_VALID_SORT_NAME);
        process.exit();
      }
      this.config.sortBy = options['sort-by'];
    }

    const exclude = options['exclude'];

    if (exclude && typeof exclude === 'string') {
      this.config.exclude = this.consoleService
        .splitData(this.consoleService.replaceString(exclude, '"', ''), ',')
        .map((file) => file.trim())
        .filter(Boolean);
    }

    this.folderRoot = options['directory']
      ? options['directory']
      : process.cwd();
    if (options['full-scan']) this.folderRoot = this.getUserHomePath();
    if (options['show-errors']) this.config.showErrors = true;
    if (options['gb']) this.config.folderSizeInGB = true;
    if (options['no-check-updates']) this.config.checkUpdates = false;
    if (options['target-folder'])
      this.config.targetFolder = options['target-folder'];
    if (options['bg-color']) this.setColor(options['bg-color']);

    // Remove trailing slash from folderRoot for consistency
    this.folderRoot = this.folderRoot.replace(/[\/\\]$/, '');
  }

  private showHelp(): void {
    this.clear();
    this.print(colors.inverse(INFO_MSGS.HELP_TITLE + '\n\n'));

    let lineCount = 0;
    OPTIONS.map((option, index) => {
      this.printAtHelp(
        option.arg.reduce((text, arg) => text + ', ' + arg),
        {
          x: UI_HELP.X_COMMAND_OFFSET,
          y: index + UI_HELP.Y_OFFSET + lineCount,
        },
      );
      const description = this.consoleService.splitWordsByWidth(
        option.description,
        this.stdout.columns - UI_HELP.X_DESCRIPTION_OFFSET,
      );

      description.map((line) => {
        this.printAtHelp(line, {
          x: UI_HELP.X_DESCRIPTION_OFFSET,
          y: index + UI_HELP.Y_OFFSET + lineCount,
        });
        ++lineCount;
      });
    });

    this.printAt(HELP_WARNING, {
      x: 0,
      y: lineCount * 2 + 2,
    });
  }

  private showProgramVersion(): void {
    this.print('v' + this.getVersion());
  }

  private showObsoleteMessage(): void {
    this.print(INFO_MSGS.DISABLED);
  }

  private setColor(color: string) {
    if (this.isValidColor(color)) this.config.backgroundColor = COLORS[color];
  }

  private isValidColor(color: string) {
    return Object.keys(COLORS).some((validColor) => validColor === color);
  }

  private isValidSortParam(sortName: string): boolean {
    return Object.keys(FOLDER_SORT).includes(sortName);
  }

  private getVersion(): string {
    const packageJson = __dirname + '/../package.json';

    const packageData = JSON.parse(
      this.fileService.getFileContent(packageJson),
    );
    return packageData.version;
  }

  private clear(): void {
    this.print(ansiEscapes.clearTerminal);
  }

  private print(text: string): void {
    process.stdout.write.bind(process.stdout)(text);
  }

  private prepareScreen(): void {
    this.checkScreenRequirements();
    this.setRawMode();
    this.clear();
    this.printUI();
    this.hideCursor();
  }

  private checkScreenRequirements(): void {
    if (this.isTerminalTooSmall()) {
      this.print(INFO_MSGS.MIN_CLI_CLOMUNS);
      process.exit();
    }
    if (!this.stdout.isTTY) {
      this.print(INFO_MSGS.NO_TTY);
      process.exit();
    }
  }

  private checkVersion(): void {
    this.updateService
      .isUpdated(this.getVersion())
      .then((isUpdated: boolean) => {
        if (!isUpdated) this.showNewInfoMessage();
      })
      .catch((err) => {
        const errorMessage =
          ERROR_MSG.CANT_GET_REMOTE_VERSION + ': ' + err.message;
        this.printError(errorMessage);
      });
  }

  private showNewInfoMessage(): void {
    const message = colors.magenta(INFO_MSGS.NEW_UPDATE_FOUND);
    this.printAt(message, UI_POSITIONS.NEW_UPDATE_FOUND);
  }

  private isTerminalTooSmall(): boolean {
    return this.stdout.columns <= MIN_CLI_COLUMNS_SIZE;
  }

  private setRawMode(set = true): void {
    this.stdin.setRawMode(set);
    process.stdin.resume();
  }

  private printUI(): void {
    ///////////////////////////
    // banner and tutorial
    this.printAt(BANNER, UI_POSITIONS.INITIAL);
    this.printAt(
      colors.yellow(colors.inverse(HELP_MSGS.BASIC_USAGE)),
      UI_POSITIONS.TUTORIAL_TIP,
    );

    ///////////////////////////
    // folder size header
    this.printAt(colors.gray(INFO_MSGS.HEADER_SIZE_COLUMN), {
      x:
        this.stdout.columns -
        (MARGINS.FOLDER_SIZE_COLUMN +
          Math.round(INFO_MSGS.HEADER_SIZE_COLUMN.length / 5)),
      y: UI_POSITIONS.FOLDER_SIZE_HEADER.y,
    });

    ///////////////////////////
    // npkill stats
    this.printAt(
      colors.gray(INFO_MSGS.TOTAL_SPACE + DEFAULT_SIZE),
      UI_POSITIONS.TOTAL_SPACE,
    );
    this.printAt(
      colors.gray(INFO_MSGS.SPACE_RELEASED + DEFAULT_SIZE),
      UI_POSITIONS.SPACE_RELEASED,
    );
  }

  private printAt(message: string, position: IPosition): void {
    this.setCursorAt(position);
    this.print(message);
  }

  private setCursorAt({ x, y }: IPosition): void {
    this.print(ansiEscapes.cursorTo(x, y));
  }

  private printAtHelp(message: string, position: IPosition): void {
    this.setCursorAtHelp(position);
    this.print(message);
    if (!/-[a-zA-Z]/.test(message.substring(0, 2)) && message !== '') {
      this.print('\n\n');
    }
  }

  private setCursorAtHelp({ x, y }: IPosition): void {
    this.print(ansiEscapes.cursorTo(x));
  }

  private initializeLoadingStatus(): void {
    this.spinnerService.setSpinner(SPINNERS.W10);
    interval(SPINNER_INTERVAL)
      .pipe(takeUntil(this.finishSearching$))
      .subscribe(
        () =>
          this.updateStatus(
            INFO_MSGS.SEARCHING + this.spinnerService.nextFrame(),
          ),
        (error) => this.printError(error),
      );
  }

  private updateStatus(text: string): void {
    this.printAt(text, UI_POSITIONS.STATUS);
  }

  private printFoldersSection(): void {
    const visibleFolders = this.getVisibleScrollFolders();
    this.clearLine(this.previusCursorPosY);

    visibleFolders.map((folder: IFolder, index: number) => {
      const folderRow = MARGINS.ROW_RESULTS_START + index;
      this.printFolderRow(folder, folderRow);
    });
  }

  private printFolderRow(folder: IFolder, row: number) {
    let { path, size } = this.getFolderTexts(folder);
    const isRowSelected = row === this.getRealCursorPosY();

    if (isRowSelected) {
      path = colors[this.config.backgroundColor](path);
      size = colors[this.config.backgroundColor](size);
      this.paintBgRow(row);
    }

    if (folder.isDangerous)
      path = colors[DEFAULT_CONFIG.warningColor](path + '⚠️');

    this.printAt(path, {
      x: MARGINS.FOLDER_COLUMN_START,
      y: row,
    });

    this.printAt(size, {
      x: this.stdout.columns - MARGINS.FOLDER_SIZE_COLUMN,
      y: row,
    });
  }

  private getFolderTexts(folder: IFolder): { path: string; size: string } {
    const folderText = this.getFolderPathText(folder);
    let folderSize = `${folder.size.toFixed(DECIMALS_SIZE)} GB`;

    if (!this.config.folderSizeInGB) {
      const size = this.fileService.convertGBToMB(folder.size);
      folderSize = `${size.toFixed(DECIMALS_SIZE)} MB`;
    }

    const folderSizeText = folder.size ? folderSize : '--';

    return {
      path: folderText,
      size: folderSizeText,
    };
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

  private clearFolderSection(): void {
    for (let row = MARGINS.ROW_RESULTS_START; row < this.stdout.rows; row++) {
      this.clearLine(row);
    }
  }

  private setupEventsListener(): void {
    this.stdin.on('keypress', (ch, key) => {
      if (key && key['name']) this.keyPress(key);
    });

    this.stdout.on('resize', () => {
      this.clear();
      this.printUI();
      this.printStats();
      this.printFoldersSection();
    });
  }

  private keyPress(key: IKeyPress) {
    const { name, ctrl } = key;

    if (this.isQuitKey(ctrl, name)) this.quit();

    const command = this.getCommand(name);
    if (command) this.KEYS.execute(name);

    if (name !== 'space') this.printFoldersSection();
  }

  private setErrorEvents(): void {
    process.on('uncaughtException', (err) => {
      this.printError(err.message);
    });
    process.on('unhandledRejection', (reason: {}) => {
      this.printError(reason['stack']);
    });
  }

  private hideCursor(): void {
    this.print(ansiEscapes.cursorHide);
  }

  private showCursor(): void {
    this.print(ansiEscapes.cursorShow);
  }

  private scan(): void {
    const params: IListDirParams = this.prepareListDirParams();
    const isChunkCompleted = (chunk: string) =>
      chunk.endsWith(this.config.targetFolder + '\n');
    const folders$ = this.fileService.listDir(params);

    folders$
      .pipe(
        catchError((error, caught) => {
          if (error.bash) {
            this.printFolderError(error.message);
            return caught;
          }
          throw error;
        }),
        map((buffer) => buffer.toString()),
        bufferUntil((chunk) => isChunkCompleted(chunk)),
        mergeMap((dataFolder) =>
          from(this.consoleService.splitData(dataFolder)),
        ),
        filter((path) => !!path),
        map<string, IFolder>((path) => ({
          path,
          size: 0,
          isDangerous: this.fileService.isDangerous(path),
          status: 'live',
        })),
        tap((nodeFolder) => {
          this.resultsService.addResult(nodeFolder);

          if (this.config.sortBy === 'path') {
            this.resultsService.sortResults(this.config.sortBy);
            this.clearFolderSection();
          }
        }),
        mergeMap((nodeFolder) => this.calculateFolderStats(nodeFolder), 4),
      )
      .subscribe(
        () => this.printFoldersSection(),
        (error) => this.printError(error),
        () => this.completeSearch(),
      );
  }

  private prepareListDirParams(): IListDirParams {
    const target = this.config.targetFolder;
    const params = {
      path: this.folderRoot,
      target,
    };

    if (this.config.exclude.length > 0) {
      params['exclude'] = this.config.exclude;
    }

    return params;
  }

  private printFolderError(err: string) {
    if (!this.config.showErrors) return;

    const messages = this.consoleService.splitData(err);
    messages.map((msg) => this.printError(msg));
  }

  private calculateFolderStats(nodeFolder: IFolder): Observable<any> {
    return this.fileService
      .getFolderSize(nodeFolder.path)
      .pipe(tap((size) => this.finishFolderStats(nodeFolder, size)));
  }

  private finishFolderStats(folder: IFolder, size: string): void {
    folder.size = this.transformFolderSize(size);
    if (this.config.sortBy === 'size') {
      this.resultsService.sortResults(this.config.sortBy);
      this.clearFolderSection();
    }
    this.printStats();
    this.printFoldersSection();
  }

  private transformFolderSize(size: string): number {
    return this.fileService.convertKbToGB(+size);
  }

  private completeSearch(): void {
    this.finishSearching$.next(true);
    this.updateStatus(colors.green(INFO_MSGS.SEARCH_COMPLETED));
  }

  private isQuitKey(ctrl, name): boolean {
    return (ctrl && name === 'c') || name === 'q' || name === 'escape';
  }

  private quit(): void {
    this.setRawMode(false);
    this.clear();
    this.printExitMessage();
    this.showCursor();
    process.exit();
  }

  private printExitMessage(): void {
    const { spaceReleased } = this.resultsService.getStats();
    const exitMessage = `Space released: ${spaceReleased}\n`;
    this.print(exitMessage);
  }

  private getCommand(keyName: string): string {
    return VALID_KEYS.find((name) => name === keyName);
  }

  private isCursorInLowerTextLimit(positionY: number): boolean {
    const foldersAmmount = this.resultsService.results.length;
    return positionY < foldersAmmount - 1 + MARGINS.ROW_RESULTS_START;
  }

  private isCursorInUpperTextLimit(positionY: number): boolean {
    return positionY > MARGINS.ROW_RESULTS_START;
  }

  private moveCursorUp(): void {
    if (this.isCursorInUpperTextLimit(this.cursorPosY)) {
      this.previusCursorPosY = this.getRealCursorPosY();
      this.cursorPosY--;
      this.checkCursorScroll();
    }
  }

  private moveCursorDown(): void {
    if (this.isCursorInLowerTextLimit(this.cursorPosY)) {
      this.previusCursorPosY = this.getRealCursorPosY();
      this.cursorPosY++;
      this.checkCursorScroll();
    }
  }

  private checkCursorScroll(): void {
    if (this.cursorPosY < MARGINS.ROW_RESULTS_START + this.scroll)
      this.scrollFolderResults(-1);

    if (this.cursorPosY > this.stdout.rows + this.scroll - 1)
      this.scrollFolderResults(1);
  }

  private scrollFolderResults(scrollAmount: number): void {
    this.scroll += scrollAmount;
    this.clearFolderSection();
  }

  private delete(): void {
    const nodeFolder =
      this.resultsService.results[this.cursorPosY - MARGINS.ROW_RESULTS_START];
    this.clearErrors();
    this.deleteFolder(nodeFolder);
  }

  private deleteFolder(folder: IFolder): void {
    const isSafeToDelete = this.fileService.isSafeToDelete(
      folder.path,
      this.config.targetFolder,
    );
    if (!isSafeToDelete) {
      this.printError('Folder not safe to delete');
      return;
    }

    folder.status = 'deleting';
    this.printFoldersSection();

    this.fileService
      .deleteDir(folder.path)
      .then(() => {
        folder.status = 'deleted';
        this.printStats();
        this.printFoldersSection();
      })
      .catch((e) => {
        folder.status = 'error-deleting';
        this.printFoldersSection();
        this.printError(e.message);
      });
  }

  private printError(error: string): void {
    const errorText = this.prepareErrorMsg(error);

    this.printAt(colors.red(errorText), {
      x: 0,
      y: this.stdout.rows,
    });
  }

  private prepareErrorMsg(errMessage: string): string {
    const margin = MARGINS.FOLDER_COLUMN_START;
    const width = this.stdout.columns - margin - 3;
    return this.consoleService.shortenText(errMessage, width, width);
  }

  private printStats(): void {
    const { totalSpace, spaceReleased } = this.resultsService.getStats();

    const totalSpacePosition = { ...UI_POSITIONS.TOTAL_SPACE };
    const spaceReleasedPosition = { ...UI_POSITIONS.SPACE_RELEASED };

    totalSpacePosition.x += INFO_MSGS.TOTAL_SPACE.length;
    spaceReleasedPosition.x += INFO_MSGS.SPACE_RELEASED.length;

    this.printAt(totalSpace, totalSpacePosition);
    this.printAt(spaceReleased, spaceReleasedPosition);
  }

  private getVisibleScrollFolders(): IFolder[] {
    return this.resultsService.results.slice(
      this.scroll,
      this.stdout.rows - MARGINS.ROW_RESULTS_START + this.scroll,
    );
  }

  private getRealCursorPosY(): number {
    return this.cursorPosY - this.scroll;
  }

  private clearErrors(): void {
    const lineOfErrors = this.stdout.rows;
    this.clearLine(lineOfErrors);
  }

  private clearLine(row: number): void {
    this.printAt(ansiEscapes.eraseLine, { x: 0, y: row });
  }

  private getUserHomePath(): string {
    return require('os').homedir();
  }
}
