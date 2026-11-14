import { CliScanFoundTarget } from './stats.interface.js';
import { DeleteResult } from '../../core/interfaces/target.interface.js';

/** Output used when npkill runs without the interactive interface. */
export interface NoUiOutput {
  processResult(result: CliScanFoundTarget, deletion?: DeleteResult): void;
  completeScan(): void;
  writeError(error: Error | string): void;
  handleShutdown(): void;
  flush(): Promise<void>;
}
