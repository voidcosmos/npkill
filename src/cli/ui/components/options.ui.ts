import { DEFAULT_CONFIG, MARGINS } from '../../../constants/main.constants.js';
import { BaseUi, InteractiveUi } from '../base.ui.js';
import { IKeyPress } from '../../interfaces/key-press.interface.js';
import { Subject } from 'rxjs';
import colors from 'colors';
import { resolve } from 'node:path';
import { convertGBToMB } from '../../../utils/unit-conversions.js';
import { RESULT_TYPE_INFO } from '../../../constants/messages.constants.js';
import { IConfig } from '../../../cli/interfaces/config.interface.js';
import { COLORS } from '../../../constants/cli.constants.js';

type OptionType = 'checkbox' | 'dropdown' | 'input';

interface OptionItem<K extends keyof IConfig = keyof IConfig> {
  label: string;
  type: OptionType;
  key: K;
  value: IConfig[K];
  options?: string[]; // dropdown options
}

export class OptionsUi extends BaseUi implements InteractiveUi {
  resultIndex = 0;
  readonly goBack$ = new Subject<null>();
  readonly goToHelp$ = new Subject<null>();
  private readonly config: IConfig;

  private selectedIndex = 0;
  private isEditing = false;
  private editBuffer = '';

  private options: /*OptionItem*/ any[];

  private readonly KEYS: Record<string, () => void> = {
    up: () => this.move(-1),
    down: () => this.move(1),
    return: () => this.activateSelected(),
    space: () => this.activateSelected(),
    left: () => this.goToHelp(),
    right: () => this.goBack(),
    escape: () => (this.isEditing ? this.cancelEdit() : this.goBack()),
    q: () => this.goBack(),
  };

  constructor(
    private readonly changeConfig$: Subject<Partial<IConfig>>,
    config: IConfig,
  ) {
    super();
    this.config = { ...config };
    this.initializeOptions();
  }

  private initializeOptions(): void {
    this.options = [
      {
        label: 'Target folder',
        type: 'input',
        key: 'targetFolder',
        value: this.config.targetFolder,
      },
      {
        label: 'Cwd',
        type: 'input',
        key: 'folderRoot',
        value: this.config.folderRoot,
      },
      {
        label: 'Exlude',
        type: 'input',
        key: 'exclude',
        value: this.config.exclude,
      },
      {
        label: 'Sort by',
        type: 'dropdown',
        key: 'sortBy',
        value: this.config.sortBy,
        options: ['path', 'size', 'last-mod'],
      },
      {
        label: 'Cursor color',
        type: 'dropdown',
        key: 'backgroundColor',
        value: this.config.backgroundColor,
        options: Object.values(COLORS),
      },
      {
        label: 'Show sizes in GB.',
        type: 'checkbox',
        key: 'folderSizeInGB',
        value: this.config.folderSizeInGB,
      },
      {
        label: 'Exclude hidden dirs.',
        type: 'checkbox',
        key: 'excludeHiddenDirectories',
        value: this.config.excludeHiddenDirectories,
      },
      {
        label: 'Dry-run mode',
        type: 'checkbox',
        key: 'dryRun',
        value: this.config.dryRun,
      },
    ];
  }

  private move(dir: -1 | 1): void {
    if (this.isEditing) return;
    this.selectedIndex =
      (this.selectedIndex + dir + this.options.length) % this.options.length;
    this.render();
  }

  private activateSelected(): void {
    const opt = this.options[this.selectedIndex];

    if (opt.type === 'checkbox') {
      opt.value = !opt.value;
      this.config[opt.key] = opt.value;
      this.emitConfigChange(opt.key, opt.value);
      this.render();
    } else if (opt.type === 'dropdown') {
      const idx = opt.options!.indexOf(opt.value);
      const next = (idx + 1) % opt.options!.length;
      opt.value = opt.options![next];
      this.config[opt.key] = opt.value;
      this.emitConfigChange(opt.key, opt.value);
      this.render();
    } else if (opt.type === 'input') {
      this.isEditing = true;
      this.editBuffer = String(opt.value);
      this.render();
    }
  }

  private handleEditKey(name: string, sequence: string): void {
    if (name === 'return') {
      const opt = this.options[this.selectedIndex];
      opt.value = this.editBuffer;
      this.config[opt.key] = this.editBuffer;
      this.emitConfigChange(opt.key, this.editBuffer);
      this.isEditing = false;
      this.render();
    } else if (name === 'escape') {
      this.cancelEdit();
    } else if (name === 'backspace') {
      this.editBuffer = this.editBuffer.slice(0, -1);
      this.render();
    } else if (sequence && sequence.length === 1) {
      this.editBuffer += sequence;
      this.render();
    }
  }

  private emitConfigChange(key: keyof IConfig, value: any): void {
    const configChange = { [key]: value } as Partial<IConfig>;
    this.changeConfig$.next(configChange);
  }

  private cancelEdit(): void {
    this.isEditing = false;
    this.editBuffer = '';
    this.render();
  }

  onKeyInput(key: IKeyPress): void {
    if (this.isEditing) {
      this.handleEditKey(key.name, key.sequence);
      return;
    }

    const action = this.KEYS[key.name];
    if (action) action();
  }

  private goBack(): void {
    this.clear();
    this.goBack$.next(null);
  }

  private goToHelp(): void {
    this.clear();
    this.goToHelp$.next(null);
  }

  render(): void {
    this.clear();
    let currentRow = MARGINS.ROW_RESULTS_START;

    this.printAt(colors.bold.bgYellow.black('  OPTIONS  '), {
      x: 1,
      y: currentRow++,
    });
    currentRow++;

    for (let i = 0; i < this.options.length; i++) {
      const opt = this.options[i];
      const isSelected = i === this.selectedIndex;
      const label = `${opt.label.padEnd(16)}`;

      let valueText = '';
      if (opt.type === 'checkbox') {
        valueText = opt.value ? '[x]' : '[ ]';
      } else if (opt.type === 'dropdown') {
        valueText = `${opt.value}`;
      } else if (opt.type === 'input') {
        valueText =
          this.isEditing && isSelected ? this.editBuffer + '_' : opt.value;
      }

      const line = `  ${label}${valueText}`;
      this.printAt(isSelected ? colors.cyan(line) : line, {
        x: 2,
        y: currentRow++,
      });

      // If selected and dropdown, show options
      if (opt.type === 'dropdown' && isSelected) {
        const optionsNumber = opt.options.length;
        for (let i = 0; i < optionsNumber; i++) {
          const option = opt.options[i];
          const optionEntryText =
            option === opt.value
              ? colors.bgCyan.black(option)
              : colors.bgBlack.white(option);
          this.printAt(optionEntryText, {
            x: 34,
            y: currentRow - Math.round(optionsNumber / 2) + i,
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
}
