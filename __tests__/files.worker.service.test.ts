import { jest } from '@jest/globals';
import EventEmitter from 'node:events';

import { Subject } from 'rxjs';
import { IListDirParams } from '../src/interfaces';
import { SearchStatus } from '../src/models/search-state.model';
import { WorkerStats } from '../src/services/files/files.worker.service';

const eventEmitter = new EventEmitter();
const workerPostMessageMock = jest.fn();
const workerTerminateMock = jest.fn();

jest.unstable_mockModule('node:worker_threads', () => ({
  Worker: jest.fn(() => ({
    postMessage: workerPostMessageMock,
    on: (eventName: string, listener: (...args: any[]) => void) =>
      eventEmitter.on(eventName, listener),
    terminate: workerTerminateMock,
  })),
}));

const FileWorkerServiceConstructor = //@ts-ignore
  (await import('../src/services/files/files.worker.service.js'))
    .FileWorkerService;
class FileWorkerService extends FileWorkerServiceConstructor {}

describe('FileWorkerService', () => {
  let fileWorkerService: FileWorkerService;
  let searchStatus: SearchStatus;
  let params: IListDirParams;

  beforeEach(async () => {
    const aa = new URL('http://127.0.0.1'); // Any valid URL. Is not used
    jest.spyOn(global, 'URL').mockReturnValue(aa);
    searchStatus = new SearchStatus();
    fileWorkerService = new FileWorkerService(searchStatus);
    params = {
      path: '/path/to/directory',
      target: 'node_modules',
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('startScan', () => {
    let stream$: Subject<string>;

    beforeEach(() => {
      stream$ = new Subject<string>();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should emit "start-explore" and parameters to the worker', () => {
      fileWorkerService.startScan(stream$, params);
      expect(workerPostMessageMock).toBeCalledWith({
        type: 'start-explore',
        value: { path: params.path },
      });
    });

    it('should emit result to the streams on "scan-result"', (done) => {
      fileWorkerService.startScan(stream$, params);
      const val1 = '/sample/path1/node_modules';
      const val2 = '/sample/path2/node_modules';

      const result = [];
      stream$.subscribe((data) => {
        result.push(data);
        if (result.length === 2) {
          expect(result[0]).toBe(val1);
          expect(result[1]).toBe(val2);
          done();
        }
      });

      eventEmitter.emit('message', {
        type: 'scan-result',
        value: val1,
      });
      eventEmitter.emit('message', {
        type: 'scan-result',
        value: val2,
      });
    });

    it('should update searchStatus on "stats"', () => {
      fileWorkerService.startScan(stream$, params);
      const workerStats: Partial<WorkerStats> = {
        pendingSearchTasks: 8,
        completedSearchTasks: 3,
      };

      eventEmitter.emit('message', {
        type: 'stats',
        value: workerStats,
      });

      expect(searchStatus.pendingSearchTasks).toEqual(
        workerStats.pendingSearchTasks,
      );
      expect(searchStatus.completedSearchTasks).toEqual(
        workerStats.completedSearchTasks,
      );
    });

    it('should update searchStatus workerStatus on "alive"', () => {
      fileWorkerService.startScan(stream$, params);
      eventEmitter.emit('message', {
        type: 'alive',
        value: null,
      });

      expect(searchStatus.workerStatus).toBe('scanning');
    });

    it('should complete the stream on "scan-job-completed" and change worker status', (done) => {
      fileWorkerService.startScan(stream$, params);
      stream$.subscribe({
        complete: () => {
          done();
        },
      });

      eventEmitter.emit('message', {
        type: 'scan-job-completed',
        value: null,
      });

      expect(searchStatus.workerStatus).toBe('finished');
    });

    it('should change workerStatus and throw error on "error"', () => {
      expect(() => {
        fileWorkerService.startScan(stream$, params);
        eventEmitter.emit('error');
        expect(searchStatus.workerStatus).toBe('dead');
      }).toThrowError();
    });
  });

  describe('getSize', () => {
    let stream$: Subject<string>;
    const path = '/sample/file/path';

    const mockRandom = (value: number) =>
      jest.spyOn(global.Math, 'random').mockReturnValue(value);

    beforeEach(() => {
      stream$ = new Subject<string>();
      workerPostMessageMock.mockClear();
    });

    it('should emit "start-explore" and parameters to the worker', () => {
      const randomNumber = 0.12341234;
      mockRandom(randomNumber);

      fileWorkerService.getSize(stream$, path);
      expect(workerPostMessageMock).toBeCalledWith({
        type: 'start-getSize',
        value: { path: path, id: randomNumber },
      });
    });

    it('should received "job completed" with same id, emit to the stream and complete it', (done) => {
      const randomNumber = 0.8832342;
      const response = 42342;
      mockRandom(randomNumber);

      fileWorkerService.getSize(stream$, path);

      let streamValues = [];
      stream$.subscribe({
        next: (data) => {
          streamValues.push(data);
        },
        complete: () => {
          expect(streamValues.length).toBe(1);
          expect(streamValues[0]).toBe(response);
          done();
        },
      });

      eventEmitter.emit('message', {
        type: `getsize-job-completed-${randomNumber}`,
        value: response,
      });
    });
  });
});
