import { FileWorkerService } from './services/files/index.js';
import { firstValueFrom, from, Observable } from 'rxjs';
import { catchError, filter, map, mergeMap, take, tap } from 'rxjs/operators';
import { IFileService } from './interfaces/file-service.interface.js';
import { ScanStatus } from './interfaces/search-status.model.js';
import _dirname from '../dirname.js';
import { LoggerService } from './services/logger.service.js';
import { StreamService } from './services/stream.service.js';
import { Services } from './interfaces/services.interface.js';
import {
  ScanFoundFolder,
  GetFolderLastModificationOptions,
  GetFolderLastModificationResult,
  GetFolderSizeOptions,
  GetFolderSizeResult,
  ScanOptions,
  DeleteOptions,
  DeleteResult,
  SizeUnit,
} from './interfaces/folder.interface.js';
import { OSServiceMap } from '../constants/os-service-map.constants.js';
import { NpkillInterface } from './interfaces/npkill.interface.js';

import { LogEntry } from './services/logger.service.js';

export class Npkill implements NpkillInterface {
  private readonly services: Services;

  constructor(customServices?: Partial<Services>) {
    const defaultServices = createDefaultServices(
      customServices?.searchStatus,
      customServices?.logger,
    );
    this.services = { ...defaultServices, ...customServices };
    this.logger.info(process.argv.join(' '));
    this.logger.info(`Npkill started! v${this.getVersion()}`);
  }

  private searchDuration = 0;

  startScan$(
    rootPath: string,
    options: ScanOptions,
  ): Observable<ScanFoundFolder> {
    const { fileService } = this.services;
    this.logger.info(`Scan started in ${rootPath}`);
    const startTime = Date.now();

    return fileService.listDir(rootPath, options).pipe(
      catchError((_error, caught) => {
        throw new Error('Error while listing directories');
      }),
      mergeMap((dataFolder) => from(splitData(dataFolder))),
      filter((path) => path !== ''),
      map((path) => ({ path })),
      tap((nodeFolder) =>
        this.logger.info(`Folder found: ${String(nodeFolder.path)}`),
      ),
      tap({
        complete: () => {
          this.searchDuration = (Date.now() - startTime) / 1000;
          this.logger.info(`Search completed after ${this.searchDuration}s`);
        },
      }),
    );
  }

  getFolderSize$(
    path: string,
    options: GetFolderSizeOptions,
  ): Observable<GetFolderSizeResult> {
    const { fileService } = this.services;
    this.logger.info(`Calculating folder size for ${String(path)}`);
    return fileService.getFolderSize(path).pipe(
      take(1),
      map((size) => ({ size, unit: 'bytes' as SizeUnit })),
      tap(({ size }) => this.logger.info(`Size of ${path}: ${size} bytes`)),
    );
  }

  getFolderLastModification$(
    path: string,
    // options: GetFolderLastModificationOptions,
  ): Observable<GetFolderLastModificationResult> {
    const { fileService } = this.services;
    this.logger.info(`Calculating last mod. of ${path}`);
    return from(fileService.getRecentModificationInDir(path)).pipe(
      map((timestamp) => ({ timestamp })),
      tap(({ timestamp }) =>
        this.logger.info(`Last mod. of ${path}: ${timestamp}`),
      ),
    );
  }

  deleteFolder$(
    path: string,
    options: DeleteOptions,
  ): Observable<DeleteResult> {
    const { fileService } = this.services;
    this.logger.info(
      `Deleting ${String(path)} ${options.dryRun ? '(dry run)' : ''}...`,
    );
    const deleteOperation = options.dryRun
      ? from(fileService.fakeDeleteDir(path))
      : from(fileService.deleteDir(path));

    return deleteOperation.pipe(
      map((result) => {
        if (!result) {
          this.logger.error(`Failed to delete ${String(path)}`);
          return { path, success: false };
        }
        this.logger.info(`Deleted ${String(path)}: ${result}`);
        return {
          path,
          success: result,
        };
      }),
    );
  }

  getFileService(): IFileService {
    return this.services.fileService;
  }

  getLogs$(): Observable<LogEntry[]> {
    return this.services.logger.getLog$();
  }

  private getVersion(): string {
    const packageJson = _dirname + '/../package.json';

    const packageData = JSON.parse(
      this.services.fileService.getFileContent(packageJson),
    );
    return packageData.version;
  }

  get logger(): LoggerService {
    return this.services.logger;
  }
}

function createDefaultServices(
  searchStatus?: ScanStatus,
  logger?: LoggerService,
): Services {
  const actualLogger = logger || new LoggerService();
  const actualSearchStatus = searchStatus || new ScanStatus();
  const fileWorkerService = new FileWorkerService(
    actualLogger,
    actualSearchStatus,
  );
  const streamService = new StreamService();
  const resultsService = null as any;

  const OSService = OSServiceMap[process.platform];
  if (typeof OSService === 'undefined') {
    throw new Error(
      `Unsupported platform: ${process.platform}. Cannot load OS service.`,
    );
  }
  const fileService = new OSService(streamService, fileWorkerService);

  return {
    logger: actualLogger,
    searchStatus: actualSearchStatus,
    fileService,
    fileWorkerService,
    streamService,
    resultsService,
  };
}

function splitData(data: string, separator = '\n'): string[] {
  if (data === '') {
    return [];
  }
  return data.split(separator);
}
