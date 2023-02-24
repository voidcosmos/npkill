import {
  DEFAULT_CONFIG,
  MIN_CLI_COLUMNS_SIZE,
  UI_POSITIONS,
} from './constants/index.js';
import { COLORS } from './constants/cli.constants.js';
import {
  ConsoleService,
  FileService,
  ResultsService,
  SpinnerService,
  UpdateService,
} from './services/index.js';
import { ERROR_MSG, INFO_MSGS } from './constants/messages.constants.js';
import {
  IConfig,
  IFolder,
  IKeyPress,
  IListDirParams,
} from './interfaces/index.js';
import { Observable, from } from 'rxjs';
import {
  catchError,
  filter,
  map,
  mergeMap,
  switchMap,
  tap,
} from 'rxjs/operators';

import { FOLDER_SORT } from './constants/sort.result.js';
import colors from 'colors';
import keypress from 'keypress';
import __dirname from './dirname.js';
import path from 'path';
import { homedir } from 'os';
import { HeaderUi } from './ui/header/header.ui.js';
import { UiService } from './services/ui.service.js';
import { ResultsUi } from './ui/results.ui.js';
import { GeneralUi } from './ui/general.ui.js';
import { HelpUi } from './ui/help.ui.js';
import { StatsUi } from './ui/header/stats.ui.js';
import { StatusUi } from './ui/header/status.ui.js';
import { LoggerService } from './services/logger.service.js';
import { LogsUi } from './ui/logs.ui.js';
import { InteractiveUi } from './ui/ui.js';

export class Controller {
  private folderRoot = '';
  private stdout: NodeJS.WriteStream = process.stdout;
  private config: IConfig = DEFAULT_CONFIG;

  private searchStart: number;
  private searchDuration: number;

  private uiHeader: HeaderUi;
  private uiGeneral: GeneralUi;
  private uiStats: StatsUi;
  private uiStatus: StatusUi;
  private uiResults: ResultsUi;
  private uiLogs: LogsUi;
  private activeComponent: InteractiveUi;

  constructor(
    private logger: LoggerService,
    private fileService: FileService,
    private spinnerService: SpinnerService,
    private consoleService: ConsoleService,
    private updateService: UpdateService,
    private resultsService: ResultsService,
    private uiService: UiService,
  ) {}

  init(): void {
    this.logger.info(process.argv.join(' '));
    this.logger.info(`Npkill started! v${this.getVersion()}`);
    this.initUi();
    if (this.consoleService.isRunningBuild()) {
      this.uiHeader.programVersion = this.getVersion();
    }

    keypress(process.stdin);
    this.setErrorEvents();
    this.getArguments();
    this.prepareScreen();
    this.setupEventsListener();
    this.uiStatus.start();
    if (this.config.checkUpdates) this.checkVersion();

    this.scan();
  }

  private initUi() {
    this.uiHeader = new HeaderUi();
    this.uiService.add(this.uiHeader);
    this.uiResults = new ResultsUi(
      this.resultsService,
      this.consoleService,
      this.fileService,
    );
    this.uiService.add(this.uiResults);
    this.uiStats = new StatsUi(this.config, this.resultsService, this.logger);
    this.uiService.add(this.uiStats);
    this.uiStatus = new StatusUi(this.spinnerService);
    this.uiService.add(this.uiStatus);
    this.uiGeneral = new GeneralUi();
    this.uiService.add(this.uiGeneral);
    this.uiLogs = new LogsUi(this.logger);
    this.uiService.add(this.uiLogs);

    // Set Events
    this.uiResults.delete$.subscribe((folder) => this.deleteFolder(folder));
    this.uiResults.showErrors$.subscribe(() => this.showErrorPopup(true));
    this.uiLogs.close$.subscribe(() => this.showErrorPopup(false));

    // Activate the main interactive component
    this.activeComponent = this.uiResults;
  }

