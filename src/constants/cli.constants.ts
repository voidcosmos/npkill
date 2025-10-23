import { ICliOptions } from '../cli/interfaces/index.js';
import pc from 'picocolors';

export const OPTIONS: ICliOptions[] = [
  {
    arg: ['-p', '--profiles'],
    description:
      'Specifies profiles (presets) of folders to search, separated by commas (e.g., `-p python,java`, `-p all`). If used without a value, lists the available profiles. Default: `node`.',
    name: 'profiles',
  },
  {
    arg: ['--config'],
    description:
      'Path to a custom .npkillrc configuration file. By default, npkill looks for ~/.npkillrc.',
    name: 'config',
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
    arg: ['-s', '--size-unit'],
    description:
      'Set the unit for displaying folder sizes. Options: auto (default), mb, gb. With auto, sizes < 1024MB are shown in MB, larger sizes in GB.',
    name: 'size-unit',
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
      'Specify the name of the directories you want to search for. You can define multiple targets separating with comma. Ej. `-t node_modules,.cache`.',
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
    arg: ['--json-stream'],
    description: 'Output results in a stream JSON format.',
    name: 'jsonStream',
  },
  {
    arg: ['--json'],
    description: 'Output results in a JSON format.',
    name: 'jsonSimple',
  },
  {
    arg: ['-v', '--version'],
    description: 'Show version.',
    name: 'version',
  },
];

const getHeader = (title: string) => {
  return pc.black(pc.bgYellow(pc.bold(` ${title} `)));
};

export const HELP_HEADER = `Npkill helps you find and manage “junk” directories left behind by development tools.
These folders are essential while you’re actively working on a project, but over time they pile up, eating tons of space long after you’ve moved on.
Npkill scans your directories, lists these directories with their sizes, and shows when you last touched each project, so you can quickly decide what to keep and what to clean. Easy!

${getHeader('How to interact')}
 ${pc.green('SPACE / DEL')}             Delete selected result.
 ${pc.green('↑ / k')}                   Move up.
 ${pc.green('↓ / j')}                   Move down.
 ${pc.green('→ / ←')}                   Switch between panels.
 ${pc.green('t')}                       Multi-selection mode.
 ${pc.green('PgUp / Ctrl+u / u / h')}   Move one page up.
 ${pc.green('PgDown / Ctrl+d / d / l')} Move one page down.
 ${pc.green('Home, End')}               Jump to first / last result.
 ${pc.green('o')}                       Open the parent directory.
 ${pc.green('e')}                       Show errors.
 ${pc.green('q')}                       Quit.`;

export const HELP_PROGRESSBAR = `${getHeader('Header information')}
${pc.green('Potential space')}: The total size of all detected directories. Not everything needs to be deleted. This represents the maximum possible space you could free.
${pc.green('Freed space')}: The space actually recovered in this session.

The progress bar provides information on the search process. It has 3 parts differentiated by colors.

 (green) Results ready (stats calculated).
    🭲  (white) Directories examined.
    🭲     🭲     ┌ (gray) Directories pending to be analyzed.
 ${pc.green('▀▀▀▀▀▀▀')}${pc.white('▀▀▀▀')}${pc.gray('▀▀▀▀▀▀▀▀▀▀▀')}

The header will also display other relevant contextual information, such as when selection mode is activated or npkill is started in "dry-run mode".
`;

export const HELP_FOOTER = `${getHeader('Important note')}
${pc.bold('Not all results listed are bad!')} Some applications (like vscode, Discord, etc) need those dependencies to work. If their directory is deleted, the application will probably break (until the dependencies are reinstalled). NPKILL will try to show you these results by highlighting them ⚠️.`;

export const COLORS = {
  red: 'bgRed',
  green: 'bgGreen',
  yellow: 'bgYellow',
  blue: 'bgBlue',
  magenta: 'bgMagenta',
  cyan: 'bgCyan',
  white: 'bgWhite',
};
