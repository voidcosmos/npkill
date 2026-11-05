import { afterEach, describe, expect, it } from '@jest/globals';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type {
  ScanOptions,
  TargetDefinition,
  TargetRule,
} from '../../src/index.js';
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
  mavenTarget,
  pythonEnvironment,
} from './support/recognition-contract.js';

const TIMEOUT_MS = 5000;

afterEach(() => {
  stopCreatedInstances();
  removeTempDirs();
});

async function scan(
  root: string,
  targets: TargetDefinition[],
  options: Omit<ScanOptions, 'targets'> = {},
) {
  const outcome = await observe(
    createNpkill().startScan$(root, { ...options, targets }),
    TIMEOUT_MS,
  );
  expect(outcome.error).toBeUndefined();
  expect(outcome.completed).toBe(true);
  return relativePaths(outcome.values, root);
}

describe('scanning with rules', () => {
  it('finds a directory only when its siblings and contents match', async () => {
    const root = createTree([
      'rust/target',
      'python/.venv',
      'unrelated/target',
      'unrelated/.venv',
    ]);
    writeFileSync(join(root, 'rust/Cargo.toml'), '');
    writeFileSync(join(root, 'python/.venv/pyvenv.cfg'), '');

    expect(await scan(root, [cargoTarget, pythonEnvironment])).toEqual([
      'python/.venv',
      'rust/target',
    ]);
  });

  it('requires every listed name and accepts any rule with the same name', async () => {
    const root = createTree([
      'cargo/target',
      'maven/target',
      'incomplete/target',
    ]);
    writeFileSync(join(root, 'cargo/Cargo.toml'), '');
    writeFileSync(join(root, 'cargo/Cargo.lock'), '');
    writeFileSync(join(root, 'maven/pom.xml'), '');
    writeFileSync(join(root, 'incomplete/Cargo.toml'), '');
    const cargoWithLock: TargetRule = {
      target: 'target',
      nextTo: ['Cargo.toml', 'Cargo.lock'],
    };

    expect(await scan(root, [cargoWithLock, mavenTarget])).toEqual([
      'cargo/target',
      'maven/target',
    ]);
  });

  it('finds every directory with a name that is also listed alone', async () => {
    const root = createTree(['rust/target', 'unrelated/target']);
    writeFileSync(join(root, 'rust/Cargo.toml'), '');

    expect(await scan(root, ['target', cargoTarget])).toEqual([
      'rust/target',
      'unrelated/target',
    ]);
  });

  it('explores rejected directories but not the ones it finds', async () => {
    const root = createTree([
      'rejected/target/node_modules',
      'accepted/target/node_modules',
    ]);
    writeFileSync(join(root, 'accepted/Cargo.toml'), '');

    expect(await scan(root, [cargoTarget, 'node_modules'])).toEqual([
      'accepted/target',
      'rejected/target/node_modules',
    ]);
  });

  it('does not explore rejected directories that are skipped by default', async () => {
    const root = createTree(['app/.venv/lib/__pycache__']);

    expect(await scan(root, [pythonEnvironment, '__pycache__'])).toEqual([]);
  });

  it('explores rejected directories when useDefaultIgnore is false', async () => {
    const root = createTree(['app/.venv/lib/__pycache__']);
    const targets = [pythonEnvironment, '__pycache__'];

    expect(await scan(root, targets, { useDefaultIgnore: false })).toEqual([
      'app/.venv/lib/__pycache__',
    ]);
  });

  it('rejects an invalid rule before emitting any results', async () => {
    const root = createTree(['app/node_modules']);
    const invalid = { ...cargoTarget, type: 'file' } as TargetRule;
    const outcome = await observe(
      createNpkill().startScan$(root, { targets: ['node_modules', invalid] }),
      TIMEOUT_MS,
    );

    expect(outcome.values).toEqual([]);
    expect(outcome.error).toEqual(
      expect.objectContaining({
        message: expect.stringContaining('unknown property'),
      }),
    );
  });
});
