import { afterEach, describe, expect, it } from '@jest/globals';
import { execFile } from 'node:child_process';
import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { promisify } from 'node:util';
import type {
  JsonSimpleOutput,
  JsonStreamOutput,
} from '../../src/cli/interfaces/json-output.interface.js';
import { PACKAGE_DIR } from '../api/support/npkill-package.js';
import { createTree, removeTempDirs } from '../api/support/helpers.js';

const runNode = promisify(execFile);
const RESULT_COUNT = 1500;

async function runCli(root: string, args: string[]) {
  const result = runNode(
    process.execPath,
    [join(PACKAGE_DIR, 'lib', 'cli.js'), '-d', root, ...args],
    { cwd: root, timeout: 30000, maxBuffer: 4 * 1024 * 1024 },
  );
  result.child.stdout?.once('data', () => {
    result.child.stdout?.pause();
    setTimeout(() => {
      result.child.stdout?.resume();
    }, 100);
  });
  return result;
}

afterEach(() => {
  removeTempDirs();
});

describe.each(['--json', '--json-stream'])('%s through a pipe', (format) => {
  it.each([
    { operation: 'scanning', deleteAll: false },
    { operation: 'deleting', deleteAll: true },
  ])(
    'keeps all 1500 results when $operation',
    async ({ deleteAll }) => {
      const targets = Array.from(
        { length: RESULT_COUNT },
        (_, index) => `project-${index}/node_modules`,
      );
      const root = createTree(targets);
      writeFileSync(join(root, '.npkillrc'), '{}');

      const { stdout, stderr } = await runCli(root, [
        '--targets',
        'node_modules',
        '--no-stats',
        format,
        ...(deleteAll ? ['-D', '-y'] : []),
      ]);
      const results =
        format === '--json'
          ? (JSON.parse(stdout) as JsonSimpleOutput).results
          : stdout
              .trim()
              .split('\n')
              .map((line) => (JSON.parse(line) as JsonStreamOutput).result);

      expect(stderr).toBe('');
      expect(Buffer.byteLength(stdout)).toBeGreaterThan(65536);
      expect(results).toHaveLength(RESULT_COUNT);
      expect(results.map(({ path }) => path).sort()).toEqual(
        targets.map((target) => join(root, target)).sort(),
      );
      expect(results.every(({ path }) => existsSync(path) === !deleteAll)).toBe(
        true,
      );
      expect(
        results.every(({ deletion }) =>
          deleteAll ? deletion?.success === true : deletion === undefined,
        ),
      ).toBe(true);
    },
    40000,
  );
});
