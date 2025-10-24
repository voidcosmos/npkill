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
            config.excludeHiddenDirectories,
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

        // Determine the folder to scan for modification time
        // For folders directly under HOME (like ~/.npm, ~/.cache), scan the folder itself
        // Otherwise, scan the parent folder.
        const home =
          process.env.HOME ?? process.env.USERPROFILE ?? os.homedir() ?? '';
        const parentFolder = join(nodeFolder.path, '../');
        const normalizedParent = parentFolder.replace(/\\/g, '/').toLowerCase();
        const normalizedHome = home
          ? home.replace(/\\/g, '/').toLowerCase()
          : '';

        // Check if parent is HOME directory
        const isDirectChildOfHome =
          normalizedHome && normalizedParent === normalizedHome;

        // If it's a direct child of HOME, scan the target folder itself
        // Otherwise scan the parent folder (default behavior)
        const folderToScan = isDirectChildOfHome
          ? nodeFolder.path
          : parentFolder;

        try {
          const result = await firstValueFrom(
            this.npkill.getNewestFile$(folderToScan).pipe(
              timeout(20000), // 20 seconds timeout for modification time
              catchError(() => of(null)), // On error, return null
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
    excludeHiddenDirectories: boolean,
  ): boolean {
    return Boolean(
      excludeHiddenDirectories && scanResult.riskAnalysis?.isSensitive,
    );
  }
}
