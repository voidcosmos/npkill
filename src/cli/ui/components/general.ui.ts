// This class in only a intermediate for the refactor.

import { BaseUi } from '../base.ui.js';
import pc from 'picocolors';

export class GeneralUi extends BaseUi {
  render(): void {}

  printExitMessage(stats: { spaceReleased: string }): void {
    const { spaceReleased } = stats;
    let exitMessage = `Space saved: ${spaceReleased}\n`;
    exitMessage += pc.dim(
      'Thanks for using npkill!\nLike it? Give us a star http://github.com/voidcosmos/npkill\n',
    );
    this.print(exitMessage);
  }
}
