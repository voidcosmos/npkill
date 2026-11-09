import { afterEach, describe, expect, it } from '@jest/globals';
import { existsSync, readdirSync, symlinkSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, parse } from 'node:path';
import type { DeleteOptions } from '../../src/index.js';
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
  sleep,
} from './support/helpers.js';

const DELETE_TIMEOUT_MS = 2500;

afterEach(() => {
  stopCreatedInstances();
  removeTempDirs();
});

function createProject(): { root: string; target: string } {
  const root = createTree(['project/node_modules/pkg']);
  return { root, target: join(root, 'project', 'node_modules') };
}

describe('delete$', () => {
  it('does nothing until subscribed', async () => {
    const { target } = createProject();

    createNpkill().delete$(target);
    await sleep(300);

    expect(existsSync(target)).toBe(true);
  });

  itWithUnixPermissions(
    'reports a failed deletion with success: false and the absolute path',
    async () => {
      const { root, target } = createProject();
      lockPermissions(join(root, 'project'), 0o555);

      const outcome = await inDirectory(dirname(target), () =>
        observe(createNpkill().delete$(basename(target)), DELETE_TIMEOUT_MS),
      );

      expect(outcome.values).toEqual([
        {
          path: target,
          success: false,
          error: expect.objectContaining({ message: expect.any(String) }),
        },
      ]);
    },
  );

  it('errors on an empty path and deletes nothing', async () => {
    const workspace = createTempDir();
    const sentinel = join(workspace, 'keep.txt');
    writeFileSync(sentinel, '');
    const originalCwd = process.cwd();
    process.chdir(workspace);

    try {
      const outcome = await observe(
        createNpkill().delete$(''),
        DELETE_TIMEOUT_MS,
      );

      expect(outcome.error).toBeInstanceOf(Error);
      expect(existsSync(sentinel)).toBe(true);
    } finally {
      process.chdir(originalCwd);
    }
  });

  it.each(['.', '..', 'project/..', parse(process.cwd()).root])(
    'refuses to delete "%s"',
    async (path) => {
      // A dry run keeps a regression from deleting real folders.
      const outcome = await observe(
        createNpkill().delete$(path, { dryRun: true }),
        DELETE_TIMEOUT_MS,
      );

      expect(outcome.error).toBeInstanceOf(Error);
    },
  );

  it.each(['.', '..'])(
    'refuses to delete "%s" without a dry run',
    async (path) => {
      const cwd = join(createTree(['cwd']), 'cwd');
      const sentinel = join(cwd, 'keep.txt');
      writeFileSync(sentinel, '');

      const outcome = await inDirectory(cwd, () =>
        observe(createNpkill().delete$(path), DELETE_TIMEOUT_MS),
      );

      expect(outcome.error).toBeInstanceOf(Error);
      expect(existsSync(sentinel)).toBe(true);
    },
  );

  it('answers a dry run at once without deleting', async () => {
    const { target } = createProject();
    const npkill = createNpkill();

    const startedAt = performance.now();
    const outcome = await observe(
      npkill.delete$(target, { dryRun: true }),
      1000,
    );

    expect(performance.now() - startedAt).toBeLessThan(100);
    expect(outcome.values).toEqual([{ path: target, success: true }]);
    expect(existsSync(target)).toBe(true);
  });

  it('deletes the folder and everything inside it', async () => {
    const { target } = createProject();

    const outcome = await observe(
      createNpkill().delete$(target),
      DELETE_TIMEOUT_MS,
    );

    expect(outcome.values).toEqual([{ path: target, success: true }]);
    expect(outcome.completed).toBe(true);
    expect(existsSync(target)).toBe(false);
  });

  it.each([
    ['dryRun set to false', { dryRun: false }],
    ['empty options', {}],
  ])('deletes for real with %s', async (_case, options) => {
    const { target } = createProject();

    const outcome = await observe(
      createNpkill().delete$(target, options),
      DELETE_TIMEOUT_MS,
    );

    expect(outcome.values).toEqual([{ path: target, success: true }]);
    expect(existsSync(target)).toBe(false);
  });

  itOnUnix('does not follow the symlinks inside the folder', async () => {
    const outside = createTree(['data']);
    writeFileSync(join(outside, 'data', 'keep.txt'), '');
    const { target } = createProject();
    symlinkSync(join(outside, 'data'), join(target, 'linked'), 'dir');

    const outcome = await observe(
      createNpkill().delete$(target),
      DELETE_TIMEOUT_MS,
    );

    expect(outcome.values).toEqual([{ path: target, success: true }]);
    expect(existsSync(target)).toBe(false);
    expect(readdirSync(join(outside, 'data'))).toEqual(['keep.txt']);
  });

  it('deletes a file', async () => {
    const file = join(createTempDir(), 'model.gguf');
    writeFileSync(file, 'weights');

    const outcome = await observe(
      createNpkill().delete$(file),
      DELETE_TIMEOUT_MS,
    );

    expect(outcome.values).toEqual([{ path: file, success: true }]);
    expect(existsSync(file)).toBe(false);
  });

  it('succeeds when the path does not exist', async () => {
    const missing = join(createTempDir(), 'node_modules');

    const outcome = await observe(
      createNpkill().delete$(missing),
      DELETE_TIMEOUT_MS,
    );

    expect(outcome.values).toEqual([{ path: missing, success: true }]);
  });

  it('answers with the absolute path of a relative one', async () => {
    const { target } = createProject();

    const outcome = await inDirectory(dirname(target), () =>
      observe(createNpkill().delete$(basename(target)), DELETE_TIMEOUT_MS),
    );

    expect(outcome.values).toEqual([{ path: target, success: true }]);
    expect(existsSync(target)).toBe(false);
  });

  it('answers a dry run of a relative path with the absolute one', async () => {
    const { target } = createProject();

    const outcome = await inDirectory(dirname(target), () =>
      observe(
        createNpkill().delete$(basename(target), { dryRun: true }),
        DELETE_TIMEOUT_MS,
      ),
    );

    expect(outcome.values).toEqual([{ path: target, success: true }]);
    expect(existsSync(target)).toBe(true);
  });

  itOnUnix(
    'deletes a symlink given with a trailing slash, not what it points to',
    async () => {
      const outside = createTree(['data']);
      writeFileSync(join(outside, 'data', 'keep.txt'), '');
      const link = join(createTempDir(), 'node_modules');
      symlinkSync(join(outside, 'data'), link, 'dir');

      const outcome = await observe(
        createNpkill().delete$(`${link}/`),
        DELETE_TIMEOUT_MS,
      );

      expect(outcome.values).toEqual([{ path: link, success: true }]);
      expect(existsSync(link)).toBe(false);
      expect(readdirSync(join(outside, 'data'))).toEqual(['keep.txt']);
    },
  );

  itOnUnix('deletes a symlink, not what it points to', async () => {
    const outside = createTree(['data']);
    writeFileSync(join(outside, 'data', 'keep.txt'), '');
    const parent = createTempDir();
    const link = join(parent, 'node_modules');
    symlinkSync(join(outside, 'data'), link, 'dir');

    const outcome = await observe(
      createNpkill().delete$(link),
      DELETE_TIMEOUT_MS,
    );

    expect(outcome.values).toEqual([{ path: link, success: true }]);
    expect(readdirSync(parent)).toEqual([]);
    expect(readdirSync(join(outside, 'data'))).toEqual(['keep.txt']);
  });

  itOnUnix('deletes a symlink that points nowhere', async () => {
    const parent = createTempDir();
    const link = join(parent, 'node_modules');
    symlinkSync(join(parent, 'missing'), link, 'dir');

    const outcome = await observe(
      createNpkill().delete$(link),
      DELETE_TIMEOUT_MS,
    );

    expect(outcome.values).toEqual([{ path: link, success: true }]);
    expect(readdirSync(parent)).toEqual([]);
  });

  it.each([
    ['an unknown option', { trash: true }],
    ['a dryRun that is not a boolean', { dryRun: 'yes' }],
    ['null options', null],
  ])('rejects %s and deletes nothing', async (_case, options) => {
    const { target } = createProject();

    const outcome = await observe(
      createNpkill().delete$(target, options as unknown as DeleteOptions),
      DELETE_TIMEOUT_MS,
    );

    expect(outcome.error).toBeInstanceOf(Error);
    expect(existsSync(target)).toBe(true);
  });
});
