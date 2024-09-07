import { jest } from '@jest/globals';
import { StartParameters } from '../../src/cli/models/start-parameters.model.js';
import { Subject } from 'rxjs';
import { Folder } from '../../src/core/interfaces/folder.interface.js';
import { Npkill } from '../../src/core/index.js';

const resultsUiDeleteMock$ = new Subject<Folder>();
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
  BaseUi: { setVisible: jest.fn() },
}));
jest.unstable_mockModule('../../src/cli/ui/heavy.ui.js', () => ({
  HeavyUi: {},
}));

const ControllerConstructor = //@ts-ignore
  (await import('../../src/cli/controller.js')).Controller;
class Controller extends ControllerConstructor {}

describe('Controller test', () => {
  let controller;

  const filesServiceDeleteMock = jest
    .fn<() => Promise<boolean>>()
    .mockResolvedValue(true);
  const filesServiceFakeDeleteMock = jest
    .fn<() => Promise<boolean>>()
    .mockResolvedValue(true);

  const linuxFilesServiceMock: any = {
    getFileContent: jest.fn().mockReturnValue('{}'),
    isValidRootFolder: jest.fn().mockReturnValue('true'),
    isSafeToDelete: jest.fn().mockReturnValue('true'),
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

  const npkillMock: Npkill = {
    logger: loggerServiceMock,
    getFileService: () => linuxFilesServiceMock,
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
    controller = new Controller(
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

    parseArgumentsSpy = jest.spyOn(controller, 'parseArguments');
    showHelpSpy = jest
      .spyOn(controller, 'showHelp')
      .mockImplementation(() => ({}));
    prepareScreenSpy = jest
      .spyOn(controller, 'prepareScreen')
      .mockImplementation(() => ({}));
    setupEventsListenerSpy = jest
      .spyOn(controller, 'setupEventsListener')
      .mockImplementation(() => ({}));
    scanSpy = jest.spyOn(controller, 'scan').mockImplementation(() => ({}));
    checkVersionSpy = jest
      .spyOn(controller, 'checkVersion')
      .mockImplementation(() => ({}));
  });

  it('#init normal start should call some methods', () => {
    controller.init();
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
      return jest.spyOn(controller, method).mockImplementation(fn);
    };

    afterEach(() => {
      jest.spyOn(process, 'exit').mockReset();
      mockParameters({});
    });

    it('#showHelp should called if --help flag is present and exit', () => {
      mockParameters({ help: true });
      expect(() => controller.init()).toThrow();
      expect(showHelpSpy).toHaveBeenCalledTimes(1);
      expect(exitSpy).toHaveBeenCalledTimes(1);
    });

    it('#showProgramVersion should called if --version flag is present and exit', () => {
      mockParameters({ version: true });
      const functionSpy = jest
        .spyOn(controller, 'showProgramVersion')
        .mockImplementation(() => ({}));
      expect(() => controller.init()).toThrow();
      expect(functionSpy).toHaveBeenCalledTimes(1);
      expect(exitSpy).toHaveBeenCalledTimes(1);
    });

    it('#checkVersionn should not be called if --no-check-updates is given', () => {
      mockParameters({ 'no-check-updates': true });
      const functionSpy = spyMethod('checkVersion');
      controller.init();
      expect(functionSpy).toHaveBeenCalledTimes(0);
    });

    describe('--sort-by parameter   ', () => {
      it('Should detect if option is invalid', () => {
        mockParameters({ 'sort-by': 'novalid' });
        spyMethod('isValidSortParam', () => false);
        const functionSpy = spyMethod('invalidSortParam');
        controller.init();
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

        controller.init();
        expect(setDeleteAllWarningVisibilityMock).toHaveBeenCalledTimes(1);
        expect(scanSpy).toHaveBeenCalledTimes(0);
      });

      it('Should no show a warning if -y is given', () => {
        mockParameters({ 'delete-all': true, yes: true });
        expect(setDeleteAllWarningVisibilityMock).toHaveBeenCalledTimes(0);
        expect(scanSpy).toHaveBeenCalledTimes(0);

        controller.init();
        expect(setDeleteAllWarningVisibilityMock).toHaveBeenCalledTimes(0);
        expect(scanSpy).toHaveBeenCalledTimes(1);
      });
    });

    describe('--dry-run', () => {
      let testFolder: Folder;

      beforeEach(() => {
        testFolder = {
          path: '/my/path',
          size: 0,
          modificationTime: 0,
          isDangerous: false,
          status: 'live',
        };
        jest.clearAllMocks();
      });

      it('Should call normal deleteDir function when no --dry-run is included', () => {
        controller.init();

        expect(filesServiceDeleteMock).toHaveBeenCalledTimes(0);
        expect(filesServiceFakeDeleteMock).toHaveBeenCalledTimes(0);

        resultsUiDeleteMock$.next(testFolder);

        expect(filesServiceFakeDeleteMock).toHaveBeenCalledTimes(0);
        expect(filesServiceDeleteMock).toHaveBeenCalledTimes(1);
        expect(filesServiceDeleteMock).toHaveBeenCalledWith(testFolder.path);
      });

      it('Should call fake deleteDir function instead of deleteDir', () => {
        mockParameters({ 'dry-run': true });
        controller.init();

        expect(filesServiceDeleteMock).toHaveBeenCalledTimes(0);
        expect(filesServiceFakeDeleteMock).toHaveBeenCalledTimes(0);

        resultsUiDeleteMock$.next(testFolder);

        expect(filesServiceDeleteMock).toHaveBeenCalledTimes(0);
        expect(filesServiceFakeDeleteMock).toHaveBeenCalledTimes(1);
        expect(filesServiceFakeDeleteMock).toHaveBeenCalledWith(
          testFolder.path,
        );
      });
    });
  });
});
