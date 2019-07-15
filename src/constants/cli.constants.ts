import { CliOptions } from '../interfaces/cli-options.interface';

export const OPTIONS: Array<CliOptions> = [
  {
    arg: ['-h', '--help', '?'],
    name: 'help',
    description: 'Show this help page, with all options.',
  },
  {
    arg: ['-r', '--root'],
    name: 'root',
    description:
      'Set the root directory from which to start searching. By default, the root is the directory from which this command is executed.',
  },
  {
    arg: ['-f', '--full'],
    name: 'full-scan',
    description:
      'Start searching from the home of the user (example: "/home/user" in linux).',
  },
  {
    arg: ['-D', '--delete-all'],
    name: 'delete-all',
    description:
      'Automatically delete all node_modules folders that are found.',
  },
  {
    arg: ['-e', '--show-errors'],
    name: 'show-errors',
    description:
      'It shows a brief error message in the lower part in case one occurred.',
  },
];
