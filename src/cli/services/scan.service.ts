import { Npkill } from '@core/npkill';
import {
  CliScanFoundFolder,
  IConfig,
  ScanFoundFolder,
  ScanOptions,
  SortBy,
} from '../interfaces';
import { Observable, filter, firstValueFrom, map, switchMap, tap } from 'rxjs';
import { convertBytesToGb } from '../../utils/unit-conversions.js';
import { join } from 'path';

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
  ): Observable<CliScanFoundFolder> {
    return this.npkill.getSize$(nodeFolder.path).pipe(
      tap(({ size }) => {
        nodeFolder.size = convertBytesToGb(size);
      }),
      switchMap(async () => {
        // Saves resources by not scanning a result that is probably not of interest
        if (nodeFolder.riskAnalysis?.isSensitive) {
          nodeFolder.modificationTime = -1;
          return nodeFolder;
        }
        const parentFolder = join(nodeFolder.path, '../');
        const result = await firstValueFrom(
          this.npkill.getNewestFile$(parentFolder),
        );

        nodeFolder.modificationTime = result ? result.timestamp : -1;
        return nodeFolder;
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
