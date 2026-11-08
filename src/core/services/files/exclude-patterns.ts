import { basename, isAbsolute, normalize, relative, resolve, sep } from 'path';

export interface CompiledExclusions {
  rootPath: string;
  names: Set<string>;
  paths: Set<string>;
  anywherePaths: string[];
}

type ParsedExclusion = {
  kind: 'name' | 'path' | 'anywherePath';
  value: string;
};

/** Compile the small set of path patterns supported by --exclude. */
export function compileExclusions(
  rootPath: string,
  excludes: string[] = [],
): CompiledExclusions {
  const compiled: CompiledExclusions = {
    rootPath: resolve(rootPath),
    names: new Set(),
    paths: new Set(),
    anywherePaths: [],
  };

  for (const raw of excludes) {
    const { kind, value } = parseExclusion(raw, compiled.rootPath);

    if (kind === 'name') {
      compiled.names.add(value);
    } else if (kind === 'path') {
      compiled.paths.add(value);
    } else {
      compiled.anywherePaths.push(value);
    }
  }

  return compiled;
}

export function isExcludedDirectory(
  directoryPath: string,
  exclusions: CompiledExclusions,
): boolean {
  const path = resolve(directoryPath);
  const fromRoot = relative(exclusions.rootPath, path);

  return (
    !isOutsideRoot(fromRoot) && matchesExclusion(path, fromRoot, exclusions)
  );
}

function matchesExclusion(
  path: string,
  fromRoot: string,
  exclusions: CompiledExclusions,
): boolean {
  return (
    exclusions.names.has(basename(path)) ||
    exclusions.paths.has(path) ||
    exclusions.anywherePaths.some(
      (suffix) => fromRoot === suffix || fromRoot.endsWith(`${sep}${suffix}`),
    )
  );
}

/** On POSIX, backslash escapes *, ?, and itself; on Windows it is a separator. */
function decodeLiteralWildcards(pattern: string, raw: string): string {
  let decoded = '';

  for (let index = 0; index < pattern.length;) {
    const character = readPatternCharacter(pattern, index, raw);
    decoded += character.value;
    index = character.nextIndex;
  }

  return decoded;
}

function readPatternCharacter(
  pattern: string,
  index: number,
  raw: string,
): { value: string; nextIndex: number } {
  const char = pattern[index];
  const next = pattern[index + 1];

  if (isEscapedLiteral(char, next)) {
    return { value: next, nextIndex: index + 2 };
  }

  assertSupportedCharacter(char, raw);
  return { value: char, nextIndex: index + 1 };
}

function isEscapedLiteral(
  char: string,
  next: string | undefined,
): next is string {
  return (
    sep !== '\\' &&
    char === '\\' &&
    (next === '*' || next === '?' || next === '\\')
  );
}

function assertSupportedCharacter(char: string, raw: string): void {
  if (char === '*' || char === '?') {
    throw new Error(`Unsupported exclude pattern: ${raw}`);
  }
}

function isOutsideRoot(fromRoot: string): boolean {
  return (
    fromRoot === '..' || fromRoot.startsWith(`..${sep}`) || isAbsolute(fromRoot)
  );
}

function isInvalidPath(path: string): boolean {
  return !path || path === '.' || path === '..';
}

function normalizeAnywherePath(pattern: string, raw: string): string {
  const suffix = pattern.slice(3);

  if (!suffix || suffix.split('/').some((part) => isInvalidPath(part))) {
    throw new Error(`Invalid exclude pattern: ${raw}`);
  }

  return normalize(decodeLiteralWildcards(suffix, raw));
}

function parseExclusion(raw: string, rootPath: string): ParsedExclusion {
  if (isAbsolute(raw)) {
    return { kind: 'path', value: resolve(decodeLiteralWildcards(raw, raw)) };
  }

  const pattern = raw.replace(sep === '\\' ? /[\\/]+$/ : /\/+$/, '');

  if (!pattern || pattern === '.' || pattern === '**') {
    throw new Error(`Invalid exclude pattern: ${raw}`);
  }

  if (pattern.startsWith('**/')) {
    return { kind: 'anywherePath', value: normalizeAnywherePath(pattern, raw) };
  }

  const literalPattern = decodeLiteralWildcards(pattern, raw);

  if (pattern.includes('/') || (sep === '\\' && pattern.includes('\\'))) {
    return { kind: 'path', value: resolve(rootPath, literalPattern) };
  }

  return { kind: 'name', value: literalPattern };
}
