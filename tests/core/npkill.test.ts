import { jest } from '@jest/globals';
import { of, throwError, BehaviorSubject } from 'rxjs';
import { take } from 'rxjs/operators';
import { Npkill } from '../../src/core/npkill.js';
import { IFileService } from '../../src/core/interfaces/file-service.interface.js';
import { LoggerService } from '../../src/core/services/logger.service.js';
import { ScanStatus } from '../../src/core/interfaces/search-status.model.js';
import {
  ScanOptions,
  ScanFoundFolder,
  GetSizeResult,
  GetNewestFileResult,
  DeleteResult,
  DeleteOptions,
  RiskAnalysis,
} from '../../src/core/interfaces/folder.interface.js';
import { LogEntry } from '../../src/core/interfaces/logger-service.interface.js';
import { IsValidRootFolderResult } from '../../src/core/interfaces/npkill.interface.js';
import { FileService } from '../../src/core/services/files/index.js';

describe('Npkill', () => {
  let npkill: Npkill;
  let fileServiceMock: jest.Mocked<IFileService>;
  let loggerMock: jest.Mocked<LoggerService>;
  let searchStatusMock: jest.Mocked<ScanStatus>;
  let logSubject: BehaviorSubject<LogEntry[]>;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock services
    fileServiceMock = {
      listDir: jest.fn(),
      getFolderSize: jest.fn(),
      getRecentModificationInDir: jest.fn(),
      deleteDir: jest.fn(),
      fakeDeleteDir: jest.fn(() => Promise.resolve(true)),
      isValidRootFolder: jest.fn(),
      isDangerous: jest.fn(),
      getFileStatsInDir: jest.fn(),
      stopScan: jest.fn(),
      fileWorkerService: {
        startScan: jest.fn(),
        getFolderSize: jest.fn(),
        stopScan: jest.fn(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as unknown as any,
    };

    logSubject = new BehaviorSubject<LogEntry[]>([]);
    loggerMock = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      get: jest.fn(),
      getLog$: jest.fn(() => logSubject.asObservable()),
      getLogByType$: jest.fn(),
      saveToFile: jest.fn(),
      getSuggestLogFilePath: jest.fn(),
      // Private properties (for mocking purposes)
      log: [],
      logSubject: logSubject,
      rotateLogFile: jest.fn(),
      addToLog: jest.fn(),
      getTimestamp: jest.fn(() => Date.now()),
    } as unknown as jest.Mocked<LoggerService>;

    searchStatusMock = {} as jest.Mocked<ScanStatus>;

    // Mock getVersion dependencies
    jest.mock('../../src/utils/get-file-content.js', () => ({
      getFileContent: jest.fn(() => JSON.stringify({ version: '1.0.0' })),
    }));

    npkill = new Npkill({
      fileService: fileServiceMock as unknown as FileService,
      logger: loggerMock,
      searchStatus: searchStatusMock,
    });
  });

  describe('constructor', () => {
    it('should initialize with custom services', () => {
      expect(npkill).toBeInstanceOf(Npkill);
      expect(loggerMock.info).toHaveBeenCalledWith(
        expect.stringContaining('Npkill started!'),
      );
    });

    it('should initialize with default services when none provided', () => {
      const defaultNpkill = new Npkill();
      expect(defaultNpkill).toBeInstanceOf(Npkill);
    });
  });

  describe('startScan$', () => {
    const mockRootPath = '/test/root';
    const mockOptions: ScanOptions = {
      targets: ['node_modules'],
      exclude: ['node_modules/.cache'],
      sortBy: 'size',
      performRiskAnalysis: true,
    };

    it('should emit scan results with risk analysis enabled', (done) => {
      const mockFolderData = 'folder1\nfolder2\nfolder3';
      const mockRiskAnalysis: RiskAnalysis = {
        isSensitive: false,
        reason: 'Safe to delete',
      };

      fileServiceMock.listDir.mockReturnValue(of(mockFolderData));
      fileServiceMock.isDangerous.mockReturnValue(mockRiskAnalysis);

      const results: ScanFoundFolder[] = [];
      npkill.startScan$(mockRootPath, mockOptions).subscribe({
        next: (result) => {
          results.push(result);
        },
        complete: () => {
          expect(results).toHaveLength(3);
          expect(results[0]).toEqual({
            path: 'folder1',
            riskAnalysis: mockRiskAnalysis,
          });
          expect(fileServiceMock.isDangerous).toHaveBeenCalledTimes(3);
          expect(loggerMock.info).toHaveBeenCalledWith(
            `Scan started in ${mockRootPath}`,
          );
          done();
        },
      });
    });

    it('should emit scan results without risk analysis when disabled', (done) => {
      const mockFolderData = 'folder1\nfolder2';
      const optionsWithoutRisk = { ...mockOptions, performRiskAnalysis: false };

      fileServiceMock.listDir.mockReturnValue(of(mockFolderData));

      const results: ScanFoundFolder[] = [];
      npkill.startScan$(mockRootPath, optionsWithoutRisk).subscribe({
        next: (result) => {
          results.push(result);
        },
        complete: () => {
          expect(results).toHaveLength(2);
          expect(results[0]).toEqual({ path: 'folder1' });
          expect(fileServiceMock.isDangerous).not.toHaveBeenCalled();
          done();
        },
      });
    });

    it('should filter out empty paths', (done) => {
      const mockFolderData = 'folder1\n\nfolder3\n';
      fileServiceMock.listDir.mockReturnValue(of(mockFolderData));

      const results: ScanFoundFolder[] = [];
      npkill.startScan$(mockRootPath, mockOptions).subscribe({
        next: (result) => {
          results.push(result);
        },
        complete: () => {
          expect(results).toHaveLength(2);
          expect(results.map((r) => r.path)).toEqual(['folder1', 'folder3']);
          done();
        },
      });
    });

    it('should handle errors in listDir', (done) => {
      fileServiceMock.listDir.mockReturnValue(
        throwError(() => new Error('Permission denied')),
      );

      npkill.startScan$(mockRootPath, mockOptions).subscribe({
        next: () => {},
        error: (error) => {
          expect(error).toBeInstanceOf(Error);
          expect(error.message).toBe('Error while listing directories');
          done();
        },
      });
    });

    it('should log completion time', (done) => {
      fileServiceMock.listDir.mockReturnValue(of('folder1'));

      npkill.startScan$(mockRootPath, mockOptions).subscribe({
        complete: () => {
          expect(loggerMock.info).toHaveBeenCalledWith(
            expect.stringMatching(/^Search completed after \d+(\.\d+)?s$/),
          );
          done();
        },
      });
    });
  });

  describe('getSize$', () => {
    const mockPath = '/test/folder';

    it('should return folder size in bytes', (done) => {
      const mockSize = 1024;
      fileServiceMock.getFolderSize.mockReturnValue(of(mockSize));

      npkill.getSize$(mockPath).subscribe((result: GetSizeResult) => {
        expect(result).toEqual({
          size: mockSize,
          unit: 'bytes',
        });
        expect(loggerMock.info).toHaveBeenCalledWith(
          `Calculating folder size for ${mockPath}`,
        );
        expect(loggerMock.info).toHaveBeenCalledWith(
          `Size of ${mockPath}: ${mockSize} bytes`,
        );
        done();
      });
    });

    it('should take only one value from the stream', () => {
      fileServiceMock.getFolderSize.mockReturnValue(of(100, 200, 300));

      npkill
        .getSize$(mockPath)
        .pipe(take(1))
        .subscribe((result) => {
          expect(result.size).toBe(100);
        });
    });
  });

  describe('getNewestFile$', () => {
    const mockPath = '/test/folder';

    it('should return newest file information', (done) => {
      const mockResult: GetNewestFileResult = {
        path: '/test/folder/newest.txt',
        name: 'newest.txt',
        timestamp: 1640995200000,
      };

      fileServiceMock.getRecentModificationInDir.mockResolvedValue(mockResult);

      npkill.getNewestFile$(mockPath).subscribe((result) => {
        expect(result).toEqual(mockResult);
        expect(loggerMock.info).toHaveBeenCalledWith(
          `Calculating last mod. of ${mockPath}`,
        );
        expect(loggerMock.info).toHaveBeenCalledWith(
          `Last mod. of ${mockPath}: ${mockResult.timestamp}`,
        );
        done();
      });
    });

    it('should handle null result when no files found', (done) => {
      fileServiceMock.getRecentModificationInDir.mockResolvedValue(null);

      npkill.getNewestFile$(mockPath).subscribe((result) => {
        expect(result).toBeNull();
        expect(loggerMock.info).toHaveBeenCalledWith(
          `Calculating last mod. of ${mockPath}`,
        );
        // Should not log the timestamp when result is null
        expect(loggerMock.info).not.toHaveBeenCalledWith(
          expect.stringContaining('Last mod. of'),
        );
        done();
      });
    });
  });

  describe('delete$', () => {
    const mockPath = '/test/folder/node_modules';

    it('should successfully delete folder', (done) => {
      fileServiceMock.deleteDir.mockResolvedValue(true);

      npkill.delete$(mockPath).subscribe({
        next: (result: DeleteResult) => {
          expect(result).toEqual({
            path: mockPath,
            success: true,
          });
          expect(fileServiceMock.deleteDir).toHaveBeenCalledWith(mockPath);
          expect(loggerMock.info).toHaveBeenCalledWith(
            `Deleting ${mockPath} ...`,
          );
          expect(loggerMock.info).toHaveBeenCalledWith(
            `Deleted ${mockPath}: true`,
          );
          done();
        },
        error: (err) => {
          done(err);
        },
      });
    });

    it('should handle deletion failure', (done) => {
      fileServiceMock.deleteDir.mockResolvedValue(false);

      npkill.delete$(mockPath).subscribe((result: DeleteResult) => {
        expect(result).toEqual({
          path: mockPath,
          success: false,
        });
        expect(loggerMock.error).toHaveBeenCalledWith(
          `Failed to delete ${mockPath}`,
        );
        done();
      });
    });

    it('should perform dry run when specified', (done) => {
      const options: DeleteOptions = { dryRun: true };
      fileServiceMock.fakeDeleteDir.mockResolvedValue(true);

      npkill.delete$(mockPath, options).subscribe((result: DeleteResult) => {
        expect(result).toEqual({
          path: mockPath,
          success: true,
        });
        expect(fileServiceMock.fakeDeleteDir).toHaveBeenCalled();
        expect(fileServiceMock.deleteDir).not.toHaveBeenCalled();
        expect(loggerMock.info).toHaveBeenCalledWith(
          `Deleting ${mockPath} (dry run)...`,
        );
        done();
      });
    });
  });

  describe('getLogs$', () => {
    it('should return log stream from logger service', (done) => {
      const mockLogs: LogEntry[] = [
        { type: 'info', timestamp: Date.now(), message: 'Test log' },
      ];
      logSubject.next(mockLogs);

      npkill.getLogs$().subscribe((logs) => {
        expect(logs).toEqual(mockLogs);
        done();
      });
    });
  });

  describe('stopScan', () => {
    it('should stop scan and log action', () => {
      npkill.stopScan();

      expect(loggerMock.info).toHaveBeenCalledWith('Stopping scan...');
      expect(fileServiceMock.stopScan).toHaveBeenCalled();
    });
  });

  describe('isValidRootFolder', () => {
    const mockPath = '/test/root';

    it('should return valid result for valid folder', () => {
      const mockResult: IsValidRootFolderResult = {
        isValid: true,
      };
      fileServiceMock.isValidRootFolder.mockReturnValue(mockResult);

      const result = npkill.isValidRootFolder(mockPath);

      expect(result).toEqual(mockResult);
      expect(fileServiceMock.isValidRootFolder).toHaveBeenCalledWith(mockPath);
    });

    it('should return invalid result with reason', () => {
      const mockResult: IsValidRootFolderResult = {
        isValid: false,
        invalidReason: 'Directory does not exist',
      };
      fileServiceMock.isValidRootFolder.mockReturnValue(mockResult);

      const result = npkill.isValidRootFolder(mockPath);

      expect(result).toEqual(mockResult);
    });
  });

  describe('getVersion', () => {
    it('should return version from package.json', () => {
      // This is mocked in beforeEach, so it should return '1.0.0'
      const version = npkill.getVersion();
      expect(typeof version).toBe('string');
      expect(version.length).toBeGreaterThan(0);
    });
  });

  describe('logger getter', () => {
    it('should return the logger service', () => {
      expect(npkill.logger).toBe(loggerMock);
    });
  });

  describe('error handling and edge cases', () => {
    it('should handle empty scan results', (done) => {
      fileServiceMock.listDir.mockReturnValue(of(''));

      const results: ScanFoundFolder[] = [];
      npkill.startScan$('/test', { targets: ['node_modules'] }).subscribe({
        next: (result) => results.push(result),
        complete: () => {
          expect(results).toHaveLength(0);
          done();
        },
      });
    });

    it('should handle scan with minimal options', (done) => {
      fileServiceMock.listDir.mockReturnValue(of('folder1'));

      npkill.startScan$('/test', { targets: ['node_modules'] }).subscribe({
        next: (result) => {
          expect(result.path).toBe('folder1');
          done();
        },
      });
    });

    it('should handle size calculation errors gracefully', (done) => {
      fileServiceMock.getFolderSize.mockReturnValue(
        throwError(() => new Error('Access denied')),
      );

      npkill.getSize$('/test').subscribe({
        error: (error) => {
          expect(error).toBeInstanceOf(Error);
          done();
        },
      });
    });

    it('should handle newest file calculation errors', (done) => {
      fileServiceMock.getRecentModificationInDir.mockRejectedValue(
        new Error('Access denied'),
      );

      npkill.getNewestFile$('/test').subscribe({
        error: (error) => {
          expect(error).toBeInstanceOf(Error);
          done();
        },
      });
    });

    it('should handle deletion errors', (done) => {
      fileServiceMock.deleteDir.mockRejectedValue(
        new Error('Permission denied'),
      );

      npkill.delete$('/test').subscribe({
        error: (error) => {
          expect(error).toBeInstanceOf(Error);
          done();
        },
      });
    });
  });

  describe('API contract validation', () => {
    it('should maintain consistent return types for startScan$', () => {
      fileServiceMock.listDir.mockReturnValue(of('test'));

      const observable = npkill.startScan$('/test', {
        targets: ['node_modules'],
      });
      expect(observable).toBeDefined();

      observable.subscribe((result) => {
        expect(result).toHaveProperty('path');
        expect(typeof result.path).toBe('string');
        // riskAnalysis is optional
        if (result.riskAnalysis) {
          expect(result.riskAnalysis).toHaveProperty('isSensitive');
          expect(typeof result.riskAnalysis.isSensitive).toBe('boolean');
        }
      });
    });

    it('should maintain consistent return types for getSize$', () => {
      fileServiceMock.getFolderSize.mockReturnValue(of(1024));

      const observable = npkill.getSize$('/test');
      expect(observable).toBeDefined();

      observable.subscribe((result) => {
        expect(result).toHaveProperty('size');
        expect(result).toHaveProperty('unit');
        expect(typeof result.size).toBe('number');
        expect(result.unit).toBe('bytes');
      });
    });

    it('should maintain consistent return types for delete$', () => {
      fileServiceMock.deleteDir.mockResolvedValue(true);

      const observable = npkill.delete$('/test');
      expect(observable).toBeDefined();

      observable.subscribe((result) => {
        expect(result).toHaveProperty('path');
        expect(result).toHaveProperty('success');
        expect(typeof result.path).toBe('string');
        expect(typeof result.success).toBe('boolean');
      });
    });
  });
});
