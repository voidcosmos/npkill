import * as colors from 'colors';
import * as emoji from 'node-emoji';
import * as keypress from 'keypress';

import {
  BANNER,
  CURSOR_SIMBOL,
  DECIMALS_SIZE,
  DEFAULT_CONFIG,
  DEFAULT_SIZE,
  MARGINS,
  MIN_CLI_COLUMNS_SIZE,
  OVERFLOW_CUT_FROM,
  UI_HELP,
  UI_POSITIONS,
  VALID_KEYS,
} from './constants/main.constants';
import {
  ERROR_MSG,
  HELP_MSGS,
  INFO_MSGS,
} from './constants/messages.constants';
import { SPINNERS, SPINNER_INTERVAL } from './constants/spinner.constants';
import { Subject, interval } from 'rxjs';

import { ConsoleService } from './services/console.service';
import { FileService } from './services/files.service';
import { IConfig } from './interfaces/config.interface';
import { IFolder } from './interfaces/folder.interface';
import { IKeysCommand } from './interfaces/command-keys.interface';
import { IPosition } from './interfaces/ui-positions.interface';
import { IStats } from './interfaces/stats.interface';
import { OPTIONS } from './constants/cli.constants';
import { SpinnerService } from './services/spinner.service';
import { UpdateService } from './services/update.service';
import ansiEscapes from 'ansi-escapes';
import { takeUntil } from 'rxjs/operators';

export class Controller {
  private folderRoot = '';
  private stdin: NodeJS.ReadStream = process.stdin;
  private stdout: NodeJS.WriteStream = process.stdout;
  private config: IConfig = DEFAULT_CONFIG;
  private nodeFolders: IFolder[] = [];

  private cursorPosY: number = MARGINS.ROW_RESULTS_START;
  private previousCursorPosY: number = 0;
  private scroll: number = 0;

  private finishSearching$: Subject<boolean> = new Subject<boolean>();

  private KEYS: IKeysCommand = {
    up: this.moveCursorUp.bind(this),
    // tslint:disable-next-line: object-literal-sort-keys
    down: this.moveCursorDown.bind(this),
    delete: this.delete.bind(this),
    execute(command: string, params: string[]) {
      return this[command](params);
    },
  };

  constructor(
    private fileService: FileService,
    private spinnerService: SpinnerService,
    private consoleService: ConsoleService,
    private updateService: UpdateService,
  ) {
    keypress(process.stdin);

    this.getArguments();
    this.prepareScreen();
    this.checkVersion();

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

    this.folderRoot = options['directory']
      ? options['directory']
      : process.cwd();
    if (options['full-scan']) this.folderRoot = this.getUserHomePath();
    if (options['delete-all']) this.config.deleteAll = true;
    if (options['show-errors']) this.config.showErrors = true;
  }

  private checkVersion(): void {
    this.updateService
      .isUpdated(this.getVersion())
      .then((isUpdated: boolean) => {
        if (!isUpdated) this.showNewInfoMessage();
      })
      .catch(err => {
        const errorMessage =
          ERROR_MSG.CANT_GET_REMOTE_VERSION + ': ' + err.message;
        this.printError(errorMessage);
      });
  }

  private showNewInfoMessage(): void {
    const message = colors.magenta(INFO_MSGS.NEW_UPDATE_FOUND);
    this.printAt(message, UI_POSITIONS.NEW_UPDATE_FOUND);
  }

  private showHelp(): void {
    this.clear();
    this.print(colors.inverse(INFO_MSGS.HELP_TITLE));

    let lineCount = 0;
    OPTIONS.map((option, index) => {
      this.printAt(option.arg.reduce((text, arg) => text + ', ' + arg), {
        x: UI_HELP.X_COMMAND_OFFSET,
        y: index + UI_HELP.Y_OFFSET + lineCount,
      });
      const description = this.consoleService.splitWordsByWidth(
        option.description,
        this.stdout.columns - UI_HELP.X_DESCRIPTION_OFFSET,
      );

      description.map(line => {
        this.printAt(line, {
          x: UI_HELP.X_DESCRIPTION_OFFSET,
          y: index + UI_HELP.Y_OFFSET + lineCount,
        });
        ++lineCount;
      });
    });
  }

  private showProgramVersion(): void {
    this.print('v' + this.getVersion());
  }

  private getVersion(): string {
    const packageJson = __dirname + '/../package.json';

    const packageData = JSON.parse(
      this.fileService.getFileContent(packageJson),
    );
    return packageData.version;
  }

