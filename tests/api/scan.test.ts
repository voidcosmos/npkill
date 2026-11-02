import { afterEach, describe, expect, it } from '@jest/globals';
import { tap } from 'rxjs';
import type { ScanOptions } from '../../src/index.js';
import {
  createNpkill,
  stopCreatedInstances,
} from './support/npkill-package.js';
import {
  createTree,
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
  ])('rejects %s through the error channel', async (_case, options) => {
    const root = createTree(['node/src', 'app/node_modules/pkg']);

    const outcome = await observe(
      createNpkill().startScan$(root, options as unknown as ScanOptions),
      SCAN_TIMEOUT_MS,
    );

    expect(outcome.error).toBeInstanceOf(Error);
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
});
