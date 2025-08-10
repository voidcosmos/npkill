import { FileService } from './files.service.js';
import { FileWorkerService } from './files.worker.service.js';
import { StreamService } from '../stream.service.js';
import { DeletionStrategyManager } from './strategies/strategy-manager.js';
import {
  RobocopyDeletionStrategy,
  PowerShellDeletionStrategy,
  NodeRmDeletionStrategy,
} from './strategies/index.js';

export class WindowsFilesService extends FileService {
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
    // Order matters!
    this.delStrategyManager.registerStrategy(new RobocopyDeletionStrategy());
    this.delStrategyManager.registerStrategy(new PowerShellDeletionStrategy());
    this.delStrategyManager.registerStrategy(new NodeRmDeletionStrategy());
  }
}
