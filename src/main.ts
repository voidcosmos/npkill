import {
  ConsoleService,
  HttpsService,
  LinuxFilesService,
  MacFilesService,
  ResultsService,
  SpinnerService,
  StreamService,
  UpdateService,
  WindowsFilesService,
} from './services/index.js';

import { Controller } from './controller.js';
import { IFileService } from './interfaces/file-service.interface.js';
import { FileWorkerService } from './services/files/files.worker.service.js';
import { UiService } from './services/ui.service.js';
import { LoggerService } from './services/logger.service.js';
import { SearchState } from './models/search-state.model.js';

const getOS = () => process.platform;

const OSService = {
  linux: LinuxFilesService,
  win32: WindowsFilesService,
  darwin: MacFilesService,
};

const logger = new LoggerService();
const searchState = new SearchState();

const fileWorkerService = new FileWorkerService(searchState);
const streamService: StreamService = new StreamService();

const fileService: IFileService = new OSService[getOS()](
  streamService,
  fileWorkerService,
);

export const controller = new Controller(
  logger,
  searchState,
  fileService,
  new SpinnerService(),
  new ConsoleService(),
  new UpdateService(new HttpsService()),
  new ResultsService(),
  new UiService(),
);

export default () => controller.init();
