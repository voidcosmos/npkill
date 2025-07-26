export type SizeUnit = 'bytes' | 'kb' | 'mb' | 'gb';

export interface ScanFoundFolder {
  path: string;
}

export interface ScanOptions {
  target: string;
  exclude?: string[];
  sortBy?: 'path' | 'size' | 'last-mod';
  // maxConcurrentScans?: number; // Need to implement this.
}

export interface GetSizeOptions {
  unit?: SizeUnit; // Default: bytes
}

export interface GetSizeResult {
  size: number; // Default: bytes
  unit: SizeUnit;
}

export interface GetNewestFileOptions {}

export interface GetNewestFileResult {
  path: string;
  name: string;
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
