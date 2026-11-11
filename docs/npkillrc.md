# Config File - npkillrc

You can customize the behavior of npkill through the config file (`.npkillrc` by default).

## Table of Contents

- [Location](#location)
- [Example](#example)
- [Options](#options)
  - [rootDir](#rootDir)
  - [exclude](#exclude)
  - [sortBy](#sortby)
  - [sizeUnit](#sizeunit)
  - [excludeSensitiveResults](#excludeSensitiveResults)
  - [dryRun](#dryrun)
  - [checkUpdates](#checkupdates)
  - [defaultProfiles](#defaultProfiles)
  - [profiles](#profiles)
- [Error Handling](#error-handling)
  - [Testing Your Configuration](#testing-your-configuration)

## Location

Npkill searches for the configuration file in the following order of priority:

1. **Custom path** specified via `--config` flag
2. **Current working directory**: `./.npkillrc`
3. **User's home directory**: `~/.npkillrc`

The first configuration file found will be used.

You can use `--config` in this way:

```bash
npkill --config /path/to/your/config.json
```

## Example

```json
{
  "rootDir": "/home/user/projects",
  "exclude": ["important-project", "production-app"],
  "sortBy": "size",
  "sizeUnit": "auto",
  "excludeSensitiveResults": true,
  "dryRun": false,
  "checkUpdates": true,
  "defaultProfiles": ["node", "rust"]
}
```

## Options

### rootDir

**Type:** `string`  
**Default:** ``

Absolute path from which the search will begin.

```json
"rootDir": "/home/user/my-projects/"
```

### exclude

**Type:** `string[]`  
**Default:** `[]`

Array of directory names to exclude from search. Npkill will skip these directories and their subdirectories.

```json
"exclude": ["production-project", "node_modules/.cache"]
```

### sortBy

**Type:** `"none" | "size" | "path" | "age"`  
**Default:** `"none"`

Default sort order for results.

- `"none"`: Results appear in the order they're found
- `"size"`: Largest folders first
- `"path"`: Alphabetical by path
- `"age"`: Oldest modified projects first

```json
"sortBy": "size"
```

### sizeUnit

**Type:** `"auto" | "mb" | "gb"`  
**Default:** `"auto"`

Unit for displaying folder sizes.

- `"auto"`: Sizes < 1024MB shown in MB, larger sizes in GB
- `"mb"`: Always show in megabytes
- `"gb"`: Always show in gigabytes

```json
"sizeUnit": "auto"
```

### excludeSensitiveResults

**Type:** `boolean`  
**Default:** `false`

Hide results that may be sensitive.

```json
"excludeSensitiveResults": true
```

### dryRun

**Type:** `boolean`  
**Default:** `false`

When true, deletions are simulated (nothing is actually deleted).

```json
"dryRun": false
```

### checkUpdates

**Type:** `boolean`  
**Default:** `true`

Check for updates on startup.

```json
"checkUpdates": true
```

### defaultProfiles

**Type:** `string[]`  
**Default:** `["node"]`

Define the profile names to be used by default. These can be either built-in or user-defined names. An empty list and unknown names are rejected.

```json
"defaultProfiles": ["node", "rust"]
```

### profiles

**Type:** `{ [name: string]: { description: string, targets: TargetDefinition[] } }`  
**Default:** `{}`

Define custom profiles to use with `-p` or `--profiles`. Each target is a folder name or a [rule](./profiles.md#custom-rules). A custom profile replaces the built-in one with the same name. `all` is reserved.

```json
"profiles": {
  "ocaml": {
    "description": "OCaml build outputs and local switches",
    "targets": ["_opam", { "target": "_build", "nextTo": ["dune-project"] }]
  }
}
```

## Error Handling

Npkill will check that the configuration file is correct at each startup. This includes:

- **Unknown properties**.
- **Type checking**.
- **Value validation**.

### Testing Your Configuration

To test if your `.npkillrc` is valid, simply run npkill:

To check that a file is valid, simply run npkill as usual. If there is an error, you will be informed exactly what the problem is.
