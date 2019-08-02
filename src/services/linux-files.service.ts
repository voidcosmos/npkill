import { IFileService } from '../interfaces/file-service.interface';
import { Observable } from 'rxjs';
import { StreamService } from './stream.service';
import { spawn } from 'child_process';
import { FileService } from './files.service';

export class LinuxFilesService extends FileService implements IFileService {
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

  deleteDir(path: string): void {
    spawn('rm', ['-rf', path]);
  }
}
