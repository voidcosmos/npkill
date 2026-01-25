import { jest } from '@jest/globals';
import { UiService } from '../../../src/cli/services/ui.service.js';

jest.mock('../../../src/dirname.js', () => {
  return {};
});

describe('UiService', () => {
  let uiService: UiService;
  let stdinMock: any;
  let stdoutMock: any;

  beforeEach(() => {
    stdinMock = {
      isTTY: true,
      setRawMode: jest.fn(),
      resume: jest.fn(),
      on: jest.fn(),
    };
    stdoutMock = {
      write: jest.fn(),
    };

    // Mock process.stdout and process.stdin
    Object.defineProperty(process, 'stdin', {
      value: stdinMock,
      configurable: true,
    });
    Object.defineProperty(process, 'stdout', {
      value: stdoutMock,
      configurable: true,
    });

    uiService = new UiService();
    // Inject the mocked stdin into the service instance as it's assigned in the property declaration
    uiService.stdin = stdinMock;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('setRawMode', () => {
    it('should call setRawMode when stdin is TTY', () => {
      uiService.setRawMode(true);
      expect(stdinMock.setRawMode).toHaveBeenCalledWith(true);
      expect(stdinMock.resume).toHaveBeenCalled();
    });

    it('should NOT call setRawMode when stdin is NOT TTY', () => {
      // update mock to simulate non-TTY
      stdinMock.isTTY = false;

      uiService.setRawMode(true);
      expect(stdinMock.setRawMode).not.toHaveBeenCalled();
      expect(stdinMock.resume).toHaveBeenCalled(); // Resume should still be called
    });
  });
});
