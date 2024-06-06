import { IListDirParams } from '../interfaces/list-dir-params.interface.js';
import { Observable } from 'rxjs';

export interface IFileService {
  getFolderSize: (path: string) => Observable<number>;
  listDir: (params: IListDirParams) => Observable<string>;
  deleteDir: (path: string) => Promise<boolean>;
  fakeDeleteDir: (_path: string) => Promise<boolean>;
  isValidRootFolder: (path: string) => boolean;
  convertBytesToKB: (bytes: number) => number;
  convertBytesToGb: (bytes: number) => number;
  convertGBToMB: (gb: number) => number;
  getFileContent: (path: string) => string;
  isSafeToDelete: (path: string, targetFolder: string) => boolean;
  isDangerous: (path: string) => boolean;
  getRecentModificationInDir: (path: string) => Promise<number>;
  getFileStatsInDir: (dirname: string) => Promise<IFileStat[]>;
}

export interface IFileStat {
  path: string;
  modificationTime: number;
}
