import {
  CliScanFoundTarget,
  IStats,
  IResultTypeCount,
} from '../interfaces/index.js';
import { RESULT_SORT } from '../../constants/sort.result.js';
import { formatSize } from '../../utils/unit-conversions.js';
import path from 'path';

export class ResultsService {
  results: CliScanFoundTarget[] = [];
  private sizeUnit: 'auto' | 'mb' | 'gb' = 'auto';

  addResult(result: CliScanFoundTarget): void {
    this.results = [...this.results, result];
  }

  sortResults(method: string): void {
    this.results = this.results.sort(RESULT_SORT[method]);
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

    const totalSpace = this.results.reduce((total, result) => {
      if (result.status === 'deleted') {
        spaceReleased += result.size;
      }

      const resultType = path.basename(result.path);
      typeCounts.set(resultType, (typeCounts.get(resultType) || 0) + 1);

      return total + result.size;
    }, 0);

    const formattedTotal = formatSize(totalSpace, this.sizeUnit);
    const formattedReleased = formatSize(spaceReleased, this.sizeUnit);

    const resultsTypesCount: IResultTypeCount[] = Array.from(
      typeCounts.entries(),
    )
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => {
        if (b.count !== a.count) {
          return b.count - a.count;
        }
        return a.type.localeCompare(b.type);
      });

    return {
      spaceReleased: formattedReleased,
      totalSpace: formattedTotal,
      resultsTypesCount,
    };
  }
}
