export interface IKeysCommand {
  up: () => void;
  down: () => void;
  space: () => void;
  execute: (command: string, params?: string[]) => number;
}
