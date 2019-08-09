import { Observable } from 'rxjs';

export interface IFileService {
  getFileContent(path: string): string;
  getFolderSize(path: string): Observable<any>;
  listDir(path: string): Observable<{}>;
  deleteDir(path: string): Promise<{}>;
}
