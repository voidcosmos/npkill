import { InteractiveUi, BaseUi } from '../base.ui.js';
import { Subject } from 'rxjs';
import { IKeyPress } from '../../interfaces/key-press.interface.js';
import { INFO_MSGS, UI_POSITIONS } from '../../../constants/index.js';

export class WarningUi extends BaseUi implements InteractiveUi {
  private showDeleteAllWarning = false;
  readonly confirm$ = new Subject<null>();

  private readonly KEYS = {
    y: () => this.confirm$.next(null),
  };

  onKeyInput({ name }: IKeyPress): void {
    const action = this.KEYS[name];
    if (action === undefined) {
      return;
    }
    action();
  }

  setDeleteAllWarningVisibility(visible: boolean): void {
    this.showDeleteAllWarning = visible;
    this.render();
  }

  render(): void {
    if (this.showDeleteAllWarning) {
      this.printDeleteAllWarning();
    }
  }

  private printDeleteAllWarning(): void {
    this.printAt(INFO_MSGS.DELETE_ALL_WARNING, UI_POSITIONS.WARNINGS);
  }
}
