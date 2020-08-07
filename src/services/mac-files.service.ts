import { Observable } from 'rxjs';
import { spawn } from 'child_process';
import { StreamService } from './stream.service';
import { map } from 'rxjs/operators';
import { UnixFilesService } from './unix-files.service';

export class MacFilesService extends UnixFilesService {
  getFolderSize(path: string): Observable<any> {
    const du = spawn('du', ['-sk', path]);
    /* stat -f %z | awk '{t+=$1}END{print t}' */
    const cut = spawn('cut', ['-f', '1']);

    du.stdout.pipe(cut.stdin);

    return this.streamService.getStream(cut).pipe(map((size) => +size));
  }
}
