import {
  convertBytesToKB,
  convertBytesToGb,
  convertGBToMB,
  formatSize,
} from '../../src/utils/unit-conversions.js';
import { isSafeToDelete } from '../../src/utils/is-safe-to-delete.js';

describe('unit-conversions', () => {
  it('#convertBytesToKB', () => {
    expect(convertBytesToKB(1)).toBe(0.0009765625);
    expect(convertBytesToKB(100)).toBe(0.09765625);
    expect(convertBytesToKB(96)).toBe(0.09375);
  });

  it('#convertGBToMB', () => {
    expect(convertGBToMB(1)).toBe(1024);
    expect(convertGBToMB(100)).toBe(102400);
    expect(convertGBToMB(96)).toBe(98304);
  });

  it('#convertBytesToGb', () => {
    expect(convertBytesToGb(1)).toBeCloseTo(1.0 / Math.pow(1024, 3), 10);
    expect(convertBytesToGb(100)).toBeCloseTo(100 / Math.pow(1024, 3), 10);
    expect(convertBytesToGb(96)).toBeCloseTo(96 / Math.pow(1024, 3), 10);
  });

  describe('#formatSize', () => {
    it('should format sizes in auto mode - small sizes in MB without decimals', () => {
      const result = formatSize(0.5, 'auto'); // 512 MB
      expect(result.unit).toBe('MB');
      expect(result.value).toBe(512);
      expect(result.text).toBe('512 MB');
    });

    it('should format sizes in auto mode - large sizes in GB with decimals', () => {
      const result = formatSize(1.5, 'auto');
      expect(result.unit).toBe('GB');
      expect(result.value).toBe(1.5);
      expect(result.text).toBe('1.50 GB');
    });

    it('should format sizes in MB mode without decimals', () => {
      const result = formatSize(1.5, 'mb'); // 1536 MB
      expect(result.unit).toBe('MB');
      expect(result.value).toBe(1536);
      expect(result.text).toBe('1536 MB');
    });

    it('should format sizes in GB mode with decimals', () => {
      const result = formatSize(0.5, 'gb');
      expect(result.unit).toBe('GB');
      expect(result.value).toBe(0.5);
      expect(result.text).toBe('0.50 GB');
    });

    it('should round MB values to nearest integer', () => {
      const result = formatSize(0.123, 'mb'); // ~126.29 MB
      expect(result.unit).toBe('MB');
      expect(result.text).toBe('126 MB');
    });

    it('should use custom decimals for GB', () => {
      const result = formatSize(1.2345, 'gb', 3);
      expect(result.text).toBe('1.234 GB');
    });

    it('should switch to GB in auto mode when size >= 1024 MB', () => {
      const result = formatSize(1, 'auto'); // exactly 1024 MB = 1 GB
      expect(result.unit).toBe('GB');
      expect(result.text).toBe('1.00 GB');
    });
  });
});

describe('is-safe-to-delete', () => {
  const target = ['node_modules'];

  it('should get false if not is safe to delete ', () => {
    expect(isSafeToDelete('/one/route', target)).toBeFalsy();
    expect(isSafeToDelete('/one/node_/ro/modules', target)).toBeFalsy();
    expect(isSafeToDelete('nodemodules', target)).toBeFalsy();
    expect(isSafeToDelete('/', target)).toBeFalsy();
    expect(isSafeToDelete('/home', target)).toBeFalsy();
    expect(isSafeToDelete('/home/user', target)).toBeFalsy();
    expect(isSafeToDelete('/home/user/.angular', target)).toBeFalsy();
    expect(
      isSafeToDelete('/home/user/.angular', [...target, 'angular']),
    ).toBeFalsy();
    expect(isSafeToDelete('/home/user/dIst', [...target, 'dist'])).toBeFalsy();
  });

  it('should get true if is safe to delete ', () => {
    expect(isSafeToDelete('/one/route/node_modules', target)).toBeTruthy();
    expect(isSafeToDelete('/one/route/node_modules/', target)).toBeTruthy();
    expect(
      isSafeToDelete('/home/user/.angular', [...target, '.angular']),
    ).toBeTruthy();
    expect(isSafeToDelete('/home/user/dIst', [...target, 'dIst'])).toBeTruthy();
  });
});
