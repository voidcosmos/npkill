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
  '$RECYCLE.BIN',
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
  '.volta',
  '.bun',

  // IDEs
  '.vscode',
  '.vscode-server',
  '.idea',
  '.vs',
  '.settings',

  // Dependencies and environments
  'node_modules',
  '__pycache__',
  '.cache',
  '.venv',
  'venv',
]);
