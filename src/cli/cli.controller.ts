import {
  ConsoleService,
  ProfilesService,
  ResultsService,
  SpinnerService,
  UpdateService,
} from './services/index.js';
import {
  DEFAULT_CONFIG,
  DEFAULT_PROFILE,
  MIN_CLI_COLUMNS_SIZE,
  UI_POSITIONS,
} from '../constants/index.js';
import { ERROR_MSG, INFO_MSGS } from '../constants/messages.constants.js';
import { IConfig, CliScanFoundFolder, IKeyPress } from './interfaces/index.js';
import { firstValueFrom, Subject } from 'rxjs';
import { map, mergeMap, tap } from 'rxjs/operators';

import { COLORS } from '../constants/cli.constants.js';
import { FOLDER_SORT } from '../constants/sort.result.js';
import {
  StatusUi,
  StatsUi,
  ResultsUi,
  LogsUi,
  InteractiveUi,
  HelpCommandUi,
  HeaderUi,
  GeneralUi,
  WarningUi,
  OptionsUi,
  HelpUi,
} from './ui/index.js';
import { MENU_BAR_OPTIONS } from './ui/components/header/header-ui.constants.js';

import { UiService } from './services/ui.service.js';
import _dirname from '../dirname.js';
import colors from 'colors';
import { homedir } from 'os';
import path from 'path';
import openExplorer from 'open-file-explorer';
import { Npkill } from '../core/index.js';
import { LoggerService } from '../core/services/logger.service.js';
import { ScanStatus } from '../core/interfaces/search-status.model.js';
import { isSafeToDelete } from '../utils/is-safe-to-delete.js';
import { getFileContent } from '../utils/get-file-content.js';
import { ResultDetailsUi } from './ui/components/result-details.ui.js';
import { ScanService } from './services/scan.service.js';
import { JsonOutputService } from './services/json-output.service.js';

export class CliController {
  private readonly config: IConfig = DEFAULT_CONFIG;

  private searchStart: number;
  private searchDuration: number;

  private uiHeader: HeaderUi;
  private uiGeneral: GeneralUi;
  private uiStats: StatsUi;
  private uiStatus: StatusUi;
  private uiResults: ResultsUi;
  private uiLogs: LogsUi;
  private uiWarning: WarningUi;
  private activeComponent: InteractiveUi | null = null;

  constructor(
    private readonly stdout: NodeJS.WriteStream,
    private readonly npkill: Npkill,
    private readonly logger: LoggerService,
    private readonly searchStatus: ScanStatus,
    private readonly resultsService: ResultsService,
    private readonly spinnerService: SpinnerService,
    private readonly consoleService: ConsoleService,
    private readonly updateService: UpdateService,
    private readonly uiService: UiService,
    private readonly scanService: ScanService,
    private readonly jsonOutputService: JsonOutputService,
    private readonly profilesService: ProfilesService,
  ) {}

  init(): void {
    this.logger.info(`Npkill CLI started! v${this.getVersion()}`);

    this.parseArguments();

    if (this.config.jsonStream) {
      this.logger.info('JSON stream mode enabled.');
      this.setupJsonModeSignalHandlers();
      this.scan();
      return;
    }

    if (this.config.jsonSimple) {
      this.logger.info('JSON simple mode enabled.');
      this.setupJsonModeSignalHandlers();
      this.scan();
      return;
    }

    this.initUi();
    if (this.consoleService.isRunningBuild()) {
      this.uiHeader.programVersion = this.getVersion();
    }

    this.consoleService.startListenKeyEvents();
    this.checkRequirements();
    this.prepareScreen();
    this.setupEventsListener();
    if (this.config.checkUpdates) {
      this.checkVersion();
    }

    if (this.config.deleteAll && !this.config.yes) {
      this.showDeleteAllWarning();
      this.uiWarning.confirm$
        .pipe(
          tap(() => {
            this.activeComponent = this.uiResults;
            this.uiWarning.setDeleteAllWarningVisibility(false);
            this.uiService.renderAll();
            this.scan();
          }),
        )
        .subscribe();
      return;
    }

    this.scan();
  }

