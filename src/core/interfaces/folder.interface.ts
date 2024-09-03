export interface Folder {
  path: string;
  size: number;
  modificationTime: number;
  isDangerous: boolean;
  status: 'live' | 'deleting' | 'error-deleting' | 'deleted';
}
