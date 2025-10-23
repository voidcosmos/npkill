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
  - [hideSensitiveResults](#hidesensitiveresults)
  - [dryRun](#dryrun)
  - [checkUpdates](#checkupdates)
  - [defaultProfiles](#defaultProfiles)
  - [profiles](#profiles)
- [Error Handling](#error-handling)
  - [Testing Your Configuration](#testing-your-configuration)

## Location

Npkill will search for the config file in the directory by default and at startup.

```bash
~/.npkillrc
```

Alternatively, you can specify a custom location using the `--config` flag:

```bash
npkill --config /path/to/your/config.json
```

## Example

```json
{
  "rootDir": "/home/user/projects",
  "exclude": [".git", "important-project", "production-app"],
  "sortBy": "size",
  "sizeUnit": "auto",
  "hideSensitiveResults": true,
  "dryRun": false,
  "checkUpdates": true,
  "defaultProfiles": ["node", "database"],
  "profiles": {
    "webdev": {
      "description": "Frontend web development artifacts and build outputs",
      "targets": ["dist", ".next", ".nuxt", ".output", "build", ".svelte-kit"]
    },
    "mobile": {
      "description": "Mobile platform build folders and caches",
      "targets": ["Pods", "build", "DerivedData", ".gradle", "android/build"]
    },
    "database": {
      "description": "Database data folders (use with caution)",
      "targets": ["data", "db", "mongodb", "postgres"]
    }
  }
}
```

## Options

### rootDir

**Type:** `string`  
**Default:** ``

Absolute path from which the search will begin.

```json
"rootdir": "/home/user/my-projects/"
```

### exclude

**Type:** `string[]`  
**Default:** `[".git"]`

Array of directory names to exclude from search. Npkill will skip these directories and their subdirectories.

```json
"exclude": [".git", "production-project", "node_modules/.cache"]
```

### sortBy

**Type:** `"none" | "size" | "path" | "last-mod"`  
**Default:** `"none"`

Default sort order for results.

- `"none"`: Results appear in the order they're found
- `"size"`: Largest folders first
- `"path"`: Alphabetical by path
- `"last-mod"`: Oldest modified projects first

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

### hideSensitiveResults

**Type:** `boolean`  
**Default:** `false`

Hide results that may be sensitive.

```json
"hideSensitiveResults": true
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

Define the profile names to be used by default. These can be either built-in or user-defined names.

```json
"checkUpdates": true
```

### profiles

**Type:** `{ [name: string]: { targets: string[] } }`  
**Default:** `{}`

Define custom profiles with specific target directories. These can be used with the `-p` or `--profiles` flag.

These will overwrite the base profiles.

You can check the existing ones with `--profiles` and even copy the output of those you are interested in to combine them into one.

```json
"profiles": {
  "webdev": {
    "description": "Frontend web development artifacts and build outputs",
    "targets": ["dist", ".next", ".nuxt", ".output"]
  },
  "mystack": {
    "description": "Full-stack project artifacts (JS/Python/Java)",
    "targets": ["venv", ".venv", "target", "__pycache__", ".gradle"]
  },
  "mobile": {
    "description": "Mobile platform build folders and caches",
    "targets": ["Pods", "build", "DerivedData", "gradle"]
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
