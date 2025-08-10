import { DeletionStrategyManager } from '../../../../../src/core/services/files/strategies/strategy-manager.js';
import { IDeletionStrategy } from '../../../../../src/core/services/files/strategies/deletion-strategy.interface.js';

class MockStrategy implements IDeletionStrategy {
  constructor(
    public readonly name: string,
    private availabilityResult: boolean = true,
    private deleteResult: boolean = true,
  ) {}

  async isAvailable(): Promise<boolean> {
    return this.availabilityResult;
  }

  async delete(path: string): Promise<boolean> {
    if (!this.deleteResult) {
      throw new Error(`Mock deletion failed for ${path}`);
    }
    return this.deleteResult;
  }
}

describe('DeletionStrategyManager', () => {
  let manager: DeletionStrategyManager;

  beforeEach(() => {
    manager = new DeletionStrategyManager();
  });

  describe('Strategy Selection', () => {
    it('should initialize and select the first available strategy', async () => {
      // Register some mock strategies first
      manager.registerStrategy(new MockStrategy('mock1', true));
      manager.registerStrategy(new MockStrategy('mock2', false));
      manager.registerStrategy(new MockStrategy('mock3', true));

      const strategy = await manager.initializeStrategy();
      expect(strategy).toBeDefined();
      expect(strategy?.name).toBe('mock1'); // Should select the first available one
    });

    it('should cache the selected strategy after initialization', async () => {
      manager.registerStrategy(new MockStrategy('mock1', true));

      const firstCall = await manager.initializeStrategy();
      const secondCall = await manager.initializeStrategy();
      expect(firstCall).toBe(secondCall);
    });

    it('should return the same strategy when called multiple times', async () => {
      manager.registerStrategy(new MockStrategy('mock1', true));

      const strategy1 = await manager.initializeStrategy();
      const strategy2 = manager.getSelectedStrategy();
      expect(strategy1).toBe(strategy2);
    });
  });

  describe('Directory Deletion', () => {
    it('should delete directory using selected strategy', async () => {
      manager.registerStrategy(new MockStrategy('mock1', true, true));

      const result = await manager.deleteDirectory('/tmp/test');
      expect(result).toBe(true);
    });

    it('should throw error when no strategies are available', async () => {
      // Don't register any strategies
      manager.resetStrategy();

      try {
        await manager.deleteDirectory('/tmp/test');
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain(
          'No deletion strategies are available',
        );
      }
    });
  });

  describe('Strategy Management', () => {
    it('should reset strategy selection', async () => {
      manager.registerStrategy(new MockStrategy('mock1', true));

      await manager.initializeStrategy();
      const firstStrategy = manager.getSelectedStrategy();
      expect(firstStrategy).toBeDefined();

      manager.resetStrategy();
      const afterReset = manager.getSelectedStrategy();
      expect(afterReset).toBeNull();
    });

    it('should return all registered strategies', () => {
      manager.registerStrategy(new MockStrategy('mock1', true));
      manager.registerStrategy(new MockStrategy('mock2', true));

      const strategies = manager.getAllStrategies();
      expect(strategies.length).toBe(2);
      expect(strategies[0].name).toBe('mock1');
      expect(strategies[1].name).toBe('mock2');
    });
  });
});

describe('Individual Deletion Strategies', () => {
  it('should test strategy availability checks', async () => {
    const manager = new DeletionStrategyManager();
    // Register some mock strategies to test
    manager.registerStrategy(new MockStrategy('mock1', true));
    manager.registerStrategy(new MockStrategy('mock2', false));

    const strategies = manager.getAllStrategies();

    for (const strategy of strategies) {
      const isAvailable = await strategy.isAvailable();
      expect(typeof isAvailable).toBe('boolean');
    }
  });
});
