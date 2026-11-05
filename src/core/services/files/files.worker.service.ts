import os from 'os';
import { dirname, extname } from 'path';

import { Worker, MessageChannel, MessagePort } from 'worker_threads';
import { Subject } from 'rxjs';
import { LoggerService } from '../logger.service.js';
import { ScanStatus } from '../../interfaces/search-status.model.js';
import { EVENTS, MAX_WORKERS } from '../../../constants/workers.constants.js';
import { TargetDefinition } from '../../interfaces/target.interface.js';

export type WorkerStatus = 'stopped' | 'scanning' | 'dead' | 'finished';

export interface WorkerScanOptions {
  rootPath: string;
  targets: readonly TargetDefinition[];
  exclude?: string[];
  useDefaultIgnore?: boolean;
}

export interface WorkerSizeResult {
  id: number;
  path: string;
  size: number;
  error?: string;
}

export type WorkerMessage =
  | {
      type: EVENTS.scanResult;
      value: {
        results: Array<{ path: string; isTarget: boolean }>;
        workerId: number;
        scanId: number;
      };
    }
  | {
      type: EVENTS.GetSizeResult;
      value: { results: WorkerSizeResult; workerId: number };
    }
  | { type: EVENTS.explore; value: { path: string; scanId: number } }
  | { type: EVENTS.getSize; value: { path: string; id: number } }
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

interface ActiveScan {
  id: number;
  stream$: Subject<string>;
  pendingJobs: number;
}

interface SizeRequest {
  id: number;
  path: string;
  stream$: Subject<number>;
  timeoutId: NodeJS.Timeout;
}

export class FileWorkerService {
  private workers: Worker[] = [];
  private tunnels: MessagePort[] = [];
  private workersPendingJobs: number[] = [];
  private nextWorker = 0;
  private lastScanId = 0;
  private lastSizeRequestId = 0;
  private activeScan: ActiveScan | null = null;
  private sizeRequests: SizeRequest[] = [];
  private totalJobs = 0;
  private idleWorkersTimeout?: NodeJS.Timeout;
  private readonly SIZE_TIMEOUT_MS = 60000; // 1 minute timeout per folder
  private readonly IDLE_WORKERS_TIMEOUT_MS = 5000;

  constructor(
    private readonly logger: LoggerService,
    private readonly searchStatus: ScanStatus,
  ) {}

  startScan(stream$: Subject<string>, params: WorkerScanOptions): void {
    if (this.activeScan !== null) {
      stream$.error(
        new Error(
          'A scan is already running on this Npkill instance. Stop it or use another instance.',
        ),
      );
      return;
    }

    this.ensureWorkers();
    this.activeScan = { id: ++this.lastScanId, stream$, pendingJobs: 0 };
    this.totalJobs = 0;
    this.searchStatus.workerStatus = 'scanning';
    this.broadcast({ type: EVENTS.exploreConfig, value: params });
    this.dispatchExplore(params.rootPath);
    this.updateWorkersLifecycle();
  }

  getSize(stream$: Subject<number>, path: string): void {
    this.ensureWorkers();
    const id = ++this.lastSizeRequestId;
    const timeoutId = setTimeout(() => {
      this.logger.error(
        `Timeout calculating size for: ${path} (${this.SIZE_TIMEOUT_MS}ms)`,
      );
      this.settleSizeRequest(id, {
        error: `Timeout calculating size for ${path}`,
      });
    }, this.SIZE_TIMEOUT_MS);

    this.sizeRequests.push({ id, path, stream$, timeoutId });
    this.dispatch({ type: EVENTS.getSize, value: { path, id } });
    this.updateWorkersLifecycle();
  }

  stopScan(): void {
    this.logger.info('Stopping scan...');
    this.endActiveScan('stopped');
  }

  cancelScan(stream$: Subject<string>): void {
    if (this.activeScan?.stream$ === stream$) {
      this.endActiveScan('stopped');
    }
  }

  private endActiveScan(status: WorkerStatus): void {
    const scan = this.activeScan;
    if (scan === null) {
      return;
    }

    this.activeScan = null;
    this.searchStatus.workerStatus = status;
    if (status === 'stopped') {
      this.broadcast({ type: EVENTS.stop });
    }
    this.updateWorkersLifecycle();
    scan.stream$.complete();
  }

  private onWorkerMessage(message: WorkerMessage): void {
    if (message.type === EVENTS.scanResult) {
      this.workersPendingJobs[message.value.workerId]--;
      this.onScanResult(message.value.scanId, message.value.results);
    }

    if (message.type === EVENTS.GetSizeResult) {
      this.workersPendingJobs[message.value.workerId]--;
      this.settleSizeRequest(message.value.results.id, message.value.results);
    }

    if (message.type === EVENTS.error) {
      this.logger.error(`Worker error: ${message.value.error.message}`);
    }

    this.updateStats();
  }

