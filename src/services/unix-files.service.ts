import { StreamService } from './stream.service.js';
import { Observable } from 'rxjs';
import { spawn, exec } from 'child_process';
import { IListDirParams } from '../interfaces/index.js';
import { FileService } from './files.service.js';
import trash from 'trash';

export abstract class UnixFilesService extends FileService {
  constructor(protected streamService: StreamService) {
    super();
  }

  abstract getFolderSize(path: string): Observable<any>;

  listDir(params: IListDirParams): Observable<Buffer> {
    const args = this.prepareFindArgs(params);

    const child = spawn('find', args);

    return this.streamService.getStream(child);
  }

  deleteDir(path: string, moveToTrash: boolean): Promise<{}> {
    if (moveToTrash) {
      return trash(path)
        .then(() => Promise.resolve({}))
    } else {
      return new Promise((resolve, reject) => {
        const command = `rm -rf "${path}"`;
        exec(command, (error, stdout, stderr) => {
          if (error) return reject(error);
          if (stderr) return reject(stderr);
          resolve(stdout);
        });
      });
    }
  }

  protected prepareFindArgs(params: IListDirParams): string[] {
    const { path, target, exclude } = params;
    let args: string[] = [path];

    if (exclude) {
      args = [...args, this.prepareExcludeArgs(exclude)].flat();
    }

    args = [...args, '-name', target, '-type', 'd', '-prune'];

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
