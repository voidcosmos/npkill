import { jest } from '@jest/globals';
import fs from 'fs';

import { IFileService } from '../src/interfaces/file-service.interface.js';
import * as rimraf from 'rimraf';

let statSyncReturnMock = (): { isDirectory: () => boolean } | null => null;
let accessSyncReturnMock = (): boolean | null => null;
const readFileSyncSpy = jest.fn();
jest.unstable_mockModule('fs', () => {
  return {
    statSync: (path) => statSyncReturnMock(),
    accessSync: (path, flag) => accessSyncReturnMock(),
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

const FileServiceConstructor = //@ts-ignore
  (await import('../src/services/files/files.service.js')).FileService;
abstract class FileService extends FileServiceConstructor {}

const LinuxFilesServiceConstructor = //@ts-ignore
  (await import('../src/services/files/linux-files.service.js'))
    .LinuxFilesService;
class LinuxFilesService extends LinuxFilesServiceConstructor {}

const MacFilesServiceConstructor = //@ts-ignore
  (await import('../src/services/files/mac-files.service.js')).MacFilesService;
class MacFilesService extends MacFilesServiceConstructor {}

const WindowsFilesServiceConstructor = //@ts-ignore
  (await import('../src/services/files/windows-files.service.js'))
    .WindowsFilesService;
class WindowsFilesService extends WindowsFilesServiceConstructor {}

import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'fs';
import { StreamService } from '../src/services/stream.service.js';

jest.mock('../src/dirname.js', () => {
  return { __esModule: true };
});

const fileWorkerService: any = jest.fn();

describe('File Service', () => {
  let fileService: FileService;

  beforeEach(() => {
    fileService = new LinuxFilesService(new StreamService(), fileWorkerService);
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
      expect(() => fileService.isValidRootFolder(path)).toThrow(
        'The path does not exist.',
      );
    });

    it('should throw error if is not directory', () => {
      statSyncReturnMock = () => ({
        isDirectory: () => false,
      });

      expect(() => fileService.isValidRootFolder(path)).toThrow(
        'The path must point to a directory.',
      );
    });

    it('should throw error if cant read dir', () => {
      statSyncReturnMock = () => ({
        isDirectory: () => true,
      });
      accessSyncReturnMock = () => {
        throw new Error();
      };

      expect(() => fileService.isValidRootFolder(path)).toThrow(
        'Cannot read the specified path.',
      );
    });

    it('should return true if is valid rootfolder', () => {
      statSyncReturnMock = () => ({
        isDirectory: () => true,
      });
      accessSyncReturnMock = () => true;

      expect(fileService.isValidRootFolder(path)).toBeTruthy();
    });
  });

  describe('Conversion methods', () => {
    it('#convertBytesToKB', () => {
      expect(fileService.convertBytesToKB(1)).toBe(0.0009765625);
      expect(fileService.convertBytesToKB(100)).toBe(0.09765625);
      expect(fileService.convertBytesToKB(96)).toBe(0.09375);
    });
    it('#convertGBToMB', () => {
      expect(fileService.convertGBToMB(1)).toBe(1024);
      expect(fileService.convertGBToMB(100)).toBe(102400);
      expect(fileService.convertGBToMB(96)).toBe(98304);
    });
  });

  describe('#isSafeToDelete', () => {
    const target = 'node_modules';

    it('should get false if not is safe to delete ', () => {
      expect(fileService.isSafeToDelete('/one/route', target)).toBeFalsy();
      expect(
        fileService.isSafeToDelete('/one/node_/ro/modules', target),
      ).toBeFalsy();
      expect(fileService.isSafeToDelete('nodemodules', target)).toBeFalsy();
    });

    it('should get true if is safe to delete ', () => {
      expect(
        fileService.isSafeToDelete('/one/route/node_modules', target),
      ).toBeTruthy();
      expect(
        fileService.isSafeToDelete('/one/route/node_modules/', target),
      ).toBeTruthy();
    });
  });

  describe('isDangerous', () => {
    const originalEnv = { ...process.env };
    const originalCwd = process.cwd();

    const mockCwd = (cwd: string) => {
      jest.spyOn(process, 'cwd').mockReturnValue(cwd);
    };

    afterAll(() => {
      process.env = originalEnv;
    });

    describe('POSIX paths', () => {
      beforeAll(() => {
        process.env.HOME = '/home/user';
        delete process.env.USERPROFILE;
      });

      test('safe relative path', () => {
        mockCwd('/safe/path');
        expect(fileService.isDangerous('../project/node_modules')).toBe(false);
      });

      test('hidden relative path', () => {
        mockCwd('/home/user/projects');
        expect(fileService.isDangerous('../.config/secret')).toBe(true);
      });

      test('node_modules in ~/.cache', () => {
        expect(
          fileService.isDangerous('/home/user/.cache/project/node_modules'),
        ).toBe(false);
      });

      test('parent relative path (..)', () => {
        mockCwd('/home/user');
        expect(fileService.isDangerous('..')).toBe(false);
      });

      test('current relative path (.)', () => {
        mockCwd('/home/user');
        expect(fileService.isDangerous('.')).toBe(false);
      });
    });

    describe('Windows paths', () => {
      beforeAll(() => {
        process.env.USERPROFILE = 'C:\\Users\\user';
        process.env.HOME = '';
      });

      test('safe relative path', () => {
        mockCwd('D:\\safe\\path');
        expect(fileService.isDangerous('..\\project\\node_modules')).toBe(
          false,
        );
      });

      test('AppData relative path', () => {
        mockCwd('C:\\Users\\user\\Documents');
        expect(fileService.isDangerous('..\\AppData\\Roaming\\app')).toBe(true);
      });

      test('Program Files (x86)', () => {
        expect(
          fileService.isDangerous('C:\\Program Files (x86)\\app\\node_modules'),
        ).toBe(true);
      });

      test('network paths', () => {
        expect(
          fileService.isDangerous('\\\\network\\share\\.hidden\\node_modules'),
        ).toBe(true);
      });
    });

    describe('Edge cases', () => {
      test('no home directory', () => {
        delete process.env.HOME;
        delete process.env.USERPROFILE;
        expect(fileService.isDangerous('/some/path')).toBe(false);
      });

      test('whitelisted hidden segments', () => {
        expect(
          fileService.isDangerous('/tmp/.cache/project/node_modules'),
        ).toBe(false);
        expect(fileService.isDangerous('/tmp/.npm/project/node_modules')).toBe(
          false,
        );
      });

      test('macOS application bundle', () => {
        expect(
          fileService.isDangerous(
            '/Applications/MyApp.app/Contents/node_modules',
          ),
        ).toBe(true);
      });

      test('Windows-style path on POSIX', () => {
        process.env.HOME = '/home/user';
        expect(fileService.isDangerous('/home/user/AppData/Local/.cache')).toBe(
          false,
        );
      });
    });
  });

  it('#getFileContent should read file content with utf8 encoding', () => {
    const path = 'file.json';
    fileService.getFileContent(path);
    expect(readFileSyncSpy).toHaveBeenCalledWith(path, 'utf8');
  });

  xdescribe('Functional test for #deleteDir', () => {
    let fileService: IFileService;
    const testFolder = 'test-files';
    const directories = [
      'testProject',
      'awesome-fake-project',
      'a',
      'ewez',
      'potato and bananas',
    ];

    const createDir = (dir) => mkdirSync(dir);
    const isDirEmpty = (dir) => readdirSync(dir).length === 0;
    const createFileWithSize = (filename, mb) =>
      writeFileSync(filename, Buffer.alloc(1024 * 1024 * mb));

    beforeAll(() => {
      const getOS = () => process.platform;
      const OSService = {
        linux: LinuxFilesService,
        win32: WindowsFilesService,
        darwin: MacFilesService,
      };
      const streamService: StreamService = new StreamService();
      fileService = new OSService[getOS()](streamService);

      if (existsSync(testFolder)) {
        rimraf.sync(testFolder);
      }
      createDir(testFolder);

      directories.forEach((dirName) => {
        const basePath = `${testFolder}/${dirName}`;
        const targetFolder = `${basePath}/node_modules`;
        const subfolder = `${targetFolder}/sample subfolder`;
        createDir(basePath);
        createDir(targetFolder);
        createDir(subfolder);
        createFileWithSize(targetFolder + '/a', 30);
        createFileWithSize(subfolder + '/sample file', 12);
        // Create this structure:
        //   test-files
        //    |testProject
        //      |a (file)
        //      |sample subfolder
        //       |sample file (file)
        //    |etc...
      });
    });

    afterAll(() => {
      rimraf.sync(testFolder);
    });

    it('Test folder should not be empty', () => {
      expect(isDirEmpty(testFolder)).toBeFalsy();
    });

    it('Should delete all folders created in test folder', async () => {
      for (const dirName of directories) {
        const path = `${testFolder}/${dirName}`;
        expect(existsSync(path)).toBeTruthy();
        await fileService.deleteDir(path);
        expect(existsSync(path)).toBeFalsy();
      }
      expect(isDirEmpty(testFolder)).toBeTruthy();
    });
  });

  describe('fakeDeleteDir', () => {
    it('Should return a Promise', () => {
      const result = fileService.fakeDeleteDir('/sample/path');
      expect(result).toBeInstanceOf(Promise);
    });
  });
});
