import { IFileService } from '../interfaces/file.interface';
import { Observable } from 'rxjs';
import { StreamService } from './stream.service';
import { spawn } from 'child_process';

export class LinuxFilesService implements IFileService {
  public constructor(private streamService: StreamService) {}

  public getFolderSize(path: string): Observable<{}> {
    const du = spawn('du', ['-sm', path, '--max-depth', '0']);
    const cut = spawn('cut', ['-f', '1']);

    du.stdout.pipe(cut.stdin);

    return this.streamService.getStream(cut);
  }

  public listDir(path: string): Observable<{}> {
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

  public deleteDir(path: string): void {
    spawn('rm', ['-rf', path]);
  }
}
