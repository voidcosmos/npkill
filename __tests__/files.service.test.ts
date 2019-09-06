import * as getSize from 'get-folder-size';

import { LinuxFilesService } from '../src/services/linux-files.service';
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
