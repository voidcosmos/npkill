import { exec } from 'child_process';

import { FileService } from './files.service.js';
import { IListDirParams } from '../../interfaces/index.js';
import { Observable, Subject } from 'rxjs';
import { StreamService } from '../stream.service.js';
import { FileWorkerService } from './files.worker.service.js';

export abstract class UnixFilesService extends FileService {
  constructor(
    protected streamService: StreamService,
    protected fileWorkerService: FileWorkerService,
  ) {
    super();
  }

  abstract getFolderSize(path: string): Observable<any>;

  listDir(params: IListDirParams): Observable<string> {
    const stream$ = new Subject<string>();
    this.fileWorkerService.startScan(stream$, params);
    return stream$;
  }

  deleteDir(path: string): Promise<{}> {
    return new Promise((resolve, reject) => {
      const command = `rm -rf "${path}"`;
      exec(command, (error, stdout, stderr) => {
        if (error) return reject(error);
        if (stderr) return reject(stderr);
        resolve(stdout);
      });
    });
  }

  protected prepareFindArgs(params: IListDirParams): string[] {
    const { path, target, exclude } = params;
    let args: string[] = [path];

    if (exclude) {
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
