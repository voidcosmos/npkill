import { jest } from '@jest/globals';

import { of, throwError } from 'rxjs';
import { FileService } from '../../src/core/services/files/files.service';
import { Npkill } from '../../src/core/index';

describe('Npkill', () => {
  let npkill: Npkill;
  let fileServiceMock: jest.Mocked<FileService>;

  beforeEach(() => {
    fileServiceMock = {
      listDir: jest.fn(),
      getFolderSize: jest.fn(),
      getRecentModificationInDir: jest.fn(),
      deleteDir: jest.fn(),
    } as any;

    npkill = new Npkill({
      fileService: fileServiceMock,
    });
  });

  describe('constructor', () => {
    it('should create default services if no custom services are provided', () => {
      const npkillInstance = new Npkill();
      expect(npkillInstance.getFileService()).toBeDefined();
    });

    it('should allow custom services to override the default ones', () => {
      const customService = { fileService: fileServiceMock };
      const npkillInstance = new Npkill(customService);
      expect(npkillInstance.getFileService()).toBe(customService.fileService);
    });
  });

  describe('findFolders', () => {
    it('should return an observable that emits folder paths', (done) => {
      fileServiceMock.listDir.mockReturnValue(of('folder1\nfolder2'));
      const options = { path: '/some/path', target: 'targetFolder' };

      let results: string[] = [];
      npkill.findFolders(options).subscribe((result) => {
        results = [...results, result];
        if (results.length === 2) {
          expect(results[0]).toBe('folder1');
          expect(results[1]).toBe('folder2');
          done();
        }
      });
    });

    it('should filter out empty paths', (done) => {
      fileServiceMock.listDir.mockReturnValue(of('folder1\n\nfolder3'));
      const expected = ['folder1', 'folder3'];
      const options = { path: '/some/path', target: 'targetFolder' };

      let results: string[] = [];
      npkill.findFolders(options).subscribe((result) => {
        results = [...results, result];
        if (results.length === 2) {
          expect(results).toEqual(expected);
          done();
        }
      });
    });

    it('should handle errors in listDir', (done) => {
      fileServiceMock.listDir.mockReturnValue(
        throwError(() => new Error('some error')),
      );
      const options = { path: '/some/path', target: 'targetFolder' };

      npkill.findFolders(options).subscribe({
        next: () => {},
        error: (error) => {
          expect(error).toBeDefined();
          done();
        },
      });
    });
  });

  describe('getFolderStats', () => {
    it('should call getFolderSize and return the correct value', (done) => {
      fileServiceMock.getFolderSize.mockReturnValue(of(123));

      npkill.getFolderStats('/some/path').subscribe((size) => {
        expect(size).toBe(123);
        done();
      });
    });
  });

  describe('getRecentModification', () => {
    it('should call getRecentModificationInDir and return the correct value', async () => {
      fileServiceMock.getRecentModificationInDir.mockResolvedValue(456);

      const result = await npkill.getRecentModification('/some/path');
      expect(result).toBe(456);
    });
  });

  describe('deleteFolder', () => {
    it('should call deleteDir and return true when successful', async () => {
      fileServiceMock.deleteDir.mockResolvedValue(true);
      const result = await npkill.deleteFolder('/some/path');
      expect(result).toBe(true);
    });

    it('should return false if deleteDir fails', async () => {
      fileServiceMock.deleteDir.mockResolvedValue(false);
      const result = await npkill.deleteFolder('/some/path');
      expect(result).toBe(false);
    });
  });

  describe('getFileService', () => {
    it('should return the fileService instance', () => {
      expect(npkill.getFileService()).toBe(fileServiceMock);
    });
  });
});
