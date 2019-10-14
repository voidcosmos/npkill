export interface IFolder {
  path: string;
  size: number;
  status: 'live' | 'deleting' | 'error-deleting' | 'deleted';
}

/* interface IFolderStatus {
  [key: string]: 'live' | 'deleting' | 'error-deleting' | 'deleted';
} */
