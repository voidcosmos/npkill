import {
  convertBytesToKB,
  convertBytesToGb,
  convertGBToMB,
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
});

describe('is-safe-to-delete', () => {
  const target = 'node_modules';

  it('should get false if not is safe to delete ', () => {
    expect(isSafeToDelete('/one/route', target)).toBeFalsy();
    expect(isSafeToDelete('/one/node_/ro/modules', target)).toBeFalsy();
    expect(isSafeToDelete('nodemodules', target)).toBeFalsy();
    expect(isSafeToDelete('/', target)).toBeFalsy();
    expect(isSafeToDelete('/home', target)).toBeFalsy();
    expect(isSafeToDelete('/home/user', target)).toBeFalsy();
  });

  it('should get true if is safe to delete ', () => {
    expect(isSafeToDelete('/one/route/node_modules', target)).toBeTruthy();
    expect(isSafeToDelete('/one/route/node_modules/', target)).toBeTruthy();
  });
});
