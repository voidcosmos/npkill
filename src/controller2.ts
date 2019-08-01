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
  TARGET_FOLDER,
  UI_HELP,
  UI_POSITIONS,
  VALID_KEYS,
} from './constants/main.constants';
import { HELP_MSGS, INFO_MSGS } from './constants/messages.constants';
import { SPINNERS, SPINNER_INTERVAL } from './constants/spinner.constants';
import { Subject, interval } from 'rxjs';

import { ConsoleService } from './services/console.service';
import { IConfig } from './interfaces/config.interface';
import { IFileService } from './interfaces/file.interface';
import { IFolder } from './interfaces/folder.interface';
import { IPosition } from './interfaces/ui-positions.interface';
import { OPTIONS } from './constants/cli.constants';
import { SpinnerService } from './services/spinner.service';
import ansiEscapes from 'ansi-escapes';
import { basename } from 'path';
import { takeUntil } from 'rxjs/operators';

export class Controller {
  private folderRoot: string = '';
  private stdin: any = process.stdin;
  private stdout: any = process.stdout;
  private config: IConfig = DEFAULT_CONFIG;
  private nodeFolders: IFolder[] = [];

  private cursorPosY: number = MARGINS.ROW_RESULTS_START;
  private previousCursorPosY: number = 0;
  private scroll: number = 0;

  private finishSearching$: Subject<boolean> = new Subject<boolean>();

  private KEYS: { [key: string]: any } = {
    up: this.moveCursorUp.bind(this),
    down: this.moveCursorDown.bind(this),
    delete: this.delete.bind(this),
    execute: function(command: string, params: string[]) {
      return this[command](params);
    },
  };

  constructor(
    private fileService: IFileService,
    private spinnerService: SpinnerService,
    private consoleService: ConsoleService,
  ) {
    keypress(process.stdin);

    this.getArguments();
    this.prepareScreen();
    this.scan();
  }

  private getArguments() {
    const options = this.consoleService.getParameters(process.argv);
    if (options['help']) {
      this.showHelp();
      process.exit();
    }

    this.folderRoot = options['directory']
      ? options['directory']
      : process.cwd();
    if (options['full-scan']) this.folderRoot = this.getUserHomePath();
    if (options['delete-all']) this.config.deleteAll = true;
    if (options['show-errors']) this.config.showErrors = true;

    //this.config.deleteAll = !!options['delete-all'];
  }

