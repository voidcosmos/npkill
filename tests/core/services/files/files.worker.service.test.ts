import { jest } from '@jest/globals';
import EventEmitter from 'node:events';
import { Subject } from 'rxjs';
import { EVENTS } from '../../../../src/constants/workers.constants.js';
import {
  WorkerMessage,
  WorkerScanOptions,
} from '../../../../src/core/services/files/index.js';
import { LoggerService } from '../../../../src/core/services/logger.service.js';
import { ScanStatus } from '../../../../src/core/interfaces/search-status.model.js';

const workerEmitter: EventEmitter = new EventEmitter();
const port1Emitter: EventEmitter = new EventEmitter();
const port2Emitter: EventEmitter = new EventEmitter();
const workerPostMessageMock = jest.fn();
const workerTerminateMock = jest
  .fn()
  .mockImplementation(() => new Promise(() => {}));
const messageChannelPort1Mock = jest.fn();
const messageChannelPort2Mock = jest.fn();

jest.unstable_mockModule('os', () => ({
  default: { cpus: jest.fn().mockReturnValue([0, 0]) },
}));

jest.unstable_mockModule('worker_threads', () => ({
  Worker: jest.fn(() => ({
    postMessage: workerPostMessageMock,
    on: (eventName: string, listener: (...args: unknown[]) => void) =>
      workerEmitter.on(eventName, listener),
    terminate: workerTerminateMock,
    removeAllListeners: jest.fn(),
    ref: jest.fn(),
    unref: jest.fn(),
  })),

  MessageChannel: jest.fn(() => ({
    port1: {
      postMessage: messageChannelPort1Mock,
      on: (eventName: string, listener: (...args: unknown[]) => void) =>
        port1Emitter.on(eventName, listener),
      removeAllListeners: jest.fn(),
      ref: jest.fn(),
      unref: jest.fn(),
      close: jest.fn(),
    },
    port2: {
      postMessage: messageChannelPort2Mock,
      on: (eventName: string, listener: (...args: unknown[]) => void) =>
        port2Emitter.on(eventName, listener),
      removeAllListeners: jest.fn(),
    },
  })),
}));

const logger = {
  info: jest.fn(),
  error: jest.fn(),
} as unknown as jest.Mocked<LoggerService>;

const FileWorkerServiceConstructor = (
  await import('../../../../src/core/services/files/files.worker.service.js')
).FileWorkerService;
class FileWorkerService extends FileWorkerServiceConstructor {}

const SCAN_OPTIONS: WorkerScanOptions = {
  rootPath: '/sample/path',
  targets: ['node_modules'],
};

function answerExplore(
  results: Array<{ path: string; isTarget: boolean }>,
  scanId = 1,
): void {
  const message: WorkerMessage = {
    type: EVENTS.scanResult,
    value: { workerId: 0, scanId, results },
  };
  port1Emitter.emit('message', message);
}

function answerSize(id: number, size: number, error?: string): void {
  const message: WorkerMessage = {
    type: EVENTS.GetSizeResult,
    value: { workerId: 0, results: { id, path: '/sample/path', size, error } },
  };
  port1Emitter.emit('message', message);
}

interface StreamOutcome<T> {
  values: T[];
  completed: boolean;
  error?: Error;
}

function record<T>(stream$: Subject<T>): StreamOutcome<T> {
  const outcome: StreamOutcome<T> = { values: [], completed: false };
  stream$.subscribe({
    next: (value) => outcome.values.push(value),
    complete: () => (outcome.completed = true),
    error: (error: Error) => (outcome.error = error),
  });
  return outcome;
}

