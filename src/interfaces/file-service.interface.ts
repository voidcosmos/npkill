import { Observable } from 'rxjs';

export interface IFileService {
  getFolderSize(path: string): Observable<any>;
  listDir(path: string): Observable<{}>;
  deleteDir(path: string): Promise<{}>;
  convertBToMb(bytes: number): number;
  convertMbToGb(mb: number): number;
  getFileContent(path: string): string;
  isSafeToDelete(path: string): boolean;
}