  private getArguments(): void {
    const options = this.consoleService.getParameters(process.argv);
    if (options['help']) {
      this.showHelp();
      process.exit();
    }
    if (options['version']) {
      this.showProgramVersion();
      process.exit();
    }
    if (options['delete-all']) {
      this.showObsoleteMessage();
      process.exit();
    }
    if (options['sort-by']) {
      if (!this.isValidSortParam(options['sort-by'])) {
        this.invalidSortParam();
      }
      this.config.sortBy = options['sort-by'];
    }

    const exclude = options['exclude'];

    if (exclude && typeof exclude === 'string') {
      this.config.exclude = this.consoleService
        .splitData(this.consoleService.replaceString(exclude, '"', ''), ',')
        .map((file) => file.trim())
        .filter(Boolean);
    }

    this.folderRoot = options['directory']
      ? options['directory']
      : process.cwd();
    if (options['full-scan']) this.folderRoot = homedir();
    if (options['hide-errors']) this.config.showErrors = false;
    if (options['gb']) this.config.folderSizeInGB = true;
    if (options['no-check-updates']) this.config.checkUpdates = false;
    if (options['target-folder'])
      this.config.targetFolder = options['target-folder'];
    if (options['bg-color']) this.setColor(options['bg-color']);
    if (options['exclude-hidden-directories'])
      this.config.excludeHiddenDirectories = true;

    // Remove trailing slash from folderRoot for consistency
    this.folderRoot = this.folderRoot.replace(/[\/\\]$/, '');
  }

  private showErrorPopup(visible: boolean) {
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
    process.exit();
  }

  private showHelp(): void {
    new HelpUi(this.consoleService).show();
  }

  private showProgramVersion(): void {
    this.uiService.print('v' + this.getVersion());
  }

  private showObsoleteMessage(): void {
    this.uiService.print(INFO_MSGS.DISABLED);
  }

  private setColor(color: string) {
    if (this.isValidColor(color)) this.config.backgroundColor = COLORS[color];
  }

  private isValidColor(color: string) {
    return Object.keys(COLORS).some((validColor) => validColor === color);
  }

  private isValidSortParam(sortName: string): boolean {
    return Object.keys(FOLDER_SORT).includes(sortName);
  }

  private getVersion(): string {
    const packageJson = __dirname + '/../package.json';

    const packageData = JSON.parse(
      this.fileService.getFileContent(packageJson),
    );
    return packageData.version;
  }

  private prepareScreen(): void {
    this.checkScreenRequirements();
    this.uiService.setRawMode();
    this.uiService.prepareUi();
    this.uiService.setCursorVisible(false);
    this.uiService.clear();
    this.uiService.renderAll();
  }

  private checkScreenRequirements(): void {
    if (this.isTerminalTooSmall()) {
      this.uiService.print(INFO_MSGS.MIN_CLI_CLOMUNS);
      process.exit();
    }
    if (!this.stdout.isTTY) {
      this.uiService.print(INFO_MSGS.NO_TTY);
      process.exit();
    }
  }

