import { execFile } from 'child_process';

import { FileService } from './files.service.js';
import { StreamService } from '../stream.service.js';
import { FileWorkerService } from './files.worker.service.js';

export class UnixFilesService extends FileService {
  constructor(
    protected streamService: StreamService,
    public override fileWorkerService: FileWorkerService,
  ) {
    super(fileWorkerService);
  }

  async deleteDir(path: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      execFile('rm', ['-rf', path], (error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(true);
      });
    });
  }
}
