import { HttpsService } from '../src/services/https.service';
import * as https from 'https';
import { EventEmitter } from 'events';

const httpGetMock = jest.fn();

// TODO need to fix
xdescribe('Http Service', () => {
  let httpsService: HttpsService;
  beforeEach(() => {
    httpsService = new HttpsService();
  });

  describe('#get', () => {
    const emitter = new EventEmitter();
    const httpIncomingMessage = {
      on: jest.fn(),
      statusCode: '200',
      headers: {
        authorization: '',
      },
    };
    /* https.get = jest.fn().mockImplementation((uri, callback?) => {
      if (callback) {
        callback(httpIncomingMessage);
      }
      return emitter;
    }); */

    it('Should call #https.get', () => {
      httpsService.get('https://black.com');
      expect(httpGetMock).toBeCalledTimes(1);
    });
  });
});
