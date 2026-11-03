import { afterEach, describe, expect, it } from '@jest/globals';
import {
  createNpkill,
  DEFAULT_PROFILES,
  stopCreatedInstances,
} from './support/npkill-package.js';
import { createTempDir, observe, removeTempDirs } from './support/helpers.js';

afterEach(() => {
  stopCreatedInstances();
  removeTempDirs();
});

describe('DEFAULT_PROFILES', () => {
  it('cannot be changed', () => {
    const nodeTargets = DEFAULT_PROFILES.node.targets as string[];

    expect(() => nodeTargets.push('src')).toThrow(TypeError);
    expect(Object.isFrozen(DEFAULT_PROFILES)).toBe(true);
    Object.values(DEFAULT_PROFILES).forEach((profile) => {
      expect(Object.isFrozen(profile)).toBe(true);
      expect(Object.isFrozen(profile.targets)).toBe(true);
    });
  });

  it('only has targets that a scan accepts', async () => {
    const outcome = await observe(
      createNpkill().startScan$(createTempDir(), {
        targets: DEFAULT_PROFILES.all.targets,
      }),
      2500,
    );

    expect(outcome.error).toBeUndefined();
    expect(outcome.completed).toBe(true);
  });
});
