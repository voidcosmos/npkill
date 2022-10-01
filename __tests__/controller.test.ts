import { Controller } from '../src/controller.js';

jest.mock('../src/dirname.js', () => {
  return {};
});

describe('Controller test', () => {
  let controller;
  const linuxFilesServiceMock: any = jest.fn();
  const spinnerServiceMock: any = jest.fn();
  const UpdateServiceMock: any = jest.fn();
  const resultServiceMock: any = jest.fn();
  const consoleService: any = {
    getParameters: () => {
      return {};
    },
  };

  ////////// mocked Controller Methods
  let getArgumentsSpy;
  let showHelpSpy;
  let prepareScreenSpy;
  let setupEventsListenerSpy;
  let initializeLoadingStatusSpy;
  let scanSpy;
  let checkVersionSpy;
  let exitSpy;
  ///////////////////////////////////

  beforeEach(() => {
    exitSpy = jest.spyOn(process, 'exit').mockImplementation();
    controller = new Controller(
      linuxFilesServiceMock,
      spinnerServiceMock,
      consoleService,
      UpdateServiceMock,
      resultServiceMock,
    );
    getArgumentsSpy = jest.spyOn(controller, 'getArguments');
    showHelpSpy = jest.spyOn(controller, 'showHelp').mockImplementation();
    prepareScreenSpy = jest
      .spyOn(controller, 'prepareScreen')
      .mockImplementation();
    setupEventsListenerSpy = jest
      .spyOn(controller, 'setupEventsListener')
      .mockImplementation();
    initializeLoadingStatusSpy = jest
      .spyOn(controller, 'initializeLoadingStatus')
      .mockImplementation();
    scanSpy = jest.spyOn(controller, 'scan').mockImplementation();
    checkVersionSpy = jest
      .spyOn(controller, 'checkVersion')
      .mockImplementation();
  });

  it('#init normal start should call some methods', () => {
    controller.init();
    expect(showHelpSpy).toHaveBeenCalledTimes(0);
    expect(setupEventsListenerSpy).toHaveBeenCalledTimes(1);
    expect(scanSpy).toHaveBeenCalledTimes(1);
    expect(checkVersionSpy).toHaveBeenCalledTimes(1);
  });

  describe('#getArguments', () => {
    const mockParameters = (parameters) => {
      consoleService.getParameters = () => {
        return parameters;
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
    });

    it('#showHelp should called if --help flag is present and exit', () => {
      mockParameters({ help: true });
      controller.init();
      expect(exitSpy).toHaveBeenCalledTimes(1);
      expect(showHelpSpy).toHaveBeenCalledTimes(1);
    });

    it('#showProgramVersion should called if --version flag is present and exit', () => {
      mockParameters({ version: true });
      const functionSpy = jest
        .spyOn(controller, 'showProgramVersion')
        .mockImplementation();
      controller.init();
      expect(functionSpy).toHaveBeenCalledTimes(1);
      expect(exitSpy).toHaveBeenCalledTimes(1);
    });

    it('#showProgramVersion should called if --delete-all flag is present and exit', () => {
      mockParameters({ 'delete-all': true });
      const functionSpy = spyMethod('showObsoleteMessage');
      controller.init();
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
      it('Should print a error and exit if option is invalid', () => {
        mockParameters({ 'sort-by': 'novalid' });
        spyMethod('isValidSortParam', () => false);
        const functionSpy = spyMethod('print');
        controller.init();
        expect(functionSpy).toHaveBeenCalledTimes(1);
        expect(exitSpy).toHaveBeenCalledTimes(1);
      });

      // TODO test that check sortBy property is changed
    });
  });
});
