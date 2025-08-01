import { BehaviorSubject } from 'rxjs';
import {
  BANNER,
  UI_POSITIONS,
  MENU_BAR,
  INFO_MSGS,
  DEFAULT_SIZE,
} from '../../../../constants/index.js';
import { BaseUi } from '../../base.ui.js';
import colors from 'colors';
import { IConfig } from '../../../../cli/interfaces/config.interface.js';
import { MENU_BAR_OPTIONS } from './header-ui.constants.js';

export class HeaderUi extends BaseUi {
  programVersion: string;
  private activeMenuIndex = MENU_BAR_OPTIONS.DELETE;

  readonly menuIndex$ = new BehaviorSubject<MENU_BAR_OPTIONS>(
    MENU_BAR_OPTIONS.DELETE,
  );

  constructor(private readonly config: IConfig) {
    super();
    this.menuIndex$.subscribe((menuIndex) => {
      this.activeMenuIndex = menuIndex;
      this.render();
    });
  }

  render(): void {
    // banner and tutorial
    this.printAt(BANNER, UI_POSITIONS.INITIAL);
    this.renderHeader();
    this.renderMenuBar();

    if (this.programVersion !== undefined) {
      this.printAt(colors.gray(this.programVersion), UI_POSITIONS.VERSION);
    }

    if (this.config.dryRun) {
      this.printAt(
        colors.black(colors.bgMagenta(` ${INFO_MSGS.DRY_RUN} `)),
        UI_POSITIONS.DRY_RUN_NOTICE,
      );
    }

    // Columns headers
    this.printAt(colors.bgYellow(colors.black(INFO_MSGS.HEADER_COLUMNS)), {
      x: this.terminal.columns - INFO_MSGS.HEADER_COLUMNS.length - 4,
      y: UI_POSITIONS.FOLDER_SIZE_HEADER.y,
    });

    // npkill stats
    this.printAt(
      colors.gray(INFO_MSGS.TOTAL_SPACE + DEFAULT_SIZE),
      UI_POSITIONS.TOTAL_SPACE,
    );
    this.printAt(
      colors.gray(INFO_MSGS.SPACE_RELEASED + DEFAULT_SIZE),
      UI_POSITIONS.SPACE_RELEASED,
    );
  }

  private renderHeader(): void {
    const { columns } = this.terminal;
    const spaceToFill = Math.max(0, columns - MENU_BAR.OPTIONS.length - 2);
    this.printAt(
      colors.bgYellow(' '.repeat(spaceToFill)),
      UI_POSITIONS.TUTORIAL_TIP,
    );
  }

  private renderMenuBar(): void {
    const options = Object.values(MENU_BAR);
    let xStart = 2;
    for (const option of options) {
      const isActive = option === options[this.activeMenuIndex];
      const colorFn = isActive
        ? colors.bgYellow.black.bold.underline
        : colors.bgYellow.gray;
      this.printAt(colorFn(option), {
        x: xStart,
        y: UI_POSITIONS.TUTORIAL_TIP.y,
      });

      const MARGIN = 1;
      xStart += option.length + MARGIN;
    }
  }
}
