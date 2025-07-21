import { FileWorkerService } from './services/files/index.js';
import { from, Observable } from 'rxjs';
import { catchError, filter, mergeMap } from 'rxjs/operators';
import { IFileService } from './interfaces/file-service.interface.js';
import { SearchStatus } from './interfaces/search-status.model.js';

import { LoggerService } from './services/logger.service.js';
import { StreamService } from './services/stream.service.js';
import { Services } from './interfaces/services.interface.js';
import { FindFolderOptions } from './interfaces/folder.interface.js';
import { OSServiceMap } from '../constants/os-service-map.constants.js';

export class Npkill {
  private readonly services: Services;

  constructor(customServices?: Partial<Services>) {
    const defaultServices = createDefaultServices(
      customServices?.searchStatus,
      customServices?.logger,
    );
    this.services = { ...defaultServices, ...customServices };
  }

  findFolders(options: FindFolderOptions): Observable<string> {
    const { fileService } = this.services;

    return fileService.listDir(options).pipe(
      catchError((_error, caught) => {
        throw new Error('Error while listing directories');
      }),
      mergeMap((dataFolder) => from(splitData(dataFolder))),
      filter((path) => path !== ''),
    );
  }

  getFolderStats(folderPath: string): Observable<number> {
    const { fileService } = this.services;
    return fileService.getFolderSize(folderPath);
  }

  async getRecentModification(folder: string): Promise<number> {
    const { fileService } = this.services;
    return fileService.getRecentModificationInDir(folder);
  }

  async deleteFolder(folder: string): Promise<boolean> {
    const { fileService } = this.services;
    return fileService.deleteDir(folder);
  }

  getFileService(): IFileService {
    return this.services.fileService;
  }
}

function createDefaultServices(
  searchStatus?: SearchStatus,
  logger?: LoggerService,
): Services {
  const actualLogger = logger || new LoggerService();
  const actualSearchStatus = searchStatus || new SearchStatus();
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
