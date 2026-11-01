import { Npkill } from '@core/npkill';
import {
  CliScanFoundTarget,
  IConfig,
  ScanFoundTarget,
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

export interface CalculateResultStatsOptions {
  getModificationTimeForSensitiveResults?: boolean;
  disableSize?: boolean;
  disableAge?: boolean;
}

export class ScanService {
  constructor(private readonly npkill: Npkill) {}

  scan(config: IConfig): Observable<CliScanFoundTarget> {
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
    target: CliScanFoundTarget,
    options: CalculateResultStatsOptions = {
      /** Saves resources by not scanning a result that is probably not of interest. */
      getModificationTimeForSensitiveResults: false,
    },
  ): Observable<CliScanFoundTarget> {
    const size$ = options.disableSize
      ? of({ size: 0, unit: 'bytes' as const })
      : this.npkill.getSize$(target.path).pipe(
          timeout(30000), // 30 seconds timeout
          catchError(() => {
            // If size calculation fails or times out, keep size as 0 but mark as calculated
            target.size = 0;
            target.modificationTime = 1; // 1 = calculated, -1 = not calculated
            return of({ size: 0, unit: 'bytes' as const });
          }),
          tap(({ size }) => {
            target.size = convertBytesToGb(size);
          }),
        );

    return size$.pipe(
      switchMap(async () => {
        if (options.disableAge) {
          target.modificationTime = -1;
          return target;
        }

        if (
          target.riskAnalysis?.isSensitive &&
          !options.getModificationTimeForSensitiveResults
        ) {
          target.modificationTime = -1;
          return target;
        }

        const parentFolder = join(target.path, '../');
        const normalizedParent = parentFolder.replace(/\\/g, '/').toLowerCase();
        const normalizedHome = os.homedir().replace(/\\/g, '/').toLowerCase();

        const isDirectChildOfHome =
          normalizedHome && normalizedParent === normalizedHome;

        // If it's directly under HOME, skip modification time calculation
        if (isDirectChildOfHome) {
          target.modificationTime = -1;
          return target;
        }

        // For other folders, scan the parent folder for modification time
        try {
          const result = await firstValueFrom(
            this.npkill.getNewestFile$(parentFolder).pipe(
              timeout(10000), // 10 seconds timeout for modification time
              catchError(() => of(null)),
            ),
          );

          target.modificationTime = result ? result.timestamp : 1;
          return target;
        } catch {
          target.modificationTime = 1;
          return target;
        }
      }),
      catchError(() => {
        // Final fallback: mark as calculated with default values
        target.modificationTime = 1;
        if (target.size === undefined || target.size === null) {
          target.size = 0;
        }
        return of(target);
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
