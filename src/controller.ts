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
  UI_POSITIONS
} from './constants/main.constants';
import { basename, dirname, normalize, resolve } from 'path';

import { ConsoleService } from './services/console.service';
import { FileService } from './services/files.service';
import { HELP_MSGS } from './constants/messages.constants';
import { Observable } from 'rxjs';
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
    this.folderRoot = process.cwd();
    //this.folderRoot = "A:/Users/Juanimi/Documents/DAW21/"; //ONLY FOR DEV
    this.jobQueue = [this.folderRoot];

    keypress(process.stdin);
    this.prepareScreen();
    this.assignJob();
  }

  private prepareScreen() {
    this.stdin.setRawMode(true);
    process.stdin.resume();
    this.clear();
    // TODO print logo and build the UI
    this.setCursorAt([0, 0]);
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
        deleted: false
      });
      this.setCursorAt([3, ROW_RESULTS_START + this.folderNewRow]);
      this.print(folder);
      // getFolderSize(folder, [90, ROW_RESULTS_START + i]);
      this.drawFolderSize(folder, [
        this.stdout.columns - 20,
        ROW_RESULTS_START + this.folderNewRow
      ]);
      this.folderNewRow++;
    } else {
      this.jobQueue.push(folder);
    }
  }

  private KEYS: { [key: string]: any } = {
    up: () => this.cursorPosY--,
    down: () => this.cursorPosY++,
    delete: this.delete.bind(this),
    execute: function(command: string, params: string[]) {
      return this[command](params);
    }
  };

  private setupKeysListener() {
    process.stdin.on('keypress', (ch, key) => {
      const previusCursorPosY = this.cursorPosY;
      const { name, ctrl } = key;

      if (key && ctrl && name == 'c') {
        this.clear();
        process.exit();
      }

      if (name == 'delete') {
        this.KEYS.execute(name, {
          nodeFolder: this.nodeFolders[this.cursorPosY - ROW_RESULTS_START],
          position: [3, this.cursorPosY]
        });
      } else {
        this.KEYS.execute(name);
      }

      this.setCursorAt([1, previusCursorPosY]);
      this.print('  ');
      this.setCursorAt([1, this.cursorPosY]);
      this.print(colors.cyan(CURSOR_SIMBOL));
      this.setCursorAt([-1, -1]);
    });
  }

  private drawFolderSize(folder: string, position: [number, number]) {
    fileService.getFolderSize(folder).then(data => {
      this.setCursorAt(position);
      this.print(data + ' mb');
    });
  }

  private listDir(path: string): Observable<any> {
    return Observable.create(observer => {
      fs.readdir(path, (err, files) => {
        files.forEach(file => {
          this.assignJob();
          observer.next(resolve(path, file));
        });
      });
    });
  }

  private delete({ nodeFolder, position }) {
    this.deleteFolder(nodeFolder);
    this.drawFolderDeleted(nodeFolder, position);
  }

  private deleteFolder(nodeFolder) {
    if (nodeFolder) {
      fileService.removeDir(nodeFolder.path);
      nodeFolder.delete = true;
    }
  }

  private drawFolderDeleted(nodeFolder, position: [number, number]) {
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
    this.setCursorAt([0, row]);
    this.print(ansiEscapes.eraseLine);
  }

  private setCursorAt(position: [number, number]) {
    this.print(ansiEscapes.cursorTo(position[0], position[1]));
  }
}
