import { afterEach, describe, expect, it } from '@jest/globals';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  createNpkill,
  stopCreatedInstances,
} from './support/npkill-package.js';
import {
  createTempDir,
  itWithUnixPermissions,
  lockPermissions,
  removeTempDirs,
} from './support/helpers.js';

const INVALID = { isValid: false, invalidReason: expect.any(String) };

afterEach(() => {
  stopCreatedInstances();
  removeTempDirs();
});

describe('isValidRootFolder', () => {
  it('accepts a readable directory', () => {
    expect(createNpkill().isValidRootFolder(createTempDir())).toEqual({
      isValid: true,
    });
  });

  it('rejects a path that does not exist', () => {
    const missing = join(createTempDir(), 'missing');

    expect(createNpkill().isValidRootFolder(missing)).toEqual(INVALID);
  });

  it('rejects a file', () => {
    const file = join(createTempDir(), 'package.json');
    writeFileSync(file, '{}');

    expect(createNpkill().isValidRootFolder(file)).toEqual(INVALID);
  });

  itWithUnixPermissions('rejects a directory it cannot read', () => {
    const folder = createTempDir();
    lockPermissions(folder, 0o000);

    expect(createNpkill().isValidRootFolder(folder)).toEqual(INVALID);
  });

  itWithUnixPermissions('rejects a directory it cannot enter', () => {
    const folder = createTempDir();
    lockPermissions(folder, 0o644);

    expect(createNpkill().isValidRootFolder(folder)).toEqual(INVALID);
  });
});
