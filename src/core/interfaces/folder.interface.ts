export interface ScanFoundFolder {
  path: string;
}

export interface ScanOptions {
  rootPath: string;
  target: string;
  exclude?: string[];
  sortBy?: 'path' | 'size' | 'last-mod';
  maxConcurrentScans?: number;
}

export interface GetFolderSizeOptions {
  path: string;
}

export interface GetFolderSizeResult {
  size: number; // bytes
}

export interface GetFolderLastModificationOptions {
  path: string;
}

export interface GetFolderLastModificationResult {
  timestamp: number; // epoch timestamp
}
