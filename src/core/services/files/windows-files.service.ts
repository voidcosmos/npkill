import { Subject, Observable } from 'rxjs';
import { FileService } from './files.service.js';
import { FileWorkerService } from './files.worker.service.js';
import { ScanOptions } from '@core/index.js';
import { StreamService } from '../stream.service.js';
import { rm } from 'fs/promises';

export class WindowsFilesService extends FileService {
  constructor(
    private readonly streamService: StreamService,
    public override fileWorkerService: FileWorkerService,
  ) {
    super(fileWorkerService);
  }

  listDir(path: string, params: ScanOptions): Observable<string> {
    const stream$ = new Subject<string>();
    this.fileWorkerService.startScan(stream$, { ...params, rootPath: path });
    return stream$;
  }

  async deleteDir(path: string): Promise<boolean> {
    await rm(path, { recursive: true, force: true });
    return true;
  }
}
