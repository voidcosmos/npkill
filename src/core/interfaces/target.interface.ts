/**
 * A directory to find, by name alone or with a rule.
 */
export type TargetDefinition = string | TargetRule;

/**
 * Finds a directory by name, optionally requiring entries around it.
 * Rules with the same target are alternatives.
 */
export interface TargetRule {
  /** Name of the target. */
  readonly target: string;
  /** Names that must all exist next to the directory. */
  readonly nextTo?: readonly string[];
  /** Names that must all exist inside the directory. */
  readonly contains?: readonly string[];
}

/**
 * Analysis of the risk of deleting a target.
 */
export interface RiskAnalysis {
  /** Whether the target is considered sensitive or risky to delete. */
  isSensitive: boolean;
  /** Human-readable reason for the risk assessment. */
  reason?: string;
}

/**
 * Represents a target found during the scan process.
 */
export interface ScanResult {
  /** Absolute path to the found target. */
  path: string;
  /** Optional risk analysis for the target. */
  riskAnalysis?: RiskAnalysis;
}

/**
 * Configuration options for a scan.
 */
export interface ScanOptions {
  /** Directory names or rules. Must contain at least one target. */
  targets: readonly TargetDefinition[];
  /** Array of directory patterns to exclude from the scan, relative to the scan root unless absolute. */
  exclude?: string[];
  /**
   * Whether to skip the folders that rarely hold projects, like `.git` or
   * `.nvm`. Default: true. Set it to false to look inside them too.
   */
  useDefaultIgnore?: boolean;
  /** Whether to perform risk analysis on the found targets. Default: true. */
  performRiskAnalysis?: boolean; // Default: true
  // maxConcurrentScans?: number; // Need to implement this.
}

/**
 * Result of a size calculation.
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
  modificationTime: number;
}

/**
 * Options for delete operations.
 */
export interface DeleteOptions {
  /** If true, simulate deletion without actually removing files. */
  dryRun?: boolean;
}

/**
 * Why a deletion failed.
 */
export interface DeleteError {
  /** Human-readable error message. */
  message: string;
  /** Error code if available. */
  code?: string;
}

/**
 * Result of a delete operation. Only failures carry an error.
 */
export type DeleteResult =
  | {
      /** Absolute path that was deleted. */
      path: string;
      success: true;
    }
  | {
      /** Absolute path that could not be deleted. */
      path: string;
      success: false;
      error: DeleteError;
    };