describe('FileWorkerService', () => {
  let fileWorkerService: FileWorkerService;
  let searchStatus: ScanStatus;

  beforeEach(() => {
    jest.clearAllMocks();
    searchStatus = new ScanStatus();
    fileWorkerService = new FileWorkerService(logger, searchStatus);
  });

  afterEach(() => {
    workerEmitter.removeAllListeners();
    port1Emitter.removeAllListeners();
    port2Emitter.removeAllListeners();
  });

  describe('startScan', () => {
    let stream$: Subject<string>;

    beforeEach(() => {
      stream$ = new Subject<string>();
    });

    it('should send the scan options and the root folder to the workers', () => {
      fileWorkerService.startScan(stream$, SCAN_OPTIONS);

      expect(messageChannelPort1Mock).toHaveBeenCalledWith({
        type: EVENTS.exploreConfig,
        value: SCAN_OPTIONS,
      });
      expect(messageChannelPort1Mock).toHaveBeenCalledWith({
        type: EVENTS.explore,
        value: { path: SCAN_OPTIONS.rootPath, scanId: 1 },
      });
    });

    it('should emit the targets and explore the other folders', () => {
      const outcome = record(stream$);
      fileWorkerService.startScan(stream$, SCAN_OPTIONS);

      answerExplore([
        { path: '/sample/path/app/node_modules', isTarget: true },
        { path: '/sample/path/lib', isTarget: false },
      ]);

      expect(outcome.values).toEqual(['/sample/path/app/node_modules']);
      expect(messageChannelPort1Mock).toHaveBeenCalledWith({
        type: EVENTS.explore,
        value: { path: '/sample/path/lib', scanId: 1 },
      });
    });

    it('should complete only when every explored folder has answered', () => {
      const outcome = record(stream$);
      fileWorkerService.startScan(stream$, SCAN_OPTIONS);

      answerExplore([{ path: '/sample/path/lib', isTarget: false }]);
      expect(outcome.completed).toBe(false);

      answerExplore([]);
      expect(outcome.completed).toBe(true);
      expect(searchStatus.workerStatus).toBe('finished');
    });

    it('should ignore results from another scan', () => {
      const outcome = record(stream$);
      fileWorkerService.startScan(stream$, SCAN_OPTIONS);

      answerExplore([{ path: '/old/node_modules', isTarget: true }], 99);

      expect(outcome.values).toEqual([]);
      expect(outcome.completed).toBe(false);
    });

    it('should complete the scan and tell the workers to stop on stopScan', () => {
      const outcome = record(stream$);
      fileWorkerService.startScan(stream$, SCAN_OPTIONS);

      fileWorkerService.stopScan();

      expect(outcome.completed).toBe(true);
      expect(messageChannelPort1Mock).toHaveBeenCalledWith({
        type: EVENTS.stop,
      });
    });

    it('should reject a second scan while the first is running', () => {
      const second$ = new Subject<string>();
      const second = record(second$);
      fileWorkerService.startScan(stream$, SCAN_OPTIONS);

      fileWorkerService.startScan(second$, SCAN_OPTIONS);

      expect(second.error).toBeInstanceOf(Error);
    });

    it('should report a worker crash to the scan', () => {
      const outcome = record(stream$);
      fileWorkerService.startScan(stream$, SCAN_OPTIONS);

      workerEmitter.emit('error', new Error('Worker crashed'));

      expect(outcome.error?.message).toBe('Worker crashed');
      expect(searchStatus.workerStatus).toBe('dead');
    });
  });

  describe('getSize', () => {
    let size$: Subject<number>;

    beforeEach(() => {
      size$ = new Subject<number>();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should emit the size and complete', () => {
      const outcome = record(size$);
      fileWorkerService.getSize(size$, '/sample/path');

      answerSize(1, 4096);

      expect(outcome.values).toEqual([4096]);
      expect(outcome.completed).toBe(true);
    });

    it('should error when the worker cannot read the path', () => {
      const outcome = record(size$);
      fileWorkerService.getSize(size$, '/sample/path');

      answerSize(1, 0, 'ENOENT: no such file or directory');

      expect(outcome.error?.message).toContain('ENOENT');
    });

    it('should error when the worker takes too long', () => {
      jest.useFakeTimers();
      const outcome = record(size$);
      fileWorkerService.getSize(size$, '/sample/path');

      jest.advanceTimersByTime(60000);

      expect(outcome.error?.message).toContain('Timeout');
    });

    it('should report a worker crash to pending size requests', () => {
      const outcome = record(size$);
      fileWorkerService.getSize(size$, '/sample/path');

      workerEmitter.emit('error', new Error('Worker crashed'));

      expect(outcome.error?.message).toBe('Worker crashed');
    });
  });
});

describe('FileWorkerService idle workers', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    workerTerminateMock.mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
    workerEmitter.removeAllListeners();
    port1Emitter.removeAllListeners();
  });

  it('should terminate the workers once there is no work left', () => {
    const fileWorkerService = new FileWorkerService(logger, new ScanStatus());
    fileWorkerService.startScan(new Subject<string>(), SCAN_OPTIONS);

    answerExplore([]);
    jest.runOnlyPendingTimers();

    expect(workerTerminateMock).toHaveBeenCalledTimes(1);
  });
});
