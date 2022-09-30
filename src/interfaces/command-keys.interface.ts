export interface IKeysCommand {
  up: () => void;
  down: () => void;
  space: () => void;
  j: () => void;
  k: () => void;
  h: () => void;
  l: () => void;
  d: () => void;
  u: () => void;
  execute: (command: string, params?: string[]) => number;
}
