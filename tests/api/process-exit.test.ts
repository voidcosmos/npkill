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

afterEach(() => {
  removeTempDirs();
});

function writeConsumerScript(): string {
  const entry = pathToFileURL(join(PACKAGE_DIR, 'lib', 'index.js')).href;
  const script = join(createTempDir(), 'consumer.mjs');
  writeFileSync(
    script,
    `import { Npkill } from ${JSON.stringify(entry)};\n${OPERATIONS_ON_THE_ROOT_ARGUMENT}`,
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
        [writeConsumerScript(), root],
        { timeout: EXIT_TIMEOUT_MS },
      );

      expect(JSON.parse(stdout)).toEqual({ found: 2, deleted: true });
    },
    EXIT_TIMEOUT_MS + 2000,
  );
});
