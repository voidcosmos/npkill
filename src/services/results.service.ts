import { IFolder } from '../interfaces/folder.interface';
import { IStats } from '../interfaces/stats.interface';
import { FOLDER_SORT } from '../constants/sort.result';

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
      spaceReleased: `${this.round(spaceReleased, 2)} GB`,
      totalSpace: `${this.round(totalSpace, 2)} GB`,
    };
  }

  private round(numb: number, decimals: number = 0): number {
    const toRound = +(numb + 'e' + decimals);
    return Number(Math.round(toRound) + 'e-' + decimals);
  }
}
