import { Observable } from 'rxjs';

export interface IFileService {
  getFolderSize(path: string): Observable<any>;
  listDir(path: string): Observable<{}>;
  deleteDir(path: string): void;
}
