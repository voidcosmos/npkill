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
  private barNormalizedWidth = 0;
  private SEARCH_STATES = {
    stopped: () => this.startingSearch(),
    scanning: () => this.continueSearching(),
    dead: () => this.fatalError(),
    finished: () => this.continueFinishing(),
  };

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
      .subscribe(() => {
        this.SEARCH_STATES[this.searchStatus.workerStatus]();
      });

    this.animateProgressBar();
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
    // easeInOut formula
    const modifier = -(Math.cos(Math.PI * this.barNormalizedWidth) - 1) / 2;

    const barSearchMax = pendingSearchTasks + completedSearchTasks;
    const barStatsMax = completedStatsCalculation + pendingStatsCalculation;

    let barLenght =
      proportional(barSearchMax, BAR_WIDTH, barSearchMax) || BAR_WIDTH;
    barLenght = Math.floor(barLenght * modifier);

    let searchBarLenght =
      proportional(completedSearchTasks, BAR_WIDTH, barSearchMax) || 0;
    searchBarLenght = Math.floor(searchBarLenght * modifier);

    let doneBarLenght =
      proportional(completedStatsCalculation, searchBarLenght, barStatsMax) ||
      0;
    doneBarLenght = Math.floor(doneBarLenght * modifier);

    barLenght -= searchBarLenght;
    searchBarLenght -= doneBarLenght;

    // Debug
    // this.printAt(
    //   `V: ${barSearchMax},T: ${barLenght},C: ${searchBarLenght},D:${doneBarLenght}   `,
    //   { x: 60, y: 5 },
    // );

    const progressBar =
      BAR_PARTS.completed.repeat(doneBarLenght) +
      BAR_PARTS.searchTask.repeat(searchBarLenght) +
      BAR_PARTS.bg.repeat(barLenght);

    this.printProgressBar(progressBar);
  }

  private animateProgressBar() {
    if (this.barNormalizedWidth > 1) {
      this.barNormalizedWidth = 1;
      return;
    }
    this.barNormalizedWidth += 0.05;

    this.renderProgressBar();
    setTimeout(() => this.animateProgressBar(), SPINNER_INTERVAL);
  }

  private printProgressBar(progressBar: string) {
    this.printAt(progressBar, UI_POSITIONS.STATUS_BAR);
  }

  private startingSearch() {
    this.text = INFO_MSGS.STARTING;
    this.render();
  }

  private continueSearching() {
    this.text = INFO_MSGS.SEARCHING + this.spinnerService.nextFrame();
    this.render();
  }

  private fatalError() {
    this.text = colors.red(INFO_MSGS.FATAL_ERROR);
    this.searchEnd$.next(true);
    this.searchEnd$.complete();
    this.render();
  }

  private continueFinishing() {
    this.text = INFO_MSGS.CALCULATING_STATS + this.spinnerService.nextFrame();
    this.render();
  }
}
