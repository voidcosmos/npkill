import { jest } from '@jest/globals';
import fs from 'fs';

import { IFileService } from '../../../../src/core/interfaces/file-service.interface.js';
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
  (await import('../../../../src/core/services/files/files.service.js'))
    .FileService;
abstract class FileService extends FileServiceConstructor {}

const LinuxFilesServiceConstructor = //@ts-ignore
  (await import('../../../../src/core/services/files/linux-files.service.js'))
    .LinuxFilesService;
class LinuxFilesService extends LinuxFilesServiceConstructor {}

const MacFilesServiceConstructor = //@ts-ignore
  (await import('../../../../src/core/services/files/mac-files.service.js'))
    .MacFilesService;
class MacFilesService extends MacFilesServiceConstructor {}

const WindowsFilesServiceConstructor = //@ts-ignore
  (await import('../../../../src/core/services/files/windows-files.service.js'))
    .WindowsFilesService;
class WindowsFilesService extends WindowsFilesServiceConstructor {}

import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'fs';
import { StreamService } from '../../../../src/core/services/stream.service.js';

jest.mock('../../../../src/dirname.js', () => {
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

  describe('#isDangerous', () => {
    it('should return false for paths that are not considered dangerous', () => {
      expect(
        fileService.isDangerous('/home/apps/myapp/node_modules'),
      ).toBeFalsy();
      expect(fileService.isDangerous('node_modules')).toBeFalsy();
      expect(
        fileService.isDangerous('/home/user/projects/a/node_modules'),
      ).toBeFalsy();
      expect(
        fileService.isDangerous('/Applications/NotAnApp/node_modules'),
      ).toBeFalsy();
      expect(
        fileService.isDangerous('C:\\Users\\User\\Documents\\node_modules'),
      ).toBeFalsy();
    });

    it('should return true for paths that are considered dangerous', () => {
      expect(
        fileService.isDangerous('/home/.config/myapp/node_modules'),
      ).toBeTruthy();
      expect(fileService.isDangerous('.apps/node_modules')).toBeTruthy();
      expect(
        fileService.isDangerous('.apps/.sample/node_modules'),
      ).toBeTruthy();
      expect(
        fileService.isDangerous('/Applications/MyApp.app/node_modules'),
      ).toBeTruthy();
      expect(
        fileService.isDangerous(
          'C:\\Users\\User\\AppData\\Local\\node_modules',
        ),
      ).toBeTruthy();
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