  private onScanResult(
    scanId: number,
    results: Array<{ path: string; isTarget: boolean }>,
  ): void {
    const scan = this.activeScan;
    if (scan === null || scan.id !== scanId) {
      return;
    }

    scan.pendingJobs--;
    for (const { path, isTarget } of results) {
      if (this.activeScan !== scan) {
        return;
      }

      if (isTarget) {
        scan.stream$.next(path);
      } else {
        this.dispatchExplore(path);
      }
    }

    if (this.activeScan === scan && scan.pendingJobs === 0) {
      this.endActiveScan('finished');
    }
  }

  private settleSizeRequest(
    id: number,
    result: { size?: number; error?: string },
  ): void {
    const index = this.sizeRequests.findIndex((request) => request.id === id);
    if (index === -1) {
      return;
    }

    const [request] = this.sizeRequests.splice(index, 1);
    clearTimeout(request.timeoutId);
    this.updateWorkersLifecycle();

    if (result.error !== undefined) {
      request.stream$.error(new Error(result.error));
      return;
    }

    request.stream$.next(result.size ?? 0);
    request.stream$.complete();
  }

  private onWorkerError(error: Error): void {
    this.logger.error(`Worker error: ${error.message}`);
    const scan = this.activeScan;
    const sizeRequests = this.sizeRequests;
    this.activeScan = null;
    this.sizeRequests = [];
    this.searchStatus.workerStatus = 'dead';
    void this.terminateWorkers();

    scan?.stream$.error(error);
    sizeRequests.forEach((request) => {
      clearTimeout(request.timeoutId);
      request.stream$.error(error);
    });
  }

  private dispatchExplore(path: string): void {
    const scan = this.activeScan;
    if (scan === null) {
      return;
    }

    scan.pendingJobs++;
    this.totalJobs++;
    this.dispatch({ type: EVENTS.explore, value: { path, scanId: scan.id } });
  }

  /** Jobs are distributed following the round-robin algorithm. */
  private dispatch(message: WorkerMessage): void {
    const workerIndex = this.nextWorker;
    this.nextWorker = (this.nextWorker + 1) % this.tunnels.length;
    this.workersPendingJobs[workerIndex]++;
    this.tunnels[workerIndex].postMessage(message);
  }

  private broadcast(message: WorkerMessage): void {
    this.tunnels.forEach((tunnel) => tunnel.postMessage(message));
  }

  private ensureWorkers(): void {
    if (this.workers.length > 0) {
      return;
    }

    const amount = this.getOptimalNumberOfWorkers();
    this.logger.info(`Instantiating ${amount} workers..`);
    for (let i = 0; i < amount; i++) {
      const { port1, port2 } = new MessageChannel();
      const worker = new Worker(this.getWorkerPath());
      port1.on('message', (message: WorkerMessage) =>
        this.onWorkerMessage(message),
      );
      worker.on('error', (error) => this.onWorkerError(error));
      worker.on('exit', () => this.logger.info(`Worker ${i} exited.`));
      worker.postMessage(
        { type: EVENTS.startup, value: { channel: port2, id: i } },
        [port2], // Prevent clone the object and pass the original.
      );
      this.workers.push(worker);
      this.tunnels.push(port1);
      this.workersPendingJobs.push(0);
      this.logger.info(`Worker ${i} instantiated.`);
    }
    this.nextWorker = 0;
  }

  /** Idle workers do not keep the host process alive and end after a while. */
  private updateWorkersLifecycle(): void {
    clearTimeout(this.idleWorkersTimeout);
    const isBusy = this.activeScan !== null || this.sizeRequests.length > 0;
    this.workers.forEach((worker) => (isBusy ? worker.ref() : worker.unref()));
    this.tunnels.forEach((tunnel) => (isBusy ? tunnel.ref() : tunnel.unref()));

    if (!isBusy && this.workers.length > 0) {
      this.idleWorkersTimeout = setTimeout(
        () => void this.terminateWorkers(),
        this.IDLE_WORKERS_TIMEOUT_MS,
      ).unref();
    }
  }

  private async terminateWorkers(): Promise<void> {
    const workers = this.workers;
    this.tunnels.forEach((tunnel) => tunnel.close());
    this.workers = [];
    this.tunnels = [];
    this.workersPendingJobs = [];

    await Promise.all(
      workers.map((worker) =>
        worker.terminate().catch((error) => this.logger.error(error)),
      ),
    );
  }

  private updateStats(): void {
    this.searchStatus.pendingSearchTasks = this.activeScan?.pendingJobs ?? 0;
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
