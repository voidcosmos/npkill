import {
  VERSION_CHECK_DIRECTION,
  VERSION_KEY,
} from '../../constants/update.constants.js';

import { HttpsService } from './https.service.js';

export class UpdateService {
  constructor(private readonly httpsService: HttpsService) {}

  /**
   * Check if localVersion is greater or equal to remote version
   * ignoring the pre-release tag. ex: 1.3.12 = 1.3.12-21
   */
  async isUpdated(localVersion: string): Promise<boolean> {
    const removePreReaseTag = (value: string): string => value.split('-')[0];

    const localVersionPrepared = removePreReaseTag(localVersion);
    const remoteVersion = await this.getRemoteVersion();
    const remoteVersionPrepared = removePreReaseTag(remoteVersion);
    return this.compareVersions(localVersionPrepared, remoteVersionPrepared);
  }

  private compareVersions(local: string, remote: string): boolean {
    return (
      this.isSameVersion(local, remote) ||
      this.isLocalVersionGreater(local, remote)
    );
  }

  private async getRemoteVersion(): Promise<string> {
    const response = await this.httpsService.getJson(VERSION_CHECK_DIRECTION);
    return response[VERSION_KEY];
  }

  private isSameVersion(version1: string, version2: string): boolean {
    return version1 === version2;
  }

  /** Valid to compare versions up to 99999.99999.99999 */
  private isLocalVersionGreater(local: string, remote: string): boolean {
    const leadingZeros = (value: string): string =>
      ('00000' + value).substring(-5);

    const localLeaded = +local.split('.').map(leadingZeros).join('');
    const remoteLeaded = +remote.split('.').map(leadingZeros).join('');

    return localLeaded >= remoteLeaded;
  }
}
