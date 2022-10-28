import { IConfig, IUiPosition } from '../interfaces/index.js';

export const MIN_CLI_COLUMNS_SIZE = 60;
export const CURSOR_SIMBOL = '~>';
export const WIDTH_OVERFLOW = '...';
export const DEFAULT_SIZE = '0 MB';
export const DECIMALS_SIZE = 2;
export const OVERFLOW_CUT_FROM = 11;

export const DEFAULT_CONFIG: IConfig = {
  backgroundColor: 'bgBlue',
  warningColor: 'brightYellow',
  checkUpdates: true,
  deleteAll: false,
  exclude: [],
  excludeHiddenDirectories: false,
  folderSizeInGB: false,
  maxSimultaneousSearch: 6,
  showErrors: false,
  sortBy: '',
  targetFolder: 'node_modules',
};

export const MARGINS = {
  FOLDER_COLUMN_END: 19,
  FOLDER_COLUMN_START: 2,
  FOLDER_SIZE_COLUMN: 10,
  ROW_RESULTS_START: 8,
};

export const UI_HELP = {
  X_COMMAND_OFFSET: 3,
  X_DESCRIPTION_OFFSET: 27,
  Y_OFFSET: 2,
};

export const UI_POSITIONS: IUiPosition = {
  FOLDER_SIZE_HEADER: { x: -1, y: 7 }, // x is calculated in controller
  INITIAL: { x: 0, y: 0 },
  NEW_UPDATE_FOUND: { x: 42, y: 0 },
  SPACE_RELEASED: { x: 50, y: 4 },
  STATUS: { x: 50, y: 5 },
  TOTAL_SPACE: { x: 50, y: 3 },
  TUTORIAL_TIP: { x: 4, y: 7 },
};

export const VALID_KEYS: string[] = [
  'up', // Move up
  'down', // Move down
  'space', // Delete
  'j', // Move down
  'k', // Move up
  'h', // Move page down
  'l', // Move page up
  'u', // Move page up
  'd', // Move page down
  'pageup',
  'pagedown',
  'home', // Move to the first result
  'end', // Move to the last result
];

export const BANNER = `-----                    __   .__.__  .__
-           ____ ______ |  | _|__|  | |  |
------     /    \\\\____ \\|  |/ /  |  | |  |
----      |   |  \\  |_> >    <|  |  |_|  |__
--        |___|  /   __/|__|_ \\__|____/____/
-------        \\/|__|        \\/
`;

export const STREAM_ENCODING = 'utf8';
