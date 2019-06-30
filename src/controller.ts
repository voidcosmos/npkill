import * as colors from 'colors';
import * as emoji from 'node-emoji';
import * as fs from 'fs';
import * as keypress from 'keypress';

// https://itnext.io/step-by-step-building-and-publishing-an-npm-typescript-package-44fe7164964c
import { BANNER, CURSOR_SIMBOL, ROW_RESULTS_START, TARGET_FOLDER, UI_POSITIONS } from './constants/main.constants';
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
      this.drawFolderSize(folder, [this.stdout.columns - 20, ROW_RESULTS_START + this.folderNewRow]);
      this.folderNewRow++;
    } else {
      this.jobQueue.push(folder);
    }
  }
  private setupKeysListener() {
    process.stdin.on('keypress', (ch, key) => {
      const previusCursorPosY = this.cursorPosY;
      if (key.name == 'up') {
        this.cursorPosY--;
      }
      if (key.name == 'down') {
        this.cursorPosY++;
      }
      if (key.name == 'delete') {
        this.deleteFolder(this.nodeFolders[this.cursorPosY - ROW_RESULTS_START]);
        this.drawFolderDeleted(this.nodeFolders[this.cursorPosY - ROW_RESULTS_START], [3, this.cursorPosY]);
      }
      this.setCursorAt([1, previusCursorPosY]);
      this.print('  ');
      this.setCursorAt([1, this.cursorPosY]);
      this.print(colors.cyan(CURSOR_SIMBOL));
      this.setCursorAt([-1, -1]);
      if (key && key.ctrl && key.name == 'c') {
        this.clear();
        process.exit();
      }
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

  print(text: string) {
    process.stdout.write.bind(process.stdout)(text);
  }
  clear() {
    this.print(ansiEscapes.clearScreen);
  }
  clearLine(row: number) {
    this.setCursorAt([0, row]);
    this.print(ansiEscapes.eraseLine);
  }
  setCursorAt(position: [number, number]) {
    this.print(ansiEscapes.cursorTo(position[0], position[1]));
  }
}