  private clear(): void {
    this.print(ansiEscapes.clearScreen);
  }

  private print(text: string): void {
    process.stdout.write.bind(process.stdout)(text);
  }

  private prepareScreen(): void {
    if (this.isTerminalTooSmall()) {
      this.print(INFO_MSGS.MIN_CLI_CLOMUNS);
      process.exit();
    }

    this.setRawMode();
    this.clear();
    this.printUI();
    this.setupKeysListener();
    this.hideCursor();
  }

  private isTerminalTooSmall(): boolean {
    return this.stdout.columns <= MIN_CLI_COLUMNS_SIZE;
  }

  private setRawMode(): void {
    this.stdin.setRawMode(true);
    process.stdin.resume();
  }

  private printUI(): void {
    ///////////////////////////
    // banner and tutorial
    this.printAt(BANNER, UI_POSITIONS.INITIAL);
    this.printAt(
      colors.yellow(colors.inverse(emoji.emojify(HELP_MSGS.BASIC_USAGE))),
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

    this.initializeLoadingStatus();
  }

  private printAt(message: string, position: IPosition): void {
    this.setCursorAt(position);
    this.print(message);
  }

  private setCursorAt({ x, y }: IPosition): void {
    this.print(ansiEscapes.cursorTo(x, y));
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
        error => this.printError(error),
      );
  }

  private updateStatus(text: string): void {
    this.printAt(text, UI_POSITIONS.STATUS);
  }

  private printFoldersSection(): void {
    const visibleFolders = this.getVisibleScrollFolders();

    visibleFolders.map((folder: IFolder, index) => {
      let cutFrom = OVERFLOW_CUT_FROM;
      let folderTitle = folder.path;

      if (folder.deleted) {
        cutFrom += INFO_MSGS.DELETED_FOLDER.length;
        folderTitle = INFO_MSGS.DELETED_FOLDER + folderTitle;
      }

      let folderString = this.consoleService.shortenText(
        folderTitle,
        this.stdout.columns - MARGINS.FOLDER_COLUMN_END,
        cutFrom,
      );

      // This is necessary for the coloring of the text, since
      // the shortener takes into ansi-scape codes invisible
      // characters and can cause an error in the cli.
      folderString = this.colorDeletedTextGreen(folderString);

      // Folder name
      const folderRow = MARGINS.ROW_RESULTS_START + index;
      this.printAt(folderString, {
        x: MARGINS.FOLDER_COLUMN_START,
        y: folderRow,
      });

      // Folder size
      const folderSize = this.round(folder.size, DECIMALS_SIZE) + ' mb';
      const folderSizeText = folder.size ? folderSize : '--';
      this.printAt(folderSizeText, {
        x: this.stdout.columns - MARGINS.FOLDER_SIZE_COLUMN,
        y: folderRow,
      });

      this.printFolderCursor();
    });
  }

  private clearFolderSection(): void {
    for (let row = MARGINS.ROW_RESULTS_START; row < this.stdout.rows; row++) {
      this.clearLine(row);
    }
  }

  private colorDeletedTextGreen(folderString: string): string {
    return folderString.replace(
      INFO_MSGS.DELETED_FOLDER,
      colors.green(INFO_MSGS.DELETED_FOLDER),
    );
  }

  private setupKeysListener(): void {
    process.stdin.on('keypress', (ch, key) => {
      const { name, ctrl } = key;

      if (this.isQuitKey(ctrl, name)) {
        this.quit();
      }

      const command = this.getCommand(name);

      if (command) {
        this.KEYS.execute(name);
      }

      this.printFoldersSection();
    });
  }

  private hideCursor(): void {
    this.print(ansiEscapes.cursorHide);
  }

  private scan(): void {
    const folders$ = this.fileService.listDir(this.folderRoot);
    folders$.subscribe(
      folder => this.newFolderfound(folder),
      error => this.printError(error),
      () => this.completeSearch(),
    );
  }

  private newFolderfound(dataFolder): void {
    if (dataFolder instanceof Error) {
      this.printFolderError(dataFolder.message);
      return;
    }
    const paths = this.consoleService.splitData(dataFolder.toString());
    paths
      .filter(path => path)
      .map(path => {
        const nodeFolder = { path, deleted: false, size: 0 };
        this.addNodeFolder(nodeFolder);

        this.calculateFolderSize(nodeFolder);
        this.printFoldersSection();
      });
  }

  private printFolderError(err: string) {
    if (!this.config.showErrors) return;

    const messages = this.consoleService.splitData(err);
    messages.map(msg => this.printError(msg));
  }

