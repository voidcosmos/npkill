export const HELP_MSGS = {
  BASIC_USAGE: '> select with CURSORS and press SPACE key to delete <',
};

export const INFO_MSGS = {
  DELETED_FOLDER: '[DELETED] ',
  DELETING_FOLDER: '[..deleting..] ',
  ERROR_DELETING_FOLDER: '[ ERROR ] ',

  DISABLED:
    '[-D, --delete-all] option has been disabled until future versions. Please restart npkill without this option.',
  HEADER_SIZE_COLUMN: 'folder size',
  HELP_TITLE: ' NPKILL HELP ',
  MIN_CLI_CLOMUNS:
    'Oh no! The terminal is too narrow. Please, ' +
    'enlarge it (This will be fixed in future versions. Disclose the inconveniences)',
  NEW_UPDATE_FOUND: 'New version found! npm i -g npkill for update.',
  NO_TTY:
    // tslint:disable-next-line: max-line-length
    'Oh no! Npkill does not support this terminal (TTY is required). This is a bug, which has to be fixed. Please try another command interpreter (for example, CMD in windows)',
  NO_VALID_SORT_NAME: 'Invalid sort option. Available: path | size',
  SEARCHING: 'searching ',
  SEARCH_COMPLETED: 'search completed ',
  SPACE_RELEASED: 'space saved: ',
  TOTAL_SPACE: 'releasable space: ',
};

export const ERROR_MSG = {
  CANT_DELETE_FOLDER:
    'The directory cannot be deleted. Do you have permission?',
  CANT_GET_REMOTE_VERSION: 'Couldnt check for updates',
};
