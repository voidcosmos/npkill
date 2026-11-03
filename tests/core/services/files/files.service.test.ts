import { jest } from '@jest/globals';

let statSyncReturnMock = (): { isDirectory: () => boolean } | null => null;
let accessSyncReturnMock = (): boolean | null => null;
const readFileSyncSpy = jest.fn();
jest.unstable_mockModule('fs', () => {
  return {
    statSync: () => statSyncReturnMock(),
    accessSync: () => accessSyncReturnMock(),
    readFileSync: readFileSyncSpy,
    lstat: jest.fn(),
    readdir: jest.fn(),
    rmdir: jest.fn(),
    unlink: jest.fn(),
    rm: jest.fn(),
    default: { constants: { R_OK: 4 } },
  };
});

jest.useFakeTimers();

const FileServiceConstructor = (
  await import('../../../../src/core/services/files/files.service.js')
).FileService;
abstract class FileService extends FileServiceConstructor {}

const UnixFilesServiceConstructor = (
  await import('../../../../src/core/services/files/unix-files.service.js')
).UnixFilesService;
class UnixFilesService extends UnixFilesServiceConstructor {}

import { StreamService } from '../../../../src/core/services/stream.service.js';
import { FileWorkerService } from '../../../../src/core/services/files/index.js';
import os from 'os';

jest.mock('../../../../src/dirname.js', () => {
  return { __esModule: true };
});

const fileWorkerService = jest.fn();

