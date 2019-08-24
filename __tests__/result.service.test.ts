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
        deleted: false,
        path: 'path',
        size: 5,
      };
      const resultExpected = [newResult];
      resultService.addResult(newResult);
      expect(resultService.results).toMatchObject(resultExpected);
    });
    it('should add folders', () => {
      const newResults: IFolder[] = [
        {
          deleted: false,
          path: 'path',
          size: 1,
        },
        {
          deleted: true,
          path: 'path2',
          size: 2,
        },
        {
          deleted: false,
          path: 'path3',
          size: 3,
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
          deleted: false,
          path: 'pathd',
          size: 5,
        },
        {
          deleted: false,
          path: 'patha',
          size: 6,
        },
        {
          deleted: false,
          path: 'pathc',
          size: 16,
        },
        {
          deleted: true,
          path: 'pathcc',
          size: 0,
        },
        {
          deleted: true,
          path: 'pathb',
          size: 3,
        },
        {
          deleted: false,
          path: 'pathz',
          size: 8,
        },
      ];

      resultService.results = [...mockResults];
    });

    it('should sort by path', () => {
      const expectResult = [
        {
          deleted: false,
          path: 'patha',
          size: 6,
        },
        {
          deleted: true,
          path: 'pathb',
          size: 3,
        },
        {
          deleted: false,
          path: 'pathc',
          size: 16,
        },
        {
          deleted: true,
          path: 'pathcc',
          size: 0,
        },
        {
          deleted: false,
          path: 'pathd',
          size: 5,
        },
        {
          deleted: false,
          path: 'pathz',
          size: 8,
        },
      ];

      resultService.sortResults('path');
      expect(resultService.results).toMatchObject(expectResult);
    });
    it('should sort by size', () => {
      const expectResult = [
        {
          deleted: false,
          path: 'pathc',
          size: 16,
        },
        {
          deleted: false,
          path: 'pathz',
          size: 8,
        },
        {
          deleted: false,
          path: 'patha',
          size: 6,
        },
        {
          deleted: false,
          path: 'pathd',
          size: 5,
        },
        {
          deleted: true,
          path: 'pathb',
          size: 3,
        },
        {
          deleted: true,
          path: 'pathcc',
          size: 0,
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
          deleted: false,
          path: 'pathd',
          size: 5,
        },
        {
          deleted: true,
          path: 'patha',
          size: 6,
        },
        {
          deleted: false,
          path: 'pathc',
          size: 16,
        },
        {
          deleted: true,
          path: 'pathcc',
          size: 0,
        },
        {
          deleted: true,
          path: 'pathb',
          size: 3,
        },
        {
          deleted: false,
          path: 'pathz',
          size: 8,
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
