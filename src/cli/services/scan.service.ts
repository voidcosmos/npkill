import { Npkill } from '@core/npkill';
import {
  CliScanFoundFolder,
  IConfig,
  ScanFoundFolder,
  ScanOptions,
  SortBy,
} from '../interfaces';
import { filter, map, mergeMap, Observable, tap } from 'rxjs';

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
      filter((path) => !isExcludedDangerousDirectory(path)),
    );

    return nonExcludedResults$.pipe(
      map<ScanFoundFolder, CliScanFoundFolder>(({ path, riskAnalysis }) => ({
        path,
        size: 0,
        modificationTime: -1,
        riskAnalysis,
        status: 'live',
      })),
      tap((nodeFolder) => {
        this.searchStatus.newResult();
        this.resultsService.addResult(nodeFolder);

        if (this.config.sortBy === 'path') {
          this.resultsService.sortResults(this.config.sortBy);
          this.uiResults.clear();
        }

        this.uiResults.render();
      }),
      mergeMap((nodeFolder) => {
        return this.calculateFolderStats(nodeFolder);
      }),
      tap(() => this.searchStatus.completeStatCalculation()),
      tap((folder) => {
        if (this.config.deleteAll) {
          this.deleteFolder(folder);
        }
      }),
    );
  }
}
