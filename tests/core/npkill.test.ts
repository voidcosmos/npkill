import { jest } from '@jest/globals';
import { resolve } from 'path';
import { firstValueFrom } from 'rxjs';
import { Npkill } from '../../src/core/npkill.js';
import { IFileService } from '../../src/core/interfaces/file-service.interface.js';
import { LoggerService } from '../../src/core/services/logger.service.js';
import { ScanStatus } from '../../src/core/interfaces/search-status.model.js';
import {
  FileService,
  UnixFilesService,
} from '../../src/core/services/files/index.js';

describe('Npkill', () => {
  let npkill: Npkill;
  let fileServiceMock: jest.Mocked<IFileService>;
  let loggerMock: jest.Mocked<LoggerService>;
  let searchStatusMock: jest.Mocked<ScanStatus>;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock services
    fileServiceMock = {
      listDir: jest.fn(),
      getSize: jest.fn(),
      getRecentModificationInDir: jest.fn(),
      delete: jest.fn(),
      isValidRootFolder: jest.fn(),
      isDangerous: jest.fn(),
      getFileStatsInDir: jest.fn(),
      stopScan: jest.fn(),
      fileWorkerService: {
        startScan: jest.fn(),
        getSize: jest.fn(),
        stopScan: jest.fn(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as unknown as any,
    };

    loggerMock = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      get: jest.fn(),
      saveToFile: jest.fn(),
      getSuggestLogFilePath: jest.fn(),
      // Private properties (for mocking purposes)
      log: [],
      rotateLogFile: jest.fn(),
      addToLog: jest.fn(),
      getTimestamp: jest.fn(() => Date.now()),
    } as unknown as jest.Mocked<LoggerService>;

    searchStatusMock = {} as jest.Mocked<ScanStatus>;

    npkill = new Npkill({
      fileService: fileServiceMock as unknown as FileService,
      logger: loggerMock,
      searchStatus: searchStatusMock,
    });
  });

  describe('constructor', () => {
    it('should use the unix file service on android (Termux)', () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', { value: 'android' });
      try {
        const androidNpkill = new Npkill();
        expect(androidNpkill['services'].fileService).toBeInstanceOf(
          UnixFilesService,
        );
      } finally {
        Object.defineProperty(process, 'platform', { value: originalPlatform });
      }
    });
  });

  describe('delete$', () => {
    const mockPath = resolve('/test/folder/node_modules');

    it.each([
      [
        'resolves with false',
        () => Promise.resolve(false),
        `Could not delete ${mockPath}`,
      ],
      [
        'rejects',
        () => Promise.reject(new Error('Permission denied')),
        'Permission denied',
      ],
    ])(
      'should report a failed result when the deletion %s',
      async (_case, deletion, message) => {
        fileServiceMock.delete.mockImplementation(deletion);

        const result = await firstValueFrom(npkill.delete$(mockPath));

        expect(result).toEqual({
          path: mockPath,
          success: false,
          error: { message },
        });
      },
    );
  });
});
