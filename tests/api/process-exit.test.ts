import { afterEach, describe, expect, it } from '@jest/globals';
import { execFile } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { promisify } from 'node:util';
import { PACKAGE_DIR } from './support/npkill-package.js';
import {
  createTempDir,
  createTree,
  removeTempDirs,
} from './support/helpers.js';

const runNode = promisify(execFile);
const EXIT_TIMEOUT_MS = 8000;

const OPERATIONS_ON_THE_ROOT_ARGUMENT = `
const root = process.argv[2];
const npkill = new Npkill();
const found = [];
await npkill
  .startScan$(root, { targets: ['node_modules'] })
  .forEach((result) => found.push(result.path));
await npkill.getSize$(found[0]).forEach(() => {});
await npkill.getNewestFile$(root).forEach(() => {});
let deleted = false;
await npkill
  .delete$(found[0], { dryRun: true })
  .forEach((result) => (deleted = result.success));
console.log(JSON.stringify({ found: found.length, deleted }));
`;

const SCAN_THAT_FAILS_TO_START = `
const root = process.argv[2];
const targets = new Proxy(['node_modules'], {});
let failedWith = null;
await new Npkill()
  .startScan$(root, { targets })
  .forEach(() => {})
  .catch((error) => (failedWith = error.name));
console.log(JSON.stringify({ failedWith }));
`;

afterEach(() => {
  removeTempDirs();
});

function writeConsumerScript(operations: string): string {
  const entry = pathToFileURL(join(PACKAGE_DIR, 'lib', 'index.js')).href;
  const script = join(createTempDir(), 'consumer.mjs');
  writeFileSync(
    script,
    `import { Npkill } from ${JSON.stringify(entry)};\n${operations}`,
  );
  return script;
}

describe('a script using the api', () => {
  it(
    'exits on its own when every operation is done',
    async () => {
      const root = createTree(['a/node_modules/pkg', 'b/node_modules/pkg']);

      const { stdout } = await runNode(
        process.execPath,
        [writeConsumerScript(OPERATIONS_ON_THE_ROOT_ARGUMENT), root],
        { timeout: EXIT_TIMEOUT_MS },
      );

      expect(JSON.parse(stdout)).toEqual({ found: 2, deleted: true });
    },
    EXIT_TIMEOUT_MS + 2000,
  );

  it(
    'exits on its own after a scan that failed to start',
    async () => {
      const root = createTree(['a/node_modules/pkg']);

      const { stdout } = await runNode(
        process.execPath,
        [writeConsumerScript(SCAN_THAT_FAILS_TO_START), root],
        { timeout: EXIT_TIMEOUT_MS },
      );

      expect(JSON.parse(stdout)).toEqual({ failedWith: 'DataCloneError' });
    },
    EXIT_TIMEOUT_MS + 2000,
  );
});
