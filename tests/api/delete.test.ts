import { afterEach, describe, expect, it } from '@jest/globals';
import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  createNpkill,
  stopCreatedInstances,
} from './support/npkill-package.js';
import {
  createTempDir,
  createTree,
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
    'reports a failed deletion with success: false',
    async () => {
      const { root, target } = createProject();
      lockPermissions(join(root, 'project'), 0o555);

      const outcome = await observe(
        createNpkill().delete$(target),
        DELETE_TIMEOUT_MS,
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
});
