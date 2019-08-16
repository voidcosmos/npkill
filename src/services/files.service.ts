import * as fs from 'fs';

import { DECIMALS_SIZE, TARGET_FOLDER } from '../constants/main.constants';

import { IFileService } from '../interfaces/file-service.interface';
import { Observable } from 'rxjs';

export abstract class FileService implements IFileService {
  abstract getFolderSize(path: string): Observable<any>;
  abstract listDir(path: string): Observable<{}>;
  abstract deleteDir(path: string): Promise<{}>;

  convertKbToGb(bytes: number): number {
    const factorKbtoGb = 1048576;
    return bytes / factorKbtoGb;
  }

  convertBToKb(bytes: number): number {
    const factorBtoGb = 1024;
    return bytes / factorBtoGb;
  }

  convertGbToMb(gb: number) {
    const factorGbtoMb = 1024;
    return gb * factorGbtoMb;
  }

  getFileContent(path: string): string {
    const encoding = 'utf8';
    return fs.readFileSync(path, encoding);
  }

  isSafeToDelete(path: string): boolean {
    return path.includes(TARGET_FOLDER);
  }
}
