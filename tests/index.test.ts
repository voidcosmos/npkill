import { jest } from '@jest/globals';

const mainMock = jest.fn();

jest.unstable_mockModule('../src/main.js', () => ({
  default: mainMock,
}));

describe('package entry points', () => {
  beforeEach(() => {
    jest.resetModules();
    mainMock.mockClear();
  });

  it('should not start the cli when the library is imported', async () => {
    const library = await import('../src/index.js');

    expect(library.Npkill).toBeDefined();
    expect(mainMock).not.toHaveBeenCalled();
  });

  it('should start the cli when the bin is executed', async () => {
    await import('../src/cli.js');

    expect(mainMock).toHaveBeenCalledTimes(1);
  });
});
