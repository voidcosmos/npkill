import {
  convertBytesToKB,
  convertBytesToGb,
  formatSize,
  FormattedSize,
} from '../../src/utils/unit-conversions.js';
import { isSafeToDelete } from '../../src/utils/is-safe-to-delete.js';
import { isOlderThan } from '../../src/utils/is-older-than.js';

describe('unit-conversions', () => {
  it('#convertBytesToKB', () => {
    expect(convertBytesToKB(1)).toBe(0.0009765625);
    expect(convertBytesToKB(100)).toBe(0.09765625);
    expect(convertBytesToKB(96)).toBe(0.09375);
  });

  it('#convertBytesToGb', () => {
    expect(convertBytesToGb(1)).toBeCloseTo(1.0 / Math.pow(1024, 3), 10);
  });

  describe('#formatSize', () => {
    it.each<
      [
        string,
        number,
        'auto' | 'mb' | 'gb',
        number | undefined,
        Partial<FormattedSize>,
      ]
    >([
      [
        'show small sizes in MB without decimals in auto mode',
        0.5,
        'auto',
        undefined,
        { unit: 'MB', value: 512, text: '512 MB' },
      ],
      [
        'show large sizes in GB with decimals in auto mode',
        1.5,
        'auto',
        undefined,
        { unit: 'GB', value: 1.5, text: '1.50 GB' },
      ],
      [
        'switch to GB in auto mode when size >= 1024 MB',
        1,
        'auto',
        undefined,
        { unit: 'GB', text: '1.00 GB' },
      ],
      [
        'show MB without decimals in MB mode',
        1.5,
        'mb',
        undefined,
        { unit: 'MB', value: 1536, text: '1536 MB' },
      ],
      [
        'round MB values to the nearest integer',
        0.123,
        'mb',
        undefined,
        { unit: 'MB', text: '126 MB' },
      ],
      [
        'show GB with decimals in GB mode',
        0.5,
        'gb',
        undefined,
        { unit: 'GB', value: 0.5, text: '0.50 GB' },
      ],
      ['use custom decimals for GB', 1.2345, 'gb', 3, { text: '1.234 GB' }],
    ])('should %s', (_case, sizeInGB, sizeUnit, decimals, expected) => {
      expect(formatSize(sizeInGB, sizeUnit, decimals)).toMatchObject(expected);
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

describe('is-older-than', () => {
  const now = new Date('2026-10-01T00:00:00Z').getTime();
  const daysAgo = (days: number) => now - days * 86400000;

  it('should return true when the result is older than the given days', () => {
    expect(isOlderThan(daysAgo(91), 90, now)).toBe(true);
    expect(isOlderThan(daysAgo(365), 90, now)).toBe(true);
  });

  it('should return false when the result is not older than the given days', () => {
    expect(isOlderThan(daysAgo(89), 90, now)).toBe(false);
    expect(isOlderThan(daysAgo(90), 90, now)).toBe(false);
    expect(isOlderThan(daysAgo(0), 90, now)).toBe(false);
  });

  it('should return false when the age is unknown', () => {
    expect(isOlderThan(-1, 90, now)).toBe(false);
    expect(isOlderThan(0, 90, now)).toBe(false);
    expect(isOlderThan(1, 90, now)).toBe(false);
  });
});
