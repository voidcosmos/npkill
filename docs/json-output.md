# JSON Output

Npkill supports two JSON output modes that allow you to integrate it into automation scripts, monitoring systems, or other tools.

## Table of Contents

- [Output Modes](#output-modes)
- [Deleting Without the Interface](#deleting-without-the-interface)
- [JSON Structure](#json-structure)
- [Examples](#examples)
- [TypeScript Interfaces](#typescript-interfaces)

## Output Modes

### Simple JSON (`--json`)

The `--json` option collects all results and outputs them as a single JSON object at the end of the scan. This is useful when you need all results at once for batch processing.

```bash
npkill --json
```

### Streaming JSON (`--json-stream`)

The `--json-stream` option outputs one JSON object per line (JSONL). Each result is printed once its statistics and any requested deletion have finished.

```bash
npkill --json-stream
```

There is no final completion record or metadata line. Wait for the command to exit to know when output has finished. If nothing matches, stdout is empty.

## Deleting Without the Interface

Add `--delete-all` (`-D`) to delete every result before it is printed. It only works together with `--targets`, and in JSON mode it also needs `-y` because there is no way to confirm it. `--older-than`, `--exclude` and `--exclude-sensitive` are applied before deleting.

```bash
npkill -t node_modules --older-than 30 -D -y --json
```

Each result waits for its size and age before it is deleted. Add `--no-size` or `--no-stats` to delete each one as soon as it is found.

Each result then includes a `deletion` field. If any deletion fails, npkill exits with code 1 after printing all the results. With `--dry-run` nothing is deleted and every deletion is reported as successful.

## JSON Structure

### Simple JSON Output

The simple JSON format includes all results in a single object with metadata:

```json
{
  "version": 1,
  "results": [
    {
      "path": "/home/user/project1/node_modules",
      "size": 157286400,
      "projectModificationTime": 1640995200000,
      "riskAnalysis": {
        "isSensitive": false
      }
    },
    {
      "path": "/home/user/project2/node_modules",
      "size": 89478400,
      "projectModificationTime": 1640995300000
    }
  ],
  "meta": {
    "resultsCount": 2,
    "runDuration": 1523
  }
}
```

### Streaming JSON Output

Each line in streaming mode contains a single result:

```json
{"version":1,"result":{"path":"/home/user/project1/node_modules","size":157286400,"projectModificationTime":1640995200000,"riskAnalysis":{"isSensitive":false}}}
{"version":1,"result":{"path":"/home/user/project2/node_modules","size":89478400,"projectModificationTime":1640995300000}}
```

### Error Output

Errors are output to stderr in JSON format. If the scan cannot run, npkill exits with code 1 after writing the error.

```json
{
  "version": 1,
  "error": true,
  "message": "Permission denied accessing /restricted/path",
  "timestamp": 1640995300000
}
```

### Field Descriptions

- **`version`**: Output schema version, independent of the npkill package version.
- **`path`**: Absolute path to the found directory, using the platform's path syntax.
- **`size`**: Estimated disk usage in bytes, or `null` with `--no-size` or `--no-stats`. It is not a guarantee of recoverable space.
- **`projectModificationTime`**: Latest observed file modification in the target's parent directory and its subdirectories, in milliseconds since the Unix epoch. It is a heuristic for project activity, not the target directory's modification time. It is `null` when unknown or disabled with `--no-age` or `--no-stats`.
- **`riskAnalysis`**: Optional risk assessment for deletion. Its absence does not mean the directory is safe.
  - **`isSensitive`**: Whether the directory might be important for system functionality.
  - **`reason`**: Optional human-readable explanation of the risk assessment.
- **`deletion`**: Only present with `--delete-all`.
  - **`success`**: Whether the real or simulated deletion succeeded. A successful dry run does not verify that a real deletion would succeed.
  - **`error`**: Human-readable failure message, absent on success.
- **`resultsCount`**: Number of results after filtering, including failed deletions. Only present in `meta` with `--json`.
- **`runDuration`**: Session duration in milliseconds, including statistics and deletion. Only present in `meta` with `--json`.
- **`timestamp`**: Unix timestamp (milliseconds) of the error.

Project activity calculation skips folders named `node_modules`, `.git`, `coverage` and `dist`, case-insensitively. Other target folders can contribute to the timestamp. It can be `null`, for example, if there are no eligible files or the target is directly inside the user's home directory.

Neither mode guarantees result order. `--sort-by` does not sort JSON output. Sort results in the consumer if needed.

Consumers should ignore additional fields. Incompatible changes to field names, units or structure require a new schema version. Error messages are intended for people and can change without a schema version change.

## Examples

### Basic Usage

```bash
# Get all results as JSON
npkill --json > results.json

# Stream results in real-time
npkill --json-stream | while read line; do
  echo "Found: $(echo $line | jq -r '.result.path')"
done
```

### Using with jq for Processing

```bash
# Extract only paths larger than 100MB
npkill --json | jq '.results[] | select(.size > 104857600) | .path'

# Count total size of all node_modules
npkill --json | jq '.results | map(.size) | add'

# Get the 5 largest directories
npkill --json | jq '.results | sort_by(.size) | reverse | .[0:5] | .[] | "\(.size | tostring) bytes: \(.path)"'

# Convert streaming output to a valid JSON array
npkill --json-stream | jq -s 'map(.result)'
```

### Error Handling

```bash
# Save results to file, ignore errors
npkill --json 2>/dev/null > results.json

# Save both results and errors to separate files
npkill --json-stream > results.jsonl 2> errors.jsonl

# Process only successful results in streaming mode
npkill --json-stream 2>/dev/null | jq -r '.result.path'
```

### Automation Examples

```bash
# Delete node_modules not touched in 30 days and list what could not be deleted
npkill -t node_modules --older-than 30 -D -y --json | jq -r '.results[] | select(.deletion.success == false) | .path'

# Generate a report of space usage
npkill --json | jq -r '.results[] | "\(.path): \(.size / 1048576 | floor)MB"' > space-report.txt

# Monitor in real-time and alert on large directories
npkill --json-stream | jq -r 'select(.result.size > 524288000) | "LARGE DIR: \(.result.path) (\(.result.size / 1048576 | floor)MB)"'
```

### Integration with Other Tools

```bash
# Send results to a monitoring system
npkill --json-stream | while read line; do
  curl -X POST -H "Content-Type: application/json" -d "$line" http://monitoring-system/api/npkill
done

# Create a CSV report
echo "Path,Size(MB),LastModified" > report.csv
npkill --json | jq -r '.results[] | "\(.path),\(.size/1048576|floor),\(.projectModificationTime)"' >> report.csv

# Filter and format for human reading
npkill --json | jq -r '.results[] | select(.size > 52428800) | "📁 \(.path)\n   💾 Size: \(.size/1048576|floor)MB\n   📅 Project modified: \(if .projectModificationTime then (.projectModificationTime / 1000 | strftime("%Y-%m-%d %H:%M:%S")) else "unknown" end)\n"'
```

## TypeScript Interfaces

These describe the JSON output. They are not exported from the `npkill` package.

```typescript
interface JsonOutputBase {
  version: number;
}

interface JsonStreamOutput extends JsonOutputBase {
  result: JsonCliScanFoundTarget;
}

interface JsonSimpleOutput extends JsonOutputBase {
  results: JsonCliScanFoundTarget[];
  meta: {
    resultsCount: number;
    runDuration: number;
  };
}

interface JsonErrorOutput extends JsonOutputBase {
  error: true;
  message: string;
  timestamp: number;
}

interface JsonCliScanFoundTarget {
  path: string;
  size: number | null;
  projectModificationTime: number | null;
  riskAnalysis?: {
    isSensitive: boolean;
    reason?: string;
  };
  deletion?: {
    success: boolean;
    error?: string;
  };
}
```
