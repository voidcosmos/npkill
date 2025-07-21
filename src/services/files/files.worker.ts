import { Dir, Dirent } from 'fs';
import { lstat, opendir, readdir } from 'fs/promises';
import EventEmitter from 'events';
import { WorkerMessage } from './files.worker.service';
import { join } from 'path';
import { MessagePort, parentPort } from 'node:worker_threads';
import { IListDirParams } from '../../interfaces';
import { EVENTS, MAX_PROCS } from '../../constants/workers.constants.js';

enum ETaskOperation {
  'explore',
  'getFolderSize',
  'getFolderSizeChild',
}

interface Task {
  operation: ETaskOperation;
  path: string;
  sizeCollector?: {
    total: number;
    pending: number;
    onComplete: (total: number) => void;
  };
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
        fileWalker.enqueueTask(message.value.path, ETaskOperation.explore);
      }

      if (message?.type === EVENTS.getFolderSize) {
        fileWalker.enqueueTask(
          message.value.path,
          ETaskOperation.getFolderSize,
          true,
        );
      }
    });
  }

  function initFileWalkerListeners(): void {
    fileWalker.events.on('newResult', ({ results }) => {
      tunnel.postMessage({
        type: EVENTS.scanResult,
        value: { results, workerId: id, pending: fileWalker.pendingJobs },
      });
    });

    fileWalker.events.on(
      'folderSizeResult',
      (result: { path: string; size: number }) => {
        tunnel.postMessage({
          type: EVENTS.getFolderSizeResult,
          value: {
            results: result,
            workerId: id,
            pending: fileWalker.pendingJobs,
          },
        });
      },
    );
  }
})();

class FileWalker {
  readonly events = new EventEmitter();
  private searchConfig: IListDirParams = {
    path: '',
    target: '',
    exclude: [],
  };

  private readonly taskQueue: Task[] = [];
  private completedTasks = 0;
  private procs = 0;

  setSearchConfig(params: IListDirParams): void {
    this.searchConfig = params;
  }

  enqueueTask(
    path: string,
    operation: ETaskOperation,
    priorize: boolean = false,
    sizeCollector?: Task['sizeCollector'],
  ): void {
    const task: Task = { path, operation };
    if (sizeCollector) {
      task.sizeCollector = sizeCollector;
    }

    if (priorize) {
      this.taskQueue.unshift(task);
    } else {
      this.taskQueue.push(task);
    }

    this.processQueue();
  }

  private async run(path: string): Promise<void> {
    this.updateProcs(1);

    try {
      const dir = await opendir(path);
      await this.analizeDir(path, dir);
    } catch (_) {
      this.completeTask();
    }
  }

  private async analizeDir(path: string, dir: Dir): Promise<void> {
    const results = [];
    let entry: Dirent | null = null;
    while ((entry = await dir.read().catch(() => null)) != null) {
      this.newDirEntry(path, entry, results);
    }

    this.events.emit('newResult', { results });
    await dir.close();
    this.completeTask();

    if (this.taskQueue.length === 0 && this.procs === 0) {
      this.completeAll();
    }
  }

  private async runGetFolderSize(path: string): Promise<void> {
    this.updateProcs(1);

    const collector = {
      total: 0,
      pending: 0,
      onComplete: (finalSize: number) => {
        this.events.emit('folderSizeResult', { path, size: finalSize });
      },
    };

    this.calculateFolderSizeRecursive(path, collector);
    this.completeTask();
  }

  private async calculateFolderSizeRecursive(
    path: string,
    collector: Task['sizeCollector'],
  ): Promise<void> {
    if (!collector) return;

    collector.pending += 1;
    this.updateProcs(1);

    try {
      const entries = await readdir(path, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(path, entry.name);

        let stats;
        try {
          stats = await lstat(fullPath);
        } catch {
          continue; // Skip files we can't access
        }

        if (stats.isSymbolicLink()) {
          continue;
        }

        const size =
          typeof stats.blocks === 'number' ? stats.blocks * 512 : stats.size;
        collector.total += size;

        if (stats.isDirectory()) {
          // Process subdirectory recursively
          this.calculateFolderSizeRecursive(fullPath, collector);
        }
      }
    } catch (error) {
      // Handle directory access errors gracefully
      console.warn(`Failed to read directory: ${path}`, error);
    } finally {
      // Always decrement pending count
      collector.pending -= 1;
      this.updateProcs(-1);

      // Check if all work is complete
      if (collector.pending === 0) {
        collector.onComplete(collector.total);
      }
    }
  }

  private async runGetFolderSizeChild(
    path: string,
    collector: Task['sizeCollector'],
  ): Promise<void> {
    if (!collector) {
      this.completeTask();
      return;
    }

    this.updateProcs(1);

    try {
      const entries = await readdir(path, { withFileTypes: true });
      const directoriesToProcess: string[] = [];
      const promises: Promise<void>[] = [];

      for (const entry of entries) {
        const fullPath = join(path, entry.name);

        if (entry.isSymbolicLink()) {
          continue;
        }

        if (entry.isDirectory()) {
          directoriesToProcess.push(fullPath);
          promises.push(
            lstat(fullPath)
              .then((stats) => {
                const size =
                  typeof stats.blocks === 'number'
                    ? stats.blocks * 512
                    : stats.size;
                collector.total += size;
              })
              .catch(() => {}),
          );
        } else if (entry.isFile()) {
          promises.push(
            lstat(fullPath)
              .then((stats) => {
                const size =
                  typeof stats.blocks === 'number'
                    ? stats.blocks * 512
                    : stats.size;
                collector.total += size;
              })
              .catch(() => {}),
          );
        }
      }

      await Promise.all(promises);

      collector.pending += directoriesToProcess.length;
      for (const dirPath of directoriesToProcess) {
        this.enqueueTask(
          dirPath,
          ETaskOperation.getFolderSizeChild,
          false,
          collector,
        );
      }
    } catch (error) {
    } finally {
      collector.pending -= 1;

      if (collector.pending === 0) {
        collector.onComplete(collector.total);
      }

      this.completeTask();
    }
  }

  private newDirEntry(path: string, entry: Dirent, results: any[]): void {
    const subpath = join(path, entry.name);
    const shouldSkip = !entry.isDirectory() || this.isExcluded(subpath);
    if (shouldSkip) {
      return;
    }

    results.push({
      path: subpath,
      isTarget: this.isTargetFolder(entry.name),
    });
  }

  private isExcluded(path: string): boolean {
    if (!this.searchConfig.exclude) {
      return false;
    }
    return this.searchConfig.exclude.some((ex) => path.includes(ex));
  }

  private isTargetFolder(path: string): boolean {
    return path === this.searchConfig.target;
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
      if (!task || !task.path) continue;

      switch (task.operation) {
        case ETaskOperation.explore:
          this.run(task.path).catch((error) => {
            console.warn(`Explore task failed for ${task.path}:`, error);
            this.completeTask();
          });
          break;
        case ETaskOperation.getFolderSize:
          this.runGetFolderSize(task.path);
          break;
        case ETaskOperation.getFolderSizeChild:
          this.runGetFolderSizeChild(task.path, task.sizeCollector!).catch(
            (error) => {
              if (!task.sizeCollector) {
                return;
              }

              task.sizeCollector.pending -= 1;
              if (task.sizeCollector.pending === 0) {
                task.sizeCollector.onComplete(task.sizeCollector.total);
              }
            },
          );
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

  get pendingJobs(): number {
    return this.taskQueue.length;
  }
}
