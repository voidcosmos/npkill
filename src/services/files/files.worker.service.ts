import { dirname, extname } from 'path';

import { BehaviorSubject } from 'rxjs';
import { IListDirParams } from '../../interfaces/index.js';
import { Worker } from 'worker_threads';
import { SearchState } from 'src/models/search-state.model.js';

type WorkerStatus = 'stopped' | 'scanning' | 'finished';

export class FileWorkerService {
  public status: WorkerStatus = 'stopped';
  private scanWorker = new Worker(this.getWorkerPath());
  private getSizeWorker = new Worker(this.getWorkerPath());

  constructor(private searchState: SearchState) {}

  startScan(stream$: BehaviorSubject<string>, params: IListDirParams) {
    this.scanWorker.postMessage({
      type: 'start-explore',
      value: { path: params.path },
    });
    this.status = 'scanning';

    this.scanWorker.on('message', (data) => {
      if (data?.type === 'scan-result') {
        stream$.next(data.value);
      }

      if (data?.type === 'stats') {
        this.searchState.pendingSearchTasks = data.value.pendingSearchTasks;
        this.searchState.completedSearchTasks = data.value.completedSearchTasks;
      }

      if (data?.type === 'scan-job-completed') {
        stream$.complete();
        this.status = 'finished';
      }
    });

    this.scanWorker.on('error', (error) => {
      this.status = 'stopped';
      this.scanWorker.terminate();
      throw error;
    });

    this.scanWorker.on('exit', (code) => {
      if (code !== 0) {
        this.scanWorker.terminate();
        return;
      }
    });

    return this.scanWorker;
  }

  getSize(stream$: BehaviorSubject<string>, path: string) {
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
