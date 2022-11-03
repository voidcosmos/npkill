import getSize from 'get-folder-size';

import { FileService, StreamService } from '../services/index.js';

import { IListDirParams } from '../interfaces/list-dir-params.interface.js';
import { BehaviorSubject, Observable } from 'rxjs';
import { WindowsStrategyManager } from '../strategies/windows-remove-dir.strategy.js';
import __dirname from '../dirname.js';
import { FileWorkerService } from './files/files.worker.service.js';

export class WindowsFilesService extends FileService {
  private windowsStrategyManager: WindowsStrategyManager =
    new WindowsStrategyManager();

  constructor(
    private streamService: StreamService,
    protected fileWorkerService: FileWorkerService,
  ) {
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

  listDir(params: IListDirParams): Observable<string> {
    const stream$ = new BehaviorSubject(null);
    this.fileWorkerService.startScan(stream$, params);
    return stream$;
  }

  deleteDir(path: string): Promise<boolean> {
    return this.windowsStrategyManager.deleteDir(path);
  }
}
