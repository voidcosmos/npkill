import { ConsoleService } from '../../../src/cli/services/index.js';
import { FileService } from '../../../src/core/services/files/files.service.js';

import { Folder } from '../../../src/core/interfaces/folder.interface.js';
import { ResultsService } from '../../../src/cli/services/results.service.js';
import { jest } from '@jest/globals';

const stdoutWriteMock = jest.fn() as any;

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

const ResultsUiConstructor = //@ts-ignore
  (await import('../../../src/cli/ui/components/results.ui.js')).ResultsUi;
class ResultsUi extends ResultsUiConstructor {}

describe('ResultsUi', () => {
  let resultsUi: ResultsUi;

  let resultsServiceMock: ResultsService = {
    results: [],
  } as unknown as ResultsService;

  let consoleServiceMock: ConsoleService = {
    shortenText: (text) => text,
  } as unknown as ConsoleService;

  let fileServiceMock: FileService = {
    convertGBToMB: (value) => value,
  } as unknown as FileService;

  beforeEach(() => {
    mockProcess();
    resultsServiceMock.results = [];
    resultsUi = new ResultsUi(
      resultsServiceMock,
      consoleServiceMock,
      fileServiceMock,
    );
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
      ] as Folder[];

      resultsUi.render();

      // With stringContaining we can ignore the terminal color codes.
      expect(stdoutWriteMock).toHaveBeenCalledWith(
        expect.stringContaining('path/folder/1'),
      );
      expect(stdoutWriteMock).toHaveBeenCalledWith(
        expect.stringContaining('path/folder/2'),
      );
    });

    it("should't render results if it is not visible", () => {
      const populateResults = () => {
        for (let i = 0; i < 100; i++) {
          resultsServiceMock.results.push({
            path: `path/folder/${i}`,
            size: 1,
            status: 'live',
          } as Folder);
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
});
