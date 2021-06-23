import { normalize, join as pathJoin } from 'path';
import { rm, lstat, unlink, readdir } from 'fs';
import { version } from 'process';

import * as getSize from 'get-folder-size';

import { FileService, StreamService } from '@core/services';
import { IErrorCallback, INodeVersion } from '@core/interfaces';
import { RECURSIVE_RMDIR_IGNORED_ERROR_CODES, RECURSIVE_RMDIR_NODE_VERSION_SUPPORT } from '@core/constants';

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
        this.removeRecursively(path, err => {
          if (err) {
            return reject(err);
          }
          resolve(true);
        });
      } else {
        rm(path, { recursive: true }, err => {
          if (err) {
            reject(err);
          }
          resolve(true);
        });
      }
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

  protected removeRecursively(dirOrFilePath: string, callback: IErrorCallback): void {
    lstat(dirOrFilePath, (lstatError, stats) => {
      //  No such file or directory - Done
      if (lstatError && lstatError.code === 'ENOENT') {
        return callback(null);
      }

      if(stats.isDirectory()) {
        return this.removeDirectory(dirOrFilePath, callback);
      }

      unlink(dirOrFilePath, rmError => {
        //  No such file or directory - Done
        if (rmError && rmError.code === 'ENOENT') {
          return callback(null);
        }

        if (rmError && rmError.code === 'EISDIR') {
          return this.removeDirectory(dirOrFilePath, callback);
        }

        callback(rmError);
      });
    });
  }

  protected removeDirectory(path: string, callback) {
    rm(path, rmDirError => {
      //  We ignore certain error codes
      //  in order to simulate 'recursive' mode
      if (rmDirError && RECURSIVE_RMDIR_IGNORED_ERROR_CODES.includes(rmDirError.code)) {
        return this.removeChildren(path, callback);
      }

      callback(rmDirError);
    });
  }

  protected removeChildren(path: string, callback) {
    readdir(path, (readdirError, ls) => {
      if (readdirError) {
        return callback(readdirError);
      }

      let contentInDirectory = ls.length;
      let done = false;

      //  removeDirectory only allows deleting directories
      //  that has no content inside (empty directory).
      if (!contentInDirectory) {
        return rm(path, callback);
      }

      ls.forEach(dirOrFile => {
        const dirOrFilePath = pathJoin(path, dirOrFile);

        this.removeRecursively(dirOrFilePath, error => {
          if (done) {
            return;
          }

          if (error) {
            done = true;
            return callback(error);
          }

          contentInDirectory--;
          //  No more content inside.
          //  Remove the directory.
          if (!contentInDirectory) {
            rm(path, callback);
          }
        });
      });
    });
  }
}
