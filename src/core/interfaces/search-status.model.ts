import { WorkerStatus } from '../services/files/files.worker.service';

/**
 * Tracks the progress and status of directory scanning operations.
 * Maintains counters for various stages of the scan process including
 * search tasks, statistics calculation, and deletion operations.
 */
export class ScanStatus {
  /** Number of search tasks currently pending execution. */
  public pendingSearchTasks = 0;
  /** Number of search tasks that have been completed. */
  public completedSearchTasks = 0;
  /** Number of pending statistics calculations for found directories. */
  public pendingStatsCalculation = 0;
  /** Number of completed statistics calculations. */
  public completedStatsCalculation = 0;
  /** Total number of matching directories found during the scan. */
  public resultsFound = 0;
  /** Number of deletion operations currently pending. */
  public pendingDeletions = 0;
  /** Current status of the worker threads handling the scan. */
  public workerStatus: WorkerStatus = 'stopped';
  /** Information about active worker jobs. */
  public workersJobs;

  /**
   * Records the discovery of a new matching directory.
   * Increments result count and pending statistics calculation.
   */
  newResult(): void {
    this.resultsFound++;
    this.pendingStatsCalculation++;
  }

  /**
   * Records the completion of a statistics calculation.
   * Decrements pending count and increments completed count.
   */
  completeStatCalculation(): void {
    this.pendingStatsCalculation--;
    this.completedStatsCalculation++;
  }

  reset() {
    this.pendingSearchTasks = 0;
    this.completedSearchTasks = 0;
    this.pendingStatsCalculation = 0;
    this.completedStatsCalculation = 0;
    this.resultsFound = 0;
    this.pendingDeletions = 0;
  }
}
