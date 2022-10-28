export interface IFolder {
  id: number;
  path: string;
  size: number;
  modificationTime: number;
  isDangerous: boolean;
  status: 'live' | 'deleting' | 'error-deleting' | 'deleted';
}

/* interface IFolderStatus {
  [key: string]: 'live' | 'deleting' | 'error-deleting' | 'deleted';
} */