  private calculateFolderSize(nodeFolder: IFolder): void {
    this.fileService
      .getFolderSize(nodeFolder.path)
      .subscribe((size: number) => {
        nodeFolder.size = +this.round(+size, DECIMALS_SIZE);
        this.printStats();
        this.printFoldersSection();
      });
  }

  private completeSearch(): void {
    this.finishSearching$.next(true);
    this.updateStatus(colors.green(INFO_MSGS.SEARCH_COMPLETED));
  }

  private isQuitKey(ctrl, name): boolean {
    return (ctrl && name === 'c') || name === 'q';
  }

  private quit(): void {
    this.clear();
    process.exit();
  }

  private getCommand(keyName: string): string {
    return VALID_KEYS.find(name => name === keyName);
  }

  private isCursorInLowerTextLimit(positionY: number): boolean {
    return positionY < this.nodeFolders.length - 1 + MARGINS.ROW_RESULTS_START;
  }

  private isCursorInUpperTextLimit(positionY: number): boolean {
    return positionY > MARGINS.ROW_RESULTS_START;
  }

  private moveCursorUp(): void {
    if (this.isCursorInUpperTextLimit(this.cursorPosY)) {
      this.previousCursorPosY = this.getRealCursorPosY();
      this.cursorPosY--;
      this.checkCursorScroll();
    }
  }

  private moveCursorDown(): void {
    if (this.isCursorInLowerTextLimit(this.cursorPosY)) {
      this.previousCursorPosY = this.getRealCursorPosY();
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
    const nodeFolder = this.nodeFolders[
      this.cursorPosY - MARGINS.ROW_RESULTS_START
    ];

    this.deleteFolder(nodeFolder);
  }

  private deleteFolder(folder: IFolder): void {
    const suscription$ = this.fileService.deleteDir(folder.path).subscribe(
      data => {
        this.printError(ERROR_MSG.CANT_DELETE_FOLDER);
        suscription$.unsubscribe();
      },
      err => this.printError(err.message),
      () => {
        folder.deleted = true;
        this.printStats();
        this.printFoldersSection();
      },
    );
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
    return this.consoleService.shortenText(
      errMessage,
      this.stdout.columns - margin,
      this.stdout.columns - margin,
    );
  }

  private printStats(): void {
    const stats: IStats = this.getStats();

    const totalSpacePosition = { ...UI_POSITIONS.TOTAL_SPACE };
    const spaceReleasedPosition = { ...UI_POSITIONS.SPACE_RELEASED };
    const totalSpace = stats.totalSpace.toFixed(DECIMALS_SIZE) + ' mb';
    const spaceReleased = stats.spaceReleased.toFixed(DECIMALS_SIZE) + ' mb';
    totalSpacePosition.x += INFO_MSGS.TOTAL_SPACE.length;
    spaceReleasedPosition.x += INFO_MSGS.SPACE_RELEASED.length;

    this.printAt(totalSpace, totalSpacePosition);
    this.printAt(spaceReleased, spaceReleasedPosition);
  }

  private getStats(): IStats {
    let spaceReleased = 0;

    const totalSpace = this.nodeFolders.reduce((total, folder) => {
      if (folder.deleted) spaceReleased += folder.size;

      return total + folder.size;
    }, 0);

    return {
      spaceReleased: this.round(spaceReleased, 2),
      totalSpace: this.round(totalSpace, 2),
    };
  }

  private getVisibleScrollFolders(): IFolder[] {
    return this.nodeFolders.slice(
      this.scroll,
      this.stdout.rows - MARGINS.ROW_RESULTS_START + this.scroll,
    );
  }

  private printFolderCursor(): void {
    this.printAt('  ', { x: 1, y: this.previousCursorPosY });
    this.printAt(colors.cyan(CURSOR_SIMBOL), {
      x: 1,
      y: this.getRealCursorPosY(),
    });
  }

  private getRealCursorPosY(): number {
    return this.cursorPosY - this.scroll;
  }

  private round(numb: number, decimals: number = 0): number {
    const toRound = +(numb + 'e' + decimals);
    return Number(Math.round(toRound) + 'e-' + decimals);
  }

  private clearLine(row: number): void {
    this.printAt(ansiEscapes.eraseLine, { x: 0, y: row });
  }

  private addNodeFolder(nodeFolder: IFolder): void {
    this.nodeFolders = [...this.nodeFolders, nodeFolder];
  }

  private getUserHomePath(): string {
    return require('os').homedir();
  }
}
