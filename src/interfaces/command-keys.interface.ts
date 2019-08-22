export interface IKeysCommand {
  up: () => void;
  down: () => void;
  space: () => void;
  j: () => void;
  k: () => void;
  execute: (command: string, params?: string[]) => number;
}
