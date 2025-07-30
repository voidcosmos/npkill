import { ICliOptions } from '../cli/interfaces/index.js';
import colors from 'colors';

export const OPTIONS: ICliOptions[] = [
  {
    arg: ['-c', '--bg-color'],
    description:
      'Change row highlight color. Available colors are: blue, cyan, magenta, red, white and yellow. Default is blue.',
    name: 'bg-color',
  },
  {
    arg: ['-d', '--directory'],
    description:
      'Set directory from which to start searching. By default, starting-point is .',
    name: 'directory',
  },
  {
    arg: ['-D', '--delete-all'],
    description: 'Auto-delete all target folders that are found.',
    name: 'delete-all',
  },
  {
    arg: ['-y'],
    description: 'Avoid displaying a warning when executing --delete-all.',
    name: 'yes',
  },
  {
    arg: ['-e', '--hide-errors'],
    description: 'Hide errors if any.',
    name: 'hide-errors',
  },
  {
    arg: ['-E', '--exclude'],
    description:
      'Exclude directories from search (directory list must be inside double quotes "", each directory separated by "," ) Example: "ignore1, ignore2"',
    name: 'exclude',
  },
  {
    arg: ['-f', '--full'],
    description:
      'Start searching from the home of the user (example: "/home/user" in linux).',
    name: 'full-scan',
  },
  {
    arg: ['-gb'],
    description: 'Show folder size in Gigabytes',
    name: 'gb',
  },
  {
    arg: ['-h', '--help', '?'],
    description: 'Show this help page, with all options.',
    name: 'help',
  },
  {
    arg: ['-nu', '--no-check-update'],
    description: 'Dont check for updates on startup.',
    name: 'no-check-updates',
  },
  {
    arg: ['-s', '--sort'],
    description:
      'Sort results by: size, path or last-mod (last time the most recent file was modified in the workspace)',
    name: 'sort-by',
  },
  {
    arg: ['-t', '--target'],
    description:
      // eslint-disable-next-line quotes
      "Specify the name of the directories you want to search for (by default, it's 'node_modules'). You can define multiple targets separating with comma. Ej. `-t node_modules,.cache,`.",
    name: 'target-folder',
  },
  {
    arg: ['-x', '--exclude-hidden-directories'],
    description: 'Exclude hidden directories ("dot" directories) from search.',
    name: 'exclude-hidden-directories',
  },
  {
    arg: ['--dry-run'],
    description:
      'It does not delete anything (will simulate it with a random delay).',
    name: 'dry-run',
  },
  {
    arg: ['-v', '--version'],
    description: 'Show version.',
    name: 'version',
  },
];

export const HELP_HEADER = `This tool allows you to list any node_modules directories in your system, as well as the space they take up. You can then select which ones you want to erase to free up space.
 ┌------ CONTROLS --------------------
 🭲 SPACE, DEL:            delete selected result
 🭲 Cursor UP, k:          move up
 🭲 Cursor DOWN, j:        move down
 🭲 h, d, Ctrl+d, PgUp:    move one page down
 🭲 l, u, Ctrl+u, PgDown:  move one page up
 🭲 home, end:             move to the first and last result
 🭲 o:                     open the parent directory of the selected result
 🭲 e:                     show errors popup, next page`;

export const HELP_PROGRESSBAR = ` ------- PROGRESS BAR --------------------
 The progress bar provides information on the search process. It has 3 parts differentiated by colors.

    ┌ (green) Results ready (stats calculated).
    🭲     ┌ (white) Directories examined.
    🭲     🭲      ┌ (gray) Directories pending to be analyzed.
 ${colors.green('▀▀▀▀▀▀▀')}${colors.white('▀▀▀▀')}${colors.gray('▀▀▀▀▀▀▀▀▀▀▀')}
`;

export const HELP_FOOTER =
  'Not all node_modules are bad! Some applications (like vscode, Discord, etc) need those dependencies to work. If their directory is deleted, the application will probably break (until the dependencies are reinstalled). NPKILL will show you these directories by highlighting them ⚠️';

export const COLORS = {
  red: 'bgRed',
  green: 'bgGreen',
  yellow: 'bgYellow',
  blue: 'bgBlue',
  magenta: 'bgMagenta',
  cyan: 'bgCyan',
  white: 'bgWhite',
};
