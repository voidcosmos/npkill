import { MARGINS } from '../../../constants/main.constants.js';
import { BaseUi, InteractiveUi } from '../base.ui.js';
import { IKeyPress } from '../../interfaces/key-press.interface.js';
import { Subject } from 'rxjs';
import pc from 'picocolors';
import { IConfig } from '../../../cli/interfaces/config.interface.js';
import { COLORS } from '../../../constants/cli.constants.js';
import { OPTIONS_HINTS_BY_TYPE } from '../../../constants/options.constants.js';

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

  private options: OptionItem[];

  private readonly KEYS: Record<string, () => void> = {
    up: () => this.move(-1),
    down: () => this.move(1),
    k: () => this.move(-1),
    j: () => this.move(1),
    return: () => this.activateSelected(),
    space: () => this.activateSelected(),
    left: () => this.goToHelp(),
    right: () => this.goBack(),
    h: () => this.goToHelp(),
    l: () => this.goBack(),
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
        key: 'targets',
        value: Array.isArray(this.config.targets)
          ? this.config.targets.join(',')
          : '',
      },
      {
        label: 'Cwd',
        type: 'input',
        key: 'folderRoot',
        value: this.config.folderRoot,
      },
      {
        label: 'Exclude',
        type: 'input',
        key: 'exclude',
        value: Array.isArray(this.config.exclude)
          ? this.config.exclude.join(',')
          : '',
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
        label: 'Size unit',
        type: 'dropdown',
        key: 'sizeUnit',
        value: this.config.sizeUnit,
        options: ['auto', 'mb', 'gb'],
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
      // Direct assignment for boolean types
      opt.value = !opt.value as IConfig[typeof opt.key];
      const key = opt.key as keyof Pick<
        IConfig,
        {
          [K in keyof IConfig]: IConfig[K] extends boolean ? K : never;
        }[keyof IConfig]
      >;
      this.config[key] = !!opt.value;
      this.emitConfigChange(opt.key, opt.value);
      this.render();
    } else if (opt.type === 'dropdown') {
      const key = opt.key as keyof Pick<
        IConfig,
        {
          [K in keyof IConfig]: IConfig[K] extends string ? K : never;
        }[keyof IConfig]
      >;
      const idx = opt.options!.indexOf(opt.value as string);
      const next = (idx + 1) % opt.options!.length;
      opt.value = opt.options![next] as IConfig[typeof key];

      if (opt.key === 'sizeUnit') {
        this.config[key] = opt.value as IConfig['sizeUnit'];
      } else {
        this.config[opt.key as any] = opt.value as IConfig[typeof opt.key];
      }

      this.emitConfigChange(opt.key, opt.value);
      this.render();
    } else if (opt.type === 'input') {
      this.isEditing = true;
      // Convertir el valor existente a string para el buffer de edición
      this.editBuffer = String(opt.value);
      this.render();
    }
  }

  private handleEditKey(name: string, sequence: string): void {
    const opt = this.options[this.selectedIndex];

    if (opt.type !== 'input') {
      this.isEditing = false;
      this.render();
      return;
    }

    if (name === 'return') {
      if (opt.key === 'targets' || opt.key === 'exclude') {
        const arrValue = this.editBuffer
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        this.config[opt.key] = arrValue;
        this.emitConfigChange(opt.key, arrValue);
        opt.value = this.editBuffer;
      } else {
        const key = opt.key as keyof Pick<
          IConfig,
          {
            [K in keyof IConfig]: IConfig[K] extends string ? K : never;
          }[keyof IConfig]
        >;
        const newValue: IConfig[typeof opt.key] = this
          .editBuffer as IConfig[typeof opt.key];
        this.config[key as any] = newValue as unknown as string;
        opt.value = newValue;
        this.emitConfigChange(opt.key, newValue);
      }
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

  private emitConfigChange<K extends keyof IConfig>(
    key: K,
    value: IConfig[K],
  ): void {
    const configChange: Partial<IConfig> = { [key]: value } as Partial<IConfig>;
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
    this.printHintMessage();
    let currentRow = MARGINS.ROW_RESULTS_START;

    this.printAt(pc.bold(pc.bgYellow(pc.black('  OPTIONS  '))), {
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
          this.isEditing && isSelected
            ? this.editBuffer + '_'
            : String(opt.value);
      }

      const line = `${isSelected ? pc.bgCyan(' ') : ' '} ${label}${valueText}`;
      this.printAt(isSelected ? pc.cyan(line) : line, {
        x: 2,
        y: currentRow++,
      });

      // If selected and dropdown, show options
      if (opt.type === 'dropdown' && isSelected) {
        const dropdownOptions = opt.options || [];
        const optionsNumber = dropdownOptions.length;
        const maxLength =
          dropdownOptions.length > 0
            ? Math.max(...dropdownOptions.map((o) => o.length))
            : 0;
        for (let i = 0; i < optionsNumber; i++) {
          const option = dropdownOptions[i];
          const paddedOption = option.padEnd(maxLength, ' ');
          const optionEntryText =
            option === opt.value
              ? pc.bgCyan(pc.black(` ${paddedOption} `))
              : pc.bgBlack(pc.white(` ${paddedOption} `));
          this.printAt(optionEntryText, {
            x: 34,
            y: currentRow - Math.round(optionsNumber / 2) + i,
          });
        }
      }
    }
  }

  private printHintMessage() {
    const optionSelected = this.options[this.selectedIndex];

    const hintText =
      optionSelected.type === 'input' && this.isEditing
        ? OPTIONS_HINTS_BY_TYPE['input-exit']
        : OPTIONS_HINTS_BY_TYPE[optionSelected.type];

    if (!hintText) {
      return;
    }

    this.printAt(hintText, {
      x: 15,
      y: MARGINS.ROW_RESULTS_START,
    });
  }

  clear(): void {
    for (let row = MARGINS.ROW_RESULTS_START; row < this.terminal.rows; row++) {
      this.clearLine(row);
    }
  }
}
