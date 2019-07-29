#!/usr/bin/env node

import { ConsoleService } from './services/console.service';
import { Controller } from './controller2';
import { LinuxFilesService } from './services/linux-files.service';
import { SpinnerService } from './services/spinner.service';

export const controller = new Controller(
  new LinuxFilesService(),
  new SpinnerService(),
  new ConsoleService(),
);
