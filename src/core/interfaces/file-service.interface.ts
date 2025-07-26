import { FileWorkerService } from '@core/services/files/files.worker.service.js';
import { GetNewestFileResult, RiskAnalysis } from '@core/interfaces';
import { ScanOptions } from './folder.interface.js';
import { Observable } from 'rxjs';
import { IsValidRootFolderResult } from './npkill.interface.js';

export interface IFileService {
  fileWorkerService: FileWorkerService;
  getFolderSize: (path: string) => Observable<number>;
  listDir: (path: string, params: ScanOptions) => Observable<string>;
  deleteDir: (path: string) => Promise<boolean>;
  fakeDeleteDir: (_path: string) => Promise<boolean>;
  isValidRootFolder(path: string): IsValidRootFolderResult;
  isDangerous: (path: string) => RiskAnalysis;
  getRecentModificationInDir: (
    path: string,
  ) => Promise<GetNewestFileResult | null>;
  getFileStatsInDir: (dirname: string) => Promise<IFileStat[]>;
}

export interface IFileStat {
  path: string;
  modificationTime: number;
}
