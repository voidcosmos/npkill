import os from 'os';
import { basename, dirname, extname } from 'path';

import { Worker } from 'node:worker_threads';
import { Subject } from 'rxjs';
import { IListDirParams } from '../../interfaces/index.js';
import { SearchStatus } from '../../models/search-state.model.js';
import { MAX_WORKERS } from '../../constants/index.js';
import { MessageChannel } from 'worker_threads';
import { LoggerService } from '../logger.service.js';

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
  private tunnels = [];

  constructor(
    private logger: LoggerService,
    private searchStatus: SearchStatus,
  ) {}

  startScan(stream$: Subject<string>, params: IListDirParams) {
    setInterval(() => this.updateStats(), 40);
    this.instantiateWorkers(this.getOptimalNumberOfWorkers());

    this.tunnels.forEach((tunnel) => {
      tunnel.on('message', (data) => {
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

      this.workers.forEach((worker, index) => {
        worker.on('exit', () => {
          this.logger.info(`Worker ${index} exited.`);
        });

        worker.on('error', (error) => {
          // this.searchStatus.workerStatus = 'dead';
          // Respawn worker.
          throw error;
        });
      });
    });

    this.addJob({ type: 'explore', value: { path: params.path } });
  }

  private updateStats() {
    this.searchStatus.pendingSearchTasks = this.pendingJobs;
    this.searchStatus.completedSearchTasks = this.totalJobs;
    this.searchStatus.workersJobs = this.workersPendingJobs;
  }

  private checkJobComplete(stream$: Subject<string>) {
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
    this.logger.info(`Instantiating ${amount} workers..`);
    for (let i = 0; i < amount; i++) {
      const { port1, port2 } = new MessageChannel();
      const worker = new Worker(this.getWorkerPath());
      this.tunnels.push(port1);
      worker.postMessage(
        { type: 'startup', value: { channel: port2, id: i } },
        [port2], // Prevent clone the object and pass the original.
      );
      this.workers.push(worker);
      this.logger.info(`Worker ${i} instantiated.`);
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

  private getOptimalNumberOfWorkers(): number {
    const cores = os.cpus().length;
    // TODO calculate amount of RAM available and take it
    // as part on the ecuation.
    return cores > MAX_WORKERS ? MAX_WORKERS : cores - 1;
  }
}
