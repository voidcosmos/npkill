# npkill API

Use npkill from Node.js to scan directories, measure disk usage and delete paths without the CLI.

```bash
npm install npkill rxjs
```

npkill is an ES module. It requires Node.js 20.19 or later and RxJS `^7.8.2` as a peer dependency. Import `Npkill` and the documented types from `npkill`, not internal package paths.

## Example

Find matching directories and measure their disk usage in bytes:

```ts
import { Npkill } from 'npkill';
import { map, mergeMap, toArray } from 'rxjs';

const npkill = new Npkill();

npkill
  .startScan$('./projects', { targets: ['node_modules', '.next'] })
  .pipe(
    mergeMap((result) =>
      npkill
        .getSize$(result.path)
        .pipe(map(({ size }) => ({ path: result.path, size }))),
    ),
    toArray(),
  )
  .subscribe({
    next: (results) => {
      console.table(results);
    },
    error: (error) => {
      console.error(error);
      process.exitCode = 1;
    },
  });
```

## Behavior

- Filesystem operations start when you subscribe. Each subscription runs the operation again, including deletions.
- Relative paths are resolved against the current working directory at subscription time. Returned paths are absolute, but are not necessarily resolved through symlinks.
- Observable methods report validation and operation errors through the error channel. Deletion failures are the exception described below.
- `validateRoot()` and `getVersion()` are synchronous.
- The API does not load `.npkillrc` or select CLI profiles. Pass scan options explicitly.
- Reuse an instance. Workers start when needed and are released after being idle, allowing the process to exit. Bundling npkill into a single file is not supported.

`Npkill` implements the exported `NpkillInterface`. Construct it with `new Npkill()`.

## Methods

### `startScan$(rootPath, options)`

Returns `Observable<ScanResult>`. Searches recursively and emits each matching directory, then completes. Both arguments are required.

- Targets are exact, case-sensitive directory names or rules. Results have no guaranteed order.
- The scan does not look inside a matched target, so nested targets are not reported.
- Symlinks below the root are ignored. A symlink supplied as the root is followed.
- Folders such as `.git` and `.nvm` are skipped by default unless they match a target. Set `useDefaultIgnore: false` to explore them too.
- An unreadable root errors. Unreadable descendants are skipped.

Only one scan can run at a time per instance. A second subscription while a scan is running errors. Use separate instances for parallel scans. Unsubscribing stops that scan.

### `stopScan()`

Stops the current scan, if any, and completes its observable. It does not cancel size calculations in progress.

### `getSize$(path)`

Returns `Observable<GetSizeResult>`. Emits the estimated disk usage of a file or directory in bytes, then completes. There is no unit option or `unit` field.

Files count their allocated blocks, subfolders count 4096 bytes each, and hard links are counted separately. Symlinks inside a directory are ignored. A symlink supplied as `path` is measured itself, not its destination.

A missing or unreadable path, or a calculation timeout, errors. Unreadable descendants may be skipped, so the result is not a guarantee of recoverable space.

### `getNewestFile$(path)`

Returns `Observable<GetNewestFileResult | null>`. Emits the most recently modified file in the directory and its subdirectories, or `null` if there are no eligible files, then completes.

Folders named `node_modules`, `.git`, `coverage` and `dist` are skipped, case-insensitively. Symlinks inside the directory are ignored. A symlink supplied as `path` is followed. Unreadable descendants may be skipped.

A missing, unreadable or non-directory input path errors. To estimate project activity rather than target activity, pass the target's parent directory.

### `delete$(path, options?)`

Returns `Observable<DeleteResult>`. Permanently removes the path and everything inside it, then completes.

**This does not check that the path was found by a scan or is safe to delete.**

- Like `rm -rf`, it refuses `.`, `..` and filesystem roots.
- Symlinks are deleted themselves, never their destinations.
- A missing path succeeds.
- `{ dryRun: true }` returns success without deleting anything. It does not verify whether a real deletion would succeed.

An operation failure emits `{ path, success: false, error }`, not an observable error. An empty or refused path, an unknown option or a non-boolean `dryRun` uses the error channel instead.

### `getLogs$()`

Returns `Observable<LogEntry>`. Replays recent entries for this instance, then emits new entries one at a time. It never completes, so unsubscribe when finished.

### `validateRoot(path)`

Returns `ValidateRootResult`. Checks synchronously whether the path exists, is a directory, and can be read and entered. An invalid path returns `isValid: false` with `invalidReason`.

### `getVersion()`

Returns the npkill package version as a string.

## Types

All types below, along with `NpkillInterface`, can be imported from `npkill`.

### Scanning

`targets` must be non-empty. Both boolean options default to `true`. Scanning only discovers targets, it does not calculate their size or modification time.

```ts
interface ScanOptions {
  targets: readonly TargetDefinition[];
  exclude?: string[];
  useDefaultIgnore?: boolean;
  performRiskAnalysis?: boolean;
}

type TargetDefinition = string | TargetRule;

interface TargetRule {
  readonly target: string;
  readonly nextTo?: readonly string[];
  readonly contains?: readonly string[];
}

interface ScanResult {
  path: string;
  riskAnalysis?: RiskAnalysis;
}

interface RiskAnalysis {
  isSensitive: boolean;
  reason?: string;
}
```

A rule with only `target` matches by name. `nextTo` requires entries beside the target, and `contains` requires entries inside it. Each supplied list must be non-empty, and all its names must exist. When both lists are present, both must match. Rules with the same target are alternatives. Entries can be files or directories, and rule properties other than these three are rejected.

Target and condition names cannot be empty or contain `*`, `?`, `[`, `]`, `{`, `}`, `/` or `\`. They are names, not paths or patterns.

`exclude` supports names at any depth (`archive`), paths relative to the scan root (`apps/old`), absolute paths, and path suffixes at any depth (`**/apps/old`). Excluded directories and their contents are skipped. Arbitrary glob patterns are not supported.

`riskAnalysis` is absent when `performRiskAnalysis` is `false`. Risk analysis is advisory, not proof that a directory is safe to delete. See [custom rules](./docs/profiles.md#custom-rules) for more examples.

### File metadata

Sizes are in bytes. `modificationTime` is in milliseconds since the Unix epoch.

```ts
interface GetSizeResult {
  size: number;
}

interface GetNewestFileResult {
  path: string;
  name: string;
  modificationTime: number;
}
```

### Deletion

`dryRun` defaults to `false`. A successful result has no `error` field. Failure messages are human-readable, and a system error code is included when available.

```ts
interface DeleteOptions {
  dryRun?: boolean;
}

type DeleteResult =
  | { path: string; success: true }
  | { path: string; success: false; error: DeleteError };

interface DeleteError {
  message: string;
  code?: string;
}
```

### Logs and validation

Log timestamps are milliseconds since the Unix epoch. `invalidReason` explains why a path cannot be used as a scan root.

```ts
interface LogEntry {
  level: 'info' | 'warn' | 'error';
  timestamp: number;
  message: string;
}

interface ValidateRootResult {
  isValid: boolean;
  invalidReason?: string;
}
```

## Stability

The API is still new. While it matures, incompatible API changes may arrive in minor releases. Risk heuristics, ignore lists, log retention and human-readable messages can change. Do not use message text as an identifier for automation.
