import { IFolder } from '../interfaces/folder.interface';
import { IStats } from '../interfaces/stats.interface';

export class ResultsService {
  results: IFolder[] = [];
  private SORT = {
    path: (a, b) => (a.path < b.path ? 1 : -1),
    size: (a, b) => (a.size < b.size ? 1 : -1),
  };

  addResult(result: IFolder): void {
    const sorterdResults = [...this.results, result];
    // this.results = this.sortResults(sorterdResults);
    this.results = sorterdResults;
  }

  sortResults(method: string): void {
    this.results = this.results.sort(this.SORT[method]);
  }

  getStats(): IStats {
    let spaceReleased = 0;

    const totalSpace = this.results.reduce((total, folder) => {
      if (folder.deleted) spaceReleased += folder.size;

      return total + folder.size;
    }, 0);

    return {
      spaceReleased: `${this.round(spaceReleased, 2)} gb`,
      totalSpace: `${this.round(totalSpace, 2)} gb`,
    };
  }

  private round(numb: number, decimals: number = 0): number {
    const toRound = +(numb + 'e' + decimals);
    return Number(Math.round(toRound) + 'e-' + decimals);
  }
}
