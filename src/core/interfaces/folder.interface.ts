/** Unit for representing file/directory sizes. */
export type SizeUnit = 'bytes'; // | 'kb' | 'mb' | 'gb'; // TODO implement

/**
 * Analysis of potential risks associated with deleting a directory.
 */
export interface RiskAnalysis {
  /** Whether the directory is considered sensitive or risky to delete. */
  isSensitive: boolean;
  /** Human-readable reason for the risk assessment. */
  reason?: string;
}

/**
 * Represents a folder found during the scan process.
 */
export interface ScanFoundFolder {
  /** Full path to the found folder. */
  path: string;
  /** Optional risk analysis for the folder. */
  riskAnalysis?: RiskAnalysis;
}

/**
 * Configuration options for scanning directories.
 */
export interface ScanOptions {
  /** Target directory to scan for matching folders. */
  target: string;
  /** Array of directory paths to exclude from the scan. */
  exclude?: string[];
  /** Criteria for sorting scan results. */
  sortBy?: 'path' | 'size' | 'last-mod';
  /** Whether to perform risk analysis on found directories. Default: true. */
  performRiskAnalysis?: boolean; // Default: true
  // maxConcurrentScans?: number; // Need to implement this.
}

/**
 * Options for calculating directory size.
 */
export interface GetSizeOptions {
  /** Unit to return the size in. Default: bytes. */
  unit?: SizeUnit; // Default: bytes
}

/**
 * Result of a directory size calculation.
 */
export interface GetSizeResult {
  /** Size value in the specified unit. Default: bytes. */
  size: number; // Default: bytes
  /** Unit of the size measurement. */
  unit: SizeUnit;
}

/**
 * Options for finding the newest file in a directory.
 */
export interface GetNewestFileOptions {}

/**
 * Information about the most recently modified file in a directory.
 */
export interface GetNewestFileResult {
  /** Full path to the newest file. */
  path: string;
  /** Name of the newest file. */
  name: string;
  /** Unix timestamp of the file's last modification. */
  timestamp: number; // epoch timestamp
}

/**
 * Options for directory deletion operations.
 */
export interface DeleteOptions {
  /** If true, simulate deletion without actually removing files. */
  dryRun?: boolean;
}

/**
 * Result of a directory deletion operation.
 */
export interface DeleteResult {
  /** Path that was attempted to be deleted. */
  path: string;
  /** Whether the deletion was successful. */
  success: boolean;
  /** Error information if deletion failed. */
  error?: {
    /** Human-readable error message. */
    message: string;
    /** Error code if available. */
    code?: string;
  };
}
