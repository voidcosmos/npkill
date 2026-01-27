// This class in only a intermediate for the refactor.

import { IStats } from 'src/cli/interfaces/stats.interface.js';
import { BaseUi } from '../base.ui.js';
import pc from 'picocolors';

export class GeneralUi extends BaseUi {
  render(): void {}

  printExitMessage({ stats }: { stats: IStats }): void {
    const { spaceReleased } = stats;

    const bytes = spaceReleased.bytes;
    const gb = bytes / (1024 * 1024 * 1024);
    const isZero = bytes === 0;
    const isEpic = gb >= 50;
    const emoji = isZero ? '😐' : !isEpic ? '🚀' : '🤑';
    // const finalSymbol = isZero ? '.' : '!'.repeat(Math.floor(gb / 10) + 1);

    const title = pc.bold(pc.redBright('NPKILL'));
    const spaceSaved = pc.green(pc.bold(spaceReleased.text));

    let exitMessage = `         ${title}\n`;
    exitMessage += ` ${emoji} Space released: ${spaceSaved}\n`;
    exitMessage += pc.gray(' Thanks for using npkill!\n');
    exitMessage += pc.gray(` Like it? Give us a star\n`);
    exitMessage += pc.blue(' https://github.com/voidcosmos/npkill');
    exitMessage += '\n';

    this.print(exitMessage);
  }
}
