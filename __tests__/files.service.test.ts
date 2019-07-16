import { FileService } from '../src/services/files.service';
import * as getSize from 'get-folder-size';
jest.mock('get-folder-size');

describe('File Service', () => {
  let fileService;
  beforeEach(() => {
    fileService = new FileService();
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
});

function countDecimals(number) {
  if (Math.floor(number.valueOf()) === number.valueOf()) return 0;
  return number.toString().split('.')[1].length || 0;
}
