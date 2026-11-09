import { afterEach, describe, expect, it } from '@jest/globals';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  createNpkill,
  stopCreatedInstances,
} from './support/npkill-package.js';
import {
  createTempDir,
  inDirectory,
  removeTempDirs,
} from './support/helpers.js';

const packageJson = JSON.parse(
  readFileSync(new URL('../../package.json', import.meta.url), 'utf8'),
) as { version: string };

afterEach(() => {
  stopCreatedInstances();
  removeTempDirs();
});

describe('getVersion', () => {
  it('returns the version of the package whatever the working directory', async () => {
    const project = createTempDir();
    writeFileSync(join(project, 'package.json'), '{"version":"9.9.9"}');

    const version = await inDirectory(project, async () =>
      createNpkill().getVersion(),
    );

    expect(version).toBe(packageJson.version);
  });
});
