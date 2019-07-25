#!/usr/bin/env node

import { ConsoleService } from './services/console.service';
import { Controller } from './controller2';
import { FilesService2 } from './services/files2.service';
import { SpinnerService } from './services/spinner.service';

export const controller = new Controller(
  new FilesService2(),
  new SpinnerService(),
  new ConsoleService(),
);
