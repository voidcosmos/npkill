// This class in only a intermediate for the refactor.

import { BaseUi } from '../base.ui.js';
import pc from 'picocolors';

export class GeneralUi extends BaseUi {
  render(): void {}

  printExitMessage(stats: { spaceReleased: string }): void {
    const { spaceReleased } = stats;

    const title = pc.yellow(pc.bold(' NPKILL '));
    const spaceSaved = pc.green(pc.bold(spaceReleased));

    let exitMessage = `\n       ${title}\n`;
    exitMessage += ` 🚀 Space released: ${spaceSaved}\n`;
    exitMessage += pc.gray(' Thanks for using npkill!\n');
    exitMessage += pc.gray(
      ' Like it? Give us a star http://github.com/voidcosmos/npkill\n',
    );

    this.print(exitMessage);
  }
}
