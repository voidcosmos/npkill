import { ICliOptions } from '../interfaces/cli-options.interface';

export const OPTIONS: ICliOptions[] = [
  {
    arg: ['-h', '--help', '?'],
    description: 'Show this help page, with all options.',
    name: 'help',
  },
  {
    arg: ['-v', '--version'],
    description: 'Show version.',
    name: 'version',
  },
  {
    arg: ['-d', '--directory'],
    description:
      'Set directory from which to start searching. By default, starting-point is .',
    name: 'directory',
  },
  {
    arg: ['-f', '--full'],
    description:
      'Start searching from the home of the user (example: "/home/user" in linux).',
    name: 'full-scan',
  },
  {
    arg: ['-D', '--delete-all'],
    description:
      'Automatically delete all node_modules folders that are found.',
    name: 'delete-all',
  },
  {
    arg: ['-e', '--show-errors'],
    description: 'Show error messages if any.',
    name: 'show-errors',
  },
  {
    arg: ['-c', '--bg-color'],
    description:
      'Change row highlight color. Available colors are: blue, cyan, magenta, red, white and yellow. Default is blue.',
    name: 'bg-color',
  },
];

export const COLORS = {
  blue: 'bgBlack',
  cyan: 'bgCyan',
  magenta: 'bgMagenta',
  red: 'bgRed',
  white: 'bgWhite',
  yellow: 'bgYellow',
};
