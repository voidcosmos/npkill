import os from 'os';
import { dirname, extname } from 'path';

import { Worker, MessageChannel, MessagePort } from 'worker_threads';
import { Subject } from 'rxjs';
import { LoggerService } from '../logger.service.js';
import { ScanStatus } from '../../interfaces/search-status.model.js';
import { EVENTS, MAX_WORKERS } from '../../../constants/workers.constants.js';
import { ScanOptions } from '../../index.js';

export type WorkerStatus = 'stopped' | 'scanning' | 'dead' | 'finished';
type WorkerJob = {
  job: EVENTS.explore | EVENTS.getFolderSize;
  value: { path: string };
};

export interface WorkerScanOptions extends ScanOptions {
  rootPath: string;
}

export type WorkerMessage =
  | {
      type: EVENTS.scanResult;
      value: {
        results: Array<{ path: string; isTarget: boolean }>;
        workerId: number;
        pending: number;
      };
    }
  | {
      type: EVENTS.GetSizeResult;
      value: {
        results: { path: string; size: number };
        workerId: number;
        pending: number;
      };
    }
  | { type: EVENTS.explore | EVENTS.getFolderSize; value: { path: string } }
  | { type: EVENTS.exploreConfig; value: WorkerScanOptions }
  | { type: EVENTS.startup; value: { channel: MessagePort; id: number } }
  | { type: EVENTS.alive; value?: undefined }
  | { type: EVENTS.stop; value?: undefined }
  | { type: EVENTS.error; value: { error: Error } };

export interface WorkerStats {
  pendingSearchTasks: number;
  completedSearchTasks: number;
  procs: number;
}

export class FileWorkerService {
  private index = 0;
  private workers: Worker[] = [];
  private workersPendingJobs: number[] = [];
  private getSizePendings: Array<{
    path: string;
    stream$: Subject<number>;
    timeoutId?: NodeJS.Timeout;
  }> = [];

  private pendingJobs = 0;
  private totalJobs = 0;
  private tunnels: MessagePort[] = [];
  private shouldStop = false;
  private readonly SIZE_TIMEOUT_MS = 60000; // 1 minute timeout per folder

  constructor(
    private readonly logger: LoggerService,
    private readonly searchStatus: ScanStatus,
  ) {}

  async startScan(
    stream$: Subject<string>,
    params: WorkerScanOptions,
  ): Promise<void> {
    await this.killWorkers();
    this.shouldStop = false;
    this.instantiateWorkers(this.getOptimalNumberOfWorkers());
    this.listenEvents(stream$);
    this.setWorkerConfig(params);

    // Manually add the first job.
    this.addJob({ job: EVENTS.explore, value: { path: params.rootPath } });
  }

  getFolderSize(stream$: Subject<number>, path: string): void {
    if (this.workers.length === 0) {
      this.instantiateWorkers(this.getOptimalNumberOfWorkers());
      this.listenEvents(new Subject<string>());
      this.setWorkerConfig({ rootPath: path } as WorkerScanOptions);
    }

    const timeoutId = setTimeout(() => {
      const index = this.getSizePendings.findIndex((p) => p.path === path);
      if (index !== -1) {
        this.logger.error(
          `Timeout calculating size for: ${path} (${this.SIZE_TIMEOUT_MS}ms)`,
        );
        const pending = this.getSizePendings[index];
        pending.stream$.error(
          new Error(`Timeout calculating size for ${path}`),
        );
        this.getSizePendings.splice(index, 1);
      }
    }, this.SIZE_TIMEOUT_MS);

    this.getSizePendings = [
      ...this.getSizePendings,
      { path, stream$, timeoutId },
    ];
    this.addJob({ job: EVENTS.getFolderSize, value: { path } });
  }

  stopScan(): void {
    this.logger.info('Stopping scan...');
    this.shouldStop = true;
    this.searchStatus.workerStatus = 'stopped';

    this.tunnels.forEach((tunnel) => {
      tunnel.postMessage({
        type: EVENTS.stop,
        value: undefined,
      });
    });

    void this.killWorkers();
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
        } else if (!this.shouldStop) {
          this.addJob({
            job: EVENTS.explore,
            value: { path },
          });
        }
      });

      this.pendingJobs = this.getPendingJobs();
      this.checkJobComplete(stream$);
    }

    if (type === EVENTS.GetSizeResult) {
      const result: { path: string; size: number } = value.results;
      const workerId: number = value.workerId;
      this.workersPendingJobs[workerId] = value.pending;

      const index = this.getSizePendings.findIndex(
        (pending) => pending.path === result.path,
      );

      if (index !== -1) {
        const pending = this.getSizePendings[index];

        if (pending.timeoutId) {
          clearTimeout(pending.timeoutId);
        }

        pending.stream$.next(result.size);
        pending.stream$.complete();
        this.getSizePendings.splice(index, 1);
      }

      this.pendingJobs = this.getPendingJobs();
      this.checkJobComplete(stream$);
    }

    if (type === EVENTS.alive) {
      this.searchStatus.workerStatus = 'scanning';
    }

    if (type === EVENTS.error) {
      this.logger.error(`Worker error: ${value.error.message}`);
    }
  }

  /** Jobs are distributed following the round-robin algorithm. */
  private addJob(job: WorkerJob): void {
    if (this.shouldStop) {
      return;
    }

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
    if (isCompleted) {
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

  private setWorkerConfig(params: WorkerScanOptions): void {
    this.tunnels.forEach((tunnel) =>
      tunnel.postMessage({
        type: EVENTS.exploreConfig,
        value: params,
      }),
    );
  }

  private async killWorkers(): Promise<void> {
    this.getSizePendings.forEach((pending) => {
      if (pending.timeoutId) {
        clearTimeout(pending.timeoutId);
      }
      if (!pending.stream$.closed) {
        pending.stream$.error(
          new Error('Workers terminated before completion'),
        );
      }
    });
    this.getSizePendings = [];

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
