import { CliScanFoundTarget } from '../../../src/cli/interfaces/stats.interface.js';
import { ResultsService } from '../../../src/cli/services/results.service.js';

const makeResult = (
  path: string,
  size: number,
  status: CliScanFoundTarget['status'] = 'live',
): CliScanFoundTarget => ({ path, size, status, modificationTime: 0 });

const pathsOf = (results: CliScanFoundTarget[]): string[] =>
  results.map((result) => result.path);

describe('Result Service', () => {
  let resultService: ResultsService;
  beforeEach(() => {
    resultService = new ResultsService();
  });

  describe('#addResult', () => {
    it('should add results', () => {
      const newResults = [
        makeResult('path', 1),
        makeResult('path2', 2, 'deleted'),
        makeResult('path3', 3),
      ];

      newResults.forEach((result) => resultService.addResult(result));

      expect(resultService.results).toEqual(newResults);
    });
  });

  describe('#sortResults', () => {
    let mockResults: CliScanFoundTarget[];
    beforeEach(() => {
      mockResults = [
        makeResult('pathd', 5),
        makeResult('patha', 6),
        makeResult('pathc', 16),
        makeResult('pathcc', 0, 'deleted'),
        makeResult('pathb', 3, 'deleted'),
        makeResult('pathz', 8),
      ];

      resultService.results = [...mockResults];
    });

    it('should sort by path', () => {
      resultService.sortResults('path');

      expect(pathsOf(resultService.results)).toEqual([
        'patha',
        'pathb',
        'pathc',
        'pathcc',
        'pathd',
        'pathz',
      ]);
    });

    it('should sort by size', () => {
      resultService.sortResults('size');

      expect(pathsOf(resultService.results)).toEqual([
        'pathc',
        'pathz',
        'patha',
        'pathd',
        'pathb',
        'pathcc',
      ]);
    });

    it('should not sort if method dont exist', () => {
      resultService.sortResults('color');

      expect(resultService.results).toEqual(mockResults);
    });
  });

  describe('#getStats', () => {
    it('should get stats of results', () => {
      resultService.results = [
        makeResult('pathd', 5),
        makeResult('patha', 6, 'deleted'),
        makeResult('pathc', 16),
        makeResult('pathcc', 0, 'deleted'),
        makeResult('pathb', 3, 'deleted'),
        makeResult('pathz', 8),
      ];

      const stats = resultService.getStats();

      expect(stats).toMatchObject({
        spaceReleased: { text: '9.00 GB' },
        totalSpace: { text: '38.00 GB' },
      });
    });
  });
});
