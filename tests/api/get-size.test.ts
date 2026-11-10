import { afterEach, beforeAll, describe, expect, it } from '@jest/globals';
import {
  closeSync,
  linkSync,
  mkdirSync,
  openSync,
  statSync,
  symlinkSync,
  ftruncateSync,
} from 'node:fs';
import { basename, dirname, join } from 'node:path';
import type { ScanOptions } from '../../src/index.js';
import {
  createNpkill,
  stopCreatedInstances,
} from './support/npkill-package.js';
import {
  createTempDir,
  inDirectory,
  itOnUnix,
  itWithUnixPermissions,
  lockPermissions,
  observe,
  removeTempDirs,
  writeRandomFile,
} from './support/helpers.js';

const NODE_MODULES: ScanOptions = { targets: ['node_modules'] };
const FILE_SIZE = 64 * 1024;
const FOLDER_SIZE = 4096;

let npkill: ReturnType<typeof createNpkill>;

beforeAll(() => {
  npkill = createNpkill();
});

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

    const outcome = await observe(npkill.getSize$(missing));

    expect(outcome.error).toBeInstanceOf(Error);
  });

  it('emits the size of a folder once and completes', async () => {
    const outcome = await observe(npkill.getSize$(createFolderWithFile()));

    expect(outcome).toEqual({
      values: [{ size: FILE_SIZE }],
      completed: true,
      error: undefined,
    });
  });

  it('adds up the files in every subfolder', async () => {
    const folder = createTempDir();
    mkdirSync(join(folder, 'lib', 'deep'), { recursive: true });
    writeRandomFile(join(folder, 'lib', 'a.bin'), FILE_SIZE);
    writeRandomFile(join(folder, 'lib', 'deep', 'b.bin'), FILE_SIZE);

    const outcome = await observe(npkill.getSize$(folder));

    expect(sizes(outcome.values)).toEqual([2 * FILE_SIZE + 2 * FOLDER_SIZE]);
  });

  it('counts a file with two hard links twice', async () => {
    const folder = createFolderWithFile();
    linkSync(join(folder, 'blob.bin'), join(folder, 'blob-link.bin'));

    const outcome = await observe(npkill.getSize$(folder));

    expect(sizes(outcome.values)).toEqual([2 * FILE_SIZE]);
  });

  itOnUnix('counts the blocks a file uses on disk', async () => {
    const file = join(createTempDir(), 'sparse.bin');
    const descriptor = openSync(file, 'w');
    ftruncateSync(descriptor, 8 * 1024 * 1024);
    closeSync(descriptor);

    const outcome = await observe(npkill.getSize$(file));

    expect(sizes(outcome.values)).toEqual([statSync(file).blocks * 512]);
  });

  it('measures a relative path', async () => {
    const folder = createFolderWithFile();

    const outcome = await inDirectory(dirname(folder), () =>
      observe(npkill.getSize$(basename(folder))),
    );

    expect(sizes(outcome.values)).toEqual([FILE_SIZE]);
  });

  it('measures the folder again on each subscription', async () => {
    const folder = createFolderWithFile();
    const size$ = npkill.getSize$(folder);

    const first = await observe(size$);
    writeRandomFile(join(folder, 'other.bin'), FILE_SIZE);
    const second = await observe(size$);

    expect(sizes(first.values)).toEqual([FILE_SIZE]);
    expect(sizes(second.values)).toEqual([2 * FILE_SIZE]);
  });

  it('answers each request with its own size', async () => {
    const small = createFolderWithFile();
    const big = createFolderWithFile();
    writeRandomFile(join(big, 'other.bin'), FILE_SIZE);

    const [smallOutcome, bigOutcome] = await Promise.all([
      observe(npkill.getSize$(small)),
      observe(npkill.getSize$(big)),
    ]);

    expect(sizes(smallOutcome.values)).toEqual([FILE_SIZE]);
    expect(sizes(bigOutcome.values)).toEqual([2 * FILE_SIZE]);
  });

  itWithUnixPermissions(
    'errors when the folder can be read but not entered',
    async () => {
      const folder = createFolderWithFile();
      lockPermissions(folder, 0o444);

      const outcome = await observe(npkill.getSize$(folder));

      expect(outcome.error).toBeInstanceOf(Error);
    },
  );

  itWithUnixPermissions(
    'still answers when a subfolder cannot be read',
    async () => {
      const folder = createFolderWithFile();
      const locked = join(folder, 'locked');
      mkdirSync(locked);
      writeRandomFile(join(locked, 'hidden.bin'), FILE_SIZE);
      lockPermissions(locked, 0o000);

      const outcome = await observe(npkill.getSize$(folder));

      expect(sizes(outcome.values)[0]).toBeGreaterThanOrEqual(FILE_SIZE);
      expect(sizes(outcome.values)[0]).toBeLessThan(2 * FILE_SIZE);
    },
  );

  it('errors at once when the path is empty', async () => {
    const outcome = await observe(npkill.getSize$(''), 1000);

    expect(outcome.error).toBeInstanceOf(Error);
  });

  itOnUnix('does not count the symlinks inside a folder', async () => {
    const folder = createFolderWithFile();
    const outside = createFolderWithFile();
    symlinkSync(outside, join(folder, 'linked-folder'), 'dir');
    symlinkSync(join(outside, 'blob.bin'), join(folder, 'linked-file.bin'));
    symlinkSync('x'.repeat(300), join(folder, 'link-with-its-own-block'));

    const outcome = await observe(npkill.getSize$(folder));

    expect(sizes(outcome.values)).toEqual([FILE_SIZE]);
  });

  it('measures a file', async () => {
    const file = join(createTempDir(), 'model.gguf');
    writeRandomFile(file, FILE_SIZE);

    const outcome = await observe(npkill.getSize$(file));

    expect(sizes(outcome.values)).toEqual([FILE_SIZE]);
  });

  itOnUnix.each([
    ['without a trailing slash', ''],
    ['with a trailing slash', '/'],
  ])(
    'measures a symlink instead of the folder it points to %s',
    async (_case, suffix) => {
      const link = join(createTempDir(), 'link');
      symlinkSync(createFolderWithFile(), link, 'dir');

      const outcome = await observe(npkill.getSize$(`${link}${suffix}`));

      expect(sizes(outcome.values)).toEqual([expect.any(Number)]);
      expect(sizes(outcome.values)[0]).toBeLessThan(FILE_SIZE);
    },
  );

  it('is not cancelled by starting or stopping a scan', async () => {
    const folder = createFolderWithFile();

    const size = observe(npkill.getSize$(folder));
    npkill.startScan$(createTempDir(), NODE_MODULES).subscribe();
    npkill.stopScan();

    expect(sizes((await size).values)).toEqual([FILE_SIZE]);
  });
});
