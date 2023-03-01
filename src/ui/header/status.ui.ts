import { Ui } from '../ui.js';
import colors from 'colors';
import { SpinnerService } from '../../services/spinner.service.js';
import { interval, Subject, takeUntil } from 'rxjs';
import { INFO_MSGS } from '../../constants/messages.constants.js';
import {
  SPINNERS,
  SPINNER_INTERVAL,
} from '../../constants/spinner.constants.js';
import { UI_POSITIONS } from '../../constants/main.constants.js';
import { SearchState } from 'src/models/search-state.model.js';

export class StatusUi extends Ui {
  private text = '';
  private searchEnd$ = new Subject();

  constructor(
    private spinnerService: SpinnerService,
    private searchState: SearchState,
  ) {
    super();
  }

  start() {
    this.spinnerService.setSpinner(SPINNERS.W10);
    interval(SPINNER_INTERVAL)
      .pipe(takeUntil(this.searchEnd$))
      .subscribe(() => this.nextFrame());
  }

  completeSearch(duration: number) {
    this.searchEnd$.next(true);
    this.searchEnd$.complete();

    this.text =
      colors.green(INFO_MSGS.SEARCH_COMPLETED) + colors.gray(`${duration}s`);
    this.render();
  }

  render(): void {
    this.printAt(this.text, UI_POSITIONS.STATUS);
    this.renderProgressBar();
  }

  private renderProgressBar() {
    const {
      pendingSearchTasks,
      completedSearchTasks,
      completedStatsCalculation,
      pendingStatsCalculation,
    } = this.searchState;

    const barParts = {
      bg: colors.gray('🮂'),
      indexFind: colors.white('🮂'),
      calculatingTask: colors.blue('🮂'),
      completed: colors.green('🮂'),
    };

    const width = 25;
    const maxValue = pendingSearchTasks + completedSearchTasks;
    const maxDone = completedStatsCalculation + pendingStatsCalculation;
    let calculatingTaskLenght = (maxValue * width) / maxValue;
    let completedLenght = Math.round((completedSearchTasks * width) / maxValue);
    const doneLenght = Math.round(
      (completedStatsCalculation * completedLenght) / maxDone,
    );

    calculatingTaskLenght -= completedLenght;
    completedLenght -= doneLenght;

    // Debug
    // this.printAt(
    //   `V: ${maxValue},T: ${maxDone},C: ${pendingStatsCalculation},D:${completedStatsCalculation}   `,
    //   { x: 60, y: 5 },
    // );

    const progressBar =
      barParts.completed.repeat(doneLenght) +
      barParts.indexFind.repeat(completedLenght) +
      barParts.bg.repeat(calculatingTaskLenght);

    this.printAt(progressBar, { x: 50, y: 6 });
  }

  private nextFrame() {
    this.text = INFO_MSGS.SEARCHING + this.spinnerService.nextFrame();
    this.render();
  }
}
