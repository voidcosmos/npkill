# NPKill API

This document describes the public core API of npkill and its fundamental concepts.
For more details see the project interfaces.

> [!WARNING]
>
> Some things may change in future patches until the API is 100% stable. Please leave me your feedback if you use it!

- [NPKill API](#npkill-api)
  - [Interface: `Npkill`](#interface-npkill)
    - [`startScan$(rootPath, options?)`](#startscanrootpath-options)
    - [`stopScan()`](#stopscan)
    - [`getSize$(path, options?)`](#getsizepath-options)
    - [`getNewestFile$(path)`](#getnewestfilepath)
    - [`delete$(path, options?)`](#deletepath-options)
    - [`getLogs$()`](#getlogs)
    - [`isValidRootFolder(path)`](#isvalidrootfolderpath)
    - [`getVersion()`](#getversion)
  - [Interfaces & Types](#interfaces-types)
    - [`ScanOptions`](#scanoptions)
    - [`ScanFoundFolder`](#scanfoundfolder)
    - [`RiskAnalysis`](#riskanalysis)
    - [`GetSizeOptions`](#getsizeoptions)
    - [`GetSizeResult`](#getsizeresult)
    - [`GetNewestFileResult`](#getnewestfileresult)
    - [`DeleteOptions`](#deleteoptions)
  - [Usage Example](#usage-example)

---

## Interface: `Npkill`

The core of the system is the `NpkillInterface`. It offers methods to:

- Scan folders recursively.
- Get metadata about folders (size, last modified).
- Perform safe deletions.
- Stream logs and validate folders.

### `startScan$(rootPath, options?)`

Starts a recursive scan from a given root folder.

- **Parameters**:
  - `rootPath`: `string` — Folder to start scanning from.
  - `options`: [`ScanOptions`](#scanoptions) — Optional scan configuration.

- **Returns**: `Observable<ScanFoundFolder>`
- **Description**: Emits each matching folder as it's found.

---

### `stopScan()`

Stops any ongoing scan and releases resources.

---

### `getSize$(path, options?)`

Returns the total size of a directory.

- **Parameters**:
  - `path`: `string` — Path to folder.
  - `options`: [`GetSizeOptions`](#getsizeoptions)

- **Returns**: `Observable<GetSizeResult>`

---

### `getNewestFile$(path)`

Gets the most recently modified file inside a directory (recursively).

- **Parameters**:
  - `path`: `string`

- **Returns**: `Observable<GetNewestFileResult | null>`

---

### `delete$(path, options?)`

Deletes a folder, optionally as a dry-run. Only allowed if the folder is within the `target` of the initial scan.

- **Parameters**:
  - `path`: `string`
  - `options`: [`DeleteOptions`](#deleteoptions)

- **Returns**: `Observable<DeleteResult>`
- **Throws**: If the path is outside the original target.

---

### `getLogs$()`

Streams internal log entries.

- **Returns**: `Observable<LogEntry[]>`

---

### `isValidRootFolder(path)`

Validates whether a folder is suitable for scanning.

- **Parameters**:
  - `path`: `string`

- **Returns**: [`IsValidRootFolderResult`](#isvalidrootfolderresult)

---

### `getVersion()`

Returns the current version of npkill from `package.json`.

- **Returns**: `string`

---

## Interfaces & Types

---

### `ScanOptions`

```ts
interface ScanOptions {
  targets: string[];
  exclude?: string[];
  sortBy?: 'path' | 'size' | 'last-mod';
  performRiskAnalysis?: boolean; // Default: true
}
```

---

### `ScanFoundFolder`

```ts
interface ScanFoundFolder {
  path: string;
  riskAnalysis?: RiskAnalysis;
}
```

---

### `RiskAnalysis`

Determines whether a result is safe to delete. That is, if it is likely to belong to some application and deleting it could break it.

```ts
interface RiskAnalysis {
  isSensitive: boolean;
  reason?: string;
}
```

---

### `GetSizeOptions`

```ts
interface GetSizeOptions {
  unit?: 'bytes'; // Default: 'bytes'
}
```

---

### `GetSizeResult`

```ts
interface GetSizeResult {
  size: number;
  unit: 'bytes';
}
```

---

### `GetNewestFileResult`

```ts
interface GetNewestFileResult {
  path: string;
  name: string;
  timestamp: number;
}
```

---

### `DeleteOptions`

```ts
interface DeleteOptions {
  dryRun?: boolean;
}
```

---

## Usage Example

This is a minimal example where:

1. it will start a search for `.nx` folders.
2. Get the most recent file
3. Get the total size of the directory

```ts
import { Npkill } from 'npkill';
import { mergeMap, filter, map } from 'rxjs';

const npkill = new Npkill();

let files: {
  path: string;
  size: number;
  newestFile: string;
}[] = [];

npkill
  .startScan$('/home/user/projects/', { target: '.nx' })
  .pipe(
    // Step 1: For each scan result, get the newest file
    mergeMap((scanResult) =>
      npkill.getNewestFile$(scanResult.path).pipe(
        // Step 2: If no newest file, skip this result
        filter((newestFile) => newestFile !== null),
        // Step 3: Combine scanResult and newestFile
        map((newestFile) => ({
          path: scanResult.path,
          newestFile: newestFile.path,
        })),
      ),
    ),
    // Step 4: For each result, get the folder size
    mergeMap((result) =>
      npkill.getSize$(result.path).pipe(
        map(({ size }) => ({
          ...result,
          size,
        })),
      ),
    ),
  )
  .subscribe({
    next: (result) => {
      files.push(result);
    },
    complete: () => {
      console.log('✅ Scan complete. Found folders:', files.length);
      console.table(files);
      console.log(JSON.stringify(files));
    },
  });
```

Output:

```bash
✅ Scan complete. Found folders: 3
┌─────────┬───────────────────────────────────────────┬──────────────────────────────────────────────────────────────────────────┬─────────┐
│ (index) │ path                                      │ newestFile                                                               │ size    │
├─────────┼───────────────────────────────────────────┼──────────────────────────────────────────────────────────────────────────┼─────────┤
│ 0       │ '/home/user/projects/hello-world/.nx'     │ '/home/user/projects/hello-world/.nx/cache/18.3.4-nx.linux-x64-gnu.node' │ 9388032 │
│ 1       │ '/home/user/projects/another-project/.nx' │ '/home/user/projects/another-project/.nx/workspace-data/d/daemon.log'    │ 3182592 │
│ 2       │ '/home/user/projects/ARCHIVED/demo/.nx'   │ '/home/user/projects/ARCHIVED/demo/.nx/cache/d/daemon.log'               │ 2375680 │
└─────────┴───────────────────────────────────────────┴──────────────────────────────────────────────────────────────────────────┴─────────┘
[
  {
    "path": "/home/user/projects/hello-world/.nx",
    "newestFile": "/home/user/projects/hello-world/.nx/cache/18.3.4-nx.linux-x64-gnu.node",
    "size": 9388032
  },
  {
    "path": "/home/user/projects/another-project/.nx",
    "newestFile": "/home/user/projects/another-project/.nx/workspace-data/d/daemon.log",
    "size": 3182592
  },
  ........
]
```
