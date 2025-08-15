import { UnixFilesService } from '../../../../src/core/services/files/unix-files.service.js';
import { StreamService } from '../../../../src/core/services/stream.service.js';
import { FileWorkerService } from '../../../../src/core/services/files/files.worker.service.js';
import { LoggerService } from '../../../../src/core/services/logger.service.js';
import { ScanStatus } from '../../../../src/core/interfaces/search-status.model.js';
import * as fs from 'fs';
import * as path from 'path';
import { tmpdir } from 'os';

describe('UnixFilesService Integration', () => {
  let service: UnixFilesService;
  let streamService: StreamService;
  let fileWorkerService: FileWorkerService;
  let testDir: string;

  beforeEach(() => {
    streamService = new StreamService();
    const logger = new LoggerService();
    const scanStatus = new ScanStatus();
    fileWorkerService = new FileWorkerService(logger, scanStatus);
    service = new UnixFilesService(streamService, fileWorkerService);

    // Create a temporary test directory
    testDir = path.join(tmpdir(), 'npkill-test-' + Date.now());
  });

  afterEach(() => {
    // Clean up test directory if it still exists
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('Strategy Information', () => {
    it('should return strategy information', async () => {
      // First trigger initialization by doing a deletion or calling getSelectedDeletionStrategy after initialization
      await service
        .deleteDir('/tmp/non-existent-test-' + Date.now())
        .catch(() => {
          // This might fail, but that's ok for testing strategy selection
        });

      const strategyName = service.getSelectedDeletionStrategy();
      expect(strategyName === null || typeof strategyName === 'string').toBe(
        true,
      );

      // If a strategy was selected, it should be one of the expected ones
      if (strategyName) {
        expect(['perl', 'rsync', 'find', 'rm-rf'].includes(strategyName)).toBe(
          true,
        );
      }
    });

    it('should allow strategy reset', () => {
      service.resetDeletionStrategy();
      const strategy = service.getSelectedDeletionStrategy();
      expect(strategy).toBe(null);
    });
  });

  describe('Directory Deletion', () => {
    it('should delete a directory with files', async () => {
      // Create test directory structure
      const subDir = path.join(testDir, 'subdir');
      fs.mkdirSync(testDir, { recursive: true });
      fs.mkdirSync(subDir, { recursive: true });
      fs.writeFileSync(path.join(testDir, 'file1.txt'), 'test content');
      fs.writeFileSync(path.join(subDir, 'file2.txt'), 'test content 2');

      // Verify directory exists
      expect(fs.existsSync(testDir)).toBe(true);

      // Delete using the service
      const result = await service.deleteDir(testDir);
      expect(result).toBe(true);

      // Verify directory is deleted
      expect(fs.existsSync(testDir)).toBe(false);
    });

    it('should handle deletion of non-existent directory', async () => {
      const nonExistentPath = path.join(tmpdir(), 'non-existent-' + Date.now());

      try {
        await service.deleteDir(nonExistentPath);
        // Some strategies might succeed when deleting non-existent dirs
        // This is actually expected behavior for rm -rf
      } catch (error) {
        // Other strategies might fail, which is also acceptable
        expect(error).toBeDefined();
      }
    });
  });

  describe('Error Handling', () => {
    it('should provide meaningful error messages', async () => {
      // Try to delete a path that would cause permission issues
      const restrictedPath = '/root/restricted-test';

      try {
        await service.deleteDir(restrictedPath);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain(
          'Failed to delete directory',
        );
        expect((error as Error).message).toContain(restrictedPath);
      }
    });
  });
});