  private showDeleteAllWarning(): void {
    this.uiWarning.setDeleteAllWarningVisibility(true);
    this.activeComponent = this.uiWarning;
  }

  private initUi(): void {
    this.uiHeader = new HeaderUi(this.config);
    this.uiService.add(this.uiHeader);
    this.uiResults = new ResultsUi(this.resultsService, this.consoleService);
    this.uiService.add(this.uiResults);
    this.uiStats = new StatsUi(this.config, this.resultsService, this.logger);
    this.uiService.add(this.uiStats);
    this.uiStatus = new StatusUi(this.spinnerService, this.searchStatus);
    this.uiService.add(this.uiStatus);
    this.uiGeneral = new GeneralUi();
    this.uiService.add(this.uiGeneral);
    this.uiLogs = new LogsUi(this.logger);
    this.uiService.add(this.uiLogs);
    this.uiWarning = new WarningUi();
    this.uiService.add(this.uiWarning);

    // Set Events
    this.uiResults.delete$.subscribe((folder) => this.deleteFolder(folder));
    this.uiResults.showErrors$.subscribe(() => this.showErrorPopup(true));
    this.uiLogs.close$.subscribe(() => this.showErrorPopup(false));
    this.uiResults.openFolder$.subscribe((path) => openExplorer(path));
    this.uiResults.showDetails$.subscribe((folder) =>
      this.openResultsDetails(folder),
    );
    this.uiResults.endNpkill$.subscribe(() => this.quit());
    this.uiResults.goOptions$.subscribe(() => this.openOptions());

    // Activate the main interactive component
    this.activeComponent = this.uiResults;
  }

  private openOptions(): void {
    const changeConfig$ = new Subject<Partial<IConfig>>();
    const optionsUi = new OptionsUi(changeConfig$, this.config);
    this.uiResults.clear();
    this.uiResults.setVisible(false);
    this.uiService.add(optionsUi);
    this.activeComponent = optionsUi;
    this.uiHeader.menuIndex$.next(MENU_BAR_OPTIONS.OPTIONS);
    this.uiService.renderAll();

    changeConfig$.subscribe((configChanges) => {
      Object.assign(this.config, configChanges);
      if (
        configChanges.targets ||
        configChanges.folderRoot ||
        configChanges.excludeHiddenDirectories ||
        configChanges.exclude
      ) {
        this.scan();
      }
      if (configChanges.sortBy) {
        this.resultsService.sortResults(configChanges.sortBy);
      }
      if (configChanges.sizeUnit) {
        this.resultsService.setSizeUnit(configChanges.sizeUnit);
      }
      this.logger.info(`Config updated: ${JSON.stringify(configChanges)}`);
      this.uiService.renderAll();
    });

    optionsUi.goToHelp$.subscribe(() => {
      const helpUi = new HelpUi();
      this.uiService.add(helpUi);
      this.activeComponent = helpUi;
      optionsUi.clear();
      optionsUi.setVisible(false);
      this.uiHeader.menuIndex$.next(MENU_BAR_OPTIONS.HELP);
      this.uiService.renderAll();
      helpUi.render();
      helpUi.goToOptions$.subscribe(() => {
        helpUi.clear();
        this.activeComponent = optionsUi;
        this.uiService.remove(helpUi.id);
        optionsUi.clear();
        optionsUi.setVisible(true);
        this.uiHeader.menuIndex$.next(MENU_BAR_OPTIONS.OPTIONS);
        this.uiService.renderAll();
      });
    });

    optionsUi.goBack$.subscribe(() => {
      optionsUi.clear();
      this.activeComponent = this.uiResults;
      this.uiService.remove(optionsUi.id);
      this.uiResults.clear();
      this.uiResults.setVisible(true);
      this.uiHeader.menuIndex$.next(MENU_BAR_OPTIONS.DELETE);
      this.uiService.renderAll();
    });
  }

