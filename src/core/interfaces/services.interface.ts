import { FileService, FileWorkerService } from '@core/services/files/index.js';
import { LoggerService } from '@core/services/logger.service.js';
import { StreamService } from '@core/services/stream.service.js';
import { ResultsService } from '../../cli/services/index.js';
import { ScanStatus } from './search-status.model.js';

export interface Services {
  logger: LoggerService;
  searchStatus: ScanStatus;
  fileService: FileService;
  fileWorkerService: FileWorkerService;
  streamService: StreamService;
  resultsService: ResultsService;
}
