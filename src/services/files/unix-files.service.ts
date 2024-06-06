import { exec } from 'child_process';

import { FileService } from './files.service.js';
import { IListDirParams } from '../../interfaces/index.js';
import { Observable, Subject, map, tap } from 'rxjs';
import { StreamService } from '../stream.service.js';
import { FileWorkerService } from './files.worker.service.js';

export abstract class UnixFilesService extends FileService {
  constructor(
    protected streamService: StreamService,
    protected fileWorkerService: FileWorkerService,
  ) {
    super();
  }

  getFolderSize(path: string): Observable<number> {
    const stream$ = new Subject<number>();
    this.fileWorkerService.getFolderSize(stream$, path);
    return stream$.pipe(
      map((data) => data),
      // tap((data) => console.log(data)),
    );
  }

  listDir(params: IListDirParams): Observable<string> {
    const stream$ = new Subject<string>();
    this.fileWorkerService.startScan(stream$, params);
    return stream$;
  }

  async deleteDir(path: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const command = `rm -rf "${path}"`;
      exec(command, (error, stdout, stderr) => {
        if (error !== null) {
          reject(error);
          return;
        }
        if (stderr !== '') {
          reject(stderr);
          return;
        }
        resolve(true);
      });
    });
  }

  protected prepareFindArgs(params: IListDirParams): string[] {
    const { path, target, exclude } = params;
    let args: string[] = [path];

    if (exclude !== undefined && exclude.length > 0) {
      args = [...args, this.prepareExcludeArgs(exclude)].flat();
    }

    args = [...args, '-name', target, '-prune'];

    return args;
  }

  protected prepareExcludeArgs(exclude: string[]): string[] {
    const excludeDirs = exclude.map((dir: string) => [
      '-not',
      '(',
      '-name',
      dir,
      '-prune',
      ')',
    ]);
    return excludeDirs.flat();
  }
}
