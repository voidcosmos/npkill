// This class in only a intermediate for the refactor.

import { Ui } from './ui.js';
import colors from 'colors';

export class GeneralUi extends Ui {
  render() {}

  printExitMessage(stats: { spaceReleased: string }): void {
    const { spaceReleased } = stats;
    let exitMessage = `Space released: ${spaceReleased}\n`;
    exitMessage += colors['gray']('Thanks for using npkill!\n');
    this.print(exitMessage);
  }
}
