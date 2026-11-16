import { jest } from '@jest/globals';
import {
  TextOutputService,
  TextOutputOptions,
} from '../../../src/cli/services/text-output.service.js';
import { CliScanFoundTarget } from '../../../src/cli/interfaces/stats.interface.js';

const makeResult = (
  overrides: Partial<CliScanFoundTarget> = {},
): CliScanFoundTarget => ({
  path: '/test/node_modules',
  size: 0.5,
  modificationTime: 1640995200000,
  status: 'live',
  ...overrides,
});

describe('TextOutputService', () => {
  let service: TextOutputService;
  let stdout: { write: jest.Mock };
  let stderr: { write: jest.Mock };

  const written = (stream: { write: jest.Mock }) =>
    stream.write.mock.calls.map(([text]) => text as string).join('');

  const start = (options: Partial<TextOutputOptions> = {}) =>
    service.initializeSession({
      sizeUnit: 'auto',
      measuresSize: true,
      dryRun: false,
      ...options,
    });

  beforeEach(() => {
    stdout = { write: jest.fn() };
    stderr = { write: jest.fn() };
    service = new TextOutputService(
      stdout as unknown as NodeJS.WriteStream,
      stderr as unknown as NodeJS.WriteStream,
    );
  });

  it('should print each deleted folder and a summary', () => {
    start();
    service.processResult(makeResult({ path: '/a/node_modules' }), {
      path: '/a/node_modules',
      success: true,
    });
    service.processResult(makeResult({ path: '/b/node_modules', size: 1 }), {
      path: '/b/node_modules',
      success: true,
    });
    service.completeScan();

    expect(written(stdout)).toBe(
      'Deleted /a/node_modules (512 MB)\n' +
        'Deleted /b/node_modules (1.00 GB)\n' +
        'Done: deleted 2 folders, freed 1.50 GB.\n',
    );
    expect(stderr.write).not.toHaveBeenCalled();
  });

  it('should print failures to stderr and count them in the summary', () => {
    start();
    service.processResult(makeResult(), {
      path: '/test/node_modules',
      success: false,
      error: { message: 'Permission denied' },
    });
    service.completeScan();

    expect(written(stderr)).toBe(
      'Failed to delete /test/node_modules: Permission denied\n',
    );
    expect(written(stdout)).toBe(
      'Done: deleted 0 folders, freed 0 MB, 1 failed.\n',
    );
  });

  it('should leave sizes out when they are not measured', () => {
    start({ measuresSize: false });
    service.processResult(makeResult(), {
      path: '/test/node_modules',
      success: true,
    });
    service.completeScan();

    expect(written(stdout)).toBe(
      'Deleted /test/node_modules\nDone: deleted 1 folder.\n',
    );
  });

  it('should say what would happen in a dry run', () => {
    start({ dryRun: true, sizeUnit: 'gb' });
    service.processResult(makeResult(), {
      path: '/test/node_modules',
      success: true,
    });
    service.completeScan();

    expect(written(stdout)).toBe(
      'Would delete /test/node_modules (0.50 GB)\n' +
        'Dry run: would delete 1 folder, would free 0.50 GB.\n',
    );
  });

  it('should say when nothing was found', () => {
    start();
    service.completeScan();

    expect(written(stdout)).toBe('No folders found to delete.\n');
  });

  it('should ignore results without a deletion', () => {
    start();
    service.processResult(makeResult());

    expect(stdout.write).not.toHaveBeenCalled();
  });

  it('should print the summary only once when interrupted', () => {
    start();
    service.handleShutdown();
    service.completeScan();

    expect(written(stderr)).toContain('Interrupted');
    expect(written(stdout)).toBe('No folders found to delete.\n');
  });

  it('should print errors to stderr', () => {
    start();
    service.writeError(new Error('Cannot scan /missing'));

    expect(written(stderr)).toBe('Error: Cannot scan /missing\n');
  });
});
