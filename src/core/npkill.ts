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
} from './interfaces/folder.interface.js';
import { OSServiceMap } from '../constants/os-service-map.constants.js';
import {
  DeleteOptions,
  DeleteResult,
  NpkillInterface,
} from './interfaces/npkill.interface.js';

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

  startScan$(options: ScanOptions): Observable<ScanFoundFolder> {
    const { fileService } = this.services;
    this.logger.info(`Scan started in ${options.rootPath}`);
    const startTime = Date.now();

    return fileService.listDir(options).pipe(
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
    options: GetFolderSizeOptions,
  ): Observable<GetFolderSizeResult> {
    const { fileService } = this.services;
    this.logger.info(`Calculating folder size for ${String(options.path)}`);
    return fileService.getFolderSize(options.path).pipe(
      take(1),
      map((size) => ({ size })),
      tap(({ size }) =>
        this.logger.info(`Size of ${options.path}: ${size} bytes`),
      ),
    );
  }

  getFolderSize(options: GetFolderSizeOptions): Promise<GetFolderSizeResult> {
    return firstValueFrom(this.getFolderSize$(options));
  }

  getFolderLastModification$(
    options: GetFolderLastModificationOptions,
  ): Observable<GetFolderLastModificationResult> {
    return from(this.getFolderLastModification(options));
  }

  async getFolderLastModification(
    options: GetFolderLastModificationOptions,
  ): Promise<GetFolderLastModificationResult> {
    const { fileService } = this.services;
    this.logger.info(`Calculating last mod. of ${options.path}`);
    const result = await fileService.getRecentModificationInDir(options.path);
    this.logger.info(`Last mod. of ${options.path}: ${result}`);
    return { timestamp: result };
  }

  deleteFolder$(folder: DeleteOptions): Observable<DeleteResult> {
    return from(this.deleteFolder(folder));
  }

  async deleteFolder(folder: DeleteOptions): Promise<DeleteResult> {
    const { fileService } = this.services;
    this.logger.info(
      `Deleting ${String(folder.path)} ${folder.dryRun ? '(dry run)' : ''}...`,
    );
    const result = folder.dryRun
      ? await fileService.fakeDeleteDir(folder.path)
      : await fileService.deleteDir(folder.path);
    if (!result) {
      this.logger.error(`Failed to delete ${String(folder.path)}`);
      return { path: folder.path, success: false };
    }

    this.logger.info(`Deleted ${String(folder.path)}: ${result}`);
    return {
      path: folder.path,
      success: result,
      // TODO: Modify services to return the error message and
      // include here.
    };
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
