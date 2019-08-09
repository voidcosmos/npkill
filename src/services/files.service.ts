import * as fs from 'fs';
import { Observable } from 'rxjs';

import { IFileService } from '../interfaces/file-service.interface';

export abstract class FileService implements IFileService {
  abstract getFolderSize(path: string): Observable<any>;
  abstract listDir(path: string): Observable<{}>;
  abstract deleteDir(path: string): Observable<{}>;
  getFileContent(path: string): string {
    const encoding = 'utf8';
    return fs.readFileSync(path, encoding);
  }
}
