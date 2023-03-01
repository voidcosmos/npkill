export class SearchStatus {
  public pendingSearchTasks = 0;
  public completedSearchTasks = 0;
  public pendingStatsCalculation = 0;
  public completedStatsCalculation = 0;
  public resultsFound = 0;

  newResult() {
    this.resultsFound++;
    this.pendingStatsCalculation++;
  }

  completeStatCalculation() {
    this.pendingStatsCalculation--;
    this.completedStatsCalculation++;
  }
}
