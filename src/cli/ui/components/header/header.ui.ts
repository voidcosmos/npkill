import { BehaviorSubject } from 'rxjs';
import {
  BANNER,
  UI_POSITIONS,
  MENU_BAR,
  INFO_MSGS,
} from '../../../../constants/index.js';
import { BaseUi } from '../../base.ui.js';
import pc from 'picocolors';
import { IConfig } from '../../../../cli/interfaces/config.interface.js';
import { MENU_BAR_OPTIONS } from './header-ui.constants.js';

export class HeaderUi extends BaseUi {
  programVersion: string;
  private activeMenuIndex = MENU_BAR_OPTIONS.DELETE;
  private searchMode = false;
  private searchText = '';
  private isSearchInputActive = false;

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

  setSearch(text: string | null, isInputActive = false) {
    if (text === null) {
      this.searchMode = false;
      this.searchText = '';
      this.isSearchInputActive = false;
    } else {
      this.searchMode = true;
      this.searchText = text;
      this.isSearchInputActive = isInputActive;
    }
    this.render();
  }

  render(): void {
    // banner and tutorial
    this.printAt(BANNER, UI_POSITIONS.INITIAL);
    this.renderHeader();
    this.renderMenuBar();

    if (this.programVersion !== undefined) {
      this.printAt(pc.gray(this.programVersion), UI_POSITIONS.VERSION);
    }

    if (this.config.dryRun) {
      this.printAt(
        pc.black(pc.bgMagenta(` ${INFO_MSGS.DRY_RUN} `)),
        UI_POSITIONS.DRY_RUN_NOTICE,
      );
    }

    // Columns headers
    if (this.activeMenuIndex === MENU_BAR_OPTIONS.DELETE) {
      this.printAt(pc.bgYellow(pc.black(INFO_MSGS.HEADER_COLUMNS)), {
        x: this.terminal.columns - INFO_MSGS.HEADER_COLUMNS.length - 2,
        y: UI_POSITIONS.FOLDER_SIZE_HEADER.y,
      });
    }

    // npkill stats
    this.printAt(pc.gray(INFO_MSGS.TOTAL_SPACE), UI_POSITIONS.TOTAL_SPACE);
    this.printAt(
      pc.gray(INFO_MSGS.SPACE_RELEASED),
      UI_POSITIONS.SPACE_RELEASED,
    );
  }

  private renderHeader(): void {
    const { columns } = this.terminal;
    const spaceToFill = Math.max(0, columns - 2);
    this.printAt(
      pc.bgYellow(' '.repeat(spaceToFill)),
      UI_POSITIONS.TUTORIAL_TIP,
    );
  }

  private renderMenuBar(): void {
    if (this.searchMode) {
      let searchText = ` Search: ${this.searchText} `;
      if (this.isSearchInputActive) {
        searchText = ` Search: ${this.searchText}_ `;
        this.printAt(pc.bgBlue(pc.white(searchText)), {
          x: 2,
          y: UI_POSITIONS.TUTORIAL_TIP.y,
        });
      } else {
        this.printAt(pc.bgWhite(pc.black(searchText)), {
          x: 2,
          y: UI_POSITIONS.TUTORIAL_TIP.y,
        });
      }
      return;
    }

    const options = Object.values(MENU_BAR);
    let xStart = 2;
    for (const option of options) {
      const isActive = option === options[this.activeMenuIndex];
      const colorFn = isActive
        ? (v: string) => pc.bgYellow(pc.black(pc.bold(pc.underline(v))))
        : (v: string) => pc.bgYellow(pc.gray(v));

      this.printAt(colorFn(option), {
        x: xStart,
        y: UI_POSITIONS.TUTORIAL_TIP.y,
      });

      const MARGIN = 1;
      xStart += option.length + MARGIN;
    }
  }
}
