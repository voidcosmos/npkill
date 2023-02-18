import { LoggerService } from 'src/services/logger.service.js';
import { Position, Ui } from './ui.js';
import colors from 'colors';
import { IPosition } from 'src/interfaces/ui-positions.interface.js';

export class LogsUi extends Ui {
  private size: IPosition;
  private errors = 0;
  private pages;
  private actualPage = 0;

  constructor(private logger: LoggerService) {
    super();
    this.setVisible(false, false);
  }

  render() {
    this.renderPopup();
  }

  private renderPopup() {
    this.calculatePosition();
    for (let x = this.position.x; x < this.size.x; x++) {
      for (let y = this.position.y; y < this.size.y; y++) {
        let char = ' ';
        if (x === this.position.x || x === this.size.x - 1) char = '│';
        if (y === this.position.y) char = '═';
        if (y === this.size.y - 1) char = '─';
        if (x === this.position.x && y === this.position.y) char = '╒';
        if (x === this.size.x - 1 && y === this.position.y) char = '╕';
        if (x === this.position.x && y === this.size.y - 1) char = '╰';
        if (x === this.size.x - 1 && y === this.size.y - 1) char = '╯';

        this.printAt(colors['bgBlack'](char), { x, y });
      }
    }

    const width = this.size.x - this.position.x - 2;
    const maxEntries = this.size.y - this.position.y - 2;

    const messagesByLine: string[] = this.logger
      .get('error')
      .map((entry, index) => index + '. ' + entry.message)
      .reduce((acc: string[], line) => {
        acc = [...acc, ...this.chunkString(line, width)];
        return acc;
      }, []);

    this.pages = this.chunkArray(messagesByLine, maxEntries);
    this.errors = this.logger.get('error').length;

    if (messagesByLine.length === 0) {
      this.printAt(this.stylizeText('No errors!'), {
        x: this.position.x + 1,
        y: this.position.y + 1,
      });
    }

    this.pages[this.actualPage].forEach((entry, index) => {
      this.printAt(this.stylizeText(entry, 'error'), {
        x: this.position.x + 1,
        y: this.position.y + 1 + index,
      });
    });

    this.printHeader();
  }

  private printHeader() {
    const titleText = '▁▅█ Errors █▅▁';
    this.printAt(this.stylizeText(titleText), {
      x: Math.floor((this.size.x + titleText.length / 2) / 2) - this.position.x,
      y: this.position.y,
    });

    const rightText = ` ${this.errors} errors | Page ${this.actualPage + 1}/${
      this.pages.length
    } `;

    this.printAt(this.stylizeText(rightText), {
      x: Math.floor(this.size.x + this.position.x - 4 - (rightText.length + 2)),
      y: this.position.y,
    });
  }

  private stylizeText(
    text: string,
    style: 'normal' | 'error' = 'normal',
  ): string {
    const styles = { normal: 'white', error: 'red' };
    const color = styles[style];
    return colors[color](colors['bgBlack'](text));
  }

  private chunkString(str: string, length: number): string[] {
    return [...str.match(new RegExp('.{1,' + length + '}', 'g'))];
  }

  private chunkArray(arr: string[], size: number) {
    return arr.length > size
      ? [arr.slice(0, size), ...this.chunkArray(arr.slice(size), size)]
      : [arr];
  }

  private calculatePosition() {
    const posX = 5;
    const posY = 4;
    this.setPosition({ x: posX, y: posY }, false);
    this.size = {
      x: this.stdout.columns - posX,
      y: this.stdout.rows - 3,
    };
  }
}
