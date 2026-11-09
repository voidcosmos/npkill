import { afterEach, describe, expect, it } from '@jest/globals';
import { symlinkSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { tap } from 'rxjs';
import type {
  ScanResult,
  ScanOptions,
  TargetDefinition,
} from '../../src/index.js';
import {
  createNpkill,
  stopCreatedInstances,
} from './support/npkill-package.js';
import {
  createTempDir,
  createTree,
  inDirectory,
  itOnUnix,
  itWithUnixPermissions,
  lockPermissions,
  OBSERVE_TIMEOUT_MS,
  observe,
  relativePaths,
  removeTempDirs,
  sleep,
} from './support/helpers.js';

const NODE_MODULES: ScanOptions = { targets: ['node_modules'] };
const IDLE_WORKERS_RELEASE_MS = 5500;

afterEach(() => {
  stopCreatedInstances();
  removeTempDirs();
});

describe('startScan$', () => {
  it.each([
    ['targets as a string', { targets: 'node_modules' }, 'targets'],
    ['targets set to null', { targets: null }, 'targets'],
    ['the old target key', { target: 'node_modules' }, 'targets'],
    ['an empty targets list', { targets: [] }, 'targets'],
    ['an empty target name', { targets: [''] }, 'targets'],
    ['a number as a target', { targets: [42] }, 'targets'],
    ['null as a target', { targets: [null] }, 'targets'],
    ['a list as a target', { targets: [['node_modules']] }, 'targets'],
    [
      'a rule without a target',
      { targets: [{ nextTo: ['Cargo.toml'] }] },
      'targets',
    ],
    [
      'an empty nextTo',
      { targets: [{ target: 'target', nextTo: [] }] },
      'targets',
    ],
    [
      'an empty contains',
      { targets: [{ target: '.venv', contains: [] }] },
      'targets',
    ],
    [
      'a rule with an unknown property',
      {
        targets: [
          'node_modules',
          { target: 'target', nextTo: ['Cargo.toml'], type: 'file' },
        ],
      },
      'targets',
    ],
    ['exclude as a string', { ...NODE_MODULES, exclude: 'app' }, 'exclude'],
    [
      'an exclude that is not a path',
      { ...NODE_MODULES, exclude: [42] },
      'exclude',
    ],
    [
      'a useDefaultIgnore that is not a boolean',
      { ...NODE_MODULES, useDefaultIgnore: 'false' },
      'useDefaultIgnore',
    ],
    [
      'a performRiskAnalysis that is not a boolean',
      { ...NODE_MODULES, performRiskAnalysis: null },
      'performRiskAnalysis',
    ],
  ])(
    'rejects %s through the error channel',
    async (_case, options, invalidOption) => {
      const root = createTree(['node/src', 'app/node_modules/pkg']);

      const outcome = await observe(
        createNpkill().startScan$(root, options as unknown as ScanOptions),
      );

      expect(outcome.values).toEqual([]);
      expect(outcome.error).toEqual(
        expect.objectContaining({
          message: expect.stringContaining(invalidOption),
        }),
      );
    },
  );

  it.each<[string, TargetDefinition]>([
    ['a target with *', '*.log'],
    ['a target with a slash', 'pkg/dist'],
    ['a target with a backslash', 'pkg\\dist'],
    ['a target with braces', '{a,b}'],
    ['a target with brackets', '[ab]'],
    ['a target with ?', 'cache?'],
    ['a rule target', { target: 'target*', nextTo: ['Cargo.toml'] }],
    ['a nextTo entry', { target: 'target', nextTo: ['*.toml'] }],
    ['a contains entry', { target: '.venv', contains: ['*.cfg'] }],
  ])('rejects pattern characters in %s', async (_case, target) => {
    const outcome = await observe(
      createNpkill().startScan$(createTempDir(), { targets: [target] }),
    );

    expect(outcome.error).toEqual(
      expect.objectContaining({
        message: expect.stringContaining('reserved'),
      }),
    );
  });

  it('errors on an empty root instead of scanning the working directory', async () => {
    const outcome = await observe(createNpkill().startScan$('', NODE_MODULES));

    expect(outcome.error).toBeInstanceOf(Error);
    expect(outcome.values).toEqual([]);
  });

  it('runs the scan again on each subscription', async () => {
    const root = createTree(['app/node_modules/pkg']);
    const scan$ = createNpkill().startScan$(root, NODE_MODULES);

    const first = await observe(scan$);
    const second = await observe(scan$);

    expect(relativePaths(first.values, root)).toEqual(['app/node_modules']);
    expect(relativePaths(second.values, root)).toEqual(['app/node_modules']);
  });

  it.each([
    ['does not exist', (dir: string) => join(dir, 'missing')],
    [
      'is a file',
      (dir: string) => {
        writeFileSync(join(dir, 'package.json'), '{}');
        return join(dir, 'package.json');
      },
    ],
  ])(
    'gives the reason of validateRoot when the root %s',
    async (_case, createRoot) => {
      const root = createRoot(createTempDir());
      const npkill = createNpkill();
      const { invalidReason } = npkill.validateRoot(root);

      const outcome = await observe(npkill.startScan$(root, NODE_MODULES));

      expect(invalidReason).toEqual(expect.any(String));
      expect(outcome.error).toEqual(
        expect.objectContaining({
          message: expect.stringContaining(invalidReason as string),
        }),
      );
    },
  );

  it('emits absolute paths when the root is relative', async () => {
    const root = createTree(['app/node_modules/pkg']);

    const outcome = await inDirectory(dirname(root), () =>
      observe(createNpkill().startScan$(basename(root), NODE_MODULES)),
    );

    expect(outcome.values.map(({ path }) => path)).toEqual([
      join(root, 'app', 'node_modules'),
    ]);
  });

  itOnUnix('keeps paths with line breaks intact', async () => {
    const root = createTree(['weird\nname/node_modules/pkg']);

    const outcome = await observe(
      createNpkill().startScan$(root, NODE_MODULES),
    );

    expect(relativePaths(outcome.values, root)).toEqual([
      'weird\nname/node_modules',
    ]);
  });

  it('ignores unknown options such as callbacks', async () => {
    const root = createTree(['app/node_modules/pkg']);
    const options = { ...NODE_MODULES, filter: () => true } as ScanOptions;

    const outcome = await observe(createNpkill().startScan$(root, options));

    expect(relativePaths(outcome.values, root)).toEqual(['app/node_modules']);
  });

  it('leaves out a target listed in exclude', async () => {
    const root = createTree(['app1/node_modules/pkg', 'app2/node_modules/pkg']);

    const outcome = await observe(
      createNpkill().startScan$(root, {
        ...NODE_MODULES,
        exclude: [join(root, 'app2', 'node_modules')],
      }),
    );

    expect(relativePaths(outcome.values, root)).toEqual(['app1/node_modules']);
  });

  it('reads the options once, when subscribing', async () => {
    const root = createTree(['app1/node_modules/pkg', 'app2/node_modules/pkg']);
    const options = { targets: ['node_modules'], performRiskAnalysis: true };

    const outcome = await observe(
      createNpkill()
        .startScan$(root, options)
        .pipe(
          tap(() => {
            options.targets = ['.git'];
            options.performRiskAnalysis = false;
          }),
        ),
    );

    expect(relativePaths(outcome.values, root)).toEqual([
      'app1/node_modules',
      'app2/node_modules',
    ]);
    outcome.values.forEach((result) =>
      expect(result).toHaveProperty('riskAnalysis'),
    );
  });

  it('stops emitting and completes when stopScan() is called', async () => {
    const root = createTree([
      'app1/node_modules/pkg',
      'app2/node_modules/pkg',
      'app3/node_modules/pkg',
      'deep/a/b/c/node_modules/pkg',
    ]);
    const npkill = createNpkill();
    const values: ScanResult[] = [];

    await new Promise<void>((resolve) => {
      npkill.startScan$(root, NODE_MODULES).subscribe({
        next: (result) => {
          values.push(result);
          npkill.stopScan();
        },
        complete: resolve,
      });
    });

    expect(values).toHaveLength(1);
  });

  it('accepts a new scan after stopScan()', async () => {
    const root = createTree(['app/node_modules/pkg']);
    const npkill = createNpkill();
    npkill.startScan$(root, NODE_MODULES).subscribe();
    npkill.stopScan();

    const outcome = await observe(npkill.startScan$(root, NODE_MODULES));

    expect(relativePaths(outcome.values, root)).toEqual(['app/node_modules']);
    expect(outcome.completed).toBe(true);
  });

  it('does not start until subscribed', async () => {
    const root = createTree(['app/node_modules/pkg']);
    const npkill = createNpkill();
    npkill.startScan$(createTempDir(), NODE_MODULES);

    const outcome = await observe(npkill.startScan$(root, NODE_MODULES));

    expect(relativePaths(outcome.values, root)).toEqual(['app/node_modules']);
  });

  it('rejects a second scan on the same instance and lets the first finish', async () => {
    const firstRoot = createTree([
      'a1/node_modules/pkg',
      'a2/node_modules/pkg',
    ]);
    const secondRoot = createTree(['b1/node_modules/pkg']);
    const npkill = createNpkill();

    const [first, second] = await Promise.all([
      observe(npkill.startScan$(firstRoot, NODE_MODULES)),
      observe(npkill.startScan$(secondRoot, NODE_MODULES)),
    ]);

    expect(second.error).toBeInstanceOf(Error);
    expect(relativePaths(first.values, firstRoot)).toEqual([
      'a1/node_modules',
      'a2/node_modules',
    ]);
    expect(first.completed).toBe(true);
  });

  it('accepts a new scan once the previous one is unsubscribed', async () => {
    const root = createTree(['app/node_modules/pkg']);
    const npkill = createNpkill();
    npkill.startScan$(createTempDir(), NODE_MODULES).subscribe().unsubscribe();

    const outcome = await observe(npkill.startScan$(root, NODE_MODULES));

    expect(relativePaths(outcome.values, root)).toEqual(['app/node_modules']);
    expect(outcome.completed).toBe(true);
  });

  it('accepts a new scan after one that failed to start', async () => {
    const root = createTree(['app/node_modules/pkg']);
    const npkill = createNpkill();
    const targetsWorkersCannotReceive = new Proxy(['node_modules'], {});

    const failed = await observe(
      npkill.startScan$(root, { targets: targetsWorkersCannotReceive }),
    );
    const outcome = await observe(npkill.startScan$(root, NODE_MODULES));

    expect(failed.error).toEqual(
      expect.objectContaining({ name: 'DataCloneError' }),
    );
    expect(relativePaths(outcome.values, root)).toEqual(['app/node_modules']);
    expect(outcome.completed).toBe(true);
  });

  it(
    'scans again after its idle workers were released',
    async () => {
      const root = createTree(['app/node_modules/pkg']);
      const npkill = createNpkill();
      await observe(npkill.startScan$(root, NODE_MODULES));
      await sleep(IDLE_WORKERS_RELEASE_MS);

      const outcome = await observe(npkill.startScan$(root, NODE_MODULES));

      expect(relativePaths(outcome.values, root)).toEqual(['app/node_modules']);
      expect(outcome.completed).toBe(true);
    },
    IDLE_WORKERS_RELEASE_MS + 3 * OBSERVE_TIMEOUT_MS,
  );

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
    );

    expect(relativePaths(outcome.values, root)).toEqual([
      'api/node_modules',
      'libs/a/b/c/node_modules',
      'web/.next',
    ]);
  });

  it('compares names exactly, case included', async () => {
    const root = createTree(['a/Node_Modules/pkg', 'b/node_modules/pkg']);

    const outcome = await observe(
      createNpkill().startScan$(root, NODE_MODULES),
    );

    expect(relativePaths(outcome.values, root)).toEqual(['b/node_modules']);
  });

  it('does not look inside a target it found', async () => {
    const root = createTree(['app/node_modules/pkg/node_modules/dep']);

    const outcome = await observe(
      createNpkill().startScan$(root, NODE_MODULES),
    );

    expect(relativePaths(outcome.values, root)).toEqual(['app/node_modules']);
  });

  it('only reports directories', async () => {
    const root = createTree(['app', 'lib/node_modules/pkg']);
    writeFileSync(join(root, 'app', 'node_modules'), '');

    const outcome = await observe(
      createNpkill().startScan$(root, NODE_MODULES),
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
      observe(createNpkill().startScan$(root, NODE_MODULES)),
      observe(
        createNpkill().startScan$(root, { targets: ['node_modules', '.venv'] }),
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
    );

    expect(relativePaths(outcome.values, root)).toEqual(['app/node_modules']);
  });

  itOnUnix('follows a symlink given as the root', async () => {
    const projects = createTree(['app/node_modules/pkg']);
    const root = join(createTempDir(), 'projects');
    symlinkSync(projects, root, 'dir');

    const outcome = await observe(
      createNpkill().startScan$(root, NODE_MODULES),
    );

    expect(outcome.values.map(({ path }) => path)).toEqual([
      join(root, 'app', 'node_modules'),
    ]);
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
    );

    expect(outcome.values).toEqual([
      expect.objectContaining({
        riskAnalysis: {
          isSensitive: true,
          reason: expect.stringMatching(/\S/),
        },
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
    );

    expect(outcome.values).toStrictEqual([
      { path: join(root, 'app', 'node_modules') },
    ]);
  });
});
