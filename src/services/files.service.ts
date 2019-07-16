import * as fs from 'fs';
import * as getSize from 'get-folder-size';
import * as path from 'path';

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
