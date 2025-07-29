import { jest } from '@jest/globals';
import { StartParameters } from '../../src/cli/models/start-parameters.model.js';
import { Subject } from 'rxjs';
import { DeleteResult, Npkill } from '../../src/core/index.js';

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
jest.unstable_mockModule('../../src/cli/ui/components/help.ui.js', () => ({
  HelpUi: jest.fn(),
}));
jest.unstable_mockModule('../../src/cli/ui/components/results.ui.js', () => ({
  ResultsUi: jest.fn(() => ({
    delete$: resultsUiDeleteMock$,
    showErrors$: { subscribe: jest.fn() },
    openFolder$: { subscribe: jest.fn() },
    showDetails$: { subscribe: jest.fn() },
    endNpkill$: { subscribe: jest.fn() },
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

const CliControllerConstructor = //@ts-ignore
  (await import('../../src/cli/cli.controller.js')).CliController;
class CliController extends CliControllerConstructor {}

describe('CliController test', () => {
  let cliController;

  const filesServiceDeleteMock = jest
    .fn<() => Promise<boolean>>()
    .mockResolvedValue(true);
  const filesServiceFakeDeleteMock = jest
    .fn<() => Promise<boolean>>()
    .mockResolvedValue(true);

  const linuxFilesServiceMock: any = {
    getFileContent: jest.fn().mockReturnValue('{}'),
    isValidRootFolder: jest.fn().mockReturnValue({ isValid: true }),
    isSafeToDelete: jest.fn().mockReturnValue(true),
    deleteDir: filesServiceDeleteMock,
    fakeDeleteDir: filesServiceFakeDeleteMock,
  };
  const spinnerServiceMock: any = jest.fn();
  const updateServiceMock: any = jest.fn();
  const resultServiceMock: any = jest.fn();
  const searchStatusMock: any = jest.fn();
  const loggerServiceMock: any = {
    info: jest.fn(),
    error: jest.fn(),
    getSuggestLogFilePath: jest.fn(),
    saveToFile: jest.fn(),
  };
  const uiServiceMock: any = {
    add: jest.fn(),
    print: jest.fn(),
    setRawMode: jest.fn(),
    setCursorVisible: jest.fn(),
  };
  const consoleServiceMock: any = {
    getParameters: () => new StartParameters(),
    isRunningBuild: () => false,
    startListenKeyEvents: jest.fn(),
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

  ////////// mocked Controller Methods
  let parseArgumentsSpy;
  let showHelpSpy;
  let prepareScreenSpy;
  let setupEventsListenerSpy;
  let initializeLoadingStatusSpy;
  let scanSpy;
  let checkVersionSpy;
  let exitSpy;
  ///////////////////////////////////

  beforeEach(() => {
    exitSpy = jest.spyOn(process, 'exit').mockImplementation((number) => {
      throw new Error('process.exit: ' + number);
    });
    cliController = new CliController(
      npkillMock,
      loggerServiceMock,
      searchStatusMock,
      resultServiceMock,
      spinnerServiceMock,
      consoleServiceMock,
      updateServiceMock,
      uiServiceMock,
    );

    Object.defineProperty(process.stdout, 'columns', { value: 80 });
    Object.defineProperty(process.stdout, 'isTTY', { value: true });

    parseArgumentsSpy = jest.spyOn(cliController, 'parseArguments');
    showHelpSpy = jest
      .spyOn(cliController, 'showHelp')
      .mockImplementation(() => ({}));
    prepareScreenSpy = jest
      .spyOn(cliController, 'prepareScreen')
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
    const mockParameters = (parameters: Object) => {
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
      });

      it('Should show a warning before start scan', () => {
        mockParameters({ 'delete-all': true });
        expect(setDeleteAllWarningVisibilityMock).toHaveBeenCalledTimes(0);
        expect(scanSpy).toHaveBeenCalledTimes(0);

        cliController.init();
        expect(setDeleteAllWarningVisibilityMock).toHaveBeenCalledTimes(1);
        expect(scanSpy).toHaveBeenCalledTimes(0);
      });

      it('Should no show a warning if -y is given', () => {
        mockParameters({ 'delete-all': true, yes: true });
        expect(setDeleteAllWarningVisibilityMock).toHaveBeenCalledTimes(0);
        expect(scanSpy).toHaveBeenCalledTimes(0);

        cliController.init();
        expect(setDeleteAllWarningVisibilityMock).toHaveBeenCalledTimes(0);
        expect(scanSpy).toHaveBeenCalledTimes(1);
      });
    });

    describe('--dry-run', () => {
      let testFolder: DeleteResult;

      beforeEach(() => {
        testFolder = {
          path: '/my/path/node_modules',
          success: true,
        };
        jest.clearAllMocks();
      });

      it('Should call normal deleteDir function when no --dry-run is included', () => {
        mockParameters({ targets: ['node_modules'], 'dry-run': 'false' });
        cliController.init();

        expect(npkillDeleteMock).toHaveBeenCalledTimes(0);

        resultsUiDeleteMock$.next(testFolder);

        expect(npkillDeleteMock).toHaveBeenCalledTimes(1);
        expect(npkillDeleteMock).toHaveBeenCalledWith(testFolder.path, {
          dryRun: false,
        });
      });

      it('Should call fake deleteDir function instead of deleteDir', () => {
        mockParameters({ targets: ['node_modules'], 'dry-run': true });
        cliController.init();

        expect(npkillDeleteMock).toHaveBeenCalledTimes(0);

        resultsUiDeleteMock$.next(testFolder);

        expect(npkillDeleteMock).toHaveBeenCalledTimes(1);
        expect(npkillDeleteMock).toHaveBeenCalledWith(testFolder.path, {
          dryRun: true,
        });
      });
    });
  });
});
