#!/usr/bin/env node

import { ConsoleService } from './services/console.service';
import { Controller } from './controller2';
import { LinuxFilesService } from './services/linux-files.service';
import { SpinnerService } from './services/spinner.service';
import { WindowsFilesService } from './services/windows-files.service';

const isOSWindow = () => process.platform === 'win32';

const fileService = isOSWindow()
  ? new WindowsFilesService()
  : new LinuxFilesService();

export const controller = new Controller(
  fileService,
  new SpinnerService(),
  new ConsoleService(),
);
