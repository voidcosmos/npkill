export interface IConfig {
  profiles: string[];
  folderRoot: string;
  checkUpdates: boolean;
  deleteAll: boolean;
  sizeUnit: 'auto' | 'mb' | 'gb';
  maxSimultaneousSearch: number;
  showErrors: boolean;
  sortBy: string;
  targets: string[];
  exclude: string[];
  excludeSensitiveResults: boolean;
  dryRun: boolean;
  yes: boolean;
  jsonStream: boolean;
  jsonSimple: boolean;
  disableSize: boolean;
  disableAge: boolean;
  disableStats: boolean;
  /** Only show results whose project is older than this many days. 0 = disabled. */
  olderThan: number;
}
