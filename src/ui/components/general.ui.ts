// This class in only a intermediate for the refactor.

import { BaseUi } from '../base.ui.js';
import colors from 'colors';

export class GeneralUi extends BaseUi {
  render(): void {}

  printExitMessage(stats: { spaceReleased: string }): void {
    const { spaceReleased } = stats;
    let exitMessage = `Space released: ${spaceReleased}\n`;
    exitMessage += colors['gray']('Thanks for using npkill!\n Like it? Give us a star http://github.com/voidcosmos/npkill\n');
    this.print(exitMessage);
  }
}
