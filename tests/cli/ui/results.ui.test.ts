import { ConsoleService } from '../../../src/cli/services/index.js';
import { ResultsService } from '../../../src/cli/services/results.service.js';
import { jest } from '@jest/globals';
import { CliScanFoundTarget } from '../../../src/cli/interfaces/stats.interface.js';

const stdoutWriteMock = jest.fn() as unknown;

const originalProcess = process;
const mockProcess = () => {
  global.process = {
    ...originalProcess,
    stdout: {
      write: stdoutWriteMock,
      rows: 30,
      columns: 80,
    } as NodeJS.WriteStream & {
      fd: 1;
    },
  };
};

const ResultsUiConstructor = (
  await import('../../../src/cli/ui/components/results.ui.js')
).ResultsUi;
class ResultsUi extends ResultsUiConstructor {}

describe('ResultsUi', () => {
  let resultsUi: ResultsUi;
  const ANSI_REGEX = /\u001b\[[0-9;]*m/g;

  const resultsServiceMock: ResultsService = {
    results: [],
  } as unknown as ResultsService;

  const consoleServiceMock: ConsoleService = {
    shortenText: (text) => text,
  } as unknown as ConsoleService;

  beforeEach(() => {
    mockProcess();
    resultsServiceMock.results = [];
    resultsUi = new ResultsUi(resultsServiceMock, consoleServiceMock);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('render', () => {
    it('should render age in days with the day suffix', () => {
      const now = Date.now();

      const cellText = resultsUi['getAgeCellText'](
        {
          path: 'path/folder/1',
          size: 1,
          status: 'live',
          modificationTime: now - 12 * 86400 * 1000,
        } as CliScanFoundTarget,
        false,
      );

      expect(cellText.replace(ANSI_REGEX, '')).toBe(' 12d');
    });

    it('should reduce the visible gap before the size value', () => {
      const cellText = resultsUi['getSizeCellText']({
        path: 'path/folder/1',
        size: 4.48,
        status: 'live',
        modificationTime: 1,
      } as CliScanFoundTarget);

      expect(cellText).toBe(' 4.48 GB ');
    });

    it('should render only the results that fit the terminal', () => {
      const populateResults = () => {
        for (let i = 0; i < 100; i++) {
          resultsServiceMock.results.push({
            path: `path/folder/${i}`,
            size: 1,
            status: 'live',
            isDangerous: false,
            modificationTime: -1,
          } as CliScanFoundTarget);
        }
      };

      populateResults();
      resultsUi.render();

      // With stringContaining we can ignore the terminal color codes.
      expect(stdoutWriteMock).toHaveBeenCalledWith(
        expect.stringContaining('path/folder/1'),
      );
      expect(stdoutWriteMock).not.toHaveBeenCalledWith(
        expect.stringContaining('path/folder/64'),
      );
    });
  });

  describe('selection mode', () => {
    const KEY_SEQUENCES: Record<string, string> = {
      space: ' ',
      down: '\u001b[B',
      enter: '\r',
    };

    let mockResults: CliScanFoundTarget[];

    const press = (name: string): void => {
      resultsUi.onKeyInput({
        name,
        sequence: KEY_SEQUENCES[name] ?? name,
        meta: false,
        ctrl: false,
        shift: false,
      });
    };

    beforeEach(() => {
      mockResults = [
        { path: 'folder/1', size: 1, status: 'live' } as CliScanFoundTarget,
        { path: 'folder/2', size: 1, status: 'live' } as CliScanFoundTarget,
        { path: 'folder/3', size: 1, status: 'live' } as CliScanFoundTarget,
      ];

      resultsServiceMock.results = mockResults;
    });

    it('should select and unselect folder with space', () => {
      press('t');

      press('space');
      expect(resultsUi['selectedResults'].has('folder/1')).toBe(true);

      press('space');
      expect(resultsUi['selectedResults'].has('folder/1')).toBe(false);
    });

    it('should start and end range selection with "v"', () => {
      press('t');

      press('v');
      expect(resultsUi['isRangeSelectionMode']).toBe(true);
      expect(resultsUi['rangeSelectionStart']).toBe(0);

      press('down');
      expect(resultsUi['selectedResults'].has('folder/1')).toBe(true);
      expect(resultsUi['selectedResults'].has('folder/2')).toBe(true);

      press('v');
      expect(resultsUi['isRangeSelectionMode']).toBe(false);
      expect(resultsUi['rangeSelectionStart']).toBe(null);
    });

    it('should delete all selected results on enter', () => {
      const spy = jest.spyOn(resultsUi['delete$'], 'next');

      press('t');
      press('space');
      press('down');
      press('space');
      press('enter');

      expect(spy).toHaveBeenCalledTimes(2);
      expect(spy).toHaveBeenCalledWith(mockResults[0]);
      expect(spy).toHaveBeenCalledWith(mockResults[1]);

      expect(resultsUi['selectedResults'].size).toBe(0);
    });

    it('should clear range selection when toggling mode off', () => {
      press('t');
      press('v');
      press('down');

      expect(resultsUi['selectedResults'].size).toBe(2);
      expect(resultsUi['isRangeSelectionMode']).toBe(true);

      press('t');
      expect(resultsUi['selectMode']).toBe(false);
      expect(resultsUi['selectedResults'].size).toBe(0);
      expect(resultsUi['rangeSelectionStart']).toBe(null);
    });
  });
});
