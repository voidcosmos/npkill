import { FileWorkerService } from '@core/services/files/files.worker.service.js';
import { GetNewestFileResult, RiskAnalysis } from '@core/interfaces';
import { ScanOptions } from './folder.interface.js';
import { Observable } from 'rxjs';
import { IsValidRootFolderResult } from './npkill.interface.js';

/**
 * Core file system operations service for npkill.
 * Provides methods for directory scanning, size calculation, deletion, and validation.
 */
export interface IFileService {
  /** Worker service for handling file operations in background threads. */
  fileWorkerService: FileWorkerService;

  /**
   * Calculates the total size of a directory.
   * @param path Path to the directory to measure.
   * @returns Observable emitting the size in bytes.
   */
  getFolderSize: (path: string) => Observable<number>;

  /**
   * Lists directories matching scan criteria.
   * @param path Root path to start listing from.
   * @param params Scan options for filtering and configuration.
   * @returns Observable emitting found directory paths.
   */
  listDir: (path: string, params: ScanOptions) => Observable<string>;

  /**
   * Permanently deletes a directory and its contents.
   * @param path Path to the directory to delete.
   * @returns Promise resolving to true if deletion was successful.
   */
  deleteDir: (path: string) => Promise<boolean>;

  /**
   * Simulates directory deletion without actually removing files.
   * @param _path Path to the directory that would be deleted.
   * @returns Promise resolving to true (always succeeds for dry run).
   */
  fakeDeleteDir: (_path: string) => Promise<boolean>;

  /**
   * Validates whether a path is suitable as a scan root directory.
   * @param path Path to validate.
   * @returns Validation result with success status and error reason if invalid.
   */
  isValidRootFolder(path: string): IsValidRootFolderResult;

  /**
   * Analyzes a directory path for potential deletion risks.
   * @param path Path to analyze for safety.
   * @returns Risk analysis indicating if the path is dangerous to delete.
   */
  isDangerous: (path: string) => RiskAnalysis;

  /**
   * Finds the most recently modified file in a directory tree.
   * @param path Root directory to search within.
   * @returns Promise resolving to newest file info, or null if no files found.
   */
  getRecentModificationInDir: (
    path: string,
  ) => Promise<GetNewestFileResult | null>;

  /**
   * Retrieves file statistics for all files in a directory.
   * @param dirname Directory to analyze.
   * @returns Promise resolving to array of file statistics.
   */
  getFileStatsInDir: (dirname: string) => Promise<IFileStat[]>;

  /**
   * Stops any ongoing scan operations.
   * Cancels workers and cleans up resources.
   */
  stopScan: () => void;
}

/**
 * Statistical information about a file.
 */
export interface IFileStat {
  /** Full path to the file. */
  path: string;
  /** Unix timestamp of the file's last modification. */
  modificationTime: number;
}
