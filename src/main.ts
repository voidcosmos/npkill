import {
  ConsoleService,
  HttpsService,
  LinuxFilesService,
  ResultsService,
  SpinnerService,
  StreamService,
  UpdateService,
  WindowsFilesService,
} from '@core/services';

import { Controller } from './controller';
import { IFileService } from '@core/interfaces/file-service.interface';
import { MacFilesService } from './services/mac-files.service';

const getOS = () => process.platform;

const OSService = {
  linux: () => new LinuxFilesService(streamService),
  win32: () => new WindowsFilesService(streamService),
  darwin: () => new MacFilesService(streamService),
};

const streamService: StreamService = new StreamService();

const fileService: IFileService = OSService[getOS()]();

export const controller = new Controller(
  fileService,
  new SpinnerService(),
  new ConsoleService(),
  new UpdateService(new HttpsService()),
  new ResultsService(),
);
