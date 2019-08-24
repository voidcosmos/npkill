import { Observable } from 'rxjs';

export interface IFileService {
  getFolderSize(path: string): Observable<any>;
  listDir(path: string, target: string): Observable<{}>;
  deleteDir(path: string): Promise<{}>;
  convertKbToGb(kb: number): number;
  convertBToKb(bytes: number): number;
  convertGbToMb(gb: number): number;
  getFileContent(path: string): string;
  isSafeToDelete(path: string, targetFolder: string): boolean;
}
