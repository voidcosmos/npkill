import { jest } from '@jest/globals';
import { StartParameters } from '../../src/cli/models/start-parameters.model.js';
import { NEVER, of, Subject, Subscription, throwError } from 'rxjs';
import {
  ConfigService,
  DeleteResult,
  Npkill,
  ScanStatus,
} from '../../src/core/index.js';
import { LoggerService } from '../../src/core/services/logger.service.js';
import { ResultsService } from '../../src/cli/services/results.service.js';
import { SpinnerService } from '../../src/cli/services/spinner.service.js';
import { ConsoleService } from '../../src/cli/services/console.service.js';
import { UpdateService } from '../../src/cli/services/update.service.js';
import { UiService } from '../../src/cli/services/ui.service.js';
import { ScanService } from '../../src/cli/services/scan.service.js';
import {
  ERROR_MSG,
  INFO_MSGS,
} from '../../src/constants/messages.constants.js';
import { JsonOutputService } from '../../src/cli/services/json-output.service.js';
import { ProfilesService } from '../../src/core/services/profiles.service.js';
import { DEFAULT_CONFIG } from '../../src/constants/main.constants.js';

const setDeleteAllWarningVisibilityMock = jest.fn();

jest.unstable_mockModule(
  '../../src/cli/ui/components/header/header.ui.js',
  () => ({
    HeaderUi: jest.fn(),
  }),
);
jest.unstable_mockModule(
  '../../src/cli/ui/components/header/stats.ui.js',
  () => ({
    StatsUi: jest.fn(() => ({ render: jest.fn() })),
  }),
);
jest.unstable_mockModule(
  '../../src/cli/ui/components/header/status.ui.js',
  () => ({
    StatusUi: jest.fn(() => ({
      start: jest.fn(),
      render: jest.fn(),
    })),
  }),
);
jest.unstable_mockModule('../../src/cli/ui/components/general.ui.js', () => ({
  GeneralUi: jest.fn(),
}));
jest.unstable_mockModule('../../src/cli/ui/components/help/help.ui.js', () => ({
  HelpUi: jest.fn(),
}));
jest.unstable_mockModule('../../src/cli/ui/components/results.ui.js', () => ({
  ResultsUi: jest.fn(() => ({
    delete$: new Subject<DeleteResult>(),
    showErrors$: { subscribe: jest.fn() },
    openFolder$: { subscribe: jest.fn() },
    showDetails$: { subscribe: jest.fn() },
    endNpkill$: { subscribe: jest.fn() },
    search$: { subscribe: jest.fn() },
    goOptions$: new Subject(),
    render: jest.fn(),
    startSearch: jest.fn(),
  })),
}));
jest.unstable_mockModule('../../src/cli/ui/components/logs.ui.js', () => ({
  LogsUi: jest.fn(() => ({
    close$: { subscribe: jest.fn() },
  })),
}));
jest.unstable_mockModule('../../src/cli/ui/components/warning.ui.js', () => ({
  WarningUi: jest.fn(() => ({
    setDeleteAllWarningVisibility: setDeleteAllWarningVisibilityMock,
    render: jest.fn(),
    confirm$: new Subject(),
  })),
}));
jest.unstable_mockModule('../../src/cli/ui/base.ui.js', () => ({
  BaseUi: class {
    setVisible() {}
  },
}));
jest.unstable_mockModule('../../src/cli/ui/heavy.ui.js', () => ({
  HeavyUi: {},
}));

const CliControllerConstructor = (
  await import('../../src/cli/cli.controller.js')
).CliController;
class CliController extends CliControllerConstructor {}

