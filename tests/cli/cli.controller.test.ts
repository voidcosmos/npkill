import { jest } from '@jest/globals';
import { StartParameters } from '../../src/cli/models/start-parameters.model.js';
import { Subject } from 'rxjs';
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
import { ERROR_MSG } from '../../src/constants/messages.constants.js';
import { JsonOutputService } from '../../src/cli/services/json-output.service.js';
import { ProfilesService } from '../../src/core/services/profiles.service.js';
import { DEFAULT_CONFIG } from '../../src/constants/main.constants.js';

const resultsUiDeleteMock$ = new Subject<DeleteResult>();
const setDeleteAllWarningVisibilityMock = jest.fn();

jest.mock('../../src/dirname.js', () => {
  return {};
});

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
    delete$: resultsUiDeleteMock$,
    showErrors$: { subscribe: jest.fn() },
    openFolder$: { subscribe: jest.fn() },
    showDetails$: { subscribe: jest.fn() },
    endNpkill$: { subscribe: jest.fn() },
    search$: { subscribe: jest.fn() },
    goOptions$: new Subject(),
    render: jest.fn(),
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

  const filesServiceDeleteMock = jest
    .fn<() => Promise<boolean>>()
    .mockResolvedValue(true);
  const filesServiceFakeDeleteMock = jest
    .fn<() => Promise<boolean>>()
    .mockResolvedValue(true);

  const linuxFilesServiceMock = {
    getFileContent: jest.fn().mockReturnValue('{}'),
    isValidRootFolder: jest.fn().mockReturnValue({ isValid: true }),
    isSafeToDelete: jest.fn().mockReturnValue(true),
    delete: filesServiceDeleteMock,
    fakeDelete: filesServiceFakeDeleteMock,
  };
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
  };

  const jsonOutputServiceMock = {
    initializeSession: jest.fn(),
    writeStreamResult: jest.fn(),
    getResultsCount: jest.fn(() => 0),
  };

  const npkillDeleteMock = jest.fn();
  const npkillMock: Npkill = {
    logger: loggerServiceMock,
    isValidRootFolder: linuxFilesServiceMock.isValidRootFolder,
    getSize$: jest.fn(),
    getNewestFile$: jest.fn(),
    startScan$: jest.fn(),
    delete$: npkillDeleteMock,
  } as unknown as Npkill;
  const profilesServiceMock = {
    getAvailableProfilesToPrint: jest.fn(),
    getInvalidProfileNames: jest.fn(),
    getTargetsFromProfiles: jest.fn(() => ['node_modules']),
  };
  const configServiceMock = {
    loadConfig: jest.fn().mockReturnValue(DEFAULT_CONFIG),
    validateConfig: jest.fn(),
    mergeConfigs: jest.fn(),
    getUserDefinedProfiles: jest.fn(),
  };

  ////////// mocked Controller Methods
  let showHelpSpy;
  let setupEventsListenerSpy;
  let scanSpy;
  let checkVersionSpy;
  let exitSpy;
  ///////////////////////////////////

  beforeEach(() => {
    jest.clearAllMocks();

    (profilesServiceMock.getTargetsFromProfiles as jest.Mock).mockReturnValue([
      'node_modules',
    ]);

    exitSpy = jest.spyOn(process, 'exit').mockImplementation((number) => {
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
    Object.defineProperty(process.stdout, 'isTTY', {
      value: true,
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

  it('#init normal start should call some methods', () => {
    cliController.init();
    expect(showHelpSpy).toHaveBeenCalledTimes(0);
    expect(setupEventsListenerSpy).toHaveBeenCalledTimes(1);
    expect(scanSpy).toHaveBeenCalledTimes(1);
    expect(checkVersionSpy).toHaveBeenCalledTimes(1);
  });

  describe('#getArguments', () => {
    const mockParameters = (parameters: object) => {
      consoleServiceMock.getParameters = () => {
        const startParameters = new StartParameters();
        Object.keys(parameters).forEach((key) => {
          startParameters.add(key, parameters[key]);
        });
        return startParameters;
      };
      /*  jest
      .spyOn(consoleService, 'getParameters')
      .mockImplementation((rawArgv) => {
        return parameters;
      }); */
    };

    const spyMethod = (method, fn = () => {}) => {
      return jest.spyOn(cliController, method).mockImplementation(fn);
    };

    afterEach(() => {
      jest.spyOn(process, 'exit').mockReset();
      mockParameters({});
      // Reset DEFAULT_CONFIG to avoid test pollution
      DEFAULT_CONFIG.jsonStream = false;
      DEFAULT_CONFIG.jsonSimple = false;
      DEFAULT_CONFIG.deleteAll = false;
      DEFAULT_CONFIG.dryRun = false;
      DEFAULT_CONFIG.sortBy = 'none';
      DEFAULT_CONFIG.olderThan = 0;
      DEFAULT_CONFIG.disableAge = false;
      DEFAULT_CONFIG.disableSize = false;
    });

    it('#showHelp should called if --help flag is present and exit', () => {
      mockParameters({ help: true });
      expect(() => cliController.init()).toThrow();
      expect(showHelpSpy).toHaveBeenCalledTimes(1);
      expect(exitSpy).toHaveBeenCalledTimes(1);
    });

    it('#showProgramVersion should called if --version flag is present and exit', () => {
      mockParameters({ version: true });
      const functionSpy = jest
        .spyOn(cliController, 'showProgramVersion')
        .mockImplementation(() => ({}));
      expect(() => cliController.init()).toThrow();
      expect(functionSpy).toHaveBeenCalledTimes(1);
      expect(exitSpy).toHaveBeenCalledTimes(1);
    });

    it('#checkVersionn should not be called if --no-check-updates is given', () => {
      mockParameters({ 'no-check-updates': true });
      const functionSpy = spyMethod('checkVersion');
      cliController.init();
      expect(functionSpy).toHaveBeenCalledTimes(0);
    });

    describe('--sort-by parameter   ', () => {
      it('Should detect if option is invalid', () => {
        mockParameters({ 'sort-by': 'novalid' });
        spyMethod('isValidSortParam', () => false);
        const functionSpy = spyMethod('invalidSortParam');
        cliController.init();
        expect(functionSpy).toHaveBeenCalledTimes(1);
      });

      // TODO test that check sortBy property is changed
    });

    describe('--delete-all', () => {
      beforeEach(() => {
        jest.clearAllMocks();
        (
          profilesServiceMock.getTargetsFromProfiles as jest.Mock
        ).mockReturnValue(['node_modules']);
      });

      it('Should show a warning before start scan with --targets defined', () => {
        mockParameters({
          'delete-all': true,
          targets: 'node_modules',
        });
        expect(setDeleteAllWarningVisibilityMock).toHaveBeenCalledTimes(0);
        expect(scanSpy).toHaveBeenCalledTimes(0);

        cliController.init();
        expect(setDeleteAllWarningVisibilityMock).toHaveBeenCalledTimes(1);
        expect(scanSpy).toHaveBeenCalledTimes(0);
      });

      it('Should no show a warning if -y is given', () => {
        mockParameters({
          'delete-all': true,
          yes: true,
          targets: 'node_modules',
        });
        expect(setDeleteAllWarningVisibilityMock).toHaveBeenCalledTimes(0);
        expect(scanSpy).toHaveBeenCalledTimes(0);

        cliController.init();
        expect(setDeleteAllWarningVisibilityMock).toHaveBeenCalledTimes(0);
        expect(scanSpy).toHaveBeenCalledTimes(1);
      });
    });

    describe('--dry-run', () => {
      let testTarget: DeleteResult;

      beforeEach(() => {
        testTarget = {
          path: '/my/path/node_modules',
          success: true,
        };
        jest.clearAllMocks();
      });

      it('Should call normal delete function when no --dry-run is included', () => {
        mockParameters({
          targets: 'node_modules',
          'dry-run': 'false',
        });
        cliController.init();

        expect(npkillDeleteMock).toHaveBeenCalledTimes(0);

        resultsUiDeleteMock$.next(testTarget);

        expect(npkillDeleteMock).toHaveBeenCalledTimes(1);
        expect(npkillDeleteMock).toHaveBeenCalledWith(testTarget.path, {
          dryRun: false,
        });
      });

      it('Should call fake delete function instead of delete', () => {
        mockParameters({ targets: 'node_modules', 'dry-run': true });
        cliController.init();

        expect(npkillDeleteMock).toHaveBeenCalledTimes(0);

        resultsUiDeleteMock$.next(testTarget);

        expect(npkillDeleteMock).toHaveBeenCalledTimes(1);
        expect(npkillDeleteMock).toHaveBeenCalledWith(testTarget.path, {
          dryRun: true,
        });
      });
    });

    describe('--json and --json-stream options', () => {
      it('Should enable JSON stream mode when --json-stream is provided', () => {
        mockParameters({ jsonStream: true });
        const setupJsonSignalsSpy = spyMethod('setupJsonModeSignalHandlers');

        cliController.init();

        expect(setupJsonSignalsSpy).toHaveBeenCalledTimes(1);
        expect(scanSpy).toHaveBeenCalledTimes(1);
      });

      it('Should enable JSON simple mode when --json is provided', () => {
        mockParameters({ jsonSimple: true });
        const setupJsonSignalsSpy = spyMethod('setupJsonModeSignalHandlers');

        cliController.init();

        expect(setupJsonSignalsSpy).toHaveBeenCalledTimes(1);
        expect(scanSpy).toHaveBeenCalledTimes(1);
      });

      it('Should show error and exit when both --json and --json-stream are provided', () => {
        mockParameters({ jsonSimple: true, jsonStream: true });
        const exitWithErrorSpy = spyMethod('exitWithError');

        cliController.init();

        expect(loggerServiceMock.error).toHaveBeenCalledWith(
          ERROR_MSG.CANT_USE_BOTH_JSON_OPTIONS,
        );
        expect(exitWithErrorSpy).toHaveBeenCalledTimes(1);
      });
    });

    describe('--older-than', () => {
      beforeEach(() => {
        jest.clearAllMocks();
      });

      it('Should set olderThan in the config when a valid number is given', () => {
        mockParameters({ 'older-than': '90' });
        cliController.init();
        expect(DEFAULT_CONFIG.olderThan).toBe(90);
        expect(scanSpy).toHaveBeenCalledTimes(1);
      });

      it.each(['abc', '0', '-5', '1.5', '90d'])(
        'Should show error and exit when the value is %p',
        (value) => {
          mockParameters({ 'older-than': value });
          const exitWithErrorSpy = spyMethod('exitWithError');
          cliController.init();
          expect(loggerServiceMock.error).toHaveBeenCalledWith(
            ERROR_MSG.INVALID_OLDER_THAN,
          );
          expect(exitWithErrorSpy).toHaveBeenCalled();
        },
      );

      it('Should show error and exit when no value is given', () => {
        mockParameters({ 'older-than': true });
        const exitWithErrorSpy = spyMethod('exitWithError');
        cliController.init();
        expect(loggerServiceMock.error).toHaveBeenCalledWith(
          ERROR_MSG.INVALID_OLDER_THAN,
        );
        expect(exitWithErrorSpy).toHaveBeenCalled();
      });

      it.each(['disable-age', 'disable-stats'])(
        'Should show error and exit when used with %p',
        (option) => {
          mockParameters({ 'older-than': '90', [option]: true });
          const exitWithErrorSpy = spyMethod('exitWithError');
          cliController.init();
          expect(loggerServiceMock.error).toHaveBeenCalledWith(
            ERROR_MSG.CANT_USE_OLDER_THAN_WITHOUT_AGE,
          );
          expect(exitWithErrorSpy).toHaveBeenCalled();
        },
      );
    });

    describe('age filtering', () => {
      const daysAgo = (days: number) => Date.now() / 1000 - days * 86400;
      const folder = (modificationTime: number) => ({
        path: '/my/project/node_modules',
        size: 1,
        modificationTime,
        status: 'live',
      });

      let addResultMock;
      let deleteTargetSpy;

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
        deleteTargetSpy = spyMethod('deleteTarget');
      });

      it('Should add results as soon as they are found when not filtering', () => {
        DEFAULT_CONFIG.olderThan = 0;
        cliController.processResultForUi(folder(-1));
        expect(addResultMock).toHaveBeenCalledTimes(1);
      });

      it('Should wait for the stats before adding results when filtering', () => {
        DEFAULT_CONFIG.olderThan = 90;
        cliController.processResultForUi(folder(-1));
        expect(addResultMock).not.toHaveBeenCalled();
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
        expect(deleteTargetSpy).toHaveBeenCalledTimes(1);
        expect(deleteTargetSpy).toHaveBeenCalledWith(oldFolder);
      });

      it('Should not delete results before their age is known with --no-size', () => {
        DEFAULT_CONFIG.olderThan = 90;
        DEFAULT_CONFIG.deleteAll = true;
        DEFAULT_CONFIG.disableSize = true;

        cliController.processResultForUi(folder(-1));

        expect(deleteTargetSpy).not.toHaveBeenCalled();
      });
    });

    describe('TTY Handling', () => {
      it('Should run normally even if stdout is NOT TTY', () => {
        Object.defineProperty(process.stdout, 'isTTY', {
          value: false,
          configurable: true,
        });
        cliController.init();
        expect(scanSpy).toHaveBeenCalledTimes(1);
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
  });
});
