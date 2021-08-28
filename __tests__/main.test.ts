const controllerConstructorMock = jest.fn();
const constructorInitMock = jest.fn();
const linuxServiceConstructorMock = jest.fn();
const mackServiceConstructorMock = jest.fn();
const windowsServiceConstructorMock = jest.fn();

jest.mock('../src/controller', () => ({
  Controller: controllerConstructorMock.mockImplementation(() => ({
    init: constructorInitMock,
  })),
}));

//#region mock of files services
jest.mock('../src/services/linux-files.service', () => ({
  LinuxFilesService: linuxServiceConstructorMock,
}));
jest.mock('../src/services/mac-files.service', () => ({
  MacFilesService: mackServiceConstructorMock,
}));
jest.mock('../src/services/windows-files.service', () => ({
  WindowsFilesService: windowsServiceConstructorMock,
}));
//#endregion

describe('main', () => {
  let main;
  beforeEach(() => {
    jest.resetModules();
    linuxServiceConstructorMock.mockClear();
    mackServiceConstructorMock.mockClear();
    windowsServiceConstructorMock.mockClear();
  });

  describe('Should load correct File Service based on the OS', () => {
    const SERVICES_MOCKS = [
      linuxServiceConstructorMock,
      mackServiceConstructorMock,
      windowsServiceConstructorMock,
    ];

    const mockOs = (platform: NodeJS.Platform) => {
      Object.defineProperty(process, 'platform', {
        value: platform,
      });
    };

    const testIfServiceIsIstanciated = (serviceMock) => {
      let servicesThatShouldNotBeCalled = [...SERVICES_MOCKS].filter(
        (service) => service !== serviceMock,
      );
      expect(serviceMock).toBeCalledTimes(0);
      main = require('../src/main');
      expect(serviceMock).toBeCalledTimes(1);
      servicesThatShouldNotBeCalled.forEach((service) =>
        expect(service).toBeCalledTimes(0),
      );
    };

    it('when OS is Linux', () => {
      mockOs('linux');
      testIfServiceIsIstanciated(linuxServiceConstructorMock);
    });

    it('when OS is MAC', () => {
      mockOs('darwin');
      testIfServiceIsIstanciated(mackServiceConstructorMock);
    });

    it('when OS is Windows', () => {
      mockOs('win32');
      testIfServiceIsIstanciated(windowsServiceConstructorMock);
    });
  });
});
