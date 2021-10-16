import { Observable } from 'rxjs';
import { spawn } from 'child_process';
import { map } from 'rxjs/operators/index.js';
import { UnixFilesService } from './unix-files.service.js';

export class MacFilesService extends UnixFilesService {
  getFolderSize(path: string): Observable<number> {
    const du = spawn('du', ['-sk', path]);
    const cut = spawn('cut', ['-f', '1']);

    du.stdout.pipe(cut.stdin);

    return this.streamService.getStream(cut).pipe(map((size) => +size));
  }
}
