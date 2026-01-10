export const MENU_BAR = {
  HELP: 'Help',
  OPTIONS: 'Options',
  DELETE: 'Delete',
  INFO: 'Info',
};

export const INFO_MSGS = {
  DELETED_FOLDER: '[DELETED] ',
  DELETING_FOLDER: '[..deleting..] ',
  ERROR_DELETING_FOLDER: '[ ERROR ] ',
  HEADER_COLUMNS: 'Age    Size', // Δ (delta) for last_mod/age?
  HELP_TITLE: ' NPKILL HELP ',
  MIN_CLI_CLOMUNS:
    'Oh no! The terminal is too narrow. Please, ' +
    'enlarge it (This will be fixed in future versions. Disclose the inconveniences)',
  NEW_UPDATE_FOUND: 'New version found! npm i -g npkill for update.',
  NO_VALID_SORT_NAME: 'Invalid sort option. Available: path | size | last-mod',
  NO_VALID_SIZE_UNIT: 'Invalid size-unit option. Available: auto | mb | gb',
  STARTING: 'Initializing ',
  SEARCHING: 'Searching ',
  CALCULATING_STATS: 'Calculating stats ',
  FATAL_ERROR: 'Fatal error ',
  SEARCH_COMPLETED: 'Search completed ',
  SPACE_RELEASED: 'Space saved: ',
  TOTAL_SPACE: 'Releasable space: ',
  DRY_RUN: 'Dry run mode',
  DELETE_ALL_WARNING:
    '    --delete-all may have undesirable effects and\n' +
    '    delete dependencies needed by some applications.\n' +
    '    Recommended to use -x and preview with --dry-run.\n\n' +
    '                 Press y to continue.\n\n' +
    '           pass -y to not show this next time',
};

export const ERROR_MSG = {
  CANT_DELETE_FOLDER:
    'The directory cannot be deleted. Do you have permission?',
  CANT_GET_REMOTE_VERSION: 'Couldnt check for updates',
  CANT_USE_BOTH_JSON_OPTIONS:
    'Cannot use both --json and --json-stream options simultaneously.',
};
