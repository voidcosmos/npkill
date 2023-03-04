import { jest } from '@jest/globals';

import { HttpsService } from '../src/services/https.service.js';
import { UpdateService } from '../src/services/update.service.js';

describe('update Service', () => {
  let updateService: UpdateService;
  let httpsService: HttpsService;

  beforeEach(() => {
    httpsService = new HttpsService();
    updateService = new UpdateService(httpsService);
  });

  describe('#isUpdated', () => {
    const cases = [
      {
        isUpdated: false,
        localVersion: '2.3.6',
        remoteVersion: '2.4.0',
      },
      {
        isUpdated: true,
        localVersion: '2.3.6',
        remoteVersion: '2.3.6',
      },
      {
        isUpdated: true,
        localVersion: '2.3.6',
        remoteVersion: '2.3.6-0',
      },
      {
        isUpdated: true,
        localVersion: '2.3.6',
        remoteVersion: '2.3.6-2',
      },
      {
        isUpdated: true,
        localVersion: '2.3.6-1',
        remoteVersion: '2.3.6-2',
      },
      {
        isUpdated: true,
        localVersion: '2.3.6',
        remoteVersion: '0.3.6',
      },
      {
        isUpdated: true,
        localVersion: '2.3.6',
        remoteVersion: '0.2.1',
      },
      {
        isUpdated: true,
        localVersion: '2.3.6',
        remoteVersion: '2.2.1',
      },
      {
        isUpdated: true,
        localVersion: '2.3.6',
        remoteVersion: '2.3.5',
      },
      {
        isUpdated: true,
        localVersion: '2.3.6',
        remoteVersion: '0.2.53',
      },
      {
        isUpdated: false,
        localVersion: '2.3.6',
        remoteVersion: '2.3.61',
      },
      {
        isUpdated: false,
        localVersion: '2.3.6',
        remoteVersion: '2.3.59',
      },
      {
        isUpdated: false,
        localVersion: '2.3.6',
        remoteVersion: '2.3.7',
      },
      {
        isUpdated: false,
        localVersion: '2.3.6-0',
        remoteVersion: '4.74.452',
      },
      {
        isUpdated: true,
        localVersion: '0.10.0',
        remoteVersion: '0.9.0',
      },
      {
        isUpdated: true,
        localVersion: '0.11.0',
        remoteVersion: '0.9.0',
      },
    ];

    cases.forEach((cas) => {
      it(`should check the local version ${cas.localVersion} is up to date with the remote ${cas.remoteVersion}`, (done) => {
        const mockResponse = `{"last-recomended-version": "${cas.remoteVersion}"}`;
        jest
          .spyOn(httpsService, 'getJson')
          .mockImplementation(() => Promise.resolve(JSON.parse(mockResponse)));

        updateService
          .isUpdated(cas.localVersion)
          .then((isUpdated) => {
            expect(isUpdated).toBe(cas.isUpdated);
            done();
          })
          .catch(done);
      });
    });
  });
});