describe('File Service', () => {
  let fileService: FileService;

  beforeEach(() => {
    fileService = new UnixFilesService(
      new StreamService(),
      fileWorkerService as unknown as FileWorkerService,
    );
  });

  describe('isValidRootFolder', () => {
    const path = '/sample/path';

    afterEach(() => {
      jest.restoreAllMocks();
      statSyncReturnMock = () => null;
      statSyncReturnMock = () => null;
    });

    it('should throw error if statSync fail', () => {
      statSyncReturnMock = () => {
        throw new Error('ENOENT');
      };
      expect(fileService.isValidRootFolder(path)).toEqual({
        isValid: false,
        invalidReason: 'The path does not exist.',
      });
    });

    it('should throw error if is not directory', () => {
      statSyncReturnMock = () => ({
        isDirectory: () => false,
      });

      expect(fileService.isValidRootFolder(path)).toEqual({
        isValid: false,
        invalidReason: 'The path must point to a directory.',
      });
    });

    it('should throw error if cant read dir', () => {
      statSyncReturnMock = () => ({
        isDirectory: () => true,
      });
      accessSyncReturnMock = () => {
        throw new Error();
      };

      expect(fileService.isValidRootFolder(path)).toEqual({
        isValid: false,
        invalidReason: 'Cannot read the specified path.',
      });
    });

    it('should return true if is valid rootfolder', () => {
      statSyncReturnMock = () => ({
        isDirectory: () => true,
      });
      accessSyncReturnMock = () => true;

      expect(fileService.isValidRootFolder(path)).toBeTruthy();
    });
  });

  describe('isDangerous', () => {
    const originalEnv = { ...process.env };

    const mockCwd = (cwd: string) => {
      jest.spyOn(process, 'cwd').mockReturnValue(cwd);
    };

    const mockHomedir = (homedir: string) => {
      jest.spyOn(os, 'homedir').mockReturnValue(homedir);
    };

    afterAll(() => {
      process.env = originalEnv;
      jest.restoreAllMocks();
    });

    describe('POSIX paths', () => {
      beforeAll(() => {
        process.env.HOME = '/home/user';
        delete process.env.USERPROFILE;
        mockHomedir('/home/user');
      });

      test('safe relative path', () => {
        mockCwd('/safe/path');
        expect(
          fileService.isDangerous('../project/node_modules').isSensitive,
        ).toBe(false);
      });

      test('hidden relative path', () => {
        mockCwd('/home/user/projects');
        expect(fileService.isDangerous('../.config/secret').isSensitive).toBe(
          true,
        );
      });

      test('node_modules in ~/.cache', () => {
        expect(
          fileService.isDangerous('/home/user/.cache/project/node_modules')
            .isSensitive,
        ).toBe(true);
      });

      test('~/.cache itself', () => {
        expect(fileService.isDangerous('/home/user/.cache').isSensitive).toBe(
          true,
        );
      });

      test('~/.npm itself', () => {
        expect(fileService.isDangerous('/home/user/.npm').isSensitive).toBe(
          false,
        );
      });

      test('parent relative path (..)', () => {
        mockCwd('/home/user');
        expect(fileService.isDangerous('..').isSensitive).toBe(false);
      });

      test('current relative path (.)', () => {
        mockCwd('/home/user');
        expect(fileService.isDangerous('.').isSensitive).toBe(false);
      });

      test('hidden file in home path', () => {
        mockCwd('/home/user');
        expect(fileService.isDangerous('.hidden').isSensitive).toBe(true);
      });

      test('hidden file in not home path', () => {
        mockCwd('/home/user/project/projecta');
        expect(fileService.isDangerous('.hello').isSensitive).toBe(false);
      });

      test('~/Library and everything inside it', () => {
        expect(fileService.isDangerous('/home/user/Library').isSensitive).toBe(
          true,
        );
        expect(
          fileService.isDangerous('/home/user/Library/Caches/app/node_modules')
            .isSensitive,
        ).toBe(true);
      });

      test('HOME with a trailing slash', () => {
        process.env.HOME = '/home/user/';
        try {
          expect(
            fileService.isDangerous('/home/user/.config/app/node_modules')
              .isSensitive,
          ).toBe(true);
        } finally {
          process.env.HOME = '/home/user';
        }
      });
    });

    describe('Windows paths', () => {
      beforeAll(() => {
        process.env.USERPROFILE = 'C:\\Users\\user';
        process.env.HOME = '';
        mockHomedir('C:\\Users\\user');
      });

      test('safe relative path', () => {
        mockCwd('D:\\safe\\path');
        expect(
          fileService.isDangerous('..\\project\\node_modules').isSensitive,
        ).toBe(false);
      });

      test('AppData relative path', () => {
        mockCwd('C:\\Users\\user\\Documents');
        expect(
          fileService.isDangerous('..\\AppData\\Roaming\\app').isSensitive,
        ).toBe(true);
      });

      test('Program Files (x86)', () => {
        expect(
          fileService.isDangerous('C:\\Program Files (x86)\\app\\node_modules')
            .isSensitive,
        ).toBe(true);
      });

      test('network paths', () => {
        expect(
          fileService.isDangerous('\\\\network\\share\\.hidden\\node_modules')
            .isSensitive,
        ).toBe(true);
      });
    });

    describe('Edge cases', () => {
      test('no home directory', () => {
        delete process.env.HOME;
        delete process.env.USERPROFILE;
        mockHomedir('');
        expect(fileService.isDangerous('/some/path').isSensitive).toBe(false);
      });

      test('whitelisted hidden segments', () => {
        expect(
          fileService.isDangerous('/tmp/.cache/project/node_modules')
            .isSensitive,
        ).toBe(false);
        expect(
          fileService.isDangerous('/tmp/.npm/project/node_modules').isSensitive,
        ).toBe(false);
      });

      test('macOS application bundle', () => {
        expect(
          fileService.isDangerous(
            '/Applications/MyApp.app/Contents/node_modules',
          ).isSensitive,
        ).toBe(true);
      });

      test('Windows-style path on POSIX', () => {
        process.env.HOME = '/home/user';
        expect(
          fileService.isDangerous('/home/user/AppData/Local/.cache')
            .isSensitive,
        ).toBe(false);
      });
    });
  });
});
