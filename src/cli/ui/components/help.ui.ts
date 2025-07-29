import { MARGINS } from '../../../constants/main.constants.js';
import { BaseUi, InteractiveUi } from '../base.ui.js';
import { IKeyPress } from '../../interfaces/key-press.interface.js';
import { Subject } from 'rxjs';
import colors from 'colors';
import { resolve } from 'node:path';
import { CliScanFoundFolder } from 'src/cli/interfaces/stats.interface.js';
import { convertGBToMB } from '../../../utils/unit-conversions.js';
import { RESULT_TYPE_INFO } from '../../../constants/messages.constants.js';

export class HelpUi extends BaseUi implements InteractiveUi {
  resultIndex = 0;

  readonly goToOptions$ = new Subject<null>();

  private readonly KEYS = {
    right: () => this.goToOptions(),
    l: () => this.goToOptions(),
  };

  constructor() {
    super();
  }

  private goToOptions(): void {
    this.clear();
    this.goToOptions$.next(null);
  }

  onKeyInput({ name }: IKeyPress): void {
    const action: (() => void) | undefined = this.KEYS[name];
    if (action === undefined) {
      return;
    }
    action();
  }

  render(): void {
    this.clear();
    const maxWidth = Math.min(this.terminal.columns, 80);
    const startRow = MARGINS.ROW_RESULTS_START;
    let currentRow = startRow;

    this.printAt(colors.bgCyan.black('HELP PAGE WORK!'), {
      x: 3,
      y: startRow + 3,
    });
  }

  clear(): void {
    for (let row = MARGINS.ROW_RESULTS_START; row < this.terminal.rows; row++) {
      this.clearLine(row);
    }
  }
}
