import getSize from 'get-folder-size';

import { FileService, StreamService } from '../services/index.js';

import { IListDirParams } from '../interfaces/list-dir-params.interface.js';
import { BehaviorSubject, Observable } from 'rxjs';
import { WindowsStrategyManager } from '../strategies/windows-remove-dir.strategy.js';
import { normalize } from 'path';
import { spawn } from 'child_process';
import __dirname from '../dirname.js';
import { runWorker } from './files/files.worker.js';

export class WindowsFilesService extends FileService {
  listDir(params: IListDirParams): Observable<string> {
    const stream$ = new BehaviorSubject(null);
    runWorker(stream$, params);
    // this.search(stream, params, params.path);
    return stream$;
  }

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

  deleteDir(path: string): Promise<boolean> {
    return this.windowsStrategyManager.deleteDir(path);
  }
}
