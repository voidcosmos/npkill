import { Subject, Observable } from 'rxjs';
import { FileService } from './files.service.js';
import { FileWorkerService } from './files.worker.service.js';
import { ScanOptions } from '@core/index.js';
import { StreamService } from '../stream.service.js';
import { rm } from 'fs/promises';
import { DeletionStrategyManager } from './strategies/index.js';

export class WindowsFilesService extends FileService {
  constructor(
    private readonly streamService: StreamService,
    public override fileWorkerService: FileWorkerService,
    delstrategyManager: DeletionStrategyManager,
  ) {
    super(fileWorkerService, delstrategyManager);
  }

  async deleteDir(path: string): Promise<boolean> {
    await rm(path, { recursive: true, force: true });
    return true;
  }
}
