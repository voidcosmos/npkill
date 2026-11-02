import { jest } from '@jest/globals';
import { JsonOutputService } from '../../../src/cli/services/json-output.service.js';
import { CliScanFoundTarget } from '../../../src/cli/interfaces/stats.interface.js';

describe('JsonOutputService', () => {
  let jsonOutputService: JsonOutputService;
  let mockStdout: any;
  let mockStderr: any;

  beforeEach(() => {
    mockStdout = {
      write: jest.fn(),
    };
    mockStderr = {
      write: jest.fn(),
    };
    jsonOutputService = new JsonOutputService(mockStdout, mockStderr);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initializeSession', () => {
    it('should initialize session correctly', () => {
      jsonOutputService.initializeSession();
      expect(jsonOutputService.getResultsCount()).toBe(0);
    });
  });

  describe('processResult in stream mode', () => {
    it('should write stream result in correct format', () => {
      const mockResult: CliScanFoundTarget = {
        path: '/test/node_modules',
        size: 1024,
        modificationTime: 1640995200000,
        status: 'live',
        riskAnalysis: {
          isSensitive: false,
        },
      };

      jsonOutputService.initializeSession(true); // stream mode
      jsonOutputService.processResult(mockResult);

      expect(mockStdout.write).toHaveBeenCalledTimes(1);
      const writtenData = mockStdout.write.mock.calls[0][0];
      const parsedData = JSON.parse(writtenData.trim());

      expect(parsedData).toMatchObject({
        version: 1,
        result: {
          path: '/test/node_modules',
          size: 1099511627776,
          modificationTime: 1640995200000,
          riskAnalysis: {
            isSensitive: false,
          },
        },
      });
    });
  });

  describe('processResult and completeScan in simple mode', () => {
    it('should collect results and output them in simple format', () => {
      const mockResult1: CliScanFoundTarget = {
        path: '/test/node_modules',
        size: 1024,
        modificationTime: 1640995200000,
        status: 'live',
      };

      const mockResult2: CliScanFoundTarget = {
        path: '/test2/node_modules',
        size: 2048,
        modificationTime: 1640995300000,
        status: 'deleted',
      };

      jsonOutputService.initializeSession(false); // simple mode
      jsonOutputService.processResult(mockResult1);
      jsonOutputService.processResult(mockResult2);

      expect(jsonOutputService.getResultsCount()).toBe(2);

      jsonOutputService.completeScan();

      expect(mockStdout.write).toHaveBeenCalledTimes(1);
      const writtenData = mockStdout.write.mock.calls[0][0];
      const parsedData = JSON.parse(writtenData.trim());

      expect(parsedData).toMatchObject({
        version: 1,
        results: [
          {
            path: '/test/node_modules',
            size: 1099511627776,
            modificationTime: 1640995200000,
          },
          {
            path: '/test2/node_modules',
            size: 2199023255552,
            modificationTime: 1640995300000,
          },
        ],
        meta: {
          resultsCount: 2,
          runDuration: expect.any(Number),
        },
      });
    });

    it('should output an empty result list when nothing was found', () => {
      jsonOutputService.initializeSession(false);
      jsonOutputService.completeScan();

      expect(mockStdout.write).toHaveBeenCalledTimes(1);
      const parsedData = JSON.parse(mockStdout.write.mock.calls[0][0]);
      expect(parsedData).toMatchObject({
        version: 1,
        results: [],
        meta: { resultsCount: 0 },
      });
    });

    it.each([-1, 1])(
      'should output an unknown modification time (%p) as null',
      (unknownModificationTime) => {
        jsonOutputService.initializeSession(true);
        jsonOutputService.processResult({
          path: '/test/node_modules',
          size: 1,
          modificationTime: unknownModificationTime,
          status: 'live',
        });

        const parsedData = JSON.parse(mockStdout.write.mock.calls[0][0]);
        expect(parsedData.result.modificationTime).toBeNull();
      },
    );

    it('should include the deletion when the result was deleted', () => {
      jsonOutputService.initializeSession(true);
      jsonOutputService.processResult(
        {
          path: '/test/node_modules',
          size: 1,
          modificationTime: 1640995200000,
          status: 'live',
        },
        {
          path: '/test/node_modules',
          success: false,
          error: { message: 'Permission denied' },
        },
      );

      const parsedData = JSON.parse(mockStdout.write.mock.calls[0][0]);
      expect(parsedData.result.deletion).toEqual({
        success: false,
        error: 'Permission denied',
      });
    });

    it('should not include a deletion when nothing was deleted', () => {
      jsonOutputService.initializeSession(true);
      jsonOutputService.processResult({
        path: '/test/node_modules',
        size: 1,
        modificationTime: 1640995200000,
        status: 'live',
      });

      const parsedData = JSON.parse(mockStdout.write.mock.calls[0][0]);
      expect(parsedData.result).not.toHaveProperty('deletion');
    });

    it('should not output anything on completeScan in stream mode', () => {
      const mockResult: CliScanFoundTarget = {
        path: '/test/node_modules',
        size: 1024,
        modificationTime: 1640995200000,
        status: 'live',
      };

      jsonOutputService.initializeSession(true); // stream mode
      jsonOutputService.processResult(mockResult);
      mockStdout.write.mockClear();

      jsonOutputService.completeScan();

      expect(mockStdout.write).not.toHaveBeenCalled();
    });
  });

  describe('writeError', () => {
    it('should write error in correct format when given Error object', () => {
      const error = new Error('Test error message');
      jsonOutputService.writeError(error);

      expect(mockStderr.write).toHaveBeenCalledTimes(1);
      const writtenData = mockStderr.write.mock.calls[0][0];
      const parsedData = JSON.parse(writtenData.trim());

      expect(parsedData).toMatchObject({
        version: 1,
        error: true,
        message: 'Test error message',
        timestamp: expect.any(Number),
      });
    });

    it('should use the current time in milliseconds as timestamp', () => {
      const before = Date.now();
      jsonOutputService.writeError('Some error');
      const after = Date.now();

      const { timestamp } = JSON.parse(mockStderr.write.mock.calls[0][0]);
      expect(timestamp).toBeGreaterThanOrEqual(before);
      expect(timestamp).toBeLessThanOrEqual(after);
    });

    it('should write error in correct format when given string', () => {
      const error = 'String error message';
      jsonOutputService.writeError(error);

      expect(mockStderr.write).toHaveBeenCalledTimes(1);
      const writtenData = mockStderr.write.mock.calls[0][0];
      const parsedData = JSON.parse(writtenData.trim());

      expect(parsedData).toMatchObject({
        version: 1,
        error: true,
        message: 'String error message',
        timestamp: expect.any(Number),
      });
    });
  });

  describe('handleShutdown', () => {
    it('should output collected results when shutdown is called in simple mode', () => {
      const mockResult: CliScanFoundTarget = {
        path: '/test/node_modules',
        size: 1024,
        modificationTime: 1640995200000,
        status: 'live',
      };

      jsonOutputService.initializeSession(false); // simple mode
      jsonOutputService.processResult(mockResult);
      jsonOutputService.handleShutdown();

      expect(mockStdout.write).toHaveBeenCalledTimes(1);
      const writtenData = mockStdout.write.mock.calls[0][0];
      const parsedData = JSON.parse(writtenData.trim());

      expect(parsedData.results).toHaveLength(1);
      expect(parsedData.results[0].path).toBe('/test/node_modules');
    });

    it('should output an empty result list when no results collected', () => {
      jsonOutputService.initializeSession(false); // simple mode
      jsonOutputService.handleShutdown();

      expect(mockStdout.write).toHaveBeenCalledTimes(1);
      const parsedData = JSON.parse(mockStdout.write.mock.calls[0][0]);
      expect(parsedData.results).toEqual([]);
    });

    it('should not output anything in stream mode', () => {
      const mockResult: CliScanFoundTarget = {
        path: '/test/node_modules',
        size: 1024,
        modificationTime: 1640995200000,
        status: 'live',
      };

      jsonOutputService.initializeSession(true); // stream mode
      jsonOutputService.processResult(mockResult); // This writes to stdout
      mockStdout.write.mockClear(); // Clear the call from processResult

      jsonOutputService.handleShutdown();

      expect(mockStdout.write).not.toHaveBeenCalled();
    });
  });
});
