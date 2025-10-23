import { jest } from '@jest/globals';
import { ScanService } from '../../../src/cli/services/scan.service.js';
import { Npkill, ScanFoundFolder, SortBy } from '../../../src/core/index.js';
import {
  CliScanFoundFolder,
  IConfig,
} from '../../../src/cli/interfaces/index.js';
import { of, firstValueFrom } from 'rxjs';
import { convertBytesToGb } from '../../../src/utils/unit-conversions.js';
import path from 'node:path';
import { DEFAULT_PROFILE } from '../../../src/constants/profiles.constants.js';

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
    excludeHiddenDirectories: false,
    warningColor: '',
    checkUpdates: false,
    deleteAll: false,
    sizeUnit: 'auto',
    maxSimultaneousSearch: 0,
    showErrors: false,
    dryRun: false,
    yes: false,
    jsonStream: false,
    jsonSimple: false,
  };

  const mockScanFoundFolder: ScanFoundFolder = {
    path: '/test/root/project/node_modules',
    riskAnalysis: {
      isSensitive: false,
    },
  };

  const mockSensitiveScanFoundFolder: ScanFoundFolder = {
    path: '/test/root/.hidden/node_modules',
    riskAnalysis: {
      isSensitive: true,
    },
  };

  const mockCliScanFoundFolder: CliScanFoundFolder = {
    path: '/test/root/project/node_modules',
    size: 0,
    modificationTime: -1,
    riskAnalysis: mockScanFoundFolder.riskAnalysis,
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

  it('should be created', () => {
    expect(scanService).toBeTruthy();
  });

  describe('scan', () => {
    it('should call npkill.startScan$ with the correct parameters', () => {
      mockNpkill.startScan$.mockReturnValue(of(mockScanFoundFolder));

      scanService.scan(mockConfig);

      expect(mockNpkill.startScan$).toHaveBeenCalledWith(
        mockConfig.folderRoot,
        {
          targets: mockConfig.targets,
          exclude: mockConfig.exclude,
          performRiskAnalysis: true,
          sortBy: mockConfig.sortBy as SortBy,
        },
      );
    });

    it('should emit a CliScanFoundFolder for each non-sensitive result', async () => {
      mockNpkill.startScan$.mockReturnValue(of(mockScanFoundFolder));

      const result$ = scanService.scan(mockConfig);
      const emittedValue = await firstValueFrom(result$);

      expect(emittedValue).toEqual({
        path: mockScanFoundFolder.path,
        size: 0,
        modificationTime: -1,
        riskAnalysis: mockScanFoundFolder.riskAnalysis,
        status: 'live',
      });
    });

    it('should filter out sensitive directories if excludeHiddenDirectories is true', (done) => {
      const configWithExclusion: IConfig = {
        ...mockConfig,
        excludeHiddenDirectories: true,
      };
      mockNpkill.startScan$.mockReturnValue(
        of(mockScanFoundFolder, mockSensitiveScanFoundFolder),
      );

      const results: CliScanFoundFolder[] = [];
      scanService.scan(configWithExclusion).subscribe({
        next: (value) => results.push(value),
        complete: () => {
          expect(results.length).toBe(1);
          expect(results[0].path).toBe(mockScanFoundFolder.path);
          done();
        },
      });
    });

    it('should NOT filter out sensitive directories if excludeHiddenDirectories is false', (done) => {
      mockNpkill.startScan$.mockReturnValue(
        of(mockScanFoundFolder, mockSensitiveScanFoundFolder),
      );

      const results: CliScanFoundFolder[] = [];
      scanService.scan(mockConfig).subscribe({
        next: (value) => results.push(value),
        complete: () => {
          expect(results.length).toBe(2);
          expect(results[0].path).toBe(mockScanFoundFolder.path);
          expect(results[1].path).toBe(mockSensitiveScanFoundFolder.path);
          done();
        },
      });
    });
  });

  describe('calculateFolderStats', () => {
    it('should calculate size and get modification time for a non-sensitive folder', async () => {
      const folderSize = 1024 * 1024 * 500; // 500 MB
      const newestFile = { path: 'index.js', timestamp: 1672531200000 }; // Jan 1, 2023

      mockNpkill.getSize$.mockReturnValue(of({ size: folderSize }));
      mockNpkill.getNewestFile$.mockReturnValue(of(newestFile));

      const result$ = scanService.calculateFolderStats(mockCliScanFoundFolder);
      const result = await firstValueFrom(result$);

      expect(mockNpkill.getSize$).toHaveBeenCalledWith(
        mockCliScanFoundFolder.path,
      );
      expect(mockNpkill.getNewestFile$).toHaveBeenCalledWith(
        path.normalize('/test/root/project/'), // parent folder
      );
      expect(result.size).toBe(convertBytesToGb(folderSize));
      expect(result.modificationTime).toBe(newestFile.timestamp);
    });

    it('should NOT get modification time for a sensitive folder', async () => {
      const sensitiveCliFolder: CliScanFoundFolder = {
        ...mockCliScanFoundFolder,
        riskAnalysis: {
          isSensitive: true,
        },
      };
      const folderSize = 1024 * 1024 * 200; // 200 MB

      mockNpkill.getSize$.mockReturnValue(of({ size: folderSize }));

      const result$ = scanService.calculateFolderStats(sensitiveCliFolder);
      const result = await firstValueFrom(result$);

      expect(mockNpkill.getSize$).toHaveBeenCalledWith(sensitiveCliFolder.path);
      // Should not attempt to get the newest file for sensitive folders
      expect(mockNpkill.getNewestFile$).not.toHaveBeenCalled();
      expect(result.size).toBe(convertBytesToGb(folderSize));
      expect(result.modificationTime).toBe(-1);
    });

    it('should handle the case where getNewestFile$ emits null', async () => {
      const folderSize = 1024 * 1024 * 100; // 100 MB

      mockNpkill.getSize$.mockReturnValue(of({ size: folderSize }));
      mockNpkill.getNewestFile$.mockReturnValue(of(null)); // Simulate no file found

      const result$ = scanService.calculateFolderStats(mockCliScanFoundFolder);
      const result = await firstValueFrom(result$);

      expect(result.size).toBe(convertBytesToGb(folderSize));
      expect(result.modificationTime).toBe(-1);
    });
  });
});
