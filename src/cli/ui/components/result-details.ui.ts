import { MARGINS } from '../../../constants/main.constants.js';
import { BaseUi, InteractiveUi } from '../base.ui.js';
import { IKeyPress } from '../../interfaces/key-press.interface.js';
import { Subject } from 'rxjs';
import pc from 'picocolors';
import { resolve } from 'node:path';
import { CliScanFoundFolder } from '../../../cli/interfaces/stats.interface.js';
import { formatSize } from '../../../utils/unit-conversions.js';
import { RESULT_TYPE_INFO } from '../../../constants/index.js';
import { IConfig } from '../../interfaces/config.interface.js';

export class ResultDetailsUi extends BaseUi implements InteractiveUi {
  resultIndex = 0;

  readonly goBack$ = new Subject<null>();
  readonly openFolder$ = new Subject<string>();

  private readonly KEYS = {
    left: () => this.goBack(),
    h: () => this.goBack(),
    o: () => this.openFolder(),
    q: () => this.goBack(),
    escape: () => this.goBack(),
  };

  constructor(
    private readonly result: CliScanFoundFolder,
    private readonly config: IConfig,
  ) {
    super();
  }

  private openFolder(): void {
    const folderPath = this.result.path;
    const parentPath = resolve(folderPath, '..');
    this.openFolder$.next(parentPath);
  }

  private goBack(): void {
    this.clear();
    this.goBack$.next(null);
  }

  onKeyInput({ name }: IKeyPress): void {
    const action: (() => void) | undefined = this.KEYS[name];
    if (action === undefined) {
      return;
    }
    action();
  }

  render(): void {
    const { path, size, modificationTime, status, riskAnalysis } = this.result;

    const maxWidth = Math.min(this.terminal.columns, 80);
    const startRow = MARGINS.ROW_RESULTS_START;
    let currentRow = startRow;

    this.clear();

    const wrapText = (
      text: string,
      width: number,
      splitter: RegExp | string = ' ',
    ): string[] => {
      const words =
        typeof splitter === 'string'
          ? text.split(splitter)
          : text.split(splitter);
      const lines: string[] = [];
      let currentLine = '';
      for (const word of words) {
        if ((currentLine + word).length >= width) {
          lines.push(currentLine.trim());
          currentLine = '';
        }
        currentLine += word + (typeof splitter === 'string' ? splitter : '');
      }
      if (currentLine.trim()) lines.push(currentLine.trim());
      return lines;
    };

    const wrapPath = (text: string, width: number): string[] => {
      return wrapText(text, width, /([/\\])/g);
    };

    const drawLabel = (
      label: string,
      value: string,
      colorFn = (v: string) => v,
    ) => {
      const text = `${label.padEnd(16)}${colorFn(value)}`;
      this.printAt(text, { x: 2, y: currentRow++ });
    };

    // Header
    this.printAt(pc.bold(pc.bgYellow(pc.black('  Result Details  '))), {
      x: 1,
      y: currentRow++,
    });
    this.printAt('-'.repeat(maxWidth - 4), { x: 2, y: currentRow++ });

    // Path
    const folderName = path.split(/[/\\]/).filter(Boolean).pop() || '';
    const wrappedPath = wrapPath(path, maxWidth - 4);
    this.printAt(pc.cyan('Path:'), { x: 2, y: currentRow++ });
    for (let i = 0; i < wrappedPath.length; i++) {
      const line = wrappedPath[i];
      const isLastLine = i === wrappedPath.length - 1;

      if (isLastLine && line.includes(folderName)) {
        const idx = line.lastIndexOf(folderName);
        const before = line.slice(0, idx);
        const name = line.slice(idx);
        this.printAt('  ' + before + pc.yellow(pc.underline(name)), {
          x: 2,
          y: currentRow++,
        });
      } else {
        this.printAt('  ' + line, { x: 2, y: currentRow++ });
      }
    }

    // Size, Modified
    const formattedSize = formatSize(size, this.config.sizeUnit);
    drawLabel(
      'Size:',
      size ? formattedSize.text : '...',
      size ? pc.yellow : pc.gray,
    );
    drawLabel(
      'Modified:',
      modificationTime > 0
        ? new Date(modificationTime * 1000).toLocaleString()
        : '...',
      pc.gray,
    );

    // Status
    const statusColors = {
      live: pc.green,
      deleting: pc.yellow,
      'error-deleting': pc.red,
      deleted: pc.gray,
    };
    drawLabel('Status:', status, statusColors[status]);

    // Delicate
    drawLabel(
      'Delicate:',
      riskAnalysis?.isSensitive ? 'YES ⚠️' : 'No',
      riskAnalysis?.isSensitive ? (v) => pc.red(pc.bold(v)) : pc.green,
    );

    if (riskAnalysis?.isSensitive && riskAnalysis.reason) {
      const reasonLines = wrapPath(riskAnalysis?.reason + '.', maxWidth - 16);
      for (const line of reasonLines) {
        this.printAt('  ' + pc.red(pc.italic(line)), {
          x: 16,
          y: currentRow++,
        });
      }
    }

    // Footer
    currentRow++;
    this.printAt(pc.gray('← Back    ') + pc.gray('o: Open parent folder'), {
      x: 2,
      y: currentRow++,
    });

    // Target folder details
    const folderKey = folderName.toLowerCase();
    const targetInfo: string = RESULT_TYPE_INFO[folderKey];

    if (targetInfo) {
      currentRow += 2;
      this.printAt(pc.bold(pc.bgBlack(pc.gray(` ${folderName} info `))), {
        x: 2,
        y: currentRow++,
      });

      const warningMatch = targetInfo.match(/^(.*?)\s*WARNING:\s*(.*)$/s);

      if (warningMatch) {
        const mainInfo = warningMatch[1].trim();
        const warningText = warningMatch[2].trim();

        const infoLines = wrapText(mainInfo, maxWidth - 2);
        for (const line of infoLines) {
          this.printAt(pc.gray(line), {
            x: 2,
            y: currentRow++,
          });
        }

        const warningLines = wrapText(`⚠️ ${warningText}`, maxWidth - 2);
        for (const line of warningLines) {
          this.printAt(pc.yellow(line), {
            x: 2,
            y: currentRow++,
          });
        }
      } else {
        const infoLines = wrapText(targetInfo, maxWidth - 2);
        for (const line of infoLines) {
          this.printAt(pc.gray(line), {
            x: 2,
            y: currentRow++,
          });
        }
      }
    }
  }

  clear(): void {
    for (let row = MARGINS.ROW_RESULTS_START; row < this.terminal.rows; row++) {
      this.clearLine(row);
    }
  }

  /** Returns the number of results that can be displayed. */
  private getRowsAvailable(): number {
    return this.terminal.rows - MARGINS.ROW_RESULTS_START;
  }

  /** Returns the row to which the index corresponds. */
  private getRow(index: number): number {
    return index + MARGINS.ROW_RESULTS_START;
  }
}
