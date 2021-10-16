import * as getSize from 'get-folder-size';

import { FileService, StreamService } from '../services/index.js';

import { IListDirParams } from '../interfaces/list-dir-params.interface.js';
import { Observable } from 'rxjs';
import { WindowsStrategyManager } from '../strategies/windows-remove-dir.strategy.js';
import { normalize } from 'path';
import { spawn } from 'child_process';
import trash from 'trash';
import __dirname from '../dirname.js';

export class WindowsFilesService extends FileService {
  private windowsStrategyManager: WindowsStrategyManager =
    new WindowsStrategyManager();

  constructor(private streamService: StreamService) {
    super();
  }

  getFolderSize(path: string): Observable<number> {
    return new Observable((observer) => {
      getSize(path, (err, size) => {
        if (err) {
          throw err;
        }
        observer.next(super.convertBytesToKB(size));
        observer.complete();
      });
    });
  }

  listDir(params: IListDirParams): Observable<Buffer> {
    const { path, target, exclude } = params;

    const excludeWords = exclude ? exclude.join(' ') : '';

    const binPath = normalize(`${__dirname}/../bin/windows-find`);
    const args = [path, target, excludeWords];

    const child = spawn(binPath, args);
    return this.streamService.getStream(child);
  }

  deleteDir(path: string, moveToTrash: boolean): Promise<boolean> {
    if (moveToTrash) {
      return trash(path)
        .then(() => Promise.resolve(true))
    } else {
      return this.windowsStrategyManager.deleteDir(path);
    }
  }
}
