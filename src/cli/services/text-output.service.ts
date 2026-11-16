import { CliScanFoundTarget } from '../interfaces/stats.interface.js';
import { DeleteResult } from '../../core/interfaces/target.interface.js';
import { NoUiOutput } from '../interfaces/no-ui-output.interface.js';
import { formatSize } from '../../utils/unit-conversions.js';

export interface TextOutputOptions {
  sizeUnit: 'auto' | 'mb' | 'gb';
  measuresSize: boolean;
  dryRun: boolean;
}

/**
 * Plain text output for `--delete-all -y`: one line per deleted folder and a
 * summary at the end. Failures and errors go to stderr.
 */
export class TextOutputService implements NoUiOutput {
  private options: TextOutputOptions = {
    sizeUnit: 'auto',
    measuresSize: true,
    dryRun: false,
  };

  private deletedCount = 0;
  private failedCount = 0;
  private freedSizeInGb = 0;
  private isSummaryWritten = false;

  constructor(
    private readonly stdout: NodeJS.WriteStream = process.stdout,
    private readonly stderr: NodeJS.WriteStream = process.stderr,
  ) {}

  initializeSession(options: TextOutputOptions): void {
    this.options = options;
    this.deletedCount = 0;
    this.failedCount = 0;
    this.freedSizeInGb = 0;
    this.isSummaryWritten = false;
  }

  processResult(result: CliScanFoundTarget, deletion?: DeleteResult): void {
    if (deletion === undefined) {
      return;
    }

    if (!deletion.success) {
      this.failedCount++;
      const reason = deletion.error?.message ?? 'Unknown error';
      this.stderr.write(`Failed to delete ${result.path}: ${reason}\n`);
      return;
    }

    this.deletedCount++;
    this.freedSizeInGb += result.size;
    const verb = this.options.dryRun ? 'Would delete' : 'Deleted';
    const size = this.options.measuresSize
      ? ` (${this.formatSize(result.size)})`
      : '';
    this.stdout.write(`${verb} ${result.path}${size}\n`);
  }

  completeScan(): void {
    this.writeSummary();
  }

  handleShutdown(): void {
    this.stderr.write('Interrupted. Some folders may not have been deleted.\n');
    this.writeSummary();
  }

  writeError(error: Error | string): void {
    const message = error instanceof Error ? error.message : error;
    this.stderr.write(`Error: ${message}\n`);
  }

  async flush(): Promise<void> {
    await new Promise<void>((resolve) => {
      this.stdout.write('', () => resolve());
    });
    await new Promise<void>((resolve) => {
      this.stderr.write('', () => resolve());
    });
  }

  private writeSummary(): void {
    if (this.isSummaryWritten) {
      return;
    }
    this.isSummaryWritten = true;

    if (this.deletedCount === 0 && this.failedCount === 0) {
      this.stdout.write('No folders found to delete.\n');
      return;
    }

    const { dryRun, measuresSize } = this.options;
    const folders = (count: number) =>
      `${count} ${count === 1 ? 'folder' : 'folders'}`;

    let summary = `${dryRun ? 'Dry run: would delete' : 'Done: deleted'} ${folders(this.deletedCount)}`;
    if (measuresSize) {
      summary += `, ${dryRun ? 'would free' : 'freed'} ${this.formatSize(this.freedSizeInGb)}`;
    }
    if (this.failedCount > 0) {
      summary += `, ${this.failedCount} failed`;
    }
    this.stdout.write(summary + '.\n');
  }

  private formatSize(sizeInGb: number): string {
    return formatSize(sizeInGb, this.options.sizeUnit).text;
  }
}
