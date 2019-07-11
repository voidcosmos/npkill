import * as colors from 'colors';
import * as emoji from 'node-emoji';
import * as fs from 'fs';
import * as keypress from 'keypress';

// https://itnext.io/step-by-step-building-and-publishing-an-npm-typescript-package-44fe7164964c
import {
  BANNER,
  CURSOR_SIMBOL,
  ROW_RESULTS_START,
  TARGET_FOLDER,
  UI_POSITIONS,
  MIN_CLI_COLUMNS_SIZE,
} from './constants/main.constants';
import { basename, dirname, normalize, resolve } from 'path';

import { ConsoleService } from './services/console.service';
import { FileService } from './services/files.service';
import { HELP_MSGS, INFO_MSGS } from './constants/messages.constants';
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
  private folderNewRow: number = 0;
  private cursorPosY: number = ROW_RESULTS_START;

  constructor() {
    //this.folderRoot = process.cwd();
    this.folderRoot = '/home/nya/Programming';
    //this.folderRoot = "A:/Users/Juanimi/Documents/DAW21/"; //ONLY FOR DEV
    this.jobQueue = [this.folderRoot];

    keypress(process.stdin);
    this.prepareScreen();
    this.assignJob();
  }

  private prepareScreen() {
    if (this.isTerminalTooSmall()) {
      this.print(INFO_MSGS.MIN_CLI_CLOMUNS);
      process.exit();
    }

    this.stdin.setRawMode(true);
    process.stdin.resume();
    this.clear();
    // TODO print logo and build the UI
    this.setCursorAt({ x: 0, y: 0 });
    this.print(BANNER);
    this.setCursorAt(UI_POSITIONS.TUTORIAL_TIP);
    this.print(colors.yellow(emoji.emojify(HELP_MSGS.BASIC_USAGE)));
    this.setupKeysListener();
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
      this.nodeFolders.push({
        path: folder,
        size: 0,
        deleted: false,
      });
      this.setCursorAt({ x: 3, y: ROW_RESULTS_START + this.folderNewRow });
      this.print(folder);
      // getFolderSize(folder, [90, ROW_RESULTS_START + i]);
      this.drawFolderSize(folder, {
        x: this.stdout.columns - 20,
        y: ROW_RESULTS_START + this.folderNewRow,
      });
      this.folderNewRow++;
    } else {
      this.jobQueue.push(folder);
    }
  }

  private KEYS: { [key: string]: any } = {
    up: this.moveCursorUp.bind(this),
    down: this.moveCursorDown.bind(this),
    delete: this.delete.bind(this),
    execute: function(command: string, params: string[]) {
      return this[command](params);
    },
  };

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
    return positionY < this.nodeFolders.length - 1 + ROW_RESULTS_START;
  }

  private isCursorInUpperTextLimit(positionY: number) {
    return positionY > ROW_RESULTS_START;
  }

  private moveCursorUp() {
    if (this.isCursorInUpperTextLimit(this.cursorPosY)) this.cursorPosY--;
  }

  private moveCursorDown() {
    if (this.isCursorInLowerTextLimit(this.cursorPosY)) this.cursorPosY++;
  }

  private delete() {
    const nodeFolder = this.nodeFolders[this.cursorPosY - ROW_RESULTS_START];
    const position = { x: 3, y: this.cursorPosY };

    this.deleteFolder(nodeFolder);
    this.drawFolderDeleted(nodeFolder, position);
  }

  private deleteFolder(nodeFolder) {
    fileService.removeDir(nodeFolder.path);
    nodeFolder.delete = true;
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
