import { Observable } from 'rxjs';

export interface IFileService {
  getFolderSize(path: string): Observable<any>;
  listDir(path: string): Observable<{}>;
  deleteDir(path: string): Promise<{}>;
  convertBToGb(mb: number): number;
  convertGbToMb(gb: number): number;
  getFileContent(path: string): string;
  isSafeToDelete(path: string): boolean;
}
