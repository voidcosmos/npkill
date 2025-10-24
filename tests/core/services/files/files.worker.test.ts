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

let dirEntriesMock: {
  name: string;
  isDirectory: () => void;
  isSymbolicLink: () => void;
}[] = [];
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
  opendir: () => new Promise((resolve) => resolve(mockDir)),
  lstat: () =>
    Promise.resolve({
      blocks: 1,
      size: 100,
      isDirectory: () => false,
      isSymbolicLink: () => false,
    }),
  readdir: () => Promise.resolve([]),
}));

jest.unstable_mockModule('node:worker_threads', () => ({
  parentPort: {
    postMessage: tunnelPostMock,
    on: (eventName: string, listener: (...args: unknown[]) => void) =>
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
    setExploreConfig({ targets: [target] });
    const subDirectories = [
      {
        name: 'file1.txt',
        isDirectory: () => false,
        isSymbolicLink: () => false,
      },
      {
        name: 'file2.txt',
        isDirectory: () => false,
        isSymbolicLink: () => false,
      },
      { name: 'dir1', isDirectory: () => true, isSymbolicLink: () => false },
      {
        name: 'file3.txt',
        isDirectory: () => false,
        isSymbolicLink: () => false,
      },
      { name: 'dir2', isDirectory: () => true, isSymbolicLink: () => false },
    ];

    const expectedResult = subDirectories
      .filter((subdir) => subdir.isDirectory())
      .map((subdir) => ({
        path: join(basePath, subdir.name),
        isTarget: false,
      }));

    dirEntriesMock = [...subDirectories];

    let results: unknown[];

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
        setExploreConfig({ targets: [target] });
        const subDirectories = [
          {
            name: 'file1.cs',
            isDirectory: () => false,
            isSymbolicLink: () => false,
          },
          {
            name: '.gitignore',
            isDirectory: () => false,
            isSymbolicLink: () => false,
          },
          {
            name: 'dir1',
            isDirectory: () => true,
            isSymbolicLink: () => false,
          },
          {
            name: 'node_modules',
            isDirectory: () => true,
            isSymbolicLink: () => false,
          },
          {
            name: 'file3.txt',
            isDirectory: () => false,
            isSymbolicLink: () => false,
          },
          {
            name: 'dir2',
            isDirectory: () => true,
            isSymbolicLink: () => false,
          },
        ];
        dirEntriesMock = [...subDirectories];

        const expectedResult = subDirectories
          .filter((subdir) => subdir.isDirectory())
          .map((subdir) => ({
            path: join(basePath, subdir.name),
            isTarget: subdir.name === target,
          }));

        let results: unknown[];

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
        targets: ['node_modules'],
        exclude: excluded,
      });
      const subDirectories = [
        {
          name: 'file1.cs',
          isDirectory: () => false,
          isSymbolicLink: () => false,
        },
        {
          name: '.gitignore',
          isDirectory: () => false,
          isSymbolicLink: () => false,
        },
        { name: 'dir1', isDirectory: () => true, isSymbolicLink: () => false },
        {
          name: 'node_modules',
          isDirectory: () => true,
          isSymbolicLink: () => false,
        },
        {
          name: 'ignorethis',
          isDirectory: () => true,
          isSymbolicLink: () => false,
        },
        {
          name: 'andignorethis',
          isDirectory: () => true,
          isSymbolicLink: () => false,
        },
        { name: 'dir2', isDirectory: () => true, isSymbolicLink: () => false },
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

      let results: unknown[];
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
        targets: ['node_modules'],
        exclude: excluded.map(normalize),
      });
      const subDirectories = [
        {
          name: 'file1.cs',
          isDirectory: () => false,
          isSymbolicLink: () => false,
        },
        {
          name: '.gitignore',
          isDirectory: () => false,
          isSymbolicLink: () => false,
        },
        { name: 'dir1', isDirectory: () => true, isSymbolicLink: () => false },
        {
          name: 'node_modules',
          isDirectory: () => true,
          isSymbolicLink: () => false,
        },
        {
          name: 'ignorethis',
          isDirectory: () => true,
          isSymbolicLink: () => false,
        },
        {
          name: 'andNOTignorethis',
          isDirectory: () => true,
          isSymbolicLink: () => false,
        },
        { name: 'dir2', isDirectory: () => true, isSymbolicLink: () => false },
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

      let results: unknown[];
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

  describe('should skip symbolic links', () => {
    it('should not return symlinked directories', (done) => {
      setExploreConfig({ targets: ['node_modules'] });
      const subDirectories = [
        {
          name: 'regular-dir',
          isDirectory: () => true,
          isSymbolicLink: () => false,
        },
        {
          name: 'symlinked-dir',
          isDirectory: () => true,
          isSymbolicLink: () => true, // This should be skipped
        },
        {
          name: 'node_modules',
          isDirectory: () => true,
          isSymbolicLink: () => false,
        },
        {
          name: 'another-symlink',
          isDirectory: () => true,
          isSymbolicLink: () => true, // This should be skipped
        },
        {
          name: 'another-regular-dir',
          isDirectory: () => true,
          isSymbolicLink: () => false,
        },
      ];

      // Only non-symlinked directories should be in results
      const expectedResult = subDirectories
        .filter((subdir) => subdir.isDirectory() && !subdir.isSymbolicLink())
        .map((subdir) => ({
          path: join(basePath, subdir.name),
          isTarget: subdir.name === 'node_modules',
        }));

      dirEntriesMock = [...subDirectories];

      let results: unknown[];

      tunnelEmitter.on('message', (message) => {
        if (message.type === EVENTS.scanResult) {
          results = message.value.results;

          expect(results).toEqual(expectedResult);
          // Verify symlinks were filtered out
          expect(results).toHaveLength(3);
          const paths = (results as Array<{ path: string }>).map((r) => r.path);
          expect(paths.some((p) => p.includes('symlink'))).toBe(false);
          done();
        }
      });

      tunnelEmitter.postMessage({
        type: EVENTS.explore,
        value: { path: '/home/user/' },
      });
    });

    it('should skip symlinked files', (done) => {
      setExploreConfig({ targets: ['node_modules'] });
      const subDirectories = [
        {
          name: 'regular-file.txt',
          isDirectory: () => false,
          isSymbolicLink: () => false,
        },
        {
          name: 'symlinked-file.txt',
          isDirectory: () => false,
          isSymbolicLink: () => true, // This should be skipped
        },
        {
          name: 'regular-dir',
          isDirectory: () => true,
          isSymbolicLink: () => false,
        },
      ];

      // Only regular directories should be in results (files are not included anyway)
      const expectedResult = [
        {
          path: join(basePath, 'regular-dir'),
          isTarget: false,
        },
      ];

      dirEntriesMock = [...subDirectories];

      let results: unknown[];

      tunnelEmitter.on('message', (message) => {
        if (message.type === EVENTS.scanResult) {
          results = message.value.results;

          expect(results).toEqual(expectedResult);
          expect(results).toHaveLength(1);
          done();
        }
      });

      tunnelEmitter.postMessage({
        type: EVENTS.explore,
        value: { path: '/home/user/' },
      });
    });

    it('should handle yarn/pnpm workspace symlinks', (done) => {
      setExploreConfig({ targets: ['node_modules'] });
      const subDirectories = [
        {
          name: 'node_modules',
          isDirectory: () => true,
          isSymbolicLink: () => false,
        },
        {
          name: '@workspace-package', // Yarn workspace symlink
          isDirectory: () => true,
          isSymbolicLink: () => true,
        },
        {
          name: 'package-a', // pnpm symlink
          isDirectory: () => true,
          isSymbolicLink: () => true,
        },
        {
          name: 'src',
          isDirectory: () => true,
          isSymbolicLink: () => false,
        },
      ];

      // Only non-symlinked directories
      const expectedResult = [
        {
          path: join(basePath, 'node_modules'),
          isTarget: true,
        },
        {
          path: join(basePath, 'src'),
          isTarget: false,
        },
      ];

      dirEntriesMock = [...subDirectories];

      let results: unknown[];

      tunnelEmitter.on('message', (message) => {
        if (message.type === EVENTS.scanResult) {
          results = message.value.results;

          expect(results).toEqual(expectedResult);
          // Verify workspace symlinks were excluded
          expect(results).toHaveLength(2);
          const paths = (results as Array<{ path: string }>).map((r) => r.path);
          expect(paths.some((p) => p.includes('@workspace'))).toBe(false);
          expect(paths.some((p) => p.includes('package-a'))).toBe(false);
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
