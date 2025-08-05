import { IConfig } from '../cli/interfaces/index.js';

export const MIN_CLI_COLUMNS_SIZE = 60;
export const CURSOR_SIMBOL = '~>';
export const WIDTH_OVERFLOW = '...';
export const DEFAULT_SIZE = '0 MB';
export const DECIMALS_SIZE = 2;
export const OVERFLOW_CUT_FROM = 11;

export const DEFAULT_CONFIG: IConfig = {
  folderRoot: '',
  backgroundColor: 'bgBlue',
  warningColor: 'brightYellow',
  checkUpdates: true,
  deleteAll: false,
  dryRun: false,
  exclude: ['.git'],
  excludeHiddenDirectories: false,
  folderSizeInGB: false,
  maxSimultaneousSearch: 6,
  showErrors: true,
  sortBy: 'none',
  targets: ['node_modules'],
  yes: false,
  jsonStream: false,
};

export const MARGINS = {
  FOLDER_COLUMN_END: 19,
  FOLDER_COLUMN_START: 1,
  FOLDER_SIZE_COLUMN: 10,
  ROW_RESULTS_START: 8,
};

export const UI_HELP = {
  X_COMMAND_OFFSET: 3,
  X_DESCRIPTION_OFFSET: 27,
  Y_OFFSET: 2,
};

export const UI_POSITIONS = {
  FOLDER_SIZE_HEADER: { x: -1, y: 7 }, // x is calculated in controller
  INITIAL: { x: 0, y: 0 },
  VERSION: { x: 38, y: 5 },
  DRY_RUN_NOTICE: { x: 1, y: 6 },
  NEW_UPDATE_FOUND: { x: 42, y: 0 },
  SPACE_RELEASED: { x: 50, y: 3 },
  STATUS: { x: 50, y: 4 },
  STATUS_BAR: { x: 50, y: 5 },
  PENDING_TASKS: { x: 50, y: 6 }, //Starting position. It will then be replaced.
  TOTAL_SPACE: { x: 50, y: 2 },
  ERRORS_COUNT: { x: 50, y: 1 },
  TUTORIAL_TIP: { x: 1, y: 7 },
  WARNINGS: { x: 0, y: 9 },
};

// export const VALID_KEYS: string[] = [
//   'up', // Move up
//   'down', // Move down
//   'space', // Delete
//   'j', // Move down
//   'k', // Move up
//   'h', // Move page down
//   'l', // Move page up
//   'u', // Move page up
//   'd', // Move page down
//   'pageup',
//   'pagedown',
//   'home', // Move to the first result
//   'end', // Move to the last result
//   'e', // Show errors
// ];

export const BANNER = `-----                    __   .__.__  .__
-           ____ ______ |  | _|__|  | |  |
------     /    \\\\____ \\|  |/ /  |  | |  |
----      |   |  \\  |_> >    <|  |  |_|  |__
--        |___|  /   __/|__|_ \\__|____/____/
-------        \\/|__|        \\/
`;

export const STREAM_ENCODING = 'utf8';
