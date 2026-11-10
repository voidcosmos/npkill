import { jest } from '@jest/globals';

import { HttpsService } from '../../../src/cli/services/https.service.js';
import { UpdateService } from '../../../src/cli/services/update.service.js';

describe('update Service', () => {
  let updateService: UpdateService;
  let httpsService: HttpsService;

  beforeEach(() => {
    httpsService = new HttpsService();
    updateService = new UpdateService(httpsService);
  });

  describe('#isUpdated', () => {
    it.each([
      { isUpdated: false, localVersion: '2.3.6', remoteVersion: '2.4.0' },
      { isUpdated: true, localVersion: '2.3.6', remoteVersion: '2.3.6' },
      { isUpdated: true, localVersion: '2.3.6', remoteVersion: '2.3.6-0' },
      { isUpdated: true, localVersion: '2.3.6-1', remoteVersion: '2.3.6-2' },
      { isUpdated: true, localVersion: '2.3.6', remoteVersion: '0.3.6' },
      { isUpdated: true, localVersion: '2.3.6', remoteVersion: '2.3.5' },
      { isUpdated: false, localVersion: '2.3.6', remoteVersion: '2.3.61' },
      { isUpdated: false, localVersion: '2.3.6', remoteVersion: '2.3.7' },
      { isUpdated: true, localVersion: '0.10.0', remoteVersion: '0.9.0' },
    ])(
      'should check the local version $localVersion is up to date with the remote $remoteVersion',
      async ({ isUpdated, localVersion, remoteVersion }) => {
        jest.spyOn(httpsService, 'getJson').mockResolvedValue({
          'last-recomended-version': remoteVersion,
        });

        await expect(updateService.isUpdated(localVersion)).resolves.toBe(
          isUpdated,
        );
      },
    );
  });
});
