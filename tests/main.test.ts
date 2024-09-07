import { jest } from '@jest/globals';

const controllerConstructorMock = jest.fn();
const constructorInitMock = jest.fn();
const linuxServiceConstructorMock = jest.fn();
const mackServiceConstructorMock = jest.fn();
const windowsServiceConstructorMock = jest.fn();
const fileWorkerServiceConstructorMock = jest.fn();

jest.mock('../src/cli/controller', () => ({
  Controller: controllerConstructorMock.mockImplementation(() => ({
    init: constructorInitMock,
    fileService: {
      getFileContent: jest.fn().mockReturnValue('{}'),
    },
  })),
}));

//#region mock of files services
jest.unstable_mockModule(
  '../src/core/services/files/linux-files.service',
  () => ({
    LinuxFilesService: linuxServiceConstructorMock,
  }),
);
jest.unstable_mockModule(
  '../src/core/services/files/mac-files.service',
  () => ({
    MacFilesService: mackServiceConstructorMock,
  }),
);
jest.unstable_mockModule(
  '../src/core/services/files/windows-files.service',
  () => ({
    WindowsFilesService: windowsServiceConstructorMock,
  }),
);
jest.unstable_mockModule(
  '../src/core/services/files/files.worker.service',
  () => ({
    FileWorkerService: fileWorkerServiceConstructorMock,
  }),
);
//#endregion

xdescribe('main', () => {
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

    const testIfServiceIsIstanciated = async (serviceMock) => {
      let servicesThatShouldNotBeCalled = [...SERVICES_MOCKS].filter(
        (service) => service !== serviceMock,
      );
      expect(serviceMock).toBeCalledTimes(0);
      main = await import('../src/main');
      main.default();
      expect(serviceMock).toBeCalledTimes(1);
      servicesThatShouldNotBeCalled.forEach((service) =>
        expect(service).toBeCalledTimes(0),
      );
    };

    it('when OS is Linux', async () => {
      mockOs('linux');
      await testIfServiceIsIstanciated(linuxServiceConstructorMock);
    });

    it('when OS is MAC', async () => {
      mockOs('darwin');
      await testIfServiceIsIstanciated(mackServiceConstructorMock);
    });

    it('when OS is Windows', async () => {
      mockOs('win32');
      await testIfServiceIsIstanciated(windowsServiceConstructorMock);
    });
  });
});
