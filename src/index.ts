#!/usr/bin/env node

import {
  ConsoleService,
  HttpsService,
  LinuxFilesService,
  SpinnerService,
  StreamService,
  UpdateService,
  WindowsFilesService,
} from '@services/index';

import { Controller } from './controller';
import { IFileService } from '@interfaces/file-service.interface';
import { PLATFORMS } from '@constants/main.constants';

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
);