describe('CliController test', () => {
  let cliController;

  const spinnerServiceMock = jest.fn();
  const updateServiceMock = jest.fn();
  const resultServiceMock = jest.fn();
  const searchStatusMock = jest.fn();
  const loggerServiceMock: Partial<LoggerService> = {
    info: jest.fn(),
    error: jest.fn(),
    getSuggestLogFilePath: jest.fn(() => '/example/file'),
    saveToFile: jest.fn(),
  };
  const uiServiceMock = {
    add: jest.fn(),
    print: jest.fn(),
    setRawMode: jest.fn(),
    setCursorVisible: jest.fn(),
    clear: jest.fn(),
    renderAll: jest.fn(),
  };
  const scanServiceMock = {
    scan: jest.fn(),
    calculateResultStats: jest.fn(),
  };
  const consoleServiceMock = {
    getParameters: () => new StartParameters(),
    isRunningBuild: () => false,
    startListenKeyEvents: jest.fn(),
    splitData: (data: string, separator: string) => data.split(separator),
    replaceString: (data: string, from: string, to: string) =>
      data.replace(from, to),
  };

  const jsonOutputServiceMock = {
    flush: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
    initializeSession: jest.fn(),
    writeError: jest.fn(),
    completeScan: jest.fn(),
    handleShutdown: jest.fn(),
    processResult: jest.fn(),
  };

  const npkillDeleteMock = jest.fn();
  const npkillMock: Npkill = {
    logger: loggerServiceMock,
    validateRoot: jest.fn().mockReturnValue({ isValid: true }),
    delete$: npkillDeleteMock,
  } as unknown as Npkill;
  const profilesServiceMock = {
    getInvalidProfileNames: jest.fn(),
    getTargetsFromProfiles: jest.fn(() => ['node_modules']),
  };
  const configServiceMock = {
    loadConfig: jest.fn().mockReturnValue(DEFAULT_CONFIG),
    getUserDefinedProfiles: jest.fn(),
  };

  const initialConfig = structuredClone(DEFAULT_CONFIG);

  ////////// mocked Controller Methods
  let showHelpSpy;
  let setupEventsListenerSpy;
  let scanSpy;
  let checkVersionSpy;
  ///////////////////////////////////

  const mockParameters = (parameters: object) => {
    consoleServiceMock.getParameters = () => {
      const startParameters = new StartParameters();
      Object.keys(parameters).forEach((key) => {
        startParameters.add(key, parameters[key]);
      });
      return startParameters;
    };
  };

  const spyMethod = (method, fn = () => {}) => {
    return jest.spyOn(cliController, method).mockImplementation(fn);
  };

  const emitDelete = (target: DeleteResult) => {
    cliController.uiResults.delete$.next(target);
  };

  beforeEach(() => {
    jest.clearAllMocks();

    jest.spyOn(process, 'exit').mockImplementation((number) => {
      throw new Error('process.exit: ' + number);
    });
    cliController = new CliController(
      process.stdout,
      npkillMock,
      loggerServiceMock as LoggerService,
      searchStatusMock as unknown as ScanStatus,
      resultServiceMock as unknown as ResultsService,
      spinnerServiceMock as unknown as SpinnerService,
      consoleServiceMock as unknown as ConsoleService,
      updateServiceMock as unknown as UpdateService,
      uiServiceMock as unknown as UiService,
      scanServiceMock as unknown as ScanService,
      jsonOutputServiceMock as unknown as JsonOutputService,
      profilesServiceMock as unknown as ProfilesService,
      configServiceMock as unknown as ConfigService,
    );

    Object.defineProperty(process.stdout, 'columns', {
      value: 80,
      configurable: true,
    });

    showHelpSpy = jest
      .spyOn(cliController, 'showHelp')
      .mockImplementation(() => ({}));
    setupEventsListenerSpy = jest
      .spyOn(cliController, 'setupEventsListener')
      .mockImplementation(() => ({}));
    scanSpy = jest.spyOn(cliController, 'scan').mockImplementation(() => ({}));
    checkVersionSpy = jest
      .spyOn(cliController, 'checkVersion')
      .mockImplementation(() => ({}));
  });

  afterEach(() => {
    Object.assign(DEFAULT_CONFIG, structuredClone(initialConfig));
    mockParameters({});
  });

  it('#init normal start should call some methods', () => {
    cliController.init();
    expect(showHelpSpy).toHaveBeenCalledTimes(0);
    expect(setupEventsListenerSpy).toHaveBeenCalledTimes(1);
    expect(scanSpy).toHaveBeenCalledTimes(1);
    expect(checkVersionSpy).toHaveBeenCalledTimes(1);
  });

  it.each([
    { flag: 'help', method: 'showHelp' },
    { flag: 'version', method: 'showProgramVersion' },
  ])(
    'Should call $method and exit if --$flag is present',
    ({ flag, method }) => {
      mockParameters({ [flag]: true });
      const methodSpy = spyMethod(method);

      expect(() => cliController.init()).toThrow('process.exit: 0');
      expect(methodSpy).toHaveBeenCalledTimes(1);
    },
  );

  it('#checkVersionn should not be called if --no-check-updates is given', () => {
    mockParameters({ 'no-check-updates': true });
    const functionSpy = spyMethod('checkVersion');
    cliController.init();
    expect(functionSpy).toHaveBeenCalledTimes(0);
  });

  it('preserves exclusion prefixes when parsing CLI arguments', () => {
    mockParameters({
      exclude: String.raw`./node_modules,project/test,**/project/test,foo\*,what\?`,
    });
    cliController.init();

    expect(DEFAULT_CONFIG.exclude).toEqual([
      './node_modules',
      'project/test',
      '**/project/test',
      String.raw`foo\*`,
      String.raw`what\?`,
    ]);
  });

  describe('invalid options', () => {
    it.each([
      [
        '--json with --json-stream',
        { jsonSimple: true, jsonStream: true },
        ERROR_MSG.CANT_USE_BOTH_JSON_OPTIONS,
      ],
      [
        '--delete-all with --json and without -y',
        { 'delete-all': true, targets: 'node_modules', jsonSimple: true },
        ERROR_MSG.DELETE_ALL_NEEDS_YES,
      ],
      [
        '--sort-by with an unknown name',
        { 'sort-by': 'novalid' },
        INFO_MSGS.NO_VALID_SORT_NAME,
      ],
      [
        '--older-than with a word',
        { 'older-than': 'abc' },
        ERROR_MSG.INVALID_OLDER_THAN,
      ],
      [
        '--older-than with zero',
        { 'older-than': '0' },
        ERROR_MSG.INVALID_OLDER_THAN,
      ],
      [
        '--older-than with decimals',
        { 'older-than': '1.5' },
        ERROR_MSG.INVALID_OLDER_THAN,
      ],
      [
        '--older-than without a value',
        { 'older-than': true },
        ERROR_MSG.INVALID_OLDER_THAN,
      ],
      [
        '--older-than with --disable-age',
        { 'older-than': '90', 'disable-age': true },
        ERROR_MSG.CANT_USE_OLDER_THAN_WITHOUT_AGE,
      ],
      [
        '--older-than with --disable-stats',
        { 'older-than': '90', 'disable-stats': true },
        ERROR_MSG.CANT_USE_OLDER_THAN_WITHOUT_AGE,
      ],
    ])('Should show an error and exit with %s', (_, parameters, message) => {
      mockParameters(parameters);
      const exitWithErrorSpy = spyMethod('exitWithError');

      cliController.init();

      expect(loggerServiceMock.error).toHaveBeenCalledWith(message);
      expect(exitWithErrorSpy).toHaveBeenCalled();
    });

    it('Should show the unknown options and exit with an error', () => {
      consoleServiceMock.getParameters = () => {
        const parameters = new StartParameters();
        parameters.addUnknownOption('--exlcude');
        return parameters;
      };
      const exitWithErrorSpy = spyMethod('exitWithError');

      cliController.init();

      expect(uiServiceMock.print).toHaveBeenCalledWith(
        expect.stringContaining('--exlcude'),
      );
      expect(exitWithErrorSpy).toHaveBeenCalled();
    });

    it('Should exit if terminal is too small', () => {
      Object.defineProperty(process.stdout, 'columns', {
        value: 10,
        configurable: true,
      });
      const exitWithErrorSpy = spyMethod('exitWithError');
      cliController.init();
      expect(exitWithErrorSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('--delete-all', () => {
    it.each([
      ['show a warning before starting the scan', {}, 1, 0],
      ['not show a warning if -y is given', { yes: true }, 0, 1],
    ])('Should %s', (_, extraParameters, warningsShown, scansStarted) => {
      mockParameters({
        'delete-all': true,
        targets: 'node_modules',
        ...extraParameters,
      });

      cliController.init();

      expect(setDeleteAllWarningVisibilityMock).toHaveBeenCalledTimes(
        warningsShown,
      );
      expect(scanSpy).toHaveBeenCalledTimes(scansStarted);
    });
  });

  describe('--dry-run', () => {
    let testTarget: DeleteResult;

    beforeEach(() => {
      testTarget = {
        path: '/my/path/node_modules',
        success: true,
      };
      jest.useFakeTimers();
      npkillDeleteMock.mockReturnValueOnce(of(testTarget));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it.each([
      { parameter: 'false', expectedDryRun: false },
      { parameter: true, expectedDryRun: true },
    ])(
      'Should call delete with dryRun $expectedDryRun when --dry-run is $parameter',
      ({ parameter, expectedDryRun }) => {
        mockParameters({ targets: 'node_modules', 'dry-run': parameter });
        cliController.init();

        expect(npkillDeleteMock).toHaveBeenCalledTimes(0);

        emitDelete(testTarget);

        expect(npkillDeleteMock).toHaveBeenCalledTimes(1);
        expect(npkillDeleteMock).toHaveBeenCalledWith(testTarget.path, {
          dryRun: expectedDryRun,
        });
      },
    );
  });

  describe('deleting a target', () => {
    it('Should mark the target as failed when delete$ reports success: false', async () => {
      const target = { path: '/my/path/node_modules', status: 'live' };
      npkillDeleteMock.mockReturnValueOnce(
        of({
          path: target.path,
          success: false,
          error: { message: 'Permission denied' },
        }),
      );
      mockParameters({ targets: 'node_modules' });
      cliController.init();

      emitDelete(target as unknown as DeleteResult);
      await new Promise((resolve) => setImmediate(resolve));

      expect(target.status).toBe('error-deleting');
    });
  });

  describe('--json and --json-stream options', () => {
    it.each([
      { option: 'jsonStream', flag: '--json-stream' },
      { option: 'jsonSimple', flag: '--json' },
    ])('Should enable JSON mode when $flag is provided', ({ option }) => {
      mockParameters({ [option]: true });
      const setupJsonSignalsSpy = spyMethod('setupJsonModeSignalHandlers');

      cliController.init();

      expect(setupJsonSignalsSpy).toHaveBeenCalledTimes(1);
      expect(scanSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('--delete-all with JSON output', () => {
    const target = {
      path: '/my/project/node_modules',
      size: 1,
      modificationTime: 1640995200000,
      status: 'live',
    };

    const scanInJson = async () => {
      cliController.scanInJson();
      await new Promise((resolve) => setImmediate(resolve));
    };

    beforeEach(() => {
      DEFAULT_CONFIG.targets = ['node_modules'];
      DEFAULT_CONFIG.jsonSimple = true;
      scanServiceMock.scan.mockReturnValue(of(target));
      scanServiceMock.calculateResultStats.mockReturnValue(of(target));
    });

    it('Should delete each result and report the deletion', async () => {
      DEFAULT_CONFIG.deleteAll = true;
      const deletion = { path: target.path, success: true };
      npkillDeleteMock.mockReturnValueOnce(of(deletion));
      const exitGracefullySpy = spyMethod('exitGracefully');

      await scanInJson();

      expect(npkillDeleteMock).toHaveBeenCalledWith(target.path, {
        dryRun: false,
      });
      expect(jsonOutputServiceMock.processResult).toHaveBeenCalledWith(
        target,
        deletion,
      );
      expect(exitGracefullySpy).toHaveBeenCalledTimes(1);
    });

    it('Should exit with an error when a deletion fails', async () => {
      DEFAULT_CONFIG.deleteAll = true;
      npkillDeleteMock.mockReturnValueOnce(
        of({
          path: target.path,
          success: false,
          error: { message: 'Permission denied' },
        }),
      );
      const exitWithErrorSpy = spyMethod('exitWithError');

      await scanInJson();

      expect(exitWithErrorSpy).toHaveBeenCalledTimes(1);
    });

    it('Should skip the stats that are disabled', async () => {
      DEFAULT_CONFIG.disableSize = true;
      DEFAULT_CONFIG.disableAge = true;
      spyMethod('exitGracefully');

      await scanInJson();

      expect(jsonOutputServiceMock.initializeSession).toHaveBeenCalledWith(
        false,
        false,
      );
      expect(scanServiceMock.calculateResultStats).toHaveBeenCalledWith(
        target,
        expect.objectContaining({ disableSize: true, disableAge: true }),
      );
    });

    it('Should not delete anything without --delete-all', async () => {
      spyMethod('exitGracefully');

      await scanInJson();

      expect(npkillDeleteMock).not.toHaveBeenCalled();
      expect(jsonOutputServiceMock.processResult).toHaveBeenCalledWith(
        target,
        undefined,
      );
    });
  });

  describe('exiting', () => {
    it.each([
      { exitCode: 0, method: 'exitGracefully' },
      { exitCode: 1, method: 'exitWithError' },
    ])(
      'Should flush JSON output before exiting with $exitCode',
      async ({ exitCode, method }) => {
        let finishFlush: () => void = () => {};
        jsonOutputServiceMock.flush.mockImplementationOnce(
          () =>
            new Promise<void>((resolve) => {
              finishFlush = resolve;
            }),
        );
        const exitSpy = spyMethod(method);

        const exiting = cliController.exitAfterJsonOutput(exitCode);

        expect(exitSpy).not.toHaveBeenCalled();
        finishFlush();
        await exiting;
        expect(exitSpy).toHaveBeenCalledTimes(1);
      },
    );

    it.each(['SIGINT', 'SIGTERM'] as const)(
      'Should stop the scan and flush JSON once on %s',
      (signal) => {
        cliController.scanSubscription = new Subscription();
        const exitSpy = spyMethod('exitAfterJsonOutput');
        cliController.setupJsonModeSignalHandlers();
        const shutdown = process.listeners(signal).at(-1)!;
        process.removeListener('SIGINT', shutdown);
        process.removeListener('SIGTERM', shutdown);

        shutdown(signal);
        shutdown(signal);

        expect(cliController.scanSubscription.closed).toBe(true);
        expect(jsonOutputServiceMock.handleShutdown).toHaveBeenCalledTimes(1);
        expect(exitSpy).toHaveBeenCalledTimes(1);
        expect(exitSpy).toHaveBeenCalledWith(0);
      },
    );

    it('Should not write terminal escape codes when the interactive ui never started', () => {
      expect(() => cliController.exitGracefully()).toThrow('process.exit: 0');

      expect(uiServiceMock.print).not.toHaveBeenCalled();
      expect(uiServiceMock.setCursorVisible).not.toHaveBeenCalled();
    });

    it('Should restore the terminal when leaving the interactive ui', () => {
      cliController.init();
      jest.clearAllMocks();

      expect(() => cliController.exitGracefully()).toThrow('process.exit: 0');

      expect(uiServiceMock.setRawMode).toHaveBeenCalledWith(false);
      expect(uiServiceMock.setCursorVisible).toHaveBeenCalledWith(true);
    });

    it('Should print the version on its own line', () => {
      spyMethod('getVersion', () => '1.0.0');

      cliController.showProgramVersion();

      expect(uiServiceMock.print).toHaveBeenCalledWith('v1.0.0\n');
    });

    it('Should exit with an error when a JSON scan fails', async () => {
      scanServiceMock.scan.mockReturnValue(
        throwError(() => new Error('Cannot scan /missing')),
      );
      const exitWithErrorSpy = spyMethod('exitWithError');

      cliController.scanInJson();
      await new Promise((resolve) => setImmediate(resolve));

      expect(jsonOutputServiceMock.writeError).toHaveBeenCalled();
      expect(exitWithErrorSpy).toHaveBeenCalledTimes(1);
    });

    it('Should exit with the reason when a scan in the interface fails', () => {
      scanServiceMock.scan.mockReturnValue(
        throwError(() => new Error('Cannot scan /missing')),
      );
      const exitWithErrorSpy = spyMethod('exitWithError');
      cliController.uiStatus = { reset: jest.fn(), start: jest.fn() };
      cliController.uiResults = { startSearch: jest.fn() };

      cliController.scanInUiMode();

      expect(uiServiceMock.print).toHaveBeenCalledWith(
        expect.stringContaining('Cannot scan /missing'),
      );
      expect(exitWithErrorSpy).toHaveBeenCalledTimes(1);
    });

    it('Should forget the previous empty search when a scan in the interface starts', () => {
      scanServiceMock.scan.mockReturnValue(NEVER);
      cliController.uiStatus = { reset: jest.fn(), start: jest.fn() };
      cliController.uiResults = { startSearch: jest.fn() };

      cliController.scanInUiMode();

      expect(cliController.uiResults.startSearch).toHaveBeenCalledTimes(1);
    });

    it('Should log unexpected errors and exit with an error', () => {
      const exitWithErrorSpy = spyMethod('exitWithError');

      cliController.exitWithFatalError(new Error('boom'));

      expect(loggerServiceMock.error).toHaveBeenCalledWith(
        expect.stringContaining('boom'),
      );
      expect(uiServiceMock.print).toHaveBeenCalledWith(
        expect.stringContaining('boom'),
      );
      expect(exitWithErrorSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('--no-ignore-default', () => {
    it('Should look inside the folders skipped by default', () => {
      mockParameters({ 'disable-default-ignore': true });
      cliController.init();
      expect(DEFAULT_CONFIG.disableDefaultIgnore).toBe(true);
    });
  });

  describe('--older-than', () => {
    it('Should set olderThan in the config when a valid number is given', () => {
      mockParameters({ 'older-than': '90' });
      cliController.init();
      expect(DEFAULT_CONFIG.olderThan).toBe(90);
      expect(scanSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('age filtering', () => {
    const daysAgo = (days: number) => Date.now() - days * 86400000;
    const folder = (modificationTime: number) => ({
      path: '/my/project/node_modules',
      size: 1,
      modificationTime,
      status: 'live',
    });

    let addResultMock;
    let deleteResultSpy;

    beforeEach(() => {
      addResultMock = jest.fn();
      cliController.resultsService = {
        addResult: addResultMock,
        sortResults: jest.fn(),
      };
      cliController.searchStatus = {
        newResult: jest.fn(),
        completeStatCalculation: jest.fn(),
      };
      cliController.uiResults = { render: jest.fn(), clear: jest.fn() };
      spyMethod('finishResultStats');
      deleteResultSpy = spyMethod('deleteResult');
    });

    it('Should add results as soon as they are found when not filtering', () => {
      DEFAULT_CONFIG.olderThan = 0;
      cliController.processResultForUi(folder(-1));
      expect(addResultMock).toHaveBeenCalledTimes(1);
    });

    it('Should neither add nor delete results before their age is known when filtering', () => {
      DEFAULT_CONFIG.olderThan = 90;
      DEFAULT_CONFIG.deleteAll = true;
      DEFAULT_CONFIG.disableSize = true;

      cliController.processResultForUi(folder(-1));

      expect(addResultMock).not.toHaveBeenCalled();
      expect(deleteResultSpy).not.toHaveBeenCalled();
    });

    it('Should only add and delete results older than the given days', () => {
      DEFAULT_CONFIG.olderThan = 90;
      DEFAULT_CONFIG.deleteAll = true;

      const oldFolder = folder(daysAgo(120));
      const recentFolder = folder(daysAgo(10));
      const unknownAgeFolder = folder(1);

      cliController.processResultStatsForUi(oldFolder);
      cliController.processResultStatsForUi(recentFolder);
      cliController.processResultStatsForUi(unknownAgeFolder);

      expect(addResultMock).toHaveBeenCalledTimes(1);
      expect(addResultMock).toHaveBeenCalledWith(oldFolder);
      expect(deleteResultSpy).toHaveBeenCalledTimes(1);
      expect(deleteResultSpy).toHaveBeenCalledWith(oldFolder);
    });
  });

  it.each([
    ['./projects/', './projects'],
    ['../projects', '../projects'],
  ])(
    'accepts %s as a relative scan directory',
    (directory, expectedFolderRoot) => {
      mockParameters({ directory });

      cliController.init();

      expect(DEFAULT_CONFIG.folderRoot).toBe(expectedFolderRoot);
    },
  );
});