  private showHelp() {
    this.clear();
    this.print(colors.inverse(INFO_MSGS.HELP_TITLE));

    let lineCount = 0;
    OPTIONS.map((option, index) => {
      this.printAt(option.arg.reduce((string, arg) => string + ', ' + arg), {
        x: UI_HELP.X_COMMAND_OFFSET,
        y: index + UI_HELP.Y_OFFSET + lineCount,
      });
      const description = this.consoleService.splitStringIntoArrayByCharactersWidth(
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

  private clear() {
    this.print(ansiEscapes.clearScreen);
  }

  private print(text: string) {
    process.stdout.write.bind(process.stdout)(text);
  }

  private prepareScreen() {
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

  private isTerminalTooSmall() {
    return this.stdout.columns <= MIN_CLI_COLUMNS_SIZE;
  }

  private setRawMode() {
    this.stdin.setRawMode(true);
    process.stdin.resume();
  }

  private printUI() {
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

  private printAt(message: any, position: IPosition) {
    this.setCursorAt(position);
    this.print(message);
  }

  private setCursorAt({ x, y }: IPosition) {
    this.print(ansiEscapes.cursorTo(x, y));
  }

  private initializeLoadingStatus() {
    this.spinnerService.setSpinner(SPINNERS.W10);
    interval(SPINNER_INTERVAL)
      .pipe(takeUntil(this.finishSearching$))
      .subscribe(
        () =>
          this.updateStatus(
            INFO_MSGS.SEARCHING + this.spinnerService.nextFrame(),
          ),
        error => this.printError(error),
        () => this.updateStatus('search complete'),
      );
  }

  private updateStatus(text: string) {
    this.printAt(text, UI_POSITIONS.STATUS);
  }

  private printFoldersSection() {
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

      //Folder name
      const folderRow = MARGINS.ROW_RESULTS_START + index;
      this.printAt(folderString, {
        x: MARGINS.FOLDER_COLUMN_START,
        y: folderRow,
      });

      //Folder size
      const folderSize = this.round(folder.size, DECIMALS_SIZE) + ' mb';
      const folderSizeText = folder.size ? folderSize : '--';
      this.printAt(folderSizeText, {
        x: this.stdout.columns - MARGINS.FOLDER_SIZE_COLUMN,
        y: folderRow,
      });

      this.printFolderCursor();
    });
  }

  private colorDeletedTextGreen(folderString: string) {
    return folderString.replace(
      INFO_MSGS.DELETED_FOLDER,
      colors.green(INFO_MSGS.DELETED_FOLDER),
    );
  }

  private setupKeysListener() {
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

  private hideCursor() {
    this.print(ansiEscapes.cursorHide);
  }

  private scan() {
    const folders$ = this.fileService.listDir(this.folderRoot);
    folders$.subscribe(
      data => {
        if (data instanceof Error) {
          this.printError(data.message);
          return;
        }

        const paths = this.consoleService.splitData(data.toString());

        paths
          .filter(path => path)
          .map(path => {
            const nodeFolder = { path, deleted: false, size: 0 };
            this.addNodeFolder(nodeFolder);

            this.calculateFolderSize(nodeFolder);
            this.printFoldersSection();
          });
      },
      error => {
        this.printError(error);
      },
      () => this.finishSearching$.next(true),
    );
  }

  private calculateFolderSize(nodeFolder: IFolder) {
    this.fileService.getFolderSize(nodeFolder.path).subscribe((size: any) => {
      nodeFolder.size = +size;
      this.printStats();
      this.printFoldersSection();
    });
  }

  private isQuitKey(ctrl, name) {
    return ctrl && name == 'c';
  }

  private quit() {
    this.clear();
    process.exit();
  }

  private getCommand(keyName: string) {
    return VALID_KEYS.find(name => name === keyName);
  }

  private isCursorInLowerTextLimit(positionY: number) {
    return positionY < this.nodeFolders.length - 1 + MARGINS.ROW_RESULTS_START;
  }

  private isCursorInUpperTextLimit(positionY: number) {
    return positionY > MARGINS.ROW_RESULTS_START;
  }

  private moveCursorUp() {
    if (this.isCursorInUpperTextLimit(this.cursorPosY)) {
      this.previousCursorPosY = this.getRealCursorPosY();
      this.cursorPosY--;
      this.checkCursorScroll();
    }
  }

  private moveCursorDown() {
    if (this.isCursorInLowerTextLimit(this.cursorPosY)) {
      this.previousCursorPosY = this.getRealCursorPosY();
      this.cursorPosY++;
      this.checkCursorScroll();
    }
  }

  private checkCursorScroll() {
    if (this.cursorPosY < MARGINS.ROW_RESULTS_START + this.scroll) {
      this.scroll--;
    }
    if (this.cursorPosY > this.stdout.rows + this.scroll - 1) {
      this.scroll++;
    }
  }

  private delete() {
    const nodeFolder = this.nodeFolders[
      this.cursorPosY - MARGINS.ROW_RESULTS_START
    ];

    this.deleteFolder(nodeFolder);
    this.printStats();
    this.printFoldersSection();
  }

  private deleteFolder(folder: IFolder) {
    try {
      this.fileService.deleteDir(folder.path);
      folder.deleted = true;
    } catch (error) {
      this.printError(error.message);
    }
  }

  private printError(error: string) {
    if (!this.config.showErrors) return;

    this.printAt(colors.red(error), {
      x: 3,
      y: this.stdout.rows,
    });
  }

  private printStats() {
    const stats: any = this.getStats();

    const totalSpacePosition = { ...UI_POSITIONS.TOTAL_SPACE };
    const spaceReleasedPosition = { ...UI_POSITIONS.SPACE_RELEASED };
    totalSpacePosition.x += INFO_MSGS.TOTAL_SPACE.length;

    spaceReleasedPosition.x += INFO_MSGS.SPACE_RELEASED.length;

    this.printAt(stats.totalSpace + ' mb', totalSpacePosition);
    this.printAt(stats.spaceReleased + ' mb', spaceReleasedPosition);
  }

  private getStats(): Object {
    let spaceReleased: any = 0;

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

  private printFolderCursor() {
    this.printAt('  ', { x: 1, y: this.previousCursorPosY });
    this.printAt(colors.cyan(CURSOR_SIMBOL), {
      x: 1,
      y: this.getRealCursorPosY(),
    });
  }

  private getRealCursorPosY(): number {
    return this.cursorPosY - this.scroll;
  }

  private round(number: number, decimals: number = 0) {
    const toRound: any = number + 'e' + decimals;
    return Number(Math.round(toRound) + 'e-' + decimals);
  }

  private clearLine(row: number) {
    this.printAt(ansiEscapes.eraseLine, { x: 0, y: row });
  }

  private isTargetFolder(folder: string) {
    return basename(folder) === TARGET_FOLDER;
  }

  private addNodeFolder(nodeFolder: IFolder) {
    this.nodeFolders = [...this.nodeFolders, nodeFolder];
  }

  private getUserHomePath() {
    return require('os').homedir();
  }
}
