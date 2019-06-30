const getSize = require("get-folder-size");
const fs = require("fs");

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
      return false;
    }
    let files;
    dir = dir + "/";
    try {
      files = fs.readdirSync(dir);
    } catch (e) {
      console.log("Directory not exist.");
      return;
    }
    if (files.length > 0) {
      files.forEach((x, i) => {
        if (fs.statSync(dir + x).isDirectory()) {
          this.removeDir(dir + x);
        } else {
          fs.unlinkSync(dir + x);
        }
      });
    }
    if (rmSelf) {
      // check if user want to delete the directory ir just the files in this directory
      fs.rmdirSync(dir);
    }
  }

  private isDirectorySafeToDelete(path) {
    if (path === "/") {
      return false;
    }

    return true;
  }
}
