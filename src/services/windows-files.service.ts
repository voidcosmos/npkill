import * as PATH from 'path';
import * as fs from 'fs';
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

    const binPath = PATH.normalize(`${__dirname}/../bin/windows-find`);
    const args = [path, target, excludeWords];

    const child = spawn(binPath, args);
    return this.streamService.getStream(child);
  }

  deleteDir(path: string): Promise<{}> {
    return new Promise((resolve, reject) => {
      const files = this.getDirectoryFiles(path);

      this.removeDirectoryFiles(path, files);
      try {
        fs.rmdirSync(path);
      } catch (err) {
        return reject(err);
      }
      resolve();
    });
  }

  private getDirectoryFiles(dir: string) {
    return fs.readdirSync(dir);
  }

  private removeDirectoryFiles(dir: string, files: string[]): void {
    files.map(file => {
      const path = PATH.join(dir, file);
      if (fs.statSync(path).isDirectory()) {
        this.deleteDir(path);
      } else {
        fs.unlinkSync(path);
      }
    });
  }
}
