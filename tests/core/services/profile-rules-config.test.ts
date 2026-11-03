import { afterEach, describe, expect, it } from '@jest/globals';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ConfigService } from '../../../src/core/services/config.service.js';
import { createTempDir, removeTempDirs } from '../../api/support/helpers.js';
import {
  cargoTarget,
  file,
  pythonEnvironment,
} from '../../api/support/recognition-contract.js';

afterEach(removeTempDirs);

function loadTargets(targets: unknown[], extra: Record<string, unknown> = {}) {
  const path = join(createTempDir(), '.npkillrc');
  const config = {
    ...extra,
    profiles: { custom: { description: 'Artifacts', targets } },
  };
  writeFileSync(path, JSON.stringify(config));
  return { config, result: new ConfigService().loadConfig(path) };
}

describe('.npkillrc recognition contract', () => {
  it('loads legacy names and contextual rules without losing conditions', () => {
    const { config, result } = loadTargets(
      ['node_modules', cargoTarget, pythonEnvironment],
      { schemaVersion: 1 },
    );
    expect(result.error).toBeUndefined();
    expect(result.config).toEqual(config);
  });

  it.each([
    ['unknown version', cargoTarget, { schemaVersion: 2 }],
    ['unknown check', { ...cargoTarget, checks: [{ kind: 'unknown' }] }, {}],
    ['empty check', { ...cargoTarget, checks: [] }, {}],
    [
      'escaping path',
      {
        ...cargoTarget,
        checks: [{ kind: 'siblings', allOf: [file('../outside')] }],
      },
      {},
    ],
  ])('rejects %s instead of weakening the rule', (_name, target, extra) => {
    const { result } = loadTargets(['node_modules', target], extra);
    expect(result.config).toBeNull();
    expect(result.error).toBeDefined();
  });
});
