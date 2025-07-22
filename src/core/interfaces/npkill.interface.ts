import { Observable } from 'rxjs';
import {
  ScanFoundFolder,
  GetFolderLastModificationOptions,
  GetFolderLastModificationResult,
  GetFolderSizeOptions,
  GetFolderSizeResult,
  ScanOptions,
} from './folder.interface';
import { IFileService } from '.';

export interface NpkillInterface {
  startScan$(options: ScanOptions): Observable<ScanFoundFolder>;
  getFolderSize(options: GetFolderSizeOptions): Promise<GetFolderSizeResult>;
  getFolderLastModification(
    options: GetFolderLastModificationOptions,
  ): Promise<GetFolderLastModificationResult>;
  deleteFolder(folder: DeleteOptions): Promise<DeleteResult>;
  getFileService(): IFileService;
}

export interface DeleteOptions {
  path: string;
}

export interface DeleteResult {
  path: string;
  success: boolean;
  error?: {
    message: string;
    code?: string;
  };
}
