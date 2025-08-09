import { CliScanFoundFolder, IStats } from '../interfaces/index.js';
import { FOLDER_SORT } from '../../constants/sort.result.js';
import { formatSize } from '../../utils/unit-conversions.js';

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

    const totalSpace = this.results.reduce((total, folder) => {
      if (folder.status === 'deleted') {
        spaceReleased += folder.size;
      }

      return total + folder.size;
    }, 0);

    const formattedTotal = formatSize(totalSpace, this.sizeUnit);
    const formattedReleased = formatSize(spaceReleased, this.sizeUnit);

    return {
      spaceReleased: formattedReleased.text,
      totalSpace: formattedTotal.text,
    };
  }
}