  private openResultsDetails(folder: CliScanFoundFolder): void {
    const detailsUi = new ResultDetailsUi(folder, this.config);
    this.uiResults.clear();
    this.uiResults.setVisible(false);

    this.uiService.add(detailsUi);
    this.activeComponent = detailsUi;
    // detailsUi.render();
    this.uiHeader.menuIndex$.next(MENU_BAR_OPTIONS.INFO);
    this.uiService.renderAll();

    detailsUi.openFolder$.subscribe((path) => openExplorer(path));
    detailsUi.goBack$.subscribe(() => {
      detailsUi.clear();
      this.activeComponent = this.uiResults;
      this.uiService.remove(detailsUi.id);
      this.uiResults.clear();
      this.uiResults.setVisible(true);
      this.uiHeader.menuIndex$.next(MENU_BAR_OPTIONS.DELETE);
      this.uiService.renderAll();
    });
  }

  private parseArguments(): void {
    const options = this.consoleService.getParameters(process.argv);
    if (options.isTrue('help')) {
      this.showHelp();
      // eslint-disable-next-line n/no-process-exit
      process.exit(0);
    }
    if (options.isTrue('version')) {
      this.showProgramVersion();
      // eslint-disable-next-line n/no-process-exit
      process.exit(0);
    }

    if (options.isTrue('profiles') && options.isTrue('target-folder')) {
      console.log(
        'Cannot use both --profiles and --target-folder options together.',
      );
      process.exit(0);
    }

    if (
      options.isTrue('profiles') &&
      options.getStrings('profiles').length === 0
    ) {
      // TODO check user defined
      const defaultProfile = DEFAULT_PROFILE;
      console.log(
        colors.bold(colors.bgYellow(colors.black(' Available profiles '))),
      );
      console.log(
        `Remember: ${colors.bold(colors.yellow('context matters'))}. What's safe to remove in one project or ecosystem could be important in another.\n`,
      );
      console.log(
        this.profilesService.getAvailableProfilesToPrint(defaultProfile),
      );
      process.exit(0);
    }

    if (options.isTrue('delete-all')) {
      if (!options.isTrue('target-folder') || options.isTrue('profiles')) {
        // TODO mejorar mensaje e incluir tip buscar lista targets de un profile.
        console.log('--delete-all only can be used with --target-folder.');
        process.exit(1);
      }
      this.config.deleteAll = true;
    }

    if (options.isTrue('sort-by')) {
      if (!this.isValidSortParam(options.getString('sort-by'))) {
        this.invalidSortParam();
      }
      this.config.sortBy = options.getString('sort-by');
    }

    const exclude = options.getString('exclude');

    if (exclude !== undefined && exclude !== '') {
      console.log('EXCLUDE', exclude);
      const userExcludeList = this.consoleService
        .splitData(this.consoleService.replaceString(exclude, '"', ''), ',')
        .map((path) => path.trim())
        .filter(Boolean)
        .map(path.normalize);

      // Add custom filters to the default exclude list.
      this.config.exclude = [...this.config.exclude, ...userExcludeList];
    }

    this.config.folderRoot = options.isTrue('directory')
      ? options.getString('directory')
      : process.cwd();
    if (options.isTrue('full-scan')) {
      this.config.folderRoot = homedir();
    }
    if (options.isTrue('hide-errors')) {
      this.config.showErrors = false;
    }
    if (options.isTrue('size-unit')) {
      const sizeUnit = options.getString('size-unit');
      if (this.isValidSizeUnit(sizeUnit)) {
        this.config.sizeUnit = sizeUnit as 'auto' | 'mb' | 'gb';
      } else {
        this.invalidSizeUnitParam();
        return;
      }
    }
    if (options.isTrue('no-check-updates')) {
      this.config.checkUpdates = false;
    }

    if (!options.isTrue('target-folder')) {
      if (!options.isTrue('profiles')) {
        this.logger.info(`Using default profile targets (${DEFAULT_PROFILE})`);
        this.config.targets = this.profilesService.getTargetsFromProfiles([
          DEFAULT_PROFILE,
        ]);
      } else {
        const selectedProfiles = options.getStrings('profiles');
        const badProfiles =
          this.profilesService.getBadProfiles(selectedProfiles);

        if (badProfiles.length > 0) {
          this.logger.warn(
            `The following profiles are invalid: ${badProfiles.join(', ')}`,
          );
          const profileText = badProfiles.length > 1 ? 'profiles' : 'profile';
          console.log(
            colors.bold(colors.bgRed(colors.white(` Invalid ${profileText} `))),
          );
          console.log(
            `The following ${profileText} are invalid: ${colors.red(badProfiles.join(', '))}.`,
          );
          console.log(
            `You can list the available profiles with ${colors.bold(colors.green('--profiles'))} command ${colors.gray('(without arguments)')}.`,
          );
          process.exit(1);
        }

        const targets =
          this.profilesService.getTargetsFromProfiles(selectedProfiles);
        this.logger.info(
          `Using profiles ${selectedProfiles.join(', ')} | With targets ${targets.join(', ')}`,
        );
        this.config.profiles = selectedProfiles;
        this.config.targets = targets;
      }
    }

    if (options.isTrue('target-folder')) {
      this.config.targets = options.getString('target-folder').split(',');
    }
    if (options.isTrue('bg-color')) {
      this.setColor(options.getString('bg-color'));
    }
    if (options.isTrue('exclude-hidden-directories')) {
      this.config.excludeHiddenDirectories = true;
    }

    if (options.isTrue('dry-run')) {
      this.config.dryRun = true;
    }

    if (options.isTrue('yes')) {
      this.config.yes = true;
    }

    if (options.isTrue('jsonStream')) {
      this.config.jsonStream = true;
    }

    if (options.isTrue('jsonSimple')) {
      this.config.jsonSimple = true;
    }

    if (this.config.jsonStream && this.config.jsonSimple) {
      this.logger.error(ERROR_MSG.CANT_USE_BOTH_JSON_OPTIONS);
      this.exitWithError();
    }

    // Remove trailing slash from folderRoot for consistency
    this.config.folderRoot = this.config.folderRoot.replace(/[/\\]$/, '');
  }

