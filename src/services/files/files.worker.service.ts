import { basename, dirname, extname } from 'path';

import { IListDirParams } from 'src/interfaces/index.js';
import { SearchStatus } from 'src/models/search-state.model.js';
import { Subject } from 'rxjs';
import { Worker } from 'node:worker_threads';
import { Dirent } from 'fs';

export type WorkerStatus = 'stopped' | 'scanning' | 'dead' | 'finished';
interface WorkerJob {
  type: 'explore';
  value: { path: string };
}

export interface WorkerStats {
  pendingSearchTasks: number;
  completedSearchTasks: number;
  procs: number;
}

export class FileWorkerService {
  private index = 0;
  private workers: Worker[] = [];
  private pendingJobs = 0;
  private readonly MAX_WORKERS = 8;

  constructor(private searchStatus: SearchStatus) {}

  startScan(stream$: Subject<string>, params: IListDirParams) {
    this.instantiateWorkers(this.MAX_WORKERS);

    this.workers.forEach((worker) => {
      worker.on('message', (data) => {
        if (data?.type === 'scan-result') {
          this.pendingJobs = this.pendingJobs - 1;
          const path: string = data.value;

          if (basename(path) === 'node_modules') {
            // console.log(path);
            stream$.next(path);
          } else {
            this.addJob({
              type: 'explore',
              value: { path },
            });
          }

          if (this.pendingJobs === 0) {
            stream$.complete();
          }
        }

        if (data?.type === 'stats') {
          this.searchStatus.pendingSearchTasks = data.value.pendingSearchTasks;
          this.searchStatus.completedSearchTasks =
            data.value.completedSearchTasks;
        }

        if (data?.type === 'alive') {
          this.searchStatus.workerStatus = 'scanning';
        }

        if (data?.type === 'scan-job-completed') {
          // this.searchStatus.workerStatus = 'finished';
          //stream$.complete();
        }
      });

      worker.on('error', (error) => {
        this.searchStatus.workerStatus = 'dead';
        // this.scanWorker.terminate();
        throw error;
      });
    });

    this.addJob({ type: 'explore', value: { path: params.path } });
  }

  private addJob(job: WorkerJob) {
    const worker = this.workers[this.index];
    worker.postMessage(job);
    this.pendingJobs = this.pendingJobs + 1;
    this.index = this.index >= this.workers.length - 1 ? 0 : this.index + 1;
  }

  private instantiateWorkers(amount: number): void {
    for (let i = 0; i < amount; i++) {
      this.workers.push(new Worker(this.getWorkerPath()));
    }
  }

  private getWorkerPath(): URL {
    const actualFilePath = import.meta.url;
    const dirPath = dirname(actualFilePath);
    // Extension = .ts if is not transpiled.
    // Extension = .js if is a build
    const extension = extname(actualFilePath);
    const workerName = 'files.worker';

    return new URL(`${dirPath}/${workerName}${extension}`);
  }
}
