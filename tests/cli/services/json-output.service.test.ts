import { jest } from '@jest/globals';
import { JsonOutputService } from '../../../src/cli/services/json-output.service.js';
import { CliScanFoundTarget } from '../../../src/cli/interfaces/stats.interface.js';

const makeResult = (
  overrides: Partial<CliScanFoundTarget> = {},
): CliScanFoundTarget => ({
  path: '/test/node_modules',
  size: 1,
  modificationTime: 1640995200000,
  status: 'live',
  ...overrides,
});

describe('JsonOutputService', () => {
  let jsonOutputService: JsonOutputService;
  let mockStdout: any;
  let mockStderr: any;

  const firstWrittenJson = (stream: { write: jest.Mock }) =>
    JSON.parse(stream.write.mock.calls[0][0] as string);

  beforeEach(() => {
    mockStdout = {
      write: jest.fn(),
    };
    mockStderr = {
      write: jest.fn(),
    };
    jsonOutputService = new JsonOutputService(mockStdout, mockStderr);
  });

  describe('processResult in stream mode', () => {
    it('should write stream result in correct format', () => {
      jsonOutputService.initializeSession(true);
      jsonOutputService.processResult(
        makeResult({
          size: 1024,
          riskAnalysis: {
            isSensitive: false,
          },
        }),
      );

      expect(mockStdout.write).toHaveBeenCalledTimes(1);
      expect(firstWrittenJson(mockStdout)).toMatchObject({
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

    it.each([-1, 1])(
      'should output an unknown modification time (%p) as null',
      (unknownModificationTime) => {
        jsonOutputService.initializeSession(true);
        jsonOutputService.processResult(
          makeResult({ modificationTime: unknownModificationTime }),
        );

        expect(firstWrittenJson(mockStdout).result.modificationTime).toBeNull();
      },
    );

    it('should output the size as null when it is not calculated', () => {
      jsonOutputService.initializeSession(true, false);
      jsonOutputService.processResult(makeResult({ size: 0 }));

      expect(firstWrittenJson(mockStdout).result.size).toBeNull();
    });

    it('should include the deletion when the result was deleted', () => {
      jsonOutputService.initializeSession(true);
      jsonOutputService.processResult(makeResult(), {
        path: '/test/node_modules',
        success: false,
        error: { message: 'Permission denied' },
      });

      expect(firstWrittenJson(mockStdout).result.deletion).toEqual({
        success: false,
        error: 'Permission denied',
      });
    });

    it('should not include a deletion when nothing was deleted', () => {
      jsonOutputService.initializeSession(true);
      jsonOutputService.processResult(makeResult());

      expect(firstWrittenJson(mockStdout).result).not.toHaveProperty(
        'deletion',
      );
    });
  });

  describe.each<'completeScan' | 'handleShutdown'>([
    'completeScan',
    'handleShutdown',
  ])('%s', (finishMethod) => {
    it('should collect results and output them in simple format', () => {
      jsonOutputService.initializeSession(false);
      jsonOutputService.processResult(
        makeResult({ size: 1024, modificationTime: 1640995200000 }),
      );
      jsonOutputService.processResult(
        makeResult({
          path: '/test2/node_modules',
          size: 2048,
          modificationTime: 1640995300000,
          status: 'deleted',
        }),
      );

      expect(jsonOutputService.getResultsCount()).toBe(2);

      jsonOutputService[finishMethod]();

      expect(mockStdout.write).toHaveBeenCalledTimes(1);
      expect(firstWrittenJson(mockStdout)).toMatchObject({
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
      jsonOutputService[finishMethod]();

      expect(mockStdout.write).toHaveBeenCalledTimes(1);
      expect(firstWrittenJson(mockStdout)).toMatchObject({
        version: 1,
        results: [],
        meta: { resultsCount: 0 },
      });
    });

    it('should not output anything in stream mode', () => {
      jsonOutputService.initializeSession(true);
      jsonOutputService.processResult(makeResult({ size: 1024 }));
      mockStdout.write.mockClear();

      jsonOutputService[finishMethod]();

      expect(mockStdout.write).not.toHaveBeenCalled();
    });
  });

  describe('writeError', () => {
    it.each([
      ['an Error object', new Error('Test error message')],
      ['a string', 'Test error message'],
    ])('should write the error in correct format given %s', (_, error) => {
      const before = Date.now();
      jsonOutputService.writeError(error);
      const after = Date.now();

      expect(mockStderr.write).toHaveBeenCalledTimes(1);
      const { timestamp, ...output } = firstWrittenJson(mockStderr);
      expect(output).toEqual({
        version: 1,
        error: true,
        message: 'Test error message',
      });
      expect(timestamp).toBeGreaterThanOrEqual(before);
      expect(timestamp).toBeLessThanOrEqual(after);
    });
  });
});
