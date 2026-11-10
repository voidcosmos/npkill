import { jest } from '@jest/globals';
import { UiService } from '../../../src/cli/services/ui.service.js';

describe('UiService', () => {
  let uiService: UiService;
  let stdinMock: any;

  beforeEach(() => {
    stdinMock = {
      isTTY: true,
      setRawMode: jest.fn(),
      resume: jest.fn(),
      on: jest.fn(),
    };

    Object.defineProperty(process, 'stdin', {
      value: stdinMock,
      configurable: true,
    });

    uiService = new UiService();
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
