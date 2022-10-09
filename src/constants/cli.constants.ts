import { ICliOptions } from '../interfaces/index.js';

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
    description:
      'CURRENTLY DISABLED. Automatically delete all node_modules folders that are found.',
    name: 'delete-all',
  },
  {
    arg: ['-e', '--show-errors'],
    description: 'Show error messages if any.',
    name: 'show-errors',
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
    description: 'Sort results by: size or path',
    name: 'sort-by',
  },
  {
    arg: ['-t', '--target'],
    description:
      "Specify the name of the directory you want to search for (by default, it's node_modules)",
    name: 'target-folder',
  },
  {
    arg: ['-v', '--version'],
    description: 'Show version.',
    name: 'version',
  },
];

export const HELP_HEADER = `This tool allows you to list any node_modules directories in your system, as well as the space they take up. You can then select which ones you want to erase to free up space.
 ┌------ CONTROLS --------------------
 | SPACE:          delete selected result
 | Cursor UP, k:   move up
 | Cursor DOWN, j: move down
 | h, d, Ctrl+d:   move one page down
 | l, u, Ctrl+u:   move one page up`;

export const HELP_FOOTER =
  'Not all node_modules are bad! Some applications (like vscode, Discord, etc) need those dependencies to work. If their directory is deleted, the application will probably break (until the dependencies are reinstalled). NPKILL will show you these directories by highlighting them ⚠️';

export const COLORS = {
  cyan: 'bgCyan',
  magenta: 'bgMagenta',
  red: 'bgRed',
  white: 'bgWhite',
  yellow: 'bgYellow',
};
