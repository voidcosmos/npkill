import { CliScanFoundTarget } from '../interfaces/stats.interface.js';
import { DeleteResult } from '../../core/interfaces/target.interface.js';
import {
  JsonStreamOutput,
  JsonSimpleOutput,
  JsonErrorOutput,
  JsonCliScanFoundTarget,
  JsonDeletion,
} from '../interfaces/json-output.interface.js';
import { convertGbToBytes } from '../../utils/unit-conversions.js';
import { isModificationTimeKnown } from '../../utils/is-modification-time-known.js';
import { NoUiOutput } from '../interfaces/no-ui-output.interface.js';

export class JsonOutputService implements NoUiOutput {
  private readonly OUTPUT_VERSION = 1;
  private results: JsonCliScanFoundTarget[] = [];
  private scanStartTime: number = 0;
  private isStreamMode: boolean = false;
  private measuresSize: boolean = true;

  constructor(
    private readonly stdout: NodeJS.WriteStream = process.stdout,
    private readonly stderr: NodeJS.WriteStream = process.stderr,
  ) {}

  initializeSession(
    streamMode: boolean = false,
    measuresSize: boolean = true,
  ): void {
    this.results = [];
    this.scanStartTime = Date.now();
    this.isStreamMode = streamMode;
    this.measuresSize = measuresSize;
  }

  processResult(result: CliScanFoundTarget, deletion?: DeleteResult): void {
    const output = this.sanitizeResultForOutput(result, deletion);
    if (this.isStreamMode) {
      this.writeStreamResult(output);
    } else {
      this.results.push(output);
    }
  }

  completeScan(): void {
    if (!this.isStreamMode) {
      this.writeSimpleResults();
    }
  }

  async flush(): Promise<void> {
    await new Promise<void>((resolve) => {
      this.stdout.write('', () => resolve());
    });
    await new Promise<void>((resolve) => {
      this.stderr.write('', () => resolve());
    });
  }

  private writeStreamResult(result: JsonCliScanFoundTarget): void {
    const output: JsonStreamOutput = {
      version: this.OUTPUT_VERSION,
      result,
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
      timestamp: Date.now(),
    };

    this.stderr.write(JSON.stringify(errorOutput) + '\n');
  }

  getResultsCount(): number {
    return this.results.length;
  }

  handleShutdown(): void {
    if (!this.isStreamMode) {
      this.writeSimpleResults();
    }
  }

  private sanitizeResultForOutput(
    result: CliScanFoundTarget,
    deletion?: DeleteResult,
  ): JsonCliScanFoundTarget {
    return {
      path: result.path,
      size: this.measuresSize ? convertGbToBytes(result.size) : null,
      projectModificationTime: isModificationTimeKnown(result.modificationTime)
        ? result.modificationTime
        : null,
      riskAnalysis: result.riskAnalysis
        ? {
            isSensitive: result.riskAnalysis.isSensitive,
            reason: result.riskAnalysis.reason,
          }
        : undefined,
      ...(deletion ? { deletion: this.toJsonDeletion(deletion) } : {}),
    };
  }

  private toJsonDeletion(deletion: DeleteResult): JsonDeletion {
    return deletion.success
      ? { success: true }
      : { success: false, error: deletion.error?.message };
  }
}
