# Config File (`.npkillrc`)

You can customize the behavior of npkill through the config file.

## Table of Contents

- [Location](#location)
- [Example](#example)
- [Options](#options)
  - [exclude](#exclude)
  - [sortBy](#sortby)
  - [sizeUnit](#sizeunit)
  - [hideSensitiveResults](#hidesensitiveresults)
  - [dryRun](#dryrun)
  - [checkUpdates](#checkupdates)
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
  "exclude": ["important-project"],
  "sortBy": "size",
  "hideSensitiveResults": true,
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
}
```

## Options

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
