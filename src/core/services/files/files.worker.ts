import { constants, Stats } from 'fs';
import { access, lstat, readdir } from 'fs/promises';
import EventEmitter from 'events';
import {
  WorkerMessage,
  WorkerScanRequest,
  WorkerSizeResult,
} from './files.worker.service.js';
import { join } from 'path';
import { MessagePort, parentPort } from 'node:worker_threads';
import { EVENTS, MAX_PROCS } from '../../../constants/workers.constants.js';
import { ScanWalker } from './scan-walker.js';
import { SharedScan } from './shared-scan.js';

enum ETaskOperation {
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
      if (message?.type === EVENTS.explore) {
        void startScan(message.value);
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
    });
  }

  async function startScan({
    scanId,
    buffer,
    options,
  }: WorkerScanRequest): Promise<void> {
    const shared = new SharedScan(buffer);
    const walker = new ScanWalker(shared, options, (results) =>
      tunnel.postMessage({
        type: EVENTS.scanResult,
        value: { results, scanId },
      }),
    );
    await walker.run();
    if (shared.isFinished()) {
      tunnel.postMessage({ type: EVENTS.scanFinished, value: { scanId } });
    }
  }

  function initFileWalkerListeners(): void {
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
  private taskQueue: Task[] = [];
  private completedTasks = 0;
  private procs = 0;

  enqueueTask(task: Task, priorize: boolean = false): void {
    if (priorize) {
      this.taskQueue.unshift(task);
    } else {
      this.taskQueue.push(task);
    }

    this.processQueue();
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
      await access(path, constants.R_OK | constants.X_OK);

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

  /*  get stats(): WorkerStats {
    return {
      pendingSearchTasks: this.taskQueue.length,
      completedSearchTasks: this.completedTasks,
      procs: this.procs,
    };
  } */
}
