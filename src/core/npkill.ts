import { FileWorkerService } from './services/files/index.js';
import { firstValueFrom, from, Observable } from 'rxjs';
import { catchError, filter, map, mergeMap } from 'rxjs/operators';
import { IFileService } from './interfaces/file-service.interface.js';
import { ScanStatus } from './interfaces/search-status.model.js';

import { LoggerService } from './services/logger.service.js';
import { StreamService } from './services/stream.service.js';
import { Services } from './interfaces/services.interface.js';
import {
  FoundFolder,
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

export class Npkill implements NpkillInterface {
  private readonly services: Services;

  constructor(customServices?: Partial<Services>) {
    const defaultServices = createDefaultServices(
      customServices?.searchStatus,
      customServices?.logger,
    );
    this.services = { ...defaultServices, ...customServices };
  }

  startScan$(options: ScanOptions): Observable<FoundFolder> {
    const { fileService } = this.services;

    return fileService.listDir(options).pipe(
      catchError((_error, caught) => {
        throw new Error('Error while listing directories');
      }),
      mergeMap((dataFolder) => from(splitData(dataFolder))),
      filter((path) => path !== ''),
      map((path) => ({ path })),
    );
  }

  getFolderSize(options: GetFolderSizeOptions): Promise<GetFolderSizeResult> {
    const { fileService } = this.services;
    return firstValueFrom(
      fileService.getFolderSize(options.path).pipe(map((size) => ({ size }))),
    );
  }

  async getFolderLastModification(
    options: GetFolderLastModificationOptions,
  ): Promise<GetFolderLastModificationResult> {
    const { fileService } = this.services;
    const result = await fileService.getRecentModificationInDir(options.path);
    return { timestamp: result };
  }

  async deleteFolder(folder: DeleteOptions): Promise<DeleteResult> {
    const { fileService } = this.services;
    const result = await fileService.deleteDir(folder.path);
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
