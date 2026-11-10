import { afterEach, describe, expect, it } from '@jest/globals';
import { symlinkSync, utimesSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import {
  createNpkill,
  stopCreatedInstances,
} from './support/npkill-package.js';
import {
  createTempDir,
  createTree,
  inDirectory,
  itOnUnix,
  itWithUnixPermissions,
  lockPermissions,
  observe,
  removeTempDirs,
} from './support/helpers.js';

afterEach(() => {
  stopCreatedInstances();
  removeTempDirs();
});

function writeFileModifiedAt(path: string, modifiedAt: Date): void {
  writeFileSync(path, '');
  utimesSync(path, modifiedAt, modifiedAt);
}

describe('getNewestFile$', () => {
  it('finds the newest file in any subfolder', async () => {
    const folder = createTree(['src/lib']);
    const newestFile = join(folder, 'src', 'lib', 'parser.js');
    const modifiedAt = new Date('2026-03-01T00:00:00.000Z');
    writeFileModifiedAt(join(folder, 'index.js'), new Date('2020-01-01'));
    writeFileModifiedAt(newestFile, modifiedAt);

    const outcome = await observe(createNpkill().getNewestFile$(folder));

    expect(outcome).toEqual({
      values: [
        {
          path: newestFile,
          name: 'parser.js',
          modificationTime: modifiedAt.getTime(),
        },
      ],
      completed: true,
      error: undefined,
    });
  });

  it('reads the folder again on each subscription', async () => {
    const folder = createTempDir();
    writeFileModifiedAt(join(folder, 'old.js'), new Date('2020-01-01'));
    const newest$ = createNpkill().getNewestFile$(folder);

    const first = await observe(newest$);
    writeFileModifiedAt(join(folder, 'new.js'), new Date('2026-01-01'));
    const second = await observe(newest$);

    expect(first.values).toEqual([expect.objectContaining({ name: 'old.js' })]);
    expect(second.values).toEqual([
      expect.objectContaining({ name: 'new.js' }),
    ]);
  });

  it('compares the modification times, not the creation order', async () => {
    const folder = createTempDir();
    const newestFile = join(folder, 'edited.js');
    writeFileModifiedAt(newestFile, new Date('2026-01-01T00:00:00.000Z'));
    writeFileModifiedAt(
      join(folder, 'created-later.js'),
      new Date('2020-01-01T00:00:00.000Z'),
    );

    const outcome = await observe(createNpkill().getNewestFile$(folder));

    expect(outcome.values).toEqual([
      expect.objectContaining({ path: newestFile }),
    ]);
  });

  it.each(['node_modules', '.git', 'coverage', 'dist', 'DIST'])(
    'does not look inside %s at any depth',
    async (ignoredFolder) => {
      const folder = createTree([`src/${ignoredFolder}`]);
      const ownFile = join(folder, 'src', 'index.js');
      writeFileModifiedAt(ownFile, new Date('2020-01-01T00:00:00.000Z'));
      writeFileModifiedAt(
        join(folder, 'src', ignoredFolder, 'newer.js'),
        new Date('2026-01-01T00:00:00.000Z'),
      );

      const outcome = await observe(createNpkill().getNewestFile$(folder));

      expect(outcome.values).toEqual([
        expect.objectContaining({ path: ownFile }),
      ]);
    },
  );

  it('answers with absolute paths for a relative folder', async () => {
    const folder = createTempDir();
    writeFileModifiedAt(join(folder, 'index.js'), new Date('2026-01-01'));

    const outcome = await inDirectory(dirname(folder), () =>
      observe(createNpkill().getNewestFile$(`${basename(folder)}/`)),
    );

    expect(outcome.values).toEqual([
      expect.objectContaining({ path: join(folder, 'index.js') }),
    ]);
  });

  it('errors when the folder does not exist', async () => {
    const missing = join(createTempDir(), 'missing');

    const outcome = await observe(createNpkill().getNewestFile$(missing));

    expect(outcome.error).toEqual(
      expect.objectContaining({ message: expect.any(String) }),
    );
  });

  it('errors when the path is a file', async () => {
    const file = join(createTempDir(), 'index.js');
    writeFileModifiedAt(file, new Date('2026-01-01'));

    const outcome = await observe(createNpkill().getNewestFile$(file));

    expect(outcome.error).toEqual(
      expect.objectContaining({ message: expect.any(String) }),
    );
  });

  itWithUnixPermissions(
    'errors when the folder can be read but not entered',
    async () => {
      const folder = createTempDir();
      writeFileModifiedAt(join(folder, 'index.js'), new Date('2026-01-01'));
      lockPermissions(folder, 0o444);

      const outcome = await observe(createNpkill().getNewestFile$(folder));

      expect(outcome.error).toEqual(
        expect.objectContaining({ message: expect.any(String) }),
      );
    },
  );

  it('emits null when the folder has no files', async () => {
    const folder = createTree(['empty/subfolder']);

    const outcome = await observe(createNpkill().getNewestFile$(folder));

    expect(outcome).toEqual({
      values: [null],
      completed: true,
      error: undefined,
    });
  });

  itOnUnix('follows a symlink given as the path', async () => {
    const folder = createTempDir();
    writeFileModifiedAt(join(folder, 'index.js'), new Date('2026-01-01'));
    const link = join(createTempDir(), 'project');
    symlinkSync(folder, link, 'dir');

    const outcome = await observe(createNpkill().getNewestFile$(link));

    expect(outcome.values).toEqual([
      expect.objectContaining({ path: join(link, 'index.js') }),
    ]);
  });

  itOnUnix('ignores folders reached through symlinks', async () => {
    const outside = createTempDir();
    writeFileModifiedAt(join(outside, 'index.js'), new Date('2026-01-01'));
    const folder = createTempDir();
    symlinkSync(outside, join(folder, 'linked'), 'dir');

    const outcome = await observe(createNpkill().getNewestFile$(folder));

    expect(outcome.values).toEqual([null]);
  });

  itOnUnix('ignores files reached through symlinks', async () => {
    const folder = createTempDir();
    const ownFile = join(folder, 'index.js');
    const outsideFile = join(createTempDir(), 'newer.js');
    writeFileModifiedAt(ownFile, new Date('2020-01-01T00:00:00.000Z'));
    writeFileModifiedAt(outsideFile, new Date('2026-01-01T00:00:00.000Z'));
    symlinkSync(outsideFile, join(folder, 'link.js'));

    const outcome = await observe(createNpkill().getNewestFile$(folder));

    expect(outcome.values).toEqual([
      expect.objectContaining({ path: ownFile }),
    ]);
  });
});
