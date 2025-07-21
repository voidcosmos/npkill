import { StreamService } from '../index.js';

import { Subject, Observable } from 'rxjs';
import { FileService } from './files.service.js';
import { WindowsStrategyManager } from '../../strategies/windows-remove-dir.strategy.js';
import { FileWorkerService } from './files.worker.service.js';
import { IListDirParams } from '../../interfaces/list-dir-params.interface.js';

export class WindowsFilesService extends FileService {
  private readonly windowsStrategyManager: WindowsStrategyManager =
    new WindowsStrategyManager();

  constructor(
    private readonly streamService: StreamService,
    public override fileWorkerService: FileWorkerService,
  ) {
    super(fileWorkerService);
  }

  listDir(params: IListDirParams): Observable<string> {
    const stream$ = new Subject<string>();
    this.fileWorkerService.startScan(stream$, params);
    return stream$;
  }

  async deleteDir(path: string): Promise<boolean> {
    return this.windowsStrategyManager.deleteDir(path);
  }
}
