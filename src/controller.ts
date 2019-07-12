import * as colors from 'colors';
import * as emoji from 'node-emoji';
import * as fs from 'fs';
import * as keypress from 'keypress';

// https://itnext.io/step-by-step-building-and-publishing-an-npm-typescript-package-44fe7164964c
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
} from './constants/main.constants';
import { HELP_MSGS, INFO_MSGS } from './constants/messages.constants';
import { basename, dirname, normalize, resolve } from 'path';

import { ConsoleService } from './services/console.service';
import { FileService } from './services/files.service';
import { OPTIONS } from './constants/cli.constants';
import { Observable } from 'rxjs';
import { Position } from './interfaces/ui-positions.interface';
import { VALID_KEYS } from './constants/main.constants';
import ansiEscapes from 'ansi-escapes';
import { filter } from 'rxjs/operators';

const fileService = new FileService();
const consoleService = new ConsoleService();

export class Controller {
  private folderRoot: any;
  private stdin: any = process.stdin;
  private stdout: any = process.stdout;

  private jobQueue: any[];
  private nodeFolders: any[] = [];
  private cursorPosY: number = MARGINS.ROW_RESULTS_START;
  private config: any = DEFAULT_CONFIG;
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
    this.prepareScreen();

    this.jobQueue = [this.folderRoot];
    this.assignJob();
  }

  private getArguments() {
    const options = consoleService.getParameters(process.argv);
    if (options['help']) {
      this.showHelp();
      process.exit();
    }

    //this.folderRoot = options['root'] ? options['root'] : process.cwd();
    this.folderRoot = '/home/nya/Desktop/2DAW/Clientes/JS/';
    if (options['delete-all']) this.config.deteleAll = true;
    //this.config.deteleAll = !!options['delete-all'];
  }
  private showHelp() {
    this.clear();
    this.print(colors.inverse(INFO_MSGS.HELP_TITLE));

    let lineCount = 0;
    OPTIONS.map((option, index) => {
      this.setCursorAt({
        x: UI_HELP.X_COMMAND_OFFSET,
        y: index + UI_HELP.Y_OFFSET + lineCount,
      });
      this.print(option.arg.reduce((string, arg) => string + ', ' + arg));
      const description = consoleService.splitStringIntoArrayByCharactersWidth(
        option.description,
        this.stdout.columns - UI_HELP.X_DESCRIPTION_OFFSET,
      );

      description.map(line => {
        this.setCursorAt({
          x: UI_HELP.X_DESCRIPTION_OFFSET,
          y: index + UI_HELP.Y_OFFSET + lineCount,
        });
        this.print(line);
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
  }

  private printUI() {
    ///////////////////////////
    // banner and tutorial
    this.setCursorAt(UI_POSITIONS.INITIAL);
    this.print(BANNER);
    this.setCursorAt(UI_POSITIONS.TUTORIAL_TIP);
    this.print(
      colors.yellow(colors.inverse(emoji.emojify(HELP_MSGS.BASIC_USAGE))),
    );

    ///////////////////////////
    // folder size header
    this.setCursorAt({
      x:
        this.stdout.columns -
        (MARGINS.FOLDER_SIZE_COLUMN +
          Math.round(INFO_MSGS.HEADER_SIZE_COLUMN.length / 5)),
      y: UI_POSITIONS.FOLDER_SIZE_HEADER.y,
    });
    this.print(colors.gray(INFO_MSGS.HEADER_SIZE_COLUMN));

    ///////////////////////////
    // npkill stats
    this.setCursorAt(UI_POSITIONS.TOTAL_SPACE);
    this.print(colors.gray(INFO_MSGS.TOTAL_SPACE + DEFAULT_SIZE));
    this.setCursorAt(UI_POSITIONS.SPACE_RELEASED);
    this.print(colors.gray(INFO_MSGS.SPACE_RELEASED + DEFAULT_SIZE));
  }

  private assignJob() {
    if (this.jobQueue.length > 0) {
      this.listDir(this.jobQueue.pop())
        .pipe(filter((file: any) => fs.statSync(file).isDirectory()))
        .subscribe(folder => {
          this.newFolderFound(folder);
        });
    }
  }

  private newFolderFound(folder) {
    if (basename(folder) === TARGET_FOLDER) {
      const nodeFolder = {
        path: folder,
        size: 0,
        deleted: false,
      };
      this.nodeFolders.push(nodeFolder);

      this.setCursorAt({
        x: MARGINS.FOLDER_COLUMN_START,
        y: MARGINS.ROW_RESULTS_START + this.nodeFolders.length,
      });
      const folderString = consoleService.shortenText(
        folder,
        this.stdout.columns - MARGINS.FOLDER_COLUMN_END,
        OVERFLOW_CUT_FROM,
      );
      this.print(folderString);
      this.drawFolderSize(folder, {
        x: this.stdout.columns - MARGINS.FOLDER_SIZE_COLUMN,
        y: MARGINS.ROW_RESULTS_START + this.nodeFolders.length,
      });
    } else {
      this.jobQueue.push(folder);
    }
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

      this.setCursorAt({ x: 1, y: previousCursorPosY });
      this.print('  ');
      this.setCursorAt({ x: 1, y: this.cursorPosY });
      this.print(colors.cyan(CURSOR_SIMBOL));
      this.setCursorAt({ x: -1, y: -1 });
    });
  }

  private getCommand(keyName: string) {
    return VALID_KEYS.find(name => name === keyName);
  }

  private quit() {
    this.clear();
    process.exit();
  }

  private drawFolderSize(folder: string, position: Position) {
    fileService.getFolderSize(folder).then(data => {
      this.setCursorAt(position);
      this.print(data + ' mb');
    });
  }

  private listDir(path: string): Observable<any> {
    return Observable.create(observer => {
      fs.readdir(path, (err, files) => {
        if (err) {
          return;
        }
        files.forEach(file => {
          this.assignJob();
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
    const position = { x: 3, y: this.cursorPosY };

    this.deleteFolder(nodeFolder);
    this.drawFolderDeleted(nodeFolder, position);
  }
  private deleteFolder(nodeFolder) {
    try {
      fileService.removeDir(nodeFolder.path);
      nodeFolder.delete = true;
    } catch (error) {
      this.printError(error.message);
    }
  }

  private printError(error: string) {
    this.setCursorAt({
      x: 3,
      y: this.nodeFolders.length + MARGINS.ROW_RESULTS_START + 2,
    });
    this.print(colors.red(error));
  }

  private drawFolderDeleted(nodeFolder, position: Position) {
    this.setCursorAt(position);
    this.print(colors.green('[DELETED] ') + nodeFolder.path);
  }

  private print(text: string) {
    process.stdout.write.bind(process.stdout)(text);
  }

  private clear() {
    this.print(ansiEscapes.clearScreen);
  }

  private clearLine(row: number) {
    this.setCursorAt({ x: 0, y: row });
    this.print(ansiEscapes.eraseLine);
  }

  private setCursorAt(position: Position) {
    const { x, y } = position;
    this.print(ansiEscapes.cursorTo(x, y));
  }

  private isQuitKey(ctrl, name) {
    return ctrl && name == 'c';
  }

  private isTerminalTooSmall() {
    return this.stdout.columns <= MIN_CLI_COLUMNS_SIZE;
  }
}
