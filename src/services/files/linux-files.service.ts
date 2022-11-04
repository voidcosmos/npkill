import { spawn } from 'child_process';
import { readdir, stat } from 'fs/promises';
import path, { join } from 'path';

import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { UnixFilesService } from './unix-files.service.js';

export class LinuxFilesService extends UnixFilesService {
  getFolderSize(path: string): Observable<number> {
    const du = spawn('du', ['-sk', path]);
    const cut = spawn('cut', ['-f', '1']);
    du.stdout.pipe(cut.stdin);

    // const command = spawn('sh', ['-c', `du -sk ${path} | cut -f 1`]);
    // return this.streamService.getStream(command).pipe(map((size) => +size));
    //
    return this.streamService.getStream(cut).pipe(map((size) => +size));
    // const stream$ = new BehaviorSubject(null);
    // this.fileWorkerService.getSize(stream$, path);
    // this.dirSize(path).then((result) => {
    //   stream$.next(result / 1024);
    // });
    // return stream$;
  }
}
