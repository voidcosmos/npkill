import { afterEach, describe, expect, it } from '@jest/globals';
import { existsSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  createNpkill,
  stopCreatedInstances,
} from './support/npkill-package.js';
import { createTree, observe, removeTempDirs } from './support/helpers.js';
import {
  cargoTarget,
  guardedDeleteOptions,
  scanOptions,
} from './support/recognition-contract.js';

const TIMEOUT_MS = 5000;

afterEach(() => {
  stopCreatedInstances();
  removeTempDirs();
});

function project() {
  const root = createTree(['project/target']);
  const path = join(root, 'project/target');
  const manifest = join(root, 'project/Cargo.toml');
  writeFileSync(manifest, '');
  writeFileSync(join(path, 'keep.txt'), '');
  return { root, path, manifest };
}

describe('verified deletion API', () => {
  it('deletes a target when its rule still matches', async () => {
    const { path } = project();
    const outcome = await observe(
      createNpkill().delete$(path, guardedDeleteOptions([cargoTarget])),
      TIMEOUT_MS,
    );
    expect(outcome.error).toBeUndefined();
    expect(outcome.values).toEqual([{ path, success: true }]);
    expect(existsSync(path)).toBe(false);
  });

  it.each([false, true])(
    'revalidates changed evidence before deletion with dryRun=%p',
    async (dryRun) => {
      const { root, path, manifest } = project();
      const npkill = createNpkill();
      const scan = await observe(
        npkill.startScan$(root, scanOptions([cargoTarget])),
        TIMEOUT_MS,
      );
      expect(scan.error).toBeUndefined();
      expect(scan.values).toHaveLength(1);
      rmSync(manifest);
      const outcome = await observe(
        npkill.delete$(path, guardedDeleteOptions([cargoTarget], dryRun)),
        TIMEOUT_MS,
      );
      expect(outcome.error).toBeUndefined();
      expect(outcome.values[0]).toMatchObject({
        success: false,
        error: { code: 'TARGET_NOT_RECOGNIZED' },
      });
      expect(existsSync(join(path, 'keep.txt'))).toBe(true);
    },
  );

  it('does not delete a verified target in a successful dry run', async () => {
    const { path } = project();
    const outcome = await observe(
      createNpkill().delete$(path, guardedDeleteOptions([cargoTarget], true)),
      TIMEOUT_MS,
    );
    expect(outcome.values).toEqual([{ path, success: true }]);
    expect(existsSync(path)).toBe(true);
  });
});
