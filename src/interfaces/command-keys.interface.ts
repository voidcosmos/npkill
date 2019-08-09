export interface IKeysCommand {
  up: () => void;
  down: () => void;
  delete: () => void;
  backspace: () => void;
  execute: (command: string, params?: string[]) => number;
}
