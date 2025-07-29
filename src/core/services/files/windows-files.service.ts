import { Subject, Observable } from 'rxjs';
import { FileService } from './files.service.js';
import { FileWorkerService } from './files.worker.service.js';
import { WindowsStrategyManager } from './strategies/windows-remove-dir.strategy.js';
import { ScanOptions } from '@core/index.js';
import { StreamService } from '../stream.service.js';

export class WindowsFilesService extends FileService {
  private readonly windowsStrategyManager: WindowsStrategyManager =
    new WindowsStrategyManager();

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
    return this.windowsStrategyManager.deleteDir(path);
  }
}
