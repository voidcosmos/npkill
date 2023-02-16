// This class in only a intermediate for the refactor.

import { Ui } from './ui.js';

export class GeneralUi extends Ui {
  constructor() {
    super();
  }

  render() {}

  printExitMessage(stats: { spaceReleased: string }): void {
    const { spaceReleased } = stats;
    const exitMessage = `Space released: ${spaceReleased}\n`;
    this.print(exitMessage);
  }

  print(text: string) {
    this.print(text);
  }
}
