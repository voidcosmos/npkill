import * as getSize from 'get-folder-size';

import { FileService, StreamService } from '@core/services/index.js';

import { IListDirParams } from '@core/interfaces/list-dir-params.interface.js';
import { Observable } from 'rxjs';
import { WindowsStrategyManager } from '@core/strategies/windows-remove-dir.strategy.js';
import { normalize } from 'path';
import { spawn } from 'child_process';

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

  deleteDir(path: string): Promise<boolean> {
    return this.windowsStrategyManager.deleteDir(path);
  }
}
