import {
  BANNER,
  UI_POSITIONS,
  HELP_MSGS,
  INFO_MSGS,
  DEFAULT_SIZE,
} from '../../../constants/index.js';
import { BaseUi } from '../../base.ui.js';
import colors from 'colors';

export class HeaderUi extends BaseUi {
  programVersion: string;

  render(): void {
    // banner and tutorial
    this.printAt(BANNER, UI_POSITIONS.INITIAL);
    this.printAt(
      colors.yellow(colors.inverse(HELP_MSGS.BASIC_USAGE)),
      UI_POSITIONS.TUTORIAL_TIP,
    );

    if (this.programVersion !== undefined) {
      this.printAt(colors.gray(this.programVersion), UI_POSITIONS.VERSION);
    }

    // Columns headers
    this.printAt(colors.gray(INFO_MSGS.HEADER_COLUMNS), {
      x: this.terminal.columns - INFO_MSGS.HEADER_COLUMNS.length - 4,
      y: UI_POSITIONS.FOLDER_SIZE_HEADER.y,
    });

    // npkill stats
    this.printAt(
      colors.gray(INFO_MSGS.TOTAL_SPACE + DEFAULT_SIZE),
      UI_POSITIONS.TOTAL_SPACE,
    );
    this.printAt(
      colors.gray(INFO_MSGS.SPACE_RELEASED + DEFAULT_SIZE),
      UI_POSITIONS.SPACE_RELEASED,
    );
  }
}
