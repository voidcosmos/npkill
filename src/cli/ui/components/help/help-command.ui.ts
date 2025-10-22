import {
  HELP_HEADER,
  OPTIONS,
  HELP_FOOTER,
  HELP_PROGRESSBAR,
} from '../../../../constants/cli.constants.js';
import { MARGINS, UI_HELP } from '../../../../constants/main.constants.js';
import { INFO_MSGS } from '../../../../constants/messages.constants.js';
import { ConsoleService } from '../../../services/console.service.js';
import { BaseUi } from '../../base.ui.js';
import pc from 'picocolors';

export class HelpCommandUi extends BaseUi {
  constructor(private readonly consoleService: ConsoleService) {
    super();
  }

  render(): void {
    throw new Error('Method not implemented.');
  }

  show(): void {
    const maxWidth = Math.min(UI_HELP.MAX_WIDTH, this.terminal.columns);

    this.clear();
    this.print(pc.inverse(pc.bold(INFO_MSGS.HELP_TITLE + '\n')));

    const headerLines = this.consoleService.splitWordsByWidth(
      HELP_HEADER,
      maxWidth,
    );
    headerLines.forEach((line) => this.print(line + '\n'));
    this.print('\n');

    const progressBarLines = this.consoleService.splitWordsByWidth(
      HELP_PROGRESSBAR,
      maxWidth,
    );
    progressBarLines.forEach((line) => this.print(line + '\n'));
    this.print('\n');

    const maxDescriptionWidth = Math.min(
      maxWidth - UI_HELP.X_DESCRIPTION_OFFSET,
      this.terminal.columns - UI_HELP.X_DESCRIPTION_OFFSET,
    );

    this.print(pc.black(pc.bgYellow(pc.bold(' Options '))) + '\n');
    OPTIONS.forEach((option) => {
      const args = option.arg.reduce((text, arg) => text + ', ' + arg);
      const padding = ' '.repeat(UI_HELP.X_COMMAND_OFFSET);
      const commandLength = UI_HELP.X_COMMAND_OFFSET + args.length;

      const commandTooLong = commandLength >= UI_HELP.X_DESCRIPTION_OFFSET;

      if (commandTooLong) {
        this.print(padding + args + '\n');
      } else {
        this.print(padding + args);
      }

      const description = this.consoleService.splitWordsByWidth(
        option.description,
        maxDescriptionWidth,
      );

      description.forEach((line, index) => {
        if (index === 0 && !commandTooLong) {
          const spaceBetween = ' '.repeat(
            UI_HELP.X_DESCRIPTION_OFFSET - commandLength,
          );
          this.print(spaceBetween + line + '\n');
        } else {
          const descriptionPadding = ' '.repeat(UI_HELP.X_DESCRIPTION_OFFSET);
          this.print(descriptionPadding + line + '\n');
        }
      });

      this.print('\n');
    });

    this.print('\n');
    const footerLines = this.consoleService.splitWordsByWidth(
      HELP_FOOTER,
      maxWidth,
    );
    footerLines.forEach((line) => this.print(line + '\n'));
  }

  clear(): void {
    for (let row = MARGINS.ROW_RESULTS_START; row < this.terminal.rows; row++) {
      this.clearLine(row);
    }
  }
}
