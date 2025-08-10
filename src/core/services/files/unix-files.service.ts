import { FileService } from './files.service.js';
import { StreamService } from '../stream.service.js';
import { FileWorkerService } from './files.worker.service.js';
import { DeletionStrategyManager } from './strategies/strategy-manager.js';
import {
  FindDeletionStrategy,
  PerlDeletionStrategy,
  RmRfDeletionStrategy,
  RsyncDeletionStrategy,
} from './index.js';

export class UnixFilesService extends FileService {
  constructor(
    protected streamService: StreamService,
    public override fileWorkerService: FileWorkerService,
    delstrategyManager: DeletionStrategyManager,
  ) {
    super(fileWorkerService, delstrategyManager);
    this.initializeStrategies();
  }

  async deleteDir(path: string): Promise<boolean> {
    try {
      return await this.delStrategyManager.deleteDirectory(path);
    } catch (error) {
      throw new Error(`Failed to delete directory ${path}: ${error}`);
    }
  }

  getSelectedDeletionStrategy(): string | null {
    const strategy = this.delStrategyManager.getSelectedStrategy();
    return strategy ? strategy.name : null;
  }

  resetDeletionStrategy(): void {
    this.delStrategyManager.resetStrategy();
  }

  private initializeStrategies() {
    // Order matter!
    this.delStrategyManager.registerStrategy(new PerlDeletionStrategy());
    this.delStrategyManager.registerStrategy(new RsyncDeletionStrategy());
    this.delStrategyManager.registerStrategy(new FindDeletionStrategy());
    this.delStrategyManager.registerStrategy(new RmRfDeletionStrategy());
  }
}
