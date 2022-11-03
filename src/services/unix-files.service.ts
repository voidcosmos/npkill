import { exec, spawn } from 'child_process';
import ansiEscapes from 'ansi-escapes';

import { FileService } from './files.service.js';
import { IFolder, IListDirParams } from '../interfaces/index.js';
import { BehaviorSubject, Observable } from 'rxjs';
import { StreamService } from './stream.service.js';
import { opendir, readdir } from 'fs/promises';
import { Dirent } from 'fs';
import { runWorker } from './files/files.worker.js';

export abstract class UnixFilesService extends FileService {
  constructor(protected streamService: StreamService) {
    super();
  }

  abstract getFolderSize(path: string): Observable<any>;

  listDir(params: IListDirParams): Observable<string> {
    const stream$ = new BehaviorSubject(null);
    runWorker(stream$, params);
    // this.search(stream, params, params.path);
    return stream$;
  }

  private counter = 0;

  private async search(
    stream$: BehaviorSubject<string>,
    params: IListDirParams,
    path: string,
  ) {
    this.updateCounter(1);
    const dir = await opendir(params.path).catch(() => null);
    if (dir === null) {
      this.updateCounter(-1);
      return;
    }

    let entry: Dirent;
    while ((entry = await dir.read().catch(() => null)) != null) {
      if (entry.isDirectory()) {
        const subpath = (path === '/' ? '' : path) + '/' + entry.name;
        if (entry.name === params.target) {
          stream$.next(subpath);
        } else {
          params.path = subpath;
          this.search(stream$, params, subpath);
        }
      }
    }
    await dir.close();
    this.updateCounter(-1);
  }

  // This methods is only temporal for debug.
  private updateCounter(i: number) {
    this.counter += i;
    this.print(ansiEscapes.cursorTo(40, 0));
    this.print('Opened dirs: ' + this.counter + '       ');
  }

  private print(value: string): void {
    process.stdout.write.bind(process.stdout)(value);
  }
  //////////////////////////////////////////

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
