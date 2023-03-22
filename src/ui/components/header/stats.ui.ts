import { UI_POSITIONS, INFO_MSGS } from '../../../constants/index.js';
import { BaseUi } from '../../base.ui.js';
import { ResultsService } from '../../../services/results.service.js';
import { LoggerService } from '../../../services/logger.service.js';
import colors from 'colors';
import { IConfig } from 'src/interfaces/config.interface.js';

export class StatsUi extends BaseUi {
  constructor(
    private config: IConfig,
    private resultsService: ResultsService,
    private logger: LoggerService,
  ) {
    super();
  }

  render(): void {
    const { totalSpace, spaceReleased } = this.resultsService.getStats();

    const totalSpacePosition = { ...UI_POSITIONS.TOTAL_SPACE };
    const spaceReleasedPosition = { ...UI_POSITIONS.SPACE_RELEASED };

    totalSpacePosition.x += INFO_MSGS.TOTAL_SPACE.length;
    spaceReleasedPosition.x += INFO_MSGS.SPACE_RELEASED.length;

    this.printAt(totalSpace, totalSpacePosition);
    this.printAt(spaceReleased, spaceReleasedPosition);

    if (this.config.showErrors) {
      this.showErrorsCount();
    }
  }

  private showErrorsCount() {
    const errors = this.logger.get('error').length;

    if (!errors) {
      return;
    }

    const text = `${errors} error${errors > 1 ? 's' : ''}. 'e' to see`;
    this.printAt(colors['yellow'](text), { ...UI_POSITIONS.ERRORS_COUNT });
  }
}
