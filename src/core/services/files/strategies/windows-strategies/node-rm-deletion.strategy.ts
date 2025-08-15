import { rm } from 'fs/promises';
import { IDeletionStrategy } from '../deletion-strategy.interface.js';

export class NodeRmDeletionStrategy implements IDeletionStrategy {
  readonly name = 'node-rm';

  async isAvailable(): Promise<boolean> {
    return Promise.resolve(true);
  }

  async delete(path: string): Promise<boolean> {
    try {
      await rm(path, {
        recursive: true,
        force: true,
        // maxRetries: Automatically retry on Windows if files are locked
        maxRetries: process.platform === 'win32' ? 3 : 0,
        retryDelay: 100,
      });
      return true;
    } catch (error) {
      // If the directory doesn't exist, consider it a success
      if (error && (error as any).code === 'ENOENT') {
        return true;
      }
      throw error;
    }
  }
}
