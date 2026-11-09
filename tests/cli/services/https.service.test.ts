import { jest } from '@jest/globals';
import { EventEmitter } from 'events';

let statusCodeMock = 200;
const eventEmitter = new EventEmitter();
const eventEmitter2 = new EventEmitter();
const response = () => ({
  statusCode: statusCodeMock,
  setEncoding: jest.fn(),
  on: (eventName: string, listener: (...args: unknown[]) => void) =>
    eventEmitter2.on(eventName, listener),
});

jest.unstable_mockModule('node:https', () => ({
  get: (url, cb) => {
    cb(response());
    return eventEmitter;
  },
}));

const HttpsServiceConstructor = (
  await import('../../../src/cli/services/https.service.js')
).HttpsService;
class HttpsService extends HttpsServiceConstructor {}

describe('Http Service', () => {
  let httpsService: HttpsService;
  beforeEach(() => {
    httpsService = new HttpsService();
  });

  describe('#get', () => {
    beforeEach(() => {
      statusCodeMock = 200;
      eventEmitter.removeAllListeners();
      eventEmitter2.removeAllListeners();
    });

    it('should reject if a error ocurr', async () => {
      const errorMsg = 'test error';
      const request = httpsService.getJson('http://sampleUrl');

      eventEmitter.emit('error', new Error(errorMsg));

      await expect(request).rejects.toThrow(errorMsg);
    });

    it.each([101, 404])(
      'should reject if the code of the response indicate error (%p)',
      async (statusCode) => {
        statusCodeMock = statusCode;

        await expect(
          httpsService.getJson('http://sampleUrl'),
        ).rejects.toThrow();
      },
    );

    it('should resolve with all chunks of data on end', async () => {
      const chunks = ['{"key1"', ':"test","ke', 'y2":"p', 'assed"}'];
      const request = httpsService.getJson('http://sampleUrl');

      chunks.forEach((chunk) => eventEmitter2.emit('data', chunk));
      eventEmitter2.emit('end');

      await expect(request).resolves.toEqual({
        key1: 'test',
        key2: 'passed',
      });
    });

    it('should reject if the body is not valid JSON', async () => {
      const request = httpsService.getJson('http://sampleUrl');

      eventEmitter2.emit('data', '<html>Rate limited</html>');
      eventEmitter2.emit('end');

      await expect(request).rejects.toThrow(SyntaxError);
    });
  });
});
