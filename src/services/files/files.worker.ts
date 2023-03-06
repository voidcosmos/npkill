'use strict';

import { Dirent, opendir } from 'fs';

import EventEmitter from 'events';
import { WorkerStats } from './files.worker.service';
import { parentPort } from 'worker_threads';
import { basename } from 'path';

enum ETaskOperation {
  'explore',
  'getSize',
}
interface Task {
  operation: ETaskOperation;
  path: string;
}

(() => {
  let id = 0;
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

    if (data?.type === 'assign-id') {
      id = data.value;
    }

    if (data?.type === 'explore') {
      fileWalker.enqueueTask(data.value.path);
    }
  });

  function initListeners() {
    fileWalker.events.on('onResult', ({ results }) => {
      parentPort.postMessage({
        type: 'scan-result',
        value: { results, workerId: id, pending: fileWalker.pendingJobs },
      });
    });

    fileWalker.events.on('onCompleted', () => {
      parentPort.postMessage({ type: 'scan-job-completed' });
    });

    fileWalker.events.on('alternative-stats', (stats: WorkerStats) => {
      parentPort.postMessage({
        type: 'alternative-stats',
        value: { workerId: id, pending: fileWalker.pendingJobs },
      });
    });
    fileWalker.events.on('onStats', (stats: WorkerStats) => {
      parentPort.postMessage({ type: 'stats', value: stats });
    });
  }
})();

class FileWalker {
  readonly events = new EventEmitter();

  private taskQueue: Task[] = [];
  private completedTasks = 0;
  private procs = 0;
  // More PROCS improve the speed of the search, but increment
  // but it will greatly increase the maximum ram usage.
  private readonly MAX_PROCS = 1;

  get pendingJobs() {
    return this.taskQueue.length;
  }
  constructor() {
    // setInterval(() => this.events.emit('onStats'), 500);
  }

  enqueueTask(path: string) {
    if (basename(path) === '.git') {
      this.processQueue();
      return;
    }
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

      const toEmit = [];
      let entry: Dirent | null = null;
      while ((entry = await dir.read().catch(() => null)) != null) {
        if (entry.isDirectory()) {
          const subpath = (path === '/' ? '' : path) + '/' + entry.name;
          toEmit.push(subpath);
        } else {
        }
      }

      this.events.emit('onResult', { results: toEmit });
      if (toEmit.length === 0) {
        this.events.emit('alternative-stats');
      }
      await dir.close();
      this.completeTask();

      if (this.taskQueue.length === 0 && this.procs === 0) {
        this.completeAll();
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
  }

  private processQueue() {
    while (this.procs < this.MAX_PROCS && this.taskQueue.length > 0) {
      const path = this.taskQueue.shift().path;
      this.run(path);
    }
  }

  private onResult(path: string) {
    this.events.emit('onResult', { path });
  }

  private completeAll() {
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
