'use strict';
import { opendir } from 'fs';
import { memoryUsage } from 'process';
import { parentPort, workerData } from 'worker_threads';

(() => {
  const taskQueue = [];
  let procs = 0;
  const MAX_PROCS = 100;

  const updateProcs = (value) => {
    procs += value;
    parentPort.postMessage({
      type: 'proc',
      value: { procs: procs, mem: memoryUsage() },
    });
  };

  init();

  function init() {
    enqueue(workerData.path);
    processQueue();
  }

  function newResult(path) {
    parentPort.postMessage({ type: 'result', value: path });
  }

  function jobDone() {
    parentPort.postMessage({ type: 'job-completed' });
  }

  function enqueue(path) {
    taskQueue.push(path);
  }

  function processQueue() {
    while (procs < MAX_PROCS && taskQueue.length > 0) {
      let path = taskQueue.shift();
      nmFind(path);
    }
  }

  function nmFind(path) {
    updateProcs(1);

    opendir(path, async (err, dir) => {
      if (err) {
        updateProcs(-1);
        processQueue();
        return;
      }
      /** @type {fs.Dirent | null} */
      let entry = null;
      while ((entry = await dir.read().catch(() => null)) != null) {
        if (entry.isDirectory()) {
          const subpath = (path === '/' ? '' : path) + '/' + entry.name;
          if (entry.name === 'node_modules') {
            newResult(subpath);
          } else {
            enqueue(subpath);
          }
        }
      }

      await dir.close();
      updateProcs(-1);
      processQueue();

      if (taskQueue.length === 0) {
        jobDone();
      }
    });
  }
})();
