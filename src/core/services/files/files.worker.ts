import { Dir, Dirent, Stats } from 'fs';
import { lstat, opendir, readdir } from 'fs/promises';
import EventEmitter from 'events';
import {
  WorkerMessage,
  WorkerScanOptions,
  WorkerSizeResult,
} from './files.worker.service.js';
import { join } from 'path';
import { MessagePort, parentPort } from 'node:worker_threads';
import { EVENTS, MAX_PROCS } from '../../../constants/workers.constants.js';
import { GLOBAL_IGNORE } from '../../constants/global-ignored.constants.js';

enum ETaskOperation {
  explore,
  getSize,
  getSizeChild,
}

interface SizeCollector {
  rootPath: string;
  total: number;
  pending: number;
  error?: string;
  onComplete: (total: number, error?: string) => void;
}

interface Task {
  operation: ETaskOperation;
  path: string;
  scanId?: number;
  sizeRequestId?: number;
  sizeCollector?: SizeCollector;
}

(() => {
  let id = 0;
  let fileWalker: FileWalker;
  let tunnel: MessagePort;

  if (parentPort === null) {
    throw new Error('Worker must be spawned from a parent thread.');
  }

  parentPort.on('message', (message: WorkerMessage) => {
    if (message?.type === EVENTS.startup) {
      id = message.value.id;
      tunnel = message.value.channel;
      fileWalker = new FileWalker();
      initTunnelListeners();
      initFileWalkerListeners();
      notifyWorkerReady();
    }
  });

  function notifyWorkerReady(): void {
    tunnel.postMessage({
      type: EVENTS.alive,
      value: null,
    });
  }

  function initTunnelListeners(): void {
    tunnel.on('message', (message: WorkerMessage) => {
      if (message?.type === EVENTS.exploreConfig) {
        fileWalker.setSearchConfig(message.value);
      }

      if (message?.type === EVENTS.explore) {
        fileWalker.enqueueTask({
          operation: ETaskOperation.explore,
          path: message.value.path,
          scanId: message.value.scanId,
        });
      }

      if (message?.type === EVENTS.getSize) {
        fileWalker.enqueueTask(
          {
            operation: ETaskOperation.getSize,
            path: message.value.path,
            sizeRequestId: message.value.id,
          },
          true,
        );
      }

      if (message?.type === EVENTS.stop) {
        fileWalker.stop();
      }
    });
  }

  function initFileWalkerListeners(): void {
    fileWalker.events.on('newResult', ({ results, scanId }) => {
      tunnel.postMessage({
        type: EVENTS.scanResult,
        value: { results, workerId: id, scanId },
      });
    });

    fileWalker.events.on('sizeResult', (result: WorkerSizeResult) => {
      tunnel.postMessage({
        type: EVENTS.GetSizeResult,
        value: {
          results: result,
          workerId: id,
        },
      });
    });
  }
})();

class FileWalker {
  readonly events = new EventEmitter();
  private searchConfig: WorkerScanOptions = {
    rootPath: '',
    targets: [''],
    exclude: [],
  };

  private taskQueue: Task[] = [];
  private completedTasks = 0;
  private procs = 0;

  setSearchConfig(params: WorkerScanOptions): void {
    this.searchConfig = params;
  }

  stop(): void {
    this.taskQueue = this.taskQueue.filter(
      (task) => task.operation !== ETaskOperation.explore,
    );
  }

  enqueueTask(task: Task, priorize: boolean = false): void {
    if (priorize) {
      this.taskQueue.unshift(task);
    } else {
      this.taskQueue.push(task);
    }

    this.processQueue();
  }

  private async run(path: string, scanId?: number): Promise<void> {
    this.updateProcs(1);

    try {
      const dir = await opendir(path);
      await this.analizeDir(path, dir, scanId);
    } catch {
      this.completeTask();
      this.events.emit('newResult', { results: [], scanId });
    }
  }

  private async analizeDir(
    path: string,
    dir: Dir,
    scanId?: number,
  ): Promise<void> {
    const results = [];
    let entry: Dirent | null = null;

    while ((entry = await dir.read().catch(() => null)) != null) {
      this.newDirEntry(path, entry, results);
    }

    await dir.close();
    this.completeTask();
    this.events.emit('newResult', { results, scanId });

    if (this.taskQueue.length === 0 && this.procs === 0) {
      this.completeAll();
    }
  }

