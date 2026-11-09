import { afterEach, describe, expect, it } from '@jest/globals';
import { symlinkSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { tap } from 'rxjs';
import type { ScanOptions } from '../../src/index.js';
import {
  createNpkill,
  stopCreatedInstances,
} from './support/npkill-package.js';
import {
  createTempDir,
  createTree,
  itOnUnix,
  itWithUnixPermissions,
  lockPermissions,
  observe,
  relativePaths,
  removeTempDirs,
  sleep,
} from './support/helpers.js';

const NODE_MODULES: ScanOptions = { targets: ['node_modules'] };
const SCAN_TIMEOUT_MS = 2500;

afterEach(() => {
  stopCreatedInstances();
  removeTempDirs();
});

describe('startScan$', () => {
  it('delivers every result to a late subscriber', async () => {
    const root = createTree(['app1/node_modules/pkg', 'app2/node_modules/pkg']);
    const scan$ = createNpkill().startScan$(root, NODE_MODULES);
    await sleep(500);

    const outcome = await observe(scan$, SCAN_TIMEOUT_MS);

    expect(relativePaths(outcome.values, root)).toEqual([
      'app1/node_modules',
      'app2/node_modules',
    ]);
  });

  it.each([
    ['targets as a string', { targets: 'node_modules' }],
    ['targets set to null', { targets: null }],
    ['the old target key', { target: 'node_modules' }],
    ['an empty targets list', { targets: [] }],
  ])('rejects %s through the error channel', async (_case, options) => {
    const root = createTree(['node/src', 'app/node_modules/pkg']);

    const outcome = await observe(
      createNpkill().startScan$(root, options as unknown as ScanOptions),
      SCAN_TIMEOUT_MS,
    );

    expect(outcome.error).toBeInstanceOf(Error);
  });

  it.each(['*.log', 'pkg/dist', 'pkg\\dist', '{a,b}', '[ab]', 'cache?'])(
    'rejects the target %s because it uses pattern characters',
    async (target) => {
      const outcome = await observe(
        createNpkill().startScan$(createTempDir(), { targets: [target] }),
        SCAN_TIMEOUT_MS,
      );

      expect(outcome.error).toEqual(
        expect.objectContaining({
          message: expect.stringContaining('reserved'),
        }),
      );
    },
  );

  it('errors on an empty root instead of scanning the working directory', async () => {
    const outcome = await observe(
      createNpkill().startScan$('', NODE_MODULES),
      SCAN_TIMEOUT_MS,
    );

    expect(outcome.error).toBeInstanceOf(Error);
    expect(outcome.values).toEqual([]);
  });

  itWithUnixPermissions('errors when the root cannot be entered', async () => {
    const root = createTree(['app/node_modules/pkg']);
    lockPermissions(root, 0o644);

    const outcome = await observe(
      createNpkill().startScan$(root, NODE_MODULES),
      SCAN_TIMEOUT_MS,
    );

    expect(outcome.error).toBeInstanceOf(Error);
  });

  it('runs the scan again on each subscription', async () => {
    const root = createTree(['app/node_modules/pkg']);
    const scan$ = createNpkill().startScan$(root, NODE_MODULES);

    const first = await observe(scan$, SCAN_TIMEOUT_MS);
    const second = await observe(scan$, SCAN_TIMEOUT_MS);

    expect(relativePaths(first.values, root)).toEqual(['app/node_modules']);
    expect(relativePaths(second.values, root)).toEqual(['app/node_modules']);
  });

  it('errors when the root folder does not exist', async () => {
    const missing = join(createTempDir(), 'missing');

    const outcome = await observe(
      createNpkill().startScan$(missing, NODE_MODULES),
      SCAN_TIMEOUT_MS,
    );

    expect(outcome.error).toEqual(
      expect.objectContaining({
        message: expect.stringContaining('does not exist'),
      }),
    );
  });

  it('errors when the root is a file', async () => {
    const file = join(createTempDir(), 'package.json');
    writeFileSync(file, '{}');

    const outcome = await observe(
      createNpkill().startScan$(file, NODE_MODULES),
      SCAN_TIMEOUT_MS,
    );

    expect(outcome.error).toEqual(
      expect.objectContaining({
        message: expect.stringContaining('directory'),
      }),
    );
  });

  it('emits absolute paths when the root is relative', async () => {
    const root = createTree(['app/node_modules/pkg']);

    const outcome = await observe(
      createNpkill().startScan$(relative(process.cwd(), root), NODE_MODULES),
      SCAN_TIMEOUT_MS,
    );

    expect(outcome.values.map(({ path }) => path)).toEqual([
      join(root, 'app', 'node_modules'),
    ]);
  });

  itOnUnix('keeps paths with line breaks intact', async () => {
    const root = createTree(['weird\nname/node_modules/pkg']);

    const outcome = await observe(
      createNpkill().startScan$(root, NODE_MODULES),
      SCAN_TIMEOUT_MS,
    );

    expect(relativePaths(outcome.values, root)).toEqual([
      'weird\nname/node_modules',
    ]);
  });

  it('ignores unknown options such as callbacks', async () => {
    const root = createTree(['app/node_modules/pkg']);
    const options = { ...NODE_MODULES, filter: () => true } as ScanOptions;

    const outcome = await observe(
      createNpkill().startScan$(root, options),
      SCAN_TIMEOUT_MS,
    );

    expect(relativePaths(outcome.values, root)).toEqual(['app/node_modules']);
  });

  it('completes when stopScan() is called', async () => {
    const root = createTree([
      'app1/node_modules/pkg',
      'app2/node_modules/pkg',
      'deep/a/b/c/node_modules/pkg',
    ]);
    const npkill = createNpkill();

    const outcome = await observe(
      npkill.startScan$(root, NODE_MODULES).pipe(tap(() => npkill.stopScan())),
      SCAN_TIMEOUT_MS,
    );

    expect(outcome.completed).toBe(true);
  });

  it('rejects a second scan on the same instance and lets the first finish', async () => {
    const firstRoot = createTree([
      'a1/node_modules/pkg',
      'a2/node_modules/pkg',
    ]);
    const secondRoot = createTree(['b1/node_modules/pkg']);
    const npkill = createNpkill();

    const [first, second] = await Promise.all([
      observe(npkill.startScan$(firstRoot, NODE_MODULES), SCAN_TIMEOUT_MS),
      observe(npkill.startScan$(secondRoot, NODE_MODULES), SCAN_TIMEOUT_MS),
    ]);

    expect(second.error).toBeInstanceOf(Error);
    expect(relativePaths(first.values, firstRoot)).toEqual([
      'a1/node_modules',
      'a2/node_modules',
    ]);
    expect(first.completed).toBe(true);
  });

  it('accepts a new scan after one that failed to start', async () => {
    const root = createTree(['app/node_modules/pkg']);
    const npkill = createNpkill();
    const targetsWorkersCannotReceive = new Proxy(['node_modules'], {});

    const failed = await observe(
      npkill.startScan$(root, { targets: targetsWorkersCannotReceive }),
      SCAN_TIMEOUT_MS,
    );
    const outcome = await observe(
      npkill.startScan$(root, NODE_MODULES),
      SCAN_TIMEOUT_MS,
    );

    expect(failed.error).toEqual(
      expect.objectContaining({ name: 'DataCloneError' }),
    );
    expect(relativePaths(outcome.values, root)).toEqual(['app/node_modules']);
    expect(outcome.completed).toBe(true);
  });

  it('accepts a new scan once the previous one is unsubscribed', async () => {
    const root = createTree(['app/node_modules/pkg']);
    const npkill = createNpkill();
    npkill.startScan$(createTempDir(), NODE_MODULES).subscribe().unsubscribe();

    const outcome = await observe(
      npkill.startScan$(root, NODE_MODULES),
      SCAN_TIMEOUT_MS,
    );

    expect(relativePaths(outcome.values, root)).toEqual(['app/node_modules']);
    expect(outcome.completed).toBe(true);
  });

  it('runs scans in parallel on different instances', async () => {
    const firstRoot = createTree(['a/node_modules/pkg']);
    const secondRoot = createTree(['b/node_modules/pkg']);

    const [first, second] = await Promise.all([
      observe(createNpkill().startScan$(firstRoot, NODE_MODULES), 5000),
      observe(createNpkill().startScan$(secondRoot, NODE_MODULES), 5000),
    ]);

    expect(relativePaths(first.values, firstRoot)).toEqual(['a/node_modules']);
    expect(relativePaths(second.values, secondRoot)).toEqual([
      'b/node_modules',
    ]);
  });

  it('finds every target name at any depth', async () => {
    const root = createTree([
      'web/.next/cache',
      'api/node_modules/pkg',
      'libs/a/b/c/node_modules/pkg',
      'docs/src',
    ]);

    const outcome = await observe(
      createNpkill().startScan$(root, { targets: ['node_modules', '.next'] }),
      SCAN_TIMEOUT_MS,
    );

    expect(relativePaths(outcome.values, root)).toEqual([
      'api/node_modules',
      'libs/a/b/c/node_modules',
      'web/.next',
    ]);
  });

  it('does not look inside a target it found', async () => {
    const root = createTree(['app/node_modules/pkg/node_modules/dep']);

    const outcome = await observe(
      createNpkill().startScan$(root, NODE_MODULES),
      SCAN_TIMEOUT_MS,
    );

    expect(relativePaths(outcome.values, root)).toEqual(['app/node_modules']);
  });

  it('only reports directories', async () => {
    const root = createTree(['app', 'lib/node_modules/pkg']);
    writeFileSync(join(root, 'app', 'node_modules'), '');

    const outcome = await observe(
      createNpkill().startScan$(root, NODE_MODULES),
      SCAN_TIMEOUT_MS,
    );

    expect(relativePaths(outcome.values, root)).toEqual(['lib/node_modules']);
  });

  it('skips the always ignored folders unless they are targets', async () => {
    const root = createTree([
      '.git/node_modules/pkg',
      'app/.venv/node_modules/pkg',
      'app/node_modules/pkg',
    ]);

    const [withoutVenv, withVenv] = await Promise.all([
      observe(createNpkill().startScan$(root, NODE_MODULES), SCAN_TIMEOUT_MS),
      observe(
        createNpkill().startScan$(root, { targets: ['node_modules', '.venv'] }),
        SCAN_TIMEOUT_MS,
      ),
    ]);

    expect(relativePaths(withoutVenv.values, root)).toEqual([
      'app/node_modules',
    ]);
    expect(relativePaths(withVenv.values, root)).toEqual([
      'app/.venv',
      'app/node_modules',
    ]);
  });

  it('looks inside build outputs, where some tools keep dependencies', async () => {
    const root = createTree([
      'kotlin/build/js/node_modules/pkg',
      'electron/dist/app/node_modules/pkg',
      'scala/target/bundler/node_modules/pkg',
    ]);

    const outcome = await observe(
      createNpkill().startScan$(root, NODE_MODULES),
      SCAN_TIMEOUT_MS,
    );

    expect(relativePaths(outcome.values, root)).toEqual([
      'electron/dist/app/node_modules',
      'kotlin/build/js/node_modules',
      'scala/target/bundler/node_modules',
    ]);
  });

  it('looks inside the skipped folders when useDefaultIgnore is false', async () => {
    const root = createTree(['.git/node_modules/pkg', 'app/node_modules/pkg']);

    const outcome = await observe(
      createNpkill().startScan$(root, {
        ...NODE_MODULES,
        useDefaultIgnore: false,
      }),
      SCAN_TIMEOUT_MS,
    );

    expect(relativePaths(outcome.values, root)).toEqual([
      '.git/node_modules',
      'app/node_modules',
    ]);
  });

  itOnUnix('does not follow symlinks', async () => {
    const root = createTree(['app/node_modules/pkg']);
    const outside = createTree(['project/node_modules/pkg']);
    symlinkSync(outside, join(root, 'linked'), 'dir');
    symlinkSync(
      join(outside, 'project', 'node_modules'),
      join(root, 'node_modules'),
      'dir',
    );

    const outcome = await observe(
      createNpkill().startScan$(root, NODE_MODULES),
      SCAN_TIMEOUT_MS,
    );

    expect(relativePaths(outcome.values, root)).toEqual(['app/node_modules']);
  });

  itWithUnixPermissions(
    'skips the folders it cannot read and completes',
    async () => {
      const root = createTree([
        'locked/node_modules/pkg',
        'open/node_modules/pkg',
      ]);
      lockPermissions(join(root, 'locked'), 0o000);

      const outcome = await observe(
        createNpkill().startScan$(root, NODE_MODULES),
        SCAN_TIMEOUT_MS,
      );

      expect(relativePaths(outcome.values, root)).toEqual([
        'open/node_modules',
      ]);
      expect(outcome.completed).toBe(true);
    },
  );

  it('analyses the risk of each result by default', async () => {
    const root = createTree(['app/node_modules/pkg']);

    const outcome = await observe(
      createNpkill().startScan$(root, NODE_MODULES),
      SCAN_TIMEOUT_MS,
    );

    expect(outcome.values).toEqual([
      {
        path: join(root, 'app', 'node_modules'),
        riskAnalysis: expect.objectContaining({
          isSensitive: expect.any(Boolean),
        }),
      },
    ]);
  });

  it('flags results that are risky to delete and says why', async () => {
    const root = createTree(['Applications/Editor.app/Contents/node_modules']);

    const outcome = await observe(
      createNpkill().startScan$(root, NODE_MODULES),
      SCAN_TIMEOUT_MS,
    );

    expect(outcome.values).toEqual([
      expect.objectContaining({
        riskAnalysis: { isSensitive: true, reason: expect.any(String) },
      }),
    ]);
  });

  it('leaves the risk analysis out when it is disabled', async () => {
    const root = createTree(['app/node_modules/pkg']);

    const outcome = await observe(
      createNpkill().startScan$(root, {
        ...NODE_MODULES,
        performRiskAnalysis: false,
      }),
      SCAN_TIMEOUT_MS,
    );

    expect(outcome.values).toEqual([
      { path: join(root, 'app', 'node_modules') },
    ]);
  });
});
