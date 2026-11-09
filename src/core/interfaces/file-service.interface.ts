import { FileWorkerService } from '../services/files/files.worker.service.js';
import { GetNewestFileResult, RiskAnalysis } from '../interfaces/index.js';
import { ScanOptions } from './target.interface.js';
import { Observable } from 'rxjs';
import { ValidateRootResult } from './npkill.interface.js';

/**
 * Core file system operations service for npkill.
 * Provides methods for directory scanning, size calculation, deletion, and validation.
 */
export interface IFileService {
  /** Worker service for handling file operations in background threads. */
  fileWorkerService: FileWorkerService;

  /**
   * Calculates the total size of a directory or a file.
   * @param path Path to measure.
   * @returns Observable emitting the size in bytes.
   */
  getSize: (path: string) => Observable<number>;

  /**
   * Lists the targets matching the scan criteria. The scan starts on subscribe and
   * stops on unsubscribe.
   * @param path Root path to start listing from.
   * @param params Scan options for filtering and configuration.
   * @returns Observable emitting the paths of the found targets.
   */
  listDir: (path: string, params: ScanOptions) => Observable<string>;

  /**
   * Permanently deletes a path and everything inside it.
   * @param path Path to delete.
   * @returns Promise resolving to true if deletion was successful.
   */
  delete: (path: string) => Promise<boolean>;

  /**
   * Validates whether a path is suitable as a scan root directory.
   * @param path Path to validate.
   * @returns Validation result with success status and error reason if invalid.
   */
  isValidRootFolder(path: string): ValidateRootResult;

  /**
   * Analyzes a target path for potential deletion risks.
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
  /** Last modification of the file, in milliseconds since the Unix epoch. */
  modificationTime: number;
}
