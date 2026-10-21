import { jest } from '@jest/globals';
import { Subject } from 'rxjs';
import { EVENTS } from '../../../../src/constants/workers.constants.js';
import { ScanStatus } from '../../../../src/core/interfaces/search-status.model.js';
import { LoggerService } from '../../../../src/core/services/logger.service.js';
import {
  FileWorkerService,
  WorkerMessage,
} from '../../../../src/core/services/files/files.worker.service.js';

describe('FileWorkerService completion', () => {
  it('waits for a newly dispatched job after an older worker snapshot arrives', () => {
    const status = new ScanStatus();
    const service = new FileWorkerService(
      { info: jest.fn(), error: jest.fn() } as unknown as LoggerService,
      status,
    );
    const posted: WorkerMessage[] = [];
    Reflect.set(service, 'workers', [{}, {}]);
    Reflect.set(service, 'tunnels', [
      { postMessage: jest.fn() },
      { postMessage: (message: WorkerMessage) => posted.push(message) },
    ]);
    Reflect.set(service, 'workersPendingJobs', [1, 1]);
    Reflect.set(service, 'index', 1);

    const stream$ = new Subject<string>();
    const found = jest.fn();
    const completed = jest.fn();
    stream$.subscribe({ next: found, complete: completed });
    const onMessage = Reflect.get(service, 'newWorkerMessage') as (
      message: WorkerMessage,
      stream: Subject<string>,
    ) => void;

    onMessage.call(
      service,
      {
        type: EVENTS.scanResult,
        value: {
          workerId: 0,
          pending: 0,
          results: [{ path: '/example/deeper', isTarget: false }],
        },
      },
      stream$,
    );
    expect(posted).toEqual([
      { type: EVENTS.explore, value: { path: '/example/deeper' } },
    ]);

    // Worker 1 finished its older job before receiving the new explore job.
    onMessage.call(
      service,
      {
        type: EVENTS.scanResult,
        value: { workerId: 1, pending: 0, results: [] },
      },
      stream$,
    );
    expect(Reflect.get(service, 'workersPendingJobs')).toEqual([0, 1]);
    expect(completed).not.toHaveBeenCalled();

    onMessage.call(
      service,
      {
        type: EVENTS.scanResult,
        value: {
          workerId: 1,
          pending: 0,
          results: [
            { path: '/example/deeper/node_modules', isTarget: true },
          ],
        },
      },
      stream$,
    );
    expect(found).toHaveBeenCalledWith('/example/deeper/node_modules');
    expect(completed).toHaveBeenCalledTimes(1);
    expect(status.workerStatus).toBe('finished');
  });
});
