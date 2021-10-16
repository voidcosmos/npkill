import { ICliOptions } from '@core/interfaces';

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
    arg: ['-tr', '--trash'],
    description: 'Move files to system trash dir instead of deleting directly.',
    name: 'trash',
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

export const HELP_WARNING =
  'Not all node_modules are bad! Some applications (like vscode, Discord, etc) need those dependencies to work. If their directory is deleted, the application will probably break (until the dependencies are reinstalled). NPKILL will show you these directories by highlighting them ⚠️';

export const COLORS = {
  cyan: 'bgCyan',
  magenta: 'bgMagenta',
  red: 'bgRed',
  white: 'bgWhite',
  yellow: 'bgYellow',
};
