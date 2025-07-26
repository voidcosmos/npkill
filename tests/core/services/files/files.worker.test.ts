import { jest } from '@jest/globals';
import EventEmitter from 'node:events';
import { Dir } from 'node:fs';
import { join, normalize } from 'node:path';
import { MessageChannel, MessagePort } from 'node:worker_threads';

import { EVENTS } from '../../../../src/constants/workers.constants.js';
import { ScanOptions } from '../../../../src/core/index.js';

const parentEmitter: EventEmitter = new EventEmitter();
let tunnelEmitter: MessagePort;
const tunnelPostMock = jest.fn();

let dirEntriesMock: { name: string; isDirectory: () => void }[] = [];
const basePath = '/home/user/';
const target = 'node_modules';

// const opendirPathMock = jest.fn();
// const opendirDirMock = jest.fn();
// class MockDir extends EventEmitter {
//   private entries: Dirent[];

//   constructor(entries: Dirent[]) {
//     super();
//     this.entries = entries;
//   }

//   read(): Promise<Dirent> {
//     return new Promise((resolve, reject) => {
//       if (this.entries.length === 0) {
//         this.emit('close');
//         resolve(null);
//       } else {
//         resolve(this.entries.shift());
//       }
//     });
//   }
// }

const mockDir = {
  read: () => {
    if (dirEntriesMock.length > 0) {
      return Promise.resolve(dirEntriesMock.shift());
    } else {
      return Promise.resolve(null);
    }
  },
  close: () => {},
} as unknown as Dir;

jest.unstable_mockModule('fs/promises', () => ({
  opendir: (path: string) => new Promise((resolve) => resolve(mockDir)),
  lstat: (path: string) =>
    Promise.resolve({
      blocks: 1,
      size: 100,
      isDirectory: () => false,
      isSymbolicLink: () => false,
    }),
  readdir: (path: string, opts: any) => Promise.resolve([]),
}));

jest.unstable_mockModule('node:worker_threads', () => ({
  parentPort: {
    postMessage: tunnelPostMock,
    on: (eventName: string, listener: (...args: any[]) => void) =>
      parentEmitter.on(eventName, listener),
  },
}));

