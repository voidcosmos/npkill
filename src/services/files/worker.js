'use strict';
import { opendir } from 'fs';
import { memoryUsage } from 'process';
import { parentPort, workerData } from 'worker_threads';

let i = 0;
const updateProcs = (procs) => {
  i++;
  // Reduce some overload. Only for debug.
  if (i % 100 !== 0 && procs > 0) {
    return;
  }

  parentPort.postMessage({
    type: 'proc',
    value: { procs: procs, mem: memoryUsage() },
  });
};

parentPort.postMessage(
  nmFind(
    workerData.path,
    (path) => {
      parentPort.postMessage({ type: 'result', value: path });
    },
    () => {},
  ),
);

/** @type {(path: string, cb: (path: string) => void, doneCb: () => void, counter?: { procs: number }) => void} */
function nmFind(path, cb, doneCb, counter = { procs: 0 }) {
  counter.procs++;
  updateProcs(counter.procs);

  opendir(path, async (err, dir) => {
    if (err) {
      counter.procs--;
      updateProcs(counter.procs);
      return;
    }
    /** @type {fs.Dirent | null} */
    let entry = null;
    while ((entry = await dir.read().catch(() => null)) != null) {
      if (entry.isDirectory()) {
        const subpath = (path === '/' ? '' : path) + '/' + entry.name;
        if (entry.name === 'node_modules') {
          cb(subpath);
        } else {
          nmFind(subpath, cb, doneCb, counter);
        }
      }
    }
    await dir.close();
    counter.procs--;
    updateProcs(counter.procs);

    if (counter.procs === 0) {
      doneCb();
    }
  });
}
