import { IListDirParams } from '../../interfaces/index.js';
import ansiEscapes from 'ansi-escapes';
import { Worker } from 'worker_threads';
import { BehaviorSubject } from 'rxjs';

export class FileWorkerService {
  startScan(stream$: BehaviorSubject<string>, params: IListDirParams) {
    // updateStats(-1, memoryUsage().rss);

    const worker = new Worker(`./src/services/files/files.worker.js`, {
      workerData: {
        path: params.path,
      },
    });

    worker.on('message', function (data) {
      if (data?.type === 'result') {
        stream$.next(data.value);
      }

      if (data?.type === 'proc') {
        updateStats(data.value.procs, data.value.mem.rss);
      }

      if (data?.type === 'job-complete') {
        stream$.complete();
      }
    });

    worker.on('error', function (error) {
      console.log('Worker error', error);
      worker.terminate();
    });

    worker.on('exit', (code) => {
      console.log('Worker Exit');

      if (code !== 0) {
        worker.terminate();
        return;
      }
    });

    return worker;
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
