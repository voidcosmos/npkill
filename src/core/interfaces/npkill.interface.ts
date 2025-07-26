import { Observable } from 'rxjs';
import {
  ScanFoundFolder,
  GetNewestFileOptions,
  GetNewestFileResult,
  GetSizeOptions,
  GetSizeResult,
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

  getSize$(path: string, options: GetSizeOptions): Observable<GetSizeResult>;

  getNewestFile$(
    path: string,
    //  options: GetNewestFileOptions,
  ): Observable<GetNewestFileResult | null>;

  delete$(path: string, options: DeleteOptions): Observable<DeleteResult>;

  getLogs$(): Observable<LogEntry[]>;

  getFileService(): IFileService;
}
