import { ConsoleService } from '../../../src/cli/services/index.js';
import { ResultsService } from '../../../src/cli/services/results.service.js';
import { jest } from '@jest/globals';
import { CliScanFoundFolder } from '../../../src/cli/interfaces/stats.interface.js';

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
    it('should render results', () => {
      resultsServiceMock.results = [
        {
          path: 'path/folder/1',
          size: 1,
          status: 'live',
        },
        {
          path: 'path/folder/2',
          size: 1,
          status: 'live',
        },
      ] as CliScanFoundFolder[];

      resultsUi.render();

      // With stringContaining we can ignore the terminal color codes.
      expect(stdoutWriteMock).toHaveBeenCalledWith(
        expect.stringContaining('path/folder/1'),
      );
      expect(stdoutWriteMock).toHaveBeenCalledWith(
        expect.stringContaining('path/folder/2'),
      );
    });

    // eslint-disable-next-line quotes
    it("should't render results if it is not visible", () => {
      const populateResults = () => {
        for (let i = 0; i < 100; i++) {
          resultsServiceMock.results.push({
            path: `path/folder/${i}`,
            size: 1,
            status: 'live',
            isDangerous: false,
            modificationTime: -1,
          } as CliScanFoundFolder);
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
    let folders: CliScanFoundFolder[];

    beforeEach(() => {
      folders = [
        { path: 'folder/1', size: 1, status: 'live' } as CliScanFoundFolder,
        { path: 'folder/2', size: 1, status: 'live' } as CliScanFoundFolder,
        { path: 'folder/3', size: 1, status: 'live' } as CliScanFoundFolder,
      ];

      resultsServiceMock.results = folders;
      resultsUi = new ResultsUi(resultsServiceMock, consoleServiceMock);
    });

    it('should toggle select mode on and off with "t"', () => {
      expect(resultsUi['selectMode']).toBe(false);

      resultsUi.onKeyInput({
        name: 't',
        meta: false,
        ctrl: false,
        shift: false,
        sequence: 't',
      });
      expect(resultsUi['selectMode']).toBe(true);

      resultsUi.onKeyInput({
        name: 't',
        meta: false,
        ctrl: false,
        shift: false,
        sequence: 't',
      });
      expect(resultsUi['selectMode']).toBe(false);
      expect(resultsUi['selectedFolders'].size).toBe(0);
    });

    it('should select and unselect folder with space', () => {
      resultsUi.onKeyInput({
        name: 't',
        meta: false,
        ctrl: false,
        shift: false,
        sequence: 't',
      }); // enable select mode

      resultsUi.onKeyInput({
        name: 'space',
        meta: false,
        ctrl: false,
        shift: false,
        sequence: ' ',
      });
      expect(resultsUi['selectedFolders'].has('folder/1')).toBe(true);

      resultsUi.onKeyInput({
        name: 'space',
        meta: false,
        ctrl: false,
        shift: false,
        sequence: ' ',
      });
      expect(resultsUi['selectedFolders'].has('folder/1')).toBe(false);
    });

    it('should start and end range selection with "v"', () => {
      resultsUi.onKeyInput({
        name: 't',
        meta: false,
        ctrl: false,
        shift: false,
        sequence: 't',
      }); // select mode on

      resultsUi.onKeyInput({
        name: 'v',
        meta: false,
        ctrl: false,
        shift: false,
        sequence: 'v',
      }); // start range
      expect(resultsUi['isRangeSelectionMode']).toBe(true);
      expect(resultsUi['rangeSelectionStart']).toBe(0);

      resultsUi.onKeyInput({
        name: 'down',
        meta: false,
        ctrl: false,
        shift: false,
        sequence: '\u001b[B',
      }); // move to folder/2
      expect(resultsUi['selectedFolders'].has('folder/1')).toBe(true);
      expect(resultsUi['selectedFolders'].has('folder/2')).toBe(true);

      resultsUi.onKeyInput({
        name: 'v',
        meta: false,
        ctrl: false,
        shift: false,
        sequence: 'v',
      }); // end range
      expect(resultsUi['isRangeSelectionMode']).toBe(false);
      expect(resultsUi['rangeSelectionStart']).toBe(null);
    });

    it('should delete all selected folders on enter', () => {
      const spy = jest.spyOn(resultsUi['delete$'], 'next');

      resultsUi.onKeyInput({
        name: 't',
        meta: false,
        ctrl: false,
        shift: false,
        sequence: 't',
      }); // selection mode
      resultsUi.onKeyInput({
        name: 'space',
        meta: false,
        ctrl: false,
        shift: false,
        sequence: ' ',
      }); // select folder/1
      resultsUi.onKeyInput({
        name: 'down',
        meta: false,
        ctrl: false,
        shift: false,
        sequence: '\u001b[B',
      });
      resultsUi.onKeyInput({
        name: 'space',
        meta: false,
        ctrl: false,
        shift: false,
        sequence: ' ',
      }); // select folder/2

      resultsUi.onKeyInput({
        name: 'enter',
        meta: false,
        ctrl: false,
        shift: false,
        sequence: '\r',
      });

      expect(spy).toHaveBeenCalledTimes(2);
      expect(spy).toHaveBeenCalledWith(folders[0]);
      expect(spy).toHaveBeenCalledWith(folders[1]);

      expect(resultsUi['selectedFolders'].size).toBe(0);
    });

    it('should clear range selection when toggling mode off', () => {
      resultsUi.onKeyInput({
        name: 't',
        meta: false,
        ctrl: false,
        shift: false,
        sequence: 't',
      }); // selection mode on
      resultsUi.onKeyInput({
        name: 'v',
        meta: false,
        ctrl: false,
        shift: false,
        sequence: 'v',
      }); // start range
      resultsUi.onKeyInput({
        name: 'down',
        meta: false,
        ctrl: false,
        shift: false,
        sequence: '\u001b[B',
      }); // move and apply range

      expect(resultsUi['selectedFolders'].size).toBe(2);
      expect(resultsUi['isRangeSelectionMode']).toBe(true);

      resultsUi.onKeyInput({
        name: 't',
        meta: false,
        ctrl: false,
        shift: false,
        sequence: 't',
      }); // toggle mode off
      expect(resultsUi['selectMode']).toBe(false);
      expect(resultsUi['selectedFolders'].size).toBe(0);
      expect(resultsUi['rangeSelectionStart']).toBe(null);
    });
  });
});
