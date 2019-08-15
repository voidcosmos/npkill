import * as fs from 'fs';

import { IFileService } from '../interfaces/file-service.interface';
import { Observable } from 'rxjs';
import { TARGET_FOLDER } from '../constants/main.constants';

export abstract class FileService implements IFileService {
  abstract getFolderSize(path: string): Observable<any>;
  abstract listDir(path: string): Observable<{}>;
  abstract deleteDir(path: string): Promise<{}>;

  convertBToMb(bytes: number): number {
    const factorBtoMb = 1048576;
    return bytes / factorBtoMb;
  }

  convertMbToGb(mb: number): number {
    const factorMbtoGb = 1000;
    return mb / factorMbtoGb;
  }

  getFileContent(path: string): string {
    const encoding = 'utf8';
    return fs.readFileSync(path, encoding);
  }

  isSafeToDelete(path: string): boolean {
    return path.includes(TARGET_FOLDER);
  }
}
