import path, { basename, join } from 'path';
import os from 'os';
import {
  ScanOptions,
  IFileService,
  IFileStat,
  GetNewestFileResult,
  RiskAnalysis,
} from '../../index.js';
import fs, { accessSync, Stats, statSync } from 'fs';
import { access, lstat, opendir, readdir } from 'fs/promises';
import { map, Observable, Subject } from 'rxjs';
import { FileWorkerService } from './files.worker.service.js';
import { IsValidRootFolderResult } from '../../interfaces/npkill.interface.js';

export abstract class FileService implements IFileService {
  public fileWorkerService: FileWorkerService;

  constructor(fileWorkerService: FileWorkerService) {
    this.fileWorkerService = fileWorkerService;
  }

  abstract delete(path: string): Promise<boolean>;

  listDir(path: string, params: ScanOptions): Observable<string> {
    return new Observable<string>((subscriber) => {
      const stream$ = new Subject<string>();
      const subscription = stream$.subscribe(subscriber);
      this.fileWorkerService.startScan(stream$, {
        rootPath: path,
        targets: params.targets,
        exclude: params.exclude,
        useDefaultIgnore: params.useDefaultIgnore,
      });

      return () => {
        subscription.unsubscribe();
        this.fileWorkerService.cancelScan(stream$);
      };
    });
  }

  getSize(path: string): Observable<number> {
    const stream$ = new Subject<number>();
    this.fileWorkerService.getSize(stream$, path);
    return stream$.pipe(map((data) => data));
  }

  stopScan(): void {
    this.fileWorkerService.stopScan();
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
      accessSync(path, fs.constants.R_OK | fs.constants.X_OK);
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

    const normalizePath = (p: string): string => {
      let normalized = p.replace(/\\/g, '/').toLowerCase();
      if (/^[a-z]:\//.test(normalized)) {
        normalized = normalized.substring(2);
      }
      return normalized;
    };

    const withoutTrailingSlashes = (p: string): string =>
      p.replace(/(.)\/+$/, '$1');

    const normalizedPath = normalizePath(absolutePath);
    const normalizedOriginal = normalizePath(originalPath);

    const home =
      process.env.HOME ?? process.env.USERPROFILE ?? os.homedir() ?? '';
    let isInHome = false;
    let normalizedHome = '';

    if (home !== '') {
      // Normalize the home path. If it's already absolute, just normalize separators.
      // Only use path.resolve() if it's a relative path to avoid cross-platform issues.
      const homeAbsolute = path.isAbsolute(home) ? home : path.resolve(home);
      normalizedHome = withoutTrailingSlashes(normalizePath(homeAbsolute));
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

      if (rel === 'library' || rel.startsWith('library/')) {
        return {
          isSensitive: true,
          reason: 'macOS user library (~/Library)',
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
    await assertReadableDirectory(path);
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
      name: basename(newestFile.path),
      path: newestFile.path,
    };
  }

  async getFileStatsInDir(dirname: string): Promise<IFileStat[]> {
    const ignoredFolders = ['node_modules', '.git', 'coverage', 'dist'];

    let files: IFileStat[] = [];

    try {
      const items = await readdir(dirname, { withFileTypes: true });

      for (const item of items) {
        if (item.isSymbolicLink()) {
          continue;
        }

        if (item.isDirectory()) {
          const itemNameLowerCase = item.name.toLowerCase();
          if (ignoredFolders.includes(itemNameLowerCase)) {
            continue;
          }
          files = [
            ...files,
            ...(await this.getFileStatsInDir(join(dirname, item.name)).catch(
              () => [],
            )),
          ];
        } else {
          try {
            const path = join(dirname, item.name);
            const fileStat = await lstat(path);

            files.push({ path, modificationTime: fileStat.mtime.getTime() });
          } catch {
            // Skip files that can't be accessed (e.g., permission denied)
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

async function assertReadableDirectory(path: string): Promise<void> {
  const dir = await opendir(path);
  await dir.close();
  await access(path, fs.constants.R_OK | fs.constants.X_OK);
}
