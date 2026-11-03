# npkill API

npkill can be used from Node.js to build your own tools and automations. It is the same engine the CLI uses.

```bash
npm install npkill rxjs
```

npkill is an ES module and needs Node.js 20.19 or later. Every operation returns an [RxJS](https://rxjs.dev) `Observable`, so `rxjs` 7 is a peer dependency.

- [Example](#example)
- [How it behaves](#how-it-behaves)
- [Methods](#methods)
  - [`startScan$(rootPath, options)`](#startscanrootpath-options)
  - [`stopScan()`](#stopscan)
  - [`getSize$(path)`](#getsizepath)
  - [`getNewestFile$(path)`](#getnewestfilepath)
  - [`delete$(path, options?)`](#deletepath-options)
  - [`getLogs$()`](#getlogs)
  - [`isValidRootFolder(path)`](#isvalidrootfolderpath)
  - [`getVersion()`](#getversion)
- [`DEFAULT_PROFILES`](#default_profiles)
- [Types](#types)
- [Stability](#stability)

## Example

Find the `node_modules` and `.next` folders of a directory and add up their size:

```ts
import { Npkill } from 'npkill';
import { map, mergeMap, toArray } from 'rxjs';

const npkill = new Npkill();

npkill
  .startScan$('/home/user/projects', { targets: ['node_modules', '.next'] })
  .pipe(
    mergeMap((target) =>
      npkill
        .getSize$(target.path)
        .pipe(map(({ size }) => ({ path: target.path, size }))),
    ),
    toArray(),
  )
  .subscribe((results) => {
    const totalBytes = results.reduce((total, { size }) => total + size, 0);
    console.table(results);
    console.log(`${(totalBytes / 1024 ** 2).toFixed(1)} MB can be freed`);
  });
```

Delete the `node_modules` of the projects that nobody has touched in 90 days. Remove `dryRun` when you trust the output:

```ts
import { Npkill } from 'npkill';
import { dirname } from 'node:path';
import { filter, mergeMap } from 'rxjs';

const npkill = new Npkill();
const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;

npkill
  .startScan$('/home/user/projects', { targets: ['node_modules'] })
  .pipe(
    filter(({ riskAnalysis }) => !riskAnalysis?.isSensitive),
    mergeMap((target) =>
      npkill.getNewestFile$(dirname(target.path)).pipe(
        filter((newest) => newest !== null && newest.timestamp < ninetyDaysAgo),
        mergeMap(() => npkill.delete$(target.path, { dryRun: true })),
      ),
    ),
  )
  .subscribe((result) => console.log(result));
```

## How it behaves

- Nothing happens until you subscribe, and each subscription runs the operation again.
- Relative paths are resolved against the current working directory. Every path that npkill returns is absolute.
- The methods that return an observable report errors through its error channel, never as exceptions. Error messages are meant for people and can change in any version.
- Each instance starts its own worker threads the first time it needs them and releases them when it has been idle for a while, so your process can exit on its own. Reuse one instance instead of creating one per operation.
- npkill reads its own `package.json` and starts its workers from its own files, so bundling it into a single file is not supported.

## Methods

### `startScan$(rootPath, options)`

Searches `rootPath` recursively and emits a [`ScanFoundTarget`](#scanfoundtarget) for each folder whose name is one of `options.targets`, as soon as it is found. It completes when the whole tree has been explored.

- A target is matched by its exact name, case included, and it is always a directory.
- The scan does not look inside the targets it finds, so `node_modules/pkg/node_modules` is never reported.
- Symlinks below the root are not followed. A symlink given as the root is.
- Some folders that rarely hold projects are never entered unless their name is a target or `options.useDefaultIgnore` is `false`. Today they are `.git`, `.svn`, `.hg`, `.fossil`, `.Trash`, `.Trashes`, `System Volume Information`, `.Spotlight-V100`, `.fseventsd`, `.nvm`, `.rvm`, `.rustup`, `.pyenv`, `.rbenv`, `.asdf`, `.deno`, `.vscode`, `.idea`, `.vs`, `.settings`, `snap`, `.flatpak-info`, `node_modules`, `__pycache__`, `target`, `build`, `dist`, `.cache`, `.venv` and `venv`.
- Folders that cannot be read are skipped and the scan goes on.

Only one scan can run at a time on each instance. Subscribing to a second one while the first is running emits an error. Use another instance to scan in parallel. Unsubscribing stops the scan.

It errors when:

- `options.targets` is not a non-empty array of names.
- A target uses `*`, `?`, `[`, `]`, `{`, `}`, `/` or `\`. These characters are reserved for patterns.
- The root is not a directory that can be read and entered. The message includes the reason that [`isValidRootFolder`](#isvalidrootfolderpath) gives.

### `stopScan()`

Stops the scan in progress, if there is one, and completes its observable. Size calculations in progress are not affected.

### `getSize$(path)`

Emits a [`GetSizeResult`](#getsizeresult) with the space that a directory and everything inside it, or a single file, uses on disk. Then it completes.

The size is an estimate. Each file counts the blocks it has allocated, each subfolder counts 4096 bytes, and a file with several hard links is counted once for each link. A symlink given as the path is measured itself, the same way `delete$` deletes the link and not what it points to. Symlinks inside a directory are not counted.

It errors when the path does not exist or cannot be read, and when the calculation takes too long.

### `getNewestFile$(path)`

Emits a [`GetNewestFileResult`](#getnewestfileresult) with the most recently modified file inside a directory and all its subdirectories, or `null` if the directory has no files. Then it completes.

Folders named `node_modules`, `.git`, `coverage` and `dist`, in any case, are not inspected. Symlinks inside the directory are ignored, but a symlink given as the path is followed.

It errors when the path does not exist, is not a directory or cannot be read.

### `delete$(path, options?)`

Deletes the path and everything inside it, like `rm -rf`, and emits a [`DeleteResult`](#deleteresult). Then it completes.

- It does not check that the path is a target found by a scan. That is up to you.
- Like `rm`, it refuses `.`, `..` and filesystem roots.
- A symlink is deleted itself, never what it points to.
- Deleting a path that does not exist succeeds.
- With `{ dryRun: true }` nothing is deleted and the result is a success.

A deletion that fails emits a result with `success: false` and the error. An empty or refused path, an unknown option or a `dryRun` that is not a boolean errors instead.

### `getLogs$()`

Emits the recent log entries of the instance, one [`LogEntry`](#logentry) at a time, and then each new one as it is written. It never completes, so unsubscribe when you are done.

### `isValidRootFolder(path)`

Tells whether a scan can start from `path`. Returns an [`IsValidRootFolderResult`](#isvalidrootfolderresult). The path must be an existing directory that npkill can read and enter.

### `getVersion()`

Returns the version of npkill, like `1.0.0`.

## `DEFAULT_PROFILES`

The built-in profiles of the CLI, indexed by name. Each one is a [`Profile`](#profile). They are frozen and their targets can be passed straight to a scan:

```ts
import { DEFAULT_PROFILES, Npkill } from 'npkill';

new Npkill().startScan$('.', { targets: DEFAULT_PROFILES.python.targets });
```

Profiles and their targets can change in any version, so an unattended script that deletes what it finds should use its own list of targets.

## Types

### `ScanOptions`

```ts
interface ScanOptions {
  targets: readonly string[];
  exclude?: string[];
  useDefaultIgnore?: boolean; // Default: true
  performRiskAnalysis?: boolean; // Default: true
}
```

`exclude` lists paths to leave out of the scan. `useDefaultIgnore: false` also looks inside the folders that are skipped by default.

### `ScanFoundTarget`

```ts
interface ScanFoundTarget {
  path: string;
  riskAnalysis?: RiskAnalysis; // Missing when performRiskAnalysis is false
}
```

### `RiskAnalysis`

Whether deleting a result could break something, for example because it belongs to an installed application, and why.

```ts
interface RiskAnalysis {
  isSensitive: boolean;
  reason?: string;
}
```

### `GetSizeResult`

```ts
interface GetSizeResult {
  size: number; // Bytes
}
```

### `GetNewestFileResult`

```ts
interface GetNewestFileResult {
  path: string;
  name: string;
  timestamp: number; // Milliseconds since the Unix epoch
}
```

### `DeleteOptions`

```ts
interface DeleteOptions {
  dryRun?: boolean;
}
```

### `DeleteResult`

```ts
type DeleteResult =
  | { path: string; success: true }
  | { path: string; success: false; error: DeleteError };

interface DeleteError {
  message: string;
  code?: string;
}
```

### `LogEntry`

```ts
interface LogEntry {
  type: 'info' | 'warn' | 'error';
  timestamp: number;
  message: string;
}
```

### `IsValidRootFolderResult`

```ts
interface IsValidRootFolderResult {
  isValid: boolean;
  invalidReason?: string;
}
```

### `Profile`

```ts
interface Profile {
  readonly targets: readonly string[];
  readonly description: string;
}
```

## Stability

The API is new. Until it matures, incompatible changes can arrive in minor versions, never in patches, and the release notes will list them.

These changes can happen in any version and are not considered incompatible:

- New methods in `Npkill` and `NpkillInterface`. If you implement `NpkillInterface` yourself, expect it to grow.
- New fields in results and new optional fields in options.
- New log entry types, and `getLogs$()` keeping fewer old entries.
- Changes to the profiles, the risk analysis rules and the lists of folders that are never entered or inspected.
- Changes to error messages.
