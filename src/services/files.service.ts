import * as fs from 'fs';
import * as getSize from 'get-folder-size';

import { Observable } from 'rxjs';
import { resolve } from 'path';

export class FileService {
  getFolderSize(path: string) {
    return new Promise((resolve, reject) => {
      getSize(path, (err, size) => {
        if (err) {
          throw err;
        }
        resolve((size / 1024 / 1024).toFixed(2));
      });
    });
  }

  removeDir(dir, rmSelf = true) {
    if (!this.isDirectorySafeToDelete(dir)) {
      throw new Error('Directory not safe to delete!');
    }

    const files = this.getDirectoryFiles(dir);

    dir = dir + '/';
    this.removeDirectoryFiles(dir, files);

    if (rmSelf) {
      // check if user want to delete the directory ir just the files in this directory
      fs.rmdirSync(dir);
    }
  }

  getUserHomePath() {
    return require('os').homedir();
  }

  listDir(path: string): Observable<any> {
    return Observable.create(observer => {
      //TODO use #getDirectoryFiles and addapt this for async.
      fs.readdir(path, (err, filesList) => {
        if (err) {
          throw err;
        }
        let pending = filesList.length;
        if (!pending) return observer.complete();

        filesList.forEach(filePath => {
          filePath = resolve(path, filePath);
          this.getStats(filePath)
            .then(stat => {
              if (stat.isDirectory()) observer.next(filePath);

              if (!--pending) observer.complete();
            })
            .catch(err => {
              throw err;
            });
        });
      });
    });
  }

  private getStats(path: string): Promise<fs.Stats> {
    return new Promise((resolve, reject) => {
      fs.stat(path, (err, stat) => {
        if (err) reject(err);
        resolve(stat);
      });
    });
  }

  private getDirectoryFiles(dir: string) {
    return fs.readdirSync(dir);
  }

  private removeDirectoryFiles(dir: string, files: Array<string>) {
    files.map(file => {
      const path = dir + file;
      if (fs.statSync(path).isDirectory()) {
        this.removeDir(path);
      } else {
        fs.unlinkSync(path);
      }
    });
  }

  private isDirectorySafeToDelete(path) {
    return path !== '/';
  }
}
