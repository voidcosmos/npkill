import { MARGINS } from '../../../constants/main.constants.js';
import { BaseUi, InteractiveUi } from '../base.ui.js';
import { IKeyPress } from '../../interfaces/key-press.interface.js';
import { Subject } from 'rxjs';
import colors from 'colors';
import { resolve } from 'node:path';
import { CliScanFoundFolder } from 'src/cli/interfaces/stats.interface.js';
import { convertGBToMB } from '../../../utils/unit-conversions.js';
import { RESULT_TYPE_INFO } from '../../../constants/messages.constants.js';

export class OptionsUi extends BaseUi implements InteractiveUi {
  resultIndex = 0;

  readonly goBack$ = new Subject<null>();
  readonly goToHelp$ = new Subject<null>();

  private readonly KEYS = {
    right: () => this.goBack(),
    left: () => this.goToHelp(),
    q: () => this.goBack(),
    escape: () => this.goBack(),
  };

  constructor() {
    super();
  }

  private goBack(): void {
    this.clear();
    this.goBack$.next(null);
  }

  private goToHelp(): void {
    this.clear();
    this.goToHelp$.next(null);
  }

  onKeyInput({ name }: IKeyPress): void {
    const action: (() => void) | undefined = this.KEYS[name];
    if (action === undefined) {
      return;
    }
    action();
  }

  render(): void {
    const maxWidth = Math.min(this.terminal.columns, 80);
    const startRow = MARGINS.ROW_RESULTS_START;
    let currentRow = startRow;

    this.printAt(colors.bgGreen.white('OPTIONS PAGE WORK!'), {
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
