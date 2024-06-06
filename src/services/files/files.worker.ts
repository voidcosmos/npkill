import { Dir, Dirent } from 'fs';
import { lstat, opendir, readdir, stat } from 'fs/promises';

import EventEmitter from 'events';
import { WorkerMessage } from './files.worker.service';
import { join } from 'path';
import { MessagePort, parentPort } from 'node:worker_threads';
import { IListDirParams } from '../../interfaces';
import { EVENTS, MAX_PROCS } from '../../constants/workers.constants.js';

enum ETaskOperation {
  'explore',
  'getFolderSize',
}
interface Task {
  operation: ETaskOperation;
  path: string;
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
  ): void {
    if (priorize) {
      this.taskQueue.unshift({ path, operation });
    } else {
      this.taskQueue.push({ path, operation });
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

    try {
      const size = await this.getFolderSize(path).catch(() => 0);
      this.events.emit('folderSizeResult', { path, size });
    } catch (_) {
      this.completeTask();
    }
  }

  async getFolderSize(dir: string): Promise<number> {
    async function calculateDirectorySize(directory: string): Promise<number> {
      const entries = await readdir(directory, { withFileTypes: true });

      const tasks = entries.map(async (entry) => {
        const fullPath = join(directory, entry.name);

        if (entry.isDirectory()) {
          // Ignore errors.
          return calculateDirectorySize(fullPath).catch(() => 0);
        } else if (entry.isFile()) {
          const fileStat = await lstat(fullPath);
          return fileStat.size;
        }

        return 0;
      });

      const sizes = await Promise.all(tasks);
      return sizes.reduce((total, size) => total + size, 0);
    }

    return calculateDirectorySize(dir);
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
    if (this.searchConfig.exclude === undefined) {
      return false;
    }

    for (let i = 0; i < this.searchConfig.exclude.length; i++) {
      const excludeString = this.searchConfig.exclude[i];
      if (path.includes(excludeString)) {
        return true;
      }
    }

    return false;
  }

  private isTargetFolder(path: string): boolean {
    // return basename(path) === this.searchConfig.target;
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

      if (task === null || task === undefined) {
        return;
      }

      const path = task.path;

      if (path === undefined || path === '') {
        return;
      }

      if (task.operation === ETaskOperation.explore) {
        this.run(path).then(
          () => {},
          () => {},
        );
      }

      if (task.operation === ETaskOperation.getFolderSize) {
        this.runGetFolderSize(path).then(
          () => {},
          () => {},
        );
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
