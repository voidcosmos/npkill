import { jest } from '@jest/globals';
import { normalize } from 'path';

const writeFileSyncMock = jest.fn();
const renameFileSyncMock = jest.fn();
const existsSyncMock = jest.fn();
jest.unstable_mockModule('fs', () => {
  return {
    writeFileSync: writeFileSyncMock,
    existsSync: existsSyncMock,
    renameSync: renameFileSyncMock,
    default: jest.fn(),
  };
});

const osTmpPath = '/tmpDir';
jest.unstable_mockModule('os', () => {
  return {
    tmpdir: () => osTmpPath,
  };
});

const LoggerServiceConstructor = (
  await import('../../../src/core/services/logger.service.js')
).LoggerService;
class LoggerService extends LoggerServiceConstructor {}

describe('LoggerService', () => {
  let logger: LoggerService;
  const fakeTime = new Date('2026-01-01');
  const fakeTimeEpox = fakeTime.getTime();

  beforeEach(() => {
    logger = new LoggerService();
    jest.useFakeTimers().setSystemTime(fakeTime);
  });

  describe('add to log (info, error)', () => {
    it('should add the message to the log with the correct type and timestamp', () => {
      expect(logger.get()).toEqual([]);
      logger.info('Sample message1');
      logger.error('Sample message2');
      logger.error('Sample message3');
      logger.info('Sample message4');
      expect(logger.get()).toEqual([
        {
          type: 'info',
          timestamp: fakeTimeEpox,
          message: 'Sample message1',
        },
        {
          type: 'error',
          timestamp: fakeTimeEpox,
          message: 'Sample message2',
        },
        {
          type: 'error',
          timestamp: fakeTimeEpox,
          message: 'Sample message3',
        },
        {
          type: 'info',
          timestamp: fakeTimeEpox,
          message: 'Sample message4',
        },
      ]);
    });
  });

  describe('get', () => {
    it('should get "all" logs (by default or explicit)', () => {
      expect(logger.get()).toEqual([]);
      logger.info('');
      logger.error('');
      logger.info('');

      const expected = ['info', 'error', 'info'];

      expect(logger.get().map((entry) => entry.type)).toEqual(expected);
      expect(logger.get('all').map((entry) => entry.type)).toEqual(expected);
    });

    it('should get "info" logs', () => {
      logger.info('');
      logger.error('');
      logger.info('');

      const expected = ['info', 'info'];

      expect(logger.get('info').map((entry) => entry.type)).toEqual(expected);
    });

    it('should get "error" logs', () => {
      logger.info('');
      logger.error('');
      logger.info('');

      const expected = ['error'];

      expect(logger.get('error').map((entry) => entry.type)).toEqual(expected);
    });
  });

  describe('getSuggestLogfilePath', () => {
    it('the path should includes the os tmp dir', () => {
      const path = logger.getSuggestLogFilePath();
      expect(path.includes(normalize('/tmpDir'))).toBeTruthy();
    });
  });

  describe('LogFile rotation', () => {
    it('should not rotate file if not exist', () => {
      existsSyncMock.mockReturnValue(false);
      const path = logger.getSuggestLogFilePath();
      logger.saveToFile(path);
      expect(renameFileSyncMock).not.toHaveBeenCalled();
    });

    it('should rotate file if exist', () => {
      existsSyncMock.mockReturnValue(true);
      const path = logger.getSuggestLogFilePath();
      logger.saveToFile(path);
      const expectedOldPath = path.replace('latest', 'old');
      expect(renameFileSyncMock).toHaveBeenCalledWith(path, expectedOldPath);
    });
  });

  describe('saveToFile', () => {
    it('shoul write the content of the log to a given file', () => {
      const path = '/tmp/npkill-log.log';
      logger.info('hello');
      logger.error('bye');
      logger.info('world');
      const expected =
        '[1767225600000](info) hello\n' +
        '[1767225600000](error) bye\n' +
        '[1767225600000](info) world\n';

      logger.saveToFile(path);
      expect(writeFileSyncMock).toHaveBeenCalledWith(path, expected);
    });
  });
});
