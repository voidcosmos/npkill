import { afterEach, describe, expect, it } from '@jest/globals';
import { mkdirSync, symlinkSync } from 'node:fs';
import { join } from 'node:path';
import type { ScanOptions } from '../../src/index.js';
import {
  createNpkill,
  stopCreatedInstances,
} from './support/npkill-package.js';
import {
  createTempDir,
  itOnUnix,
  itWithUnixPermissions,
  lockPermissions,
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

  it('emits the size of a folder once and completes', async () => {
    const outcome = await observe(
      createNpkill().getSize$(createFolderWithFile()),
      SIZE_TIMEOUT_MS,
    );

    expect(outcome).toEqual({
      values: [{ size: FILE_SIZE }],
      completed: true,
      error: undefined,
    });
  });

  it('counts every file of a folder', async () => {
    const folder = createTempDir();
    const fileCount = 10;
    for (let index = 0; index < fileCount; index++) {
      writeRandomFile(join(folder, `chunk-${index}.bin`), FILE_SIZE);
    }

    const outcome = await observe(
      createNpkill().getSize$(folder),
      SIZE_TIMEOUT_MS,
    );

    expect(sizes(outcome.values)).toEqual([fileCount * FILE_SIZE]);
  });

  it('adds up the files in every subfolder', async () => {
    const folder = createTempDir();
    mkdirSync(join(folder, 'lib', 'deep'), { recursive: true });
    writeRandomFile(join(folder, 'lib', 'a.bin'), FILE_SIZE);
    writeRandomFile(join(folder, 'lib', 'deep', 'b.bin'), FILE_SIZE);

    const outcome = await observe(
      createNpkill().getSize$(folder),
      SIZE_TIMEOUT_MS,
    );

    expect(sizes(outcome.values)[0]).toBeGreaterThanOrEqual(2 * FILE_SIZE);
  });

  it('answers each request with its own size', async () => {
    const small = createFolderWithFile();
    const big = createFolderWithFile();
    writeRandomFile(join(big, 'other.bin'), FILE_SIZE);
    const npkill = createNpkill();

    const [smallOutcome, bigOutcome] = await Promise.all([
      observe(npkill.getSize$(small), SIZE_TIMEOUT_MS),
      observe(npkill.getSize$(big), SIZE_TIMEOUT_MS),
    ]);

    expect(sizes(smallOutcome.values)).toEqual([FILE_SIZE]);
    expect(sizes(bigOutcome.values)).toEqual([2 * FILE_SIZE]);
  });

  itWithUnixPermissions('errors when the folder cannot be read', async () => {
    const folder = createFolderWithFile();
    lockPermissions(folder, 0o000);

    const outcome = await observe(
      createNpkill().getSize$(folder),
      SIZE_TIMEOUT_MS,
    );

    expect(outcome.error).toBeInstanceOf(Error);
  });

  itWithUnixPermissions(
    'still answers when a subfolder cannot be read',
    async () => {
      const folder = createFolderWithFile();
      const locked = join(folder, 'locked');
      mkdirSync(locked);
      writeRandomFile(join(locked, 'hidden.bin'), FILE_SIZE);
      lockPermissions(locked, 0o000);

      const outcome = await observe(
        createNpkill().getSize$(folder),
        SIZE_TIMEOUT_MS,
      );

      expect(sizes(outcome.values)[0]).toBeGreaterThanOrEqual(FILE_SIZE);
      expect(sizes(outcome.values)[0]).toBeLessThan(2 * FILE_SIZE);
    },
  );

  it('errors at once when the path is empty', async () => {
    const outcome = await observe(createNpkill().getSize$(''), 1000);

    expect(outcome.error).toBeInstanceOf(Error);
  });

  itOnUnix(
    'measures a symlink given with a trailing slash as the link itself',
    async () => {
      const link = join(createTempDir(), 'link');
      symlinkSync(createFolderWithFile(), link, 'dir');

      const outcome = await observe(
        createNpkill().getSize$(`${link}/`),
        SIZE_TIMEOUT_MS,
      );

      expect(sizes(outcome.values)[0]).toBeLessThan(FILE_SIZE);
    },
  );

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
