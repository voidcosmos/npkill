import { jest } from '@jest/globals';
import { ScanService } from '../../../src/cli/services/scan.service.js';
import { Npkill, ScanFoundTarget } from '../../../src/core/index.js';
import {
  CliScanFoundTarget,
  IConfig,
} from '../../../src/cli/interfaces/index.js';
import { of, firstValueFrom, lastValueFrom, throwError, toArray } from 'rxjs';
import { convertBytesToGb } from '../../../src/utils/unit-conversions.js';
import path from 'node:path';
import { DEFAULT_PROFILE } from '../../../src/core/constants/profiles.constants.js';

describe('ScanService', () => {
  let scanService: ScanService;
  let mockNpkill: {
    startScan$: jest.Mock;
    getSize$: jest.Mock;
    getNewestFile$: jest.Mock;
  };

  // Sample data for testing
  const mockConfig: IConfig = {
    profiles: [DEFAULT_PROFILE],
    folderRoot: '/test/root',
    targets: ['node_modules'],
    exclude: ['/test/root/excluded'],
    sortBy: 'size',
    excludeSensitiveResults: false,
    disableDefaultIgnore: false,
    checkUpdates: false,
    deleteAll: false,
    sizeUnit: 'auto',
    maxSimultaneousSearch: 0,
    showErrors: false,
    dryRun: false,
    yes: false,
    jsonStream: false,
    jsonSimple: false,
    disableSize: false,
    disableAge: false,
    disableStats: false,
    olderThan: 0,
  };

  const mockScanFoundTarget: ScanFoundTarget = {
    path: '/test/root/project/node_modules',
    riskAnalysis: {
      isSensitive: false,
    },
  };

  const mockSensitiveScanFoundTarget: ScanFoundTarget = {
    path: '/test/root/.hidden/node_modules',
    riskAnalysis: {
      isSensitive: true,
    },
  };

  const mockCliScanFoundTarget: CliScanFoundTarget = {
    path: '/test/root/project/node_modules',
    size: 0,
    modificationTime: -1,
    riskAnalysis: mockScanFoundTarget.riskAnalysis,
    status: 'live',
  };

  beforeEach(() => {
    mockNpkill = {
      startScan$: jest.fn(),
      getSize$: jest.fn(),
      getNewestFile$: jest.fn(),
    };

    scanService = new ScanService(mockNpkill as unknown as Npkill);
  });

  describe('scan', () => {
    it('should call npkill.startScan$ with the correct parameters', () => {
      mockNpkill.startScan$.mockReturnValue(of(mockScanFoundTarget));

      scanService.scan(mockConfig);

      expect(mockNpkill.startScan$).toHaveBeenCalledWith(
        mockConfig.folderRoot,
        {
          targets: mockConfig.targets,
          exclude: mockConfig.exclude,
          useDefaultIgnore: true,
          performRiskAnalysis: true,
        },
      );
    });

    it('should look inside the skipped folders with --no-ignore-default', () => {
      mockNpkill.startScan$.mockReturnValue(of(mockScanFoundTarget));

      scanService.scan({ ...mockConfig, disableDefaultIgnore: true });

      expect(mockNpkill.startScan$).toHaveBeenCalledWith(
        mockConfig.folderRoot,
        expect.objectContaining({ useDefaultIgnore: false }),
      );
    });

    it('should emit a CliScanFoundTarget for each non-sensitive result', async () => {
      mockNpkill.startScan$.mockReturnValue(of(mockScanFoundTarget));

      const result$ = scanService.scan(mockConfig);
      const emittedValue = await firstValueFrom(result$);

      expect(emittedValue).toEqual({
        path: mockScanFoundTarget.path,
        size: 0,
        modificationTime: -1,
        riskAnalysis: mockScanFoundTarget.riskAnalysis,
        status: 'live',
      });
    });

    it.each([
      [true, [mockScanFoundTarget.path]],
      [false, [mockScanFoundTarget.path, mockSensitiveScanFoundTarget.path]],
    ])(
      'should keep the right results when excludeSensitiveResults is %s',
      async (excludeSensitiveResults, expectedPaths) => {
        mockNpkill.startScan$.mockReturnValue(
          of(mockScanFoundTarget, mockSensitiveScanFoundTarget),
        );

        const results = await lastValueFrom(
          scanService
            .scan({ ...mockConfig, excludeSensitiveResults })
            .pipe(toArray()),
        );

        expect(results.map(({ path }) => path)).toEqual(expectedPaths);
      },
    );
  });

  describe('calculateResultStats', () => {
    it('should calculate size and get modification time for a non-sensitive folder', async () => {
      const mockSize = 1024 * 1024 * 500; // 500 MB
      const newestFile = { path: 'index.js', timestamp: 1672531200000 }; // Jan 1, 2023

      mockNpkill.getSize$.mockReturnValue(of({ size: mockSize }));
      mockNpkill.getNewestFile$.mockReturnValue(of(newestFile));

      const result$ = scanService.calculateResultStats(mockCliScanFoundTarget);
      const result = await firstValueFrom(result$);

      expect(mockNpkill.getSize$).toHaveBeenCalledWith(
        mockCliScanFoundTarget.path,
      );
      expect(mockNpkill.getNewestFile$).toHaveBeenCalledWith(
        path.normalize('/test/root/project/'), // parent folder
      );
      expect(result.size).toBe(convertBytesToGb(mockSize));
      expect(result.modificationTime).toBe(newestFile.timestamp);
    });

    it('should NOT get modification time for a sensitive folder', async () => {
      const sensitiveCliResult: CliScanFoundTarget = {
        ...mockCliScanFoundTarget,
        riskAnalysis: {
          isSensitive: true,
        },
      };
      const mockSize = 1024 * 1024 * 200; // 200 MB

      mockNpkill.getSize$.mockReturnValue(of({ size: mockSize }));

      const result$ = scanService.calculateResultStats(sensitiveCliResult);
      const result = await firstValueFrom(result$);

      expect(mockNpkill.getSize$).toHaveBeenCalledWith(sensitiveCliResult.path);
      // Should not attempt to get the newest file for sensitive results
      expect(mockNpkill.getNewestFile$).not.toHaveBeenCalled();
      expect(result.size).toBe(convertBytesToGb(mockSize));
      expect(result.modificationTime).toBe(-1);
    });

    it('should handle the case where getNewestFile$ emits null', async () => {
      const mockSize = 1024 * 1024 * 100; // 100 MB

      mockNpkill.getSize$.mockReturnValue(of({ size: mockSize }));
      mockNpkill.getNewestFile$.mockReturnValue(of(null)); // Simulate no file found

      const result$ = scanService.calculateResultStats(mockCliScanFoundTarget);
      const result = await firstValueFrom(result$);

      expect(result.size).toBe(convertBytesToGb(mockSize));
      expect(result.modificationTime).toBe(1);
    });

    it('should handle errors in getSize$ and set size to 0', async () => {
      mockNpkill.getSize$.mockReturnValue(
        throwError(() => new Error('Permission denied')),
      );
      mockNpkill.getNewestFile$.mockReturnValue(of(null));

      const result$ = scanService.calculateResultStats(mockCliScanFoundTarget);
      const result = await firstValueFrom(result$);

      expect(result.size).toBe(0);
      expect(result.modificationTime).toBe(1);
    });

    it('should handle errors in getNewestFile$ and set modificationTime to 1', async () => {
      const mockSize = 1024 * 1024 * 100; // 100 MB

      mockNpkill.getSize$.mockReturnValue(of({ size: mockSize }));
      mockNpkill.getNewestFile$.mockReturnValue(
        throwError(() => new Error('Permission denied')),
      );

      const result$ = scanService.calculateResultStats(mockCliScanFoundTarget);
      const result = await firstValueFrom(result$);

      expect(result.size).toBe(convertBytesToGb(mockSize));
      expect(result.modificationTime).toBe(1);
    });
  });
});
