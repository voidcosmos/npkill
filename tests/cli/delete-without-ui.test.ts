import { afterEach, describe, expect, it } from '@jest/globals';
import { execFile } from 'node:child_process';
import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { PACKAGE_DIR } from '../api/support/npkill-package.js';
import {
  createTree,
  lockPermissions,
  removeTempDirs,
} from '../api/support/helpers.js';

const runNode = promisify(execFile);

// Same flags a CI job would use. stdin/stdout are pipes, not a terminal.
async function deleteAll(root: string, extraArgs: string[] = []) {
  writeFileSync(join(root, '.npkillrc'), '{}');
  return runNode(
    process.execPath,
    [
      join(PACKAGE_DIR, 'lib', 'cli.js'),
      '-d',
      root,
      '--targets',
      'node_modules',
      // On Windows tmpdir() is inside AppData\Local, which is sensitive.
      '--include-sensitive',
      '-D',
      '-y',
      ...extraArgs,
    ],
    { cwd: root, timeout: 30000 },
  );
}

// eslint-disable-next-line no-control-regex
const ANSI_ESCAPE = /\u001b\[/;

const canLockFolders = process.platform !== 'win32' && process.getuid?.() !== 0;

afterEach(() => {
  removeTempDirs();
});

describe('--delete-all -y without --json', () => {
  it('deletes every target and prints plain text', async () => {
    const targets = ['a/node_modules', 'b/node_modules'];
    const root = createTree(targets);

    const { stdout, stderr } = await deleteAll(root);

    expect(stderr).toBe('');
    expect(stdout).not.toMatch(ANSI_ESCAPE);
    for (const target of targets) {
      expect(existsSync(join(root, target))).toBe(false);
      expect(stdout).toContain(`Deleted ${join(root, target)}`);
    }
    expect(stdout).toMatch(/Done: deleted 2 folders, freed .+\.\n$/);
  }, 40000);

  it('does not delete anything in a dry run', async () => {
    const root = createTree(['a/node_modules']);

    const { stdout } = await deleteAll(root, ['--dry-run']);

    expect(existsSync(join(root, 'a/node_modules'))).toBe(true);
    expect(stdout).toContain('Dry run: would delete 1 folder');
  }, 40000);

  (canLockFolders ? it : it.skip)(
    'exits with code 1 and reports folders it cannot delete',
    async () => {
      const root = createTree(['a/node_modules/pkg']);
      lockPermissions(join(root, 'a/node_modules'), 0o555);

      const run = deleteAll(root);

      await expect(run).rejects.toMatchObject({
        code: 1,
        stderr: expect.stringContaining(
          `Failed to delete ${join(root, 'a/node_modules')}`,
        ),
        stdout: expect.stringContaining('1 failed'),
      });
    },
    40000,
  );
});
