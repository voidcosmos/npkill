import { join, parse, resolve, sep } from 'node:path';
import {
  compileExclusions,
  isExcludedDirectory,
} from '../../../../src/core/services/files/exclude-patterns.js';

describe('directory exclusion patterns', () => {
  const root = resolve('scan-root');
  const itOnPosix = sep === '\\' ? it.skip : it;
  const itOnWindows = sep === '\\' ? it : it.skip;

  const matches = (pattern: string, directory: string) =>
    isExcludedDirectory(
      join(root, directory),
      compileExclusions(root, [pattern]),
    );

  it('matches a bare directory name at every depth, but not substrings', () => {
    expect(matches('test', 'test')).toBe(true);
    expect(matches('test', 'project/test')).toBe(true);
    expect(matches('test', 'project/testing')).toBe(false);
  });

  it('anchors ./ and multi-component paths to the scan root', () => {
    expect(matches('./test', 'test')).toBe(true);
    expect(matches('./test', 'project/test')).toBe(false);
    expect(matches('something/test', 'something/test')).toBe(true);
    expect(matches('something/test', 'other/something/test')).toBe(false);
    expect(matches('something/test', 'something/testing')).toBe(false);
  });

  it('matches **/ path sequences at any depth, including the scan root', () => {
    expect(matches('**/something/test', 'something/test')).toBe(true);
    expect(matches('**/something/test', 'other/something/test')).toBe(true);
    expect(matches('**/something/test/', 'other/something/test')).toBe(true);
    expect(matches('**/something/test', 'something/other/test')).toBe(false);
    expect(matches('**/something/test', 'other/something/testing')).toBe(false);
  });

  itOnPosix('matches escaped literal * and ? in every pattern scope', () => {
    expect(matches(String.raw`test\*`, 'nested/test*')).toBe(true);
    expect(matches(String.raw`test\*`, 'nested/testing')).toBe(false);
    expect(matches(String.raw`what\?`, 'nested/what?')).toBe(true);
    expect(matches(String.raw`what\?`, 'nested/what1')).toBe(false);
    expect(matches(String.raw`./test\*`, 'test*')).toBe(true);
    expect(matches(String.raw`./test\*`, 'nested/test*')).toBe(false);
    expect(matches(String.raw`parent/test\?`, 'parent/test?')).toBe(true);
    expect(matches(String.raw`parent/test\?`, 'nested/parent/test?')).toBe(
      false,
    );
    expect(matches(String.raw`**/parent/test\*`, 'nested/parent/test*')).toBe(
      true,
    );
    expect(matches(String.raw`**/parent/test\*`, 'nested/parent/testing')).toBe(
      false,
    );
  });

  itOnPosix('keeps escaped ** literal and can escape a backslash', () => {
    expect(matches(String.raw`\*\*/test`, '**/test')).toBe(true);
    expect(matches(String.raw`\*\*/test`, 'nested/**/test')).toBe(false);
    expect(matches(String.raw`foo\\\*`, String.raw`nested/foo\*`)).toBe(true);
    expect(matches(String.raw`foo\\\*`, 'nested/foo*')).toBe(false);
  });

  itOnWindows('uses backslashes as separators, not wildcard escapes', () => {
    expect(matches(String.raw`parent\test`, 'parent/test')).toBe(true);
    expect(() => compileExclusions(root, [String.raw`parent\*`])).toThrow(
      'Unsupported exclude pattern',
    );
  });

  it('keeps every pattern type when several exclusions are compiled together', () => {
    const exclusions = compileExclusions(root, [
      'test',
      './cache',
      '**/something/output',
      join(root, 'only-here'),
    ]);

    for (const directory of [
      'nested/test',
      'cache',
      'deep/something/output',
      'only-here',
    ]) {
      expect(isExcludedDirectory(join(root, directory), exclusions)).toBe(true);
    }

    for (const directory of [
      'nested/testing',
      'nested/cache',
      'something/other/output',
      'nested/only-here',
    ]) {
      expect(isExcludedDirectory(join(root, directory), exclusions)).toBe(
        false,
      );
    }
  });

  it('matches absolute paths exactly and accepts a trailing slash', () => {
    const exactPath = join(root, 'something', 'test');
    expect(matches(exactPath, 'something/test')).toBe(true);
    expect(matches(`${exactPath}/`, 'something/testing')).toBe(false);
    expect(matches(`${exactPath}/`, 'other/something/test')).toBe(false);
    expect(matches('test/', 'other/test')).toBe(true);
  });

  itOnPosix('matches an absolute path with an escaped literal wildcard', () => {
    const literalPath = join(root, 'what?');
    const escapedPath = literalPath.replace('?', String.raw`\?`);

    expect(matches(escapedPath, 'what?')).toBe(true);
    expect(matches(escapedPath, 'nested/what?')).toBe(false);
  });

  it('accepts a filesystem root as an absolute path', () => {
    const filesystemRoot = parse(root).root;
    expect(
      isExcludedDirectory(
        filesystemRoot,
        compileExclusions(filesystemRoot, [filesystemRoot]),
      ),
    ).toBe(true);
  });

  it('uses the scan root rather than the invocation directory for relative paths', () => {
    const exclusions = compileExclusions(root, ['./test']);
    expect(isExcludedDirectory(join(root, 'test'), exclusions)).toBe(true);
    expect(isExcludedDirectory(resolve('test'), exclusions)).toBe(false);
  });

  it('does not match directories outside the scan root', () => {
    const exclusions = compileExclusions(root, ['test', '**/something/test']);

    expect(isExcludedDirectory(join(root, '..', 'test'), exclusions)).toBe(
      false,
    );
    expect(
      isExcludedDirectory(
        join(root, '..', 'other', 'something', 'test'),
        exclusions,
      ),
    ).toBe(false);
    expect(
      isExcludedDirectory(join(root, '..backup', 'test'), exclusions),
    ).toBe(true);
  });

  it.each([
    '',
    '**/',
    'foo*',
    'something/?',
    '**/../test',
    '**/./test',
    '**//test',
    '**/something//test',
    '**/something/*',
    join(root, 'foo*'),
    String.raw`foo\\*`,
  ])('rejects unsupported or invalid pattern %s', (pattern) => {
    expect(() => compileExclusions(root, [pattern])).toThrow();
  });
});
