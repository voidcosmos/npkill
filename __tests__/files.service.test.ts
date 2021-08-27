import * as rimraf from 'rimraf';
import * as fs from 'fs';

import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'fs';
import { IFileService } from '../src/interfaces/file-service.interface';
import { LinuxFilesService } from '../src/services/linux-files.service';
import { WindowsFilesService } from '../src/services/windows-files.service';
import { MacFilesService } from '../src/services/mac-files.service';
import { StreamService } from '../src/services/stream.service';

const countDecimals = (numb: number): number => {
  if (Math.floor(numb.valueOf()) === numb.valueOf()) {
    return 0;
  }
  return numb.toString().split('.')[1].length || 0;
};

describe('File Service', () => {
  let fileService;
  beforeEach(() => {
    fileService = new LinuxFilesService(new StreamService());
  });

  describe('Conversion methods', () => {
    it('#convertKbToGB', () => {
      expect(fileService.convertKbToGB(100000)).toBe(0.095367431640625);
      expect(fileService.convertKbToGB(140000)).toBe(0.133514404296875);
    });
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
    it('should get false if is considered dangerous', () => {
      expect(
        fileService.isDangerous('/home/apps/myapp/node_modules'),
      ).toBeFalsy();
      expect(fileService.isDangerous('node_modules')).toBeFalsy();
      expect(
        fileService.isDangerous('/home/user/projects/a/node_modules'),
      ).toBeFalsy();
    });

    it('should get true if is not considered dangerous ', () => {
      expect(
        fileService.isDangerous('/home/.config/myapp/node_modules'),
      ).toBeTruthy();
      expect(fileService.isDangerous('.apps/node_modules')).toBeTruthy();
      expect(
        fileService.isDangerous('.apps/.sample/node_modules'),
      ).toBeTruthy();
    });
  });

  it('#getFileContent should read file content with utf8 encoding', () => {
    const path = 'file.json';
    const readFileSyncSpy = jest.spyOn(fs, 'readFileSync').mockImplementation();
    fileService.getFileContent(path);
    expect(readFileSyncSpy).toBeCalledWith(path, 'utf8');
  });
});

describe('Functional test for #deleteDir', () => {
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
