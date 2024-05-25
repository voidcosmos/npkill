export const HELP_MSGS = {
  BASIC_USAGE: '> CURSORS for select; SPACE to delete <',
};

export const INFO_MSGS = {
  DELETED_FOLDER: '[DELETED] ',
  DELETING_FOLDER: '[..deleting..] ',
  ERROR_DELETING_FOLDER: '[ ERROR ] ',

  DISABLED:
    '[-D, --delete-all] option has been disabled until future versions. ' +
    'Please restart npkill without this option.',
  HEADER_COLUMNS: 'Last_mod   Size',
  HELP_TITLE: ' NPKILL HELP ',
  MIN_CLI_CLOMUNS:
    'Oh no! The terminal is too narrow. Please, ' +
    'enlarge it (This will be fixed in future versions. Disclose the inconveniences)',
  NEW_UPDATE_FOUND: 'New version found! npm i -g npkill for update.',
  NO_TTY:
    'Oh no! Npkill does not support this terminal (TTY is required). This ' +
    'is a bug, which has to be fixed. Please try another command interpreter ' +
    '(for example, CMD in windows)',
  NO_VALID_SORT_NAME: 'Invalid sort option. Available: path | size | last-mod',
  STARTING: 'Initializing ',
  SEARCHING: 'Searching ',
  CALCULATING_STATS: 'Calculating stats ',
  FATAL_ERROR: 'Fatal error ',
  SEARCH_COMPLETED: 'Search completed ',
  SPACE_RELEASED: 'Space saved: ',
  TOTAL_SPACE: 'Releasable space: ',
};

export const ERROR_MSG = {
  CANT_DELETE_FOLDER:
    'The directory cannot be deleted. Do you have permission?',
  CANT_GET_REMOTE_VERSION: 'Couldnt check for updates',
};
