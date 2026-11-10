import { FormattedSize } from '../../utils/unit-conversions.js';
import { ScanResult } from '../../core/interfaces/index.js';

export interface CliScanFoundTarget extends ScanResult {
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
