import * as colors from 'colors';
import * as emoji from 'node-emoji';
import * as fs from 'fs';
import * as keypress from 'keypress';

import {
  BANNER,
  CURSOR_SIMBOL,
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
import { Observable, Subject, iif, interval, of } from 'rxjs';
import { SPINNERS, SPINNER_INTERVAL } from './constants/spinner.constants';
import { basename, resolve } from 'path';
import { filter, takeUntil, tap, catchError } from 'rxjs/operators';

import { ConsoleService } from './services/console.service';
import { FileService } from './services/files.service';
import { IFolder } from './interfaces/folder.interface';
import { OPTIONS } from './constants/cli.constants';
import { Position } from './interfaces/ui-positions.interface';
import { SpinnerService } from './services/spinner.service';
import ansiEscapes from 'ansi-escapes';

const fileService = new FileService();
const consoleService = new ConsoleService();
const spinnerService = new SpinnerService();

export class Controller {
  private folderRoot: any;
  private stdin: any = process.stdin;
  private stdout: any = process.stdout;

  private jobQueue: any[];
  private nodeFolders: IFolder[] = [];
  private cursorPosY: number = MARGINS.ROW_RESULTS_START;
  private config: any = DEFAULT_CONFIG;
  private finishSearching$: Subject<boolean> = new Subject<boolean>();
  private KEYS: { [key: string]: any } = {
    up: this.moveCursorUp.bind(this),
    down: this.moveCursorDown.bind(this),
    delete: this.delete.bind(this),
    execute: function(command: string, params: string[]) {
      return this[command](params);
    },
  };

  constructor() {
    keypress(process.stdin);
    this.getArguments();

    this.jobQueue = [this.folderRoot];
    this.prepareScreen();

    this.assignJob();
  }

  private getArguments() {
    const options = consoleService.getParameters(process.argv);
    if (options['help']) {
      this.showHelp();
      process.exit();
    }

    this.folderRoot = options['root'] ? options['root'] : process.cwd();
    if (options['full-scan']) this.folderRoot = fileService.getSystemRootPath();
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
      const description = consoleService.splitStringIntoArrayByCharactersWidth(
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

  private prepareScreen() {
    if (this.isTerminalTooSmall()) {
      this.print(INFO_MSGS.MIN_CLI_CLOMUNS);
      process.exit();
    }

    this.stdin.setRawMode(true);
    process.stdin.resume();
    this.clear();
    this.printUI();
    this.setupKeysListener();
    this.print(ansiEscapes.cursorHide);
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

  private initializeLoadingStatus() {
    spinnerService.setSpinner(SPINNERS.W10);
    interval(SPINNER_INTERVAL)
      .pipe(takeUntil(this.finishSearching$))
      .subscribe(() =>
        this.updateStatus(INFO_MSGS.SEARCHING + spinnerService.nextFrame()),
      );
  }

  private updateStatus(text: string) {
    this.printAt(text, UI_POSITIONS.STATUS);
  }

  private assignJob() {
    if (!this.jobQueue.length) {
      this.searchCompleted();
      return;
    }

    this.listDir(this.jobQueue.pop())
      .pipe(
        filter((file: any) => fs.statSync(file).isDirectory()),
        catchError((err, source) => {
          if (err) this.printError(err.message);
          return source;
        }),
      )

      .subscribe(folder => {
        this.newFolderFound(folder);
        this.assignJob();
      });
  }

  private searchCompleted() {
    this.finishSearching$.next(true);
    this.updateStatus(colors.green(INFO_MSGS.SEARCH_COMPLETED));
  }

  private newFolderFound(folder: string) {
    if (!this.isTargetFolder(folder)) {
      return this.jobQueue.push(folder);
    }

    const nodeFolder: IFolder = {
      path: folder,
      size: 0,
      deleted: false,
    };

    this.addNodeFolder(nodeFolder);
    this.printNewFolder(nodeFolder);

    if (this.config.deleteAll) this.deleteFolder(nodeFolder);
  }

  private setupKeysListener() {
    process.stdin.on('keypress', (ch, key) => {
      const previousCursorPosY = this.cursorPosY;
      const { name, ctrl } = key;

      if (this.isQuitKey(ctrl, name)) {
        this.quit();
      }

      const command = this.getCommand(name);

      if (command) {
        this.KEYS.execute(name);
      }

      this.printAt('  ', { x: 1, y: previousCursorPosY });
      this.printAt(colors.cyan(CURSOR_SIMBOL), {
        x: 1,
        y: this.cursorPosY,
      });
    });
  }

  private getCommand(keyName: string) {
    return VALID_KEYS.find(name => name === keyName);
  }

  private quit() {
    this.clear();
    process.exit();
  }

  private printFolderSize(folder: IFolder, position: Position) {
    fileService.getFolderSize(folder.path).then((size: any) => {
      this.printAt(size + ' mb', position);
      folder.size = +size;
      this.printStats();
    });
  }

  private addNodeFolder(nodeFolder: IFolder) {
    this.nodeFolders = [...this.nodeFolders, nodeFolder];
  }

  private listDir(path: string): Observable<any> {
    return Observable.create(observer => {
      fs.readdir(path, (err, files) => {
        if (err) {
          return;
        }
        files.forEach(file => {
          observer.next(resolve(path, file));
        });
      });
    });
  }

  private isCursorInLowerTextLimit(positionY: number) {
    return positionY < this.nodeFolders.length - 1 + MARGINS.ROW_RESULTS_START;
  }

  private isCursorInUpperTextLimit(positionY: number) {
    return positionY > MARGINS.ROW_RESULTS_START;
  }

  private moveCursorUp() {
    if (this.isCursorInUpperTextLimit(this.cursorPosY)) this.cursorPosY--;
  }

  private moveCursorDown() {
    if (this.isCursorInLowerTextLimit(this.cursorPosY)) this.cursorPosY++;
  }

  private delete() {
    const nodeFolder = this.nodeFolders[
      this.cursorPosY - MARGINS.ROW_RESULTS_START
    ];

    this.deleteFolder(nodeFolder);
  }

  private deleteFolder(folder: IFolder) {
    try {
      fileService.removeDir(folder.path);
      folder.deleted = true;
      this.printStats();
      this.printAt(colors.green('[DELETED] ') + folder.path, {
        x: 3,
        y: this.cursorPosY,
      });
    } catch (error) {
      this.printError(error.message);
      console.log(error.stack);
    }
  }

  private printAt(message: string, position: Position) {
    this.setCursorAt(position);
    this.print(message);
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

  private round(number: number, decimals: number = 0) {
    const toRound: any = number + 'e' + decimals;
    return Number(Math.round(toRound) + 'e-' + decimals);
  }

  private print(text: string) {
    process.stdout.write.bind(process.stdout)(text);
  }

  private clear() {
    this.print(ansiEscapes.clearScreen);
  }

  private clearLine(row: number) {
    this.printAt(ansiEscapes.eraseLine, { x: 0, y: row });
  }

  private setCursorAt({ x, y }: Position) {
    this.print(ansiEscapes.cursorTo(x, y));
  }

  private isQuitKey(ctrl, name) {
    return ctrl && name == 'c';
  }

  private isTerminalTooSmall() {
    return this.stdout.columns <= MIN_CLI_COLUMNS_SIZE;
  }

  private isTargetFolder(folder: string) {
    return basename(folder) === TARGET_FOLDER;
  }

  private printNewFolder(nodeFolder: IFolder) {
    const { path } = nodeFolder;

    const folderString = consoleService.shortenText(
      path,
      this.stdout.columns - MARGINS.FOLDER_COLUMN_END,
      OVERFLOW_CUT_FROM,
    );

    const folderPositionY = MARGINS.ROW_RESULTS_START + this.nodeFolders.length;
    this.printAt(folderString, {
      x: MARGINS.FOLDER_COLUMN_START,
      y: folderPositionY,
    });
    this.printFolderSize(nodeFolder, {
      x: this.stdout.columns - MARGINS.FOLDER_SIZE_COLUMN,
      y: folderPositionY,
    });
  }
}
