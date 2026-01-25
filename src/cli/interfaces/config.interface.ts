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
}
