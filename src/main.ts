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

const getOS = () => process.platform;

const OSService = {
  linux: LinuxFilesService,
  win32: WindowsFilesService,
  darwin: MacFilesService,
};

const fileWorkerService = new FileWorkerService();
const streamService: StreamService = new StreamService();

const fileService: IFileService = new OSService[getOS()](
  streamService,
  fileWorkerService,
);

export const controller = new Controller(
  fileService,
  new SpinnerService(),
  new ConsoleService(),
  new UpdateService(new HttpsService()),
  new ResultsService(),
  new UiService(),
);

export default () => controller.init();
