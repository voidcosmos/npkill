import { CliScanFoundTarget } from './stats.interface.js';

export interface JsonOutputBase {
  version: number;
}

export interface JsonCliScanFoundTarget
  extends Omit<CliScanFoundTarget, 'status'> {}

/**
 * JSON output format for streaming mode (--json-stream).
 * Each result is output as a separate JSON object on its own line.
 */
export interface JsonStreamOutput extends JsonOutputBase {
  result: JsonCliScanFoundTarget;
}

/**
 * JSON output format for simple mode (--json).
 * All results are collected and output as a single JSON object at the end.
 */
export interface JsonSimpleOutput extends JsonOutputBase {
  results: JsonCliScanFoundTarget[];
  meta: {
    resultsCount: number;
    /** Scan duration in milliseconds */
    runDuration: number;
  };
}

export interface JsonErrorOutput extends JsonOutputBase {
  error: true;
  message: string;
  timestamp: number; // Unix timestamp in milliseconds
}
