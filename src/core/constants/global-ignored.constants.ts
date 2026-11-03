/*
These directories will always be excluded during the search.
However, if the name matches a target, it will be displayed as a result.
This way, we avoid entering directories where we know we won't find what we need.
*/

export const GLOBAL_IGNORE = new Set([
  // Version controls
  '.git',
  '.svn',
  '.hg',
  '.fossil',

  // System folders
  '.Trash',
  '.Trashes',
  'System Volume Information',
  '.Spotlight-V100',
  '.fseventsd',

  // Tools and environment
  '.nvm',
  '.rvm',
  '.rustup',
  '.pyenv',
  '.rbenv',
  '.asdf',
  '.deno',

  // IDEs
  '.vscode',
  '.idea',
  '.vs',
  '.settings',

  // Other
  'snap',
  '.flatpak-info',

  //Heavy
  'node_modules',
  '__pycache__',
  'target',
  'build',
  'dist',
  '.cache',
  '.venv',
  'venv',
]);
