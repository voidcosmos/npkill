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
import { PLATFORMS } from '@core/constants/main.constants';

const isOSWindows = () => process.platform === PLATFORMS.WINDOWS;

const streamService: StreamService = new StreamService();

const fileService: IFileService = isOSWindows()
  ? new WindowsFilesService(streamService)
  : new LinuxFilesService(streamService);

export const controller = new Controller(
  fileService,
  new SpinnerService(),
  new ConsoleService(),
  new UpdateService(new HttpsService()),
  new ResultsService(),
);
