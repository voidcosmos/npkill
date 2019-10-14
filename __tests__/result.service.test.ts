import { IFolder } from '../src/interfaces/folder.interface';
import { ResultsService } from '../src/services/results.service';

describe('Result Service', () => {
  let resultService;
  beforeEach(() => {
    resultService = new ResultsService();
  });

  describe('#addResult', () => {
    it('should add folder if that is the first', () => {
      const newResult: IFolder = {
        path: 'path',
        size: 5,
        status: 'live',
      };
      const resultExpected = [newResult];
      resultService.addResult(newResult);
      expect(resultService.results).toMatchObject(resultExpected);
    });
    it('should add folders', () => {
      const newResults: IFolder[] = [
        {
          path: 'path',
          size: 1,
          status: 'live',
        },
        {
          path: 'path2',
          size: 2,
          status: 'deleted',
        },
        {
          path: 'path3',
          size: 3,
          status: 'live',
        },
      ];

      const resultExpected = newResults;

      newResults.forEach(result => resultService.addResult(result));
      expect(resultService.results).toMatchObject(resultExpected);
    });
  });

  describe('#sortResults', () => {
    let mockResults: IFolder[];
    beforeEach(() => {
      mockResults = [
        {
          path: 'pathd',
          size: 5,
          status: 'live',
        },
        {
          path: 'patha',
          size: 6,
          status: 'live',
        },
        {
          path: 'pathc',
          size: 16,
          status: 'live',
        },
        {
          path: 'pathcc',
          size: 0,
          status: 'deleted',
        },
        {
          path: 'pathb',
          size: 3,
          status: 'deleted',
        },
        {
          path: 'pathz',
          size: 8,
          status: 'live',
        },
      ];

      resultService.results = [...mockResults];
    });

    it('should sort by path', () => {
      const expectResult = [
        {
          path: 'patha',
          size: 6,
          status: 'live',
        },
        {
          path: 'pathb',
          size: 3,
          status: 'deleted',
        },
        {
          path: 'pathc',
          size: 16,
          status: 'live',
        },
        {
          path: 'pathcc',
          size: 0,
          status: 'deleted',
        },
        {
          path: 'pathd',
          size: 5,
          status: 'live',
        },
        {
          path: 'pathz',
          size: 8,
          status: 'live',
        },
      ];

      resultService.sortResults('path');
      expect(resultService.results).toMatchObject(expectResult);
    });
    it('should sort by size', () => {
      const expectResult = [
        {
          path: 'pathc',
          size: 16,
          status: 'live',
        },
        {
          path: 'pathz',
          size: 8,
          status: 'live',
        },
        {
          path: 'patha',
          size: 6,
          status: 'live',
        },
        {
          path: 'pathd',
          size: 5,
          status: 'live',
        },
        {
          path: 'pathb',
          size: 3,
          status: 'deleted',
        },
        {
          path: 'pathcc',
          size: 0,
          status: 'deleted',
        },
      ];

      resultService.sortResults('size');
      expect(resultService.results).toMatchObject(expectResult);
    });
    it('should not sort if method dont exist', () => {
      const expectResult = mockResults;

      resultService.sortResults('color');
      expect(resultService.results).toMatchObject(expectResult);
    });
  });

  describe('#getStats', () => {
    let mockResults: IFolder[];
    beforeEach(() => {
      mockResults = [
        {
          path: 'pathd',
          size: 5,
          status: 'live',
        },
        {
          path: 'patha',
          size: 6,
          status: 'deleted',
        },
        {
          path: 'pathc',
          size: 16,
          status: 'live',
        },
        {
          path: 'pathcc',
          size: 0,
          status: 'deleted',
        },
        {
          path: 'pathb',
          size: 3,
          status: 'deleted',
        },
        {
          path: 'pathz',
          size: 8,
          status: 'live',
        },
      ];

      resultService.results = [...mockResults];
    });

    it('should get stats of results', () => {
      const expectResult = {
        spaceReleased: '9 gb',
        totalSpace: '38 gb',
      };

      const stats = resultService.getStats();
      expect(stats).toMatchObject(expectResult);
    });
  });
});
