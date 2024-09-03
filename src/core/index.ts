import { from, Observable } from 'rxjs';
import { catchError, filter, mergeMap } from 'rxjs/operators';
import { IFileService } from './interfaces/file-service.interface.js';
import { SearchStatus } from './interfaces/search-status.model.js';
import {
  FileService,
  FileWorkerService,
  LinuxFilesService,
  MacFilesService,
  WindowsFilesService,
} from './services/files/index.js';
import { LoggerService } from './services/logger.service.js';
import { StreamService } from './services/stream.service.js';
import { ResultsService } from '../cli/services/index.js';

export interface FindFolderOptions {
  path: string;
  target: string;
  exclude?: string[];
}

interface Services {
  logger: LoggerService;
  searchStatus: SearchStatus;
  fileService: FileService;
  fileWorkerService: FileWorkerService;
  streamService: StreamService;
  resultsService: ResultsService;
}

const OSServiceMap: Record<
  string,
  new (
    streamService: StreamService,
    fileWorkerService: FileWorkerService,
  ) => IFileService
> = {
  linux: LinuxFilesService,
  win32: WindowsFilesService,
  darwin: MacFilesService,
};

function splitData(data: string, separator = '\n'): string[] {
  if (data === '') {
    return [];
  }
  return data.split(separator);
}

function createDefaultServices(): Services {
  const logger = new LoggerService();
  const searchStatus = new SearchStatus();
  const fileWorkerService = new FileWorkerService(logger, searchStatus);
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
    logger,
    searchStatus,
    fileService,
    fileWorkerService,
    streamService,
    resultsService,
  };
}

export class Npkill {
  private readonly services: Services;

  constructor(customServices?: Partial<Services>) {
    const defaultServices = createDefaultServices();
    this.services = { ...defaultServices, ...customServices };
  }

  findFolders(options: FindFolderOptions): Observable<string> {
    const { fileService } = this.services;

    return fileService.listDir(options).pipe(
      catchError((_error, caught) => {
        return caught;
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
