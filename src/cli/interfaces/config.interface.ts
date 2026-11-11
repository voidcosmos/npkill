import { TargetDefinition } from '../../core/interfaces/target.interface.js';

export interface IConfig {
  profiles: string[];
  folderRoot: string;
  deleteAll: boolean;
  sizeUnit: 'auto' | 'mb' | 'gb';
  maxSimultaneousSearch: number;
  showErrors: boolean;
  sortBy: string;
  targets: TargetDefinition[];
  exclude: string[];
  excludeSensitiveResults: boolean;
  disableDefaultIgnore: boolean;
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
