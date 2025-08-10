import { IDeletionStrategy } from './deletion-strategy.interface.js';

/**
 * Manages and coordinates different deletion strategies.
 */
export class DeletionStrategyManager {
  private availableStrategies: IDeletionStrategy[] = [];
  private selectedStrategy: IDeletionStrategy | null = null;
  private strategiesInitialized = false;

  constructor() {}

  /**
   * Registers a deletion strategy.
   * Strategies are tested in the order they are registered.
   * @param strategy The strategy to register.
   */
  registerStrategy(strategy: IDeletionStrategy): void {
    this.availableStrategies.push(strategy);
  }

  /**
   * Initializes and selects the best available deletion strategy.
   * This method tests strategies in registration order and caches the first available one.
   * @returns Promise resolving to the selected strategy, or null if none are available.
   */
  async initializeStrategy(): Promise<IDeletionStrategy | null> {
    if (this.strategiesInitialized && this.selectedStrategy) {
      return this.selectedStrategy;
    }

    for (const strategy of this.availableStrategies) {
      try {
        const isAvailable = await strategy.isAvailable();
        if (isAvailable) {
          this.selectedStrategy = strategy;
          this.strategiesInitialized = true;
          return strategy;
        }
      } catch (error) {
        // Strategy check failed, continue to next one
        console.warn(`Strategy ${strategy.name} check failed:`, error);
      }
    }

    this.strategiesInitialized = true;
    return null;
  }

  /**
   * Deletes a directory using the selected strategy.
   * Automatically initializes strategy if not already done.
   * @param path Path to the directory to delete.
   * @returns Promise resolving to true if deletion was successful.
   * @throws Error if no strategies are available or deletion fails.
   */
  async deleteDirectory(path: string): Promise<boolean> {
    if (!this.selectedStrategy) {
      await this.initializeStrategy();
    }

    if (!this.selectedStrategy) {
      throw new Error('No deletion strategies are available on this system');
    }

    try {
      return await this.selectedStrategy.delete(path);
    } catch (error) {
      throw new Error(
        `Deletion failed using ${this.selectedStrategy.name} strategy: ${error}`,
      );
    }
  }

  /**
   * Gets the currently selected strategy.
   * @returns The selected strategy or null if none is selected.
   */
  getSelectedStrategy(): IDeletionStrategy | null {
    return this.selectedStrategy;
  }

  /**
   * Gets all registered strategies.
   * @returns Array of all registered strategies.
   */
  getAllStrategies(): readonly IDeletionStrategy[] {
    return [...this.availableStrategies];
  }

  /**
   * Resets the strategy selection, forcing re-evaluation on next deletion.
   */
  resetStrategy(): void {
    this.selectedStrategy = null;
    this.strategiesInitialized = false;
  }
}