  private async runGetSize(
    path: string,
    sizeRequestId?: number,
  ): Promise<void> {
    this.updateProcs(1);
    const emitResult = (size: number, error?: string): void => {
      this.events.emit('sizeResult', {
        id: sizeRequestId,
        path,
        size,
        error,
      });
    };

    try {
      const stats = await lstat(path);
      if (!stats.isDirectory()) {
        emitResult(this.getDiskUsage(stats));
        return;
      }

      this.enqueueTask({
        operation: ETaskOperation.getSizeChild,
        path,
        sizeCollector: {
          rootPath: path,
          total: 0,
          pending: 1,
          onComplete: emitResult,
        },
      });
    } catch (error) {
      emitResult(0, (error as Error).message);
    } finally {
      this.completeTask();
    }
  }

  private async runGetSizeChild(
    path: string,
    collector: Task['sizeCollector'],
  ): Promise<void> {
    if (!collector) {
      // Should not happen with proper initiation, but safe.
      this.completeTask();
      return;
    }

    this.updateProcs(1);

    try {
      const entries = await readdir(path, { withFileTypes: true });
      let currentLevelSize = 0;
      const directoriesToProcess: string[] = [];

      for (let i = 0; i < entries.length; i += 100) {
        const chunk = entries.slice(i, i + 100);
        await Promise.all(
          chunk.map(async (entry) => {
            const fullPath = join(path, entry.name);
            try {
              if (entry.isSymbolicLink()) {
                return;
              }

              if (entry.isDirectory()) {
                currentLevelSize += 4096; // General directory size
                directoriesToProcess.push(fullPath);
              } else {
                const stats = await lstat(fullPath);
                currentLevelSize += this.getDiskUsage(stats);
              }
            } catch {
              // Ignore permissions errors.
            }
          }),
        );
      }

      collector.total += currentLevelSize;
      collector.pending += directoriesToProcess.length;

      for (const dirPath of directoriesToProcess) {
        this.enqueueTask({
          operation: ETaskOperation.getSizeChild,
          path: dirPath,
          sizeCollector: collector,
        });
      }
    } catch (error) {
      if (path === collector.rootPath) {
        collector.error = (error as Error).message;
      }
    } finally {
      collector.pending -= 1;
      this.completeTask();

      if (collector.pending === 0) {
        collector.onComplete(collector.total, collector.error);
      }
    }
  }

  private getDiskUsage(stats: Stats): number {
    return typeof stats.blocks === 'number' ? stats.blocks * 512 : stats.size;
  }

  private newDirEntry(
    path: string,
    entry: Dirent,
    results: { path: string; isTarget: boolean }[],
  ): void {
    if (entry.isSymbolicLink() || !entry.isDirectory()) {
      return;
    }

    const isTarget = this.isTarget(entry.name);

    if (GLOBAL_IGNORE.has(entry.name) && !isTarget) {
      return;
    }

    const subpath = join(path, entry.name);

    if (this.isExcluded(subpath)) {
      return;
    }

    results.push({
      path: subpath,
      isTarget,
    });
  }

  private isExcluded(path: string): boolean {
    if (this.searchConfig.exclude == null) {
      return false;
    }
    return this.searchConfig.exclude.some((ex) => path.includes(ex));
  }

  private isTarget(path: string): boolean {
    return this.searchConfig.targets.includes(path);
  }

  private completeTask(): void {
    this.updateProcs(-1);
    this.processQueue();
    this.completedTasks++;
  }

  private updateProcs(value: number): void {
    this.procs += value;
  }

  private processQueue(): void {
    while (this.procs < MAX_PROCS && this.taskQueue.length > 0) {
      const task = this.taskQueue.shift();
      if (!task?.path) {
        continue;
      }

      switch (task.operation) {
        case ETaskOperation.explore:
          this.run(task.path, task.scanId).catch(() => {
            this.completeTask();
          });
          break;
        case ETaskOperation.getSize:
          this.runGetSize(task.path, task.sizeRequestId).catch(() => {
            // If runGetSize fails, we need to emit a size of 0
            // Otherwise the stream will hang forever
            this.events.emit('sizeResult', {
              id: task.sizeRequestId,
              path: task.path,
              size: 0,
            });
          });
          break;
        case ETaskOperation.getSizeChild:
          this.runGetSizeChild(task.path, task.sizeCollector).catch(() => {
            // Ensure we always decrement the collector even on errors
            if (task.sizeCollector == null) {
              // This shouldn't happen, but if it does, we can't recover properly
              // The best we can do is not crash
              return;
            }

            task.sizeCollector.pending -= 1;
            if (task.sizeCollector.pending === 0) {
              task.sizeCollector.onComplete(task.sizeCollector.total);
            }

            this.completeTask();
          });
          break;
      }
    }
  }

  private completeAll(): void {
    // Any future action.
  }

  /*  get stats(): WorkerStats {
    return {
      pendingSearchTasks: this.taskQueue.length,
      completedSearchTasks: this.completedTasks,
      procs: this.procs,
    };
  } */
}
