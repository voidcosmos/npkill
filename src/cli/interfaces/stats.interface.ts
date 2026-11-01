import { FormattedSize } from 'src/utils/unit-conversions.js';
import { ScanFoundTarget } from '../../core/interfaces/index.js';

export interface CliScanFoundTarget extends ScanFoundTarget {
  size: number;
  modificationTime: number;
  status: 'live' | 'deleting' | 'error-deleting' | 'deleted';
}

export interface IResultTypeCount {
  type: string;
  count: number;
}

export interface IStats {
  spaceReleased: FormattedSize;
  totalSpace: FormattedSize;
  resultsTypesCount: IResultTypeCount[];
}
