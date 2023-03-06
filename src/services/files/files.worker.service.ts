import { basename, dirname, extname } from 'path';

import { IListDirParams } from 'src/interfaces/index.js';
import { SearchStatus } from 'src/models/search-state.model.js';
import { Subject } from 'rxjs';
import { Worker } from 'node:worker_threads';

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
  private workersPendingJobs: number[] = [];
  private pendingJobs = 0;
  private totalJobs = 0;
  private readonly MAX_WORKERS = 7;

  constructor(private searchStatus: SearchStatus) {}

  startScan(stream$: Subject<string>, params: IListDirParams) {
    setInterval(() => this.updateStats(), 40);
    this.instantiateWorkers(this.MAX_WORKERS);

    this.workers.forEach((worker) => {
      worker.on('message', (data) => {
        if (data?.type === 'scan-result') {
          const results: string[] = data.value.results;
          const workerId: number = data.value.workerId;
          this.workersPendingJobs[workerId] = data.value.pending;

          results.forEach((path) => {
            if (basename(path) === 'node_modules') {
              stream$.next(path);
            } else {
              this.addJob({
                type: 'explore',
                value: { path },
              });
            }
          });

          this.pendingJobs = this.getPendingJobs();
          this.checkJobComplete(stream$);
        }

        if (data?.type === 'stats') {
        }

        if (data?.type === 'alternative-stats') {
          this.workersPendingJobs[data.value.workerId] = data.value.pending;
          this.pendingJobs = this.getPendingJobs();
          this.checkJobComplete(stream$);
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
        // this.searchStatus.workerStatus = 'dead';
        // Respawn worker.
        throw error;
      });
    });

    this.addJob({ type: 'explore', value: { path: params.path } });
  }

  private updateStats() {
    this.searchStatus.pendingSearchTasks = this.pendingJobs;
    this.searchStatus.completedSearchTasks = this.totalJobs;
    this.searchStatus.workersJobs = this.workersPendingJobs;
  }

  private checkJobComplete(stream$) {
    const isCompleted = this.getPendingJobs() === 0;
    if (isCompleted) {
      this.searchStatus.workerStatus = 'finished';
      this.killWorkers();
      stream$.complete();
    }
  }

  private addJob(job: WorkerJob) {
    const worker = this.workers[this.index];
    worker.postMessage(job);
    this.workersPendingJobs[this.index]++;
    this.totalJobs++;
    this.pendingJobs++;
    this.index = this.index >= this.workers.length - 1 ? 0 : this.index + 1;
  }

  private instantiateWorkers(amount: number): void {
    for (let i = 0; i < amount; i++) {
      const worker = new Worker(this.getWorkerPath());
      worker.postMessage({ type: 'assign-id', value: i });
      this.workers.push(worker);
    }
  }

  private killWorkers() {
    this.workers.forEach((worker) => {
      worker.terminate();
    });
  }

  private getPendingJobs(): number {
    return this.workersPendingJobs.reduce((acc, x) => x + acc, 0);
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
