import {
  VERSION_CHECK_DIRECTION,
  VERSION_KEY,
} from '@core/constants/update.constants';

import { HttpsService } from './https.service';

export class UpdateService {
  constructor(private httpsService: HttpsService) {}

  async isUpdated(localVersion: string): Promise<boolean> {
    const remoteVersion = await this.getRemoteVersion();

    const local = this.splitVersion(localVersion);
    const remote = this.splitVersion(remoteVersion);

    return this.compareVersions(local, remote);
  }

  private compareVersions(local: any, remote: any): boolean {
    return (
      this.isSameVersion(local, remote) ||
      this.isLocalVersionGreater(local, remote)
    );
  }

  private async getRemoteVersion(): Promise<string> {
    const response: {} = await this.httpsService.get(VERSION_CHECK_DIRECTION);
    return response[VERSION_KEY];
  }

  private splitVersion(version: string): any {
    const versionSeparator = '.';
    const remoteSplited = version.split(versionSeparator);
    return remoteSplited.join('');
  }

  private isSameVersion(version1: any, version2: any): boolean {
    return version1 === version2;
  }

  private isLocalVersionGreater(local: any, remote: any): boolean {
    return local > remote;
  }
}
