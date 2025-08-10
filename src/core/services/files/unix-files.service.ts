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
  private readonly strategyManager: DeletionStrategyManager;

  constructor(
    protected streamService: StreamService,
    public override fileWorkerService: FileWorkerService,
  ) {
    super(fileWorkerService);
    this.strategyManager = new DeletionStrategyManager();
    this.initializeStrategies();
  }

  async deleteDir(path: string): Promise<boolean> {
    try {
      return await this.strategyManager.deleteDirectory(path);
    } catch (error) {
      throw new Error(`Failed to delete directory ${path}: ${error}`);
    }
  }

  getSelectedDeletionStrategy(): string | null {
    const strategy = this.strategyManager.getSelectedStrategy();
    return strategy ? strategy.name : null;
  }

  resetDeletionStrategy(): void {
    this.strategyManager.resetStrategy();
  }

  private initializeStrategies() {
    // Order matter!
    this.strategyManager.registerStrategy(new PerlDeletionStrategy());
    this.strategyManager.registerStrategy(new RsyncDeletionStrategy());
    this.strategyManager.registerStrategy(new FindDeletionStrategy());
    this.strategyManager.registerStrategy(new RmRfDeletionStrategy());
  }
}
