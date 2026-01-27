// This class in only a intermediate for the refactor.

import { IStats } from '../../interfaces/stats.interface.js';
import { BaseUi } from '../base.ui.js';
import pc from 'picocolors';
import { EXIT_MESSAGES } from '../../../constants/exit-messages.constants.js';

export class GeneralUi extends BaseUi {
  render(): void {}

  async printExitMessage({ stats }: { stats: IStats }): Promise<void> {
    const { spaceReleased } = stats;

    const bytes = spaceReleased.bytes;
    const gb = bytes / (1024 * 1024 * 1024);
    const isZero = bytes === 0;
    const isEpic = gb >= 50;
    const emoji = isZero ? '😐' : !isEpic ? '🚀' : '🤑';
    // const finalSymbol = isZero ? '.' : '!'.repeat(Math.floor(gb / 10) + 1);
    const title = pc.bold(pc.redBright('NPKILL'));
    const spaceSaved = pc.green(pc.bold(spaceReleased.text));
    const phrase = await this.getPhrase(gb);

    let exitMessage = `         ${title}\n`;
    exitMessage += ` ${emoji} Space released: ${spaceSaved}\n`;
    exitMessage += pc.gray(` ${phrase}\n`);
    exitMessage += pc.gray(` Like it? Give us a star\n`);
    exitMessage += pc.blue(' https://github.com/voidcosmos/npkill');
    exitMessage += '\n';

    this.print(exitMessage);
  }

  // "Achievement unlocked: Digital Minimalism." if delete all results and > 10?

  private async getPhrase(gb: number): Promise<string> {
    if (Math.random() < 0.0001) {
      const message = [
        ` ${this.rainbow('Statistically improbable')} (0.01%)`,
        ` Congratulations, you beat the odds!`,
        ...this.getUnicorn(),
      ];

      for (const line of message) {
        this.print(line + '\n');
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
      return '';
    }

    let messages: string[] = [];

    if (gb === 0) {
      messages = EXIT_MESSAGES.none;
    } else if (gb < 0.1) {
      messages = EXIT_MESSAGES.verySmall;
    } else if (gb < 1) {
      messages = EXIT_MESSAGES.small;
    } else if (gb < 10) {
      messages = EXIT_MESSAGES.medium;
    } else {
      messages = EXIT_MESSAGES.large;
    }

    return messages[Math.floor(Math.random() * messages.length)];
  }

  // Hey you!! You shouldn't be reading this!!!
  // \(”˚☐˚)/
  private getUnicorn(): string[] {
    const horn = pc.yellowBright;
    const mane = pc.magentaBright;
    const body = pc.white;
    const outline = pc.cyan;
    const sparkle = pc.blueBright;

    return [
      `     ${sparkle('\\.')}`,
      `      ${horn("\\'.")}      ${outline(';.')}`,
      `       ${horn("\\ '.")} ${outline(",--''-.~-~-'-,")}`,
      `        ${horn("\\,-'")} ${outline(",-.   '.~-~-~~,")}`,
      `      ${outline(",-'")}   ${mane('(###)')}    ${outline("\\-~'~=-.")}`,
      `  ${outline("_,-'")}       ${outline("'-'")}      ${outline('\\=~-"~~\',')}`,
      ` ${outline('/o')}                    ${outline('\\~-""~=-,')}`,
      ` ${outline('\\__')}                    ${outline('\\=-,~"-~,')}`,
      `    ${body('"""===-----.')}         ${outline('\\~=-"~-.')}`,
      `                ${outline('\\')}         ${sparkle('\\*=~-"')}`,
      `                 ${outline('\\')}         ${body('"=====----')}`,
      `                  ${outline('\\')}`,
      `                   ${outline('\\')}`,
    ];
  }

  private rainbow(text: string): string {
    const colors = [
      pc.redBright,
      pc.yellowBright,
      pc.greenBright,
      pc.cyanBright,
      pc.blueBright,
      pc.magentaBright,
    ];

    let i = 0;

    return text
      .split('')
      .map((char) => {
        if (char === ' ') return char;
        const color = colors[i % colors.length];
        i++;
        return color(char);
      })
      .join('');
  }
}
