#!/usr/bin/env node

import { ConsoleService } from './services/console.service';
import { Controller } from './controller';
import { IFileService } from './interfaces/file-service.interface';
import { LinuxFilesService } from './services/linux-files.service';
import { SpinnerService } from './services/spinner.service';
import { StreamService } from './services/stream.service';
import { PLATFORMS } from './constants/main.constants';
import { WindowsFilesService } from './services/windows-files.service';
import { UpdateService } from './services/update.service';
import { HttpsService } from './services/https.service';

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
