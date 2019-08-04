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
    description:
      'It shows a brief error message in the lower part in case one occurred.',
    name: 'show-errors',
  },
];
