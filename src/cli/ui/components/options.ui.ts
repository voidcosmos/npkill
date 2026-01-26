import { MARGINS } from '../../../constants/main.constants.js';
import { BaseUi, InteractiveUi } from '../base.ui.js';
import { IKeyPress } from '../../interfaces/key-press.interface.js';
import { Subject } from 'rxjs';
import pc from 'picocolors';
import path from 'path';
import { existsSync } from 'fs';
import { IConfig } from '../../../cli/interfaces/config.interface.js';
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
        label: 'Sensitive results',
        type: 'checkbox',
        key: 'excludeSensitiveResults',
        value: !this.config.excludeSensitiveResults,
      },
      {
        label: 'Sort by',
        type: 'dropdown',
        key: 'sortBy',
        value: this.config.sortBy,
        options: ['path', 'size', 'age'],
      },
      {
        label: 'Dry-run',
        type: 'checkbox',
        key: 'dryRun',
        value: this.config.dryRun,
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
        label: 'Size unit',
        type: 'dropdown',
        key: 'sizeUnit',
        value: this.config.sizeUnit,
        options: ['auto', 'MB', 'GB'],
      },
      {
        label: 'Cwd',
        type: 'input',
        key: 'folderRoot',
        value: path.resolve(this.config.folderRoot),
      },
      {
        label: 'Target folder',
        type: 'input',
        key: 'targets',
        value: Array.isArray(this.config.targets)
          ? this.config.targets.join(',')
          : '',
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

        if (key === 'folderRoot') {
          const newPath = path.resolve(newValue as string);
          if (existsSync(newPath)) {
            this.config[key] = newPath;
            opt.value = newPath;
            this.emitConfigChange(opt.key, newPath);
          }
          // if not valid, revert visually to old value on render
        } else {
          this.config[key as any] = newValue as unknown as string;
          opt.value = newValue;
          this.emitConfigChange(opt.key, newValue);
        }
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

    let activeDropdown: {
      options: string[];
      yBase: number;
    } | null = null;

    for (let i = 0; i < this.options.length; i++) {
      const opt = this.options[i];
      const isSelected = i === this.selectedIndex;
      const label = `${opt.label.padEnd(18)}`;

      let valueText = '';
      if (opt.type === 'checkbox') {
        valueText = opt.value ? '[x]' : '[ ]';
      } else if (opt.type === 'dropdown') {
        valueText = `${opt.value}`;
      } else if (opt.type === 'input') {
        valueText =
          this.isEditing && isSelected
            ? this.editBuffer + '_'
            : String(opt.value) === ''
              ? 'none'
              : String(opt.value);
      }

      // Move the options down to prevent the values from overlapping.
      const LEFT_MARGIN = 2;
      const terminalWidth = this.terminal.columns;
      const PREFIX_LENGTH = 20; // Marker (1) + Space (1) + Label (18)
      const valueStartX = LEFT_MARGIN + PREFIX_LENGTH;
      const maxContentWidth = Math.max(10, terminalWidth - valueStartX);

      const chunks: string[] = [];
      if (valueText.length === 0) {
        chunks.push('');
      } else {
        for (let k = 0; k < valueText.length; k += maxContentWidth) {
          chunks.push(valueText.substring(k, k + maxContentWidth));
        }
      }

      chunks.forEach((chunk, index) => {
        let line = '';
        let chunkText = chunk;
        if (
          opt.type === 'input' &&
          String(opt.value) === '' &&
          chunk === 'none'
        ) {
          chunkText = pc.gray(chunk);
        }

        if (index === 0) {
          line = `${isSelected ? pc.bgCyan(' ') : ' '} ${label}${chunkText}`;
        } else {
          const padding = ' '.repeat(PREFIX_LENGTH);
          line = `${padding}${chunkText}`;
        }

        this.printAt(isSelected ? pc.cyan(line) : line, {
          x: LEFT_MARGIN,
          y: currentRow++,
        });
      });

      // If selected and dropdown, queue for rendering
      if (opt.type === 'dropdown' && isSelected) {
        activeDropdown = {
          options: opt.options || [],
          yBase: currentRow,
        };
      }
    }

    if (activeDropdown) {
      const dropdownOptions = activeDropdown.options;
      const optionsNumber = dropdownOptions.length;
      const maxLength =
        dropdownOptions.length > 0
          ? Math.max(...dropdownOptions.map((o) => o.length))
          : 0;
      const activeOpt = this.options[this.selectedIndex];

      for (let i = 0; i < optionsNumber; i++) {
        const option = dropdownOptions[i];
        const paddedOption = option.padEnd(maxLength, ' ');
        const optionEntryText =
          option === activeOpt.value
            ? pc.bgCyan(pc.black(` ${paddedOption} `))
            : pc.bgBlack(pc.white(` ${paddedOption} `));
        this.printAt(optionEntryText, {
          x: 28,
          y: activeDropdown.yBase - Math.round(optionsNumber / 2) + i,
        });
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
