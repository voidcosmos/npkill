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
  itWithUnixPermissions,
  lockPermissions,
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

  it('needs the siblings and the contents of a rule that lists both', async () => {
    const root = createTree([
      'complete/storybook-static',
      'half/storybook-static',
      'empty/storybook-static',
      'alone/storybook-static',
    ]);
    ['complete', 'half', 'empty'].forEach((project) =>
      writeFileSync(join(root, project, 'package.json'), ''),
    );
    ['complete', 'alone'].forEach((project) => {
      writeFileSync(join(root, project, 'storybook-static/index.html'), '');
      writeFileSync(join(root, project, 'storybook-static/iframe.html'), '');
    });
    writeFileSync(join(root, 'half/storybook-static/index.html'), '');
    const storybook: TargetRule = {
      target: 'storybook-static',
      nextTo: ['package.json'],
      contains: ['index.html', 'iframe.html'],
    };

    expect(await scan(root, [storybook])).toEqual([
      'complete/storybook-static',
    ]);
  });

  it('compares listed entries exactly, case included', async () => {
    const root = createTree(['rust/target']);
    writeFileSync(join(root, 'rust/cargo.toml'), '');

    expect(await scan(root, [cargoTarget])).toEqual([]);
  });

  it('accepts folders as listed entries', async () => {
    const root = createTree([
      'web/.storybook',
      'web/storybook-static',
      'web/.vite/deps',
      'other/.vite',
    ]);
    const targets: TargetRule[] = [
      { target: 'storybook-static', nextTo: ['.storybook'] },
      { target: '.vite', contains: ['deps'] },
    ];

    expect(await scan(root, targets)).toEqual([
      'web/.vite',
      'web/storybook-static',
    ]);
  });

  itWithUnixPermissions(
    'does not find a directory whose contents it cannot read',
    async () => {
      const root = createTree(['app/.venv']);
      writeFileSync(join(root, 'app/.venv/pyvenv.cfg'), '');
      lockPermissions(join(root, 'app/.venv'), 0o000);

      expect(await scan(root, [pythonEnvironment])).toEqual([]);
    },
  );

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

  it.each([
    [
      'does not explore rejected directories that are skipped by default',
      {},
      [],
    ],
    [
      'explores rejected directories when useDefaultIgnore is false',
      { useDefaultIgnore: false },
      ['app/.venv/lib/__pycache__'],
    ],
  ])('%s', async (_title, options, expected) => {
    const root = createTree(['app/.venv/lib/__pycache__']);

    expect(
      await scan(root, [pythonEnvironment, '__pycache__'], options),
    ).toEqual(expected);
  });
});
