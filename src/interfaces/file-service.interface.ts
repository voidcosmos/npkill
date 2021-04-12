import { IListDirParams } from '@core/interfaces/list-dir-params.interface';
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
}
