import { UI_POSITIONS, INFO_MSGS } from '../../../../constants/index.js';
import { BaseUi } from '../../base.ui.js';
import { ResultsService } from '../../../services/results.service.js';
import { LoggerService } from '@core/services/logger.service.js';
import pc from 'picocolors';
import { IConfig } from '../../../interfaces/config.interface.js';
import { IPosition } from '../../../interfaces/ui-positions.interface.js';

interface ShowStatProps {
  description: string;
  value: string;
  lastValueKey: 'totalSpace' | 'spaceReleased';
  position: IPosition;
  updateColor: 'green' | 'yellow';
}

export class StatsUi extends BaseUi {
  private lastValues = {
    totalSpace: '',
    spaceReleased: '',
  };

  private timeouts = {
    totalSpace: setTimeout(() => {}),
    spaceReleased: setTimeout(() => {}),
  };

  constructor(
    private readonly config: IConfig,
    private readonly resultsService: ResultsService,
    private readonly logger: LoggerService,
  ) {
    super();
  }

  render(): void {
    const { totalSpace, spaceReleased } = this.resultsService.getStats();

    this.showStat({
      description: INFO_MSGS.TOTAL_SPACE,
      value: totalSpace,
      lastValueKey: 'totalSpace',
      position: UI_POSITIONS.TOTAL_SPACE,
      updateColor: 'yellow',
    });

    this.showStat({
      description: INFO_MSGS.SPACE_RELEASED,
      value: spaceReleased,
      lastValueKey: 'spaceReleased',
      position: UI_POSITIONS.SPACE_RELEASED,
      updateColor: 'green',
    });

    if (this.config.showErrors) {
      this.showErrorsCount();
    }
  }

  /** Print the value of the stat and if it is a different value from the
   * previous run, highlight it for a while.
   */
  private showStat({
    description,
    value,
    lastValueKey,
    position,
    updateColor,
  }: ShowStatProps): void {
    if (value === this.lastValues[lastValueKey]) {
      return;
    }

    const statPosition = { ...position };
    statPosition.x += description.length;

    // If is first render, initialize.
    if (!this.lastValues[lastValueKey]) {
      this.printAt(value, statPosition);
      this.lastValues[lastValueKey] = value;
      return;
    }

    this.printAt(pc[updateColor](`${value} ▲`), statPosition);

    if (this.timeouts[lastValueKey]) {
      clearTimeout(this.timeouts[lastValueKey]);
    }

    this.timeouts[lastValueKey] = setTimeout(() => {
      this.printAt(value + '  ', statPosition);
    }, 700);

    this.lastValues[lastValueKey] = value;
  }

  private showErrorsCount(): void {
    const errors = this.logger.get('error').length;

    if (errors === 0) {
      return;
    }

    const text = `${errors} error${errors > 1 ? 's' : ''}. 'e' to see`;
    this.printAt(pc.yellow(text), { ...UI_POSITIONS.ERRORS_COUNT });
  }
}
