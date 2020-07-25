import { StreamService } from '@core/services';
import { spawn } from 'child_process';

import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { UnixFilesService } from './unix-files.service';

export class LinuxFilesService extends UnixFilesService {
  constructor(streamService: StreamService) {
    super(streamService);
  }

  getFolderSize(path: string): Observable<{}> {
    const du = spawn('du', ['-s', '--apparent-size', '-k', path]);
    const cut = spawn('cut', ['-f', '1']);

    du.stdout.pipe(cut.stdin);

    return this.streamService.getStream(cut).pipe(map((size) => +size));
  }
}
