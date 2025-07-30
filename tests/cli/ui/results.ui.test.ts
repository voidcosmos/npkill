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
});
