import { FoundFolder } from '@core/interfaces';

export interface ScanFolderResult extends FoundFolder {
  size: number;
  modificationTime: number;
  status: 'live' | 'deleting' | 'error-deleting' | 'deleted';
}

export interface IStats {
  spaceReleased: string;
  totalSpace: string;
}
