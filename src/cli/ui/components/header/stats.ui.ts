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

type ResultTypeRowKey = 'row1' | 'row2' | 'row3' | 'row4' | 'row5';

export class StatsUi extends BaseUi {
  private lastValues = {
    totalSpace: '',
    spaceReleased: '',
  };

  private timeouts = {
    totalSpace: setTimeout(() => {}),
    spaceReleased: setTimeout(() => {}),
  };

  private lastResultTypesValues: Map<ResultTypeRowKey, string> = new Map();
  private resultTypesTimeouts: Map<ResultTypeRowKey, NodeJS.Timeout> =
    new Map();

  constructor(
    private readonly config: IConfig,
    private readonly resultsService: ResultsService,
    private readonly logger: LoggerService,
  ) {
    super();
  }

  // Prevent bug where the "Releasable space" and "Saved Space" got o 0.
  reset(): void {
    this.lastValues = {
      totalSpace: '',
      spaceReleased: '',
    };
    this.lastResultTypesValues.clear();
  }

  render(): void {
    const { totalSpace, spaceReleased, resultsTypesCount } =
      this.resultsService.getStats();

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

    this.showResultsTypesCount(resultsTypesCount);
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

  private showResultsTypesCount(
    resultsTypesCount: Array<{ type: string; count: number }>,
  ): void {
    const MAX_CONTENT_LENGTH = 20;
    const RIGHT_MARGIN = 2;
    const MIN_TERMINAL_WIDTH = 94;
    const START_Y = 1;
    const NUM_ROWS = 5;

    if (this.terminal.columns < MIN_TERMINAL_WIDTH) {
      return;
    }

    const clearText = ' '.repeat(MAX_CONTENT_LENGTH);
    const xStart = this.terminal.columns - MAX_CONTENT_LENGTH - RIGHT_MARGIN;

    for (let i = 0; i < NUM_ROWS; i++) {
      const yPos = START_Y + i;
      this.printAt(clearText, { x: xStart, y: yPos });
    }

    const positions: { key: ResultTypeRowKey; yPosition: number }[] = [
      { key: 'row1', yPosition: 1 },
      { key: 'row2', yPosition: 2 },
      { key: 'row3', yPosition: 3 },
      { key: 'row4', yPosition: 4 },
      { key: 'row5', yPosition: 5 },
    ];

    const maxRows = 5;

    if (resultsTypesCount.length <= maxRows) {
      resultsTypesCount.forEach((item, index) => {
        const { key, yPosition } = positions[index];
        const text = this.formatResultTypeText(
          item.count,
          item.type,
          MAX_CONTENT_LENGTH,
        );
        const xPosition = this.terminal.columns - text.length - RIGHT_MARGIN;
        this.showResultTypeRow(key, text, { x: xPosition, y: yPosition });
      });
    } else {
      const topTypes = resultsTypesCount.slice(0, 4);
      const remainingTypes = resultsTypesCount.slice(4);

      topTypes.forEach((item, index) => {
        const { key, yPosition } = positions[index];
        const text = this.formatResultTypeText(
          item.count,
          item.type,
          MAX_CONTENT_LENGTH,
        );
        const xPosition = this.terminal.columns - text.length - RIGHT_MARGIN;
        this.showResultTypeRow(key, text, { x: xPosition, y: yPosition });
      });

      // Show summary in 5th row
      const totalRemaining = remainingTypes.reduce(
        (sum, item) => sum + item.count,
        0,
      );
      const { key, yPosition } = positions[4];
      const summaryText = `[+${remainingTypes.length}·total ${totalRemaining}]`;
      const trimmedSummary =
        summaryText.length > MAX_CONTENT_LENGTH
          ? summaryText.substring(0, MAX_CONTENT_LENGTH - 3) + '...'
          : summaryText;
      const xPosition =
        this.terminal.columns - trimmedSummary.length - RIGHT_MARGIN;
      this.showResultTypeRow(key, trimmedSummary, {
        x: xPosition,
        y: yPosition,
      });
    }
  }

  private formatResultTypeText(
    count: number,
    type: string,
    maxLength: number,
  ): string {
    const countStr = count.toString();
    const baseLength = countStr.length + 3; // ' (' and ')'

    const fullText = `${type} (${countStr})`;
    if (fullText.length <= maxLength) {
      return fullText;
    }

    const maxTypeLength = maxLength - baseLength;
    const trimmedType =
      type.length > maxTypeLength
        ? type.substring(0, maxTypeLength - 3) + '...'
        : type;

    return `${trimmedType} (${countStr})`;
  }

  private showResultTypeRow(
    rowKey: ResultTypeRowKey,
    text: string,
    position: IPosition,
  ): void {
    const lastValue = this.lastResultTypesValues.get(rowKey);
    const valueChanged = text !== lastValue;
    const hasActiveHighlight = this.resultTypesTimeouts.has(rowKey);
    const shouldHighlight = valueChanged && lastValue !== undefined;

    if (shouldHighlight) {
      this.printAt(pc.white(text), { ...position });

      const previousTimeout = this.resultTypesTimeouts.get(rowKey);
      if (previousTimeout) {
        clearTimeout(previousTimeout);
      }

      const timeout = setTimeout(() => {
        this.printAt(pc.gray(text), { ...position });
        this.resultTypesTimeouts.delete(rowKey);
      }, 300);

      this.resultTypesTimeouts.set(rowKey, timeout);
    } else if (hasActiveHighlight) {
      this.printAt(pc.white(text), { ...position });
    } else {
      this.printAt(pc.gray(text), { ...position });
    }

    this.lastResultTypesValues.set(rowKey, text);
  }
}
