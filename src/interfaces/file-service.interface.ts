import { IListDirParams } from './list-dir-params.interface';
import { Observable } from 'rxjs';

export interface IFileService {
  getFolderSize(path: string): Observable<any>;
  listDir(params: IListDirParams): Observable<{}>;
  deleteDir(path: string): Promise<{}>;
  convertKbToGb(kb: number): number;
  convertBToKb(bytes: number): number;
  convertGbToMb(gb: number): number;
  getFileContent(path: string): string;
  isSafeToDelete(path: string, targetFolder: string): boolean;
}
