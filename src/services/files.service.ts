const getSize = require('get-folder-size');
const fs = require('fs');

export class FileService {
  getFolderSize(path: string, printOn?: [number, number]) {
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

  private getDirectoryFiles(dir: string) {
    return fs.readdirSync(dir);
  }

  private removeDirectoryFiles(dir: string, files: Array<string>) {
    files.map(file => {
      if (fs.statSync(dir + file).isDirectory()) {
        this.removeDir(dir + file);
      } else {
        fs.unlinkSync(dir + file);
      }
    });
  }

  private isDirectorySafeToDelete(path) {
    return path !== '/';
  }
}
