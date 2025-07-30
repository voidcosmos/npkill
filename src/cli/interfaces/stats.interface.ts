import { ScanFoundFolder } from '../../core/interfaces/index.js';

export interface CliScanFoundFolder extends ScanFoundFolder {
  size: number;
  modificationTime: number;
  status: 'live' | 'deleting' | 'error-deleting' | 'deleted';
}

export interface IStats {
  spaceReleased: string;
  totalSpace: string;
}
