import { IuiPosition } from '../interfaces/ui-positions.interface';

export const TARGET_FOLDER = 'node_modules';
//export const ROW_SEARCHING_FOLDER = 7;
export const MIN_CLI_COLUMNS_SIZE = 60;
export const CURSOR_SIMBOL = '~>';
export const WIDTH_OVERFLOW = '...';
export const DEFAULT_SIZE = '0 mb';
export const OVERFLOW_CUT_FROM = 8;

export const DEFAULT_CONFIG = {
  deleteAll: false,
};

export const MARGINS = {
  ROW_RESULTS_START: 8,
  FOLDER_SIZE_COLUMN: 10,
  FOLDER_COLUMN_START: 3,
  FOLDER_COLUMN_END: 16,
};

export const UI_HELP = {
  Y_OFFSET: 2,
  X_COMMAND_OFFSET: 3,
  X_DESCRIPTION_OFFSET: 25,
};

export const UI_POSITIONS: IuiPosition = {
  INITIAL: { x: 0, y: 0 },
  TUTORIAL_TIP: { x: 4, y: 7 },
  TOTAL_SPACE: { x: 50, y: 3 },
  SPACE_RELEASED: { x: 50, y: 4 },
  FOLDER_SIZE_HEADER: { x: -1, y: 7 }, //x is calculated in controller
};

export const VALID_KEYS: Array<string> = ['up', 'down', 'delete', 'c'];

export const BANNER = `-----                    __   .__.__  .__   
-           ____ ______ |  | _|__|  | |  |  
------     /    \\\\____ \\|  |/ /  |  | |  |  
----      |   |  \\  |_> >    <|  |  |_|  |__
--        |___|  /   __/|__|_ \\__|____/____/
-------        \\/|__|        \\/                     
`;
