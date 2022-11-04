import { IListDirParams } from '../interfaces/list-dir-params.interface.js';
import { Observable } from 'rxjs';

export interface IFileService {
  getFolderSize(path: string): Observable<any>;
  listDir(params: IListDirParams): Observable<Buffer>;
  deleteDir(path: string): Promise<{}>;
  convertKbToGB(kb: number): number;
  convertBytesToKB(bytes: number): number;
  convertGBToMB(gb: number): number;
  getFileContent(path: string): string;
  isSafeToDelete(path: string, targetFolder: string): boolean;
  isDangerous(path: string): boolean;
  getRecentModificationInDir(path: string): Promise<number>;
  getFileStatsInDir(dirname: string): Promise<IFileStat[]>;
}

export interface IFileStat {
  path: string;
  modificationTime: number;
}
