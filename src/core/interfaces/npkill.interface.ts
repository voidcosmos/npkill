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

  getFolderSize(
    path: string,
    options: GetFolderSizeOptions,
  ): Promise<GetFolderSizeResult>;

  getFolderLastModification$(
    path: string,
    //  options: GetFolderLastModificationOptions,
  ): Observable<GetFolderLastModificationResult>;

  getFolderLastModification(
    path: string,
    // options: GetFolderLastModificationOptions,
  ): Promise<GetFolderLastModificationResult>;

  deleteFolder$(path: string, options: DeleteOptions): Observable<DeleteResult>;

  deleteFolder(path: string, options: DeleteOptions): Promise<DeleteResult>;

  getLogs$(): Observable<LogEntry[]>;

  getFileService(): IFileService;
}
