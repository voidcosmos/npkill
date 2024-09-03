import { jest } from '@jest/globals';
import { EventEmitter } from 'events';

let statusCodeMock = 200;
const eventEmitter = new EventEmitter();
const eventEmitter2 = new EventEmitter();
const response = () => ({
  statusCode: statusCodeMock,
  setEncoding: jest.fn(),
  on: (eventName: string, listener: (...args: any[]) => void) =>
    eventEmitter2.on(eventName, listener),
});

jest.unstable_mockModule('node:https', () => ({
  get: (url, cb) => {
    cb(response());
    return eventEmitter;
  },
}));

const HttpsServiceConstructor = //@ts-ignore
  (await import('../src/services/https.service.js')).HttpsService;
class HttpsService extends HttpsServiceConstructor {}

describe('Http Service', () => {
  let httpsService: HttpsService;
  beforeEach(() => {
    httpsService = new HttpsService();
  });

  describe('#get', () => {
    beforeEach(() => {
      statusCodeMock = 200;
    });

    it('should reject if a error ocurr', (done) => {
      const errorMsg = 'test error';
      httpsService
        .getJson('http://sampleUrl')
        .then()
        .catch((error: Error) => {
          expect(error.message).toBe(errorMsg);
          done();
        });
      eventEmitter.emit('error', new Error(errorMsg));
    });

    it('should reject if the code of the response indicate error (101)', (done) => {
      statusCodeMock = 101;
      httpsService
        .getJson('http://sampleUrl')
        .then()
        .catch(() => {
          done();
        });
    });

    it('should reject if the code of the response indicate error (404)', (done) => {
      statusCodeMock = 404;
      httpsService
        .getJson('http://sampleUrl')
        .then()
        .catch(() => {
          done();
        });
    });

    it('should resolve with all chunks of data on end', (done) => {
      const chunks = ['{"key1"', ':"test","ke', 'y2":"p', 'assed"}'];
      const expected = {
        key1: 'test',
        key2: 'passed',
      };

      httpsService.getJson('http://sampleUrl').then((data) => {
        expect(data).toEqual(expected);
        done();
      });

      chunks.forEach((chunk) => eventEmitter2.emit('data', chunk));
      eventEmitter2.emit('end');
    });
  });
});
