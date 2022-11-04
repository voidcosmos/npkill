import { IListDirParams } from '../../interfaces/index.js';
import ansiEscapes from 'ansi-escapes';
import { Worker } from 'worker_threads';
import { BehaviorSubject } from 'rxjs';
import { dirname, extname } from 'path';

export class FileWorkerService {
  private worker = new Worker(this.getWorkerPath());

  startScan(stream$: BehaviorSubject<string>, params: IListDirParams) {
    // updateStats(-1, memoryUsage().rss);
    this.worker.postMessage({
      type: 'start-explore',
      value: { path: params.path },
    });

    this.worker.on('message', (data) => {
      if (data?.type === 'scan-result') {
        stream$.next(data.value);
      }

      if (data?.type === 'proc') {
        updateStats(data.value.procs, data.value.mem.rss);
      }

      if (data?.type === 'scan-job-completed') {
        stream$.complete();
      }
    });

    this.worker.on('error', (error) => {
      console.log('this.worker error', error);
      this.worker.terminate();
    });

    this.worker.on('exit', (code) => {
      console.log('this.worker Exit');

      if (code !== 0) {
        this.worker.terminate();
        return;
      }
    });

    return this.worker;
  }

  getSize(stream$: BehaviorSubject<string>, path: string) {
    const id = Math.random();
    this.worker.postMessage({ type: 'start-getSize', value: { path, id } });

    this.worker.on('message', (data) => {
      if (data?.type === 'getsize-job-completed-' + id) {
        stream$.next(data.value);
        stream$.complete();
      }
    });
  }

  private getWorkerPath(): string {
    // import.meta.url return something like file:///home/...
    // Slice remove the protocol and leave /home/...
    const actualFilePath = import.meta.url.slice(7);
    const dirPath = dirname(actualFilePath);
    // Extension = .ts if is not transpiled.
    // Extension = .js if is a build
    const extension = extname(actualFilePath);
    const workerName = 'files.worker';

    return `${dirPath}/${workerName}${extension}`;
  }
}

// This methods is only temporal for debug.
function updateStats(procs: number, mem: number) {
  print(ansiEscapes.cursorTo(40, 0));
  print('Opened dirs: ' + procs + '       ');
  print(ansiEscapes.cursorTo(40, 1));
  print(
    `Work. Mem usage:   ${
      Math.round((mem / 1024 / 1024) * 100) / 100
    } MB       `,
  );
}

function print(value: string): void {
  process.stdout.write.bind(process.stdout)(value);
}
//////////////////////////////////////////
