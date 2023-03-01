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
import { SearchStatus } from '../../models/search-state.model.js';
import { BAR_PARTS, BAR_WIDTH } from '../../constants/status.constants.js';

export class StatusUi extends Ui {
  private text = '';
  private searchEnd$ = new Subject();

  constructor(
    private spinnerService: SpinnerService,
    private searchStatus: SearchStatus,
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
    } = this.searchStatus;

    const proportional = (a: number, b: number, c: number) => (a * b) / c;
    const printProgressBar = (progressBar: string) =>
      this.printAt(progressBar, UI_POSITIONS.STATUS_BAR);

    const barSearchMax = pendingSearchTasks + completedSearchTasks;
    const barStatsMax = completedStatsCalculation + pendingStatsCalculation;

    if (barSearchMax === 0) {
      printProgressBar(BAR_PARTS.bg.repeat(BAR_WIDTH));
      return;
    }

    let barLenght = proportional(barSearchMax, BAR_WIDTH, barSearchMax);

    let searchBarLenght = Math.round(
      proportional(completedSearchTasks, BAR_WIDTH, barSearchMax),
    );
    const doneBarLenght = Math.round(
      proportional(completedStatsCalculation, searchBarLenght, barStatsMax),
    );

    barLenght -= searchBarLenght;
    searchBarLenght -= doneBarLenght;

    // Debug
    // this.printAt(
    //   `V: ${maxValue},T: ${maxDone},C: ${pendingStatsCalculation},D:${completedStatsCalculation}   `,
    //   { x: 60, y: 5 },
    // );

    const progressBar =
      BAR_PARTS.completed.repeat(doneBarLenght) +
      BAR_PARTS.searchTask.repeat(searchBarLenght) +
      BAR_PARTS.bg.repeat(barLenght);

    printProgressBar(progressBar);
  }

  private nextFrame() {
    this.text = INFO_MSGS.SEARCHING + this.spinnerService.nextFrame();
    this.render();
  }
}
