import { jest } from '@jest/globals';
import { SpinnerService } from '../../../src/cli/services/spinner.service.js';

describe('Spinner Service', () => {
  let spinnerService: SpinnerService;

  beforeEach(() => {
    spinnerService = new SpinnerService();
  });

  describe('#setSpinner', () => {
    // it('should set spinner passed by argument', () => {});

    it('should reset count', () => {
      const resetFn = (spinnerService.reset = jest.fn());
      spinnerService.setSpinner([]);
      expect(resetFn).toHaveBeenCalled();
    });
  });

  describe('#nextFrame', () => {
    it('should get next frame in orden every call', () => {
      spinnerService.setSpinner(['a  ', ' b ', '  c']);
      expect(spinnerService.nextFrame()).toBe('a  ');
      expect(spinnerService.nextFrame()).toBe(' b ');
      expect(spinnerService.nextFrame()).toBe('  c');
      expect(spinnerService.nextFrame()).toBe('a  ');
    });
  });

  describe('#reset', () => {
    it('should set to first frame', () => {
      spinnerService.setSpinner(['1', '2', '3']);
      expect(spinnerService.nextFrame()).toBe('1');
      expect(spinnerService.nextFrame()).toBe('2');
      spinnerService.reset();
      expect(spinnerService.nextFrame()).toBe('1');
    });
  });
});
