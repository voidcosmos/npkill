import { IListDirParams } from '../interfaces/list-dir-params.interface.js';
import { Observable } from 'rxjs';
import { IFolder } from './folder.interface.js';

export interface IFileService {
  getFolderSize(path: string): Observable<any>;
  listDir(params: IListDirParams): Observable<string>;
  deleteDir(path: string): Promise<{}>;
  convertKbToGB(kb: number): number;
  convertBytesToKB(bytes: number): number;
  convertGBToMB(gb: number): number;
  getFileContent(path: string): string;
  isSafeToDelete(path: string, targetFolder: string): boolean;
  isDangerous(path: string): boolean;
}
