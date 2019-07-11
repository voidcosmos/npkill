export const OPTIONS = [
  {
    ARG: ['-h', '--help', '?'],
    NAME: 'help',
    DESCRIPTION: 'Show this help page, with all options.',
  },
  {
    ARG: ['-r', '--root'],
    NAME: 'root',
    DESCRIPTION:
      'Set the root directory from which to start searching. By default, the root is the directory from which this command is executed.',
  },
  {
    ARG: ['-f', '--full'],
    NAME: 'full',
    DESCRIPTION:
      'Start searching from the highest level of the system (example: "/" in linux).',
  },
  {
    ARG: ['-D', '--delete-all'],
    NAME: 'delete-all',
    DESCRIPTION:
      'Automatically delete all node_modules folders that are found.',
  },
];
