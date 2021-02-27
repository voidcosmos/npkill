import { normalize, join as pathJoin } from 'path';
import { rmdir, existsSync, readdirSync, lstatSync, unlinkSync, rmdirSync } from 'fs';
import { version } from 'process';

import * as getSize from 'get-folder-size';

import { FileService, StreamService } from '@core/services';
import { INodeVersion } from '@core/interfaces';
import { RECURSIVE_RMDIR_NODE_VERSION_SUPPORT } from '@core/constants';

import { IListDirParams } from '@core/interfaces/list-dir-params.interface';
import { Observable } from 'rxjs';
import { spawn } from 'child_process';

export class WindowsFilesService extends FileService {
  constructor(private streamService: StreamService) {
    super();
  }

  getFolderSize(path: string): Observable<number> {
    return new Observable(observer => {
      getSize(path, (err, size) => {
        if (err) {
          throw err;
        }
        observer.next(super.convertBytesToKB(size));
        observer.complete();
      });
    });
  }

  listDir(params: IListDirParams): Observable<Buffer> {
    const { path, target, exclude } = params;

    const excludeWords = exclude ? exclude.join(' ') : '';

    const binPath = normalize(`${__dirname}/../bin/windows-find`);
    const args = [path, target, excludeWords];

    const child = spawn(binPath, args);
    return this.streamService.getStream(child);
  }

  deleteDir(path: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const { major: supportedMajor, minor: supportedMinor } = RECURSIVE_RMDIR_NODE_VERSION_SUPPORT;

      if (this.nodeVersion instanceof Error) {
        return reject(this.nodeVersion);
      }

      const { major: currentMajor, minor: currentMinor } = this.nodeVersion;

      if (currentMajor < supportedMajor || (currentMajor === supportedMajor && currentMinor < supportedMinor)) {
        try {
          this.removeDirectorySynchronously(path)
          return resolve(true);
        } catch (err) {
          return reject(err);
        }
      }

      rmdir(path, { recursive: true }, err => {
        if (err) {
          reject(err);
        }
        resolve(true);
      });
    });
  }

  protected get nodeVersion(): INodeVersion | Error {
    const releaseVersionsRegExp: RegExp = /^v(\d{1,2})\.(\d{1,2})\.(\d{1,2})/;
    const versionMatch = version.match(releaseVersionsRegExp);

    if (!versionMatch) {
      return new Error(`Unable to parse Node version: ${version}`);
    }

    return {
      major: parseInt(versionMatch[1], 10),
      minor: parseInt(versionMatch[2], 10),
      patch: parseInt(versionMatch[3], 10),
    };
  }

  protected removeDirectorySynchronously(dirPath: string): void {
    if (existsSync(dirPath)) {
      const ls = readdirSync(dirPath);

      ls.forEach(dirOrFile => {
        const dirOrFilePath = pathJoin(dirPath, dirOrFile);

        if (lstatSync(dirOrFilePath).isDirectory()) {
          this.removeDirectorySynchronously(dirOrFilePath);
        } else {
          unlinkSync(dirOrFilePath);
        }
      });

      rmdirSync(dirPath);
    }
  }
}
