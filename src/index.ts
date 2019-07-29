#!/usr/bin/env node

import { ConsoleService } from './services/console.service';
import { Controller } from './controller';
import { FileService } from './services/files.service';
import { SpinnerService } from './services/spinner.service';

const controller = new Controller(
  new ConsoleService(),
  new FileService(),
  new SpinnerService(),
);
