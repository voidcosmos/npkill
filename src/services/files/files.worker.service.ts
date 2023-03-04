import { dirname, extname } from 'path';

import { Subject } from 'rxjs';
import { IListDirParams } from '../../interfaces/index.js';
import { Worker } from 'node:worker_threads';
import { SearchStatus } from 'src/models/search-state.model.js';

export type WorkerStatus = 'stopped' | 'scanning' | 'dead' | 'finished';

export class FileWorkerService {
  private scanWorker = new Worker(this.getWorkerPath());
  private getSizeWorker = new Worker(this.getWorkerPath());

  constructor(private searchStatus: SearchStatus) {}

  startScan(stream$: Subject<string>, params: IListDirParams) {
    this.scanWorker.postMessage({
      type: 'start-explore',
      value: { path: params.path },
    });

    this.scanWorker.on('message', (data) => {
      if (data?.type === 'scan-result') {
        stream$.next(data.value);
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
        this.searchStatus.workerStatus = 'finished';
        stream$.complete();
      }
    });

    this.scanWorker.on('error', (error) => {
      this.searchStatus.workerStatus = 'dead';
      this.scanWorker.terminate();
      throw error;
    });

    this.scanWorker.on('exit', (code) => {
      if (code !== 0) {
        this.searchStatus.workerStatus = 'dead';
        this.scanWorker.terminate();
        return;
      }
    });

    return this.scanWorker;
  }

  getSize(stream$: Subject<string>, path: string) {
    const id = Math.random();
    this.getSizeWorker.postMessage({
      type: 'start-getSize',
      value: { path, id },
    });

    this.getSizeWorker.on('message', (data) => {
      if (data?.type === 'getsize-job-completed-' + id) {
        stream$.next(data.value);
        stream$.complete();
      }
    });
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
