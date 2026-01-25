import { Npkill } from '@core/npkill';
import {
  CliScanFoundFolder,
  IConfig,
  ScanFoundFolder,
  ScanOptions,
  SortBy,
} from '../interfaces';
import {
  Observable,
  filter,
  firstValueFrom,
  map,
  switchMap,
  tap,
  catchError,
  of,
  timeout,
} from 'rxjs';
import { convertBytesToGb } from '../../utils/unit-conversions.js';
import { join } from 'path';
import os from 'os';

export interface CalculateFolderStatsOptions {
  getModificationTimeForSensitiveResults: boolean;
}

export class ScanService {
  constructor(private readonly npkill: Npkill) {}

  scan(config: IConfig): Observable<CliScanFoundFolder> {
    const { targets, exclude, sortBy } = config;

    const params: ScanOptions = {
      targets,
      exclude,
      performRiskAnalysis: true,
      sortBy: sortBy as SortBy,
    };

    const results$ = this.npkill.startScan$(config.folderRoot, params);
    const nonExcludedResults$ = results$.pipe(
      filter(
        (path) =>
          !this.isExcludedDangerousDirectory(
            path,
            config.excludeSensitiveResults,
          ),
      ),
    );

    return nonExcludedResults$.pipe(
      map<ScanFoundFolder, CliScanFoundFolder>(({ path, riskAnalysis }) => ({
        path,
        size: 0,
        modificationTime: -1,
        riskAnalysis,
        status: 'live',
      })),
    );
  }

  calculateFolderStats(
    nodeFolder: CliScanFoundFolder,
    options: CalculateFolderStatsOptions = {
      /** Saves resources by not scanning a result that is probably not of interest. */
      getModificationTimeForSensitiveResults: false,
    },
  ): Observable<CliScanFoundFolder> {
    return this.npkill.getSize$(nodeFolder.path).pipe(
      timeout(30000), // 30 seconds timeout
      catchError(() => {
        // If size calculation fails or times out, keep size as 0 but mark as calculated
        nodeFolder.size = 0;
        nodeFolder.modificationTime = 1; // 1 = calculated, -1 = not calculated
        return of({ size: 0, unit: 'bytes' as const });
      }),
      tap(({ size }) => {
        nodeFolder.size = convertBytesToGb(size);
      }),
      switchMap(async () => {
        if (
          nodeFolder.riskAnalysis?.isSensitive &&
          !options.getModificationTimeForSensitiveResults
        ) {
          nodeFolder.modificationTime = -1;
          return nodeFolder;
        }

        const parentFolder = join(nodeFolder.path, '../');
        const normalizedParent = parentFolder.replace(/\\/g, '/').toLowerCase();
        const normalizedHome = os.homedir().replace(/\\/g, '/').toLowerCase();

        const isDirectChildOfHome =
          normalizedHome && normalizedParent === normalizedHome;

        // If it's directly under HOME, skip modification time calculation
        if (isDirectChildOfHome) {
          nodeFolder.modificationTime = -1;
          return nodeFolder;
        }

        // For other folders, scan the parent folder for modification time
        try {
          const result = await firstValueFrom(
            this.npkill.getNewestFile$(parentFolder).pipe(
              timeout(10000), // 10 seconds timeout for modification time
              catchError(() => of(null)),
            ),
          );

          nodeFolder.modificationTime = result ? result.timestamp : 1;
          return nodeFolder;
        } catch {
          nodeFolder.modificationTime = 1;
          return nodeFolder;
        }
      }),
      catchError(() => {
        // Final fallback: mark as calculated with default values
        nodeFolder.modificationTime = 1;
        if (nodeFolder.size === undefined || nodeFolder.size === null) {
          nodeFolder.size = 0;
        }
        return of(nodeFolder);
      }),
    );
  }

  private isExcludedDangerousDirectory(
    scanResult: ScanFoundFolder,
    excludeSensitiveResults: boolean,
  ): boolean {
    return Boolean(
      excludeSensitiveResults && scanResult.riskAnalysis?.isSensitive,
    );
  }
}
