export interface IDeletionStrategy {
  readonly name: string;

  /**
   * Checks if this deletion strategy is available on the current system.
   * @returns Promise resolving to true if the strategy can be used.
   */
  isAvailable(): Promise<boolean>;

  /**
   * Deletes a directory using this strategy.
   * @param path Path to the directory to delete.
   * @returns Promise resolving to true if deletion was successful.
   */
  delete(path: string): Promise<boolean>;
}