  private showErrorPopup(visible: boolean): void {
    this.uiLogs.setVisible(visible);
    // Need convert to pattern and have a stack for recover latest
    // component.
    this.uiResults.freezed = visible;
    this.uiStats.freezed = visible;
    this.uiStatus.freezed = visible;
    if (visible) {
      this.activeComponent = this.uiLogs;
      this.uiLogs.render();
    } else {
      this.activeComponent = this.uiResults;
      this.uiService.renderAll();
    }
  }

  private invalidSortParam(): void {
    this.uiService.print(INFO_MSGS.NO_VALID_SORT_NAME);
    this.logger.error(INFO_MSGS.NO_VALID_SORT_NAME);
    this.exitWithError();
  }

  private showHelp(): void {
    new HelpCommandUi(this.consoleService).show();
  }

  private showProgramVersion(): void {
    this.uiService.print('v' + this.getVersion());
  }

  private setColor(color: string): void {
    if (this.isValidColor(color)) {
      this.config.backgroundColor = COLORS[color];
    }
  }

  private isValidColor(color: string): boolean {
    return Object.keys(COLORS).some((validColor) => validColor === color);
  }

  private isValidSortParam(sortName: string): boolean {
    return Object.keys(FOLDER_SORT).includes(sortName);
  }

  private isValidSizeUnit(sizeUnit: string): boolean {
    return ['auto', 'mb', 'gb'].includes(sizeUnit);
  }

  private invalidSizeUnitParam(): void {
    this.uiService.print(INFO_MSGS.NO_VALID_SIZE_UNIT);
    this.logger.error(INFO_MSGS.NO_VALID_SIZE_UNIT);
    this.exitWithError();
  }

  private getVersion(): string {
    const packageJson = _dirname + '/../package.json';

    const packageData = JSON.parse(getFileContent(packageJson));
    return packageData.version;
  }

  private prepareScreen(): void {
    this.uiService.setRawMode();
    // this.uiService.prepareUi();
    this.uiService.setCursorVisible(false);
    this.uiService.clear();
    this.uiService.renderAll();
  }

