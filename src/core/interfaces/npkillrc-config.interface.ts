import { PROFILE } from './profile.interface.js';

/**
 * Represents the structure of .npkillrc configuration file.
 * All properties are optional as users may only override specific settings.
 */
export interface INpkillrcConfig {
  /**
   * Absolute path from which the search will begin.
   * @example "/home/user/my-projects/"
   */
  rootDir?: string;

  /**
   * Array of directory names to exclude from search.
   * These directories and their subdirectories will be skipped.
   * @example [".git", "important-project"]
   */
  exclude?: string[];

  /**
   * Default sort order for results.
   * @default "none"
   */
  sortBy?: 'none' | 'size' | 'path' | 'last-mod';

  /**
   * Unit for displaying folder sizes.
   * - "auto": Sizes < 1024MB shown in MB, larger sizes in GB
   * - "mb": Always show in megabytes
   * - "gb": Always show in gigabytes
   * @default "auto"
   */
  sizeUnit?: 'auto' | 'mb' | 'gb';

  /**
   * Exclude sensitive results.
   * @default false
   */
  excludeSensitiveResults?: boolean;

  /**
   * Enable dry-run mode by default.
   * When true, deletions are simulated (nothing is actually deleted).
   * @default false
   */
  dryRun?: boolean;

  /**
   * Check for npkill updates on startup.
   * @default true
   */
  checkUpdates?: boolean;

  /**
   * Profiles to use.
   * @example ["node", "python"]
   * @default ["node"]
   */
  defaultProfiles?: string[];

  /**
   * Custom profiles with specific target directories.
   * Profile names can be used with the -p/--profiles flag.
   * @example
   * {
   *   "webdev": {
   *     "targets": ["node_modules", "dist", ".next"],
   *     "description": "Web development artifacts"
   *   },
   *   "python": {
   *     "targets": [".venv", "__pycache__"],
   *     "description": "Python virtual environments and caches"
   *   }
   * }
   */
  profiles?: Record<string, PROFILE>;
}

/**
 * Result of loading and parsing a .npkillrc configuration file.
 */
export interface IConfigLoadResult {
  /**
   * The parsed configuration, or null if loading failed.
   */
  config: INpkillrcConfig | null;

  /**
   * Path to the configuration file that was loaded or attempted to load.
   */
  configPath: string;

  /**
   * Error message if loading or parsing failed.
   */
  error?: string;
}

export const VALID_NPKILLRC_PROPERTIES = [
  'rootDir',
  'exclude',
  'sortBy',
  'sizeUnit',
  'excludeSensitiveResults',
  'dryRun',
  'checkUpdates',
  'defaultProfiles',
  'profiles',
] as const satisfies readonly (keyof INpkillrcConfig)[];
