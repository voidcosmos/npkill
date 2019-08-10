import { exec, spawn } from 'child_process';

import { FileService } from './files.service';
import { Observable } from 'rxjs';
import { StreamService } from './stream.service';

export class LinuxFilesService extends FileService {
  constructor(private streamService: StreamService) {
    super();
  }

  getFolderSize(path: string): Observable<{}> {
    const du = spawn('du', ['-sm', path, '--max-depth', '0']);
    const cut = spawn('cut', ['-f', '1']);

    du.stdout.pipe(cut.stdin);

    return this.streamService.getStream(cut);
  }

  listDir(path: string): Observable<{}> {
    const child = spawn('find', [
      path,
      '-name',
      'node_modules',
      '-type',
      'd',
      '-prune',
    ]);
    return this.streamService.getStream(child);
  }

  /* deleteDir(path: string): Observable<{}> {
    const child = spawn('rm', ['-rf', path]);
    return this.streamService.getStream(child);
  } */

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
}
/* 
const lf = new LinuxFilesService(new StreamService());

lf.deleteDir('/home/nya/Programming/node_modules');
 */