  private checkRequirements(): void {
    this.checkScreenRequirements();
    this.checkFileRequirements();
  }

  private checkScreenRequirements(): void {
    if (this.isTerminalTooSmall()) {
      this.uiService.print(INFO_MSGS.MIN_CLI_CLOMUNS);
      this.logger.error(INFO_MSGS.MIN_CLI_CLOMUNS);
      this.exitWithError();
    }
    if (!this.stdout.isTTY) {
      this.uiService.print(INFO_MSGS.NO_TTY);
      this.logger.error(INFO_MSGS.NO_TTY);
      this.exitWithError();
    }
  }

  private checkFileRequirements(): void {
    const result = this.npkill.isValidRootFolder(this.config.folderRoot);
    if (!result.isValid) {
      const errorMessage =
        result.invalidReason || 'Root folder is not valid. Unknown reason';
      this.uiService.print(errorMessage);
      this.logger.error(errorMessage);
      this.exitWithError();
    }
  }

  private checkVersion(): void {
    this.logger.info('Checking updates...');
    this.updateService
      .isUpdated(this.getVersion())
      .then((isUpdated: boolean) => {
        if (!isUpdated) {
          this.showUpdateMessage();
          this.logger.info('New version found!');
        } else {
          this.logger.info('Npkill is update');
        }
        return isUpdated;
      })
      .catch((err: Error) => {
        const errorMessage =
          ERROR_MSG.CANT_GET_REMOTE_VERSION + ': ' + err.message;
        this.newError(errorMessage);
      });
  }

  private showUpdateMessage(): void {
    const message = colors.magenta(INFO_MSGS.NEW_UPDATE_FOUND);
    this.uiService.printAt(message, UI_POSITIONS.NEW_UPDATE_FOUND);
  }

  private isTerminalTooSmall(): boolean {
    return this.stdout.columns <= MIN_CLI_COLUMNS_SIZE;
  }

  private printFoldersSection(): void {
    this.uiResults.render();
  }

  private setupEventsListener(): void {
    this.uiService.stdin.on('keypress', (_, key: IKeyPress) => {
      if (key['name'] !== '') {
        this.keyPress(key);
      } else {
        throw new Error('Invalid key: ' + JSON.stringify(key));
      }
    });

    this.stdout.on('resize', () => {
      this.uiService.clear();
      this.uiService.renderAll();
    });

    process.on('uncaughtException', (error: Error) => {
      this.newError(error.message);
    });

    process.on('unhandledRejection', (error: Error) => {
      this.newError(error.stack ?? error.message);
    });
  }

  private keyPress(key: IKeyPress): void {
    const { name, ctrl } = key;

    if (this.isQuitKey(ctrl, name)) {
      this.quit();
    }

    if (this.activeComponent === null) {
      this.logger.error('activeComponent is NULL in Controller.');
      return;
    }

    this.activeComponent.onKeyInput(key);
  }

  private scan(): void {
    this.initializeScan();

    const shouldOutputInJson = this.config.jsonSimple || this.config.jsonStream;

    if (shouldOutputInJson) {
      this.scanInJson();
    } else {
      this.scanInUiMode();
    }
  }

  private initializeScan(): void {
    this.searchStatus.reset();
    this.resultsService.reset();
    this.resultsService.setSizeUnit(this.config.sizeUnit);
  }

  private scanInJson(): void {
    const isStreamMode = this.config.jsonStream;
    this.jsonOutputService.initializeSession(isStreamMode);

    this.scanService
      .scan(this.config)
      .pipe(
        mergeMap((nodeFolder) =>
          this.scanService.calculateFolderStats(nodeFolder, {
            getModificationTimeForSensitiveResults: true,
          }),
        ),
        tap((folder) => this.jsonOutputService.processResult(folder)),
      )
      .subscribe({
        error: (error) => this.jsonOutputService.writeError(error),
        complete: () => {
          this.jsonOutputService.completeScan();
          process.exit(0);
        },
      });
  }

