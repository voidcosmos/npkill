import { afterEach, describe, expect, it } from '@jest/globals';
import { utimesSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  createNpkill,
  stopCreatedInstances,
} from './support/npkill-package.js';
import { createTempDir, observe, removeTempDirs } from './support/helpers.js';

afterEach(() => {
  stopCreatedInstances();
  removeTempDirs();
});

describe('getNewestFile$', () => {
  it('reports the timestamp in milliseconds', async () => {
    const folder = createTempDir();
    const file = join(folder, 'index.js');
    const modifiedAt = new Date('2026-01-15T10:00:00.000Z');
    writeFileSync(file, '');
    utimesSync(file, modifiedAt, modifiedAt);

    const outcome = await observe(createNpkill().getNewestFile$(folder), 2500);

    expect(outcome.values).toEqual([
      expect.objectContaining({ timestamp: modifiedAt.getTime() }),
    ]);
  });
});
