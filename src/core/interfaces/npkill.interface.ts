import { Observable } from 'rxjs';
import {
  FoundFolder,
  GetFolderLastModificationOptions,
  GetFolderLastModificationResult,
  GetFolderSizeOptions,
  GetFolderSizeResult,
  ScanOptions,
} from './folder.interface';
import { IFileService } from '.';

export interface NpkillInterface {
  startScan$(options: ScanOptions): Observable<FoundFolder>;
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
  error?: string;
}
