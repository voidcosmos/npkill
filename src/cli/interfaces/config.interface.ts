export interface IConfig {
  profiles: string[];
  folderRoot: string;
  backgroundColor: string;
  warningColor: string;
  checkUpdates: boolean;
  deleteAll: boolean;
  sizeUnit: 'auto' | 'mb' | 'gb';
  maxSimultaneousSearch: number;
  showErrors: boolean;
  sortBy: string;
  targets: string[];
  exclude: string[];
  excludeHiddenDirectories: boolean;
  dryRun: boolean;
  yes: boolean;
  jsonStream: boolean;
  jsonSimple: boolean;
}
