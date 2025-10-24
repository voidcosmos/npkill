import { FileService, FileWorkerService } from '@core/services/files/index.js';
import { LoggerService } from '@core/services/logger.service.js';
import { StreamService } from '@core/services/stream.service.js';
import { ProfilesService } from '@core/services/profiles.service.js';
import { ResultsService } from '../../cli/services/index.js';
import { ScanStatus } from './search-status.model.js';

/**
 * Collection of all core services used by npkill.
 * Provides centralized access to logging, file operations, streaming, and result management.
 */
export interface Services {
  /** Service for logging messages and managing log output. */
  logger: LoggerService;
  /** Status tracker for ongoing scan operations. */
  searchStatus: ScanStatus;
  /** Service for file system operations and directory management. */
  fileService: FileService;
  /** Worker service for background file processing tasks. */
  fileWorkerService: FileWorkerService;
  /** Service for managing reactive streams and data flow. */
  streamService: StreamService;
  /** Service for managing and formatting scan results. */
  resultsService: ResultsService;
  /** Service for managing profiles. */
  profilesService: ProfilesService;
}