  private scanInUiMode(): void {
    this.uiStatus.reset();
    this.uiStatus.start();
    this.searchStart = Date.now();

    this.scanService
      .scan(this.config)
      .pipe(
        tap((nodeFolder) => this.processNodeFolderForUi(nodeFolder)),
        mergeMap((nodeFolder) =>
          this.scanService.calculateFolderStats(nodeFolder),
        ),
        tap((folder) => this.processFolderStatsForUi(folder)),
      )
      .subscribe({
        next: () => this.printFoldersSection(),
        error: (error) => this.newError(error),
        complete: () => this.completeSearch(),
      });
  }

  private setupJsonModeSignalHandlers(): void {
    const gracefulShutdown = () => {
      this.jsonOutputService.handleShutdown();
      process.exit(0);
    };

    process.on('SIGINT', gracefulShutdown);
    process.on('SIGTERM', gracefulShutdown);
  }

  private processNodeFolderForUi(nodeFolder: CliScanFoundFolder): void {
    this.searchStatus.newResult();
    this.resultsService.addResult(nodeFolder);

    if (this.config.sortBy === 'path') {
      this.resultsService.sortResults(this.config.sortBy);
      this.uiResults.clear();
    }

    this.uiResults.render();
  }

  private processFolderStatsForUi(folder: CliScanFoundFolder): void {
    this.searchStatus.completeStatCalculation();
    this.finishFolderStats();

    if (this.config.deleteAll) {
      this.deleteFolder(folder);
    }
  }

  private finishFolderStats(): void {
    const needSort =
      this.config.sortBy === 'size' || this.config.sortBy === 'last-mod';
    if (needSort) {
      this.resultsService.sortResults(this.config.sortBy);
      this.uiResults.clear();
    }
    this.uiStats.render();
    this.printFoldersSection();
  }

  private completeSearch(): void {
    this.setSearchDuration();
    this.uiResults.completeSearch();
    this.uiStatus.completeSearch(this.searchDuration);
  }

  private setSearchDuration(): void {
    this.searchDuration = +((Date.now() - this.searchStart) / 1000).toFixed(2);
  }

  private isQuitKey(ctrl: boolean, name: string): boolean {
    return ctrl && name === 'c';
  }

  private exitWithError(): void {
    this.uiService.print('\n');
    this.uiService.setRawMode(false);
    this.uiService.setCursorVisible(true);
    const logPath = this.logger.getSuggestLogFilePath();
    this.logger.saveToFile(logPath);
    // eslint-disable-next-line n/no-process-exit
    process.exit(1);
  }

  private quit(): void {
    this.uiService.setRawMode(false);
    this.uiService.clear();
    this.uiService.setCursorVisible(true);
    this.printExitMessage();
    this.logger.info('Thank for using npkill. Bye!');
    const logPath = this.logger.getSuggestLogFilePath();
    this.logger.saveToFile(logPath);
    // eslint-disable-next-line n/no-process-exit
    process.exit(0);
  }

  private printExitMessage(): void {
    const { spaceReleased } = this.resultsService.getStats();
    new GeneralUi().printExitMessage({ spaceReleased });
  }

  private deleteFolder(folder: CliScanFoundFolder): void {
    if (folder.status === 'deleted' || folder.status === 'deleting') {
      return;
    }

    if (!isSafeToDelete(folder.path, this.config.targets)) {
      this.newError(`Folder not safe to delete: ${String(folder.path)}`);
      return;
    }

    folder.status = 'deleting';
    this.searchStatus.pendingDeletions++;
    this.uiStatus.render();
    this.printFoldersSection();

    firstValueFrom(
      this.npkill.delete$(String(folder.path), { dryRun: this.config.dryRun }),
    )
      .then(() => {
        folder.status = 'deleted';
        this.searchStatus.pendingDeletions--;
        this.uiStats.render();
        this.uiStatus.render();
        this.printFoldersSection();
        return folder;
      })
      .catch((e) => {
        folder.status = 'error-deleting';
        this.searchStatus.pendingDeletions--;
        this.uiStatus.render();
        this.printFoldersSection();
        this.newError(e.message);
      });
  }

  private newError(error: string): void {
    this.logger.error(error);
    this.uiStats.render();
  }
}
