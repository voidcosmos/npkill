import * as fs from 'fs';
import * as getSize from 'get-folder-size';

import { homedir } from 'os';
import { resolve } from 'path';
import { Observable } from 'rxjs';
import { DECIMALS_SIZE } from '../constants/main.constants';

export class FileService {
  getFileContent(path: string): string {
    const encoding = 'utf8';
    return fs.readFileSync(path, encoding);
  }
}
