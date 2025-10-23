import { INpkillrcConfig } from '../../interfaces/npkillrc-config.interface.js';

/**
 * Merges exclude arrays from base and file config, avoiding duplicates
 */
export function mergeExcludeArrays(
  baseExclude: unknown,
  fileExclude: string[],
): string[] {
  const base = Array.isArray(baseExclude) ? (baseExclude as string[]) : [];
  return [...new Set([...base, ...fileExclude])];
}

/**
 * Merges a simple property (direct override)
 */
export function mergeProperty<T>(
  merged: Record<string, unknown>,
  key: string,
  value: T,
): void {
  merged[key] = value;
}

/**
 * Type guard to check if a property exists and is not undefined
 */
export function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}

/**
 * Applies all file config properties to the merged config
 */
export function applyFileConfigProperties(
  merged: Record<string, unknown>,
  baseConfig: Record<string, unknown>,
  fileConfig: INpkillrcConfig,
): void {
  // rootDir
  if (isDefined(fileConfig.rootDir)) {
    mergeProperty(merged, 'rootDir', fileConfig.rootDir);
  }

  // exclude (special merge logic)
  if (isDefined(fileConfig.exclude)) {
    merged.exclude = mergeExcludeArrays(baseConfig.exclude, fileConfig.exclude);
  }

  // sortBy
  if (isDefined(fileConfig.sortBy)) {
    mergeProperty(merged, 'sortBy', fileConfig.sortBy);
  }

  // sizeUnit
  if (isDefined(fileConfig.sizeUnit)) {
    mergeProperty(merged, 'sizeUnit', fileConfig.sizeUnit);
  }

  // hideSensitiveResults
  if (isDefined(fileConfig.hideSensitiveResults)) {
    mergeProperty(
      merged,
      'hideSensitiveResults',
      fileConfig.hideSensitiveResults,
    );
  }

  // dryRun
  if (isDefined(fileConfig.dryRun)) {
    mergeProperty(merged, 'dryRun', fileConfig.dryRun);
  }

  // checkUpdates
  if (isDefined(fileConfig.checkUpdates)) {
    mergeProperty(merged, 'checkUpdates', fileConfig.checkUpdates);
  }

  // defaultProfiles
  if (isDefined(fileConfig.defaultProfiles)) {
    mergeProperty(merged, 'defaultProfiles', fileConfig.defaultProfiles);
  }
}
