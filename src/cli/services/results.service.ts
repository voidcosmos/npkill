import {
  CliScanFoundFolder,
  IStats,
  IResultTypeCount,
} from '../interfaces/index.js';
import { FOLDER_SORT } from '../../constants/sort.result.js';
import { formatSize } from '../../utils/unit-conversions.js';
import path from 'path';

export class ResultsService {
  results: CliScanFoundFolder[] = [];
  private sizeUnit: 'auto' | 'mb' | 'gb' = 'auto';

  addResult(result: CliScanFoundFolder): void {
    this.results = [...this.results, result];
  }

  sortResults(method: string): void {
    this.results = this.results.sort(FOLDER_SORT[method]);
  }

  reset(): void {
    this.results = [];
  }

  setSizeUnit(sizeUnit: 'auto' | 'mb' | 'gb'): void {
    this.sizeUnit = sizeUnit;
  }

  getStats(): IStats {
    let spaceReleased = 0;
    const typeCounts = new Map<string, number>();

    const totalSpace = this.results.reduce((total, folder) => {
      if (folder.status === 'deleted') {
        spaceReleased += folder.size;
      }

      const folderType = path.basename(folder.path);
      typeCounts.set(folderType, (typeCounts.get(folderType) || 0) + 1);

      return total + folder.size;
    }, 0);

    const formattedTotal = formatSize(totalSpace, this.sizeUnit);
    const formattedReleased = formatSize(spaceReleased, this.sizeUnit);

    const resultsTypesCount: IResultTypeCount[] = Array.from(
      typeCounts.entries(),
    )
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);

    return {
      spaceReleased: formattedReleased.text,
      totalSpace: formattedTotal.text,
      resultsTypesCount,
    };
  }
}
