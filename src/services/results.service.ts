import { IFolder, IStats } from '@interfaces/index.js';
import { FOLDER_SORT } from '../constants/sort.result.js';

export class ResultsService {
  results: IFolder[] = [];

  addResult(result: IFolder): void {
    this.results = [...this.results, result];
  }

  sortResults(method: string): void {
    this.results = this.results.sort(FOLDER_SORT[method]);
  }

  getStats(): IStats {
    let spaceReleased = 0;

    const totalSpace = this.results.reduce((total, folder) => {
      if (folder.status === 'deleted') spaceReleased += folder.size;

      return total + folder.size;
    }, 0);

    return {
      spaceReleased: `${spaceReleased.toFixed(2)} GB`,
      totalSpace: `${totalSpace.toFixed(2)} GB`,
    };
  }
}
