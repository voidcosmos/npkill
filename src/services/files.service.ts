import * as fs from 'fs';
import * as getSize from 'get-folder-size';

import { homedir } from 'os';
import { resolve } from 'path';
import { Observable } from 'rxjs';
import { DECIMALS_SIZE } from '../constants/main.constants';

export class FileService {
  getFolderSize(path: string): Promise<number> {
    return new Promise((resolve, reject) => {
      getSize(path, (err, size) => {
        if (err) {
          throw err;
        }
        resolve(this.convertBToMb(size));
      });
    });
  }

  removeDir(dir, rmSelf = true): void {
    if (!this.isDirectorySafeToDelete(dir)) {
      throw new Error('Directory not safe to delete!');
    }

    const files = this.getDirectoryFiles(dir);

    dir = dir + '/';
    this.removeDirectoryFiles(dir, files);

    if (rmSelf) {
      fs.rmdirSync(dir);
    }
  }

  getUserHomePath(): string {
    return homedir();
  }

  listDir(path: string): Observable<any> {
    return Observable.create(observer => {
      // TODO use #getDirectoryFiles and addapt this for async.
      fs.readdir(path, (err, filesList) => {
        if (err) {
          throw err;
        }
        let pending = filesList.length;
        if (!pending) {
          return observer.complete();
        }

        filesList.forEach(filePath => {
          filePath = resolve(path, filePath);
          this.getStats(filePath).then(stat => {
            if (stat.isDirectory()) observer.next(filePath);

            if (!--pending) observer.complete();
          });
        });
      });
    });
  }

  private getStats(path: string): Promise<fs.Stats> {
    return new Promise((resolve, reject) => {
      fs.stat(path, (err, stat) => {
        if (err) {
          reject(err);
        }
        resolve(stat);
      });
    });
  }

  private convertBToMb(bytes: number): number {
    const factorBtoMb = 1048576;
    return +(bytes / factorBtoMb).toFixed(DECIMALS_SIZE);
  }

  private getDirectoryFiles(dir: string) {
    return fs.readdirSync(dir);
  }

  private removeDirectoryFiles(dir: string, files: string[]): void {
    files.map(file => {
      const path = dir + file;
      if (fs.statSync(path).isDirectory()) {
        this.removeDir(path);
      } else {
        fs.unlinkSync(path);
      }
    });
  }

  private isDirectorySafeToDelete(path: string): boolean {
    return path !== '/';
  }
}
