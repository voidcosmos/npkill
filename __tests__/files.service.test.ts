import * as getSize from 'get-folder-size';
import * as rimraf from 'rimraf';

import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'fs';
import { IFileService } from '../src/interfaces/file-service.interface';
import { LinuxFilesService } from '../src/services/linux-files.service';
import { WindowsFilesService } from '../src/services/windows-files.service';
import { MacFilesService } from '../src/services/mac-files.service';
import { StreamService } from '../src/services/stream.service';
jest.mock('get-folder-size');

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

  describe('#isSafeToDelete', () => {
    const target = 'node_modules';

    it('should get false if not is safe to delete ', () => {
      expect(fileService.isSafeToDelete('/one/route', target)).toBe(false);
      expect(fileService.isSafeToDelete('/one/node_/ro/modules', target)).toBe(
        false,
      );
    });
    it('should get true if is safe to delete ', () => {
      expect(
        fileService.isSafeToDelete('/one/route/node_modules', target),
      ).toBe(true);
      expect(
        fileService.isSafeToDelete('/one/route/node_modules/', target),
      ).toBe(true);
    });
  });
});

xdescribe('obsolet File Service', () => {
  let fileService;
  beforeEach(() => {
    fileService = new LinuxFilesService(new StreamService());
  });

  describe('#getFolderSize', () => {
    it('should call getSize function', () => {
      const folderSize = fileService.getFolderSize('');
      expect(getSize).toBeCalled();
    });
    it('should get max 2 decimals on the size', async () => {
      /*jest.mock('get-folder-size', () => getSize => 54674657);
      const folderSize = await fileService.getFolderSize('');
      expect(countDecimals(folderSize)).toBe(2);*/
    });
  });

  describe('#removeDir', () => {
    it('should throw error if try to delete an important directory ', () => {
      expect(() => fileService.removeDir('/')).toThrow();
    });
  });

  describe('#isSafeToDelete', () => {
    it('should throw error if try to delete an important directory ', () => {
      expect(() => fileService.removeDir('/')).toThrow();
    });
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
