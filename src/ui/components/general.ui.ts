// This class in only a intermediate for the refactor.

import { BaseUi } from '../base.ui.js';
import colors from 'colors';

export class GeneralUi extends BaseUi {
  render() {}

  printExitMessage(stats: { spaceReleased: string }): void {
    const { spaceReleased } = stats;
    let exitMessage = `Space released: ${spaceReleased}\n`;
    exitMessage += colors['gray']('Thanks for using npkill!\n');
    this.print(exitMessage);
  }
}
