'use strict';

import { Dirent, opendir } from 'fs';

import EventEmitter from 'events';
import { memoryUsage } from 'process';
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
  parentPort.on('message', (data) => {
    if (data?.type === 'start-explore') {
      startExplore(data.value.path);
    }

    if (data?.type === 'start-getSize') {
      // startGetSize(data.value.path, data.value.id);
      parentPort.postMessage({
        type: 'getsize-job-completed-' + data.value.id,
        value: -1,
      });
    }
  });

  function startExplore(path: string) {
    const fileWalker = new FileWalker();
    fileWalker.enqueueTask(path);

    fileWalker.onNewResult(({ path, dirent }) => {
      if (dirent.isDirectory()) {
        const subpath = (path === '/' ? '' : path) + '/' + dirent.name;
        if (dirent.name === 'node_modules') {
          parentPort.postMessage({ type: 'scan-result', value: subpath });
        } else {
          fileWalker.enqueueTask(subpath);
        }
      }
    });

    fileWalker.onQueueEmpty(() => {
      parentPort.postMessage({ type: 'scan-job-completed' });
    });

    fileWalker.onStats((stats: WorkerStats) => {
      parentPort.postMessage({ type: 'stats', value: stats });
    });
  }

  // Unnused for now because 'du' is much faster.
  //
  // function startGetSize(path: string, id: number) {
  //   const fileWalker = new FileWalker();
  //   let size = 0;
  //   let allFilesScanned = false;
  //   let getSizeInProgress = false;
  //   fileWalker.enqueueTask(path);

  //   const sendResult = () => {
  //     parentPort.postMessage({
  //       type: 'getsize-job-completed-' + id,
  //       value: size,
  //     });
  //   };

  //   const getSize = async (path: string) => {
  //     getSizeInProgress = true;
  //     size += (await stat(path)).size;
  //     getSizeInProgress = false;
  //     if (allFilesScanned) {
  //       sendResult();
  //     }
  //   };

  //   fileWalker.onNewResult(({ path, dirent }) => {
  //     const subpath = (path === '/' ? '' : path) + '/' + dirent.name;
  //     if (dirent.isDirectory()) {
  //       fileWalker.enqueueTask(subpath);
  //     } else if (dirent.isFile()) {
  //       getSize(subpath);
  //     }
  //   });

  //   fileWalker.onQueueEmpty(() => {
  //     allFilesScanned = true;
  //     if (!getSizeInProgress) {
  //       sendResult();
  //     }
  //   });
  // }
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
    this.events.emit('onStats');
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
        this.onResult(path, entry);
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

interface WorkerStats {
  pendingSearchTasks: number;
  completedSearchTasks: number;
  procs: number;
}
