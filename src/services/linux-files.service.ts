import { spawn } from 'child_process';

import { Observable } from 'rxjs';
import { map } from 'rxjs/operators/index.js';
import { UnixFilesService } from './unix-files.service.js';

export class LinuxFilesService extends UnixFilesService {
  getFolderSize(path: string): Observable<number> {
    const du = spawn('du', ['-s', '--apparent-size', '-k', path]);
    const cut = spawn('cut', ['-f', '1']);

    du.stdout.pipe(cut.stdin);

    return this.streamService.getStream(cut).pipe(map((size) => +size));
  }
}
