import { jest } from '@jest/globals';
import { JsonOutputService } from '../../../src/cli/services/json-output.service.js';
import { CliScanFoundFolder } from '../../../src/cli/interfaces/stats.interface.js';

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
      const mockFolder: CliScanFoundFolder = {
        path: '/test/node_modules',
        size: 1024,
        modificationTime: 1640995200000,
        status: 'live',
        riskAnalysis: {
          isSensitive: false,
        },
      };

      jsonOutputService.initializeSession(true); // stream mode
      jsonOutputService.processResult(mockFolder);

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
      const mockFolder1: CliScanFoundFolder = {
        path: '/test/node_modules',
        size: 1024,
        modificationTime: 1640995200000,
        status: 'live',
      };

      const mockFolder2: CliScanFoundFolder = {
        path: '/test2/node_modules',
        size: 2048,
        modificationTime: 1640995300000,
        status: 'deleted',
      };

      jsonOutputService.initializeSession(false); // simple mode
      jsonOutputService.processResult(mockFolder1);
      jsonOutputService.processResult(mockFolder2);

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

    it('should not output anything on completeScan in stream mode', () => {
      const mockFolder: CliScanFoundFolder = {
        path: '/test/node_modules',
        size: 1024,
        modificationTime: 1640995200000,
        status: 'live',
      };

      jsonOutputService.initializeSession(true); // stream mode
      jsonOutputService.processResult(mockFolder);
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
      const mockFolder: CliScanFoundFolder = {
        path: '/test/node_modules',
        size: 1024,
        modificationTime: 1640995200000,
        status: 'live',
      };

      jsonOutputService.initializeSession(false); // simple mode
      jsonOutputService.processResult(mockFolder);
      jsonOutputService.handleShutdown();

      expect(mockStdout.write).toHaveBeenCalledTimes(1);
      const writtenData = mockStdout.write.mock.calls[0][0];
      const parsedData = JSON.parse(writtenData.trim());

      expect(parsedData.results).toHaveLength(1);
      expect(parsedData.results[0].path).toBe('/test/node_modules');
    });

    it('should not output anything when no results collected', () => {
      jsonOutputService.initializeSession(false); // simple mode
      jsonOutputService.handleShutdown();

      expect(mockStdout.write).not.toHaveBeenCalled();
    });

    it('should not output anything in stream mode', () => {
      const mockFolder: CliScanFoundFolder = {
        path: '/test/node_modules',
        size: 1024,
        modificationTime: 1640995200000,
        status: 'live',
      };

      jsonOutputService.initializeSession(true); // stream mode
      jsonOutputService.processResult(mockFolder); // This writes to stdout
      mockStdout.write.mockClear(); // Clear the call from processResult

      jsonOutputService.handleShutdown();

      expect(mockStdout.write).not.toHaveBeenCalled();
    });
  });
});
