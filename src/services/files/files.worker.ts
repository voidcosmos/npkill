import __dirname from '../../dirname.js';
import { IListDirParams } from '../../interfaces/index.js';
import ansiEscapes from 'ansi-escapes';
import { Worker } from 'worker_threads';
import { BehaviorSubject } from 'rxjs';

export function runWorker(
  stream$: BehaviorSubject<string>,
  params: IListDirParams,
) {
  const worker = new Worker(`./src/services/files/worker.js`, {
    workerData: {
      path: params.path,
    },
  });
  worker.on('message', function (data) {
    if (data?.type === 'result') {
      if (data.value.includes('projects')) {
        return;
      }
      stream$.next(data.value);
    }
    if (data?.type === 'proc') {
      updateStats(data.value.procs, data.value.mem.rss);
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

    stream$.complete();
  });
  return worker;
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
