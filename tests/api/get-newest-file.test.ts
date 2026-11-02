import { afterEach, describe, expect, it } from '@jest/globals';
import { symlinkSync, utimesSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  createNpkill,
  stopCreatedInstances,
} from './support/npkill-package.js';
import {
  createTempDir,
  itOnUnix,
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
  it('reports the timestamp in milliseconds', async () => {
    const folder = createTempDir();
    const modifiedAt = new Date('2026-01-15T10:00:00.000Z');
    writeFileModifiedAt(join(folder, 'index.js'), modifiedAt);

    const outcome = await observe(createNpkill().getNewestFile$(folder), 2500);

    expect(outcome.values).toEqual([
      expect.objectContaining({ timestamp: modifiedAt.getTime() }),
    ]);
  });

  itOnUnix('ignores files reached through symlinks', async () => {
    const folder = createTempDir();
    const ownFile = join(folder, 'index.js');
    const outsideFile = join(createTempDir(), 'newer.js');
    writeFileModifiedAt(ownFile, new Date('2020-01-01T00:00:00.000Z'));
    writeFileModifiedAt(outsideFile, new Date('2026-01-01T00:00:00.000Z'));
    symlinkSync(outsideFile, join(folder, 'link.js'));

    const outcome = await observe(createNpkill().getNewestFile$(folder), 2500);

    expect(outcome.values).toEqual([
      expect.objectContaining({ path: ownFile }),
    ]);
  });
});
