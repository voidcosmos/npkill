import { afterEach, describe, expect, it } from '@jest/globals';
import { readFileSync } from 'node:fs';
import {
  createNpkill,
  stopCreatedInstances,
} from './support/npkill-package.js';

const packageJson = JSON.parse(
  readFileSync(new URL('../../package.json', import.meta.url), 'utf8'),
) as { version: string };

afterEach(() => {
  stopCreatedInstances();
});

describe('getVersion', () => {
  it('returns the version of the package', () => {
    expect(createNpkill().getVersion()).toBe(packageJson.version);
  });
});
