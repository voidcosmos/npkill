import { normalize } from 'path';
import { rmdir } from 'fs';
import * as getSize from 'get-folder-size';

import { FileService, StreamService } from '@core/services';

import { IListDirParams } from '@core/interfaces/list-dir-params.interface';
import { Observable } from 'rxjs';
import { spawn } from 'child_process';

export class WindowsFilesService extends FileService {
  constructor(private streamService: StreamService) {
    super();
  }

  getFolderSize(path: string): Observable<number> {
    return Observable.create(observer => {
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
    return new Promise((resolve, reject) => {
      rmdir(path, { recursive: true }, err => {
        if (err) {
          reject(err);
        }
        resolve(true);
      });
    });
  }
}
