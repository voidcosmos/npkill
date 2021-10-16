export interface IFolder {
  path: string;
  size: number;
  isDangerous: boolean;
  status: 'live' | 'deleting' | 'error-deleting' | 'deleted' | 'trashed';
}

/* interface IFolderStatus {
  [key: string]: 'live' | 'deleting' | 'error-deleting' | 'deleted';
} */
