import * as fs from 'fs';

import { IFileService } from '@interfaces/file-service.interface';

export abstract class FileService implements IFileService {
  abstract getFolderSize(path: string): import('rxjs').Observable<any>;
  abstract listDir(path: string): import('rxjs').Observable<{}>;
  abstract deleteDir(path: string): void;
  getFileContent(path: string): string {
    const encoding = 'utf8';
    return fs.readFileSync(path, encoding);
  }
}
