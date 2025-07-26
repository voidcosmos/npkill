import { Observable } from 'rxjs';
import {
  ScanFoundFolder,
  GetFolderLastModificationOptions,
  GetFolderLastModificationResult,
  GetFolderSizeOptions,
  GetFolderSizeResult,
  ScanOptions,
  DeleteResult,
  DeleteOptions,
} from './folder.interface';
import { IFileService } from '.';
import { LogEntry } from '@core/services/logger.service';

export interface NpkillInterface {
  startScan$(
    rootPath: string,
    options: ScanOptions,
  ): Observable<ScanFoundFolder>;

  getFolderSize$(
    path: string,
    options: GetFolderSizeOptions,
  ): Observable<GetFolderSizeResult>;

  getFolderLastModification$(
    path: string,
    //  options: GetFolderLastModificationOptions,
  ): Observable<GetFolderLastModificationResult>;

  deleteFolder$(path: string, options: DeleteOptions): Observable<DeleteResult>;

  getLogs$(): Observable<LogEntry[]>;

  getFileService(): IFileService;
}
