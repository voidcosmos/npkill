export const OPTIONS = [
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
    name: 'full',
    description:
      'Start searching from the highest level of the system (example: "/" in linux).',
  },
  {
    arg: ['-D', '--delete-all'],
    name: 'delete-all',
    description:
      'Automatically delete all node_modules folders that are found.',
  },
];
