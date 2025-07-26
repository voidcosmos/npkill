export interface ScanFoundFolder {
  path: string;
}

export interface ScanOptions {
  target: string;
  exclude?: string[];
  sortBy?: 'path' | 'size' | 'last-mod';
  // maxConcurrentScans?: number; // Need to implement this.
}

export interface GetFolderSizeOptions {
  unit?: 'bytes' | 'kb' | 'mb' | 'gb'; // Default: bytes
}

export interface GetFolderSizeResult {
  size: number; // Default: bytes
  unit: 'bytes' | 'kb' | 'mb' | 'gb';
}

export interface GetFolderLastModificationOptions {}

export interface GetFolderLastModificationResult {
  timestamp: number; // epoch timestamp
}

export interface DeleteOptions {
  dryRun?: boolean;
}

export interface DeleteResult {
  path: string;
  success: boolean;
  error?: {
    message: string;
    code?: string;
  };
}
