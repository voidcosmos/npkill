import { CliScanFoundFolder } from '../interfaces/stats.interface.js';
import {
  JsonStreamOutput,
  JsonSimpleOutput,
  JsonErrorOutput,
  JsonCliScanFoundFolder,
} from '../interfaces/json-output.interface.js';
import { convertGbToBytes } from '../../utils/unit-conversions.js';

export class JsonOutputService {
  private readonly OUTPUT_VERSION = 1;
  private results: JsonCliScanFoundFolder[] = [];
  private scanStartTime: number = 0;
  private isStreamMode: boolean = false;

  constructor(
    private readonly stdout: NodeJS.WriteStream = process.stdout,
    private readonly stderr: NodeJS.WriteStream = process.stderr,
  ) {}

  initializeSession(streamMode: boolean = false): void {
    this.results = [];
    this.scanStartTime = Date.now();
    this.isStreamMode = streamMode;
  }

  processResult(folder: CliScanFoundFolder): void {
    if (this.isStreamMode) {
      this.writeStreamResult(folder);
    } else {
      this.addResult(folder);
    }
  }

  completeScan(): void {
    if (!this.isStreamMode && this.results.length > 0) {
      this.writeSimpleResults();
    }
  }

  private writeStreamResult(folder: CliScanFoundFolder): void {
    const output: JsonStreamOutput = {
      version: this.OUTPUT_VERSION,
      result: this.sanitizeFolderForOutput(folder),
    };

    try {
      this.stdout.write(JSON.stringify(output) + '\n');
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Unknown JSON serialization error';
      this.writeError(`Failed to serialize result to JSON: ${errorMessage}`);
    }
  }

  private addResult(folder: CliScanFoundFolder): void {
    this.results.push(this.sanitizeFolderForOutput(folder));
  }

  private writeSimpleResults(): void {
    const runDuration = Date.now() - this.scanStartTime;
    const output: JsonSimpleOutput = {
      version: this.OUTPUT_VERSION,
      results: this.results,
      meta: {
        resultsCount: this.results.length,
        runDuration,
      },
    };

    try {
      this.stdout.write(JSON.stringify(output, null, 2) + '\n');
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Unknown JSON serialization error';
      this.writeError(`Failed to serialize results to JSON: ${errorMessage}`);
    }
  }

  writeError(error: Error | string): void {
    const errorMessage = error instanceof Error ? error.message : error;
    const errorOutput: JsonErrorOutput = {
      version: this.OUTPUT_VERSION,
      error: true,
      message: errorMessage,
      timestamp: new Date().getDate(),
    };

    this.stderr.write(JSON.stringify(errorOutput) + '\n');
  }

  getResultsCount(): number {
    return this.results.length;
  }

  handleShutdown(): void {
    if (!this.isStreamMode && this.results.length > 0) {
      this.writeSimpleResults();
    }
  }

  private sanitizeFolderForOutput(
    folder: CliScanFoundFolder,
  ): JsonCliScanFoundFolder {
    return {
      path: folder.path,
      size: convertGbToBytes(folder.size),
      modificationTime: folder.modificationTime,
      riskAnalysis: folder.riskAnalysis
        ? {
            isSensitive: folder.riskAnalysis.isSensitive,
            reason: folder.riskAnalysis.reason,
          }
        : undefined,
    };
  }
}
