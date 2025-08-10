import { jest } from '@jest/globals';

const controllerConstructorMock = jest.fn();
const constructorInitMock = jest.fn();
const unixServiceConstructorMock = jest.fn();
const windowsServiceConstructorMock = jest.fn();
const fileWorkerServiceConstructorMock = jest.fn();

jest.mock('../src/cli/cli.controller', () => ({
  CliController: controllerConstructorMock.mockImplementation(() => ({
    init: constructorInitMock,
    fileService: {
      getFileContent: jest.fn().mockReturnValue('{}'),
    },
  })),
}));

//#region mock of files services
jest.unstable_mockModule(
  '../src/core/services/files/unix-files.service',
  () => ({
    UnixFilesService: unixServiceConstructorMock,
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
    unixServiceConstructorMock.mockClear();
    windowsServiceConstructorMock.mockClear();
  });

  describe('Should load correct File Service based on the OS', () => {
    const SERVICES_MOCKS = [
      unixServiceConstructorMock,
      windowsServiceConstructorMock,
    ];

    const mockOs = (platform: NodeJS.Platform) => {
      Object.defineProperty(process, 'platform', {
        value: platform,
      });
    };

    const testIfServiceIsIstanciated = async (serviceMock) => {
      const servicesThatShouldNotBeCalled = [...SERVICES_MOCKS].filter(
        (service) => service !== serviceMock,
      );
      expect(serviceMock).toHaveBeenCalledTimes(0);
      main = await import('../src/main.js');
      main.default();
      expect(serviceMock).toHaveBeenCalledTimes(1);
      servicesThatShouldNotBeCalled.forEach((service) =>
        expect(service).toHaveBeenCalledTimes(0),
      );
    };

    it('when OS is Linux', async () => {
      mockOs('linux');
      await testIfServiceIsIstanciated(unixServiceConstructorMock);
    });

    it('when OS is MAC', async () => {
      mockOs('darwin');
      await testIfServiceIsIstanciated(unixServiceConstructorMock);
    });

    it('when OS is Windows', async () => {
      mockOs('win32');
      await testIfServiceIsIstanciated(windowsServiceConstructorMock);
    });
  });
});
