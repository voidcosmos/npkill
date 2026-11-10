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
    jest.clearAllMocks();
    logger = new LoggerService();
    jest.useFakeTimers().setSystemTime(fakeTime);
  });

  describe('add to log (info, error)', () => {
    it('should add the message to the log with the correct level and timestamp', () => {
      expect(logger.get()).toEqual([]);
      logger.info('Sample message1');
      logger.error('Sample message2');
      logger.error('Sample message3');
      logger.info('Sample message4');
      expect(logger.get()).toEqual([
        {
          level: 'info',
          timestamp: fakeTimeEpox,
          message: 'Sample message1',
        },
        {
          level: 'error',
          timestamp: fakeTimeEpox,
          message: 'Sample message2',
        },
        {
          level: 'error',
          timestamp: fakeTimeEpox,
          message: 'Sample message3',
        },
        {
          level: 'info',
          timestamp: fakeTimeEpox,
          message: 'Sample message4',
        },
      ]);
    });
  });

  describe('getEntries$', () => {
    it('should deliver in order the entries logged while replaying the previous ones', () => {
      logger.info('first');
      logger.info('second');
      const messages: string[] = [];

      logger.getEntries$().subscribe(({ message }) => {
        messages.push(message);
        if (message === 'first') {
          logger.info('third');
        }
      });

      expect(messages).toEqual(['first', 'second', 'third']);
    });
  });

  describe('get', () => {
    it.each<[string, 'all' | 'info' | 'error' | undefined, string[]]>([
      ['all logs by default', undefined, ['info', 'error', 'info']],
      ['all logs', 'all', ['info', 'error', 'info']],
      ['info logs', 'info', ['info', 'info']],
      ['error logs', 'error', ['error']],
    ])('should get %s', (_case, type, expectedTypes) => {
      logger.info('');
      logger.error('');
      logger.info('');

      expect(logger.get(type).map((entry) => entry.level)).toEqual(
        expectedTypes,
      );
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
