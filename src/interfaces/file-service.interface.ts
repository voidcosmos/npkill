import { Observable } from 'rxjs';

export interface IFileService {
  getFolderSize(path: string): Observable<any>;
  listDir(path: string): Observable<{}>;
  deleteDir(path: string): Promise<{}>;
  convertKbToGb(mb: number): number;
  convertGbToMb(gb: number): number;
  convertBToKb(b: number): number;
  getFileContent(path: string): string;
  isSafeToDelete(path: string): boolean;
}
