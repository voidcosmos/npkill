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
  getFileList(path: string): any;
  getProjectLastUsage(path: string): Promise<number>;
  getFileList(dirname: string): Promise<IFileList[]>;
}

export interface IFileList {
  path: string;
  modificationTime: number;
}
