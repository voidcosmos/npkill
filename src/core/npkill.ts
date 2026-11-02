import { resolve } from 'path';
import { FileWorkerService } from './services/files/index.js';
import { defer, from, Observable, of } from 'rxjs';
import { catchError, map, take, tap } from 'rxjs/operators';
import { ScanStatus } from './interfaces/search-status.model.js';
import _dirname from '../dirname.js';
import { LoggerService } from './services/logger.service.js';
import { StreamService } from './services/stream.service.js';
import { ProfilesService } from './services/profiles.service.js';
import { Services } from './interfaces/services.interface.js';
import {
  ScanFoundTarget,
  GetNewestFileResult,
  GetSizeResult,
  ScanOptions,
  DeleteOptions,
  DeleteResult,
} from './interfaces/target.interface.js';
import { OSServiceMap } from '../constants/os-service-map.constants.js';
import {
  IsValidRootFolderResult,
  NpkillInterface,
} from './interfaces/npkill.interface.js';

import { LogEntry } from './interfaces/logger-service.interface.js';
import { getFileContent } from '../utils/get-file-content.js';

/**
 * Main npkill class that implements the core directory scanning and cleanup functionality.
 * Provides methods for recursive directory scanning, size calculation, file analysis,
 * and safe deletion operations.
 */
export class Npkill implements NpkillInterface {
  private readonly services: Services;

  /** @internal */
  constructor(customServices?: Partial<Services>) {
    const defaultServices = createDefaultServices(
      customServices?.searchStatus,
      customServices?.logger,
      customServices?.fileWorkerService,
    );
    this.services = { ...defaultServices, ...customServices };
    this.logger.info(process.argv.join(' '));
    this.logger.info(`Npkill started! v${this.getVersion()}`);
  }

  private searchDuration = 0;

  startScan$(
    rootPath: string,
    options: ScanOptions,
  ): Observable<ScanFoundTarget> {
    const { fileService } = this.services;

    return defer(() => {
      assertValidScanOptions(options);
      const absoluteRootPath = resolve(rootPath);
      assertValidRootFolder(
        absoluteRootPath,
        fileService.isValidRootFolder(absoluteRootPath),
      );
      this.logger.info(`Scan started in ${absoluteRootPath}`);
      const startTime = Date.now();

      return fileService.listDir(absoluteRootPath, options).pipe(
        map((path) => {
          if (
            options.performRiskAnalysis !== undefined &&
            !options.performRiskAnalysis
          ) {
            return { path };
          }
          const riskAnalysis = fileService.isDangerous(path);
          return {
            path,
            riskAnalysis,
          };
        }),
        tap((target) =>
          this.logger.info(`Target found: ${String(target.path)}`),
        ),
        tap({
          complete: () => {
            this.searchDuration = (Date.now() - startTime) / 1000;
            this.logger.info(`Search completed after ${this.searchDuration}s`);
          },
        }),
      );
    });
  }

  getSize$(path: string): Observable<GetSizeResult> {
    const { fileService } = this.services;

    return defer(() => {
      this.logger.info(`Calculating size for ${String(path)}`);
      return fileService.getSize(path);
    }).pipe(
      take(1),
      map((size) => ({ size })),
      tap(({ size }) => this.logger.info(`Size of ${path}: ${size} bytes`)),
    );
  }

  getNewestFile$(path: string): Observable<GetNewestFileResult | null> {
    const { fileService } = this.services;

    return defer(() => {
      this.logger.info(`Calculating last mod. of ${path}`);
      return from(fileService.getRecentModificationInDir(path));
    }).pipe(
      tap((result) => {
        if (!result) {
          return;
        }
        this.logger.info(`Last mod. of ${path}: ${result.timestamp}`);
      }),
    );
  }

  delete$(path: string, options?: DeleteOptions): Observable<DeleteResult> {
    const { fileService } = this.services;

    return defer(() => {
      if (typeof path !== 'string' || path === '') {
        throw new Error('delete$ needs the path to delete.');
      }

      const dryRun = options?.dryRun === true;
      this.logger.info(`Deleting ${path} ${dryRun ? '(dry run)' : ''}...`);
      if (dryRun) {
        return of({ path, success: true });
      }

      return from(fileService.delete(path)).pipe(
        map((deleted): DeleteResult =>
          deleted
            ? { path, success: true }
            : toFailedDeleteResult(path, new Error(`Could not delete ${path}`)),
        ),
        catchError((error: unknown) => of(toFailedDeleteResult(path, error))),
      );
    }).pipe(
      tap((result) => {
        if (result.success) {
          this.logger.info(`Deleted ${path}: true`);
          return;
        }
        this.logger.error(
          `Failed to delete ${path}: ${String(result.error?.message)}`,
        );
      }),
    );
  }

  getLogs$(): Observable<LogEntry> {
    return this.services.logger.getEntries$();
  }

  stopScan(): void {
    this.logger.info('Stopping scan...');
    this.services.fileService.stopScan();
  }

  isValidRootFolder(path: string): IsValidRootFolderResult {
    return this.services.fileService.isValidRootFolder(path);
  }

  getVersion(): string {
    const packageJson = _dirname + '/../package.json';

    const packageData = JSON.parse(getFileContent(packageJson));
    return packageData.version;
  }

  private get logger(): LoggerService {
    return this.services.logger;
  }
}

function createDefaultServices(
  searchStatus?: ScanStatus,
  logger?: LoggerService,
  fileWorkerService?: FileWorkerService,
): Services {
  const actualLogger = logger || new LoggerService();
  const actualSearchStatus = searchStatus || new ScanStatus();
  const actualFileWorkerService =
    fileWorkerService ||
    new FileWorkerService(actualLogger, actualSearchStatus);
  const streamService = new StreamService();
  const profilesService = new ProfilesService();

  const OSService = OSServiceMap[process.platform];
  if (typeof OSService === 'undefined') {
    throw new Error(
      `Unsupported platform: ${process.platform}. Cannot load OS service.`,
    );
  }
  const fileService = new OSService(streamService, actualFileWorkerService);

  return {
    logger: actualLogger,
    searchStatus: actualSearchStatus,
    fileService,
    fileWorkerService: actualFileWorkerService,
    streamService,
    profilesService,
  };
}

function assertValidScanOptions(options: ScanOptions): void {
  const targets: unknown = options?.targets;
  const isValid =
    Array.isArray(targets) &&
    targets.length > 0 &&
    targets.every((target) => typeof target === 'string' && target !== '');

  if (!isValid) {
    throw new Error(
      'ScanOptions.targets must be a non-empty array of directory names.',
    );
  }
}

function assertValidRootFolder(
  rootPath: string,
  validation: IsValidRootFolderResult,
): void {
  if (!validation.isValid) {
    throw new Error(`Cannot scan ${rootPath}. ${validation.invalidReason}`);
  }
}

function toFailedDeleteResult(path: string, error: unknown): DeleteResult {
  const { message, code } = (error ?? {}) as {
    message?: unknown;
    code?: unknown;
  };

  return {
    path,
    success: false,
    error: {
      message: typeof message === 'string' ? message : String(error),
      ...(typeof code === 'string' ? { code } : {}),
    },
  };
}
