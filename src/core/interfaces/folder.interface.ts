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
  /** Names of the directories to find. Must contain at least one name. */
  targets: string[];
  /** Array of directory paths to exclude from the scan. */
  exclude?: string[];
  /** Whether to perform risk analysis on found directories. Default: true. */
  performRiskAnalysis?: boolean; // Default: true
  // maxConcurrentScans?: number; // Need to implement this.
}

/**
 * Result of a directory size calculation.
 */
export interface GetSizeResult {
  /** Space used on disk, in bytes. */
  size: number;
}

/**
 * Information about the most recently modified file in a directory.
 */
export interface GetNewestFileResult {
  /** Full path to the newest file. */
  path: string;
  /** Name of the newest file. */
  name: string;
  /** Last modification of the file, in milliseconds since the Unix epoch. */
  timestamp: number;
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
