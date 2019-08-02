import { HttpsService } from './https.service';
import {
  VERSION_CHECK_DIRECTION,
  VERSION_KEY,
} from '../constants/update.constants';
import { IVersion } from '../interfaces/version.interface';

export class UpdateService {
  constructor(private httpsService: HttpsService) {}

  async isUpdated(localVersion: string): Promise<boolean> {
    const remoteVersion = await this.getRemoteVersion();

    const local = this.splitVersion(localVersion);
    const remote = this.splitVersion(remoteVersion);

    return this.compareVersions(local, remote);
  }

  private compareVersions(local: IVersion, remote: IVersion): boolean {
    return (
      this.isSameVersion(local, remote) ||
      this.isLocalVersionGreater(local, remote)
    );
  }

  private async getRemoteVersion(): Promise<string> {
    const response: {} = await this.httpsService.get(VERSION_CHECK_DIRECTION);
    return response[VERSION_KEY];
  }

  private splitVersion(version: string): IVersion {
    const versionSeparator = '.';
    const remoteSplited = version.split(versionSeparator);
    return {
      major: +remoteSplited[0],
      minor: +remoteSplited[1],
      patch: +remoteSplited[2],
    };
  }

  private isSameVersion(version1: IVersion, version2: IVersion): boolean {
    return JSON.stringify(version1) === JSON.stringify(version2);
  }

  private isLocalVersionGreater(local: IVersion, remote: IVersion): boolean {
    return (
      this.isMajorGreater(local.major, remote.major) ||
      this.isMinorGreater(local.minor, remote.minor) ||
      this.isPatchGreater(local.patch, remote.patch)
    );
  }

  private isMajorGreater(localMajor: number, remoteMajor: number): boolean {
    return localMajor > remoteMajor;
  }
  private isMinorGreater(localMinor: number, remoteMinor: number): boolean {
    return localMinor > remoteMinor;
  }
  private isPatchGreater(localPatch: number, remotePatch: number): boolean {
    return localPatch > remotePatch;
  }
}
