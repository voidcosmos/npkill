import * as fs from 'fs';

import { IFileService, IListDirParams } from '@core/interfaces';

import { Observable } from 'rxjs';

export abstract class FileService implements IFileService {
  abstract getFolderSize(path: string): Observable<any>;
  abstract listDir(params: IListDirParams): Observable<Buffer>;
  abstract deleteDir(path: string): Promise<{}>;

  convertKbToGB(kb: number): number {
    const factorKBtoGB = 1048576;
    return kb / factorKBtoGB;
  }

  convertBytesToKB(bytes: number): number {
    const factorBytestoKB = 1024;
    return bytes / factorBytestoKB;
  }

  convertGBToMB(gb: number) {
    const factorGBtoMB = 1024;
    return gb * factorGBtoMB;
  }

  getFileContent(path: string): string {
    const encoding = 'utf8';
    return fs.readFileSync(path, encoding);
  }

  isSafeToDelete(path: string, targetFolder: string): boolean {
    return path.includes(targetFolder);
  }

  isDangerous(path: string): boolean {
    const hiddenFilePattern = /(^|\/)\.[^\/\.]/g;
    return hiddenFilePattern.test(path);
  }
}
