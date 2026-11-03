import { afterEach, describe, expect, it } from '@jest/globals';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  createNpkill,
  stopCreatedInstances,
} from './support/npkill-package.js';
import {
  createTree,
  observe,
  relativePaths,
  removeTempDirs,
} from './support/helpers.js';
import {
  cargoTarget,
  file,
  mavenTarget,
  pythonEnvironment,
  scanOptions,
} from './support/recognition-contract.js';

const TIMEOUT_MS = 5000;

afterEach(() => {
  stopCreatedInstances();
  removeTempDirs();
});

async function scan(root: string, targets: unknown[]) {
  const outcome = await observe(
    createNpkill().startScan$(root, scanOptions(targets)),
    TIMEOUT_MS,
  );
  expect(outcome.error).toBeUndefined();
  expect(outcome.completed).toBe(true);
  return outcome.values;
}

describe('contextual scanning API', () => {
  it('recognizes sibling and internal markers and returns the evidence', async () => {
    const root = createTree([
      'rust/target',
      'python/.venv',
      'unrelated/target',
      'unrelated/.venv',
    ]);
    writeFileSync(join(root, 'rust/Cargo.toml'), '');
    writeFileSync(join(root, 'python/.venv/pyvenv.cfg'), '');
    const results = await scan(root, [cargoTarget, pythonEnvironment]);
    expect(relativePaths(results, root)).toEqual([
      'python/.venv',
      'rust/target',
    ]);
    expect(
      results.find(({ path }) => path === join(root, 'rust/target')),
    ).toMatchObject({
      matches: [
        {
          rule: cargoTarget,
          evidence: [
            {
              kind: 'siblings',
              path: join(root, 'rust/Cargo.toml'),
              type: 'file',
            },
          ],
        },
      ],
    });
  });

  it('combines checks with AND and alternative rules with OR', async () => {
    const root = createTree([
      'cargo/target',
      'maven/target',
      'incomplete/target',
    ]);
    writeFileSync(join(root, 'cargo/Cargo.toml'), '');
    writeFileSync(join(root, 'cargo/Cargo.lock'), '');
    writeFileSync(join(root, 'maven/pom.xml'), '');
    writeFileSync(join(root, 'incomplete/Cargo.toml'), '');
    const cargoWithLock = {
      ...cargoTarget,
      checks: [
        { kind: 'siblings', allOf: [file('Cargo.toml'), file('Cargo.lock')] },
      ],
    };
    expect(
      relativePaths(await scan(root, [cargoWithLock, mavenTarget]), root),
    ).toEqual(['cargo/target', 'maven/target']);
  });

  it('explores rejected candidates but prunes accepted ones', async () => {
    const root = createTree([
      'rejected/target/node_modules',
      'accepted/target/node_modules',
    ]);
    writeFileSync(join(root, 'accepted/Cargo.toml'), '');
    expect(
      relativePaths(await scan(root, [cargoTarget, 'node_modules']), root),
    ).toEqual(['accepted/target', 'rejected/target/node_modules']);
  });

  it('rejects unknown checks before emitting any results', async () => {
    const root = createTree(['app/node_modules']);
    const invalid = { ...cargoTarget, checks: [{ kind: 'unknown' }] };
    const outcome = await observe(
      createNpkill().startScan$(root, scanOptions(['node_modules', invalid])),
      TIMEOUT_MS,
    );
    expect(outcome.values).toEqual([]);
    expect(outcome.error).toBeInstanceOf(Error);
  });

  it('preserves name-only scans for existing callers', async () => {
    const root = createTree(['app/node_modules']);
    expect(relativePaths(await scan(root, ['node_modules']), root)).toEqual([
      'app/node_modules',
    ]);
  });
});