  private checkVersion(): void {
    this.logger.info('Checking updates...');
    this.updateService
      .isUpdated(this.getVersion())
      .then((isUpdated: boolean) => {
        if (isUpdated) {
          this.showUpdateMessage();
          this.logger.info('New version found!');
        } else {
          this.logger.info('Npkill is update');
        }
      })
      .catch((err) => {
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

  private printNoResults(): void {}

  private setupEventsListener(): void {
    this.uiService.stdin.on('keypress', (ch, key) => {
      if (key && key['name']) this.keyPress(key);
    });

    this.stdout.on('resize', () => {
      this.uiService.clear();
      this.uiService.renderAll();
      this.uiService.renderAll();
    });
  }

  private keyPress(key: IKeyPress) {
    const { name, ctrl } = key;

    if (this.isQuitKey(ctrl, name)) this.quit();

    if (!this.activeComponent) {
      this.logger.error('activeComponent is NULL in Controller.');
      return;
    }

    this.activeComponent.onKeyInput(key);
  }

  private setErrorEvents(): void {
    process.on('uncaughtException', (err) => {
      this.newError(err.message);
    });
    process.on('unhandledRejection', (reason: {}) => {
      this.newError(reason['stack']);
    });
  }

  private scan(): void {
    const params: IListDirParams = this.prepareListDirParams();
    const isChunkCompleted = (chunk: string) =>
      chunk.endsWith(this.config.targetFolder + '\n');

    const isExcludedDangerousDirectory = (path: string): boolean =>
      this.config.excludeHiddenDirectories &&
      this.fileService.isDangerous(path);

    this.searchStart = Date.now();
    const folders$ = this.fileService.listDir(params);

    this.logger.info(`Scan started in ${params.path}`);
    folders$
      .pipe(
        catchError((error, caught) => {
          this.newError(error.message);
          return caught;
        }),
        mergeMap((dataFolder) =>
          from(this.consoleService.splitData(dataFolder)),
        ),
        filter((path) => !!path),
        filter((path) => !isExcludedDangerousDirectory(path)),
        map<string, IFolder>((path) => {
          return {
            path,
            size: 0,
            modificationTime: null,
            isDangerous: this.fileService.isDangerous(path),
            status: 'live',
          };
        }),
        tap((nodeFolder) => {
          this.resultsService.addResult(nodeFolder);
          this.logger.info(`Folder found: ${nodeFolder.path}`);

          if (this.config.sortBy === 'path') {
            this.resultsService.sortResults(this.config.sortBy);
            this.uiResults.clear();
          }
        }),
        mergeMap((nodeFolder) => this.calculateFolderStats(nodeFolder), 2),
      )
      .subscribe(
        () => this.printFoldersSection(),
        (error) => this.newError(error),
        () => this.completeSearch(),
      );
  }

  private prepareListDirParams(): IListDirParams {
    const target = this.config.targetFolder;
    const params = {
      path: this.folderRoot,
      target,
    };

    if (this.config.exclude.length > 0) {
      params['exclude'] = this.config.exclude;
    }

    return params;
  }

  private calculateFolderStats(nodeFolder: IFolder): Observable<void> {
    this.logger.info(`Calculating stats for ${nodeFolder.path}`);
    return this.fileService.getFolderSize(nodeFolder.path).pipe(
      tap((size) => {
        nodeFolder.size = this.fileService.convertKbToGB(+size);
        this.logger.info(`Size of ${nodeFolder.path}: ${size}kb`);
      }),
      switchMap(async () => {
        // Saves resources by not scanning a result that is probably not of interest
        if (nodeFolder.isDangerous) {
          nodeFolder.modificationTime = null;
          return;
        }
        const parentFolder = path.join(nodeFolder.path, '../');
        const result = await this.fileService.getRecentModificationInDir(
          parentFolder,
        );
        nodeFolder.modificationTime = result;
        this.logger.info(`Last mod. of ${nodeFolder.path}: ${result}`);
      }),
      tap(() => this.finishFolderStats()),
    );
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
    this.uiStatus.completeSearch(this.searchDuration);
    this.logger.info(`Search completed after ${this.searchDuration}s`);
    if (!this.resultsService.results.length) this.showNoResults();
  }

  private setSearchDuration() {
    this.searchDuration = +((Date.now() - this.searchStart) / 1000).toFixed(2);
  }

  private showNoResults() {
    this.resultsService.noResultsAfterCompleted = true;
    this.printNoResults();
  }

  private isQuitKey(ctrl, name): boolean {
    return (ctrl && name === 'c') || name === 'q';
  }

  private quit(): void {
    this.uiService.setRawMode(false);
    this.uiService.clear();
    this.uiService.setCursorVisible(true);
    this.printExitMessage();
    this.logger.info('Thank for using npkill. Bye!');
    const logPath = this.logger.getSuggestLogfilePath();
    this.logger.saveToFile(logPath);
    process.exit();
  }

  private printExitMessage(): void {
    const { spaceReleased } = this.resultsService.getStats();
    new GeneralUi().printExitMessage({ spaceReleased });
  }

  private deleteFolder(folder: IFolder): void {
    const isSafeToDelete = this.fileService.isSafeToDelete(
      folder.path,
      this.config.targetFolder,
    );

    if (!isSafeToDelete) {
      this.newError(`Folder not safe to delete: ${folder.path}`);
      return;
    }

    this.logger.info(`Deleting ${folder.path}`);
    folder.status = 'deleting';
    this.printFoldersSection();

    this.fileService
      .deleteDir(folder.path)
      .then(() => {
        folder.status = 'deleted';
        this.uiStats.render();
        this.printFoldersSection();
        this.logger.info(`Deleted ${folder.path}`);
      })
      .catch((e) => {
        folder.status = 'error-deleting';
        this.printFoldersSection();
        this.newError(e.message);
      });
  }

  private newError(error: string): void {
    this.logger.error(error);
    this.uiStats.render();
  }
}
