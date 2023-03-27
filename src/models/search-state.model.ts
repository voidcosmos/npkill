import { WorkerStatus } from '../services';

export class SearchStatus {
  public pendingSearchTasks = 0;
  public completedSearchTasks = 0;
  public pendingStatsCalculation = 0;
  public completedStatsCalculation = 0;
  public resultsFound = 0;
  public workerStatus: WorkerStatus = 'stopped';
  public workersJobs;

  newResult(): void {
    this.resultsFound++;
    this.pendingStatsCalculation++;
  }

  completeStatCalculation(): void {
    this.pendingStatsCalculation--;
    this.completedStatsCalculation++;
  }
}
