import {
  ConsoleService,
  HttpsService,
  ResultsService,
  SpinnerService,
  UpdateService,
} from './cli/services/index.js';

import { Controller } from './cli/controller.js';
import { UiService } from './cli/services/ui.service.js';
import { LoggerService } from './core/services/logger.service.js';
import { SearchStatus } from './core/interfaces/search-status.model.js';
import { Npkill } from './core/index.js';

export default (): void => {
  const logger = new LoggerService();
  const searchStatus = new SearchStatus();
  const resultsService = new ResultsService();

  const npkill = new Npkill({ logger, searchStatus, resultsService });

  const controller = new Controller(
    npkill,
    logger,
    searchStatus,
    resultsService,
    new SpinnerService(),
    new ConsoleService(),
    new UpdateService(new HttpsService()),
    new UiService(),
  );

  controller.init();
};