describe('FileWorker', () => {
  const setExploreConfig = (params: ScanOptions) => {
    tunnelEmitter.postMessage({
      type: EVENTS.exploreConfig,
      value: params,
    });
  };

  beforeEach(async () => {
    await import('../../../../src/core/services/files/files.worker.js');

    const { port1, port2 } = new MessageChannel();
    tunnelEmitter = port1;

    parentEmitter.emit('message', {
      type: EVENTS.startup,
      value: { channel: port2 },
    });
  });

  afterEach(() => {
    jest.resetModules();
    jest.restoreAllMocks();
    parentEmitter.removeAllListeners();
    if (tunnelEmitter && typeof tunnelEmitter.close === 'function') {
      tunnelEmitter.close();
    }
  });

  // it('should plant a listener over the passed MessagePort',()=>{})

  it('should return only sub-directories from given parent', (done) => {
    setExploreConfig({ rootPath: basePath, target });
    const subDirectories = [
      { name: 'file1.txt', isDirectory: () => false },
      { name: 'file2.txt', isDirectory: () => false },
      { name: 'dir1', isDirectory: () => true },
      { name: 'file3.txt', isDirectory: () => false },
      { name: 'dir2', isDirectory: () => true },
    ];

    const expectedResult = subDirectories
      .filter((subdir) => subdir.isDirectory())
      .map((subdir) => ({
        path: join(basePath, subdir.name),
        isTarget: false,
      }));

    dirEntriesMock = [...subDirectories];

    let results: any[];

    tunnelEmitter.on('message', (message) => {
      if (message.type === EVENTS.scanResult) {
        results = message.value.results;

        done();
        expect(results).toEqual(expectedResult);
      }
    });

    tunnelEmitter.postMessage({
      type: EVENTS.explore,
      value: { path: '/home/user/' },
    });
  });

  describe('should mark "isTarget" correctly', () => {
    const sampleTargets = ['node_modules', 'dist'];

    sampleTargets.forEach((target) => {
      it('when target is ' + target, (done) => {
        setExploreConfig({ rootPath: basePath, target: 'node_modules' });
        const subDirectories = [
          { name: 'file1.cs', isDirectory: () => false },
          { name: '.gitignore', isDirectory: () => false },
          { name: 'dir1', isDirectory: () => true },
          { name: 'node_modules', isDirectory: () => true },
          { name: 'file3.txt', isDirectory: () => false },
          { name: 'dir2', isDirectory: () => true },
        ];
        dirEntriesMock = [...subDirectories];

        const expectedResult = subDirectories
          .filter((subdir) => subdir.isDirectory())
          .map((subdir) => ({
            path: join(basePath, subdir.name),
            isTarget: subdir.name === 'node_modules',
          }));

        let results: any[];

        tunnelEmitter.on('message', (message) => {
          if (message.type === EVENTS.scanResult) {
            results = message.value.results;

            expect(results).toEqual(expectedResult);
            done();
          }
        });

        tunnelEmitter.postMessage({
          type: EVENTS.explore,
          value: { path: '/home/user/' },
        });
      });
    });
  });

  describe('should exclude dir', () => {
    it('when a simple patterns is gived', (done) => {
      const excluded = ['ignorethis', 'andignorethis'];
      setExploreConfig({
        rootPath: basePath,
        target: 'node_modules',
        exclude: excluded,
      });
      const subDirectories = [
        { name: 'file1.cs', isDirectory: () => false },
        { name: '.gitignore', isDirectory: () => false },
        { name: 'dir1', isDirectory: () => true },
        { name: 'node_modules', isDirectory: () => true },
        { name: 'ignorethis', isDirectory: () => true },
        { name: 'andignorethis', isDirectory: () => true },
        { name: 'dir2', isDirectory: () => true },
      ];
      dirEntriesMock = [...subDirectories];

      const expectedResult = subDirectories
        .filter(
          (subdir) => subdir.isDirectory() && !excluded.includes(subdir.name),
        )
        .map((subdir) => ({
          path: join(basePath, subdir.name),
          isTarget: subdir.name === 'node_modules',
        }));

      let results: any[];
      tunnelEmitter.on('message', (message) => {
        if (message.type === EVENTS.scanResult) {
          results = message.value.results;

          done();
          expect(results).toEqual(expectedResult);
        }
      });

      tunnelEmitter.postMessage({
        type: EVENTS.explore,
        value: { path: '/home/user/' },
      });
    });

    it('when a part of path is gived', (done) => {
      const excluded = ['user/ignorethis'];
      setExploreConfig({
        rootPath: basePath,
        target: 'node_modules',
        exclude: excluded.map(normalize),
      });
      const subDirectories = [
        { name: 'file1.cs', isDirectory: () => false },
        { name: '.gitignore', isDirectory: () => false },
        { name: 'dir1', isDirectory: () => true },
        { name: 'node_modules', isDirectory: () => true },
        { name: 'ignorethis', isDirectory: () => true },
        { name: 'andNOTignorethis', isDirectory: () => true },
        { name: 'dir2', isDirectory: () => true },
      ];
      dirEntriesMock = [...subDirectories];

      const expectedResult = subDirectories
        .filter(
          (subdir) => subdir.isDirectory() && subdir.name !== 'ignorethis',
        )
        .map((subdir) => ({
          path: join(basePath, subdir.name),
          isTarget: subdir.name === 'node_modules',
        }));

      let results: any[];
      tunnelEmitter.on('message', (message) => {
        if (message.type === EVENTS.scanResult) {
          results = message.value.results;

          done();
          expect(results).toEqual(expectedResult);
        }
      });

      tunnelEmitter.postMessage({
        type: EVENTS.explore,
        value: { path: '/home/user/' },
      });
    });
  });
});
