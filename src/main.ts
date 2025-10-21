import {
  ConsoleService,
  HttpsService,
  JsonOutputService,
  ProfilesService,
  ResultsService,
  SpinnerService,
  UpdateService,
} from './cli/services/index.js';

import { CliController } from './cli/cli.controller.js';
import { UiService } from './cli/services/ui.service.js';
import { LoggerService } from './core/services/logger.service.js';
import { ScanStatus } from './core/interfaces/search-status.model.js';
import { Npkill } from './core/index.js';
import { ScanService } from './cli/services/scan.service.js';

export default (): void => {
  const logger = new LoggerService();
  const searchStatus = new ScanStatus();
  const resultsService = new ResultsService();

  const npkill = new Npkill({ logger, searchStatus, resultsService });

  const stdOut = process.stdout;
  const jsonOutputService = new JsonOutputService(stdOut, process.stderr);

  const cli = new CliController(
    stdOut,
    npkill,
    logger,
    searchStatus,
    resultsService,
    new SpinnerService(),
    new ConsoleService(),
    new UpdateService(new HttpsService()),
    new UiService(),
    new ScanService(npkill),
    jsonOutputService,
    new ProfilesService(),
  );

  cli.init();
};
