import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import EventEmitter from 'node:events';
import { mkdirSync, mkdtempSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { MessageChannel, MessagePort } from 'node:worker_threads';

import { EVENTS } from '../../../../src/constants/workers.constants.js';
import {
  WorkerMessage,
  WorkerScanOptions,
} from '../../../../src/core/services/files/index.js';
import { SharedScan } from '../../../../src/core/services/files/shared-scan.js';

const parentEmitter: EventEmitter = new EventEmitter();

jest.unstable_mockModule('node:worker_threads', () => ({
  parentPort: {
    postMessage: jest.fn(),
    on: (eventName: string, listener: (...args: unknown[]) => void) =>
      parentEmitter.on(eventName, listener),
  },
}));

describe('FileWorker', () => {
  let root: string;
  let tunnel: MessagePort;

  beforeEach(async () => {
    await import('../../../../src/core/services/files/files.worker.js');

    const { port1, port2 } = new MessageChannel();
    tunnel = port1;
    parentEmitter.emit('message', {
      type: EVENTS.startup,
      value: { channel: port2, id: 0 },
    });
    root = mkdtempSync(join(tmpdir(), 'npkill-worker-'));
  });

  afterEach(() => {
    jest.resetModules();
    parentEmitter.removeAllListeners();
    tunnel.close();
    rmSync(root, { recursive: true, force: true });
  });

  function createTree(paths: string[]): void {
    paths.forEach((path) => mkdirSync(join(root, path), { recursive: true }));
  }

  function linkDirectory(target: string, path: string): void {
    symlinkSync(join(root, target), join(root, path), 'junction');
  }

  function scan(
    options: Omit<WorkerScanOptions, 'rootPath'>,
    capacity = 1024 * 1024,
  ): Promise<string[]> {
    const sharedScan = SharedScan.create(root, capacity);
    const found: string[] = [];

    return new Promise((resolve) => {
      tunnel.on('message', (message: WorkerMessage) => {
        if (message.type === EVENTS.scanResult) {
          found.push(...message.value.results);
        }
        if (message.type === EVENTS.scanFinished) {
          resolve(found.map((path) => relative(root, path)).sort());
        }
      });

      tunnel.postMessage({
        type: EVENTS.startScan,
        value: {
          scanId: 1,
          buffer: sharedScan.buffer,
          options: { rootPath: root, ...options },
        },
      });
    });
  }

  it('keeps the folders that do not fit in the shared memory', async () => {
    const projects = ['a', 'b', 'c', 'd'];
    createTree(projects.map((project) => join(project, 'node_modules')));
    const roomForOneFolder = 2 * Buffer.byteLength(join(root, 'a'), 'utf16le');

    const found = await scan({ targets: ['node_modules'] }, roomForOneFolder);

    expect(found).toEqual(
      projects.map((project) => join(project, 'node_modules')),
    );
  });

  it('excludes an exact relative directory path', async () => {
    createTree(['ignorethis/node_modules', 'other/ignorethis/node_modules']);

    const found = await scan({
      targets: ['node_modules'],
      exclude: ['./ignorethis'],
    });

    expect(found).toEqual([join('other', 'ignorethis', 'node_modules')]);
  });

  describe('should skip symbolic links', () => {
    it('does not follow symlinked directories', async () => {
      createTree(['real/node_modules']);
      linkDirectory('real', 'linked');

      expect(await scan({ targets: ['node_modules'] })).toEqual([
        join('real', 'node_modules'),
      ]);
    });

    it('does not report symlinked targets, like workspace packages', async () => {
      createTree(['packages/a/node_modules', 'app']);
      linkDirectory('packages/a/node_modules', 'app/node_modules');

      expect(await scan({ targets: ['node_modules'] })).toEqual([
        join('packages', 'a', 'node_modules'),
      ]);
    });
  });
});
