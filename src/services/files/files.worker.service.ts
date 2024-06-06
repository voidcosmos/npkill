import os from 'os';
import { dirname, extname } from 'path';

import { Worker, MessageChannel, MessagePort } from 'node:worker_threads';
import { Subject } from 'rxjs';
import { IListDirParams } from '../../interfaces/index.js';
import { SearchStatus } from '../../models/search-state.model.js';
import { LoggerService } from '../logger.service.js';
import { MAX_WORKERS, EVENTS } from '../../constants/workers.constants.js';

export type WorkerStatus = 'stopped' | 'scanning' | 'dead' | 'finished';
interface WorkerJob {
  job: EVENTS;
  value: { path: string };
}

export interface WorkerMessage {
  type: EVENTS;
  value: any;
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
  private getSizePendings: Array<{ path: string; stream$: Subject<number> }> =
    [];

  private pendingJobs = 0;
  private totalJobs = 0;
  private tunnels: MessagePort[] = [];

  constructor(
    private readonly logger: LoggerService,
    private readonly searchStatus: SearchStatus,
  ) {}

  startScan(stream$: Subject<string>, params: IListDirParams): void {
    this.instantiateWorkers(this.getOptimalNumberOfWorkers());
    this.listenEvents(stream$);
    this.setWorkerConfig(params);

    // Manually add the first job.
    this.addJob({ job: EVENTS.explore, value: { path: params.path } });
  }

  getFolderSize(stream$: Subject<number>, path: string): void {
    //   this.listenEvents(stream$);
    this.getSizePendings = [...this.getSizePendings, { path, stream$ }];
    this.addJob({ job: EVENTS.getFolderSize, value: { path } });
  }

  private listenEvents(stream$: Subject<string>): void {
    this.tunnels.forEach((tunnel) => {
      tunnel.on('message', (data: WorkerMessage) => {
        this.newWorkerMessage(data, stream$);
      });

      this.workers.forEach((worker, index) => {
        worker.on('exit', () => {
          this.logger.info(`Worker ${index} exited.`);
        });

        worker.on('error', (error) => {
          // Respawn worker.
          throw error;
        });
      });
    });
  }

  private newWorkerMessage(
    message: WorkerMessage,
    stream$: Subject<string>,
  ): void {
    const { type, value } = message;

    if (type === EVENTS.scanResult) {
      const results: Array<{ path: string; isTarget: boolean }> = value.results;
      const workerId: number = value.workerId;
      this.workersPendingJobs[workerId] = value.pending;

      results.forEach((result) => {
        const { path, isTarget } = result;
        if (isTarget) {
          stream$.next(path);
        } else {
          this.addJob({
            job: EVENTS.explore,
            value: { path },
          });
        }
      });

      this.pendingJobs = this.getPendingJobs();
      this.checkJobComplete(stream$);
    }

    if (type === EVENTS.getFolderSizeResult) {
      const result: { path: string; size: number } = value.results;
      const workerId: number = value.workerId;
      this.workersPendingJobs[workerId] = value.pending;

      this.getSizePendings.forEach((pending, index) => {
        if (pending.path === result.path) {
          pending.stream$.next(result.size);
          this.getSizePendings.splice(index, 1);
        }
      });

      this.pendingJobs = this.getPendingJobs();
      this.checkJobComplete(stream$);
    }

    if (type === EVENTS.alive) {
      this.searchStatus.workerStatus = 'scanning';
    }
  }

  /** Jobs are distributed following the round-robin algorithm. */
  private addJob(job: WorkerJob): void {
    const tunnel = this.tunnels[this.index];
    const message: WorkerMessage = { type: job.job, value: job.value };
    tunnel.postMessage(message);
    this.workersPendingJobs[this.index]++;
    this.totalJobs++;
    this.pendingJobs++;
    this.index = this.index >= this.workers.length - 1 ? 0 : this.index + 1;
  }

  private checkJobComplete(stream$: Subject<string>): void {
    this.updateStats();
    const isCompleted = this.getPendingJobs() === 0;
    // TODO &&false only for development purposes.
    if (isCompleted && false) {
      this.searchStatus.workerStatus = 'finished';
      stream$.complete();
      void this.killWorkers();
    }
  }

  private instantiateWorkers(amount: number): void {
    this.logger.info(`Instantiating ${amount} workers..`);
    for (let i = 0; i < amount; i++) {
      const { port1, port2 } = new MessageChannel();
      const worker = new Worker(this.getWorkerPath());
      this.tunnels.push(port1);
      worker.postMessage(
        { type: EVENTS.startup, value: { channel: port2, id: i } },
        [port2], // Prevent clone the object and pass the original.
      );
      this.workers.push(worker);
      this.logger.info(`Worker ${i} instantiated.`);
    }
  }

  private setWorkerConfig(params: IListDirParams): void {
    this.tunnels.forEach((tunnel) =>
      tunnel.postMessage({
        type: EVENTS.exploreConfig,
        value: params,
      }),
    );
  }

  private async killWorkers(): Promise<void> {
    for (let i = 0; i < this.workers.length; i++) {
      this.workers[i].removeAllListeners();
      this.tunnels[i].removeAllListeners();
      await this.workers[i]
        .terminate()
        .catch((error) => this.logger.error(error));
    }
    this.workers = [];
    this.tunnels = [];
  }

  private getPendingJobs(): number {
    return this.workersPendingJobs.reduce((acc, x) => x + acc, 0);
  }

  private updateStats(): void {
    this.searchStatus.pendingSearchTasks = this.pendingJobs;
    this.searchStatus.completedSearchTasks = this.totalJobs;
    this.searchStatus.workersJobs = this.workersPendingJobs;
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
    const numWorkers = cores > MAX_WORKERS ? MAX_WORKERS : cores - 1;
    return numWorkers < 1 ? 1 : numWorkers;
  }
}
