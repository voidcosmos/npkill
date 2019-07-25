export interface IKeysCommand {
  up: () => void;
  down: () => void;
  delete: () => void;
  execute: (command: string, params?: string[]) => number;
}
