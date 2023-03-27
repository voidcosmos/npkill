import { jest } from '@jest/globals';
import EventEmitter from 'node:events';

import { Subject } from 'rxjs';
import { EVENTS } from '../src/constants/workers.constants';
import { IListDirParams } from '../src/interfaces';
import { SearchStatus } from '../src/models/search-state.model';
import { WorkerMessage } from '../src/services/files/files.worker.service';
import { LoggerService } from '../src/services/logger.service';

const workerEmitter: EventEmitter = new EventEmitter();
const port1Emitter: EventEmitter = new EventEmitter();
const port2Emitter: EventEmitter = new EventEmitter();
const workerPostMessageMock = jest.fn();
const workerTerminateMock = jest.fn();
const messageChannelPort1Mock = jest.fn();
const messageChannelPort2Mock = jest.fn();

jest.unstable_mockModule('os', () => ({
  default: { cpus: jest.fn().mockReturnValue([0, 0]) },
}));

jest.unstable_mockModule('node:worker_threads', () => ({
  Worker: jest.fn(() => ({
    postMessage: workerPostMessageMock,
    on: (eventName: string, listener: (...args: any[]) => void) =>
      workerEmitter.on(eventName, listener),
    terminate: workerTerminateMock,
    removeAllListeners: jest.fn(),
  })),

  MessageChannel: jest.fn(() => ({
    port1: {
      postMessage: messageChannelPort1Mock,
      on: (eventName: string, listener: (...args: any[]) => void) =>
        port1Emitter.on(eventName, listener),
      removeAllListeners: jest.fn(),
    },
    port2: {
      postMessage: messageChannelPort2Mock,
      on: (eventName: string, listener: (...args: any[]) => void) =>
        port2Emitter.on(eventName, listener),
      removeAllListeners: jest.fn(),
    },
  })),
}));

const logger = {
  info: jest.fn(),
} as unknown as jest.Mocked<LoggerService>;

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
    fileWorkerService = new FileWorkerService(logger, searchStatus);
    params = {
      path: '/path/to/directory',
      target: 'node_modules',
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
    workerEmitter.removeAllListeners();
    port1Emitter.removeAllListeners();
    port2Emitter.removeAllListeners();
  });

  describe('startScan', () => {
    let stream$: Subject<string>;

    beforeEach(() => {
      stream$ = new Subject<string>();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should emit "explore" and parameters to the worker', () => {
      fileWorkerService.startScan(stream$, params);
      expect(messageChannelPort1Mock).toBeCalledWith({
        type: EVENTS.explore,
        value: { path: params.path },
      });
    });

    it('should emit result to the streams on "scanResult"', (done) => {
      fileWorkerService.startScan(stream$, params);
      const val1 = ['/sample/path1/node_modules'];
      const val2 = ['/sample/path2/node_modules', '/sample/path3/otherDir'];

      const result: string[] = [];
      stream$.subscribe((data) => {
        result.push(data);
        if (result.length === 3) {
          expect(result[0]).toBe(val1[0]);
          expect(result[1]).toBe(val2[0]);
          expect(result[2]).toBe(val2[1]);
          done();
        }
      });

      port1Emitter.emit('message', {
        type: EVENTS.scanResult,
        value: {
          workerId: 1,
          results: [{ path: val1[0], isTarget: true }],
          pending: 0,
        },
      } as WorkerMessage);
      port1Emitter.emit('message', {
        type: EVENTS.scanResult,
        value: {
          workerId: 2,
          results: [
            { path: val2[0], isTarget: true },
            { path: val2[1], isTarget: true },
          ],
          pending: 342,
        },
      });
    });

    it('should add a job on "scanResult" when folder is not a target', () => {
      fileWorkerService.startScan(stream$, params);
      const val = [
        '/path/1/valid',
        '/path/im/target',
        '/path/other/target',
        '/path/2/valid',
      ];

      port1Emitter.emit('message', {
        type: EVENTS.scanResult,
        value: {
          workerId: 1,
          results: [
            { path: val[0], isTarget: false },
            { path: val[1], isTarget: true },
            { path: val[2], isTarget: true },
            { path: val[3], isTarget: false },
          ],
          pending: 0,
        },
      } as WorkerMessage);

      expect(messageChannelPort1Mock).toBeCalledWith({
        type: EVENTS.explore,
        value: { path: val[0] },
      });

      expect(messageChannelPort1Mock).toHaveBeenCalledWith({
        type: EVENTS.explore,
        value: { path: val[3] },
      });

      expect(messageChannelPort1Mock).not.toHaveBeenCalledWith({
        type: EVENTS.explore,
        value: { path: val[2] },
      });
    });

    it('should update searchStatus workerStatus on "alive"', () => {
      fileWorkerService.startScan(stream$, params);
      port1Emitter.emit('message', {
        type: 'alive',
        value: null,
      });

      expect(searchStatus.workerStatus).toBe('scanning');
    });

    it('should complete the stream and change worker status when all works have 0 pending tasks', (done) => {
      fileWorkerService.startScan(stream$, params);
      stream$.subscribe({
        complete: () => {
          done();
        },
      });

      port1Emitter.emit('message', {
        type: EVENTS.scanResult,
        value: {
          workerId: 0,
          results: [],
          pending: 0,
        },
      });

      expect(searchStatus.workerStatus).toBe('finished');
    });

    it('should throw error on "error"', () => {
      expect(() => {
        fileWorkerService.startScan(stream$, params);
        workerEmitter.emit('error');
        expect(searchStatus.workerStatus).toBe('dead');
      }).toThrowError();
    });

    it('should register worker exit on "exit"', () => {
      fileWorkerService.startScan(stream$, params);

      logger.info.mockReset();
      workerEmitter.emit('exit');
      expect(logger.info).toBeCalledTimes(1);
    });
  });
});

// describe('getSize', () => {
//   let stream$: Subject<string>;
//   const path = '/sample/file/path';

//   const mockRandom = (value: number) =>
//     jest.spyOn(global.Math, 'random').mockReturnValue(value);

//   beforeEach(() => {
//     stream$ = new Subject<string>();
//     workerPostMessageMock.mockClear();
//   });

//   it('should emit "start-explore" and parameters to the worker', () => {
//     const randomNumber = 0.12341234;
//     mockRandom(randomNumber);

//     fileWorkerService.getSize(stream$, path);
//     expect(workerPostMessageMock).toBeCalledWith({
//       type: 'start-getSize',
//       value: { path: path, id: randomNumber },
//     });
//   });

//   it('should received "job completed" with same id, emit to the stream and complete it', (done) => {
//     const randomNumber = 0.8832342;
//     const response = 42342;
//     mockRandom(randomNumber);

//     fileWorkerService.getSize(stream$, path);

//     let streamValues = [];
//     stream$.subscribe({
//       next: (data) => {
//         streamValues.push(data);
//       },
//       complete: () => {
//         expect(streamValues.length).toBe(1);
//         expect(streamValues[0]).toBe(response);
//         done();
//       },
//     });

//     eventEmitter.emit('message', {
//       type: `getsize-job-completed-${randomNumber}`,
//       value: response,
//     });
//   });
// });
