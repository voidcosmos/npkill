import { exec } from 'child_process';

import { FileService } from './files.service.js';
import { Observable, Subject } from 'rxjs';
import { StreamService } from '../stream.service.js';
import { FileWorkerService } from './files.worker.service.js';
import { ScanOptions } from '@core/index.js';

export class UnixFilesService extends FileService {
  constructor(
    protected streamService: StreamService,
    public override fileWorkerService: FileWorkerService,
  ) {
    super(fileWorkerService);
  }

  listDir(path: string, params: ScanOptions): Observable<string> {
    const stream$ = new Subject<string>();
    this.fileWorkerService.startScan(stream$, { ...params, rootPath: path });
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

  protected prepareFindArgs(path: string, params: ScanOptions): string[] {
    const { targets, exclude } = params;
    let args: string[] = [path];

    if (exclude !== undefined && exclude.length > 0) {
      args = [...args, this.prepareExcludeArgs(exclude)].flat();
    }

    args = [...args, '-name', targets[0], '-prune'];

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
