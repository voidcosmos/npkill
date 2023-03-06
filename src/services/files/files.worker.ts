'use strict';

import { Dirent, opendir } from 'fs';

import EventEmitter from 'events';
import { WorkerStats } from './files.worker.service';
import { parentPort } from 'worker_threads';

enum ETaskOperation {
  'explore',
  'getSize',
}
interface Task {
  operation: ETaskOperation;
  path: string;
}

(() => {
  let fileWalker: FileWalker = null;

  parentPort.postMessage({
    type: 'alive',
    value: null,
  });

  parentPort.on('message', (data) => {
    if (fileWalker === null) {
      fileWalker = new FileWalker();
      initListeners();
    }

    if (data?.type === 'explore') {
      explore(data.value.path);
    }
  });

  function initListeners() {
    fileWalker.onNewResult(({ path, dirent }) => {
      parentPort.postMessage({ type: 'scan-result', value: path });
    });

    fileWalker.onQueueEmpty(() => {
      parentPort.postMessage({ type: 'scan-job-completed' });
    });

    fileWalker.onStats((stats: WorkerStats) => {
      parentPort.postMessage({ type: 'stats', value: stats });
    });
  }

  function explore(path: string) {
    fileWalker.enqueueTask(path);
  }
})();

class FileWalker {
  readonly events = new EventEmitter();

  private taskQueue: Task[] = [];
  private completedTasks = 0;
  private procs = 0;
  // More PROCS improve the speed of the search, but increment
  // but it will greatly increase the maximum ram usage.
  private readonly MAX_PROCS = 100;
  private VERBOSE = false;

  constructor() {
    setInterval(() => this.events.emit('onStats'), 500);
  }

  onQueueEmpty(fn: () => void) {
    this.events.on('onCompleted', () => fn());
  }

  onNewResult(fn: (result: { path: string; dirent: Dirent }) => void) {
    this.events.on('onResult', (result) => fn(result));
  }

  onStats(fn: any) {
    this.events.on('onStats', () => fn(this.stats));
  }

  enqueueTask(path: string) {
    this.taskQueue.push({ path, operation: ETaskOperation.explore });
    this.processQueue();
  }

  private run(path: string) {
    this.updateProcs(1);

    opendir(path, async (err, dir) => {
      if (err) {
        this.completeTask();
        return;
      }

      let entry: Dirent | null = null;
      while ((entry = await dir.read().catch(() => null)) != null) {
        if (entry.isDirectory()) {
          const subpath = (path === '/' ? '' : path) + '/' + entry.name;
          this.onResult(subpath, entry);
        }
      }

      await dir.close();
      this.completeTask();

      if (this.taskQueue.length === 0 && this.procs === 0) {
        this.onCompleted();
      }
    });
  }

  private completeTask() {
    this.updateProcs(-1);
    this.processQueue();
    this.completedTasks++;
  }

  private updateProcs(value: number) {
    this.procs += value;

    // if (this.VERBOSE) {
    //   this.events.emit('stats', {
    //     type: 'proc',
    //     value: { procs: this.procs, mem: memoryUsage() },
    //   });
    // }
  }

  private processQueue() {
    while (this.procs < this.MAX_PROCS && this.taskQueue.length > 0) {
      const path = this.taskQueue.shift().path;
      this.run(path);
    }
  }

  private onResult(path: string, dirent: Dirent) {
    this.events.emit('onResult', { path, dirent });
  }

  private onCompleted() {
    this.events.emit('onStats');
    this.events.emit('onCompleted');
  }

  get stats(): WorkerStats {
    return {
      pendingSearchTasks: this.taskQueue.length,
      completedSearchTasks: this.completedTasks,
      procs: this.procs,
    };
  }
}
