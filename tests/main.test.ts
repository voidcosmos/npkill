import { jest } from '@jest/globals';

const initMock = jest.fn();
const cliControllerMock = jest.fn(() => ({ init: initMock }));

jest.unstable_mockModule('../src/cli/cli.controller.js', () => ({
  CliController: cliControllerMock,
}));

const { default: main } = await import('../src/main.js');

describe('main', () => {
  it('should build the cli and start it', () => {
    main();

    expect(cliControllerMock).toHaveBeenCalledTimes(1);
    expect(initMock).toHaveBeenCalledTimes(1);
  });
});
