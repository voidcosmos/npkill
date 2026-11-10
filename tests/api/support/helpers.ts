import { it } from '@jest/globals';
import { randomBytes } from 'node:crypto';
import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, sep } from 'node:path';
import type { Observable } from 'rxjs';

interface Outcome<T> {
  values: T[];
  completed: boolean;
  error: unknown;
}

export const itWithUnixPermissions =
  process.platform === 'win32' || process.getuid?.() === 0 ? it.skip : it;

export const itOnUnix = process.platform === 'win32' ? it.skip : it;

export const OBSERVE_TIMEOUT_MS = 2500;
const temporaryDirs: string[] = [];
const lockedPaths: string[] = [];

export function createTempDir(): string {
  // On macOS tmpdir() is behind a symlink and process.cwd() returns the real path.
  const dir = mkdtempSync(join(realpathSync.native(tmpdir()), 'npkill-api-'));
  temporaryDirs.push(dir);
  return dir;
}

export function createTree(relativeDirs: string[]): string {
  const root = createTempDir();
  relativeDirs.forEach((dir) =>
    mkdirSync(join(root, dir), { recursive: true }),
  );
  return root;
}

export function writeRandomFile(path: string, bytes: number): void {
  writeFileSync(path, randomBytes(bytes));
}

export function lockPermissions(path: string, mode: number): void {
  chmodSync(path, mode);
  lockedPaths.push(path);
}

export function removeTempDirs(): void {
  lockedPaths.splice(0).forEach((path) => chmodSync(path, 0o755));
  temporaryDirs
    .splice(0)
    .forEach((dir) => rmSync(dir, { recursive: true, force: true }));
}

export function relativePaths(
  results: Array<{ path: string }>,
  root: string,
): string[] {
  return results
    .map(({ path }) => relative(root, path).split(sep).join('/'))
    .sort();
}

export async function inDirectory<T>(
  dir: string,
  action: () => Promise<T>,
): Promise<T> {
  const originalCwd = process.cwd();
  process.chdir(dir);
  try {
    return await action();
  } finally {
    process.chdir(originalCwd);
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function observe<T>(
  source$: Observable<T>,
  timeoutMs = OBSERVE_TIMEOUT_MS,
): Promise<Outcome<T>> {
  return new Promise((resolve) => {
    const outcome: Outcome<T> = {
      values: [],
      completed: false,
      error: undefined,
    };
    let timer: NodeJS.Timeout | undefined;

    const settle = (): void => {
      clearTimeout(timer);
      resolve(outcome);
    };

    const subscription = source$.subscribe({
      next: (value) => {
        outcome.values.push(value);
      },
      error: (error) => {
        outcome.error = error;
        settle();
      },
      complete: () => {
        outcome.completed = true;
        settle();
      },
    });

    if (!subscription.closed) {
      timer = setTimeout(() => {
        subscription.unsubscribe();
        settle();
      }, timeoutMs);
    }
  });
}
