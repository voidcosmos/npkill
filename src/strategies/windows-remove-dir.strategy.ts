import { INodeVersion } from '@core/interfaces';
import { NoParamCallback, lstat, readdir, rm, rmdir, unlink } from 'fs';
import {
  RECURSIVE_RMDIR_IGNORED_ERROR_CODES,
  RECURSIVE_RMDIR_NODE_VERSION_SUPPORT,
  RM_NODE_VERSION_SUPPORT,
} from '@core/constants';

import { join as pathJoin } from 'path';
import { version } from 'process';

export class WindowsStrategyManager {
 
  deleteDir(path: string): Promise<boolean> {
    const strategy = this.selectStrategy();

    return new Promise((resolve, reject) => {
      strategy(path, (err) => {
        if (err) {
          return reject(err);
        }
        resolve(true);
      });
    });
  }

  private getNodeVersion(): INodeVersion {
    const releaseVersionsRegExp: RegExp = /^v(\d{1,2})\.(\d{1,2})\.(\d{1,2})/;
    const versionMatch = version.match(releaseVersionsRegExp);

    if (!versionMatch) {
      throw new Error(`Unable to parse Node version: ${version}`);
    }

    return {
      major: parseInt(versionMatch[1], 10),
      minor: parseInt(versionMatch[2], 10),
      patch: parseInt(versionMatch[3], 10),
    };
  }

  private selectStrategy() {
    const { major, minor } = this.getNodeVersion();

    if (this.supportsRm(major,minor)) {
      return this.removeWithRm;
    }
    if (this.supportsRmdir(major,minor)) {
      return this.removeWithRmdir;
    }
    return this.removeRecursively.bind(this);
  }

  private supportsRm(major:number,minor:number):boolean{
    return (major > RM_NODE_VERSION_SUPPORT.major || (major === RM_NODE_VERSION_SUPPORT.major && minor > RM_NODE_VERSION_SUPPORT.minor));
  }

  private supportsRmdir(major:number,minor:number):boolean {
    return ( major > RECURSIVE_RMDIR_NODE_VERSION_SUPPORT.major ||
    (major === RECURSIVE_RMDIR_NODE_VERSION_SUPPORT.major && minor > RECURSIVE_RMDIR_NODE_VERSION_SUPPORT.minor));
  }

  private removeWithRm(path: string, callback: NoParamCallback) {
    rm(path, { recursive: true }, callback);
  }

  private removeWithRmdir(path: string, callback: NoParamCallback) {
    rmdir(path, { recursive: true }, callback);
  }

  private removeRecursively(
    dirOrFilePath: string,
    callback: NoParamCallback,
  ): void {
    lstat(dirOrFilePath, (lstatError, stats) => {
      //  No such file or directory - Done
      if (lstatError && lstatError.code === 'ENOENT') {
        return callback(null);
      }

      if (stats.isDirectory()) {
        return this.removeDirectory(dirOrFilePath, callback);
      }

      unlink(dirOrFilePath, (rmError) => {
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
    rmdir(path, (rmDirError) => {
      //  We ignore certain error codes
      //  in order to simulate 'recursive' mode
      if (
        rmDirError &&
        RECURSIVE_RMDIR_IGNORED_ERROR_CODES.includes(rmDirError.code)
      ) {
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
        return rmdir(path, callback);
      }

      ls.forEach((dirOrFile) => {
        const dirOrFilePath = pathJoin(path, dirOrFile);

        this.removeRecursively(dirOrFilePath, (error) => {
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
            rmdir(path, callback);
          }
        });
      });
    });
  }
}
