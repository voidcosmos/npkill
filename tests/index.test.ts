import { jest } from '@jest/globals';

const mainMock = jest.fn();
const fileURLToPathMock = jest.fn();

jest.unstable_mockModule('url', () => ({
  fileURLToPath: fileURLToPathMock,
}));

jest.unstable_mockModule('../src/main.js', () => ({
  default: mainMock,
}));

describe('index.ts', () => {
  beforeEach(() => {
    jest.resetModules();
    mainMock.mockClear();
    fileURLToPathMock.mockClear();
  });

  it('should call main when npkill is called directly from the command line', async () => {
    fileURLToPathMock.mockReturnValue('/path/to/index.ts');
    process.argv[1] = '/path/to/index.ts';

    await importIndex();

    expect(mainMock).toHaveBeenCalled();
  });

  it('should not call main when npkill is imported as a module', async () => {
    fileURLToPathMock.mockReturnValue('/path/to/index.ts');
    process.argv[1] = '/path/to/anotherModule.ts';

    await importIndex();

    expect(mainMock).not.toHaveBeenCalled();
  });
});

function importIndex() {
  return import('../src/index');
}
