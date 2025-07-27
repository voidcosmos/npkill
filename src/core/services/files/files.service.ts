import path from 'path';
import {
  ScanOptions,
  IFileService,
  IFileStat,
  GetNewestFileResult,
  RiskAnalysis,
} from '@core/index.js';
import fs, { accessSync, Stats, statSync } from 'fs';
import { readdir, stat } from 'fs/promises';
import { map, Observable, Subject } from 'rxjs';
import { FileWorkerService } from './files.worker.service.js';
import { IsValidRootFolderResult } from '@core/interfaces/npkill.interface.js';

export abstract class FileService implements IFileService {
  public fileWorkerService: FileWorkerService;

  constructor(fileWorkerService: FileWorkerService) {
    this.fileWorkerService = fileWorkerService;
  }

  abstract listDir(path: string, params: ScanOptions): Observable<string>;
  abstract deleteDir(path: string): Promise<boolean>;

  getFolderSize(path: string): Observable<number> {
    const stream$ = new Subject<number>();
    this.fileWorkerService.getFolderSize(stream$, path);
    return stream$.pipe(map((data) => data));
  }

  stopScan(): void {
    this.fileWorkerService.stopScan();
  }

  /** Used for dry-run or testing. */
  async fakeDeleteDir(_path: string): Promise<boolean> {
    const randomDelay = Math.floor(Math.random() * 4000 + 200);
    await new Promise((resolve) => setTimeout(resolve, randomDelay));
    return true;
  }

  isValidRootFolder(path: string): IsValidRootFolderResult {
    let stat: Stats;
    try {
      stat = statSync(path);
    } catch (error) {
      return { isValid: false, invalidReason: 'The path does not exist.' };
    }

    if (!stat.isDirectory()) {
      return {
        isValid: false,
        invalidReason: 'The path must point to a directory.',
      };
    }

    try {
      accessSync(path, fs.constants.R_OK);
    } catch (error) {
      return {
        isValid: false,
        invalidReason: 'Cannot read the specified path.',
      };
    }

    return { isValid: true };
  }

  /**
   * > Why dangerous?
   * It is probable that if the node_module is included in some hidden directory, it is
   * required by some application like "spotify", "vscode" or "Discord" and deleting it
   * would imply breaking the application (until the dependencies are reinstalled).
   *
   * In the case of macOS applications and Windows AppData directory, these locations often contain
   * application-specific data or configurations that should not be tampered with. Deleting node_modules
   * from these locations could potentially disrupt the normal operation of these applications.
   */
  isDangerous(originalPath: string): RiskAnalysis {
    const absolutePath = path.resolve(originalPath);
    const normalizedPath = absolutePath.replace(/\\/g, '/').toLowerCase();

    const home = process.env.HOME ?? process.env.USERPROFILE ?? '';
    let isInHome = false;

    if (home !== '') {
      const normalizedHome = path
        .resolve(home)
        .replace(/\\/g, '/')
        .toLowerCase();
      isInHome = normalizedPath.startsWith(normalizedHome);
    }

    if (isInHome) {
      if (/\/\.config(\/|$)/.test(normalizedPath)) {
        return {
          isSensitive: true,
          reason: 'Contains user configuration data (~/.config)',
        };
      }
      if (/\/\.local\/share(\/|$)/.test(normalizedPath)) {
        return {
          isSensitive: true,
          reason: 'User data folder (~/.local/share)',
        };
      }
      if (/\/\.(cache|npm|pnpm)(\/|$)/.test(normalizedPath))
        return { isSensitive: false };
    }

    // macOs
    if (/\/applications\/[^/]+\.app\//.test(normalizedPath)) {
      return { isSensitive: true, reason: 'Inside macOS .app package' };
    }

    // Windows
    if (normalizedPath.includes('/appdata/roaming')) {
      return {
        isSensitive: true,
        reason: 'Inside Windows AppData Roaming folder',
      };
    }
    if (normalizedPath.includes('/appdata/local')) {
      if (/\/\.(cache|npm|pnpm)(\/|$)/.test(normalizedPath)) {
        return { isSensitive: false };
      }
      return {
        isSensitive: true,
        reason: 'Inside Windows AppData Local folder',
      };
    }
    if (/program files( \(x86\))?\//.test(normalizedPath)) {
      return { isSensitive: true, reason: 'Inside Program Files folder' };
    }

    const segments = normalizedPath.split('/');
    const hasUnsafeHiddenFolder = segments.some(
      (segment) =>
        segment.startsWith('.') &&
        segment !== '.' &&
        segment !== '..' &&
        !['.cache', '.npm', '.pnpm'].includes(segment),
    );

    if (hasUnsafeHiddenFolder) {
      return { isSensitive: true, reason: 'Contains unsafe hidden folder' };
    }

    return { isSensitive: false };
  }

  async getRecentModificationInDir(
    path: string,
  ): Promise<GetNewestFileResult | null> {
    const files = await this.getFileStatsInDir(path);
    const sorted = files.sort(
      (a, b) => b.modificationTime - a.modificationTime,
    );
    const newestFile = sorted.length > 0 ? sorted[0] : null;
    if (!newestFile) {
      return null;
    }

    return {
      timestamp: newestFile.modificationTime,
      name: newestFile.path.split('/').pop() || '',
      path: newestFile.path,
    };
  }

  async getFileStatsInDir(dirname: string): Promise<IFileStat[]> {
    let files: IFileStat[] = [];
    const items = await readdir(dirname, { withFileTypes: true });

    for (const item of items) {
      if (item.isDirectory()) {
        if (item.name === 'node_modules') {
          continue;
        }
        files = [
          ...files,
          ...(await this.getFileStatsInDir(`${dirname}/${item.name}`).catch(
            () => [],
          )),
        ];
      } else {
        const path = `${dirname}/${item.name}`;
        const fileStat = await stat(path);

        files.push({ path, modificationTime: fileStat.mtimeMs / 1000 });
      }
    }

    return files;
  }
}
