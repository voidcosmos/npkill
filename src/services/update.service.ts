import {
  VERSION_CHECK_DIRECTION,
  VERSION_KEY,
} from '../constants/update.constants.js';

import { HttpsService } from './https.service.js';

export class UpdateService {
  constructor(private httpsService: HttpsService) { }

  async isUpdated(localVersion: string): Promise<boolean> {
    const remoteVersion = await this.getRemoteVersion();

    const local = this.splitVersion(localVersion);
    const remote = this.splitVersion(remoteVersion);

    return this.compareVersions(local, remote);
  }

  private compareVersions(local: string, remote: string): boolean {
    return (
      this.isSameVersion(local, remote) ||
      this.isLocalVersionGreater(local, remote)
    );
  }

  private async getRemoteVersion(): Promise<string> {
    const response: {} = await this.httpsService.get(VERSION_CHECK_DIRECTION);
    return response[VERSION_KEY];
  }

  private splitVersion(version: string): string {
    const versionSeparator = '.';
    const remoteSplited = version.split(versionSeparator);
    return remoteSplited.join('');
  }

  private isSameVersion(version1: string, version2: string): boolean {
    return version1 === version2;
  }

  private isLocalVersionGreater(local: string, remote: string): boolean {
    return local > remote;
  }
}
