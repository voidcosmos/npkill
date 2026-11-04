import { afterEach, describe, expect, it } from '@jest/globals';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ConfigService } from '../../../src/core/services/config.service.js';
import { createTempDir, removeTempDirs } from '../../api/support/helpers.js';
import {
  cargoTarget,
  pythonEnvironment,
} from '../../api/support/recognition-contract.js';

afterEach(removeTempDirs);

function load(config: object) {
  const path = join(createTempDir(), '.npkillrc');
  writeFileSync(path, JSON.stringify(config));
  return new ConfigService().loadConfig(path);
}

function loadTargets(targets: unknown[]) {
  const config = {
    profiles: { custom: { description: 'Artifacts', targets } },
  };
  return { config, result: load(config) };
}

describe('.npkillrc rules', () => {
  it('loads names and rules without losing conditions', () => {
    const { config, result } = loadTargets([
      'node_modules',
      cargoTarget,
      pythonEnvironment,
    ]);
    expect(result.error).toBeUndefined();
    expect(result.config).toEqual(config);
  });

  it.each([
    [
      'an unknown property',
      { ...cargoTarget, type: 'file' },
      'unknown property',
    ],
    [
      'a rule without conditions',
      { target: 'target' },
      'needs nextTo or contains',
    ],
    ['an empty list', { target: 'target', nextTo: [] }, 'non-empty array'],
    ['a path', { target: 'target', nextTo: ['../Cargo.toml'] }, 'reserved'],
    ['a pattern', { target: 'obj', nextTo: ['*.csproj'] }, 'reserved'],
  ])('rejects %s instead of weakening the rule', (_name, target, reason) => {
    const { result } = loadTargets(['node_modules', target]);
    expect(result.config).toBeNull();
    expect(result.error).toContain(reason);
  });

  it.each([
    [
      'an unknown profile property',
      {
        profiles: {
          custom: {
            description: 'Artifacts',
            targets: ['dist'],
            extends: 'node',
          },
        },
      },
      'profiles.custom.extends: unknown property',
    ],
    [
      'a profile called all',
      { profiles: { all: { description: 'Everything', targets: ['dist'] } } },
      'profiles.all is reserved',
    ],
    [
      'an unknown default profile',
      { defaultProfiles: ['node', 'missing'] },
      'unknown profile "missing"',
    ],
  ])('rejects %s', (_name, config, reason) => {
    const result = load(config);
    expect(result.config).toBeNull();
    expect(result.error).toContain(reason);
  });
});
