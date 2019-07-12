import { SpinnerService } from '../src/services/spinner.service';

describe('Spinner Service', () => {
  let spinnerService: SpinnerService;

  beforeAll(() => {
    spinnerService = new SpinnerService();
  });

  describe('#setSpinner', () => {
    //it('should set spinner passed by argument', () => {});

    it('should reset count', () => {
      const resetFn = (spinnerService.reset = jest.fn());
      spinnerService.setSpinner([]);
      expect(resetFn).toBeCalled();
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

  /* describe('#reset', () => {
    it('should set count to -1', () => {});
  }); */
});
