export interface IConfig {
  folderRoot: string;
  backgroundColor: string;
  warningColor: string;
  checkUpdates: boolean;
  deleteAll: boolean;
  folderSizeInGB: boolean;
  maxSimultaneousSearch: number;
  showErrors: boolean;
  sortBy: string;
  targetFolder: string;
  exclude: string[];
  excludeHiddenDirectories: boolean;
  dryRun: boolean;
  yes: boolean;
}
