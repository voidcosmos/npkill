import path from 'path';
import os from 'os';
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

  abstract deleteDir(path: string): Promise<boolean>;

  listDir(path: string, params: ScanOptions): Observable<string> {
    const stream$ = new Subject<string>();
    this.fileWorkerService.startScan(stream$, { ...params, rootPath: path });
    return stream$;
  }

  getFolderSize(path: string): Observable<number> {
    const stream$ = new Subject<number>();
    this.fileWorkerService.getFolderSize(stream$, path);
    return stream$.pipe(map((data) => data));
  }

  stopScan(): void {
    this.fileWorkerService.stopScan();
  }

  /** Used for dry-run or testing. */
  async fakeDeleteDir(): Promise<boolean> {
    const randomDelay = Math.floor(Math.random() * 4000 + 200);
    await new Promise((resolve) => setTimeout(resolve, randomDelay));
    return true;
  }

  isValidRootFolder(path: string): IsValidRootFolderResult {
    let stat: Stats;
    try {
      stat = statSync(path);
    } catch {
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
    } catch {
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
   * application-specific data or configurations that should not be tampered with. Deleting directories
   * from these locations could potentially disrupt the normal operation of these applications.
   */
  isDangerous(originalPath: string): RiskAnalysis {
    const isUnc =
      originalPath.startsWith('\\\\') || originalPath.startsWith('//');
    const absolutePath = isUnc
      ? originalPath
      : path.isAbsolute(originalPath)
        ? originalPath
        : path.resolve(process.cwd(), originalPath);
    const normalizedPath = absolutePath.replace(/\\/g, '/').toLowerCase();
    const normalizedOriginal = originalPath.replace(/\\/g, '/').toLowerCase();

    const home =
      process.env.HOME ?? process.env.USERPROFILE ?? os.homedir() ?? '';
    let isInHome = false;
    let normalizedHome = '';

    if (home !== '') {
      normalizedHome = path.resolve(home).replace(/\\/g, '/').toLowerCase();
      isInHome =
        normalizedPath === normalizedHome ||
        normalizedPath.startsWith(normalizedHome + '/');
    }

    if (isInHome) {
      // Relative path inside HOME (without the HOME prefix)
      let rel = normalizedPath.slice(normalizedHome.length);
      if (rel.startsWith('/')) rel = rel.slice(1);

      // Special sensitive locations inside HOME
      if (rel === '.config' || rel.startsWith('.config/')) {
        return {
          isSensitive: true,
          reason: 'Contains user configuration data (~/.config)',
        };
      }
      if (rel === '.local/share' || rel.startsWith('.local/share/')) {
        return {
          isSensitive: true,
          reason: 'User data folder (~/.local/share)',
        };
      }

      // ~/.cache is safe to delete but system-wide, mark as sensitive
      if (rel === '.cache' || rel.startsWith('.cache/')) {
        return {
          isSensitive: true,
          reason: 'System-wide cache directory (~/.cache)',
        };
      }

      // Whitelisted hidden top-level folders inside HOME
      if (/^\.(npm|pnpm)(\/|$)/.test(rel)) {
        return { isSensitive: false };
      }

      // Only consider TOP-LEVEL hidden entries inside HOME as sensitive
      const topLevel = rel.split('/')[0] ?? '';
      if (
        topLevel.startsWith('.') &&
        topLevel !== '.' &&
        topLevel !== '..' &&
        !['.npm', '.pnpm'].includes(topLevel)
      ) {
        return { isSensitive: true, reason: 'Contains unsafe hidden folder' };
      }
    }

    // macOs
    if (/\/applications\/[^/]+\.app\//.test(normalizedPath)) {
      return { isSensitive: true, reason: 'Inside macOS .app package' };
    }

    // Windows UNC network paths (e.g., \\server\\share -> //server/share)
    if (normalizedOriginal.startsWith('//')) {
      if (/\/\.[^/]+(\/|$)/.test(normalizedOriginal)) {
        return { isSensitive: true, reason: 'Hidden path in network share' };
      }
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
    const ignoredFolders = ['node_modules', '.git', 'coverage', 'dist'];

    let files: IFileStat[] = [];

    try {
      const items = await readdir(dirname, { withFileTypes: true });

      for (const item of items) {
        if (item.isDirectory()) {
          const itemNameLowerCase = item.name.toLowerCase();
          if (ignoredFolders.includes(itemNameLowerCase)) {
            continue;
          }
          files = [
            ...files,
            ...(await this.getFileStatsInDir(`${dirname}/${item.name}`).catch(
              () => [],
            )),
          ];
        } else {
          try {
            const path = `${dirname}/${item.name}`;
            const fileStat = await stat(path);

            files.push({ path, modificationTime: fileStat.mtimeMs / 1000 });
          } catch {
            // Skip files that can't be accessed (e.g., permission denied, broken symlinks)
            continue;
          }
        }
      }
    } catch {
      // If we can't read the directory (e.j., permission denied), return empty array.
      return [];
    }

    return files;
  }
}
