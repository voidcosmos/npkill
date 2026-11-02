import { afterEach, describe, expect, it } from '@jest/globals';
import { symlinkSync } from 'node:fs';
import { join } from 'node:path';
import type { ScanOptions } from '../../src/index.js';
import {
  createNpkill,
  stopCreatedInstances,
} from './support/npkill-package.js';
import {
  createTempDir,
  itOnUnix,
  observe,
  removeTempDirs,
  writeRandomFile,
} from './support/helpers.js';

const NODE_MODULES: ScanOptions = { targets: ['node_modules'] };
const SIZE_TIMEOUT_MS = 2500;
const FILE_SIZE = 64 * 1024;

afterEach(() => {
  stopCreatedInstances();
  removeTempDirs();
});

function createFolderWithFile(): string {
  const folder = createTempDir();
  writeRandomFile(join(folder, 'blob.bin'), FILE_SIZE);
  return folder;
}

function sizes(values: Array<{ size: number }>): number[] {
  return values.map(({ size }) => size);
}

describe('getSize$', () => {
  it('errors when the path does not exist', async () => {
    const missing = join(createTempDir(), 'missing');

    const outcome = await observe(
      createNpkill().getSize$(missing),
      SIZE_TIMEOUT_MS,
    );

    expect(outcome.error).toBeInstanceOf(Error);
  });

  it('measures a file', async () => {
    const file = join(createTempDir(), 'model.gguf');
    writeRandomFile(file, FILE_SIZE);

    const outcome = await observe(
      createNpkill().getSize$(file),
      SIZE_TIMEOUT_MS,
    );

    expect(sizes(outcome.values)).toEqual([FILE_SIZE]);
  });

  itOnUnix(
    'measures a symlink instead of the folder it points to',
    async () => {
      const link = join(createTempDir(), 'link');
      symlinkSync(createFolderWithFile(), link, 'dir');

      const outcome = await observe(
        createNpkill().getSize$(link),
        SIZE_TIMEOUT_MS,
      );

      expect(sizes(outcome.values)).toEqual([expect.any(Number)]);
      expect(sizes(outcome.values)[0]).toBeLessThan(FILE_SIZE);
    },
  );

  it('still answers after stopScan()', async () => {
    const folder = createFolderWithFile();
    const npkill = createNpkill();
    npkill.startScan$(createTempDir(), NODE_MODULES).subscribe();
    npkill.stopScan();

    const outcome = await observe(npkill.getSize$(folder), SIZE_TIMEOUT_MS);

    expect(sizes(outcome.values)).toEqual([FILE_SIZE]);
  });

  it('is not cancelled by starting a scan', async () => {
    const folder = createFolderWithFile();
    const npkill = createNpkill();

    const size = observe(npkill.getSize$(folder), SIZE_TIMEOUT_MS);
    npkill.startScan$(createTempDir(), NODE_MODULES).subscribe();

    expect(sizes((await size).values)).toEqual([FILE_SIZE]);
  });
});
