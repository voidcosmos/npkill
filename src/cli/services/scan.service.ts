import { Npkill } from '../../core/npkill.js';
import {
  CliScanFoundTarget,
  IConfig,
  ScanFoundTarget,
  ScanOptions,
} from '../interfaces/index.js';
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

export interface CalculateResultStatsOptions {
  getModificationTimeForSensitiveResults?: boolean;
  disableSize?: boolean;
  disableAge?: boolean;
}

export class ScanService {
  constructor(private readonly npkill: Npkill) {}

  scan(config: IConfig): Observable<CliScanFoundTarget> {
    const { targets, exclude } = config;

    const params: ScanOptions = {
      targets,
      exclude,
      performRiskAnalysis: true,
    };

    const results$ = this.npkill.startScan$(config.folderRoot, params);
    const nonExcludedResults$ = results$.pipe(
      filter(
        (path) =>
          !this.isExcludedDangerousResult(path, config.excludeSensitiveResults),
      ),
    );

    return nonExcludedResults$.pipe(
      map<ScanFoundTarget, CliScanFoundTarget>(({ path, riskAnalysis }) => ({
        path,
        size: 0,
        modificationTime: -1,
        riskAnalysis,
        status: 'live',
      })),
    );
  }

  calculateResultStats(
    result: CliScanFoundTarget,
    options: CalculateResultStatsOptions = {
      /** Saves resources by not scanning a result that is probably not of interest. */
      getModificationTimeForSensitiveResults: false,
    },
  ): Observable<CliScanFoundTarget> {
    const size$ = options.disableSize
      ? of({ size: 0 })
      : this.npkill.getSize$(result.path).pipe(
          timeout(30000), // 30 seconds timeout
          catchError(() => {
            // If size calculation fails or times out, keep size as 0 but mark as calculated
            result.size = 0;
            result.modificationTime = 1; // 1 = calculated, -1 = not calculated
            return of({ size: 0 });
          }),
          tap(({ size }) => {
            result.size = convertBytesToGb(size);
          }),
        );

    return size$.pipe(
      switchMap(async () => {
        if (options.disableAge) {
          result.modificationTime = -1;
          return result;
        }

        if (
          result.riskAnalysis?.isSensitive &&
          !options.getModificationTimeForSensitiveResults
        ) {
          result.modificationTime = -1;
          return result;
        }

        const parentFolder = join(result.path, '../');
        const normalizedParent = parentFolder.replace(/\\/g, '/').toLowerCase();
        const normalizedHome = os.homedir().replace(/\\/g, '/').toLowerCase();

        const isDirectChildOfHome =
          normalizedHome && normalizedParent === normalizedHome;

        // If it's directly under HOME, skip modification time calculation
        if (isDirectChildOfHome) {
          result.modificationTime = -1;
          return result;
        }

        // For other folders, scan the parent folder for modification time
        try {
          const newestFile = await firstValueFrom(
            this.npkill.getNewestFile$(parentFolder).pipe(
              timeout(10000), // 10 seconds timeout for modification time
              catchError(() => of(null)),
            ),
          );

          result.modificationTime = newestFile ? newestFile.timestamp : 1;
          return result;
        } catch {
          result.modificationTime = 1;
          return result;
        }
      }),
      catchError(() => {
        // Final fallback: mark as calculated with default values
        result.modificationTime = 1;
        if (result.size === undefined || result.size === null) {
          result.size = 0;
        }
        return of(result);
      }),
    );
  }

  private isExcludedDangerousResult(
    scanResult: ScanFoundTarget,
    excludeSensitiveResults: boolean,
  ): boolean {
    return Boolean(
      excludeSensitiveResults && scanResult.riskAnalysis?.isSensitive,
    );
  }
}
